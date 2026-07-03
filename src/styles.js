(function (root, factory) {
  root.GmailViewNextStyles = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var GOLD = '#c9a84c';
  var DIVIDER = '#ededed';
  var HAIRLINE = '#e4e1d6';
  var HOVER = '#f6f2e6';
  var INK = '#1a1a1a';
  var MUTED = '#9a9a9a';
  var PAPER = '#ffffff';
  var FONT = '"Times New Roman", Times, serif';
  var PREVIEW_WIDTH = 240;
  var DATE_WIDTH = 170;

  function buildCss(settings) {
    // Compact density picks a tighter row height without overwriting the
    // user's custom rowHeight (used for "comfortable").
    var rowHeight = settings.density === 'compact'
      ? Math.min(26, Math.round(settings.rowHeight))
      : Math.round(settings.rowHeight);
    var inboxFontSize = Math.round(settings.inboxFontSize);
    var senderFontSize = Math.round(settings.senderFontSize);
    var groupFontSize = Math.round(settings.groupFontSize);
    var logoSize = Math.round(settings.logoSize);
    var subjectFontSize = Math.round(settings.subjectFontSize);
    var previewFontSize = Math.round(settings.previewFontSize);
    var dateFontSize = Math.round(settings.dateFontSize);
    var senderWidth = Math.round(settings.senderWidth);
    var contentIndent = Math.round(settings.contentIndent);
    var senderOffset = Math.round(settings.senderOffset);
    var timeSentOffset = Math.round(settings.timeSentOffset);
    var logoOffset = Math.round(settings.logoOffset);
    var subjectGap = Math.round(settings.subjectGap);
    var subjectWidth = Math.round(settings.subjectWidth);
    var previewOffset = Math.round(settings.previewOffset);
    var dateOffset = Math.round(settings.dateOffset);
    var rightInset = Math.round(settings.rightInset);
    var sidebarWidth = Math.round(settings.sidebarWidth);
    var editorScale = Number(settings.editorScale);
    var editorHeight = Math.max(20, Math.round(36 * editorScale));
    var editorFontSize = Math.max(9, Math.round(16 * editorScale));
    var editorLineHeight = Math.max(18, editorHeight - 2);
    var editorGap = Math.max(2, Math.round(4 * editorScale));
    var editorPadding = Math.max(4, Math.round(7 * editorScale));
    var editorMinWidth = Math.max(22, Math.round(34 * editorScale));
    var editorSelectSize = Math.max(13, Math.round(20 * editorScale));
    var editorNameWidth = Math.max(38, Math.round(58 * editorScale));
    var editorValueWidth = Math.max(30, Math.round(42 * editorScale));
    var editorTop = 4;
    var editorMastheadHeight = editorTop + editorHeight + 42;
    var editorRightReserve = Math.max(182, Math.round(286 * editorScale));
    var editorSidePadding = Math.max(7, Math.round(13 * editorScale));
    var editorActionFont = Math.max(10, Math.round(15 * editorScale));
    var labelFontSize = Math.round(settings.labelFontSize);
    var senderTextGap = Math.round(settings.senderTextGap);
    var groupTextGap = Math.round(settings.groupTextGap);
    var groupLineGapTop = Math.round(settings.groupLineGapTop);
    var groupLineGapBottom = Math.round(settings.groupLineGapBottom);
    var groupLabelTop = 2 + groupLineGapTop;
    var groupBottomLine = groupLabelTop + 20 + groupLineGapBottom;
    var groupRowPadding = groupBottomLine + 2 + 8;
    var logoTextGap = Math.round(settings.logoTextGap);
    var subjectTextGap = Math.round(settings.subjectTextGap);
    var previewTextGap = Math.round(settings.previewTextGap);
    var dateTextGap = Math.round(settings.dateTextGap);
    var groupLabelLeft = -72 + timeSentOffset;
    var logoShift = logoOffset - 4 + logoTextGap;
    var logoScale = (logoSize / 22).toFixed(3);
    var subjectShift = subjectGap - 30;
    var compactSenderWidth = Math.max(150, senderWidth - 30);
    var compactContentIndent = Math.max(72, contentIndent - 48);
    var markDisplay = settings.showSenderMarks ? 'block' : 'none';
    // Each theme provides its OPAQUE base palette (paper/outer colour, ink,
    // rules). Transparency (the PAPER toggle) is applied afterwards, so it now
    // works on every theme — not just Light.
    var themePaper = PAPER;
    var themeOuter = PAPER;
    var ink = INK;
    var muted = MUTED;
    var hairline = HAIRLINE;
    var dividerColor = DIVIDER;
    var ruleColor = '#000000';
    if (settings.theme === 'dark') {
      themePaper = '#1b1814';
      themeOuter = '#141210';
      ink = '#ece4d2';
      muted = '#a79e8b';
      hairline = 'rgba(236,228,210,0.18)';
      dividerColor = 'rgba(236,228,210,0.16)';
      ruleColor = '#d9cfb8';
    } else if (settings.theme === 'sepia') {
      themePaper = '#f7efe0';
      themeOuter = '#efe3cc';
      ink = '#43321f';
      muted = '#8a755a';
      hairline = 'rgba(67,50,31,0.18)';
      dividerColor = 'rgba(67,50,31,0.14)';
      ruleColor = '#7a5c3a';
    } else if (settings.theme === 'contrast') {
      themePaper = '#ffffff';
      themeOuter = '#ffffff';
      ink = '#000000';
      muted = '#1f1f1f';
      hairline = '#000000';
      dividerColor = '#000000';
      ruleColor = '#000000';
    }

    // Transparent background shows the Gmail theme behind; PAPER off makes the
    // message panel see-through too. Both apply on any theme now.
    var themeOn = settings.transparentBackground;
    var panelClear = themeOn && !settings.readablePanel;
    // Light theme needs darker hairlines to stay readable over a light Gmail bg.
    if (settings.theme === 'light' && panelClear) {
      muted = '#333333';
      hairline = '#6b6b6b';
      dividerColor = '#6b6b6b';
    }
    var outer = themeOn ? 'transparent' : themeOuter;
    var paper = panelClear ? 'transparent' : themePaper;
    // The fixed top strips (masthead, column headers, tabs) always need a SOLID
    // backing so scrolled rows can't show through them — use the theme's paper.
    var band = (paper === 'transparent') ? themePaper : paper;
    // User-chosen accent (defaults to the newspaper gold) drives --gvn-gold.
    var accent = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(settings.accentColor || ''))
      ? settings.accentColor
      : GOLD;
    // Optional reading-width cap: centre the list on very wide screens.
    var listMaxWidth = Math.round(Number(settings.listMaxWidth) || 0);

    return [
      ':root{--gvn-gold:' + accent + ';--gvn-divider:' + dividerColor + ';--gvn-ink:' + ink + ';--gvn-muted:' + muted + ';--gvn-paper:' + paper + ';--gvn-band:' + band + ';--gvn-rule:' + ruleColor + ';--gvn-sidebar-width:' + sidebarWidth + 'px;}',
      // Print / "Save as PDF": recolour to clean black-on-white via the vars
      // (works even in dark theme) and drop our controls, the rail and tabs.
      '@media print{'
        + ':root{--gvn-paper:#fff!important;--gvn-ink:#000!important;--gvn-muted:#444!important;--gvn-rule:#000!important;--gvn-divider:#bbb!important;}'
        + 'html[data-gvn-active="true"][data-gvn-route="inbox"] .nH{background:#fff!important;}'
        + 'html[data-gvn-active="true"][data-gvn-route="inbox"] .aKh,'
        + 'html[data-gvn-active="true"][data-gvn-route="inbox"] .bAw:not(:has(.IU)),'
        + 'html[data-gvn-active="true"][data-gvn-route="inbox"] .aUx:not(:has(.IU)),'
        + '#gmail-view-next-ui .gvn-edit-master,'
        + '#gmail-view-next-ui .gvn-edit-button,'
        + '#gmail-view-next-ui .gvn-label-edit-button,'
        + '#gmail-view-next-ui .gvn-inspect-button,'
        + '#gmail-view-next-ui .gvn-center-button,'
        + '#gmail-view-next-ui .gvn-bg-toggle,'
        + '#gmail-view-next-ui .gvn-quick-button,'
        + '#gmail-view-next-ui .gvn-tab-focus,'
        + '#gmail-view-next-ui .gvn-tab-order,'
        + '#gmail-view-next-sidebar-resizer{display:none!important;}'
        + '}',
      '.gvn-label-count{margin-left:6px;font-weight:600;opacity:.7;}',
      // Help overlay (Alt+Shift+H)
      '#gmail-view-next-help-overlay{position:fixed;inset:0;z-index:2147483646;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.45);}',
      '#gmail-view-next-help-overlay .gvn-help-card{width:min(560px,92vw);max-height:86vh;overflow:auto;background:var(--gvn-band);color:var(--gvn-ink);border:2px solid var(--gvn-rule);box-shadow:0 8px 40px rgba(0,0,0,.4);font-family:' + FONT + ';}',
      '#gmail-view-next-help-overlay .gvn-help-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:2px solid var(--gvn-rule);font-size:20px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;}',
      '#gmail-view-next-help-overlay .gvn-help-close{border:1px solid var(--gvn-rule);background:var(--gvn-paper);color:var(--gvn-ink);width:26px;height:26px;font-size:16px;line-height:1;cursor:pointer;}',
      '#gmail-view-next-help-overlay .gvn-help-body{padding:12px 18px 16px;}',
      '#gmail-view-next-help-overlay .gvn-help-h{margin:12px 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gvn-muted);}',
      '#gmail-view-next-help-overlay ul{margin:0;padding-left:20px;font-size:14px;line-height:1.7;}',
      '#gmail-view-next-help-overlay b{color:var(--gvn-gold);}',
      '#gmail-view-next-help-overlay .gvn-help-foot{margin:12px 0 0;font-size:12px;color:var(--gvn-muted);}',
      // In-Gmail quick-settings gear button + popover
      '#gmail-view-next-ui .gvn-quick-button{position:absolute;left:104px;top:5px;height:22px;width:28px;padding:0;border:1px solid #000;background:#fff;color:#000;font-size:13px;line-height:20px;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-tab-focus{position:absolute;left:140px;top:5px;height:22px;padding:0 10px;border:1px solid #000;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-tab-focus[data-active="true"]{background:var(--gvn-gold);}',
      '#gmail-view-next-ui .gvn-tab-order{position:absolute;left:206px;top:5px;height:22px;padding:0 10px;border:1px solid #000;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      // Quick buttons appear only when the Edit menu is open (like Labels/Columns/Inspect).
      '#gmail-view-next-ui:not([data-edit-menu="true"]) .gvn-quick-button,#gmail-view-next-ui:not([data-edit-menu="true"]) .gvn-tab-focus,#gmail-view-next-ui:not([data-edit-menu="true"]) .gvn-tab-order{display:none!important;}',
      '#gmail-view-next-quick{position:fixed;z-index:2147483646;display:none;width:290px;max-height:80vh;overflow:auto;box-sizing:border-box;background:var(--gvn-band);color:var(--gvn-ink);border:2px solid var(--gvn-rule);box-shadow:0 8px 30px rgba(0,0,0,.35);font-family:' + FONT + ';}',
      '#gmail-view-next-quick .gvn-quick-head{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:2px solid var(--gvn-rule);font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;}',
      '#gmail-view-next-quick .gvn-quick-close{border:1px solid var(--gvn-rule);background:var(--gvn-paper);color:var(--gvn-ink);width:22px;height:22px;font-size:14px;line-height:1;cursor:pointer;}',
      '#gmail-view-next-quick .gvn-quick-body{padding:10px 12px;display:flex;flex-direction:column;gap:8px;}',
      '#gmail-view-next-quick .gvn-quick-cycle,#gmail-view-next-quick .gvn-quick-more{border:1px solid var(--gvn-rule);background:var(--gvn-paper);color:var(--gvn-ink);padding:6px 10px;font-size:13px;font-weight:700;cursor:pointer;text-align:left;}',
      '#gmail-view-next-quick .gvn-quick-more{text-align:center;margin-top:4px;}',
      '#gmail-view-next-quick .gvn-quick-cycle:hover,#gmail-view-next-quick .gvn-quick-more:hover{background:var(--gvn-gold);color:#1a1a1a;}',
      '#gmail-view-next-quick .gvn-quick-row{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;}',
      '#gmail-view-next-quick .gvn-quick-row input{flex:0 0 auto;width:15px;height:15px;cursor:pointer;}',
      // Sharp 90-degree corners across every GmailView UI element (user preference).
      '#gmail-view-next-ui,#gmail-view-next-ui *{border-radius:0!important;}',
      '#gmail-view-next-frontpage,#gmail-view-next-frontpage *{border-radius:0!important;}',
      '#gmail-view-next-health,#gmail-view-next-health *{border-radius:0!important;}',
      '#gmail-view-next-sidebar-resizer,#gmail-view-next-sidebar-resizer::after{border-radius:0!important;}',
      '.gvn-label-check{border-radius:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT::before{border-radius:0!important;}',
      // Front-page briefing + stats panel (opt-in, in normal flow above the list)
      '#gmail-view-next-frontpage{display:block;box-sizing:border-box;margin:0 0 6px;padding:12px 16px;background:var(--gvn-band);border:2px solid var(--gvn-rule);border-radius:2px;color:var(--gvn-ink);font-family:' + FONT + ';}',
      '#gmail-view-next-frontpage *{box-sizing:border-box;}',
      '#gmail-view-next-frontpage .gvn-fp-digest{display:flex;align-items:center;flex-wrap:wrap;gap:18px;}',
      '#gmail-view-next-frontpage .gvn-fp-stats{display:flex;gap:18px;}',
      '#gmail-view-next-frontpage .gvn-fp-stat{display:flex;flex-direction:column;align-items:center;min-width:54px;}',
      '#gmail-view-next-frontpage .gvn-fp-stat-num{font-size:26px;font-weight:900;line-height:1;}',
      '#gmail-view-next-frontpage .gvn-fp-stat-cap{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gvn-muted);margin-top:3px;}',
      '#gmail-view-next-frontpage .gvn-fp-lead{display:flex;align-items:center;flex-wrap:wrap;gap:8px;flex:1 1 240px;border-left:1px solid var(--gvn-divider);padding-left:18px;}',
      '#gmail-view-next-frontpage .gvn-fp-lead-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gvn-muted);}',
      '#gmail-view-next-frontpage .gvn-fp-chip{font-size:13px;font-weight:700;padding:3px 9px;border:1px solid var(--gvn-divider);border-radius:2px;white-space:nowrap;}',
      '#gmail-view-next-frontpage .gvn-fp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px 28px;margin-top:10px;padding-top:10px;border-top:1px solid var(--gvn-divider);}',
      '#gmail-view-next-frontpage .gvn-fp-heading{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gvn-muted);margin-bottom:6px;}',
      '#gmail-view-next-frontpage .gvn-fp-bar-row{display:flex;align-items:center;gap:8px;margin:3px 0;font-size:12px;}',
      '#gmail-view-next-frontpage .gvn-fp-bar-label{flex:0 0 34%;max-width:34%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '#gmail-view-next-frontpage .gvn-fp-bar-track{flex:1 1 auto;height:8px;background:var(--gvn-divider);border-radius:2px;overflow:hidden;}',
      '#gmail-view-next-frontpage .gvn-fp-bar-fill{display:block;height:100%;background:var(--gvn-gold);}',
      '#gmail-view-next-frontpage .gvn-fp-bar-value{flex:0 0 auto;color:var(--gvn-muted);font-variant-numeric:tabular-nums;white-space:nowrap;}',
      // Quick-filter bar (chips at the top of the front page)
      '#gmail-view-next-frontpage .gvn-fp-filters{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 10px;padding:0 0 10px;border-bottom:1px solid var(--gvn-divider);}',
      '#gmail-view-next-frontpage .gvn-fp-filters-label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--gvn-muted);margin-right:2px;}',
      '#gmail-view-next-frontpage .gvn-fp-filter{font-family:' + FONT + ';font-size:13px;font-weight:700;padding:4px 12px;background:var(--gvn-band);color:var(--gvn-ink);border:1px solid var(--gvn-rule);border-radius:2px;cursor:pointer;}',
      '#gmail-view-next-frontpage .gvn-fp-filter:hover{background:var(--gvn-gold);color:#1a1a1a;}',
      // Clickable digest chips + sender rows
      '#gmail-view-next-frontpage .gvn-fp-chip{cursor:pointer;}',
      '#gmail-view-next-frontpage .gvn-fp-chip:hover{background:var(--gvn-gold);color:#1a1a1a;border-color:var(--gvn-gold);}',
      '#gmail-view-next-frontpage .gvn-fp-bar-label{cursor:pointer;}',
      '#gmail-view-next-frontpage .gvn-fp-bar-row:hover .gvn-fp-bar-label{color:var(--gvn-gold);text-decoration:underline;}',
      // Bulk sender actions (per busiest-sender row)
      '#gmail-view-next-frontpage .gvn-fp-acts{display:inline-flex;gap:4px;margin-left:8px;}',
      '#gmail-view-next-frontpage .gvn-fp-act{font-family:' + FONT + ';font-size:10px;font-weight:700;line-height:1;padding:3px 6px;background:var(--gvn-band);color:var(--gvn-muted);border:1px solid var(--gvn-divider);border-radius:2px;cursor:pointer;text-transform:uppercase;letter-spacing:.04em;}',
      '#gmail-view-next-frontpage .gvn-fp-act:hover{color:#1a1a1a;background:var(--gvn-gold);border-color:var(--gvn-gold);}',
      // Domain colour legend
      '#gmail-view-next-frontpage .gvn-fp-legend{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:10px;padding-top:10px;border-top:1px solid var(--gvn-divider);}',
      '#gmail-view-next-frontpage .gvn-fp-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;}',
      '#gmail-view-next-frontpage .gvn-fp-legend-swatch{width:12px;height:12px;border-radius:2px;flex:0 0 auto;}',
      // Sci-fi accent pass: subtle gold glow on the panels, bars and masthead.
      '@keyframes gvnScifiPulse{0%,100%{box-shadow:0 0 0 1px var(--gvn-gold),0 0 10px rgba(201,168,76,.18);}50%{box-shadow:0 0 0 1px var(--gvn-gold),0 0 22px rgba(201,168,76,.45);}}',
      'html[data-gvn-scifi="true"] #gmail-view-next-frontpage{animation:gvnScifiPulse 4s ease-in-out infinite;}',
      'html[data-gvn-scifi="true"] #gmail-view-next-frontpage .gvn-fp-bar-fill{background:var(--gvn-gold);box-shadow:0 0 8px rgba(201,168,76,.65);}',
      'html[data-gvn-scifi="true"] #gmail-view-next-frontpage .gvn-fp-stat-num{text-shadow:0 0 10px rgba(201,168,76,.6);color:var(--gvn-gold);}',
      'html[data-gvn-scifi="true"][data-gvn-active="true"][data-gvn-route="inbox"] #gmail-view-next-ui .gvn-masthead{text-shadow:0 0 10px rgba(201,168,76,.55);}',
      '#gmail-view-next-health{position:fixed;z-index:2147483647;top:12px;left:50%;transform:translateX(-50%);max-width:540px;display:flex;align-items:center;gap:12px;padding:10px 14px;background:#fff8e1;color:#5f4b00;border:1px solid #e0c200;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.18);font:13px/1.45 Arial,sans-serif;}',
      '#gmail-view-next-health button{flex:0 0 auto;border:1px solid #b58900;background:#fff;color:#5f4b00;border-radius:5px;padding:4px 10px;font:600 12px Arial,sans-serif;cursor:pointer;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover td.bq4 .T-I{opacity:1!important;visibility:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] body,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .aAU,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .nH{background-color:' + outer + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .G-atb{background-color:var(--gvn-band)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-rail="true"] .bAw:not(:has(.IU)),',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-rail="true"] .aUx:not(:has(.IU)){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-sidebar-sized="true"] [data-gvn-sidebar-host="true"]{width:var(--gvn-sidebar-width)!important;min-width:var(--gvn-sidebar-width)!important;max-width:var(--gvn-sidebar-width)!important;flex:0 0 var(--gvn-sidebar-width)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-sidebar-sized="true"] [data-gvn-sidebar-nav="true"]{width:100%!important;max-width:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F{position:relative!important;z-index:0!important;isolation:isolate!important;background-color:var(--gvn-paper)!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tabs="true"] .aKh{display:none!important;}',
      (settings.mergeTabsRow
        ? 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh{position:fixed!important;z-index:999!important;top:var(--gvn-tabs-top,-9999px)!important;left:var(--gvn-tabs-left,0px)!important;width:var(--gvn-tabs-width,auto)!important;height:var(--gvn-tabs-height,auto)!important;margin:0!important;min-width:0!important;background:var(--gvn-band)!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh *{max-width:none!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh>div,html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh table,html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh tbody{width:100%!important;height:100%!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh [role="tablist"]{display:flex!important;width:100%!important;height:100%!important;align-items:stretch!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh [role="tablist"]>td[role="heading"]{flex:1 1 0!important;min-width:0!important;padding:0!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh [role="tablist"]>td:not([role="heading"]){display:none!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh [role="tab"]{width:100%!important;height:100%!important;min-width:0!important;display:flex!important;justify-content:center!important;align-items:center!important;}'
        : ''),
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tab-promotions="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Promotions"]){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tab-social="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Social"]){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tab-updates="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Updates"]){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tab-forums="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Forums"]){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-focus="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Promotions"]),html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-focus="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Social"]),html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-focus="true"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Forums"]){display:none!important;}',
      // Tab order "promotions-first": reorder the flex tab cells (merged tabs)
      // to Promotions -> Primary -> Social without touching Gmail\'s DOM.
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="promotions-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Promotions"]){order:1!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="promotions-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Primary"]){order:2!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="promotions-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Social"]){order:3!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="promotions-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Updates"]){order:4!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="promotions-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Forums"]){order:5!important;}',
      // Tab order "social-first": Social -> Primary -> Promotions.
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="social-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Social"]){order:1!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="social-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Primary"]){order:2!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="social-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Promotions"]){order:3!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="social-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Updates"]){order:4!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-tab-order="social-first"] .aKh td[role="heading"]:has([role="tab"][aria-label^="Forums"]){order:5!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F{margin-top:66px!important;width:var(--gvn-table-width,calc(100% - ' + rightInset + 'px))!important;max-width:var(--gvn-table-width,calc(100% - ' + rightInset + 'px))!important;min-width:0!important;table-layout:fixed!important;}',
      (listMaxWidth > 0
        ? 'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F{max-width:' + listMaxWidth + 'px!important;margin-left:auto!important;margin-right:auto!important;}'
        : ''),
      'html[data-gvn-active="true"][data-gvn-route="inbox"]:has(#gmail-view-next-ui[data-editing="true"]) table.F{margin-top:' + (78 + editorHeight) + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F col.yY{width:' + senderWidth + 'px!important;min-width:' + senderWidth + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] td.yX{width:' + senderWidth + 'px!important;min-width:' + senderWidth + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td{background-color:var(--gvn-paper)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover:not([data-gvn-group]),',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover:not([data-gvn-group]) td{background-color:' + HOVER + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover:not([data-gvn-group]) td.xW span,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover:not([data-gvn-group]) td.bq4 .bqY{background:' + HOVER + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:hover:not([data-gvn-group]) .xT::before{background-color:' + HOVER + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA{overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W{position:relative!important;z-index:3!important;min-width:0!important;overflow:visible!important;padding-left:' + contentIndent + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.yX{position:relative!important;z-index:1!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W .xS,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W .a4X{position:relative!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.yX,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W{vertical-align:middle!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .zF,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .yP,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA span[email]{font-family:' + FONT + '!important;font-size:' + senderFontSize + 'px!important;' + (settings.senderBold ? 'font-weight:700!important;' : '') + (settings.senderItalic ? 'font-style:italic!important;' : '') + 'letter-spacing:' + settings.senderLetterSpacing + 'px!important;word-spacing:' + settings.senderWordSpacing + 'px!important;color:var(--gvn-ink)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.yX .yW{position:relative!important;left:' + senderOffset + 'px!important;box-sizing:border-box!important;padding-left:' + senderTextGap + 'px!important;border-left:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .bog,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y6 .bog{font-family:' + FONT + '!important;font-size:' + subjectFontSize + 'px!important;font-weight:' + (settings.subjectBold ? 700 : 400) + '!important;font-style:' + (settings.subjectItalic ? 'italic' : 'normal') + '!important;letter-spacing:' + settings.subjectLetterSpacing + 'px!important;word-spacing:' + settings.subjectWordSpacing + 'px!important;color:var(--gvn-ink)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y2,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y2 span{font-family:' + FONT + '!important;font-size:' + previewFontSize + 'px!important;font-weight:' + (settings.previewBold ? 700 : 400) + '!important;font-style:' + (settings.previewItalic ? 'italic' : 'normal') + '!important;letter-spacing:' + settings.previewLetterSpacing + 'px!important;word-spacing:' + settings.previewWordSpacing + 'px!important;color:var(--gvn-muted)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xW,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.xW,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xW span{position:relative!important;z-index:2!important;background:var(--gvn-paper)!important;font-family:' + FONT + '!important;font-size:' + dateFontSize + 'px!important;' + (settings.dateBold ? 'font-weight:700!important;' : '') + 'font-style:' + (settings.dateItalic ? 'italic' : 'normal') + '!important;letter-spacing:' + settings.dateLetterSpacing + 'px!important;word-spacing:' + settings.dateWordSpacing + 'px!important;color:var(--gvn-ink)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.xW{position:relative!important;z-index:6!important;left:0!important;display:table-cell!important;vertical-align:middle!important;width:' + DATE_WIDTH + 'px!important;min-width:' + DATE_WIDTH + 'px!important;max-width:' + DATE_WIDTH + 'px!important;box-sizing:border-box!important;padding-left:' + dateTextGap + 'px!important;padding-right:6px!important;background:transparent!important;text-align:left!important;overflow:visible!important;white-space:nowrap!important;border-left:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .gvn-column-divider{position:absolute!important;z-index:40!important;display:block!important;top:-2px!important;bottom:-2px!important;width:1px!important;background:' + dividerColor + '!important;pointer-events:none!important;}',
      '#gmail-view-next-global-dividers{position:fixed;z-index:1;display:none;inset:0;pointer-events:none;}',
      '#gmail-view-next-global-dividers .gvn-global-divider{position:absolute;width:1px;background:' + dividerColor + '!important;pointer-events:none;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.xW>span{display:inline-block!important;transform:translateX(' + dateOffset + 'px)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4{position:relative!important;z-index:7!important;left:0!important;width:' + DATE_WIDTH + 'px!important;min-width:' + DATE_WIDTH + 'px!important;max-width:' + DATE_WIDTH + 'px!important;box-sizing:border-box!important;padding:0 8px!important;background:transparent!important;overflow:visible!important;border-left:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .bqY{position:relative!important;left:' + dateOffset + 'px!important;display:flex!important;align-items:center!important;justify-content:space-evenly!important;width:100%!important;height:' + rowHeight + 'px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;background:var(--gvn-paper)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .bqX{display:flex!important;flex:1 1 0!important;align-items:center!important;justify-content:center!important;width:auto!important;margin:0!important;padding:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .T-I{margin:0 auto!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y2 .Zt{display:none!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td{border-bottom:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA{border-bottom:1px solid ' + hairline + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:has(+ tr.zA[data-gvn-group]){border-bottom:0!important;}',
      (settings.unreadEmphasis
        ? 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .zF,\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .yP,\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE span[email]{font-weight:700!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .bog{font-weight:700!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.yO .bog{font-weight:400!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE td.yX .yW::before{content:"";display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:var(--gvn-gold);vertical-align:1px;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE>td:first-child{background-image:linear-gradient(var(--gvn-gold),var(--gvn-gold))!important;background-repeat:no-repeat!important;background-size:3px 100%!important;background-position:0 0!important;}'
        : ''),
      // Smart sender rules: hide removes the row, mute dims it and drops its
      // "new" emphasis, vip pins a persistent gold edge + bold sender.
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="hide"]{display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="mute"]{opacity:.5!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="mute"]>td:first-child{background-image:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="mute"] td.yX .yW::before{display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="vip"]>td:first-child{background-image:linear-gradient(var(--gvn-gold),var(--gvn-gold))!important;background-repeat:no-repeat!important;background-size:4px 100%!important;background-position:0 0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-rule="vip"] span[email]{font-weight:700!important;}',
      // Group-by-company: colour bar on the right of the sender column.
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-domain="true"] td.yX{box-shadow:inset -3px 0 0 var(--gvn-domain-color,transparent)!important;}',
      // Attachment marker: a small paperclip after the sender name.
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-attach="true"] span[email]::after{content:"\\01F4CE";font-size:11px;opacity:.55;margin-left:5px;}',
      // Sender frequency: a small "×N" before a repeat sender's name.
      'html[data-gvn-active="true"][data-gvn-route="inbox"] [data-gvn-freq]::before{content:"\\00D7" attr(data-gvn-freq) "\\00A0";font-weight:700;color:var(--gvn-gold);}',
      // Highlight rules: tint the row + a colour bar on the left edge.
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-highlight="true"] td{background-color:var(--gvn-highlight-bg,transparent)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-highlight="true"]>td:first-child{box-shadow:inset 4px 0 0 var(--gvn-highlight,transparent)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT{position:relative!important;z-index:4!important;display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;height:' + rowHeight + 'px!important;min-height:' + rowHeight + 'px!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT::before{content:"";position:relative!important;z-index:20!important;display:' + markDisplay + ';flex:0 0 22px!important;width:22px!important;height:22px!important;margin-left:4px!important;margin-right:30px!important;transform:translateX(' + logoShift + 'px) scale(' + logoScale + ')!important;transform-origin:center!important;background-image:var(--gvn-logo,none);background-color:var(--gvn-paper)!important;background-position:center;background-size:contain;background-repeat:no-repeat;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.12)!important;pointer-events:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .yi{display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y6{position:relative!important;left:' + subjectShift + 'px!important;flex:1 1 ' + subjectWidth + 'px!important;width:auto!important;min-width:280px!important;box-sizing:border-box!important;padding-left:' + subjectTextGap + 'px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y2{position:relative!important;left:' + previewOffset + 'px!important;flex:0 0 ' + PREVIEW_WIDTH + 'px!important;width:' + PREVIEW_WIDTH + 'px!important;max-width:' + PREVIEW_WIDTH + 'px!important;min-width:0!important;box-sizing:border-box!important;padding-left:' + previewTextGap + 'px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent)!important;mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W .brd{position:relative!important;left:var(--gvn-attachment-shift,0px)!important;box-sizing:border-box!important;margin-left:0!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group] td{padding-top:' + groupRowPadding + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group]{background-color:var(--gvn-paper)!important;background-image:linear-gradient(var(--gvn-rule),var(--gvn-rule)),linear-gradient(var(--gvn-rule),var(--gvn-rule))!important;background-repeat:no-repeat!important;background-size:100% 2px,100% 2px!important;background-position:0 0,0 ' + groupBottomLine + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group] td{background-color:transparent!important;background-image:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group] td.xW{border-left:0!important;background-color:transparent!important;background-image:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] td.a4W[data-gvn-group]{position:relative!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] td.a4W[data-gvn-group]::before{content:attr(data-gvn-group);position:absolute;top:' + groupLabelTop + 'px;left:' + groupLabelLeft + 'px;width:220px;box-sizing:border-box;padding-left:' + groupTextGap + 'px;border-left:0;text-align:left;font-family:' + FONT + '!important;font-size:' + groupFontSize + 'px!important;font-weight:' + (settings.groupBold ? 1000 : 400) + '!important;font-style:' + (settings.groupItalic ? 'italic' : 'normal') + '!important;line-height:20px;color:var(--gvn-ink)!important;letter-spacing:' + settings.groupLetterSpacing + 'px!important;word-spacing:' + settings.groupWordSpacing + 'px!important;text-transform:uppercase;pointer-events:none!important;white-space:nowrap;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xS,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .a4X,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y6,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y2{pointer-events:auto!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA *,',
      '#gmail-view-next-ui [data-column],',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] td.a4W[data-gvn-group]::before{font-feature-settings:"onum" 1,"kern" 1,"liga" 1!important;font-kerning:normal!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] *{scrollbar-color:transparent transparent!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] ::-webkit-scrollbar{width:10px!important;height:10px!important;background:transparent!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] ::-webkit-scrollbar-thumb{background:transparent!important;border-radius:0!important;border:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] ::-webkit-scrollbar-thumb:hover{background:transparent!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] ::-webkit-scrollbar-track,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] ::-webkit-scrollbar-corner{background:transparent!important;}',

      'html[data-gvn-active="true"][data-gvn-color-labels="true"] [data-gvn-label="true"] .qj{background-color:var(--gvn-label-color)!important;}',
      'html[data-gvn-active="true"] [data-gvn-label-entry="true"]{position:relative!important;font-size:var(--gvn-label-font-size,' + labelFontSize + 'px)!important;}',
      'html[data-gvn-active="true"] [data-gvn-label-entry="true"] a,',
      'html[data-gvn-active="true"] [data-gvn-label-entry="true"] span:not(.qj),',
      'html[data-gvn-active="true"] [data-gvn-label-entry="true"] .aio{font-size:var(--gvn-label-font-size,' + labelFontSize + 'px)!important;font-weight:var(--gvn-label-font-weight,inherit)!important;font-style:var(--gvn-label-font-style,normal)!important;line-height:1.35!important;}',
      'html[data-gvn-label-editing="true"] [data-gvn-label-entry="true"]{padding-right:24px!important;}',
      // Sub-label indent guides: a clear vertical line + indent on nested labels.
      'html[data-gvn-active="true"][data-gvn-label-indent="true"] [data-gvn-label-entry="true"][data-gvn-sublabel="true"]{box-shadow:inset 2px 0 0 var(--gvn-rule)!important;padding-left:16px!important;}',
      // Whole-row label tint: a wash of the label colour across the row.
      // Golden rail: a JS-positioned line from just under Compose to the bottom
      // of the sidebar (see positionSidebarRail).
      '#gmail-view-next-sidebar-rail{position:fixed;z-index:2;width:4px;background:var(--gvn-gold);pointer-events:none;display:none;}',
      // New-mail glow: a gold accent bar on labels that have unread mail.
      'html[data-gvn-active="true"][data-gvn-label-glow="true"] [data-gvn-label-entry="true"][data-gvn-label-unread="true"]{box-shadow:inset 5px 0 0 var(--gvn-gold)!important;}',
      '.gvn-label-check{position:absolute!important;z-index:1;right:5px;top:50%;width:14px!important;height:14px!important;margin:0!important;border:1px solid #777!important;border-radius:2px!important;box-sizing:border-box!important;transform:translateY(-50%);-webkit-appearance:none!important;appearance:none!important;background:#fff!important;cursor:pointer;pointer-events:auto!important;}',
      '.gvn-label-check:checked{border-color:#555!important;background:#555!important;}',
      '.gvn-label-check:checked::after{content:"";position:absolute;left:3px;top:2px;width:6px;height:3px;border:solid #fff;border-width:0 0 2px 2px;transform:rotate(-45deg);}',
      '#gmail-view-next-sidebar-resizer{position:fixed;z-index:3;display:none;width:14px;min-width:14px;margin:0;padding:0;border:0;background:transparent;cursor:ew-resize;pointer-events:auto;touch-action:none;outline:0;}',
      '#gmail-view-next-sidebar-resizer::before{content:"";position:absolute;left:6px;top:0;bottom:0;width:2px;background:#ededed;opacity:1;}',
      '#gmail-view-next-sidebar-resizer::after{content:"";position:absolute;left:2px;top:48%;width:10px;height:36px;transform:translateY(-50%);border:1px solid #d8d8d8;background:var(--gvn-paper);box-sizing:border-box;}',
      '#gmail-view-next-sidebar-resizer:hover::before,#gmail-view-next-sidebar-resizer:focus::before,#gmail-view-next-sidebar-resizer[data-active="true"]::before{width:4px;left:5px;opacity:1;}',
      '#gmail-view-next-sidebar-resizer:hover::after,#gmail-view-next-sidebar-resizer:focus::after,#gmail-view-next-sidebar-resizer[data-active="true"]::after{background:#d8d8d8;}',
      '#gmail-view-next-ui{position:fixed;z-index:2;isolation:isolate;display:none;pointer-events:none;box-sizing:border-box;color:var(--gvn-ink);}',
      '#gmail-view-next-ui .gvn-masthead{position:relative;z-index:2;height:34px;border-bottom:2px solid var(--gvn-rule);background:var(--gvn-band);box-sizing:border-box;text-align:center;font-family:' + FONT + ';font-size:' + inboxFontSize + 'px;font-weight:' + (settings.inboxBold ? 900 : 400) + ';font-style:' + (settings.inboxItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.inboxLetterSpacing + 'px;word-spacing:' + settings.inboxWordSpacing + 'px;line-height:30px;text-transform:uppercase;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead{height:' + editorMastheadHeight + 'px;}',
      '#gmail-view-next-ui .gvn-masthead-title{position:absolute;top:0;left:50%;display:inline-block;padding-bottom:2px;transform:translateX(-50%);pointer-events:none;white-space:nowrap;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead-title{pointer-events:auto;cursor:ew-resize;outline:0;background:transparent;border-radius:4px;top:auto;bottom:4px;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead-title[data-selected="true"]{background:#f4f0e3;}',
      '#gmail-view-next-ui .gvn-bg-toggle{position:absolute;left:8px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-bg-toggle[data-active="true"]{background:#000;color:#fff;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-bg-toggle,#gmail-view-next-ui[data-label-editing="true"] .gvn-bg-toggle{display:none!important;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-quick-button,#gmail-view-next-ui[data-label-editing="true"] .gvn-quick-button,#gmail-view-next-ui[data-editing="true"] .gvn-tab-focus,#gmail-view-next-ui[data-label-editing="true"] .gvn-tab-focus,#gmail-view-next-ui[data-editing="true"] .gvn-tab-order,#gmail-view-next-ui[data-label-editing="true"] .gvn-tab-order{display:none!important;}',
      '#gmail-view-next-ui .gvn-edit-master{position:absolute;right:8px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-edit-master:hover,#gmail-view-next-ui[data-edit-menu="true"] .gvn-edit-master{background:#000;color:#fff;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-edit-master,#gmail-view-next-ui[data-label-editing="true"] .gvn-edit-master{display:none!important;}',
      '#gmail-view-next-ui:not([data-editing="true"]):not([data-label-editing="true"]):not([data-edit-menu="true"]) .gvn-edit-button,#gmail-view-next-ui:not([data-editing="true"]):not([data-label-editing="true"]):not([data-edit-menu="true"]) .gvn-label-edit-button{display:none!important;}',
      '#gmail-view-next-ui[data-edit-menu="true"] .gvn-edit-button{right:92px!important;}',
      '#gmail-view-next-ui[data-edit-menu="true"] .gvn-label-edit-button{right:176px!important;}',
      '#gmail-view-next-ui .gvn-edit-button{position:absolute;right:8px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-edit-button:hover,#gmail-view-next-ui[data-editing="true"] .gvn-edit-button{background:#000;color:#fff;}',
      '#gmail-view-next-ui .gvn-label-edit-button{position:absolute;right:112px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-label-edit-button:hover,#gmail-view-next-ui[data-label-editing="true"] .gvn-label-edit-button{background:#000;color:#fff;}',
      '#gmail-view-next-ui .gvn-inspect-button{position:absolute;right:260px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-inspect-button:hover{background:#000;color:#fff;}',
      '#gmail-view-next-ui:not([data-edit-menu="true"]) .gvn-inspect-button{display:none!important;}',
      '#gmail-view-next-ui .gvn-center-button{display:none;position:absolute;right:132px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.6px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-center-button{display:block;}',
      '#gmail-view-next-ui .gvn-center-button:hover{background:var(--gvn-gold);color:#000;}',
      '#gmail-view-next-ui .gvn-type-editor{display:none;position:absolute;left:8px;top:5px;height:22px;align-items:center;gap:5px;font:700 10px/20px Arial,sans-serif;letter-spacing:.5px;pointer-events:auto;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-type-editor{display:flex;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-type-editor,#gmail-view-next-ui[data-editing="true"] .gvn-center-button,#gmail-view-next-ui[data-editing="true"] .gvn-edit-button{top:' + editorTop + 'px;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-type-editor{right:' + editorRightReserve + 'px;height:' + editorHeight + 'px;gap:' + editorGap + 'px;font:700 ' + editorFontSize + 'px/' + editorHeight + 'px Arial,sans-serif;letter-spacing:0;flex-wrap:nowrap;overflow:visible;}',
      '#gmail-view-next-ui .gvn-type-editor button{min-width:' + editorMinWidth + 'px;height:' + editorHeight + 'px;padding:0 ' + editorPadding + 'px;border:1px solid #000;border-radius:5px;background:#fff;color:#000;font:600 ' + editorFontSize + 'px/' + editorLineHeight + 'px Arial,sans-serif;white-space:nowrap;cursor:pointer;}',
      '#gmail-view-next-ui .gvn-type-editor button:hover,#gmail-view-next-ui .gvn-type-editor button[data-active="true"]{background:#000;color:#fff;border-color:#000;}',
      '#gmail-view-next-ui .gvn-type-editor button:disabled{opacity:.35;cursor:default;}',
      '#gmail-view-next-ui .gvn-select-all{width:' + editorSelectSize + 'px;height:' + editorSelectSize + 'px;margin:0 1px;accent-color:#555;cursor:pointer;}',
      '#gmail-view-next-ui .gvn-scope{display:none;align-items:center;gap:3px;height:' + editorHeight + 'px;padding:0 5px;border:1px solid #000;border-radius:5px;background:#fff;color:#000;font:600 ' + editorFontSize + 'px/' + editorLineHeight + 'px Arial,sans-serif;letter-spacing:0;white-space:nowrap;cursor:pointer;}',
      '#gmail-view-next-ui[data-label-editing="true"] .gvn-scope{display:inline-flex;}',
      '#gmail-view-next-ui .gvn-scope-check{width:' + editorSelectSize + 'px;height:' + editorSelectSize + 'px;margin:0;accent-color:#555;cursor:pointer;}',
      '#gmail-view-next-ui .gvn-type-name{display:none;}',
      '#gmail-view-next-ui .gvn-type-value,#gmail-view-next-ui .gvn-style-value{display:inline-flex;align-items:center;justify-content:center;min-width:' + editorValueWidth + 'px;height:' + editorHeight + 'px;padding:0 5px;box-sizing:border-box;text-align:center;font-size:' + editorFontSize + 'px;font-weight:700;background:#fff;color:#000;border:1px solid #000;border-radius:5px;cursor:text;outline:0;white-space:nowrap;}',
      '#gmail-view-next-ui .gvn-type-value:focus,#gmail-view-next-ui .gvn-style-value:focus{box-shadow:0 0 0 2px ' + GOLD + ';}',
      '#gmail-view-next-ui .gvn-editor-resizer{position:relative;display:block;flex:0 0 ' + Math.max(12, Math.round(18 * editorScale)) + 'px;min-width:' + Math.max(12, Math.round(18 * editorScale)) + 'px!important;width:' + Math.max(12, Math.round(18 * editorScale)) + 'px;height:' + editorHeight + 'px;padding:0!important;border:0!important;background:transparent!important;cursor:ew-resize;touch-action:none;outline:0;}',
      '#gmail-view-next-ui .gvn-editor-resizer::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;transform:translateX(-50%);background:#ededed;}',
      '#gmail-view-next-ui .gvn-editor-resizer::after{content:"";position:absolute;left:50%;top:50%;width:8px;height:' + Math.max(12, Math.round(editorHeight * 0.65)) + 'px;transform:translate(-50%,-50%);border:1px solid #d8d8d8;background:#fff;}',
      '#gmail-view-next-ui .gvn-editor-resizer:hover::after,#gmail-view-next-ui .gvn-editor-resizer:focus::after,#gmail-view-next-ui .gvn-editor-resizer[data-active="true"]::after{background:#d8d8d8;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-center-button,#gmail-view-next-ui[data-editing="true"] .gvn-edit-button{height:' + editorHeight + 'px;padding:0 ' + editorSidePadding + 'px;font:800 ' + editorActionFont + 'px/' + editorLineHeight + 'px Arial,sans-serif;}',
      '#gmail-view-next-ui[data-editing="true"]:not([data-label-editing="true"]) .gvn-label-edit-button{display:none;}',
      '#gmail-view-next-ui[data-label-editing="true"] .gvn-edit-button,#gmail-view-next-ui[data-label-editing="true"] .gvn-center-button{display:none!important;}',
      '#gmail-view-next-ui[data-label-editing="true"] .gvn-label-edit-button{display:block;right:8px;top:' + editorTop + 'px;height:' + editorHeight + 'px;padding:0 ' + editorSidePadding + 'px;font:800 ' + editorActionFont + 'px/' + editorLineHeight + 'px Arial,sans-serif;}',
      '#gmail-view-next-ui[data-label-editing="true"] [data-style-adjust]{display:none;}',
      '#gmail-view-next-ui .gvn-columns{position:relative;z-index:2;height:26px;border-bottom:2px solid var(--gvn-rule);background:var(--gvn-band);box-sizing:border-box;overflow:hidden;}',
      '#gmail-view-next-ui .gvn-columns span{position:absolute;top:3px;font-family:' + FONT + ';font-size:16px;font-weight:1000;line-height:18px;color:var(--gvn-ink);letter-spacing:.5px;text-transform:uppercase;white-space:nowrap;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="sender"]{font-weight:' + (settings.senderBold ? 1000 : 400) + ';font-style:' + (settings.senderItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.senderLetterSpacing + 'px;word-spacing:' + settings.senderWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="time-sent"]{font-weight:' + (settings.groupBold ? 1000 : 400) + ';font-style:' + (settings.groupItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.groupLetterSpacing + 'px;word-spacing:' + settings.groupWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="logo"]{font-weight:' + (settings.logoBold ? 1000 : 400) + ';font-style:' + (settings.logoItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.logoLetterSpacing + 'px;word-spacing:' + settings.logoWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="subject"]{font-weight:' + (settings.subjectBold ? 1000 : 400) + ';font-style:' + (settings.subjectItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.subjectLetterSpacing + 'px;word-spacing:' + settings.subjectWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="preview"]{font-weight:' + (settings.previewBold ? 1000 : 400) + ';font-style:' + (settings.previewItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.previewLetterSpacing + 'px;word-spacing:' + settings.previewWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label[data-column="date"]{font-weight:' + (settings.dateBold ? 1000 : 400) + ';font-style:' + (settings.dateItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.dateLetterSpacing + 'px;word-spacing:' + settings.dateWordSpacing + 'px;}',
      '#gmail-view-next-ui .gvn-column-label{pointer-events:none;user-select:none;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-column-label{z-index:6;pointer-events:auto;cursor:ew-resize;padding:0 6px;margin-left:-6px;outline:0;background:transparent;border-radius:4px;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-column-label[data-selected="true"]{background:#f4f0e3;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-column-label:hover,#gmail-view-next-ui[data-editing="true"] .gvn-column-label:focus,#gmail-view-next-ui[data-editing="true"] .gvn-column-label[data-active="true"]{color:#fff;background:#000;}',
      '#gmail-view-next-ui .gvn-resize-handle{display:none;position:absolute;z-index:4;top:0;width:18px;height:26px;transform:translateX(-9px);cursor:col-resize;pointer-events:auto;touch-action:none;outline:0;}',
      '#gmail-view-next-ui .gvn-resize-handle::before{content:"";position:absolute;left:8px;top:-1px;width:2px;height:29px;background:#ededed!important;}',
      '#gmail-view-next-ui .gvn-resize-handle::after{content:attr(data-title);display:none;position:absolute;left:10px;top:28px;padding:4px 7px;background:#000;color:#fff;font:700 10px/1 Arial,sans-serif;letter-spacing:.4px;white-space:nowrap;}',
      '#gmail-view-next-ui .gvn-column-check{display:none;position:absolute;z-index:12;top:5px;width:14px!important;height:14px!important;margin:0!important;border:1px solid #777!important;border-radius:2px!important;box-sizing:border-box!important;opacity:1!important;visibility:visible!important;-webkit-appearance:none!important;appearance:none!important;background:#fff!important;box-shadow:0 0 0 1px rgba(255,255,255,.9)!important;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-column-check:checked{border-color:#555!important;background:#555!important;}',
      '#gmail-view-next-ui .gvn-column-check:checked::after{content:"";position:absolute;left:3px;top:2px;width:6px;height:3px;border:solid #fff;border-width:0 0 2px 2px;transform:rotate(-45deg);}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-columns{overflow:visible;pointer-events:auto;background:#fff;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-resize-handle{display:block;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-column-check{display:block;}',
      '#gmail-view-next-ui[data-label-editing="true"] .gvn-resize-handle,#gmail-view-next-ui[data-label-editing="true"] .gvn-column-check{display:none!important;}',
      '#gmail-view-next-ui[data-label-editing="true"] .gvn-column-label,#gmail-view-next-ui[data-label-editing="true"] .gvn-masthead-title{pointer-events:none!important;cursor:default!important;background:transparent!important;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-resize-handle:hover::after,#gmail-view-next-ui[data-editing="true"] .gvn-resize-handle:focus::after,#gmail-view-next-ui[data-dragging="true"] .gvn-resize-handle[data-active="true"]::after{display:block;}',
      '#gmail-view-next-ui[data-dragging="true"],#gmail-view-next-ui[data-dragging="true"] *{cursor:ew-resize!important;user-select:none!important;}',

      '@media(max-width:1100px){',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F col.yY,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] td.yX{width:' + compactSenderWidth + 'px!important;min-width:' + compactSenderWidth + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W{padding-left:' + compactContentIndent + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y6{min-width:180px!important;flex-basis:min(' + subjectWidth + 'px,38vw)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y2{flex-basis:160px!important;width:160px!important;max-width:160px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.xW,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4{width:140px!important;min-width:140px!important;max-width:140px!important;}',
      '}'
    ].join('\n');
  }

  return Object.freeze({ buildCss: buildCss });
});
