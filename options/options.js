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
})();
