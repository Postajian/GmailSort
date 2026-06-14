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

function fetchBuffer(url) {
  return fetch(url, { credentials: 'omit' }).then(function (response) {
    if (!response.ok) return null;
    return response.blob().then(function (blob) {
      if (!blob || blob.size < 70) return null; // empty / 1px tracker = not a usable icon
      return blob.arrayBuffer().then(function (buffer) {
        return { buffer: buffer, type: blob.type || 'image/png' };
      });
    });
  }).catch(function () {
    return null;
  });
}

function googleFaviconUrl(domain) {
  return 'https://www.google.com/s2/favicons?sz=64&domain=' + encodeURIComponent(domain);
}

function ensureGlobeSignature() {
  if (globeSignature !== null) return Promise.resolve();
  return fetchBuffer(googleFaviconUrl(GLOBE_PROBE_DOMAIN)).then(function (probe) {
    globeSignature = probe ? bufferSignature(probe.buffer) : '';
  });
}

function resolveLogo(domain) {
  if (cache[domain]) return Promise.resolve(cache[domain]);
  if (inFlight[domain]) return inFlight[domain];

  var work = fetchBuffer('https://logo.clearbit.com/' + encodeURIComponent(domain) + '?size=64')
    .then(function (clearbit) {
      if (clearbit) {
        return { dataUrl: bufferToDataUrl(clearbit.buffer, clearbit.type) };
      }
      return ensureGlobeSignature().then(function () {
        return fetchBuffer(googleFaviconUrl(domain)).then(function (favicon) {
          if (favicon && bufferSignature(favicon.buffer) !== globeSignature) {
            return { dataUrl: bufferToDataUrl(favicon.buffer, favicon.type) };
          }
          return { none: true };
        });
      });
    })
    .catch(function () {
      return { none: true };
    })
    .then(function (result) {
      cache[domain] = result;
      delete inFlight[domain];
      return result;
    });

  inFlight[domain] = work;
  return work;
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== 'gvn-logo' || !message.domain) return false;
  resolveLogo(String(message.domain)).then(sendResponse, function () {
    sendResponse({ none: true });
  });
  return true; // keep the message channel open for the async response
});
