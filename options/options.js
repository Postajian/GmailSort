(function () {
  'use strict';

  var Core = globalThis.GmailViewNextCore;
  var form = document.getElementById('settings');
  var status = document.getElementById('status');
  var reset = document.getElementById('reset');
  var currentValues = Core.normalizeSettings(Core.DEFAULT_SETTINGS);

  function runtimeLastError() {
    try {
      return chrome.runtime ? chrome.runtime.lastError || null : null;
    } catch (error) {
      return error;
    }
  }

  function safeSyncGet(keys, callback) {
    try {
      chrome.storage.sync.get(keys, function (stored) {
        callback(stored, runtimeLastError());
      });
    } catch (error) {
      callback(null, error);
    }
  }

  function safeSyncSet(values, callback) {
    try {
      chrome.storage.sync.set(values, function () {
        callback(runtimeLastError());
      });
    } catch (error) {
      callback(error);
    }
  }

  function setForm(values) {
    var settings = Core.normalizeSettings(values);
    currentValues = settings;
    Object.keys(settings).forEach(function (key) {
      var field = form.elements.namedItem(key);
      if (!field) return;
      if (field.type === 'checkbox') field.checked = settings[key];
      else field.value = settings[key];
    });
  }

  function formValues() {
    var value = {};
    Object.keys(Core.DEFAULT_SETTINGS).forEach(function (key) {
      var field = form.elements.namedItem(key);
      if (!field) {
        value[key] = currentValues[key];
        return;
      }
      value[key] = field.type === 'checkbox' ? field.checked : field.value;
    });
    return Core.normalizeSettings(value);
  }

  function showStatus(message) {
    status.textContent = message;
    setTimeout(function () {
      if (status.textContent === message) status.textContent = '';
    }, 1800);
  }

  safeSyncGet(Core.DEFAULT_SETTINGS, function (values, error) {
    if (!error) setForm(values);
    else showStatus('Could not load settings.');
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var values = formValues();
    safeSyncSet(values, function (error) {
      if (!error) currentValues = values;
      showStatus(error ? 'Could not save.' : 'Saved.');
    });
  });

  reset.addEventListener('click', function () {
    setForm(Core.DEFAULT_SETTINGS);
    safeSyncSet(Core.DEFAULT_SETTINGS, function (error) {
      showStatus(error ? 'Could not reset.' : 'Defaults restored.');
    });
  });

  // ----- Backup: export / import -----------------------------------------
  var exportBtn = document.getElementById('export');
  var importBtn = document.getElementById('import-btn');
  var importFile = document.getElementById('import-file');

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var payload = JSON.stringify({
        type: 'gmail-view-next-settings',
        version: Core.LAYOUT_VERSION,
        savedAt: new Date().toISOString(),
        settings: formValues()
      }, null, 2);
      var blob = new Blob([payload], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      var stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      link.href = url;
      link.download = 'gmailview-settings-' + stamp + '.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      showStatus('Exported.');
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function () {
      var file = importFile.files && importFile.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed;
        try {
          parsed = JSON.parse(String(reader.result));
        } catch (error) {
          showStatus('Invalid file — not valid JSON.');
          importFile.value = '';
          return;
        }
        var raw = parsed && parsed.settings ? parsed.settings : parsed;
        if (!raw || typeof raw !== 'object') {
          showStatus('Invalid file — no settings found.');
          importFile.value = '';
          return;
        }
        // Warning Insurance: every value is clamped back into a safe range
        // before it can touch the layout, and we confirm before overwriting.
        var clean = Core.normalizeSettings(raw);
        if (!window.confirm('Replace your current settings with this file? Your layout will change immediately.')) {
          importFile.value = '';
          return;
        }
        setForm(clean);
        safeSyncSet(clean, function (error) {
          showStatus(error ? 'Could not import.' : 'Imported.');
        });
        importFile.value = '';
      };
      reader.onerror = function () {
        showStatus('Could not read the file.');
        importFile.value = '';
      };
      reader.readAsText(file);
    });
  }

  // ----- Presets: save / apply / delete named looks ----------------------
  var PRESETS_KEY = 'gmailViewNextPresets';
  var presetName = document.getElementById('preset-name');
  var presetList = document.getElementById('preset-list');
  var savePresetBtn = document.getElementById('save-preset');
  var applyPresetBtn = document.getElementById('apply-preset');
  var deletePresetBtn = document.getElementById('delete-preset');

  function safeLocalGet(keys, callback) {
    try {
      chrome.storage.local.get(keys, function (stored) {
        callback(stored, runtimeLastError());
      });
    } catch (error) {
      callback(null, error);
    }
  }

  function safeLocalSet(values, callback) {
    try {
      chrome.storage.local.set(values, function () {
        callback(runtimeLastError());
      });
    } catch (error) {
      callback(error);
    }
  }

  function loadPresets(callback) {
    safeLocalGet(PRESETS_KEY, function (stored, error) {
      var presets = !error && stored && stored[PRESETS_KEY];
      if (!presets || typeof presets !== 'object') presets = {};
      callback(presets);
    });
  }

  function renderPresets(presets) {
    if (!presetList) return;
    var names = Object.keys(presets).sort();
    presetList.innerHTML = '';
    var first = document.createElement('option');
    first.value = '';
    first.textContent = names.length ? '— pick a preset —' : '— none saved yet —';
    presetList.appendChild(first);
    names.forEach(function (name) {
      var option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      presetList.appendChild(option);
    });
  }

  function refreshPresets() {
    loadPresets(renderPresets);
  }

  if (presetList) refreshPresets();

  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', function () {
      var name = (presetName.value || '').trim().slice(0, 40);
      if (!name) {
        showStatus('Type a preset name first.');
        return;
      }
      loadPresets(function (presets) {
        if (
          Object.prototype.hasOwnProperty.call(presets, name) &&
          !window.confirm('A preset called "' + name + '" already exists. Overwrite it?')
        ) {
          return;
        }
        presets[name] = formValues();
        var payload = {};
        payload[PRESETS_KEY] = presets;
        safeLocalSet(payload, function (error) {
          if (error) {
            showStatus('Could not save preset.');
            return;
          }
          presetName.value = '';
          renderPresets(presets);
          presetList.value = name;
          showStatus('Preset "' + name + '" saved.');
        });
      });
    });
  }

  if (applyPresetBtn) {
    applyPresetBtn.addEventListener('click', function () {
      var name = presetList.value;
      if (!name) {
        showStatus('Pick a preset to apply.');
        return;
      }
      loadPresets(function (presets) {
        if (!Object.prototype.hasOwnProperty.call(presets, name)) {
          showStatus('Preset not found.');
          refreshPresets();
          return;
        }
        var clean = Core.normalizeSettings(presets[name]);
        setForm(clean);
        safeSyncSet(clean, function (error) {
          showStatus(error ? 'Could not apply.' : 'Applied "' + name + '".');
        });
      });
    });
  }

  if (deletePresetBtn) {
    deletePresetBtn.addEventListener('click', function () {
      var name = presetList.value;
      if (!name) {
        showStatus('Pick a preset to delete.');
        return;
      }
      if (!window.confirm('Delete preset "' + name + '"? This cannot be undone.')) return;
      loadPresets(function (presets) {
        delete presets[name];
        var payload = {};
        payload[PRESETS_KEY] = presets;
        safeLocalSet(payload, function (error) {
          if (error) {
            showStatus('Could not delete.');
            return;
          }
          renderPresets(presets);
          showStatus('Preset "' + name + '" deleted.');
        });
      });
    });
  }

  // ----- Sender colour overrides ----------------------------------------
  var OVERRIDES_KEY = 'gmailViewNextLogoOverrides';
  var overrideDomain = document.getElementById('override-domain');
  var overrideColorInput = document.getElementById('override-color');
  var overrideAddBtn = document.getElementById('override-add');
  var overrideList = document.getElementById('override-list');

  function cleanDomain(value) {
    return String(value || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  }

  function loadOverrides(callback) {
    safeLocalGet(OVERRIDES_KEY, function (stored, error) {
      var map = !error && stored && stored[OVERRIDES_KEY];
      if (!map || typeof map !== 'object') map = {};
      callback(map);
    });
  }

  function renderOverrides(map) {
    if (!overrideList) return;
    overrideList.innerHTML = '';
    var domains = Object.keys(map).sort();
    if (!domains.length) {
      var empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'No pinned colours yet.';
      overrideList.appendChild(empty);
      return;
    }
    domains.forEach(function (domain) {
      var rowEl = document.createElement('div');
      rowEl.className = 'row override-row';
      var swatch = document.createElement('span');
      swatch.className = 'override-swatch';
      swatch.style.background = map[domain];
      var label = document.createElement('span');
      label.className = 'override-name';
      label.textContent = domain;
      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'secondary';
      del.textContent = 'Remove';
      del.addEventListener('click', function () {
        loadOverrides(function (current) {
          delete current[domain];
          var payload = {};
          payload[OVERRIDES_KEY] = current;
          safeLocalSet(payload, function (error) {
            if (error) { showStatus('Could not remove.'); return; }
            renderOverrides(current);
            showStatus('Removed ' + domain + '.');
          });
        });
      });
      rowEl.appendChild(swatch);
      rowEl.appendChild(label);
      rowEl.appendChild(del);
      overrideList.appendChild(rowEl);
    });
  }

  if (overrideList) loadOverrides(renderOverrides);

  if (overrideAddBtn) {
    overrideAddBtn.addEventListener('click', function () {
      var domain = cleanDomain(overrideDomain.value);
      var color = (overrideColorInput.value || '').trim();
      if (!domain) { showStatus('Type a sender domain first.'); return; }
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) { showStatus('Pick a colour first.'); return; }
      loadOverrides(function (map) {
        map[domain] = color;
        var payload = {};
        payload[OVERRIDES_KEY] = map;
        safeLocalSet(payload, function (error) {
          if (error) { showStatus('Could not save.'); return; }
          overrideDomain.value = '';
          renderOverrides(map);
          showStatus('Pinned ' + domain + '.');
        });
      });
    });
  }
})();
