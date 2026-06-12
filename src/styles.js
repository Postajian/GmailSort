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
    var rowHeight = Math.round(settings.rowHeight);
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

    return [
      ':root{--gvn-gold:' + GOLD + ';--gvn-divider:' + DIVIDER + ';--gvn-ink:' + INK + ';--gvn-muted:' + MUTED + ';--gvn-paper:' + PAPER + ';--gvn-sidebar-width:' + sidebarWidth + 'px;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] body,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .aAU,',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .nH{background-color:var(--gvn-paper)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-rail="true"] .bAw:not(:has(.IU)),',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-rail="true"] .aUx:not(:has(.IU)){display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-sidebar-sized="true"] [data-gvn-sidebar-host="true"]{width:var(--gvn-sidebar-width)!important;min-width:var(--gvn-sidebar-width)!important;max-width:var(--gvn-sidebar-width)!important;flex:0 0 var(--gvn-sidebar-width)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-sidebar-sized="true"] [data-gvn-sidebar-nav="true"]{width:100%!important;max-width:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F{position:relative!important;z-index:0!important;isolation:isolate!important;background-color:var(--gvn-paper)!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"][data-gvn-hide-tabs="true"] .aKh{display:none!important;}',
      (settings.mergeTabsRow
        ? 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh{position:fixed!important;z-index:999!important;top:var(--gvn-tabs-top,-9999px)!important;left:var(--gvn-tabs-left,0px)!important;width:var(--gvn-tabs-width,auto)!important;height:var(--gvn-tabs-height,auto)!important;margin:0!important;min-width:0!important;background:#fff!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh>div{width:100%!important;max-width:none!important;height:100%!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh div[role="tablist"]{display:flex!important;width:100%!important;max-width:none!important;height:100%!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh div[role="tab"]{flex:1 1 0!important;min-width:0!important;max-width:none!important;display:flex!important;justify-content:center!important;align-items:center!important;height:100%!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh table{width:100%!important;max-width:none!important;table-layout:fixed!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"]:not([data-gvn-hide-tabs="true"]) .aKh td{width:auto!important;min-width:0!important;max-width:none!important;text-align:center!important;}'
        : ''),
      'html[data-gvn-active="true"][data-gvn-route="inbox"] table.F{margin-top:66px!important;width:var(--gvn-table-width,calc(100% - ' + rightInset + 'px))!important;max-width:var(--gvn-table-width,calc(100% - ' + rightInset + 'px))!important;min-width:0!important;table-layout:fixed!important;}',
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
      'html[data-gvn-active="true"][data-gvn-route="inbox"] .gvn-column-divider{position:absolute!important;z-index:40!important;display:block!important;top:-2px!important;bottom:-2px!important;width:1px!important;background:#ededed!important;pointer-events:none!important;}',
      '#gmail-view-next-global-dividers{position:fixed;z-index:1;display:none;inset:0;pointer-events:none;}',
      '#gmail-view-next-global-dividers .gvn-global-divider{position:absolute;width:1px;background:#ededed!important;pointer-events:none;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.xW>span{display:inline-block!important;transform:translateX(' + dateOffset + 'px)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4{position:relative!important;z-index:7!important;left:0!important;width:' + DATE_WIDTH + 'px!important;min-width:' + DATE_WIDTH + 'px!important;max-width:' + DATE_WIDTH + 'px!important;box-sizing:border-box!important;padding:0 8px!important;background:transparent!important;overflow:visible!important;border-left:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .bqY{position:relative!important;left:' + dateOffset + 'px!important;display:flex!important;align-items:center!important;justify-content:space-evenly!important;width:100%!important;height:' + rowHeight + 'px!important;margin:0!important;padding:0!important;box-sizing:border-box!important;background:var(--gvn-paper)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .bqX{display:flex!important;flex:1 1 0!important;align-items:center!important;justify-content:center!important;width:auto!important;margin:0!important;padding:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.bq4 .T-I{margin:0 auto!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .y2 .Zt{display:none!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td{border-bottom:0!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA{border-bottom:1px solid ' + HAIRLINE + '!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA:has(+ tr.zA[data-gvn-group]){border-bottom:0!important;}',
      (settings.unreadEmphasis
        ? 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .zF,\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .yP,\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE span[email]{font-weight:700!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE .bog{font-weight:700!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.yO .bog{font-weight:400!important;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE td.yX .yW::before{content:"";display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:' + GOLD + ';vertical-align:1px;}\n'
          + 'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA.zE>td:first-child{background-image:linear-gradient(' + GOLD + ',' + GOLD + ')!important;background-repeat:no-repeat!important;background-size:3px 100%!important;background-position:0 0!important;}'
        : ''),
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT{position:relative!important;z-index:4!important;display:flex!important;align-items:center!important;width:100%!important;min-width:0!important;height:' + rowHeight + 'px!important;min-height:' + rowHeight + 'px!important;overflow:visible!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT::before{content:"";position:relative!important;z-index:20!important;display:' + markDisplay + ';flex:0 0 22px!important;width:22px!important;height:22px!important;margin-left:4px!important;margin-right:30px!important;transform:translateX(' + logoShift + 'px) scale(' + logoScale + ')!important;transform-origin:center!important;background-image:var(--gvn-logo,none);background-color:var(--gvn-paper)!important;background-position:center;background-size:contain;background-repeat:no-repeat;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.12)!important;pointer-events:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .yi{display:none!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y6{position:relative!important;left:' + subjectShift + 'px!important;flex:1 1 ' + subjectWidth + 'px!important;width:auto!important;min-width:280px!important;box-sizing:border-box!important;padding-left:' + subjectTextGap + 'px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA .xT .y2{position:relative!important;left:' + previewOffset + 'px!important;flex:0 0 ' + PREVIEW_WIDTH + 'px!important;width:' + PREVIEW_WIDTH + 'px!important;max-width:' + PREVIEW_WIDTH + 'px!important;min-width:0!important;box-sizing:border-box!important;padding-left:' + previewTextGap + 'px!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important;-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent)!important;mask-image:linear-gradient(to right,#000 calc(100% - 32px),transparent)!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA td.a4W .brd{position:relative!important;left:var(--gvn-attachment-shift,0px)!important;box-sizing:border-box!important;margin-left:0!important;}',

      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group] td{padding-top:' + groupRowPadding + 'px!important;}',
      'html[data-gvn-active="true"][data-gvn-route="inbox"] tr.zA[data-gvn-group]{background-color:var(--gvn-paper)!important;background-image:linear-gradient(#000,#000),linear-gradient(#000,#000)!important;background-repeat:no-repeat!important;background-size:100% 2px,100% 2px!important;background-position:0 0,0 ' + groupBottomLine + 'px!important;}',
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
      '.gvn-label-check{position:absolute!important;z-index:1;right:5px;top:50%;width:14px!important;height:14px!important;margin:0!important;border:1px solid #777!important;border-radius:2px!important;box-sizing:border-box!important;transform:translateY(-50%);-webkit-appearance:none!important;appearance:none!important;background:#fff!important;cursor:pointer;pointer-events:auto!important;}',
      '.gvn-label-check:checked{border-color:#555!important;background:#555!important;}',
      '.gvn-label-check:checked::after{content:"";position:absolute;left:3px;top:2px;width:6px;height:3px;border:solid #fff;border-width:0 0 2px 2px;transform:rotate(-45deg);}',
      '#gmail-view-next-sidebar-resizer{position:fixed;z-index:3;display:none;width:14px;min-width:14px;margin:0;padding:0;border:0;background:transparent;cursor:ew-resize;pointer-events:auto;touch-action:none;outline:0;}',
      '#gmail-view-next-sidebar-resizer::before{content:"";position:absolute;left:6px;top:0;bottom:0;width:2px;background:#ededed;opacity:1;}',
      '#gmail-view-next-sidebar-resizer::after{content:"";position:absolute;left:2px;top:48%;width:10px;height:36px;transform:translateY(-50%);border:1px solid #d8d8d8;background:var(--gvn-paper);box-sizing:border-box;}',
      '#gmail-view-next-sidebar-resizer:hover::before,#gmail-view-next-sidebar-resizer:focus::before,#gmail-view-next-sidebar-resizer[data-active="true"]::before{width:4px;left:5px;opacity:1;}',
      '#gmail-view-next-sidebar-resizer:hover::after,#gmail-view-next-sidebar-resizer:focus::after,#gmail-view-next-sidebar-resizer[data-active="true"]::after{background:#d8d8d8;}',
      '#gmail-view-next-ui{position:fixed;z-index:2;isolation:isolate;display:none;pointer-events:none;box-sizing:border-box;color:var(--gvn-ink);}',
      '#gmail-view-next-ui .gvn-masthead{position:relative;z-index:2;height:34px;border-bottom:2px solid #000;background:var(--gvn-paper);box-sizing:border-box;text-align:center;font-family:' + FONT + ';font-size:' + inboxFontSize + 'px;font-weight:' + (settings.inboxBold ? 900 : 400) + ';font-style:' + (settings.inboxItalic ? 'italic' : 'normal') + ';letter-spacing:' + settings.inboxLetterSpacing + 'px;word-spacing:' + settings.inboxWordSpacing + 'px;line-height:30px;text-transform:uppercase;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead{height:' + editorMastheadHeight + 'px;}',
      '#gmail-view-next-ui .gvn-masthead-title{position:absolute;top:0;left:50%;display:inline-block;padding-bottom:2px;transform:translateX(-50%);pointer-events:none;white-space:nowrap;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead-title{pointer-events:auto;cursor:ew-resize;outline:0;background:transparent;border-radius:4px;top:auto;bottom:4px;}',
      '#gmail-view-next-ui[data-editing="true"] .gvn-masthead-title[data-selected="true"]{background:#f4f0e3;}',
      '#gmail-view-next-ui .gvn-edit-button{position:absolute;right:8px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-edit-button:hover,#gmail-view-next-ui[data-editing="true"] .gvn-edit-button{background:#000;color:#fff;}',
      '#gmail-view-next-ui .gvn-label-edit-button{position:absolute;right:112px;top:5px;height:22px;padding:0 10px;border:1px solid #000;border-radius:6px;background:#fff;color:#000;font:600 10px/20px Arial,sans-serif;letter-spacing:.8px;text-transform:uppercase;cursor:pointer;pointer-events:auto;}',
      '#gmail-view-next-ui .gvn-label-edit-button:hover,#gmail-view-next-ui[data-label-editing="true"] .gvn-label-edit-button{background:#000;color:#fff;}',
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
      '#gmail-view-next-ui .gvn-columns{position:relative;z-index:2;height:26px;border-bottom:2px solid #000;background:var(--gvn-paper);box-sizing:border-box;overflow:hidden;}',
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
