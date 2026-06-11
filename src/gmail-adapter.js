(function (root, factory) {
  root.GmailViewNextAdapter = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SELECTORS = Object.freeze({
    row: 'tr.zA',
    table: 'table.F',
    inboxViewport: '.AO',
    senderCell: 'td.yX',
    senderTrack: '.yW',
    sender: '.zF, .yP, span[email]',
    contentCell: 'td.a4W',
    contentTrack: '.xT',
    subject: '.y6',
    preview: '.y2',
    attachments: '.brd',
    dateCell: 'td.xW',
    actionCell: 'td.bq4',
    tabs: '.aKh',
    rail: '.bAw, .aUx',
    navigation: '[role="navigation"]',
    labelEntry: 'div[data-tooltip]',
    labelSwatch: '.qj'
  });

  function query(root, selector) {
    return (root || document).querySelector(selector);
  }

  function queryVisible(root, selector) {
    var matches = (root || document).querySelectorAll(selector);
    for (var i = 0; i < matches.length; i++) {
      var rect = matches[i].getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return matches[i];
    }
    return matches[0] || null;
  }

  function findRows(root) {
    return Array.prototype.filter.call(
      (root || document).querySelectorAll(SELECTORS.row),
      function (row) {
        return !!(
          query(row, SELECTORS.senderCell) &&
          query(row, SELECTORS.contentCell) &&
          query(row, SELECTORS.dateCell)
        );
      }
    );
  }

  function rowParts(row) {
    return {
      row: row,
      senderCell: query(row, SELECTORS.senderCell),
      senderTrack: query(row, SELECTORS.senderTrack),
      sender: queryVisible(row, SELECTORS.sender),
      contentCell: query(row, SELECTORS.contentCell),
      contentTrack: query(row, SELECTORS.contentTrack),
      subject: query(row, SELECTORS.subject),
      preview: query(row, SELECTORS.preview),
      attachments: query(row, SELECTORS.attachments),
      dateCell: query(row, SELECTORS.dateCell),
      actionCell: query(row, SELECTORS.actionCell)
    };
  }

  function senderData(parts) {
    var sender = parts.sender;
    return {
      name: sender ? String(sender.textContent || '').trim() : '',
      email: sender ? String(sender.getAttribute('email') || '').trim() : ''
    };
  }

  function dateCandidates(parts) {
    var cell = parts.dateCell;
    if (!cell) return [];
    var titled = cell.querySelector('[title]');
    return [
      titled && titled.getAttribute('title'),
      cell.getAttribute('title'),
      cell.getAttribute('aria-label'),
      cell.textContent
    ].filter(Boolean);
  }

  function locateInbox() {
    return {
      viewport: query(document, SELECTORS.inboxViewport),
      table: query(document, SELECTORS.table)
    };
  }

  function locateSidebar() {
    var matches = document.querySelectorAll(SELECTORS.navigation);
    var best = null;
    var bestHeight = 0;
    for (var i = 0; i < matches.length; i++) {
      var rect = matches[i].getBoundingClientRect();
      if (
        rect.width > 40 &&
        rect.height > bestHeight &&
        rect.left < (globalThis.innerWidth || 1200) / 2
      ) {
        best = matches[i];
        bestHeight = rect.height;
      }
    }
    return best;
  }

  function sortableLabelRow(entry, nav) {
    var node = entry;
    while (node && node.parentElement && node.parentElement !== nav) {
      var parent = node.parentElement;
      var labelChildren = Array.prototype.filter.call(
        parent.children,
        function (child) {
          return !!(
            child.matches &&
            (
              (child.matches(SELECTORS.labelEntry) && query(child, SELECTORS.labelSwatch)) ||
              query(child, SELECTORS.labelEntry + ' ' + SELECTORS.labelSwatch)
            )
          );
        }
      );
      if (labelChildren.length > 1) return node;
      node = parent;
    }
    return entry;
  }

  function labelUnreadState(entry) {
    var countNode = query(entry, '.bsU');
    var countText = countNode ? String(countNode.textContent || '') : '';
    var countMatch = countText.replace(/[,.]/g, '').match(/\d+/);
    var count = countMatch ? Number(countMatch[0]) : 0;
    var ariaText = Array.prototype.map.call(
      entry.querySelectorAll('[aria-label]'),
      function (node) {
        return String(node.getAttribute('aria-label') || '');
      }
    ).join(' ');
    var unreadByAria = /unread|ungelesen/i.test(ariaText);
    var unreadByWeight = false;
    if (typeof getComputedStyle === 'function') {
      var textNode = query(entry, 'a, .aio, .nU, span');
      if (textNode) {
        var weight = Number.parseInt(getComputedStyle(textNode).fontWeight, 10);
        unreadByWeight = Number.isFinite(weight) && weight >= 600;
      }
    }
    return {
      count: count,
      unread: count > 0 || unreadByAria || unreadByWeight
    };
  }

  function sidebarLabels() {
    var nav = locateSidebar();
    if (!nav) return [];
    return Array.prototype.map.call(
      nav.querySelectorAll(SELECTORS.labelEntry),
      function (entry) {
        var unread = labelUnreadState(entry);
        return {
          entry: entry,
          row: sortableLabelRow(entry, nav),
          swatch: query(entry, SELECTORS.labelSwatch),
          name: String(entry.getAttribute('data-tooltip') || '').trim(),
          unreadCount: unread.count,
          unread: unread.unread
        };
      }
    ).filter(function (item) {
      return item.swatch && item.name;
    });
  }

  function layoutSnapshot(row) {
    var inbox = locateInbox();
    var parts = rowParts(row);
    if (!inbox.viewport || !inbox.table || !parts.senderCell || !parts.dateCell) {
      return null;
    }
    return {
      viewport: inbox.viewport.getBoundingClientRect(),
      table: inbox.table.getBoundingClientRect(),
      row: row.getBoundingClientRect(),
      sender: parts.senderCell.getBoundingClientRect(),
      senderTrack: parts.senderTrack ? parts.senderTrack.getBoundingClientRect() : null,
      senderText: parts.sender ? parts.sender.getBoundingClientRect() : null,
      content: parts.contentCell.getBoundingClientRect(),
      track: parts.contentTrack ? parts.contentTrack.getBoundingClientRect() : null,
      subject: parts.subject ? parts.subject.getBoundingClientRect() : null,
      preview: parts.preview ? parts.preview.getBoundingClientRect() : null,
      date: parts.dateCell.getBoundingClientRect()
    };
  }

  return Object.freeze({
    SELECTORS: SELECTORS,
    findRows: findRows,
    rowParts: rowParts,
    senderData: senderData,
    dateCandidates: dateCandidates,
    locateInbox: locateInbox,
    locateSidebar: locateSidebar,
    sidebarLabels: sidebarLabels,
    layoutSnapshot: layoutSnapshot
  });
});
