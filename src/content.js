(function () {
  'use strict';

  var Core = globalThis.GmailViewNextCore;
  var Adapter = globalThis.GmailViewNextAdapter;
  var Styles = globalThis.GmailViewNextStyles;
  var DATE_COLUMN_WIDTH = 170;
  var COMPACT_DATE_COLUMN_WIDTH = 140;
  var LABEL_ACTIVITY_KEY = 'gmailViewNextLabelActivity';
  var LABEL_TYPOGRAPHY_KEY = 'gmailViewNextLabelTypography';
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
    root.setAttribute('data-gvn-active', String(state.settings.enabled));
    root.setAttribute('data-gvn-route', Core.routeMode(location.hash));
    root.setAttribute('data-gvn-hide-tabs', String(state.settings.hideTabs));
    root.setAttribute('data-gvn-hide-rail', String(state.settings.hideRail));
    root.setAttribute('data-gvn-color-labels', String(state.settings.colorLabels));
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
    labelEditButton.textContent = 'Edit labels';
    labelEditButton.addEventListener('click', toggleLabelEditing);
    masthead.appendChild(labelEditButton);
    var editButton = document.createElement('button');
    editButton.className = 'gvn-edit-button';
    editButton.type = 'button';
    editButton.textContent = 'Edit columns';
    editButton.addEventListener('click', toggleEditing);
    masthead.appendChild(editButton);
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
    return overlay;
  }

  function toggleEditing() {
    var nextEditing = !(state.editing && !state.editingLabels);
    state.editing = nextEditing;
    state.editingLabels = false;
    if (!state.editing) state.selectedColumns = { sender: true };
    var overlay = ensureOverlay();
    overlay.setAttribute('data-editing', String(state.editing));
    overlay.setAttribute('data-label-editing', 'false');
    var button = overlay.querySelector('.gvn-edit-button');
    if (button) button.textContent = state.editing ? 'Done' : 'Edit columns';
    var labelButton = overlay.querySelector('.gvn-label-edit-button');
    if (labelButton) labelButton.textContent = 'Edit labels';
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
    overlay.setAttribute('data-editing', String(state.editing));
    overlay.setAttribute('data-label-editing', String(state.editingLabels));
    var editButton = overlay.querySelector('.gvn-edit-button');
    if (editButton) editButton.textContent = 'Edit columns';
    var labelButton = overlay.querySelector('.gvn-label-edit-button');
    if (labelButton) labelButton.textContent = state.editingLabels ? 'Done' : 'Edit labels';
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
      if (labelValue) {
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
    if (value) {
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
  }

  function clearLabelDecorations() {
    document.querySelectorAll('[data-gvn-label-entry="true"]').forEach(function (entry) {
      entry.removeAttribute('data-gvn-label-entry');
      entry.removeAttribute('data-gvn-label');
      entry.style.removeProperty('--gvn-label-font-size');
      entry.style.removeProperty('--gvn-label-font-weight');
      entry.style.removeProperty('--gvn-label-font-style');
      var checkbox = entry.querySelector('.gvn-label-check');
      if (checkbox) checkbox.remove();
      var swatch = entry.querySelector(Adapter.SELECTORS.labelSwatch);
      if (swatch) swatch.style.removeProperty('--gvn-label-color');
    });
  }

  function decorateRows(rows) {
    var now = new Date();
    var previousGroup = null;
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

      if (parts.contentTrack) {
        var sender = Adapter.senderData(parts);
        var at = sender.email.lastIndexOf('@');
        var domain = at >= 0 ? rootDomain(sender.email.slice(at + 1).toLowerCase()) : '';
        parts.contentTrack.setAttribute('data-gvn-logo', 'true');
        if (domain) {
          parts.contentTrack.style.setProperty(
            '--gvn-logo',
            'url("https://www.google.com/s2/favicons?sz=64&domain=' + domain + '")'
          );
        } else {
          parts.contentTrack.style.removeProperty('--gvn-logo');
        }
      }

      alignAttachments(parts);
    });
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

  function sortLabelsByActivity(items) {
    if (!state.settings.sortLabelsByActivity || state.sortingLabels) return;
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
          activity: Number(state.labelActivity[item.name]) || 0
        });
      }
    });

    groups.forEach(function (group, parent) {
      if (group.length < 2) return;
      var sorted = group.slice().sort(function (left, right) {
        return right.activity - left.activity || left.index - right.index;
      });
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
    var items = customLabelItems();
    items.forEach(function (item) {
      item.entry.setAttribute('data-gvn-label-entry', 'true');
      applyLabelTypography(item);
      syncLabelCheckbox(item);
      if (!state.settings.colorLabels) {
        item.entry.removeAttribute('data-gvn-label');
        item.swatch.style.removeProperty('--gvn-label-color');
        return;
      }
      if (SYSTEM_LABELS.test(item.name)) return;
      if (!isNeutralColor(getComputedStyle(item.swatch).backgroundColor)) return;
      item.entry.setAttribute('data-gvn-label', 'true');
      item.swatch.style.setProperty('--gvn-label-color', Core.labelColor(item.name));
    });
    updateLabelActivity(items);
    sortLabelsByActivity(items);
    if (state.editingLabels) updateTypeEditor();
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
    mastheadTitle.textContent = state.settings.masthead;
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

  function mergeTabsRow() {
    var root = document.documentElement;
    var clear = function () {
      root.style.removeProperty('--gvn-tabs-merge');
      root.style.removeProperty('--gvn-tabs-left');
      root.style.removeProperty('--gvn-tabs-width');
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
    root.style.setProperty(
      '--gvn-tabs-merge',
      '-' + Math.round(toolbar.getBoundingClientRect().height) + 'px'
    );
    root.style.setProperty('--gvn-tabs-left', '150px');
    root.style.setProperty('--gvn-tabs-width', 'calc(100% - 380px)');
  }

  function refresh() {
    state.frame = 0;
    if (state.destroyed) return;

    try {
      updateRootFlags();
      positionSidebarResizer();
      mergeTabsRow();
      var overlay = document.getElementById('gmail-view-next-ui');
      var mode = Core.routeMode(location.hash);
      if (state.settings.enabled) decorateLabels();
      if (!state.settings.enabled || mode !== 'inbox') {
        if (overlay) overlay.style.display = 'none';
        clearRowDecorations();
        if (!state.settings.enabled) clearLabelDecorations();
        return;
      }

      var rows = Adapter.findRows(document);
      if (!rows.length) {
        if (overlay) overlay.style.display = 'none';
        return;
      }

      decorateRows(rows);
      positionOverlay(rows[0]);
      positionGlobalDividers(rows[0]);
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
    document.documentElement.removeAttribute('data-gvn-hide-rail');
    document.documentElement.removeAttribute('data-gvn-color-labels');
    document.documentElement.removeAttribute('data-gvn-label-editing');
    document.documentElement.removeAttribute('data-gvn-sidebar-sized');
    document.documentElement.style.removeProperty('--gvn-sidebar-width');
    document.documentElement.style.removeProperty('--gvn-table-width');
    document.documentElement.style.removeProperty('--gvn-tabs-merge');
    document.documentElement.style.removeProperty('--gvn-tabs-left');
    document.documentElement.style.removeProperty('--gvn-tabs-width');
    clearSidebarTargets();
    var style = document.getElementById('gmail-view-next-css');
    var overlay = document.getElementById('gmail-view-next-ui');
    var sidebarHandle = document.getElementById('gmail-view-next-sidebar-resizer');
    var globalDividers = document.getElementById('gmail-view-next-global-dividers');
    if (style) style.remove();
    if (overlay) overlay.remove();
    if (sidebarHandle) sidebarHandle.remove();
    if (globalDividers) globalDividers.remove();
  }

  function start() {
    if (state.destroyed) return;
    installStyle();
    ensureOverlay();
    ensureSidebarResizer();

    state.observer = new MutationObserver(function (mutations) {
      if (state.sortingLabels) return;
      var relevant = mutations.some(function (mutation) {
        return mutation.addedNodes.length || mutation.removedNodes.length;
      });
      if (relevant) scheduleRefresh();
    });
    state.observer.observe(document.body, { childList: true, subtree: true });

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
    readLabelTypography()
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
