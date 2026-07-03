(function () {
  'use strict';

  var Core = globalThis.GmailViewNextCore;
  var Adapter = globalThis.GmailViewNextAdapter;
  var Styles = globalThis.GmailViewNextStyles;
  var DATE_COLUMN_WIDTH = 170;
  var COMPACT_DATE_COLUMN_WIDTH = 140;
  var LABEL_ACTIVITY_KEY = 'gmailViewNextLabelActivity';
  var LABEL_TYPOGRAPHY_KEY = 'gmailViewNextLabelTypography';
  var LOGO_OVERRIDES_KEY = 'gmailViewNextLogoOverrides';
  var PINNED_LABELS_KEY = 'gmailViewNextPinnedLabels';
  var SENDER_RULES_KEY = 'gmailViewNextSenderRules';
  var SAVED_VIEWS_KEY = 'gmailViewNextSavedViews';
  var HIGHLIGHT_RULES_KEY = 'gmailViewNextHighlightRules';
  var COLUMN_NAMES = ['sender', 'time-sent', 'logo', 'subject', 'preview', 'date'];
  var COLUMN_LAYOUT_SETTINGS = Object.freeze({
    sender: { header: 'headerSenderX', boundary: 'senderOffset' },
    'time-sent': { header: 'headerTimeSentX', boundary: 'timeSentOffset' },
    logo: { header: 'headerLogoX', boundary: 'logoOffset' },
    subject: { header: 'headerSubjectX', boundary: 'subjectGap' },
    preview: { header: 'headerPreviewX', boundary: 'previewOffset' },
    date: { header: 'headerDateX', boundary: 'dateOffset' }
  });
  var CENTER_LAYOUT_KEYS = Object.freeze([
    'senderWidth',
    'contentIndent',
    'senderOffset',
    'timeSentOffset',
    'logoOffset',
    'subjectGap',
    'subjectWidth',
    'previewOffset',
    'dateOffset',
    'inboxOffset',
    'senderTextGap',
    'groupTextGap',
    'logoTextGap',
    'subjectTextGap',
    'previewTextGap',
    'dateTextGap',
    'rightInset',
    'headerSenderX',
    'headerTimeSentX',
    'headerLogoX',
    'headerSubjectX',
    'headerPreviewX',
    'headerDateX'
  ]);
  if (!Core || !Adapter || !Styles) {
    console.error('[Gmail View Next] Required modules did not load.');
    return;
  }

  if (globalThis.__gmailViewNext && globalThis.__gmailViewNext.destroy) {
    globalThis.__gmailViewNext.destroy();
  }

  var SYSTEM_LABELS = /^(inbox|starred|snoozed|sent|drafts?|spam|trash|important|chats?|categories|more|less|all mail|scheduled|manage labels|create new label|compose|social|updates|forums|promotions|primary)$/i;
  var state = {
    settings: Core.normalizeSettings(Core.DEFAULT_SETTINGS),
    observer: null,
    resizeObserver: null,
    frame: 0,
    destroyed: false,
    lastTable: null,
    editing: false,
    editingLabels: false,
    drag: null,
    selectedColumn: 'sender',
    selectedColumns: { sender: true },
    selectedLabels: {},
    sidebarHost: null,
    sidebarNav: null,
    labelActivityDay: '',
    labelActivity: {},
    labelSignals: {},
    labelActivitySaveTimer: 0,
    labelTypography: {},
    labelTypographySaveTimer: 0,
    sortingLabels: false,
    logoCache: {},
    logoPending: {},
    logoOverrides: {},
    senderRules: {},
    savedViews: [],
    highlightRules: [],
    pinnedLabels: [],
    inboxRecords: [],
    listeners: []
  };

  function logError(context, error) {
    console.warn('[Gmail View Next] ' + context, error);
  }

  function isContextInvalidatedError(error) {
    return /extension context invalidated/i.test(
      String(error && (error.message || error))
    );
  }

  function reportApiError(context, error) {
    if (error && !isContextInvalidatedError(error)) logError(context, error);
  }

  function runtimeLastError() {
    try {
      return globalThis.chrome && chrome.runtime
        ? chrome.runtime.lastError || null
        : null;
    } catch (error) {
      return error;
    }
  }

  function storageArea(name) {
    try {
      if (
        !globalThis.chrome ||
        !chrome.runtime ||
        !chrome.runtime.id ||
        !chrome.storage ||
        !chrome.storage[name]
      ) {
        return null;
      }
      return chrome.storage[name];
    } catch (error) {
      return null;
    }
  }

  function safeStorageGet(areaName, keys, callback) {
    var area = storageArea(areaName);
    if (!area) {
      callback(null, null);
      return;
    }
    try {
      area.get(keys, function (stored) {
        callback(stored, runtimeLastError());
      });
    } catch (error) {
      callback(null, error);
    }
  }

  function safeStorageSet(areaName, value, callback) {
    var area = storageArea(areaName);
    if (!area) {
      if (callback) callback(null);
      return;
    }
    try {
      area.set(value, function () {
        if (callback) callback(runtimeLastError());
      });
    } catch (error) {
      if (callback) callback(error);
    }
  }

  function storageChangeEvents() {
    try {
      if (
        !globalThis.chrome ||
        !chrome.runtime ||
        !chrome.runtime.id ||
        !chrome.storage ||
        !chrome.storage.onChanged
      ) {
        return null;
      }
      return chrome.storage.onChanged;
    } catch (error) {
      return null;
    }
  }

  function addListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    state.listeners.push(function () {
      target.removeEventListener(type, listener, options);
    });
  }

  function readSettings() {
    return new Promise(function (resolve) {
      safeStorageGet('sync', null, function (stored, error) {
        if (error) {
          reportApiError('Could not read settings.', error);
          resolve(Core.DEFAULT_SETTINGS);
          return;
        }
        var storedValue = stored || {};
        var value = Object.assign({}, Core.DEFAULT_SETTINGS, storedValue);
        if (value.layoutVersion !== Core.LAYOUT_VERSION) {
          var previousLayoutVersion = Number(storedValue.layoutVersion) || 0;
          value.headerDateX = -1;
          if (
            previousLayoutVersion < 12 &&
            (!Object.prototype.hasOwnProperty.call(storedValue, 'labelFontSize') ||
              Number(storedValue.labelFontSize) <= 16)
          ) {
            value.labelFontSize = Core.DEFAULT_SETTINGS.labelFontSize;
          }
          if (previousLayoutVersion < 13) {
            value.hideTabs = false;
          }
          if (
            previousLayoutVersion < 14 &&
            (!Object.prototype.hasOwnProperty.call(storedValue, 'rowHeight') ||
              Number(storedValue.rowHeight) === 35)
          ) {
            value.rowHeight = Core.DEFAULT_SETTINGS.rowHeight;
          }
          if (previousLayoutVersion < 15) {
            value.sortLabelsByActivity = false;
          }
          [
            'senderFontSize',
            'groupFontSize',
            'logoSize',
            'subjectFontSize',
            'previewFontSize',
            'dateFontSize',
            'senderOffset',
            'timeSentOffset',
            'logoOffset',
            'subjectGap',
            'previewOffset',
            'dateOffset'
          ].forEach(function (key) {
            if (!Object.prototype.hasOwnProperty.call(storedValue, key)) {
              value[key] = Core.DEFAULT_SETTINGS[key];
            }
          });
          value.layoutVersion = Core.LAYOUT_VERSION;
          safeStorageSet('sync', {
            senderFontSize: value.senderFontSize,
            groupFontSize: value.groupFontSize,
            logoSize: value.logoSize,
            subjectFontSize: value.subjectFontSize,
            previewFontSize: value.previewFontSize,
            dateFontSize: value.dateFontSize,
            senderOffset: value.senderOffset,
            timeSentOffset: value.timeSentOffset,
            logoOffset: value.logoOffset,
            subjectGap: value.subjectGap,
            previewOffset: value.previewOffset,
            dateOffset: value.dateOffset,
            labelFontSize: value.labelFontSize,
            hideTabs: value.hideTabs,
            rowHeight: value.rowHeight,
            sortLabelsByActivity: value.sortLabelsByActivity,
            headerDateX: value.headerDateX,
            layoutVersion: Core.LAYOUT_VERSION
          }, function (saveError) {
            reportApiError('Could not migrate settings.', saveError);
          });
        }
        resolve(value);
      });
    });
  }

  function localDayKey(dateValue) {
    var date = dateValue || new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function readLabelActivity() {
    return new Promise(function (resolve) {
      var today = localDayKey();
      safeStorageGet('local', LABEL_ACTIVITY_KEY, function (stored, error) {
        reportApiError('Could not read label activity.', error);
        var value = stored && stored[LABEL_ACTIVITY_KEY];
        if (value && value.day === today && value.activity) {
          state.labelActivityDay = today;
          state.labelActivity = value.activity;
        } else {
          state.labelActivityDay = today;
          state.labelActivity = {};
        }
        resolve();
      });
    });
  }

  function scheduleLabelActivitySave() {
    if (state.labelActivitySaveTimer) clearTimeout(state.labelActivitySaveTimer);
    state.labelActivitySaveTimer = setTimeout(function () {
      state.labelActivitySaveTimer = 0;
      var value = {};
      value[LABEL_ACTIVITY_KEY] = {
        day: state.labelActivityDay,
        activity: state.labelActivity
      };
      safeStorageSet('local', value, function (error) {
        reportApiError('Could not save label activity.', error);
      });
    }, 200);
  }

  function normalizeLabelTypography(value) {
    var normalized = {};
    Object.keys(value || {}).slice(0, 1000).forEach(function (name) {
      var source = value[name];
      if (!source || typeof source !== 'object') return;
      var style = {};
      var size = Number(source.size);
      if (Number.isFinite(size)) style.size = Math.min(32, Math.max(10, size));
      if (typeof source.bold === 'boolean') style.bold = source.bold;
      if (typeof source.italic === 'boolean') style.italic = source.italic;
      if (Object.keys(style).length) normalized[name] = style;
    });
    return normalized;
  }

  function readLabelTypography() {
    return new Promise(function (resolve) {
      safeStorageGet('local', LABEL_TYPOGRAPHY_KEY, function (stored, error) {
        reportApiError('Could not read label typography.', error);
        if (!error) {
          state.labelTypography = normalizeLabelTypography(
            stored && stored[LABEL_TYPOGRAPHY_KEY]
          );
        }
        resolve();
      });
    });
  }

  function readLogoOverrides() {
    return new Promise(function (resolve) {
      safeStorageGet('local', LOGO_OVERRIDES_KEY, function (stored, error) {
        reportApiError('Could not read sender colours.', error);
        if (!error) {
          state.logoOverrides = normalizeOverrides(stored && stored[LOGO_OVERRIDES_KEY]);
        }
        resolve();
      });
    });
  }

  function readSenderRules() {
    return new Promise(function (resolve) {
      safeStorageGet('local', SENDER_RULES_KEY, function (stored, error) {
        reportApiError('Could not read sender rules.', error);
        if (!error) {
          state.senderRules = Core.normalizeSenderRules(stored && stored[SENDER_RULES_KEY]);
        }
        resolve();
      });
    });
  }

  function readSavedViews() {
    return new Promise(function (resolve) {
      safeStorageGet('local', SAVED_VIEWS_KEY, function (stored, error) {
        reportApiError('Could not read saved views.', error);
        if (!error) {
          state.savedViews = Core.normalizeSavedViews(stored && stored[SAVED_VIEWS_KEY]);
        }
        resolve();
      });
    });
  }

  function readHighlightRules() {
    return new Promise(function (resolve) {
      safeStorageGet('local', HIGHLIGHT_RULES_KEY, function (stored, error) {
        reportApiError('Could not read highlight rules.', error);
        if (!error) {
          state.highlightRules = Core.normalizeHighlightRules(stored && stored[HIGHLIGHT_RULES_KEY]);
        }
        resolve();
      });
    });
  }

  function hexToRgba(hex, alpha) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function normalizePinned(value) {
    if (!Array.isArray(value)) return [];
    var out = [];
    value.forEach(function (name) {
      var clean = String(name || '').trim();
      if (clean && out.indexOf(clean) === -1) out.push(clean);
    });
    return out;
  }

  function readPinnedLabels() {
    return new Promise(function (resolve) {
      safeStorageGet('local', PINNED_LABELS_KEY, function (stored, error) {
        reportApiError('Could not read pinned labels.', error);
        if (!error) {
          state.pinnedLabels = normalizePinned(stored && stored[PINNED_LABELS_KEY]);
        }
        resolve();
      });
    });
  }

  function scheduleLabelTypographySave() {
    if (state.labelTypographySaveTimer) {
      clearTimeout(state.labelTypographySaveTimer);
    }
    state.labelTypographySaveTimer = setTimeout(function () {
      state.labelTypographySaveTimer = 0;
      var value = {};
      value[LABEL_TYPOGRAPHY_KEY] = state.labelTypography;
      safeStorageSet('local', value, function (error) {
        reportApiError('Could not save label typography.', error);
      });
    }, 200);
  }

  function installStyle() {
    var style = document.getElementById('gmail-view-next-css');
    if (!style) {
      style = document.createElement('style');
      style.id = 'gmail-view-next-css';
      document.head.appendChild(style);
    }
    style.textContent = Styles.buildCss(state.settings);
  }

  function updateRootFlags() {
    var root = document.documentElement;
    root.setAttribute('data-gvn-active', String(state.settings.enabled && licenseAllows()));
    root.setAttribute('data-gvn-route', Core.routeMode(location.hash));
    root.setAttribute('data-gvn-hide-tabs', String(state.settings.hideTabs));
    root.setAttribute('data-gvn-hide-tab-promotions', String(state.settings.hideTabPromotions));
    root.setAttribute('data-gvn-hide-tab-social', String(state.settings.hideTabSocial));
    root.setAttribute('data-gvn-hide-tab-updates', String(state.settings.hideTabUpdates));
    root.setAttribute('data-gvn-hide-tab-forums', String(state.settings.hideTabForums));
    root.setAttribute('data-gvn-focus', String(state.settings.focusMode));
    root.setAttribute('data-gvn-zen', String(state.settings.zenMode));
    root.setAttribute('data-gvn-scifi', String(state.settings.sciFiAccents));
    root.setAttribute('data-gvn-tab-order', state.settings.tabOrder);
    root.setAttribute('data-gvn-hide-rail', String(state.settings.hideRail));
    root.setAttribute('data-gvn-color-labels', String(state.settings.colorLabels));
    root.setAttribute('data-gvn-label-indent', String(state.settings.labelIndentGuides));
    root.setAttribute('data-gvn-label-tint', String(state.settings.labelRowTint));
    root.setAttribute('data-gvn-label-glow', String(state.settings.labelNewMailGlow));
    root.setAttribute('data-gvn-label-editing', String(state.editingLabels));
    root.setAttribute(
      'data-gvn-sidebar-sized',
      String(Number(state.settings.sidebarWidth) > 0)
    );
    root.style.setProperty(
      '--gvn-sidebar-width',
      Math.round(Number(state.settings.sidebarWidth) || 0) + 'px'
    );
  }

  function ensureSidebarResizer() {
    var handle = document.getElementById('gmail-view-next-sidebar-resizer');
    if (handle) return handle;

    handle = document.createElement('div');
    handle.id = 'gmail-view-next-sidebar-resizer';
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-label', 'Resize Gmail sidebar');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-valuemin', '180');
    handle.setAttribute('title', 'Drag to resize Gmail sidebar. Double-click to reset.');
    handle.tabIndex = 0;
    handle.addEventListener('pointerdown', startSidebarDrag);
    handle.addEventListener('keydown', moveSidebarWithKeyboard);
    handle.addEventListener('dblclick', resetSidebarWidth);
    document.body.appendChild(handle);
    return handle;
  }

  function clearSidebarTargets() {
    if (state.sidebarHost) state.sidebarHost.removeAttribute('data-gvn-sidebar-host');
    if (state.sidebarNav) state.sidebarNav.removeAttribute('data-gvn-sidebar-nav');
    state.sidebarHost = null;
    state.sidebarNav = null;
  }

  function locateSidebarTarget() {
    var nav = Adapter.locateSidebar();
    if (!nav) {
      clearSidebarTargets();
      return null;
    }
    if (
      state.sidebarHost &&
      state.sidebarHost.isConnected &&
      state.sidebarNav === nav
    ) {
      return { host: state.sidebarHost, nav: nav };
    }

    clearSidebarTargets();
    var navRect = nav.getBoundingClientRect();
    var host = nav;
    var current = nav;
    for (var depth = 0; depth < 8 && current.parentElement; depth++) {
      var parent = current.parentElement;
      var rect = parent.getBoundingClientRect();
      if (
        rect.width > 640 ||
        rect.height < Math.min(300, window.innerHeight * 0.35) ||
        rect.left > navRect.left + 48 ||
        rect.right < navRect.right - 48
      ) {
        break;
      }
      host = parent;
      current = parent;
    }

    host.setAttribute('data-gvn-sidebar-host', 'true');
    nav.setAttribute('data-gvn-sidebar-nav', 'true');
    state.sidebarHost = host;
    state.sidebarNav = nav;
    return { host: host, nav: nav };
  }

  function positionSidebarResizer() {
    var handle = ensureSidebarResizer();
    if (
      !state.settings.enabled ||
      Core.routeMode(location.hash) !== 'inbox'
    ) {
      handle.style.display = 'none';
      clearSidebarTargets();
      return;
    }

    var target = locateSidebarTarget();
    if (!target) {
      handle.style.display = 'none';
      return;
    }

    var hostRect = target.host.getBoundingClientRect();
    var navRect = target.nav.getBoundingClientRect();
    var top = Math.max(120, Math.min(180, Math.round(navRect.top)));
    var maximum = Math.max(240, Math.min(720, window.innerWidth - 520));
    var currentWidth = Number(state.settings.sidebarWidth) > 0
      ? Number(state.settings.sidebarWidth)
      : hostRect.width;
    handle.style.left = Math.round(hostRect.right - 7) + 'px';
    handle.style.top = top + 'px';
    handle.style.height = Math.max(160, window.innerHeight - top) + 'px';
    handle.style.display = 'block';
    handle.setAttribute('aria-valuemax', String(Math.round(maximum)));
    handle.setAttribute('aria-valuenow', String(Math.round(currentWidth)));
  }

  function startSidebarDrag(event) {
    var target = locateSidebarTarget();
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    var handle = event.currentTarget;
    state.drag = {
      type: 'sidebar',
      key: 'sidebarWidth',
      element: handle,
      startX: event.clientX,
      startValue: target.host.getBoundingClientRect().width
    };
    handle.setAttribute('data-active', 'true');
    if (handle.setPointerCapture) {
      try { handle.setPointerCapture(event.pointerId); } catch (error) {}
    }
  }

  function moveSidebarWithKeyboard(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    var target = locateSidebarTarget();
    if (!target) return;
    var current = Number(state.settings.sidebarWidth) > 0
      ? Number(state.settings.sidebarWidth)
      : target.host.getBoundingClientRect().width;
    var next = Object.assign({}, state.settings);
    if (event.key === 'Home') {
      next.sidebarWidth = 0;
    } else {
      var maximum = Math.max(240, Math.min(720, window.innerWidth - 520));
      var step = event.shiftKey ? 32 : 8;
      var delta = event.key === 'ArrowRight' ? step : -step;
      next.sidebarWidth = Math.max(180, Math.min(maximum, current + delta));
    }
    state.settings = Core.normalizeSettings(next);
    updateRootFlags();
    positionSidebarResizer();
    scheduleRefresh();
    saveLayoutSetting('sidebarWidth');
  }

  function resetSidebarWidth(event) {
    event.preventDefault();
    event.stopPropagation();
    var next = Object.assign({}, state.settings, { sidebarWidth: 0 });
    state.settings = Core.normalizeSettings(next);
    updateRootFlags();
    positionSidebarResizer();
    scheduleRefresh();
    saveLayoutSetting('sidebarWidth');
  }

  function editorMastheadHeight() {
    var controlHeight = Math.max(
      20,
      Math.round(36 * Number(state.settings.editorScale))
    );
    return 34 + controlHeight + 4;
  }

  function startEditorScaleDrag(event) {
    if (!state.editing) return;
    event.preventDefault();
    event.stopPropagation();
    state.drag = {
      type: 'editor-scale',
      key: 'editorScale',
      element: event.currentTarget,
      startX: event.clientX,
      startValue: Number(state.settings.editorScale)
    };
    event.currentTarget.setAttribute('data-active', 'true');
    if (event.currentTarget.setPointerCapture) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) {}
    }
  }

  function moveEditorScaleWithKeyboard(event) {
    if (!state.editing || !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    var next = Object.assign({}, state.settings);
    if (event.key === 'Home') {
      next.editorScale = 0.6;
    } else {
      var step = event.shiftKey ? 0.1 : 0.05;
      next.editorScale =
        Number(state.settings.editorScale) +
        (event.key === 'ArrowRight' ? step : -step);
    }
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSetting('editorScale');
  }

  function resetEditorScale(event) {
    event.preventDefault();
    event.stopPropagation();
    var next = Object.assign({}, state.settings, { editorScale: 0.6 });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSetting('editorScale');
  }

  function commitTypedValue(node, property) {
    var text = String(node.textContent || '').replace(',', '.').replace(/[^0-9.\-]/g, '');
    var parsed = Number(text);
    if (!Number.isFinite(parsed)) {
      updateTypeEditor();
      return;
    }
    if (state.editingLabels) {
      // In label-edit mode the size box sets an exact px size on the selected
      // labels (whatever the Main/Subs scope picked).
      if (property === 'size') setSelectedLabelFontSize(parsed);
      else updateTypeEditor();
      return;
    }
    var keys = selectedTypography().map(function (item) {
      return property === 'size' ? item.definition.size : item.definition[property];
    }).filter(Boolean);
    if (!keys.length) {
      updateTypeEditor();
      return;
    }
    var next = Object.assign({}, state.settings);
    keys.forEach(function (key) {
      next[key] = parsed;
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
    updateTypeEditor();
  }

  function makeValueEditable(node, property) {
    try {
      node.contentEditable = 'plaintext-only';
    } catch (error) {
      node.contentEditable = 'true';
    }
    node.setAttribute('role', 'textbox');
    node.setAttribute('aria-label', 'Type a value and press Enter');
    node.title = 'Click, type a number, press Enter';
    node.addEventListener('keydown', function (event) {
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        node.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        node.blur();
      }
    });
    node.addEventListener('focus', function () {
      var range = document.createRange();
      range.selectNodeContents(node);
      var selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    });
    node.addEventListener('blur', function () {
      commitTypedValue(node, property);
    });
  }

  function ensureOverlay() {
    var overlay = document.getElementById('gmail-view-next-ui');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'gmail-view-next-ui';
    overlay.setAttribute('data-editing', 'false');
    overlay.setAttribute('data-label-editing', 'false');
    overlay.setAttribute('data-dragging', 'false');

    var masthead = document.createElement('div');
    masthead.className = 'gvn-masthead';
    var mastheadTitle = document.createElement('span');
    mastheadTitle.className = 'gvn-masthead-title';
    mastheadTitle.setAttribute('data-column', 'inbox');
    mastheadTitle.setAttribute('role', 'slider');
    mastheadTitle.setAttribute('aria-label', 'Move Inbox title');
    mastheadTitle.setAttribute('aria-orientation', 'horizontal');
    mastheadTitle.tabIndex = 0;
    mastheadTitle.addEventListener('pointerdown', startInboxDrag);
    mastheadTitle.addEventListener('keydown', moveInboxWithKeyboard);
    mastheadTitle.addEventListener('click', selectColumnForTypography);
    masthead.appendChild(mastheadTitle);
    var typeEditor = document.createElement('div');
    typeEditor.className = 'gvn-type-editor';
    var typeName = document.createElement('span');
    typeName.className = 'gvn-type-name';
    typeEditor.appendChild(typeName);
    var decreaseType = document.createElement('button');
    decreaseType.type = 'button';
    decreaseType.textContent = '- Font';
    decreaseType.setAttribute('data-delta', '-1');
    decreaseType.setAttribute('aria-label', 'Decrease selected column size');
    decreaseType.addEventListener('click', adjustSelectedTypography);
    typeEditor.appendChild(decreaseType);
    var typeValue = document.createElement('output');
    typeValue.className = 'gvn-type-value';
    makeValueEditable(typeValue, 'size');
    typeEditor.appendChild(typeValue);
    var increaseType = document.createElement('button');
    increaseType.type = 'button';
    increaseType.textContent = '+ Font';
    increaseType.setAttribute('data-delta', '1');
    increaseType.setAttribute('aria-label', 'Increase selected column size');
    increaseType.addEventListener('click', adjustSelectedTypography);
    typeEditor.appendChild(increaseType);
    var selectAll = document.createElement('input');
    selectAll.className = 'gvn-select-all';
    selectAll.type = 'checkbox';
    selectAll.setAttribute('aria-label', 'Select all columns for size changes');
    selectAll.addEventListener('change', toggleAllColumnSelection);
    typeEditor.appendChild(selectAll);
    [
      ['main', 'Main', 'Select all main (umbrella / top-level) labels'],
      ['sub', 'Subs', 'Select all sub-labels (nested ones)']
    ].forEach(function (item) {
      var scope = document.createElement('label');
      scope.className = 'gvn-scope';
      var check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'gvn-scope-check';
      check.setAttribute('data-scope', item[0]);
      check.setAttribute('aria-label', item[2]);
      check.title = item[2];
      check.addEventListener('change', toggleLabelScope);
      check.addEventListener('click', stopCheckboxEvent);
      scope.appendChild(check);
      scope.appendChild(document.createTextNode(item[1]));
      typeEditor.appendChild(scope);
    });
    [
      ['Bold', 'bold', 'Toggle bold for selected text'],
      ['Italic', 'italic', 'Toggle italic for selected text']
    ].forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = item[0];
      button.setAttribute('data-style-toggle', item[1]);
      button.setAttribute('aria-label', item[2]);
      button.title = item[2];
      button.addEventListener('click', toggleSelectedStyle);
      typeEditor.appendChild(button);
    });
    [
      ['- Letter space', 'letter', '-0.5', 'Decrease space between letters'],
      ['+ Letter space', 'letter', '0.5', 'Increase space between letters'],
      ['- Word space', 'word', '-1', 'Decrease space between words'],
      ['+ Word space', 'word', '1', 'Increase space between words'],
      ['- Line gap', 'gap', '-2', 'Decrease space after line'],
      ['+ Line gap', 'gap', '2', 'Increase space after line']
    ].forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = item[0];
      button.setAttribute('data-style-adjust', item[1]);
      button.setAttribute('data-delta', item[2]);
      button.setAttribute('aria-label', item[3]);
      button.title = item[3];
      button.addEventListener('click', adjustSelectedStyle);
      typeEditor.appendChild(button);
    });
    var editorResizer = document.createElement('div');
    editorResizer.className = 'gvn-editor-resizer';
    editorResizer.setAttribute('role', 'separator');
    editorResizer.setAttribute('aria-label', 'Resize edit ribbon');
    editorResizer.setAttribute('aria-orientation', 'vertical');
    editorResizer.setAttribute('aria-valuemin', '45');
    editorResizer.setAttribute('aria-valuemax', '125');
    editorResizer.setAttribute(
      'title',
      'Drag left for smaller, right for bigger. Double-click for 60%.'
    );
    editorResizer.tabIndex = 0;
    editorResizer.addEventListener('pointerdown', startEditorScaleDrag);
    editorResizer.addEventListener('keydown', moveEditorScaleWithKeyboard);
    editorResizer.addEventListener('dblclick', resetEditorScale);
    typeEditor.appendChild(editorResizer);
    masthead.appendChild(typeEditor);
    var bgToggle = document.createElement('button');
    bgToggle.className = 'gvn-bg-toggle';
    bgToggle.type = 'button';
    bgToggle.title = 'Toggle the white reading panel. Off = fully see-through over your Gmail theme.';
    bgToggle.setAttribute('aria-label', 'Toggle white reading panel');
    bgToggle.addEventListener('click', toggleBackgroundMode);
    masthead.appendChild(bgToggle);
    var quickButton = document.createElement('button');
    quickButton.className = 'gvn-quick-button';
    quickButton.type = 'button';
    quickButton.textContent = '⚙';
    quickButton.title = 'Quick settings — tabs, theme and more';
    quickButton.setAttribute('aria-label', 'Open quick settings');
    quickButton.addEventListener('click', toggleQuickPanel);
    masthead.appendChild(quickButton);
    var focusButton = document.createElement('button');
    focusButton.className = 'gvn-tab-focus';
    focusButton.type = 'button';
    focusButton.textContent = 'Focus';
    focusButton.title = 'Focus mode — hide Promotions, Social & Forums';
    focusButton.setAttribute('aria-label', 'Toggle focus mode');
    focusButton.addEventListener('click', function () {
      setQuickSetting('focusMode', !(state.settings.focusMode === true));
      updateQuickButtons();
    });
    masthead.appendChild(focusButton);
    var tabOrderButton = document.createElement('button');
    tabOrderButton.className = 'gvn-tab-order';
    tabOrderButton.type = 'button';
    tabOrderButton.textContent = 'Tabs';
    tabOrderButton.setAttribute('aria-label', 'Change category tab order');
    tabOrderButton.addEventListener('click', function () {
      var idx = TAB_ORDER_CYCLE.indexOf(state.settings.tabOrder);
      setQuickSetting('tabOrder', TAB_ORDER_CYCLE[(idx + 1) % TAB_ORDER_CYCLE.length]);
      updateQuickButtons();
    });
    masthead.appendChild(tabOrderButton);
    var centerButton = document.createElement('button');
    centerButton.className = 'gvn-center-button';
    centerButton.type = 'button';
    centerButton.textContent = 'Reset center';
    centerButton.title = 'Equal spacing, fit the inbox, and restore centered columns';
    centerButton.setAttribute('aria-label', 'Reset and center columns');
    centerButton.addEventListener('click', centerAndFitLayout);
    masthead.appendChild(centerButton);
    var labelEditButton = document.createElement('button');
    labelEditButton.className = 'gvn-label-edit-button';
    labelEditButton.type = 'button';
    labelEditButton.textContent = 'Labels';
    labelEditButton.addEventListener('click', toggleLabelEditing);
    masthead.appendChild(labelEditButton);
    var editButton = document.createElement('button');
    editButton.className = 'gvn-edit-button';
    editButton.type = 'button';
    editButton.textContent = 'Columns';
    editButton.addEventListener('click', toggleEditing);
    masthead.appendChild(editButton);
    var editMaster = document.createElement('button');
    editMaster.className = 'gvn-edit-master';
    editMaster.type = 'button';
    editMaster.textContent = 'Edit';
    editMaster.title = 'Edit the inbox — choose Labels or Columns';
    editMaster.setAttribute('aria-label', 'Open edit menu');
    editMaster.addEventListener('click', toggleEditMenu);
    masthead.appendChild(editMaster);
    if (state.settings.debugTools) {
      var inspectButton = document.createElement('button');
      inspectButton.className = 'gvn-inspect-button';
      inspectButton.type = 'button';
      inspectButton.textContent = 'Inspect';
      inspectButton.title = "Copy Gmail's live tab/toolbar HTML to the clipboard (for debugging layout)";
      inspectButton.setAttribute('aria-label', 'Copy Gmail layout HTML to clipboard');
      inspectButton.addEventListener('click', copyInspectReport);
      masthead.appendChild(inspectButton);
    }
    overlay.appendChild(masthead);

    var columns = document.createElement('div');
    columns.className = 'gvn-columns';
    [
      ['sender', 'headerSenderX'],
      ['time-sent', 'headerTimeSentX'],
      ['logo', 'headerLogoX'],
      ['subject', 'headerSubjectX'],
      ['preview', 'headerPreviewX'],
      ['date', 'headerDateX']
    ].forEach(function (item) {
      var label = document.createElement('span');
      label.className = 'gvn-column-label';
      label.setAttribute('data-column', item[0]);
      label.setAttribute('data-position-setting', item[1]);
      label.setAttribute('role', 'slider');
      label.setAttribute('aria-label', 'Move ' + item[0].replace('-', ' ') + ' header');
      label.setAttribute('aria-valuemin', '0');
      label.setAttribute('aria-orientation', 'horizontal');
      label.tabIndex = 0;
      label.textContent = item[0].replace('-', ' ');
      label.addEventListener('pointerdown', startHeaderDrag);
      label.addEventListener('keydown', moveHeaderWithKeyboard);
      label.addEventListener('click', selectColumnForTypography);
      columns.appendChild(label);
    });
    [
      ['senderOffset', 'Move sender column', 'sender'],
      ['timeSentOffset', 'Move date groups', 'time-sent'],
      ['logoOffset', 'Move logo column', 'logo'],
      ['subjectGap', 'Move subject column', 'subject'],
      ['previewOffset', 'Move preview column', 'preview'],
      ['dateOffset', 'Move date column', 'date']
    ].forEach(function (item) {
      var handle = document.createElement('div');
      handle.className = 'gvn-resize-handle';
      handle.setAttribute('data-setting', item[0]);
      handle.setAttribute('data-column', item[2]);
      handle.setAttribute('data-title', item[1]);
      handle.setAttribute('role', 'separator');
      handle.setAttribute('aria-label', item[1]);
      handle.setAttribute('aria-orientation', 'vertical');
      handle.tabIndex = 0;
      var checkbox = document.createElement('input');
      checkbox.className = 'gvn-column-check';
      checkbox.type = 'checkbox';
      checkbox.setAttribute('data-setting', item[0]);
      checkbox.setAttribute('data-column', item[2]);
      checkbox.setAttribute(
        'aria-label',
        'Select ' + item[2].replace('-', ' ') + ' for size changes'
      );
      checkbox.checked = item[2] === 'sender';
      checkbox.addEventListener('pointerdown', stopCheckboxEvent);
      checkbox.addEventListener('click', stopCheckboxEvent);
      checkbox.addEventListener('change', toggleColumnSelection);
      columns.appendChild(checkbox);
      handle.addEventListener('pointerdown', startColumnDrag);
      handle.addEventListener('keydown', moveColumnWithKeyboard);
      columns.appendChild(handle);
    });
    overlay.appendChild(columns);
    document.body.appendChild(overlay);
    updateTypeEditor();
    updateBackgroundToggle();
    updateQuickButtons();
    return overlay;
  }

  function updateBackgroundToggle() {
    var overlay = document.getElementById('gmail-view-next-ui');
    if (!overlay) return;
    var button = overlay.querySelector('.gvn-bg-toggle');
    if (!button) return;
    var on = state.settings.readablePanel !== false;
    button.textContent = on ? 'Paper: on' : 'Paper: off';
    if (on) button.setAttribute('data-active', 'true');
    else button.removeAttribute('data-active');
  }

  function updateQuickButtons() {
    var overlay = document.getElementById('gmail-view-next-ui');
    if (!overlay) return;
    var focusBtn = overlay.querySelector('.gvn-tab-focus');
    if (focusBtn) {
      focusBtn.setAttribute('data-active', String(state.settings.focusMode === true));
    }
    var tabBtn = overlay.querySelector('.gvn-tab-order');
    if (tabBtn) {
      tabBtn.title = 'Tab order: ' +
        (TAB_ORDER_LABELS[state.settings.tabOrder] || state.settings.tabOrder) +
        ' — click to change';
    }
  }

  function toggleBackgroundMode() {
    var next = Object.assign({}, state.settings, {
      readablePanel: !(state.settings.readablePanel !== false)
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSetting('readablePanel');
    updateBackgroundToggle();
  }

  // ----- In-Gmail quick settings popover --------------------------------
  var QUICK_TOGGLES = [
    { key: 'mergeTabsRow', label: 'Merge category tabs' },
    { key: 'hideTabPromotions', label: 'Hide Promotions tab' },
    { key: 'hideTabSocial', label: 'Hide Social tab' },
    { key: 'hideTabUpdates', label: 'Hide Updates tab' },
    { key: 'hideTabForums', label: 'Hide Forums tab' },
    { key: 'focusMode', label: 'Focus mode (hide Promotions/Social/Forums)' }
  ];
  var THEME_CYCLE = ['light', 'dark', 'sepia', 'contrast'];
  var THEME_LABELS = { light: 'Light', dark: 'Dark', sepia: 'Sepia', contrast: 'Contrast' };
  var TAB_ORDER_CYCLE = ['default', 'promotions-first', 'social-first'];
  var TAB_ORDER_LABELS = {
    'default': 'Primary first',
    'promotions-first': 'Promotions first',
    'social-first': 'Social first'
  };

  // Apply a setting from the in-Gmail popover: write to sync storage (so it
  // sticks and other tabs update) and apply it locally right away.
  function setQuickSetting(key, value) {
    var patch = {};
    patch[key] = value;
    safeStorageSet('sync', patch);
    var next = Object.assign({}, state.settings);
    next[key] = value;
    state.settings = Core.normalizeSettings(next);
    installStyle();
    updateRootFlags();
    scheduleRefresh();
  }

  function quickCycleButton(labelPrefix, cycle, labels, key) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gvn-quick-cycle';
    var render = function () {
      var value = state.settings[key];
      btn.textContent = labelPrefix + ': ' + (labels[value] || value);
    };
    render();
    btn.addEventListener('click', function () {
      var idx = cycle.indexOf(state.settings[key]);
      var nextValue = cycle[(idx + 1) % cycle.length];
      setQuickSetting(key, nextValue);
      render();
    });
    return btn;
  }

  function buildQuickPanel(panel) {
    panel.textContent = '';
    var head = document.createElement('div');
    head.className = 'gvn-quick-head';
    head.textContent = 'Quick settings';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'gvn-quick-close';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', function () { panel.style.display = 'none'; });
    head.appendChild(close);
    panel.appendChild(head);

    var body = document.createElement('div');
    body.className = 'gvn-quick-body';
    body.appendChild(quickCycleButton('Theme', THEME_CYCLE, THEME_LABELS, 'theme'));
    body.appendChild(quickCycleButton('Tab order', TAB_ORDER_CYCLE, TAB_ORDER_LABELS, 'tabOrder'));

    QUICK_TOGGLES.forEach(function (item) {
      var row = document.createElement('label');
      row.className = 'gvn-quick-row';
      var box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = state.settings[item.key] === true;
      box.addEventListener('change', function () {
        setQuickSetting(item.key, box.checked);
      });
      var text = document.createElement('span');
      text.textContent = item.label;
      row.appendChild(box);
      row.appendChild(text);
      body.appendChild(row);
    });

    var more = document.createElement('button');
    more.type = 'button';
    more.className = 'gvn-quick-more';
    more.textContent = 'All settings →';
    more.addEventListener('click', function () {
      try {
        window.open(chrome.runtime.getURL('options/options.html'), '_blank');
      } catch (error) {
        reportApiError('Could not open settings.', error);
      }
    });
    body.appendChild(more);
    panel.appendChild(body);
  }

  function toggleQuickPanel() {
    var panel = document.getElementById('gmail-view-next-quick');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'gmail-view-next-quick';
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', 'Quick settings');
      document.body.appendChild(panel);
    }
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
      return;
    }
    buildQuickPanel(panel);
    panel.style.display = 'block';
    var button = document.querySelector('.gvn-quick-button');
    if (button) {
      var rect = button.getBoundingClientRect();
      panel.style.top = Math.round(rect.bottom + 6) + 'px';
      panel.style.left = Math.round(Math.max(8, rect.left - 6)) + 'px';
    }
  }

  function closeEditMenu(overlay) {
    if (!overlay) return;
    overlay.setAttribute('data-edit-menu', 'false');
    var master = overlay.querySelector('.gvn-edit-master');
    if (master) master.textContent = 'Edit';
  }

  function toggleEditMenu() {
    var overlay = ensureOverlay();
    var open = overlay.getAttribute('data-edit-menu') === 'true';
    overlay.setAttribute('data-edit-menu', String(!open));
    var master = overlay.querySelector('.gvn-edit-master');
    if (master) master.textContent = open ? 'Edit' : 'Close';
  }

  function toggleEditing() {
    var nextEditing = !(state.editing && !state.editingLabels);
    state.editing = nextEditing;
    state.editingLabels = false;
    if (!state.editing) state.selectedColumns = { sender: true };
    var overlay = ensureOverlay();
    closeEditMenu(overlay);
    overlay.setAttribute('data-editing', String(state.editing));
    overlay.setAttribute('data-label-editing', 'false');
    var button = overlay.querySelector('.gvn-edit-button');
    if (button) button.textContent = state.editing ? 'Done' : 'Columns';
    var labelButton = overlay.querySelector('.gvn-label-edit-button');
    if (labelButton) labelButton.textContent = 'Labels';
    updateRootFlags();
    scheduleRefresh();
    updateTypeEditor();
    if (!state.editing && state.drag) finishColumnDrag();
  }

  function toggleLabelEditing() {
    var nextEditing = !(state.editing && state.editingLabels);
    state.editing = nextEditing;
    state.editingLabels = nextEditing;
    state.selectedColumns = {};
    if (!nextEditing) state.selectedLabels = {};
    var overlay = ensureOverlay();
    closeEditMenu(overlay);
    overlay.setAttribute('data-editing', String(state.editing));
    overlay.setAttribute('data-label-editing', String(state.editingLabels));
    var editButton = overlay.querySelector('.gvn-edit-button');
    if (editButton) editButton.textContent = 'Columns';
    var labelButton = overlay.querySelector('.gvn-label-edit-button');
    if (labelButton) labelButton.textContent = state.editingLabels ? 'Done' : 'Labels';
    updateRootFlags();
    scheduleRefresh();
    updateTypeEditor();
    if (!state.editing && state.drag) finishColumnDrag();
  }

  function centerAndFitLayout(event) {
    event.preventDefault();
    event.stopPropagation();
    var inbox = Adapter.locateInbox();
    var tableRect = inbox.table ? inbox.table.getBoundingClientRect() : null;
    var viewportRect = inbox.viewport ? inbox.viewport.getBoundingClientRect() : null;
    var tableLeft = tableRect ? tableRect.left : 0;
    var visibleRight = Math.min(
      window.innerWidth,
      viewportRect && viewportRect.right > 0 ? viewportRect.right : window.innerWidth
    );
    var availableWidth = Math.max(480, visibleRight - tableLeft - 16);
    state.settings = Core.centeredLayoutSettings(state.settings, availableWidth);
    installStyle();
    saveLayoutSettings(CENTER_LAYOUT_KEYS);
    scheduleRefresh();
    requestAnimationFrame(function () {
      scheduleRefresh();
    });
  }

  function customLabelItems() {
    return Adapter.sidebarLabels().filter(function (item) {
      return !SYSTEM_LABELS.test(item.name);
    });
  }

  function labelTypographyFor(name) {
    var stored = state.labelTypography[name] || {};
    return {
      size: Number.isFinite(Number(stored.size))
        ? Number(stored.size)
        : Number(state.settings.labelFontSize),
      bold: stored.bold === true,
      italic: stored.italic === true,
      hasBold: typeof stored.bold === 'boolean',
      hasItalic: typeof stored.italic === 'boolean'
    };
  }

  function selectedLabelNames() {
    return Object.keys(state.selectedLabels).filter(function (name) {
      return !!state.selectedLabels[name];
    });
  }

  function toggleLabelSelection(event) {
    event.preventDefault();
    event.stopPropagation();
    var name = event.currentTarget.getAttribute('data-label-name');
    if (!name) return;
    if (event.currentTarget.checked) state.selectedLabels[name] = true;
    else delete state.selectedLabels[name];
    updateTypeEditor();
  }

  // Classify each visible custom label as main (umbrella/top-level) or sub
  // (nested). Gmail's data-tooltip is only the leaf name, so "/" alone can't tell
  // -- but nested labels are always indented further right in the sidebar. We
  // measure each label's left edge and treat anything indented past the shallowest
  // ones as a sub-label (also honouring a real "/" in the name, just in case).
  function labelScopeInfo() {
    var items = customLabelItems();
    var lefts = items.map(function (item) {
      var el = item.swatch || item.entry;
      var rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
      return rect ? Math.round(rect.left) : 0;
    });
    var minLeft = lefts.length ? Math.min.apply(Math, lefts) : 0;
    return items.map(function (item, index) {
      return { item: item, sub: lefts[index] > minLeft + 6 || Core.isSubLabel(item.name) };
    });
  }

  // Bulk-select by scope: "main" = umbrella/top-level labels, "sub" = nested ones.
  // Checking adds that whole group to the selection, unchecking removes it -- so
  // you can style mains, subs, or both together.
  function toggleLabelScope(event) {
    event.stopPropagation();
    var wantSub = event.currentTarget.getAttribute('data-scope') === 'sub';
    var on = event.currentTarget.checked;
    labelScopeInfo().forEach(function (info) {
      if (info.sub !== wantSub) return;
      if (on) state.selectedLabels[info.item.name] = true;
      else delete state.selectedLabels[info.item.name];
    });
    updateTypeEditor();
    scheduleRefresh();
  }

  function setSelectedLabelFontSize(size) {
    var names = selectedLabelNames();
    if (!names.length) {
      updateTypeEditor();
      return;
    }
    var clamped = Math.min(32, Math.max(10, size));
    names.forEach(function (name) {
      var stored = Object.assign({}, state.labelTypography[name]);
      stored.size = clamped;
      state.labelTypography[name] = stored;
    });
    scheduleLabelTypographySave();
    scheduleRefresh();
    updateTypeEditor();
  }

  function adjustSelectedLabelSize(delta) {
    var names = selectedLabelNames();
    if (!names.length) return;
    names.forEach(function (name) {
      var current = labelTypographyFor(name);
      var stored = Object.assign({}, state.labelTypography[name]);
      stored.size = Math.min(32, Math.max(10, current.size + delta));
      state.labelTypography[name] = stored;
    });
    scheduleLabelTypographySave();
    scheduleRefresh();
    updateTypeEditor();
  }

  function toggleSelectedLabelStyle(property) {
    var names = selectedLabelNames();
    if (!names.length || !['bold', 'italic'].includes(property)) return;
    var nextValue = !names.every(function (name) {
      return !!labelTypographyFor(name)[property];
    });
    names.forEach(function (name) {
      var stored = Object.assign({}, state.labelTypography[name]);
      stored[property] = nextValue;
      state.labelTypography[name] = stored;
    });
    scheduleLabelTypographySave();
    scheduleRefresh();
    updateTypeEditor();
  }

  function typographyForColumn(column) {
    return {
      inbox: {
        size: 'inboxFontSize',
        label: 'Inbox',
        bold: 'inboxBold',
        italic: 'inboxItalic',
        letter: 'inboxLetterSpacing',
        word: 'inboxWordSpacing'
      },
      sender: {
        size: 'senderFontSize',
        label: 'Sender',
        bold: 'senderBold',
        italic: 'senderItalic',
        letter: 'senderLetterSpacing',
        word: 'senderWordSpacing',
        gap: 'senderTextGap'
      },
      'time-sent': {
        size: 'groupFontSize',
        label: 'Groups',
        bold: 'groupBold',
        italic: 'groupItalic',
        letter: 'groupLetterSpacing',
        word: 'groupWordSpacing',
        gap: 'groupTextGap'
      },
      logo: {
        size: 'logoSize',
        label: 'Logo',
        bold: 'logoBold',
        italic: 'logoItalic',
        letter: 'logoLetterSpacing',
        word: 'logoWordSpacing',
        gap: 'logoTextGap'
      },
      subject: {
        size: 'subjectFontSize',
        label: 'Subject',
        bold: 'subjectBold',
        italic: 'subjectItalic',
        letter: 'subjectLetterSpacing',
        word: 'subjectWordSpacing',
        gap: 'subjectTextGap'
      },
      preview: {
        size: 'previewFontSize',
        label: 'Preview',
        bold: 'previewBold',
        italic: 'previewItalic',
        letter: 'previewLetterSpacing',
        word: 'previewWordSpacing',
        gap: 'previewTextGap'
      },
      date: {
        size: 'dateFontSize',
        label: 'Date',
        bold: 'dateBold',
        italic: 'dateItalic',
        letter: 'dateLetterSpacing',
        word: 'dateWordSpacing',
        gap: 'dateTextGap'
      }
    }[column];
  }

  function selectColumnForTypography(event) {
    if (!state.editing || state.editingLabels) return;
    var column = event.currentTarget.getAttribute('data-column') || 'sender';
    state.selectedColumn = column;
    if (event.ctrlKey || event.metaKey) {
      state.selectedColumns[column] = !state.selectedColumns[column];
    } else {
      state.selectedColumns = {};
      state.selectedColumns[column] = true;
    }
    updateTypeEditor();
  }

  function stopCheckboxEvent(event) {
    event.stopPropagation();
  }

  function toggleColumnSelection(event) {
    event.stopPropagation();
    var column = event.currentTarget.getAttribute('data-column');
    if (!event.currentTarget.checked) {
      state.selectedColumns = {};
    } else {
      state.selectedColumns[column] = true;
      state.selectedColumn = column;
    }
    updateTypeEditor();
  }

  function toggleAllColumnSelection(event) {
    event.stopPropagation();
    if (state.editingLabels) {
      state.selectedLabels = {};
      if (event.currentTarget.checked) {
        customLabelItems().forEach(function (item) {
          state.selectedLabels[item.name] = true;
        });
      }
      updateTypeEditor();
      scheduleRefresh();
      return;
    }
    state.selectedColumns = {};
    if (event.currentTarget.checked) {
      COLUMN_NAMES.forEach(function (column) {
        state.selectedColumns[column] = true;
      });
      state.selectedColumn = 'sender';
    }
    updateTypeEditor();
  }

  function selectedTypography() {
    return Object.keys(state.selectedColumns).filter(function (column) {
      return state.selectedColumns[column] && typographyForColumn(column);
    }).map(function (column) {
      return {
        column: column,
        definition: typographyForColumn(column)
      };
    });
  }

  function updateTypeEditor() {
    var overlay = document.getElementById('gmail-view-next-ui');
    if (!overlay) return;
    if (state.editingLabels) {
      var labelNames = selectedLabelNames();
      var allLabelItems = customLabelItems();
      var labelName = overlay.querySelector('.gvn-type-name');
      var labelValue = overlay.querySelector('.gvn-type-value');
      if (labelName) {
        labelName.textContent = labelNames.length
          ? labelNames.length + (labelNames.length === 1 ? ' label' : ' labels')
          : 'Labels';
      }
      if (labelValue && document.activeElement !== labelValue) {
        var labelSizes = labelNames.map(function (name) {
          return Math.round(labelTypographyFor(name).size);
        });
        labelValue.textContent = !labelSizes.length
          ? '--'
          : labelSizes.every(function (size) { return size === labelSizes[0]; })
            ? labelSizes[0] + 'px'
            : 'Mixed';
      }
      overlay.querySelectorAll('.gvn-column-label,.gvn-masthead-title').forEach(
        function (element) {
          element.removeAttribute('data-selected');
        }
      );
      overlay.querySelectorAll('.gvn-column-check').forEach(function (checkbox) {
        checkbox.checked = false;
      });
      var labelSelectAll = overlay.querySelector('.gvn-select-all');
      if (labelSelectAll) {
        labelSelectAll.setAttribute('aria-label', 'Select all custom labels');
        labelSelectAll.checked =
          allLabelItems.length > 0 && labelNames.length === allLabelItems.length;
        labelSelectAll.indeterminate =
          labelNames.length > 0 && labelNames.length < allLabelItems.length;
      }
      var scopeInfo = labelScopeInfo();
      overlay.querySelectorAll('.gvn-scope-check').forEach(function (check) {
        var wantSub = check.getAttribute('data-scope') === 'sub';
        var group = scopeInfo.filter(function (info) {
          return info.sub === wantSub;
        });
        var chosen = group.filter(function (info) {
          return !!state.selectedLabels[info.item.name];
        }).length;
        check.checked = group.length > 0 && chosen === group.length;
        check.indeterminate = chosen > 0 && chosen < group.length;
      });
      overlay.querySelectorAll('[data-style-toggle]').forEach(function (button) {
        var property = button.getAttribute('data-style-toggle');
        var active = labelNames.length > 0 && labelNames.every(function (name) {
          return !!labelTypographyFor(name)[property];
        });
        button.disabled = !labelNames.length;
        button.setAttribute('aria-pressed', String(active));
        if (active) button.setAttribute('data-active', 'true');
        else button.removeAttribute('data-active');
      });
      overlay.querySelectorAll('[data-style-adjust]').forEach(function (button) {
        button.disabled = true;
      });
      overlay.querySelectorAll('[data-style-value]').forEach(function (output) {
        if (document.activeElement === output) return;
        output.textContent = '--';
      });
      document.querySelectorAll('.gvn-label-check').forEach(function (checkbox) {
        checkbox.checked = !!state.selectedLabels[
          checkbox.getAttribute('data-label-name')
        ];
      });
      return;
    }
    var selected = selectedTypography();
    var name = overlay.querySelector('.gvn-type-name');
    var value = overlay.querySelector('.gvn-type-value');
    if (name) {
      name.textContent = selected.length === 1
        ? selected[0].definition.label
        : selected.length + ' columns';
    }
    if (value && document.activeElement !== value) {
      if (!selected.length) {
        value.textContent = '--';
      } else {
        var values = selected.map(function (item) {
          return Math.round(state.settings[item.definition.size]);
        });
        value.textContent = values.every(function (item) { return item === values[0]; })
          ? values[0] + 'px'
          : 'Mixed';
      }
    }
    overlay.querySelectorAll('.gvn-column-label').forEach(function (label) {
      if (state.selectedColumns[label.getAttribute('data-column')]) {
        label.setAttribute('data-selected', 'true');
      } else {
        label.removeAttribute('data-selected');
      }
    });
    var mastheadTitle = overlay.querySelector('.gvn-masthead-title');
    if (mastheadTitle) {
      if (state.selectedColumns.inbox) mastheadTitle.setAttribute('data-selected', 'true');
      else mastheadTitle.removeAttribute('data-selected');
    }
    overlay.querySelectorAll('.gvn-column-check').forEach(function (checkbox) {
      checkbox.checked = !!state.selectedColumns[checkbox.getAttribute('data-column')];
    });
    var selectAll = overlay.querySelector('.gvn-select-all');
    if (selectAll) {
      selectAll.setAttribute('aria-label', 'Select all columns for size changes');
      var selectedColumnCount = COLUMN_NAMES.filter(function (column) {
        return !!state.selectedColumns[column];
      }).length;
      selectAll.checked = selectedColumnCount === COLUMN_NAMES.length;
      selectAll.indeterminate =
        selectedColumnCount > 0 && selectedColumnCount < COLUMN_NAMES.length;
    }
    overlay.querySelectorAll('[data-style-toggle]').forEach(function (button) {
      var property = button.getAttribute('data-style-toggle');
      var keys = selected.map(function (item) {
        return item.definition[property];
      }).filter(Boolean);
      var allActive = keys.length > 0 && keys.every(function (key) {
        return !!state.settings[key];
      });
      button.disabled = !keys.length;
      button.setAttribute('aria-pressed', String(allActive));
      if (allActive) button.setAttribute('data-active', 'true');
      else button.removeAttribute('data-active');
    });
    overlay.querySelectorAll('[data-style-adjust]').forEach(function (button) {
      var property = button.getAttribute('data-style-adjust');
      button.disabled = !selected.some(function (item) {
        return !!item.definition[property];
      });
    });
    overlay.querySelectorAll('[data-style-value]').forEach(function (output) {
      if (document.activeElement === output) return;
      var property = output.getAttribute('data-style-value');
      var keys = selected.map(function (item) {
        return item.definition[property];
      }).filter(Boolean);
      if (!keys.length) {
        output.textContent = '--';
        return;
      }
      var values = keys.map(function (key) {
        return Math.round(Number(state.settings[key]) * 10) / 10;
      });
      output.textContent = values.every(function (item) { return item === values[0]; })
        ? values[0] + 'px'
        : 'Mixed';
    });
  }

  function adjustSelectedTypography(event) {
    event.preventDefault();
    event.stopPropagation();
    var delta = Number(event.currentTarget.getAttribute('data-delta')) || 0;
    if (state.editingLabels) {
      adjustSelectedLabelSize(delta);
      return;
    }
    var selected = selectedTypography();
    if (!selected.length) return;
    var next = Object.assign({}, state.settings);
    var keys = [];
    selected.forEach(function (item) {
      var key = item.definition.size;
      next[key] = Number(state.settings[key]) + delta;
      keys.push(key);
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
    updateTypeEditor();
  }

  function toggleSelectedStyle(event) {
    event.preventDefault();
    event.stopPropagation();
    var property = event.currentTarget.getAttribute('data-style-toggle');
    if (state.editingLabels) {
      toggleSelectedLabelStyle(property);
      return;
    }
    var keys = selectedTypography().map(function (item) {
      return item.definition[property];
    }).filter(Boolean);
    if (!keys.length) return;
    var nextValue = !keys.every(function (key) {
      return !!state.settings[key];
    });
    var next = Object.assign({}, state.settings);
    keys.forEach(function (key) {
      next[key] = nextValue;
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
    updateTypeEditor();
  }

  function adjustSelectedStyle(event) {
    event.preventDefault();
    event.stopPropagation();
    var property = event.currentTarget.getAttribute('data-style-adjust');
    var delta = Number(event.currentTarget.getAttribute('data-delta')) || 0;
    var keys = selectedTypography().map(function (item) {
      return item.definition[property];
    }).filter(Boolean);
    if (!keys.length) return;
    var next = Object.assign({}, state.settings);
    keys.forEach(function (key) {
      next[key] = Number(state.settings[key]) + delta;
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
    updateTypeEditor();
  }

  function startInboxDrag(event) {
    if (!state.editing || state.editingLabels) return;
    event.preventDefault();
    event.stopPropagation();
    state.selectedColumn = 'inbox';
    state.selectedColumns = { inbox: true };
    updateTypeEditor();
    state.drag = {
      type: 'inbox',
      key: 'inboxOffset',
      element: event.currentTarget,
      startX: event.clientX,
      startValue: Number(state.settings.inboxOffset)
    };
    var overlay = ensureOverlay();
    overlay.setAttribute('data-dragging', 'true');
    event.currentTarget.setAttribute('data-active', 'true');
    if (event.currentTarget.setPointerCapture) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) {}
    }
  }

  function moveInboxWithKeyboard(event) {
    if (
      !state.editing ||
      state.editingLabels ||
      !['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    var next = Object.assign({}, state.settings);
    if (event.key === 'Home') next.inboxOffset = 0;
    else {
      next.inboxOffset = Number(state.settings.inboxOffset) +
        (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 16 : 4);
    }
    state.settings = Core.normalizeSettings(next);
    scheduleRefresh();
    saveLayoutSetting('inboxOffset');
  }

  function startColumnDrag(event) {
    if (!state.editing || state.editingLabels) return;
    var key = event.currentTarget.getAttribute('data-setting');
    if (!Object.prototype.hasOwnProperty.call(state.settings, key)) return;
    event.preventDefault();
    event.stopPropagation();
    var column = event.currentTarget.getAttribute('data-column');
    var linked = state.selectedColumns[column] && COLUMN_LAYOUT_SETTINGS[column];
    var linkedElement = linked
      ? ensureOverlay().querySelector(
        '.gvn-column-label[data-column="' + column + '"]'
      )
      : null;
    var linkedLeft = linkedElement
      ? Number.parseFloat(linkedElement.style.left)
      : NaN;
    state.drag = {
      type: 'boundary',
      key: key,
      startX: event.clientX,
      startValue: Number(state.settings[key]),
      linkedKey: linked ? linked.header : null,
      linkedStartValue: Number.isFinite(linkedLeft)
        ? linkedLeft
        : linkedElement
          ? linkedElement.offsetLeft
          : null,
      linkedMaximum: linkedElement
        ? Math.max(0, linkedElement.parentElement.clientWidth - linkedElement.offsetWidth)
        : null
    };
    var overlay = ensureOverlay();
    overlay.setAttribute('data-dragging', 'true');
    event.currentTarget.setAttribute('data-active', 'true');
  }

  function startHeaderDrag(event) {
    if (!state.editing || state.editingLabels) return;
    var key = event.currentTarget.getAttribute('data-position-setting');
    if (!Object.prototype.hasOwnProperty.call(state.settings, key)) return;
    event.preventDefault();
    event.stopPropagation();
    var column = event.currentTarget.getAttribute('data-column') || 'sender';
    state.selectedColumn = column;
    var linked = state.selectedColumns[column] && COLUMN_LAYOUT_SETTINGS[column];
    var left = Number.parseFloat(event.currentTarget.style.left);
    state.drag = {
      type: 'header',
      key: key,
      element: event.currentTarget,
      startX: event.clientX,
      startValue: Number.isFinite(left) ? left : event.currentTarget.offsetLeft,
      linkedKey: linked ? linked.boundary : null,
      linkedStartValue: linked ? Number(state.settings[linked.boundary]) : null
    };
    var overlay = ensureOverlay();
    overlay.setAttribute('data-dragging', 'true');
    event.currentTarget.setAttribute('data-active', 'true');
    if (event.currentTarget.setPointerCapture) {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) {}
    }
  }

  function moveColumnDrag(event) {
    if (!state.drag) return;
    event.preventDefault();
    var delta = event.clientX - state.drag.startX;
    if (state.drag.type === 'sidebar') {
      var sidebarMaximum = Math.max(240, Math.min(720, window.innerWidth - 520));
      var sidebarNext = Object.assign({}, state.settings);
      sidebarNext.sidebarWidth = Math.max(
        180,
        Math.min(sidebarMaximum, state.drag.startValue + delta)
      );
      state.settings = Core.normalizeSettings(sidebarNext);
      updateRootFlags();
      positionSidebarResizer();
      scheduleRefresh();
      return;
    }
    if (state.drag.type === 'editor-scale') {
      var editorNext = Object.assign({}, state.settings);
      editorNext.editorScale = state.drag.startValue + delta / 600;
      state.settings = Core.normalizeSettings(editorNext);
      installStyle();
      scheduleRefresh();
      return;
    }
    if (state.drag.type === 'inbox') {
      var masthead = state.drag.element.parentElement;
      var maximum = Math.max(
        0,
        (masthead.clientWidth - state.drag.element.offsetWidth) / 2
      );
      var inboxNext = Object.assign({}, state.settings);
      inboxNext.inboxOffset = Math.max(
        -maximum,
        Math.min(maximum, state.drag.startValue + delta)
      );
      state.settings = Core.normalizeSettings(inboxNext);
      scheduleRefresh();
      return;
    }
    if (state.drag.type === 'header') {
      var columns = state.drag.element.parentElement;
      var maximum = Math.max(0, columns.clientWidth - state.drag.element.offsetWidth);
      var headerValue = Math.max(0, Math.min(maximum, state.drag.startValue + delta));
      var appliedDelta = headerValue - state.drag.startValue;
      var headerNext = Object.assign({}, state.settings);
      headerNext[state.drag.key] = headerValue;
      if (state.drag.linkedKey) {
        headerNext[state.drag.linkedKey] = state.drag.linkedStartValue + appliedDelta;
      }
      state.settings = Core.normalizeSettings(headerNext);
      if (state.drag.linkedKey) installStyle();
      scheduleRefresh();
      return;
    }
    var appliedBoundaryDelta = state.drag.key === 'rightInset' ? -delta : delta;
    if (state.drag.linkedKey && Number.isFinite(state.drag.linkedStartValue)) {
      var linkedValue = Math.max(
        0,
        Math.min(
          state.drag.linkedMaximum,
          state.drag.linkedStartValue + appliedBoundaryDelta
        )
      );
      appliedBoundaryDelta = linkedValue - state.drag.linkedStartValue;
    }
    var nextValue = state.drag.startValue + appliedBoundaryDelta;
    var next = Object.assign({}, state.settings);
    next[state.drag.key] = nextValue;
    if (state.drag.linkedKey) {
      next[state.drag.linkedKey] = state.drag.linkedStartValue + appliedBoundaryDelta;
    }
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
  }

  function finishColumnDrag() {
    if (!state.drag) return;
    var keys = [state.drag.key];
    if (state.drag.linkedKey) keys.push(state.drag.linkedKey);
    state.drag = null;
    var overlay = ensureOverlay();
    overlay.setAttribute('data-dragging', 'false');
    overlay.querySelectorAll('[data-active="true"]').forEach(function (element) {
      element.removeAttribute('data-active');
    });
    var sidebarHandle = document.getElementById('gmail-view-next-sidebar-resizer');
    if (sidebarHandle) sidebarHandle.removeAttribute('data-active');
    var editorHandle = overlay.querySelector('.gvn-editor-resizer');
    if (editorHandle) editorHandle.removeAttribute('data-active');
    saveLayoutSettings(keys);
  }

  function saveLayoutSetting(key) {
    saveLayoutSettings([key]);
  }

  function saveLayoutSettings(keys) {
    var update = {};
    keys.forEach(function (key) {
      update[key] = state.settings[key];
    });
    safeStorageSet('sync', update, function (error) {
      reportApiError('Could not save layout setting.', error);
    });
  }

  function moveColumnWithKeyboard(event) {
    if (
      !state.editing ||
      state.editingLabels ||
      (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
    ) {
      return;
    }
    event.preventDefault();
    var key = event.currentTarget.getAttribute('data-setting');
    var column = event.currentTarget.getAttribute('data-column');
    var linked = state.selectedColumns[column] && COLUMN_LAYOUT_SETTINGS[column];
    var direction = event.key === 'ArrowRight' ? 1 : -1;
    if (key === 'rightInset') direction *= -1;
    var delta = direction * (event.shiftKey ? 16 : 4);
    var next = Object.assign({}, state.settings);
    next[key] = Number(state.settings[key]) + delta;
    var keys = [key];
    if (linked) {
      var label = ensureOverlay().querySelector(
        '.gvn-column-label[data-column="' + column + '"]'
      );
      var current = label ? Number.parseFloat(label.style.left) : NaN;
      if (!Number.isFinite(current) && label) current = label.offsetLeft;
      if (Number.isFinite(current)) {
        var maximum = Math.max(0, label.parentElement.clientWidth - label.offsetWidth);
        var linkedValue = Math.max(0, Math.min(maximum, current + delta));
        var appliedDelta = linkedValue - current;
        next[key] = Number(state.settings[key]) + appliedDelta;
        next[linked.header] = linkedValue;
        keys.push(linked.header);
      }
    }
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
  }

  function moveHeaderWithKeyboard(event) {
    if (
      !state.editing ||
      state.editingLabels ||
      !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();
    var label = event.currentTarget;
    var key = label.getAttribute('data-position-setting');
    var column = label.getAttribute('data-column');
    var linked = state.selectedColumns[column] && COLUMN_LAYOUT_SETTINGS[column];
    var current = Number.parseFloat(label.style.left);
    if (!Number.isFinite(current)) current = label.offsetLeft;
    var maximum = Math.max(0, label.parentElement.clientWidth - label.offsetWidth);
    var step = event.shiftKey ? 16 : 4;
    var nextValue = current;
    if (event.key === 'Home') nextValue = 0;
    else if (event.key === 'End') nextValue = maximum;
    else nextValue += event.key === 'ArrowRight' ? step : -step;
    nextValue = Math.max(0, Math.min(maximum, nextValue));
    var next = Object.assign({}, state.settings);
    next[key] = nextValue;
    var keys = [key];
    if (linked) {
      next[linked.boundary] =
        Number(state.settings[linked.boundary]) + (nextValue - current);
      keys.push(linked.boundary);
    }
    state.settings = Core.normalizeSettings(next);
    if (linked) installStyle();
    scheduleRefresh();
    saveLayoutSettings(keys);
  }

  function clearRowDecorations() {
    document.querySelectorAll('[data-gvn-group]').forEach(function (node) {
      node.removeAttribute('data-gvn-group');
    });
    document.querySelectorAll('[data-gvn-logo]').forEach(function (node) {
      node.removeAttribute('data-gvn-logo');
      node.style.removeProperty('--gvn-logo');
    });
    document.querySelectorAll('[data-gvn-rule]').forEach(function (node) {
      node.removeAttribute('data-gvn-rule');
    });
    document.querySelectorAll('[data-gvn-domain]').forEach(function (node) {
      node.removeAttribute('data-gvn-domain');
      node.style.removeProperty('--gvn-domain-color');
    });
    document.querySelectorAll('[data-gvn-attach]').forEach(function (node) {
      node.removeAttribute('data-gvn-attach');
    });
    document.querySelectorAll('[data-gvn-highlight]').forEach(function (node) {
      node.removeAttribute('data-gvn-highlight');
      node.style.removeProperty('--gvn-highlight');
      node.style.removeProperty('--gvn-highlight-bg');
    });
    document.querySelectorAll('[data-gvn-peek]').forEach(function (node) {
      node.removeAttribute('data-gvn-peek');
      node.removeAttribute('title');
    });
    document.querySelectorAll('[data-gvn-freq]').forEach(function (node) {
      node.removeAttribute('data-gvn-freq');
    });
    document.querySelectorAll('[data-gvn-origdate]').forEach(function (node) {
      node.textContent = node.getAttribute('data-gvn-origdate');
      node.removeAttribute('data-gvn-origdate');
    });
    document.querySelectorAll('tr.zA .brd').forEach(function (node) {
      node.style.removeProperty('--gvn-attachment-shift');
    });
    document.querySelectorAll('.gvn-column-divider').forEach(function (node) {
      node.remove();
    });
    var globalDividers = document.getElementById('gmail-view-next-global-dividers');
    if (globalDividers) globalDividers.remove();
    var dividers = document.getElementById('gmail-view-next-dividers');
    if (dividers) dividers.remove();
    removeFrontPage();
  }

  function clearLabelDecorations() {
    document.querySelectorAll('[data-gvn-label-entry="true"]').forEach(function (entry) {
      entry.removeAttribute('data-gvn-label-entry');
      entry.removeAttribute('data-gvn-label');
      entry.removeAttribute('data-gvn-sublabel');
      entry.removeAttribute('data-gvn-label-unread');
      entry.style.removeProperty('--gvn-label-font-size');
      entry.style.removeProperty('--gvn-label-font-weight');
      entry.style.removeProperty('--gvn-label-font-style');
      entry.style.removeProperty('--gvn-label-row');
      var checkbox = entry.querySelector('.gvn-label-check');
      if (checkbox) checkbox.remove();
      var swatch = entry.querySelector(Adapter.SELECTORS.labelSwatch);
      if (swatch) swatch.style.removeProperty('--gvn-label-color');
    });
    document.querySelectorAll('.gvn-label-count').forEach(function (badge) {
      badge.remove();
    });
    state.labelHeader = null;
  }

  var FRONTPAGE_ID = 'gmail-view-next-frontpage';
  var QUICK_FILTERS = [
    { key: 'unread', label: 'Unread', query: 'is:unread in:inbox' },
    { key: 'attach', label: 'Attachments', query: 'has:attachment in:inbox' },
    { key: 'today', label: 'Today', query: 'newer_than:1d in:inbox' },
    { key: 'all', label: 'All mail', query: '' }
  ];
  // Cleanup wizard: one-click searches that tee up Gmail's own bulk select +
  // archive/delete. We only navigate — we never delete anything ourselves.
  var CLEANUP_SEARCHES = [
    { label: 'Old promotions', query: 'category:promotions older_than:30d' },
    { label: 'Old social', query: 'category:social older_than:30d' },
    { label: 'Newsletters', query: '"unsubscribe" older_than:30d' },
    { label: 'Large (>5MB)', query: 'larger:5M' },
    { label: 'Unread promos', query: 'category:promotions is:unread older_than:14d' }
  ];

  function removeFrontPage() {
    var existing = document.getElementById(FRONTPAGE_ID);
    if (existing) existing.remove();
  }

  // Apply a sender rule (vip/mute/hide) for a whole domain in one click — the
  // "bulk sender action": it tags every message from that sender. Clicking the
  // same rule again clears it. Reuses the same store the Options editor writes.
  function applySenderRuleQuick(domain, rule) {
    var clean = String(domain || '').trim().toLowerCase();
    if (!clean || !Core.SENDER_RULES[rule]) return;
    var next = Object.assign({}, state.senderRules);
    if (next[clean] === rule) delete next[clean];
    else next[clean] = rule;
    state.senderRules = Core.normalizeSenderRules(next);
    var payload = {};
    payload[SENDER_RULES_KEY] = state.senderRules;
    safeStorageSet('local', payload, function (error) {
      reportApiError('Could not save sender rule.', error);
    });
    scheduleRefresh();
  }

  function onFrontPageClick(event) {
    var act = event.target.closest('[data-gvn-rule-domain]');
    if (act) {
      applySenderRuleQuick(
        act.getAttribute('data-gvn-rule-domain'),
        act.getAttribute('data-gvn-rule-set')
      );
      return;
    }
    var nav = event.target.closest('[data-gvn-search]');
    if (nav) {
      var hash = nav.getAttribute('data-gvn-search');
      if (hash && location.hash !== hash) location.hash = hash;
    }
  }

  function fpFilterButton(label, query) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gvn-fp-filter';
    btn.textContent = label;
    btn.setAttribute('data-gvn-search', Core.gmailSearchHash(query));
    return btn;
  }

  function fpRuleButton(domain, rule, label) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gvn-fp-act';
    btn.textContent = label;
    btn.title = label + ' all mail from ' + domain;
    btn.setAttribute('data-gvn-rule-domain', domain);
    btn.setAttribute('data-gvn-rule-set', rule);
    return btn;
  }

  function fpStat(label, value) {
    var box = document.createElement('div');
    box.className = 'gvn-fp-stat';
    var num = document.createElement('span');
    num.className = 'gvn-fp-stat-num';
    num.textContent = String(value);
    var cap = document.createElement('span');
    cap.className = 'gvn-fp-stat-cap';
    cap.textContent = label;
    box.appendChild(num);
    box.appendChild(cap);
    return box;
  }

  function fpBarRow(label, count, unread, max) {
    var line = document.createElement('div');
    line.className = 'gvn-fp-bar-row';
    var name = document.createElement('span');
    name.className = 'gvn-fp-bar-label';
    name.textContent = label;
    name.title = label;
    var track = document.createElement('span');
    track.className = 'gvn-fp-bar-track';
    var fill = document.createElement('span');
    fill.className = 'gvn-fp-bar-fill';
    var pct = max > 0 ? Math.round((count / max) * 100) : 0;
    fill.style.width = Math.max(2, pct) + '%';
    track.appendChild(fill);
    var value = document.createElement('span');
    value.className = 'gvn-fp-bar-value';
    value.textContent = unread > 0 ? count + ' (' + unread + ' new)' : String(count);
    line.appendChild(name);
    line.appendChild(track);
    line.appendChild(value);
    return line;
  }

  function fpSection(title) {
    var section = document.createElement('div');
    section.className = 'gvn-fp-section';
    var heading = document.createElement('div');
    heading.className = 'gvn-fp-heading';
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }

  // Front-page briefing + stats: an opt-in newspaper "front page" rendered in
  // normal flow directly above the inbox table. Re-ensured each refresh so it
  // survives Gmail re-rendering; removed cleanly when both toggles are off.
  function renderFrontPage() {
    var wantDigest = state.settings.showDigest;
    var wantStats = state.settings.showStats;
    var wantFilters = state.settings.showQuickFilters;
    var wantCleanup = state.settings.showCleanup;
    var wantLegend = state.settings.groupByDomain;
    var savedViews = state.savedViews || [];
    if (!wantDigest && !wantStats && !wantFilters && !wantCleanup && !savedViews.length) {
      removeFrontPage();
      return;
    }
    var table = Adapter.locateInbox().table;
    if (!table || !table.parentElement) {
      removeFrontPage();
      return;
    }

    var summary = Core.summarizeInbox(state.inboxRecords, { topLimit: 5 });
    if (!summary.total) {
      removeFrontPage();
      return;
    }

    // A content signature keeps the rebuild idempotent: refresh() runs on a
    // MutationObserver loop, so re-appending nodes every frame would re-trigger
    // the observer forever. We only repaint when the numbers actually change.
    var signature = [
      wantDigest ? 'd' : '', wantStats ? 's' : '', wantFilters ? 'q' : '',
      wantCleanup ? 'c' : '', wantLegend ? 'g' : '',
      Core.vipDomainsQuery(state.senderRules) ? 'v' : '',
      savedViews.map(function (view) { return view.name; }).join(','),
      summary.total, summary.unread, summary.senderCount,
      summary.topSenders.map(function (s) { return s.key + ':' + s.count + ':' + s.unread; }).join(','),
      summary.groups.map(function (g) { return g.name + ':' + g.count + ':' + g.unread; }).join(',')
    ].join('|');

    var panel = document.getElementById(FRONTPAGE_ID);
    if (!panel) {
      panel = document.createElement('section');
      panel.id = FRONTPAGE_ID;
      panel.setAttribute('aria-label', 'Inbox front page');
      panel.addEventListener('click', onFrontPageClick);
    }
    if (panel.nextSibling !== table) {
      table.parentElement.insertBefore(panel, table);
    }
    if (panel.getAttribute('data-gvn-sig') === signature) return;
    panel.setAttribute('data-gvn-sig', signature);
    panel.textContent = '';

    if (wantFilters) {
      var filters = document.createElement('div');
      filters.className = 'gvn-fp-filters';
      var filtersLabel = document.createElement('span');
      filtersLabel.className = 'gvn-fp-filters-label';
      filtersLabel.textContent = 'Jump to';
      filters.appendChild(filtersLabel);
      var vipQuery = Core.vipDomainsQuery(state.senderRules);
      if (vipQuery) filters.appendChild(fpFilterButton('VIPs', vipQuery));
      QUICK_FILTERS.forEach(function (filter) {
        filters.appendChild(fpFilterButton(filter.label, filter.query));
      });
      panel.appendChild(filters);
    }

    if (savedViews.length) {
      var viewsRow = document.createElement('div');
      viewsRow.className = 'gvn-fp-filters';
      var viewsLabel = document.createElement('span');
      viewsLabel.className = 'gvn-fp-filters-label';
      viewsLabel.textContent = 'Saved views';
      viewsRow.appendChild(viewsLabel);
      savedViews.forEach(function (view) {
        viewsRow.appendChild(fpFilterButton(view.name, view.query));
      });
      panel.appendChild(viewsRow);
    }

    if (wantCleanup) {
      var cleanup = document.createElement('div');
      cleanup.className = 'gvn-fp-filters';
      var cleanupLabel = document.createElement('span');
      cleanupLabel.className = 'gvn-fp-filters-label';
      cleanupLabel.textContent = 'Clean up';
      cleanup.appendChild(cleanupLabel);
      CLEANUP_SEARCHES.forEach(function (item) {
        cleanup.appendChild(fpFilterButton(item.label, item.query));
      });
      panel.appendChild(cleanup);
    }

    if (wantDigest) {
      var digest = document.createElement('div');
      digest.className = 'gvn-fp-digest';
      var stats = document.createElement('div');
      stats.className = 'gvn-fp-stats';
      stats.appendChild(fpStat('in view', summary.total));
      stats.appendChild(fpStat('unread', summary.unread));
      stats.appendChild(fpStat('senders', summary.senderCount));
      digest.appendChild(stats);

      if (summary.topSenders.length) {
        var lead = document.createElement('div');
        lead.className = 'gvn-fp-lead';
        var leadLabel = document.createElement('span');
        leadLabel.className = 'gvn-fp-lead-label';
        leadLabel.textContent = 'Top of the pile';
        lead.appendChild(leadLabel);
        summary.topSenders.slice(0, 4).forEach(function (sender) {
          var chip = document.createElement('span');
          chip.className = 'gvn-fp-chip';
          chip.textContent = sender.label + ' · ' + sender.count;
          chip.title = sender.domain
            ? 'Show all mail from ' + sender.label
            : sender.label + ' — ' + sender.count + ' messages, ' + sender.unread + ' unread';
          if (sender.domain) {
            chip.setAttribute('data-gvn-search',
              Core.gmailSearchHash('from:' + sender.domain + ' in:inbox'));
          }
          lead.appendChild(chip);
        });
        digest.appendChild(lead);
      }
      panel.appendChild(digest);
    }

    if (wantStats) {
      var grid = document.createElement('div');
      grid.className = 'gvn-fp-grid';

      var sendersSection = fpSection('Busiest senders');
      var maxSender = summary.topSenders.reduce(function (m, s) {
        return Math.max(m, s.count);
      }, 0);
      summary.topSenders.forEach(function (sender) {
        var row = fpBarRow(sender.label, sender.count, sender.unread, maxSender);
        if (sender.domain) {
          var nameEl = row.querySelector('.gvn-fp-bar-label');
          if (nameEl) {
            nameEl.setAttribute('data-gvn-search',
              Core.gmailSearchHash('from:' + sender.domain + ' in:inbox'));
          }
          var acts = document.createElement('span');
          acts.className = 'gvn-fp-acts';
          acts.appendChild(fpRuleButton(sender.domain, 'vip', 'VIP'));
          acts.appendChild(fpRuleButton(sender.domain, 'mute', 'Mute'));
          acts.appendChild(fpRuleButton(sender.domain, 'hide', 'Hide'));
          row.appendChild(acts);
        }
        sendersSection.appendChild(row);
      });
      grid.appendChild(sendersSection);

      var periodSection = fpSection('Activity by period');
      var maxGroup = summary.groups.reduce(function (m, g) {
        return Math.max(m, g.count);
      }, 0);
      summary.groups.slice(0, 6).forEach(function (group) {
        periodSection.appendChild(
          fpBarRow(group.name, group.count, group.unread, maxGroup)
        );
      });
      grid.appendChild(periodSection);

      panel.appendChild(grid);
    }

    if (wantLegend && summary.topSenders.length) {
      var legend = document.createElement('div');
      legend.className = 'gvn-fp-legend';
      var legendLabel = document.createElement('span');
      legendLabel.className = 'gvn-fp-filters-label';
      legendLabel.textContent = 'Company colours';
      legend.appendChild(legendLabel);
      summary.topSenders.forEach(function (sender) {
        if (!sender.domain) return;
        var item = document.createElement('span');
        item.className = 'gvn-fp-legend-item';
        var swatch = document.createElement('span');
        swatch.className = 'gvn-fp-legend-swatch';
        swatch.style.background = Core.stableColor(sender.domain);
        var nameEl = document.createElement('span');
        nameEl.textContent = sender.domain;
        item.appendChild(swatch);
        item.appendChild(nameEl);
        legend.appendChild(item);
      });
      panel.appendChild(legend);
    }
  }

  function decorateRows(rows) {
    var now = new Date();
    var previousGroup = null;
    var records = [];
    var partsList = rows.map(function (row) {
      return Adapter.rowParts(row);
    });
    var groups = partsList.map(function (parts) {
      return Core.groupForCandidates(Adapter.dateCandidates(parts), now);
    });
    var unreadByGroup = {};
    rows.forEach(function (row, index) {
      if (row.matches(Adapter.SELECTORS.unreadRow)) {
        unreadByGroup[groups[index]] = (unreadByGroup[groups[index]] || 0) + 1;
      }
    });
    var senderCounts = {};
    partsList.forEach(function (parts) {
      var s = Adapter.senderData(parts);
      var key = String(s.email || s.name || '').toLowerCase();
      if (key) senderCounts[key] = (senderCounts[key] || 0) + 1;
    });

    rows.forEach(function (row, index) {
      var parts = partsList[index];
      var group = groups[index];
      var isGroupStart = group !== previousGroup;
      row.removeAttribute('data-gvn-group');
      if (parts.contentCell) parts.contentCell.removeAttribute('data-gvn-group');

      if (isGroupStart) {
        var unread = unreadByGroup[group] || 0;
        var display = state.settings.groupUnreadCounts && unread > 0
          ? group + ' — ' + unread + ' NEW'
          : group;
        row.setAttribute('data-gvn-group', display);
        if (parts.contentCell) parts.contentCell.setAttribute('data-gvn-group', display);
        previousGroup = group;
      }

      var sender = Adapter.senderData(parts);
      var at = sender.email.lastIndexOf('@');
      var domain = at >= 0 ? rootDomain(sender.email.slice(at + 1).toLowerCase()) : '';
      if (parts.contentTrack) {
        parts.contentTrack.setAttribute('data-gvn-logo', 'true');
        applyLogo(parts.contentTrack, domain);
      }

      var rule = Core.senderRuleFor(state.senderRules, domain);
      if (rule) row.setAttribute('data-gvn-rule', rule);
      else row.removeAttribute('data-gvn-rule');

      // Group-by-company: a stable colour bar on the sender column keyed to the
      // domain, so mail from the same company shares a colour and clusters
      // visually without reordering Gmail's rows.
      if (state.settings.groupByDomain && domain) {
        row.setAttribute('data-gvn-domain', 'true');
        row.style.setProperty('--gvn-domain-color', Core.stableColor(domain));
      } else {
        row.removeAttribute('data-gvn-domain');
        row.style.removeProperty('--gvn-domain-color');
      }

      if (parts.attachments) row.setAttribute('data-gvn-attach', 'true');
      else row.removeAttribute('data-gvn-attach');

      // Highlight rules: tint a row whose sender/subject contains a term.
      if (state.highlightRules.length) {
        var subjectStr = parts.subject ? String(parts.subject.textContent || '') : '';
        var hlColor = Core.highlightColor(
          state.highlightRules, sender.name + ' ' + sender.email + ' ' + subjectStr
        );
        if (hlColor) {
          row.setAttribute('data-gvn-highlight', 'true');
          row.style.setProperty('--gvn-highlight', hlColor);
          row.style.setProperty('--gvn-highlight-bg', hexToRgba(hlColor, 0.14));
        } else {
          row.removeAttribute('data-gvn-highlight');
          row.style.removeProperty('--gvn-highlight');
          row.style.removeProperty('--gvn-highlight-bg');
        }
      } else if (row.hasAttribute('data-gvn-highlight')) {
        row.removeAttribute('data-gvn-highlight');
        row.style.removeProperty('--gvn-highlight');
        row.style.removeProperty('--gvn-highlight-bg');
      }

      // Sender frequency: mark the sender name when they appear more than once
      // in the current view, e.g. "×3".
      if (parts.sender) {
        var freqKey = String(sender.email || sender.name || '').toLowerCase();
        var freq = freqKey ? senderCounts[freqKey] : 0;
        if (state.settings.senderFrequency && freq > 1) {
          parts.sender.setAttribute('data-gvn-freq', String(freq));
        } else {
          parts.sender.removeAttribute('data-gvn-freq');
        }
      }

      // Quick-peek: hovering the subject shows the full subject + snippet (the
      // fullest text the inbox page holds; the body loads only when opened).
      if (parts.subject) {
        if (state.settings.quickPeek) {
          var subjectText = String(parts.subject.textContent || '').trim();
          var previewText = parts.preview ? String(parts.preview.textContent || '').trim() : '';
          parts.subject.setAttribute('data-gvn-peek', 'true');
          parts.subject.title = previewText ? subjectText + '\n\n' + previewText : subjectText;
        } else if (parts.subject.getAttribute('data-gvn-peek') === 'true') {
          parts.subject.removeAttribute('data-gvn-peek');
          parts.subject.removeAttribute('title');
        }
      }

      // Relative dates: swap the innermost date span's text for "2h" / "Yesterday"
      // etc. Original kept in data-gvn-origdate; idempotent so it can't loop the
      // refresh observer, and restored when the option is off.
      if (parts.dateCell) {
        var dateSpans = parts.dateCell.querySelectorAll('span');
        var dateSpan = null;
        for (var di = dateSpans.length - 1; di >= 0; di--) {
          if (!dateSpans[di].querySelector('*')) { dateSpan = dateSpans[di]; break; }
        }
        if (dateSpan) {
          if (state.settings.relativeDates) {
            var parsed = Core.parseGmailDate(Adapter.dateCandidates(parts), now);
            var rel = parsed ? Core.relativeDate(parsed, now) : '';
            if (rel) {
              var orig = dateSpan.getAttribute('data-gvn-origdate');
              if (orig === null) {
                orig = dateSpan.textContent;
                dateSpan.setAttribute('data-gvn-origdate', orig);
              }
              var combined = orig + ' / ' + rel;
              if (dateSpan.textContent !== combined) dateSpan.textContent = combined;
            }
          } else if (dateSpan.hasAttribute('data-gvn-origdate')) {
            dateSpan.textContent = dateSpan.getAttribute('data-gvn-origdate');
            dateSpan.removeAttribute('data-gvn-origdate');
          }
        }
      }

      // Hidden senders are excluded from the briefing/stats so the numbers
      // match what the user actually sees in the list.
      if (rule !== 'hide') {
        records.push({
          name: sender.name,
          email: sender.email,
          domain: domain,
          unread: row.matches(Adapter.SELECTORS.unreadRow),
          group: group
        });
      }

      alignAttachments(parts);
    });

    state.inboxRecords = records;
  }

  function ensureGlobalDividers() {
    var container = document.getElementById('gmail-view-next-global-dividers');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'gmail-view-next-global-dividers';
    ['sender', 'time-sent', 'logo', 'subject', 'preview', 'date'].forEach(
      function (name) {
        var divider = document.createElement('i');
        divider.className = 'gvn-global-divider';
        divider.setAttribute('data-divider', name);
        divider.setAttribute('aria-hidden', 'true');
        container.appendChild(divider);
      }
    );
    document.body.appendChild(container);
    return container;
  }

  function positionGlobalDividers(row) {
    var container = ensureGlobalDividers();
    var mode = Core.routeMode(location.hash);
    if (!state.settings.enabled || mode !== 'inbox') {
      container.style.display = 'none';
      return;
    }

    var parts = Adapter.rowParts(row);
    if (
      !parts.senderCell ||
      !parts.contentCell ||
      !parts.contentTrack ||
      !parts.subject ||
      !parts.preview
    ) {
      container.style.display = 'none';
      return;
    }

    var senderRect = parts.senderCell.getBoundingClientRect();
    var senderTrackRect = parts.senderTrack
      ? parts.senderTrack.getBoundingClientRect()
      : senderRect;
    var contentRect = parts.contentCell.getBoundingClientRect();
    var trackRect = parts.contentTrack.getBoundingClientRect();
    var subjectRect = parts.subject.getBoundingClientRect();
    var previewRect = parts.preview.getBoundingClientRect();
    var dateRect = parts.dateCell
      ? parts.dateCell.getBoundingClientRect()
      : parts.actionCell
        ? parts.actionCell.getBoundingClientRect()
        : null;
    if (!dateRect) {
      container.style.display = 'none';
      return;
    }

    var inbox = Adapter.locateInbox();
    var viewportRect = inbox.viewport
      ? inbox.viewport.getBoundingClientRect()
      : { bottom: window.innerHeight };
    var rowRect = row.getBoundingClientRect();
    var top = Math.max(0, Math.round(rowRect.top - 26));
    var bottom = Math.min(
      window.innerHeight,
      viewportRect.bottom > 0 ? viewportRect.bottom : window.innerHeight
    );
    var height = Math.max(0, Math.round(bottom - top));
    var positions = {
      sender: senderTrackRect.left,
      'time-sent': contentRect.left - 72 + Number(state.settings.timeSentOffset),
      logo: trackRect.left + Number(state.settings.logoOffset),
      subject: subjectRect.left,
      preview: previewRect.left,
      date: dateRect.left + Number(state.settings.dateOffset)
    };

    Object.keys(positions).forEach(function (name) {
      var divider = container.querySelector('[data-divider="' + name + '"]');
      if (!divider) return;
      divider.style.left = Math.round(positions[name]) + 'px';
      divider.style.top = top + 'px';
      divider.style.height = height + 'px';
    });
    container.style.display = 'block';
  }

  function alignAttachments(parts) {
    if (!parts.attachments || !parts.subject) return;

    parts.attachments.style.removeProperty('--gvn-attachment-shift');
    var subjectText = parts.subject.querySelector('.bog') || parts.subject;
    var targetLeft = subjectText.getBoundingClientRect().left;
    var attachmentLeft = parts.attachments.getBoundingClientRect().left;
    var shift = Math.round(targetLeft - attachmentLeft);

    parts.attachments.style.setProperty('--gvn-attachment-shift', shift + 'px');
  }

  function rootDomain(host) {
    var parts = String(host || '').split('.').filter(Boolean);
    if (parts.length <= 2) return parts.join('.');
    var secondLevel = { co: true, com: true, org: true, net: true, gov: true, ac: true, or: true };
    if (secondLevel[parts[parts.length - 2]]) return parts.slice(-3).join('.');
    return parts.slice(-2).join('.');
  }

  function isNeutralColor(value) {
    var channels = String(value || '').match(/\d+/g);
    if (!channels || channels.length < 3) return true;
    var values = channels.slice(0, 3).map(Number);
    return Math.max.apply(Math, values) - Math.min.apply(Math, values) < 18;
  }

  function updateLabelActivity(items) {
    var today = localDayKey();
    var changed = false;
    if (state.labelActivityDay !== today) {
      state.labelActivityDay = today;
      state.labelActivity = {};
      state.labelSignals = {};
      changed = true;
    }

    var now = Date.now();
    items.forEach(function (item, index) {
      var signal = {
        count: Number(item.unreadCount) || 0,
        unread: !!item.unread
      };
      var previous = state.labelSignals[item.name];
      if (!previous) {
        if (signal.unread && !state.labelActivity[item.name]) {
          state.labelActivity[item.name] = now - index;
          changed = true;
        }
      } else if (
        signal.count > previous.count ||
        (signal.unread && !previous.unread)
      ) {
        state.labelActivity[item.name] = now;
        changed = true;
      }
      state.labelSignals[item.name] = signal;
    });

    if (changed) scheduleLabelActivitySave();
  }

  function pinIndexOf(name) {
    var pins = state.pinnedLabels || [];
    var lower = String(name || '').toLowerCase();
    for (var i = 0; i < pins.length; i++) {
      if (String(pins[i]).toLowerCase() === lower) return i;
    }
    return -1;
  }

  function applyLabelOrder(items) {
    if (state.sortingLabels) return;
    var byActivity = !!state.settings.sortLabelsByActivity;
    var hasPins = (state.pinnedLabels || []).length > 0;
    if (!byActivity && !hasPins) return;
    var groups = new Map();
    items.forEach(function (item, index) {
      if (!item.row || !item.row.parentElement) return;
      var parent = item.row.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      var group = groups.get(parent);
      if (!group.some(function (entry) { return entry.row === item.row; })) {
        group.push({
          row: item.row,
          name: item.name,
          index: index,
          activity: Number(state.labelActivity[item.name]) || 0,
          pinIndex: pinIndexOf(item.name)
        });
      }
    });

    groups.forEach(function (group, parent) {
      if (group.length < 2) return;
      var sorted = Core.orderLabels(group, { byActivity: byActivity });
      var changed = sorted.some(function (item, index) {
        return item.row !== group[index].row;
      });
      if (!changed) return;

      var lastRow = group[group.length - 1].row;
      var nextSibling = lastRow.nextSibling;
      var fragment = document.createDocumentFragment();
      sorted.forEach(function (item) {
        fragment.appendChild(item.row);
      });
      state.sortingLabels = true;
      parent.insertBefore(fragment, nextSibling);
      setTimeout(function () {
        state.sortingLabels = false;
      }, 0);
    });
  }

  function applyLabelTypography(item) {
    var stored = state.labelTypography[item.name] || {};
    var style = labelTypographyFor(item.name);
    item.entry.style.setProperty('--gvn-label-font-size', style.size + 'px');
    if (typeof stored.bold === 'boolean') {
      item.entry.style.setProperty(
        '--gvn-label-font-weight',
        stored.bold ? '700' : '400'
      );
    } else {
      item.entry.style.removeProperty('--gvn-label-font-weight');
    }
    if (typeof stored.italic === 'boolean') {
      item.entry.style.setProperty(
        '--gvn-label-font-style',
        stored.italic ? 'italic' : 'normal'
      );
    } else {
      item.entry.style.removeProperty('--gvn-label-font-style');
    }
  }

  function syncLabelCheckbox(item) {
    var checkbox = item.entry.querySelector('.gvn-label-check');
    if (!state.editingLabels) {
      if (checkbox) checkbox.remove();
      return;
    }
    if (!checkbox) {
      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'gvn-label-check';
      checkbox.addEventListener('pointerdown', stopCheckboxEvent);
      checkbox.addEventListener('click', stopCheckboxEvent);
      checkbox.addEventListener('change', toggleLabelSelection);
      item.entry.appendChild(checkbox);
    }
    checkbox.setAttribute('data-label-name', item.name);
    checkbox.setAttribute('aria-label', 'Select label ' + item.name);
    checkbox.checked = !!state.selectedLabels[item.name];
  }

  function decorateLabels() {
    var scoped = labelScopeInfo();
    var items = scoped.map(function (entry) { return entry.item; });
    // Roll unread up to parents: a top-level label counts as "has new mail" if
    // it OR any of the sub-labels immediately under it has unread mail. Subs
    // (indented) are the consecutive sub items following a parent.
    var effectiveUnread = scoped.map(function (s) { return s.item.unread === true; });
    scoped.forEach(function (scope, index) {
      if (scope.sub) return;
      var any = effectiveUnread[index];
      for (var j = index + 1; j < scoped.length && scoped[j].sub; j++) {
        if (scoped[j].item.unread) any = true;
      }
      effectiveUnread[index] = any;
    });
    scoped.forEach(function (scope, index) {
      var item = scope.item;
      item.entry.setAttribute('data-gvn-label-entry', 'true');
      applyLabelTypography(item);
      syncLabelCheckbox(item);
      // Flags for indent guides / new-mail glow / row tint.
      item.entry.setAttribute('data-gvn-sublabel', String(scope.sub === true));
      item.entry.setAttribute('data-gvn-label-unread', String(effectiveUnread[index] === true));
      var swatchColor = getComputedStyle(item.swatch).backgroundColor;
      var displayColor = isNeutralColor(swatchColor) ? Core.labelColor(item.name) : swatchColor;
      item.entry.style.setProperty('--gvn-label-row', displayColor);
      if (!state.settings.colorLabels) {
        item.entry.removeAttribute('data-gvn-label');
        item.swatch.style.removeProperty('--gvn-label-color');
        return;
      }
      if (SYSTEM_LABELS.test(item.name)) return;
      if (!isNeutralColor(swatchColor)) return;
      item.entry.setAttribute('data-gvn-label', 'true');
      item.swatch.style.setProperty('--gvn-label-color', Core.labelColor(item.name));
    });
    updateLabelActivity(items);
    applyLabelOrder(items);
    updateLabelCount(items.length);
    if (state.editingLabels) updateTypeEditor();
  }

  function updateLabelCount(count) {
    var nav = Adapter.locateSidebar();
    if (!nav) return;
    var existing = nav.querySelector('.gvn-label-count');
    if (existing) { existing.textContent = String(count); return; }
    var anchor = null;
    var anchorMode = '';
    var withAria = nav.querySelectorAll('[aria-label],[data-tooltip]');
    for (var i = 0; i < withAria.length; i++) {
      var a = (withAria[i].getAttribute('aria-label') || '') + ' ' + (withAria[i].getAttribute('data-tooltip') || '');
      if (/create\s+new\s+label|neues?\s+label/i.test(a)) { anchor = withAria[i]; anchorMode = 'before'; break; }
    }
    if (!anchor) {
      var nodes = nav.querySelectorAll('div,span,h2,h3');
      for (var j = 0; j < nodes.length; j++) {
        if (nodes[j].childElementCount === 0 && (nodes[j].textContent || '').trim() === 'Labels') { anchor = nodes[j]; anchorMode = 'after'; break; }
      }
    }
    if (!anchor) return;
    var badge = document.createElement('span');
    badge.className = 'gvn-label-count';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = String(count);
    if (anchorMode === 'before' && anchor.parentElement) anchor.parentElement.insertBefore(badge, anchor);
    else anchor.appendChild(badge);
  }

  function positionOverlay(firstRow) {
    var overlay = ensureOverlay();
    var layout = Adapter.layoutSnapshot(firstRow);
    if (!layout || layout.table.width < 100) {
      overlay.style.display = 'none';
      return;
    }

    var masthead = overlay.querySelector('.gvn-masthead');
    var columns = overlay.querySelector('.gvn-columns');
    var mastHeight = state.settings.masthead
      ? (state.editing ? editorMastheadHeight() : 34)
      : 0;
    var columnsTop = Math.max(layout.viewport.top, Math.round(layout.row.top - 26));
    var overlayTop = columnsTop - mastHeight;
    var left = Math.round(layout.table.left);
    var visibleRight = Math.min(
      window.innerWidth,
      layout.viewport.right > 0 ? layout.viewport.right : window.innerWidth
    );
    var visibleWidth = Math.max(320, Math.round(visibleRight - left - 16));
    var width = visibleWidth;
    var tableWidth = visibleWidth + 'px';
    if (document.documentElement.style.getPropertyValue('--gvn-table-width') !== tableWidth) {
      document.documentElement.style.setProperty('--gvn-table-width', tableWidth);
    }

    overlay.style.left = left + 'px';
    overlay.style.top = overlayTop + 'px';
    overlay.style.width = width + 'px';
    overlay.style.display = 'block';

    var mastheadTitle = masthead.querySelector('.gvn-masthead-title');
    mastheadTitle.textContent = state.settings.autoMasthead
      ? Core.viewTitle(location.hash, state.settings.masthead)
      : state.settings.masthead;
    mastheadTitle.style.left =
      'calc(50% + ' + Math.round(state.settings.inboxOffset) + 'px)';
    mastheadTitle.setAttribute(
      'aria-valuenow',
      String(Math.round(state.settings.inboxOffset))
    );
    masthead.style.display = state.settings.masthead ? 'block' : 'none';
    columns.style.display = 'block';
    updateTypeEditor();
    var editorResizer = overlay.querySelector('.gvn-editor-resizer');
    if (editorResizer) {
      editorResizer.setAttribute(
        'aria-valuenow',
        String(Math.round(Number(state.settings.editorScale) * 100))
      );
    }

    var dateWidth =
      window.innerWidth <= 1100 ? COMPACT_DATE_COLUMN_WIDTH : DATE_COLUMN_WIDTH;
    var handlePositions = {
      senderOffset: layout.senderTrack && layout.senderTrack.width > 0
        ? layout.senderTrack.left - layout.table.left
        : layout.senderText && layout.senderText.width > 0
          ? layout.senderText.left - layout.table.left
        : layout.sender.left - layout.table.left,
      timeSentOffset:
        layout.content.left - layout.table.left - 72 + state.settings.timeSentOffset,
      logoOffset: layout.track
        ? layout.track.left - layout.table.left + state.settings.logoOffset
        : layout.content.left - layout.table.left + state.settings.contentIndent,
      subjectGap: layout.subject
        ? layout.subject.left - layout.table.left
        : layout.content.left - layout.table.left + state.settings.contentIndent + state.settings.logoSize,
      previewOffset: layout.preview
        ? layout.preview.left - layout.table.left
        : layout.content.left - layout.table.left + state.settings.subjectWidth,
      dateOffset: width - dateWidth + state.settings.dateOffset
    };
    var defaultPositions = {
      sender: handlePositions.senderOffset + state.settings.senderTextGap,
      'time-sent': handlePositions.timeSentOffset + state.settings.groupTextGap,
      logo: handlePositions.logoOffset + state.settings.logoTextGap,
      subject: handlePositions.subjectGap + state.settings.subjectTextGap,
      preview: handlePositions.previewOffset + state.settings.previewTextGap,
      date: handlePositions.dateOffset + state.settings.dateTextGap
    };
    var positionSettings = {
      sender: 'headerSenderX',
      'time-sent': 'headerTimeSentX',
      logo: 'headerLogoX',
      subject: 'headerSubjectX',
      preview: 'headerPreviewX',
      date: 'headerDateX'
    };
    Object.keys(defaultPositions).forEach(function (key) {
      var label = columns.querySelector('[data-column="' + key + '"]');
      if (!label) return;
      var defaultLeft = defaultPositions[key];
      var savedLeft = Number(state.settings[positionSettings[key]]);
      var desiredLeft = savedLeft >= 0 ? savedLeft : defaultLeft;
      var maximum = Math.max(0, width - label.offsetWidth);
      if (key === 'date' && savedLeft < 0) {
        desiredLeft = Math.min(defaultLeft, maximum - 6);
      }
      var leftPosition = Math.max(0, Math.min(maximum, desiredLeft));
      label.style.right = 'auto';
      label.style.left = Math.round(leftPosition) + 'px';
      label.style.transform = '';
      label.setAttribute('aria-valuemax', String(Math.round(maximum)));
      label.setAttribute('aria-valuenow', String(Math.round(leftPosition)));
    });
    if (!state.editing || state.editingLabels) {
      var previewLabel = columns.querySelector('[data-column="preview"]');
      var dateLabel = columns.querySelector('[data-column="date"]');
      if (previewLabel && dateLabel) {
        var previewLeft = Number.parseFloat(previewLabel.style.left);
        var dateLeft = Number.parseFloat(dateLabel.style.left);
        var maximumPreviewLeft = Math.max(
          0,
          dateLeft - previewLabel.offsetWidth - 12
        );
        if (previewLeft > maximumPreviewLeft) {
          previewLabel.style.left = Math.round(maximumPreviewLeft) + 'px';
          previewLabel.setAttribute(
            'aria-valuenow',
            String(Math.round(maximumPreviewLeft))
          );
        }
      }
    }

    Object.keys(handlePositions).forEach(function (key) {
      var handle = columns.querySelector(
        '.gvn-resize-handle[data-setting="' + key + '"]'
      );
      if (!handle) return;
      handle.style.left = Math.round(handlePositions[key]) + 'px';
      handle.setAttribute('aria-valuenow', String(Math.round(state.settings[key])));
      var checkbox = columns.querySelector(
        '.gvn-column-check[data-setting="' + key + '"]'
      );
      if (checkbox) {
        var column = handle.getAttribute('data-column');
        var label = columns.querySelector(
          '.gvn-column-label[data-column="' + column + '"]'
        );
        var checkboxLeft = label
          ? Math.max(0, label.offsetLeft - 20)
          : Math.max(0, handlePositions[key] - 20);
        checkbox.style.left = Math.round(checkboxLeft) + 'px';
      }
    });
  }

  function watchTable() {
    var table = Adapter.locateInbox().table;
    if (table === state.lastTable) return;
    state.lastTable = table;
    if (state.resizeObserver) state.resizeObserver.disconnect();
    if (globalThis.ResizeObserver && table) {
      state.resizeObserver = new ResizeObserver(function () {
        scheduleRefresh();
      });
      state.resizeObserver.observe(table);
    }
  }

  // ----- Sender logos: real brand logo -> favicon -> coloured letter --------
  function faviconCss(domain) {
    return 'url("https://www.google.com/s2/favicons?sz=64&domain=' + domain + '")';
  }

  // Per-sender colour overrides (gmailViewNextLogoOverrides): a map of
  // domain -> #hex. Only well-formed hex colours for a cleaned domain are kept.
  function normalizeOverrides(value) {
    var out = {};
    if (!value || typeof value !== 'object') return out;
    Object.keys(value).forEach(function (key) {
      var domain = String(key || '').trim().toLowerCase().replace(/^www\./, '');
      var color = String(value[key] || '').trim();
      if (domain && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) {
        out[domain] = color;
      }
    });
    return out;
  }

  function overrideColor(domain) {
    if (!domain || !state.logoOverrides) return null;
    var clean = String(domain).replace(/^www\./, '').toLowerCase();
    return Object.prototype.hasOwnProperty.call(state.logoOverrides, clean)
      ? state.logoOverrides[clean]
      : null;
  }

  function monogramColor(domain) {
    var pinned = overrideColor(domain);
    if (pinned) return pinned;
    var hash = 0;
    for (var i = 0; i < domain.length; i++) {
      hash = (hash * 31 + domain.charCodeAt(i)) >>> 0;
    }
    return 'hsl(' + (hash % 360) + ',55%,45%)';
  }

  function monogramCss(domain) {
    var clean = domain.replace(/^www\./, '');
    var letter = (clean.charAt(0) || '?').toUpperCase();
    try {
      var canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = monogramColor(clean);
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, 32, 35);
      return 'url("' + canvas.toDataURL('image/png') + '")';
    } catch (error) {
      return faviconCss(domain);
    }
  }

  // Ask the service worker for the best logo, then cache it and repaint. Until it
  // answers we show the plain favicon so something appears immediately.
  //   dataUrl -> real brand logo / favicon ; none -> coloured letter tile ;
  //   error/unreachable -> KEEP the plain favicon (don't downgrade to a letter).
  function requestLogo(domain) {
    if (state.logoPending[domain]) return;
    state.logoPending[domain] = true;
    var settle = function (value) {
      state.logoCache[domain] = value;
      delete state.logoPending[domain];
      scheduleRefresh();
    };
    try {
      chrome.runtime.sendMessage({ type: 'gvn-logo', domain: domain }, function (response) {
        if (chrome.runtime && chrome.runtime.lastError) { settle(faviconCss(domain)); return; }
        if (response && response.dataUrl) settle('url("' + response.dataUrl + '")');
        else if (response && response.none) settle(monogramCss(domain));
        else settle(faviconCss(domain));
      });
    } catch (error) {
      settle(faviconCss(domain));
    }
  }

  function applyLogo(track, domain) {
    if (!domain) {
      track.style.removeProperty('--gvn-logo');
      return;
    }
    // A pinned sender colour always wins: show a clean letter tile in that
    // colour instead of any fetched logo.
    if (overrideColor(domain)) {
      track.style.setProperty('--gvn-logo', monogramCss(domain));
      return;
    }
    if (state.settings.richLogos === false) {
      track.style.setProperty('--gvn-logo', faviconCss(domain));
      return;
    }
    if (state.logoCache[domain]) {
      track.style.setProperty('--gvn-logo', state.logoCache[domain]);
    } else {
      track.style.setProperty('--gvn-logo', faviconCss(domain));
      requestLogo(domain);
    }
  }

  // ----- Inspector: copy Gmail's live layout HTML for debugging -----------
  function describeNode(el) {
    if (!el || !el.tagName) return '(none)';
    var cls = String(el.className || '').trim();
    return el.tagName.toLowerCase()
      + (cls ? '.' + cls.split(/\s+/).join('.') : '')
      + (el.getAttribute && el.getAttribute('role') ? '[role=' + el.getAttribute('role') + ']' : '');
  }

  function trimInspectHtml(html) {
    return String(html || '')
      .replace(/\s(?:style|jsaction|jsname|jslog|jscontroller|jsdata|data-ved)="[^"]*"/g, '')
      .slice(0, 5000);
  }

  function buildInspectReport() {
    var lines = [];
    var version = '?';
    try { version = chrome.runtime.getManifest().version; } catch (error) { /* ignore */ }
    lines.push('=== GmailView Inspector ===');
    lines.push('version: ' + version + '  hash: ' + location.hash);
    lines.push('window: ' + window.innerWidth + 'x' + window.innerHeight);
    lines.push('');
    lines.push('--- TABS (selector "' + Adapter.SELECTORS.tabs + '") ---');
    var tabs = document.querySelector(Adapter.SELECTORS.tabs);
    if (!tabs) {
      lines.push('NOT FOUND — the tabs selector may be out of date.');
    } else {
      var tr = tabs.getBoundingClientRect();
      lines.push('container: ' + describeNode(tabs)
        + '  left=' + Math.round(tr.left) + ' width=' + Math.round(tr.width));
      var tabEls = tabs.querySelectorAll('[role="tab"]');
      lines.push('role="tab" elements: ' + tabEls.length);
      Array.prototype.forEach.call(tabEls, function (el, i) {
        var r = el.getBoundingClientRect();
        lines.push('  [' + i + '] ' + describeNode(el)
          + ' aria-label="' + (el.getAttribute('aria-label') || '') + '"'
          + ' text="' + (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 24) + '"'
          + ' left=' + Math.round(r.left) + ' w=' + Math.round(r.width));
      });
      if (tabEls.length) {
        var chain = [];
        var node = tabEls[0];
        while (node && node !== tabs && chain.length < 8) {
          chain.push(describeNode(node));
          node = node.parentElement;
        }
        chain.push(describeNode(tabs));
        lines.push('ancestry (tab -> container): ' + chain.join(' < '));
      }
      lines.push('');
      lines.push('--- TABS outerHTML (trimmed) ---');
      lines.push(trimInspectHtml(tabs.outerHTML));
    }

    lines.push('');
    lines.push('--- SIDEBAR LABELS (how nesting is marked) ---');
    var labelList = [];
    try { labelList = Adapter.sidebarLabels(); } catch (error) { /* ignore */ }
    lines.push('count: ' + labelList.length);
    labelList.slice(0, 16).forEach(function (it, i) {
      var e = it.entry;
      var er = e.getBoundingClientRect();
      var swr = it.swatch ? it.swatch.getBoundingClientRect() : null;
      var link = e.closest ? e.closest('a[href]') : null;
      var lvlEl = e.closest ? e.closest('[aria-level]') : null;
      lines.push('  [' + i + '] "' + it.name + '"'
        + ' ' + describeNode(e)
        + ' role=' + (e.getAttribute('role') || '')
        + ' aria-level=' + (e.getAttribute('aria-level') || (lvlEl ? lvlEl.getAttribute('aria-level') : '') || '')
        + ' href=' + (((link && link.getAttribute('href')) || e.getAttribute('href')) || '')
        + ' entryLeft=' + Math.round(er.left)
        + ' swatchLeft=' + (swr ? Math.round(swr.left) : '-'));
    });
    if (labelList[1] && labelList[1].entry) {
      var chain = [];
      var node = labelList[1].entry;
      while (node && chain.length < 7) { chain.push(describeNode(node)); node = node.parentElement; }
      lines.push('  label[1] ancestry: ' + chain.join(' < '));
      lines.push('  label[1] outerHTML: ' + trimInspectHtml(labelList[1].entry.outerHTML).slice(0, 900));
    }
    return lines.join('\n');
  }

  function copyToClipboard(text, done) {
    var fallback = function () {
      try {
        var area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.top = '-1000px';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.focus();
        area.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(area);
        done(ok);
      } catch (error) {
        done(false);
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
    } else {
      fallback();
    }
  }

  function copyInspectReport(event) {
    if (event) event.stopPropagation();
    var button = event && event.currentTarget;
    var report = buildInspectReport();
    try { console.log(report); } catch (error) { /* ignore */ }
    copyToClipboard(report, function (ok) {
      if (!button) return;
      button.textContent = ok ? 'Copied!' : 'See console';
      setTimeout(function () { button.textContent = 'Inspect'; }, 1600);
    });
  }

  function mergeTabsRow() {
    var root = document.documentElement;
    var clear = function () {
      root.style.removeProperty('--gvn-tabs-top');
      root.style.removeProperty('--gvn-tabs-left');
      root.style.removeProperty('--gvn-tabs-width');
      root.style.removeProperty('--gvn-tabs-height');
    };
    if (
      !state.settings.enabled ||
      !state.settings.mergeTabsRow ||
      state.settings.hideTabs ||
      Core.routeMode(location.hash) !== 'inbox'
    ) {
      clear();
      return;
    }
    var tabs = document.querySelector(Adapter.SELECTORS.tabs);
    var toolbar = null;
    var bars = document.querySelectorAll(Adapter.SELECTORS.listToolbar);
    for (var i = 0; i < bars.length; i++) {
      var rect = bars[i].getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        toolbar = bars[i];
        break;
      }
    }
    if (!tabs || !toolbar) {
      clear();
      return;
    }
    var barRect = toolbar.getBoundingClientRect();
    var inboxParts = Adapter.locateInbox();
    var tableRect = inboxParts.table ? inboxParts.table.getBoundingClientRect() : barRect;
    // Centre the tab strip on the INBOX masthead and spread it as wide as the row
    // allows EQUALLY on both sides. With three tabs this puts the middle tab dead
    // centre (right above INBOX) and the outer two spaced evenly out toward the
    // Subject and Preview columns. The symmetric width keeps the middle tab locked
    // over INBOX. Reserve room on the left for the select / refresh / overflow
    // controls and on the right for the message count + nav arrows.
    // Anchor on the real INBOX element so the strip lines up with where INBOX is
    // actually drawn (the visible-area centre, which is right of the table's
    // geometric centre); fall back to the table centre if it isn't placed yet.
    var inboxTitle = document.querySelector('#gmail-view-next-ui .gvn-masthead-title');
    var inboxRect = inboxTitle ? inboxTitle.getBoundingClientRect() : null;
    var center = inboxRect && inboxRect.width > 0
      ? inboxRect.left + inboxRect.width / 2
      : tableRect.left + tableRect.width / 2 + Number(state.settings.inboxOffset || 0);
    var leftLimit = barRect.left + 170;
    var rightLimit = barRect.right - 180;
    var half = Math.max(120, Math.min(center - leftLimit, rightLimit - center));
    var width = Math.round(half * 2);
    var left = Math.round(center - half);
    root.style.setProperty('--gvn-tabs-top', Math.round(barRect.top) + 'px');
    root.style.setProperty('--gvn-tabs-left', left + 'px');
    root.style.setProperty('--gvn-tabs-width', width + 'px');
    root.style.setProperty('--gvn-tabs-height', Math.round(barRect.height) + 'px');
  }

  function hideHealthWarning() {
    var w = document.getElementById('gmail-view-next-health');
    if (w) w.remove();
  }

  function showHealthWarning() {
    if (document.getElementById('gmail-view-next-health')) return;
    var bar = document.createElement('div');
    bar.id = 'gmail-view-next-health';
    bar.setAttribute('role', 'status');
    var msg = document.createElement('span');
    msg.textContent = 'GmailView: Gmail’s layout looks different — the newspaper view may need a selector update.';
    bar.appendChild(msg);
    var dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', function () {
      state.healthDismissed = true;
      hideHealthWarning();
    });
    bar.appendChild(dismiss);
    document.body.appendChild(bar);
  }

  // Warning Insurance: if Gmail is loaded on the inbox route but our core
  // selectors find no table/rows for several seconds, warn instead of failing silently.
  function checkSelectorHealth() {
    if (state.healthDismissed) return;
    var inbox = Core.routeMode(location.hash) === 'inbox';
    var gmailLoaded = !!Adapter.locateSidebar();
    var healthy = !!Adapter.locateInbox().table || Adapter.findRows(document).length > 0;
    if (!state.settings.enabled || !inbox || !gmailLoaded || healthy) {
      state.firstHealthMiss = 0;
      hideHealthWarning();
      return;
    }
    var now = Date.now();
    if (!state.firstHealthMiss) {
      state.firstHealthMiss = now;
      if (!state.healthTimer) {
        state.healthTimer = setTimeout(function () {
          state.healthTimer = 0;
          scheduleRefresh();
        }, 6500);
      }
    } else if (now - state.firstHealthMiss > 6000) {
      showHealthWarning();
    }
  }

  function refresh() {
    state.frame = 0;
    if (state.destroyed) return;

    try {
      updateRootFlags();
      positionSidebarResizer();
      mergeTabsRow();
      checkSelectorHealth();
      var overlay = document.getElementById('gmail-view-next-ui');
      var mode = Core.routeMode(location.hash);
      if (state.settings.enabled) decorateLabels();
      if (!state.settings.enabled || mode !== 'inbox') {
        if (overlay) overlay.style.display = 'none';
        clearRowDecorations();
        if (!state.settings.enabled) clearLabelDecorations();
        return;
      }
      if (!licenseAllows()) {
        // Trial expired and not paid -> revert to plain Gmail + show upgrade.
        if (overlay) overlay.style.display = 'none';
        clearRowDecorations();
        showUpgradeBanner();
        return;
      }
      hideUpgradeBanner();

      var rows = Adapter.findRows(document);
      if (!rows.length) {
        if (overlay) overlay.style.display = 'none';
        return;
      }

      decorateRows(rows);
      renderFrontPage();
      positionOverlay(rows[0]);
      positionGlobalDividers(rows[0]);
      updateQuickButtons();
      watchTable();
    } catch (error) {
      logError('Refresh failed.', error);
    }
  }

  function scheduleRefresh() {
    if (state.frame || state.destroyed) return;
    state.frame = requestAnimationFrame(refresh);
  }

  function onStorageChanged(changes, area) {
    if (area === 'local') {
      if (changes[LOGO_OVERRIDES_KEY]) {
        state.logoOverrides = normalizeOverrides(changes[LOGO_OVERRIDES_KEY].newValue);
        scheduleRefresh();
      }
      if (changes[PINNED_LABELS_KEY]) {
        state.pinnedLabels = normalizePinned(changes[PINNED_LABELS_KEY].newValue);
        scheduleRefresh();
      }
      if (changes[SENDER_RULES_KEY]) {
        state.senderRules = Core.normalizeSenderRules(changes[SENDER_RULES_KEY].newValue);
        scheduleRefresh();
      }
      if (changes[SAVED_VIEWS_KEY]) {
        state.savedViews = Core.normalizeSavedViews(changes[SAVED_VIEWS_KEY].newValue);
        scheduleRefresh();
      }
      if (changes[HIGHLIGHT_RULES_KEY]) {
        state.highlightRules = Core.normalizeHighlightRules(changes[HIGHLIGHT_RULES_KEY].newValue);
        scheduleRefresh();
      }
      return;
    }
    if (area !== 'sync') return;
    var next = Object.assign({}, state.settings);
    Object.keys(changes).forEach(function (key) {
      next[key] = changes[key].newValue;
    });
    state.settings = Core.normalizeSettings(next);
    installStyle();
    scheduleRefresh();
  }

  function destroy() {
    state.destroyed = true;
    if (state.frame) cancelAnimationFrame(state.frame);
    if (state.labelActivitySaveTimer) clearTimeout(state.labelActivitySaveTimer);
    if (state.labelTypographySaveTimer) clearTimeout(state.labelTypographySaveTimer);
    if (state.healthTimer) clearTimeout(state.healthTimer);
    hideHealthWarning();
    hideUpgradeBanner();
    if (state.observer) state.observer.disconnect();
    if (state.resizeObserver) state.resizeObserver.disconnect();
    state.listeners.forEach(function (remove) { remove(); });
    var changeEvents = storageChangeEvents();
    if (changeEvents) {
      try {
        changeEvents.removeListener(onStorageChanged);
      } catch (error) {
        reportApiError('Could not remove the storage listener.', error);
      }
    }
    clearRowDecorations();
    clearLabelDecorations();
    document.documentElement.removeAttribute('data-gvn-active');
    document.documentElement.removeAttribute('data-gvn-route');
    document.documentElement.removeAttribute('data-gvn-hide-tabs');
    document.documentElement.removeAttribute('data-gvn-hide-tab-promotions');
    document.documentElement.removeAttribute('data-gvn-hide-tab-social');
    document.documentElement.removeAttribute('data-gvn-hide-tab-updates');
    document.documentElement.removeAttribute('data-gvn-hide-tab-forums');
    document.documentElement.removeAttribute('data-gvn-focus');
    document.documentElement.removeAttribute('data-gvn-zen');
    document.documentElement.removeAttribute('data-gvn-scifi');
    document.documentElement.removeAttribute('data-gvn-tab-order');
    document.documentElement.removeAttribute('data-gvn-hide-rail');
    document.documentElement.removeAttribute('data-gvn-color-labels');
    document.documentElement.removeAttribute('data-gvn-label-indent');
    document.documentElement.removeAttribute('data-gvn-label-tint');
    document.documentElement.removeAttribute('data-gvn-label-glow');
    document.documentElement.removeAttribute('data-gvn-label-editing');
    document.documentElement.removeAttribute('data-gvn-sidebar-sized');
    document.documentElement.style.removeProperty('--gvn-sidebar-width');
    document.documentElement.style.removeProperty('--gvn-table-width');
    document.documentElement.style.removeProperty('--gvn-tabs-top');
    document.documentElement.style.removeProperty('--gvn-tabs-left');
    document.documentElement.style.removeProperty('--gvn-tabs-width');
    document.documentElement.style.removeProperty('--gvn-tabs-height');
    clearSidebarTargets();
    var style = document.getElementById('gmail-view-next-css');
    var overlay = document.getElementById('gmail-view-next-ui');
    var sidebarHandle = document.getElementById('gmail-view-next-sidebar-resizer');
    var globalDividers = document.getElementById('gmail-view-next-global-dividers');
    var helpOverlay = document.getElementById('gmail-view-next-help-overlay');
    if (helpOverlay) helpOverlay.remove();
    var quickPanel = document.getElementById('gmail-view-next-quick');
    if (quickPanel) quickPanel.remove();
    if (style) style.remove();
    if (overlay) overlay.remove();
    if (sidebarHandle) sidebarHandle.remove();
    if (globalDividers) globalDividers.remove();
  }

  // ----- Licensing (15-day trial -> paid). OFF until ExtensionPay is wired. -----
  // Flip LICENSING.enabled to true AFTER: (1) extpay.js is bundled + the ExtPay
  // extension id is set, (2) plans + the FRIENDS-LIFE coupon exist. While false,
  // everything below is inert and the extension behaves as the free version.
  var LICENSING = {
    enabled: false,
    installedAt: 0,
    paid: false,
    state: 'trial',
    daysLeft: Core.TRIAL_DAYS,
    extpay: null
  };
  var INSTALL_KEY = 'gmailViewNextInstalledAt';

  function licenseAllows() {
    if (!LICENSING.enabled) return true;
    var s = Core.licenseState(LICENSING.installedAt, Date.now(), LICENSING.paid);
    LICENSING.state = s.state;
    LICENSING.daysLeft = s.daysLeft;
    return s.state !== 'expired';
  }

  function recordInstallDate() {
    safeStorageGet('local', INSTALL_KEY, function (stored, error) {
      if (error) return;
      var at = stored && Number(stored[INSTALL_KEY]);
      if (at && Number.isFinite(at)) {
        LICENSING.installedAt = at;
      } else {
        LICENSING.installedAt = Date.now();
        var payload = {};
        payload[INSTALL_KEY] = LICENSING.installedAt;
        safeStorageSet('local', payload, function () {});
      }
    });
  }

  function openPaymentPage() {
    // Wired to ExtensionPay once the library + id are added.
    if (LICENSING.extpay && LICENSING.extpay.openPaymentPage) {
      LICENSING.extpay.openPaymentPage();
    }
  }

  function hideUpgradeBanner() {
    var b = document.getElementById('gmail-view-next-upgrade');
    if (b) b.remove();
  }

  function showUpgradeBanner() {
    if (document.getElementById('gmail-view-next-upgrade')) return;
    var bar = document.createElement('div');
    bar.id = 'gmail-view-next-upgrade';
    bar.setAttribute('style',
      'position:fixed;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);'
      + 'display:flex;align-items:center;gap:12px;max-width:560px;padding:12px 16px;'
      + 'background:#1a1a1a;color:#f4f0e7;border:1px solid #c9a84c;border-radius:8px;'
      + 'box-shadow:0 2px 14px rgba(0,0,0,.3);font:13px/1.45 Arial,sans-serif;');
    var msg = document.createElement('span');
    msg.textContent = 'Your Gmail View trial has ended. Subscribe ($0.99/mo) or unlock lifetime ($14.99) to keep the newspaper inbox.';
    var btn = document.createElement('button');
    btn.textContent = 'Subscribe / Enter code';
    btn.setAttribute('style',
      'flex:0 0 auto;border:1px solid #c9a84c;background:#c9a84c;color:#1a1a1a;'
      + 'border-radius:5px;padding:6px 12px;font:600 12px Arial,sans-serif;cursor:pointer;');
    btn.addEventListener('click', openPaymentPage);
    bar.appendChild(msg);
    bar.appendChild(btn);
    document.body.appendChild(bar);
  }

  function initLicensing() {
    recordInstallDate();
    if (!LICENSING.enabled) return;
    // TODO when enabling: create ExtPay('<extpay-extension-id>'), then:
    //   LICENSING.extpay = extpay; extpay.getUser().then(u => { LICENSING.paid = !!u.paid; scheduleRefresh(); });
    //   extpay.onPaid.addListener(() => { LICENSING.paid = true; scheduleRefresh(); });
  }

  // --- Umbrella-label roll-up (opt-in) -------------------------------------
  // Collect every custom label's FULL path from the sidebar's real hrefs and
  // remember them for the session, so a parent still rolls up its sub-labels
  // even after you collapse it. Fails safe: scraping never throws.
  function collectLabelPaths() {
    if (!state.knownLabelPaths) state.knownLabelPaths = {};
    try {
      var links = document.querySelectorAll('a[href*="#label/"]');
      Array.prototype.forEach.call(links, function (link) {
        var match = String(link.getAttribute('href') || '').match(/#label\/([^?&#]+)/);
        if (!match) return;
        var path = Core.decodeLabelHash('#label/' + match[1]);
        if (path) state.knownLabelPaths[path] = true;
      });
    } catch (error) {
      /* defensive: never let label scraping break navigation */
    }
    return Object.keys(state.knownLabelPaths);
  }

  // When the user opens a parent/umbrella label, redirect to a combined search
  // that also includes every sub-label. No-op for leaves, non-label hashes, or
  // when the setting is off. Any failure leaves Gmail navigation untouched.
  function maybeRollupLabel() {
    if (!state.settings || !state.settings.umbrellaRollup) return;
    try {
      var path = Core.decodeLabelHash(location.hash);
      if (!path) return;
      var query = Core.labelRollupQuery(path, collectLabelPaths());
      if (!query) return;
      var target = '#search/' + encodeURIComponent(query);
      if (location.hash !== target) location.hash = target;
    } catch (error) {
      /* leave navigation alone on any failure */
    }
  }

  // Alt+Shift+G toggles the whole redesign on/off. We just flip `enabled` in
  // sync storage; onStorageChanged re-applies it (and we update locally too,
  // for instant feedback if storage is slow/unavailable). Ignored while typing.
  function handleToggleHotkey(event) {
    if (!state.settings || state.settings.toggleHotkey === false) return;
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    var isG = event.code === 'KeyG' || String(event.key || '').toLowerCase() === 'g';
    if (!isG) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
    event.preventDefault();
    var next = !state.settings.enabled;
    safeStorageSet('sync', { enabled: next });
    state.settings.enabled = next;
    installStyle();
    updateRootFlags();
    scheduleRefresh();
  }

  // Help overlay (Alt+Shift+H): a self-contained panel listing the keyboard
  // shortcuts and where the features live. Static content, no Gmail DOM changes.
  function ensureHelpOverlay() {
    var el = document.getElementById('gmail-view-next-help-overlay');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'gmail-view-next-help-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'GmailView help');
    el.style.display = 'none';
    el.innerHTML =
      '<div class="gvn-help-card">'
      + '<div class="gvn-help-head">GmailView &mdash; quick help'
      + '<button type="button" class="gvn-help-close" aria-label="Close">×</button></div>'
      + '<div class="gvn-help-body">'
      + '<div class="gvn-help-h">Keyboard shortcuts</div>'
      + '<ul>'
      + '<li><b>Alt+Shift+G</b> &mdash; toggle the redesign on/off</li>'
      + '<li><b>Alt+Shift+Z</b> &mdash; Zen mode (hide sidebar, rail, tabs)</li>'
      + '<li><b>Alt+Shift+P</b> &mdash; save the inbox as PDF</li>'
      + '<li><b>Alt+Shift+H</b> &mdash; open/close this help</li>'
      + '</ul>'
      + '<div class="gvn-help-h">In the Options page</div>'
      + '<ul>'
      + '<li>Theme presets, accent colour, auto masthead, relative dates, quick-peek</li>'
      + '<li>Front page: digest, stats, quick filters, cleanup wizard, group by company</li>'
      + '<li>Sender rules (VIP/mute/hide), highlight rules, saved views, sender colours</li>'
      + '<li>Density presets, reading-width cap, full backup (export/import everything)</li>'
      + '</ul>'
      + '<div class="gvn-help-h">In the inbox</div>'
      + '<ul>'
      + '<li>Click a front-page sender chip or bar to filter to that sender</li>'
      + '<li>VIP / Mute / Hide buttons on the stats rows act on all of a sender&rsquo;s mail</li>'
      + '<li>📎 marks rows with attachments; &times;N marks repeat senders</li>'
      + '</ul>'
      + '<p class="gvn-help-foot">Open the full settings from the GmailView toolbar icon &rarr; Options.</p>'
      + '</div></div>';
    addListener(el, 'click', function (event) {
      if (event.target === el || (event.target.className || '').indexOf('gvn-help-close') !== -1) {
        el.style.display = 'none';
      }
    });
    document.body.appendChild(el);
    return el;
  }

  function toggleHelpOverlay() {
    var el = ensureHelpOverlay();
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  function handleHelpHotkey(event) {
    if (!state.settings || state.settings.toggleHotkey === false) return;
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    var isH = event.code === 'KeyH' || String(event.key || '').toLowerCase() === 'h';
    if (!isH) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
    event.preventDefault();
    toggleHelpOverlay();
  }

  // Alt+Shift+Z toggles Zen mode (hide sidebar, rail, tabs for a clean reading
  // column). Flips `zenMode` in sync storage and applies it instantly.
  function handleZenHotkey(event) {
    if (!state.settings || state.settings.toggleHotkey === false) return;
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    var isZ = event.code === 'KeyZ' || String(event.key || '').toLowerCase() === 'z';
    if (!isZ) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
    event.preventDefault();
    var next = !state.settings.zenMode;
    safeStorageSet('sync', { zenMode: next });
    state.settings.zenMode = next;
    updateRootFlags();
    scheduleRefresh();
  }

  // Alt+Shift+P opens the print dialog (Save as PDF). The @media print rules
  // make the inbox print as a clean black-on-white newspaper page.
  function handlePrintHotkey(event) {
    if (!state.settings || state.settings.toggleHotkey === false) return;
    if (!event.altKey || !event.shiftKey || event.ctrlKey || event.metaKey) return;
    var isP = event.code === 'KeyP' || String(event.key || '').toLowerCase() === 'p';
    if (!isP) return;
    var el = document.activeElement;
    if (el && (el.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return;
    event.preventDefault();
    try { window.print(); } catch (error) { /* print unavailable */ }
  }

  function start() {
    if (state.destroyed) return;
    installStyle();
    ensureOverlay();
    ensureSidebarResizer();
    initLicensing();

    state.observer = new MutationObserver(function (mutations) {
      if (state.sortingLabels) return;
      var relevant = mutations.some(function (mutation) {
        return mutation.addedNodes.length || mutation.removedNodes.length;
      });
      if (relevant) scheduleRefresh();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });

    addListener(window, 'keydown', handleToggleHotkey, true);
    addListener(window, 'keydown', handleZenHotkey, true);
    addListener(window, 'keydown', handleHelpHotkey, true);
    addListener(window, 'keydown', handlePrintHotkey, true);
    addListener(window, 'hashchange', maybeRollupLabel);
    addListener(window, 'hashchange', scheduleRefresh);
    addListener(window, 'popstate', scheduleRefresh);
    addListener(window, 'resize', scheduleRefresh);
    addListener(window, 'scroll', scheduleRefresh, true);
    addListener(window, 'pointermove', moveColumnDrag, { passive: false });
    addListener(window, 'pointerup', finishColumnDrag);
    addListener(window, 'pointercancel', finishColumnDrag);

    var changeEvents = storageChangeEvents();
    if (changeEvents) {
      try {
        changeEvents.addListener(onStorageChanged);
      } catch (error) {
        reportApiError('Could not add the storage listener.', error);
      }
    }
    scheduleRefresh();
  }

  globalThis.__gmailViewNext = Object.freeze({ destroy: destroy, refresh: scheduleRefresh });

  Promise.all([
    readSettings(),
    readLabelActivity(),
    readLabelTypography(),
    readLogoOverrides(),
    readPinnedLabels(),
    readSenderRules(),
    readSavedViews(),
    readHighlightRules()
  ]).then(function (values) {
    if (state.destroyed) return;
    state.settings = Core.normalizeSettings(values[0]);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }).catch(function (error) {
    logError('Startup failed.', error);
  });
})();
