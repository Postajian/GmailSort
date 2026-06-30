(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GmailViewNextCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;
  var LAYOUT_VERSION = 15;
  var TRIAL_DAYS = 15;
  var DEFAULT_SETTINGS = Object.freeze({
    enabled: true,
    masthead: 'INBOX',
    hideTabs: false,
    hideRail: true,
    colorLabels: true,
    showSenderMarks: true,
    richLogos: true,
    debugTools: false,
    unreadEmphasis: true,
    groupUnreadCounts: true,
    showDigest: false,
    showStats: false,
    groupByDomain: false,
    mergeTabsRow: true,
    hideTabPromotions: false,
    hideTabSocial: false,
    hideTabUpdates: false,
    hideTabForums: false,
    focusMode: false,
    tabOrder: 'promotions-first',
    toggleHotkey: true,
    umbrellaRollup: true,
    transparentBackground: true,
    readablePanel: true,
    sidebarWidth: 0,
    editorScale: 0.6,
    labelFontSize: 18,
    sortLabelsByActivity: false,
    rowHeight: 38,
    density: 'comfortable',
    theme: 'light',
    inboxFontSize: 24,
    inboxBold: true,
    inboxItalic: false,
    inboxLetterSpacing: 6.16,
    inboxWordSpacing: 0,
    inboxOffset: 0,
    senderFontSize: 14,
    senderBold: false,
    senderItalic: false,
    senderLetterSpacing: 0,
    senderWordSpacing: 0,
    senderTextGap: 20,
    groupFontSize: 15,
    groupBold: true,
    groupItalic: false,
    groupLetterSpacing: 2.4,
    groupWordSpacing: 0,
    groupTextGap: 20,
    groupLineGapTop: 9,
    groupLineGapBottom: 14,
    logoSize: 22,
    logoBold: true,
    logoItalic: false,
    logoLetterSpacing: 0.5,
    logoWordSpacing: 0,
    logoTextGap: 20,
    subjectFontSize: 14,
    subjectBold: true,
    subjectItalic: false,
    subjectLetterSpacing: 0,
    subjectWordSpacing: 0,
    subjectTextGap: 20,
    previewFontSize: 14,
    previewBold: false,
    previewItalic: false,
    previewLetterSpacing: 0,
    previewWordSpacing: 0,
    previewTextGap: 20,
    dateFontSize: 14,
    dateBold: false,
    dateItalic: false,
    dateLetterSpacing: 0,
    dateWordSpacing: 0,
    dateTextGap: 20,
    senderWidth: 200,
    contentIndent: 148,
    senderOffset: 0,
    timeSentOffset: 0,
    logoOffset: 4,
    subjectGap: 30,
    subjectWidth: 493,
    previewOffset: 0,
    dateOffset: 0,
    rightInset: 79,
    headerSenderX: -1,
    headerTimeSentX: -1,
    headerLogoX: -1,
    headerSubjectX: -1,
    headerPreviewX: -1,
    headerDateX: -1
  });

  var CATEGORY_COLORS = Object.freeze({
    finance: '#238636',
    trading: '#16877a',
    work: '#2869b2',
    ventures: '#7a4fb3',
    shopping: '#d97706',
    tools: '#0f8b8d',
    subscriptions: '#65a30d',
    learning: '#4f46b5',
    news: '#c2413b',
    organizations: '#a16207',
    government: '#52606d',
    people: '#c24178',
    travel: '#147d92',
    events: '#9333a8',
    misc: '#667085',
    // User's own top-level label families (so each family shares one colour)
    money: '#238636',
    linkedin: '#0a66c2',
    newsletters: '#c2413b',
    booking: '#0e7490',
    domains: '#6d28d9',
    insurance: '#0f766e',
    school: '#4f46b5',
    swiss: '#dc2626',
    wifi: '#0891b2',
    social: '#1d9bf0',
    housing: '#92400e'
  });

  var MONTH_LABELS = Object.freeze([
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ]);

  var MONTHS = Object.freeze({
    jan: 0, january: 0, januar: 0,
    feb: 1, february: 1, februar: 1,
    mar: 2, march: 2, maerz: 2, marz: 2,
    apr: 3, april: 3,
    may: 4, mai: 4,
    jun: 5, june: 5, juni: 5,
    jul: 6, july: 6, juli: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9, okt: 9, oktober: 9,
    nov: 10, november: 10,
    dec: 11, december: 11, dez: 11, dezember: 11
  });

  function clampNumber(value, min, max, fallback) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizeBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function normalizeSettings(input) {
    var value = input || {};
    return {
      enabled: value.enabled !== false,
      masthead: typeof value.masthead === 'string'
        ? value.masthead.trim().slice(0, 24)
        : DEFAULT_SETTINGS.masthead,
      hideTabs: value.hideTabs === true,
      hideRail: value.hideRail !== false,
      colorLabels: value.colorLabels !== false,
      showSenderMarks: value.showSenderMarks !== false,
      richLogos: value.richLogos !== false,
      debugTools: value.debugTools === true,
      unreadEmphasis: value.unreadEmphasis !== false,
      groupUnreadCounts: value.groupUnreadCounts !== false,
      showDigest: value.showDigest === true,
      showStats: value.showStats === true,
      groupByDomain: value.groupByDomain === true,
      mergeTabsRow: value.mergeTabsRow !== false,
      hideTabPromotions: value.hideTabPromotions === true,
      hideTabSocial: value.hideTabSocial === true,
      hideTabUpdates: value.hideTabUpdates === true,
      hideTabForums: value.hideTabForums === true,
      focusMode: value.focusMode === true,
      tabOrder: (value.tabOrder === 'default' || value.tabOrder === 'promotions-first')
        ? value.tabOrder
        : DEFAULT_SETTINGS.tabOrder,
      toggleHotkey: value.toggleHotkey !== false,
      umbrellaRollup: value.umbrellaRollup !== false,
      transparentBackground: value.transparentBackground !== false,
      readablePanel: value.readablePanel !== false,
      sidebarWidth: clampNumber(value.sidebarWidth, 0, 720, DEFAULT_SETTINGS.sidebarWidth),
      editorScale: clampNumber(value.editorScale, 0.45, 1.25, DEFAULT_SETTINGS.editorScale),
      labelFontSize: clampNumber(value.labelFontSize, 10, 32, DEFAULT_SETTINGS.labelFontSize),
      sortLabelsByActivity:
        normalizeBoolean(value.sortLabelsByActivity, DEFAULT_SETTINGS.sortLabelsByActivity),
      rowHeight: clampNumber(value.rowHeight, 32, 72, DEFAULT_SETTINGS.rowHeight),
      density: value.density === 'compact' ? 'compact' : 'comfortable',
      theme: (value.theme === 'dark' || value.theme === 'sepia' || value.theme === 'contrast')
        ? value.theme
        : 'light',
      inboxFontSize: clampNumber(value.inboxFontSize, 8, 48, DEFAULT_SETTINGS.inboxFontSize),
      inboxBold: normalizeBoolean(value.inboxBold, DEFAULT_SETTINGS.inboxBold),
      inboxItalic: normalizeBoolean(value.inboxItalic, DEFAULT_SETTINGS.inboxItalic),
      inboxLetterSpacing: clampNumber(value.inboxLetterSpacing, 0, 16, DEFAULT_SETTINGS.inboxLetterSpacing),
      inboxWordSpacing: clampNumber(value.inboxWordSpacing, 0, 24, DEFAULT_SETTINGS.inboxWordSpacing),
      inboxOffset: clampNumber(value.inboxOffset, -10000, 10000, DEFAULT_SETTINGS.inboxOffset),
      senderFontSize: clampNumber(value.senderFontSize, 8, 40, DEFAULT_SETTINGS.senderFontSize),
      senderBold: normalizeBoolean(value.senderBold, DEFAULT_SETTINGS.senderBold),
      senderItalic: normalizeBoolean(value.senderItalic, DEFAULT_SETTINGS.senderItalic),
      senderLetterSpacing: clampNumber(value.senderLetterSpacing, 0, 12, DEFAULT_SETTINGS.senderLetterSpacing),
      senderWordSpacing: clampNumber(value.senderWordSpacing, 0, 24, DEFAULT_SETTINGS.senderWordSpacing),
      senderTextGap: clampNumber(value.senderTextGap, 0, 80, DEFAULT_SETTINGS.senderTextGap),
      groupFontSize: clampNumber(value.groupFontSize, 8, 40, DEFAULT_SETTINGS.groupFontSize),
      groupBold: normalizeBoolean(value.groupBold, DEFAULT_SETTINGS.groupBold),
      groupItalic: normalizeBoolean(value.groupItalic, DEFAULT_SETTINGS.groupItalic),
      groupLetterSpacing: clampNumber(value.groupLetterSpacing, 0, 12, DEFAULT_SETTINGS.groupLetterSpacing),
      groupWordSpacing: clampNumber(value.groupWordSpacing, 0, 24, DEFAULT_SETTINGS.groupWordSpacing),
      groupTextGap: clampNumber(value.groupTextGap, 0, 80, DEFAULT_SETTINGS.groupTextGap),
      groupLineGapTop: clampNumber(value.groupLineGapTop, 2, 40, DEFAULT_SETTINGS.groupLineGapTop),
      groupLineGapBottom: clampNumber(value.groupLineGapBottom, 2, 40, DEFAULT_SETTINGS.groupLineGapBottom),
      logoSize: clampNumber(value.logoSize, 10, 50, DEFAULT_SETTINGS.logoSize),
      logoBold: normalizeBoolean(value.logoBold, DEFAULT_SETTINGS.logoBold),
      logoItalic: normalizeBoolean(value.logoItalic, DEFAULT_SETTINGS.logoItalic),
      logoLetterSpacing: clampNumber(value.logoLetterSpacing, 0, 12, DEFAULT_SETTINGS.logoLetterSpacing),
      logoWordSpacing: clampNumber(value.logoWordSpacing, 0, 24, DEFAULT_SETTINGS.logoWordSpacing),
      logoTextGap: clampNumber(value.logoTextGap, 0, 80, DEFAULT_SETTINGS.logoTextGap),
      subjectFontSize: clampNumber(value.subjectFontSize, 8, 40, DEFAULT_SETTINGS.subjectFontSize),
      subjectBold: normalizeBoolean(value.subjectBold, DEFAULT_SETTINGS.subjectBold),
      subjectItalic: normalizeBoolean(value.subjectItalic, DEFAULT_SETTINGS.subjectItalic),
      subjectLetterSpacing: clampNumber(value.subjectLetterSpacing, 0, 12, DEFAULT_SETTINGS.subjectLetterSpacing),
      subjectWordSpacing: clampNumber(value.subjectWordSpacing, 0, 24, DEFAULT_SETTINGS.subjectWordSpacing),
      subjectTextGap: clampNumber(value.subjectTextGap, 0, 80, DEFAULT_SETTINGS.subjectTextGap),
      previewFontSize: clampNumber(value.previewFontSize, 8, 40, DEFAULT_SETTINGS.previewFontSize),
      previewBold: normalizeBoolean(value.previewBold, DEFAULT_SETTINGS.previewBold),
      previewItalic: normalizeBoolean(value.previewItalic, DEFAULT_SETTINGS.previewItalic),
      previewLetterSpacing: clampNumber(value.previewLetterSpacing, 0, 12, DEFAULT_SETTINGS.previewLetterSpacing),
      previewWordSpacing: clampNumber(value.previewWordSpacing, 0, 24, DEFAULT_SETTINGS.previewWordSpacing),
      previewTextGap: clampNumber(value.previewTextGap, 0, 80, DEFAULT_SETTINGS.previewTextGap),
      dateFontSize: clampNumber(value.dateFontSize, 8, 40, DEFAULT_SETTINGS.dateFontSize),
      dateBold: normalizeBoolean(value.dateBold, DEFAULT_SETTINGS.dateBold),
      dateItalic: normalizeBoolean(value.dateItalic, DEFAULT_SETTINGS.dateItalic),
      dateLetterSpacing: clampNumber(value.dateLetterSpacing, 0, 12, DEFAULT_SETTINGS.dateLetterSpacing),
      dateWordSpacing: clampNumber(value.dateWordSpacing, 0, 24, DEFAULT_SETTINGS.dateWordSpacing),
      dateTextGap: clampNumber(value.dateTextGap, 0, 80, DEFAULT_SETTINGS.dateTextGap),
      senderWidth: clampNumber(value.senderWidth, 160, 360, DEFAULT_SETTINGS.senderWidth),
      contentIndent: clampNumber(value.contentIndent, 80, 240, DEFAULT_SETTINGS.contentIndent),
      senderOffset: clampNumber(value.senderOffset, -10000, 10000, DEFAULT_SETTINGS.senderOffset),
      timeSentOffset: clampNumber(value.timeSentOffset, -10000, 10000, DEFAULT_SETTINGS.timeSentOffset),
      logoOffset: clampNumber(value.logoOffset, -10000, 10000, DEFAULT_SETTINGS.logoOffset),
      subjectGap: clampNumber(value.subjectGap, -10000, 10000, DEFAULT_SETTINGS.subjectGap),
      subjectWidth: clampNumber(value.subjectWidth, 280, 720, DEFAULT_SETTINGS.subjectWidth),
      previewOffset: clampNumber(value.previewOffset, -10000, 10000, DEFAULT_SETTINGS.previewOffset),
      dateOffset: clampNumber(value.dateOffset, -10000, 10000, DEFAULT_SETTINGS.dateOffset),
      rightInset: clampNumber(value.rightInset, 0, 240, DEFAULT_SETTINGS.rightInset),
      headerSenderX: clampNumber(value.headerSenderX, -1, 10000, DEFAULT_SETTINGS.headerSenderX),
      headerTimeSentX: clampNumber(value.headerTimeSentX, -1, 10000, DEFAULT_SETTINGS.headerTimeSentX),
      headerLogoX: clampNumber(value.headerLogoX, -1, 10000, DEFAULT_SETTINGS.headerLogoX),
      headerSubjectX: clampNumber(value.headerSubjectX, -1, 10000, DEFAULT_SETTINGS.headerSubjectX),
      headerPreviewX: clampNumber(value.headerPreviewX, -1, 10000, DEFAULT_SETTINGS.headerPreviewX),
      headerDateX: clampNumber(value.headerDateX, -1, 10000, DEFAULT_SETTINGS.headerDateX)
    };
  }

  function centeredLayoutSettings(input, availableWidth) {
    var width = clampNumber(availableWidth, 480, 4000, 1200);
    var next = Object.assign({}, normalizeSettings(input), {
      senderWidth: Math.round(Math.min(200, Math.max(160, width * 0.1))),
      contentIndent: Math.round(Math.min(148, Math.max(80, width * 0.065))),
      senderOffset: 0,
      timeSentOffset: 0,
      logoOffset: 4,
      subjectGap: 30,
      subjectWidth: Math.round(Math.min(493, Math.max(280, width * 0.24))),
      previewOffset: 0,
      dateOffset: 0,
      inboxOffset: 0,
      senderTextGap: 20,
      groupTextGap: 20,
      logoTextGap: 20,
      subjectTextGap: 20,
      previewTextGap: 20,
      dateTextGap: 20,
      rightInset: 16,
      headerSenderX: -1,
      headerTimeSentX: -1,
      headerLogoX: -1,
      headerSubjectX: -1,
      headerPreviewX: -1,
      headerDateX: -1
    });
    return normalizeSettings(next);
  }

  function routeMode(hash) {
    var route = String(hash || '').toLowerCase();
    if (!route || route.indexOf('#inbox') === 0) {
      var parts = route.split('/');
      var last = parts[parts.length - 1];
      if (parts.length > 1 && /^[a-z0-9_-]{12,}$/i.test(last)) return 'thread';
      return 'inbox';
    }
    return 'other';
  }

  function parseClock(value, now) {
    var match = String(value || '').trim().match(
      /^(\d{1,2}):(\d{2})(?:\s*([ap])\.?m\.?)?$/i
    );
    if (!match) return null;

    var hour = Number(match[1]);
    var minute = Number(match[2]);
    var meridiem = match[3] ? match[3].toLowerCase() : '';
    if (minute > 59 || hour > (meridiem ? 12 : 23)) return null;
    if (meridiem === 'p' && hour < 12) hour += 12;
    if (meridiem === 'a' && hour === 12) hour = 0;

    var result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    if (result.getTime() - now.getTime() > 5 * 60 * 1000) {
      result = new Date(result.getTime() - DAY_MS);
    }
    return result;
  }

  function parseShortDate(value, now) {
    var cleaned = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[.,]/g, '')
      .replace(/ä/g, 'a');
    var match = cleaned.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/);
    var monthName;
    var day;
    var explicitYear;
    if (match) {
      monthName = match[1];
      day = Number(match[2]);
      explicitYear = match[3] ? Number(match[3]) : null;
    } else {
      match = cleaned.match(/^(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?$/);
      if (!match) return null;
      day = Number(match[1]);
      monthName = match[2];
      explicitYear = match[3] ? Number(match[3]) : null;
    }
    if (MONTHS[monthName] === undefined || day < 1 || day > 31) return null;

    var year = explicitYear || now.getFullYear();
    var result = new Date(year, MONTHS[monthName], day, 12, 0, 0);
    if (!explicitYear && result.getTime() - now.getTime() > DAY_MS) {
      result.setFullYear(year - 1);
    }
    return result;
  }

  function parseGmailDate(candidates, nowValue) {
    var now = nowValue instanceof Date ? nowValue : new Date(nowValue || Date.now());
    var values = Array.isArray(candidates) ? candidates : [candidates];

    for (var i = 0; i < values.length; i++) {
      var raw = String(values[i] || '').trim();
      if (!raw) continue;

      var clock = parseClock(raw, now);
      if (clock) return clock;

      var shortDate = parseShortDate(raw, now);
      if (shortDate) return shortDate;

      var timestamp = Date.parse(raw);
      if (!Number.isNaN(timestamp)) return new Date(timestamp);
    }
    return null;
  }

  function groupForDate(dateValue, nowValue) {
    var now = nowValue instanceof Date ? nowValue : new Date(nowValue || Date.now());
    var date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'OLDER';

    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    var days = Math.max(0, Math.round((today.getTime() - messageDay.getTime()) / DAY_MS));
    if (days <= 1) return 'LAST 24 HOURS';
    if (days <= 3) return 'LAST 3 DAYS';
    if (days <= 7) return 'LAST 7 DAYS';
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    ) return 'THIS MONTH';
    return MONTH_LABELS[date.getMonth()] + ' ' + date.getFullYear();
  }

  function groupForCandidates(candidates, now) {
    var date = parseGmailDate(candidates, now);
    return date ? groupForDate(date, now) : 'OLDER';
  }

  function hashText(value) {
    var hash = 2166136261;
    var text = String(value || '');
    for (var i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function stableColor(value) {
    var hue = hashText(String(value || '').toLowerCase()) % 360;
    if (hue > 48 && hue < 68) hue += 42;
    return 'hsl(' + (hue % 360) + ' 58% 42%)';
  }

  function labelColor(name) {
    var normalized = String(name || '').trim().toLowerCase();
    var parent = normalized.split('/')[0];
    return CATEGORY_COLORS[parent] || stableColor(normalized);
  }

  function senderMonogram(name, email) {
    var cleanName = String(name || '').trim();
    var parts = cleanName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    var local = String(email || '').split('@')[0].replace(/[^a-z0-9]+/gi, ' ');
    var localParts = local.split(/\s+/).filter(Boolean);
    if (localParts.length) return localParts[0].slice(0, 2).toUpperCase();
    return '?';
  }

  // A label is a "sub-label" if its Gmail name is nested under a parent, i.e.
  // it contains a "/" (e.g. "Money/PayPal"). Top-level umbrella labels have none.
  function isSubLabel(name) {
    return typeof name === 'string' && name.indexOf('/') !== -1;
  }

  // Decode the label path from a Gmail location hash. Gmail encodes a nested
  // label's "/" as %2F and may append a "/pN" pagination suffix.
  //   "#label/Money"            -> "Money"
  //   "#label/Money%2FPayPal"   -> "Money/PayPal"
  //   "#label/Money%2FPayPal/p2"-> "Money/PayPal"
  // Returns "" for any non-label hash (inbox, search, category, thread, ...).
  function decodeLabelHash(hash) {
    var h = String(hash || '');
    var idx = h.indexOf('#label/');
    if (idx === -1) return '';
    var rest = h.slice(idx + 7).replace(/\/p\d+$/, '');
    if (!rest) return '';
    try {
      return decodeURIComponent(rest);
    } catch (e) {
      return rest;
    }
  }

  // Build a Gmail search query that rolls a parent/umbrella label up together
  // with every descendant sub-label. Returns "" when the label has no children
  // (a leaf), so the caller leaves normal Gmail navigation alone.
  //   labelRollupQuery("Money", ["Money","Money/PayPal","Money/Bank","Work"])
  //     -> 'label:"Money" OR label:"Money/PayPal" OR label:"Money/Bank"'
  function labelRollupQuery(path, allPaths) {
    var parent = String(path || '').trim();
    if (!parent || !Array.isArray(allPaths)) return '';
    var prefix = parent + '/';
    var terms = [parent];
    allPaths.forEach(function (candidate) {
      var name = String(candidate || '').trim();
      if (name && name !== parent && name.indexOf(prefix) === 0) {
        terms.push(name);
      }
    });
    if (terms.length < 2) return ''; // no descendants -> not an umbrella
    return terms.map(function (name) {
      return 'label:"' + name.replace(/"/g, '') + '"';
    }).join(' OR ');
  }

  // ----- Inbox summary (front-page digest + stats panel) --------------------
  // Aggregate the visible inbox rows into counts the panel can render. Pure +
  // testable: each record is { name, email, domain, unread, group }. Returns
  // totals, the busiest senders (by message count), and per-period volume in
  // the encounter order (rows arrive already date-sorted by Gmail).
  function summarizeInbox(records, options) {
    var topLimit = clampNumber(options && options.topLimit, 1, 50, 5);
    var list = Array.isArray(records) ? records : [];
    var total = 0;
    var unread = 0;
    var senderMap = {};
    var senderOrder = [];
    var groupMap = {};
    var groupOrder = [];

    list.forEach(function (record) {
      if (!record) return;
      total += 1;
      var isUnread = !!record.unread;
      if (isUnread) unread += 1;

      var key = String(
        record.domain || record.email || record.name || 'unknown'
      ).toLowerCase();
      if (!senderMap[key]) {
        senderMap[key] = {
          key: key,
          label: String(record.name || record.domain || record.email || 'unknown'),
          domain: String(record.domain || ''),
          count: 0,
          unread: 0
        };
        senderOrder.push(key);
      }
      senderMap[key].count += 1;
      if (isUnread) senderMap[key].unread += 1;

      var group = String(record.group || 'OLDER');
      if (!groupMap[group]) {
        groupMap[group] = { name: group, count: 0, unread: 0 };
        groupOrder.push(group);
      }
      groupMap[group].count += 1;
      if (isUnread) groupMap[group].unread += 1;
    });

    var topSenders = senderOrder
      .map(function (key) { return senderMap[key]; })
      .sort(function (a, b) {
        return (b.count - a.count) || (b.unread - a.unread) ||
          a.label.localeCompare(b.label);
      })
      .slice(0, topLimit);

    var groups = groupOrder.map(function (name) { return groupMap[name]; });

    return {
      total: total,
      unread: unread,
      senderCount: senderOrder.length,
      topSenders: topSenders,
      groups: groups
    };
  }

  // ----- Smart sender rules -------------------------------------------------
  // A map of sender domain -> rule. Rules tag a sender's rows so the inbox can
  // emphasise (vip), dim (mute) or hide them. Pure + testable; the content
  // script only applies a data attribute, so a bad value can never break a row.
  var SENDER_RULES = Object.freeze({ vip: true, mute: true, hide: true });

  function cleanRuleDomain(value) {
    return String(value || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
  }

  function normalizeSenderRules(value) {
    var out = {};
    if (!value || typeof value !== 'object') return out;
    Object.keys(value).slice(0, 2000).forEach(function (key) {
      var domain = cleanRuleDomain(key);
      var rule = String(value[key] || '').trim().toLowerCase();
      if (domain && SENDER_RULES[rule]) out[domain] = rule;
    });
    return out;
  }

  function senderRuleFor(rules, domain) {
    if (!rules || !domain) return '';
    var clean = cleanRuleDomain(domain);
    return Object.prototype.hasOwnProperty.call(rules, clean) ? rules[clean] : '';
  }

  // Order label rows: pinned favourites first (in the order they were pinned),
  // then the rest either by recent activity (desc) or their original order.
  // Pure + testable. Each entry: { index, activity, pinIndex } where pinIndex
  // < 0 means "not pinned". Returns a new sorted array (input is not mutated).
  function orderLabels(entries, options) {
    var byActivity = !!(options && options.byActivity);
    return (entries || []).slice().sort(function (a, b) {
      var aPinned = a.pinIndex >= 0;
      var bPinned = b.pinIndex >= 0;
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      if (aPinned && bPinned) return (a.pinIndex - b.pinIndex) || (a.index - b.index);
      if (byActivity) return (b.activity - a.activity) || (a.index - b.index);
      return a.index - b.index;
    });
  }

  // Entitlement state for the paid model: 15-day free trial -> then paid.
  // Pure + testable. `paid` comes from the payment provider (ExtensionPay) later.
  function licenseState(installedAt, now, paid) {
    if (paid) return { state: 'paid', daysLeft: 0 };
    var start = Number(installedAt);
    if (!Number.isFinite(start) || start <= 0) start = now; // unknown install = just started
    var daysUsed = Math.floor((now - start) / DAY_MS);
    var daysLeft = TRIAL_DAYS - daysUsed;
    if (daysLeft > 0) return { state: 'trial', daysLeft: daysLeft };
    return { state: 'expired', daysLeft: 0 };
  }

  return Object.freeze({
    DAY_MS: DAY_MS,
    LAYOUT_VERSION: LAYOUT_VERSION,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    CATEGORY_COLORS: CATEGORY_COLORS,
    normalizeSettings: normalizeSettings,
    centeredLayoutSettings: centeredLayoutSettings,
    routeMode: routeMode,
    parseGmailDate: parseGmailDate,
    groupForDate: groupForDate,
    groupForCandidates: groupForCandidates,
    hashText: hashText,
    stableColor: stableColor,
    labelColor: labelColor,
    isSubLabel: isSubLabel,
    decodeLabelHash: decodeLabelHash,
    labelRollupQuery: labelRollupQuery,
    SENDER_RULES: SENDER_RULES,
    normalizeSenderRules: normalizeSenderRules,
    senderRuleFor: senderRuleFor,
    summarizeInbox: summarizeInbox,
    orderLabels: orderLabels,
    TRIAL_DAYS: TRIAL_DAYS,
    licenseState: licenseState,
    senderMonogram: senderMonogram
  });
});
