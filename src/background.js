'use strict';

// Logo resolver service worker.
//
// Resolves the best icon for a sender's domain and hands a ready-to-use data URL
// back to the content script. It runs here (not in the content script) because the
// extension's host_permissions let the service worker fetch cross-origin without
// being blocked by Gmail's page CORS/CSP. The order is:
//   1. Clearbit  -> the real company brand logo, when one exists
//   2. Google favicon -> the site's real favicon, skipping Google's default globe
//   3. {none:true} -> caller draws a clean coloured letter tile (never a globe)
//
// Privacy: this sends the sender's *domain* (e.g. "github.com") to Clearbit and
// Google to look up an icon. It is gated by the richLogos setting in the UI, and
// results are cached per domain so each domain is looked up at most once.

var cache = {};         // domain -> { dataUrl } | { none: true }
var inFlight = {};      // domain -> Promise (de-dupe concurrent lookups)
var globeSignature = null;
var GLOBE_PROBE_DOMAIN = 'no-such-site-zzqx.invalid';
var LOGO_STORE_KEY = 'gmailViewNextLogoCache';
var MAX_CACHED_LOGOS = 600;
var hydrated = false;
var persistScheduled = false;

function bufferSignature(buffer) {
  var bytes = new Uint8Array(buffer);
  var hash = 0;
  for (var i = 0; i < bytes.length; i++) {
    hash = (hash * 31 + bytes[i]) >>> 0;
  }
  return bytes.length + ':' + hash;
}

function bufferToDataUrl(buffer, type) {
  var bytes = new Uint8Array(buffer);
  var binary = '';
  var chunk = 0x8000;
  for (var i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, Math.min(i + chunk, bytes.length))
    );
  }
  return 'data:' + (type || 'image/png') + ';base64,' + btoa(binary);
}

// Returns one of:
//   { ok: true, buffer, type } - a usable image
//   { ok: false }              - reached the server but no usable image (e.g. 404)
//   { error: true }            - could NOT reach it (network / missing permission)
// The error case matters: the caller keeps the plain favicon instead of giving up.
function fetchBuffer(url) {
  return fetch(url, { credentials: 'omit' }).then(function (response) {
    if (!response.ok) return { ok: false };
    return response.blob().then(function (blob) {
      if (!blob || blob.size < 70) return { ok: false }; // empty / 1px tracker
      return blob.arrayBuffer().then(function (buffer) {
        return { ok: true, buffer: buffer, type: blob.type || 'image/png' };
      });
    });
  }).catch(function () {
    return { error: true };
  });
}

function googleFaviconUrl(domain) {
  return 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(domain);
}

function ensureGlobeSignature() {
  if (globeSignature !== null) return Promise.resolve();
  return fetchBuffer(googleFaviconUrl(GLOBE_PROBE_DOMAIN)).then(function (probe) {
    globeSignature = probe && probe.ok ? bufferSignature(probe.buffer) : '';
  });
}

// Persist resolved logos so they survive service-worker restarts and browser
// reloads. Without this, MV3 recycles the worker after ~30s idle and every
// sender domain is re-fetched from the network on the next inbox load.
function hydrateCache() {
  if (hydrated) return Promise.resolve();
  return new Promise(function (resolve) {
    try {
      chrome.storage.local.get(LOGO_STORE_KEY, function (data) {
        var saved = data && data[LOGO_STORE_KEY];
        if (saved && typeof saved === 'object') {
          // Only restore REAL logos. "No logo" results are never persisted, so
          // those domains keep retrying live each session (clear logos, like
          // before) instead of being stuck on a letter tile forever.
          Object.keys(saved).forEach(function (domain) {
            if (!cache[domain] && saved[domain] && saved[domain].dataUrl) {
              cache[domain] = saved[domain];
            }
          });
        }
        hydrated = true;
        resolve();
      });
    } catch (e) {
      hydrated = true;
      resolve();
    }
  });
}

function persistCache() {
  persistScheduled = false;
  try {
    // Store ONLY real resolved logos, never "no logo" / error placeholders.
    var domains = Object.keys(cache).filter(function (domain) {
      return cache[domain] && cache[domain].dataUrl;
    });
    if (domains.length > MAX_CACHED_LOGOS) {
      // Soft cap: keep the most recently added entries, drop the oldest.
      domains = domains.slice(domains.length - MAX_CACHED_LOGOS);
    }
    var store = {};
    domains.forEach(function (domain) { store[domain] = cache[domain]; });
    var payload = {};
    payload[LOGO_STORE_KEY] = store;
    chrome.storage.local.set(payload);
  } catch (e) {
    // Storage unavailable/full: the in-memory cache still works this session.
  }
}

function schedulePersist() {
  if (persistScheduled) return;
  persistScheduled = true;
  setTimeout(persistCache, 800);
}

function resolveLogo(domain) {
  if (cache[domain]) return Promise.resolve(cache[domain]);
  if (inFlight[domain]) return inFlight[domain];

  var work = hydrateCache().then(function () {
    if (cache[domain]) return cache[domain]; // restored from a previous session
    return fetchBuffer('https://logo.clearbit.com/' + encodeURIComponent(domain) + '?size=64')
      .then(function (clearbit) {
        if (clearbit.error) return { error: true };
        if (clearbit.ok) return { dataUrl: bufferToDataUrl(clearbit.buffer, clearbit.type) };
        return ensureGlobeSignature().then(function () {
          return fetchBuffer(googleFaviconUrl(domain)).then(function (favicon) {
            if (favicon.error) return { error: true };
            if (favicon.ok && bufferSignature(favicon.buffer) !== globeSignature) {
              return { dataUrl: bufferToDataUrl(favicon.buffer, favicon.type) };
            }
            return { none: true };
          });
        });
      })
      .catch(function () {
        return { error: true };
      });
  }).then(function (result) {
    // Cache real answers; never cache an error so it retries once reachable.
    // Persist only when we found an actual logo, so "no logo" stays a
    // session-only retry (restored live next session) and never sticks.
    if (!result.error && !cache[domain]) {
      cache[domain] = result;
      if (result.dataUrl) schedulePersist();
    }
    delete inFlight[domain];
    return result;
  });

  inFlight[domain] = work;
  return work;
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== 'gvn-logo' || !message.domain) return false;
  resolveLogo(String(message.domain)).then(sendResponse, function () {
    sendResponse({ error: true });
  });
  return true; // keep the message channel open for the async response
});

// Clicking the toolbar icon opens the settings page.
if (chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener(function () {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  });
}

// Warm the cache from previous sessions as soon as the worker spins up.
hydrateCache();
