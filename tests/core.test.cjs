const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');

const NOW = new Date('2026-06-08T12:00:00+02:00');

test('normalizes settings and clamps layout values', () => {
  const value = core.normalizeSettings({
    enabled: false,
    masthead: '  A VERY LONG CUSTOM INBOX TITLE  ',
    rowHeight: 500,
    inboxFontSize: 2,
    inboxLetterSpacing: 99,
    inboxWordSpacing: -4,
    inboxOffset: 20000,
    sidebarWidth: 999,
    editorScale: 9,
    labelFontSize: 99,
    senderFontSize: 2,
    senderTextGap: 999,
    groupFontSize: 90,
    logoSize: 2,
    subjectFontSize: 90,
    previewFontSize: 2,
    dateFontSize: 90,
    senderWidth: 20,
    contentIndent: 999,
    senderOffset: -20000,
    timeSentOffset: 20000,
    logoOffset: -10,
    subjectGap: -20000,
    subjectWidth: 10,
    previewOffset: -20000,
    dateOffset: 20000,
    rightInset: 'bad',
    headerSenderX: -50,
    headerDateX: 50000
  });

  assert.equal(value.enabled, false);
  assert.equal(value.masthead.length, 24);
  assert.equal(value.rowHeight, 72);
  assert.equal(value.inboxFontSize, 8);
  assert.equal(value.inboxLetterSpacing, 16);
  assert.equal(value.inboxWordSpacing, 0);
  assert.equal(value.inboxOffset, 10000);
  assert.equal(value.sidebarWidth, 720);
  assert.equal(value.editorScale, 1.25);
  assert.equal(value.labelFontSize, 32);
  assert.equal(value.senderFontSize, 8);
  assert.equal(value.senderTextGap, 80);
  assert.equal(value.groupFontSize, 40);
  assert.equal(value.logoSize, 10);
  assert.equal(value.subjectFontSize, 40);
  assert.equal(value.previewFontSize, 8);
  assert.equal(value.dateFontSize, 40);
  assert.equal(value.senderWidth, 160);
  assert.equal(value.contentIndent, 240);
  assert.equal(value.senderOffset, -10000);
  assert.equal(value.timeSentOffset, 10000);
  assert.equal(value.logoOffset, -10);
  assert.equal(value.subjectGap, -10000);
  assert.equal(value.subjectWidth, 280);
  assert.equal(value.previewOffset, -10000);
  assert.equal(value.dateOffset, 10000);
  assert.equal(value.rightInset, core.DEFAULT_SETTINGS.rightInset);
  assert.equal(value.headerSenderX, -1);
  assert.equal(value.headerDateX, 10000);
});

test('uses the enlarged custom-label default', () => {
  assert.equal(core.DEFAULT_SETTINGS.labelFontSize, 18);
});

test('classifies nested labels as sub-labels and top-level as main', () => {
  assert.equal(core.isSubLabel('Money/PayPal'), true);
  assert.equal(core.isSubLabel('Money/PayPal/Klarna'), true);
  assert.equal(core.isSubLabel('Money'), false);
  assert.equal(core.isSubLabel('Newsletters'), false);
  assert.equal(core.isSubLabel(''), false);
  assert.equal(core.isSubLabel(undefined), false);
});

test('license: 15-day trial, then expires; paid always unlocks', () => {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.parse('2026-06-15T12:00:00Z');
  assert.equal(core.TRIAL_DAYS, 15);
  assert.equal(core.licenseState(now - 999 * DAY, now, true).state, 'paid');
  assert.equal(core.licenseState(now, now, false).state, 'trial');
  assert.equal(core.licenseState(now, now, false).daysLeft, 15);
  assert.equal(core.licenseState(now - 5 * DAY, now, false).daysLeft, 10);
  assert.equal(core.licenseState(now - 15 * DAY, now, false).state, 'expired');
  assert.equal(core.licenseState(now - 30 * DAY, now, false).state, 'expired');
  assert.equal(core.licenseState(0, now, false).state, 'trial');
});

test('fetches real sender logos by default and lets it toggle off', () => {
  assert.equal(core.DEFAULT_SETTINGS.richLogos, true);
  assert.equal(core.normalizeSettings({}).richLogos, true);
  assert.equal(core.normalizeSettings({ richLogos: false }).richLogos, false);
});

test('keeps Gmail category tabs visible by default', () => {
  assert.equal(core.DEFAULT_SETTINGS.hideTabs, false);
  assert.equal(core.normalizeSettings({}).hideTabs, false);
  assert.equal(core.normalizeSettings({ hideTabs: true }).hideTabs, true);
});

test('keeps each individual category tab shown by default and hides per setting', () => {
  ['hideTabPromotions', 'hideTabSocial', 'hideTabUpdates', 'hideTabForums'].forEach((key) => {
    assert.equal(core.DEFAULT_SETTINGS[key], false, key + ' default');
    assert.equal(core.normalizeSettings({})[key], false, key + ' normalize default');
    assert.equal(core.normalizeSettings({ [key]: true })[key], true, key + ' opt-in');
  });
});

test('density defaults to comfortable and only accepts compact/comfortable', () => {
  assert.equal(core.DEFAULT_SETTINGS.density, 'comfortable');
  assert.equal(core.normalizeSettings({}).density, 'comfortable');
  assert.equal(core.normalizeSettings({ density: 'compact' }).density, 'compact');
  assert.equal(core.normalizeSettings({ density: 'nonsense' }).density, 'comfortable');
});

test('focus mode is off by default and opt-in', () => {
  assert.equal(core.DEFAULT_SETTINGS.focusMode, false);
  assert.equal(core.normalizeSettings({}).focusMode, false);
  assert.equal(core.normalizeSettings({ focusMode: true }).focusMode, true);
});

test('umbrella roll-up is off by default and opt-in', () => {
  assert.equal(core.DEFAULT_SETTINGS.umbrellaRollup, false);
  assert.equal(core.normalizeSettings({}).umbrellaRollup, false);
  assert.equal(core.normalizeSettings({ umbrellaRollup: true }).umbrellaRollup, true);
});

test('decodes the label path from a Gmail hash', () => {
  assert.equal(core.decodeLabelHash('#label/Money'), 'Money');
  assert.equal(core.decodeLabelHash('#label/Money%2FPayPal'), 'Money/PayPal');
  assert.equal(core.decodeLabelHash('#label/Money%2FPayPal/p2'), 'Money/PayPal');
  assert.equal(core.decodeLabelHash('#label/My%20Label'), 'My Label');
  assert.equal(core.decodeLabelHash('#inbox'), '');
  assert.equal(core.decodeLabelHash('#search/foo'), '');
  assert.equal(core.decodeLabelHash(''), '');
});

test('builds a roll-up search for a parent and all its sub-labels only', () => {
  const all = ['Money', 'Money/PayPal', 'Money/Bank', 'Work', 'Work/HR'];
  assert.equal(
    core.labelRollupQuery('Money', all),
    'label:"Money" OR label:"Money/PayPal" OR label:"Money/Bank"'
  );
  // A leaf (no descendants) returns "" so normal Gmail navigation is kept.
  assert.equal(core.labelRollupQuery('Money/PayPal', all), '');
  assert.equal(core.labelRollupQuery('Work', all), 'label:"Work" OR label:"Work/HR"');
  // "Money" must not pull in an unrelated label that merely shares a prefix.
  assert.equal(core.labelRollupQuery('Mon', ['Mon', 'Money', 'Money/PayPal']), '');
});

test('recognizes inbox, thread, and other routes', () => {
  assert.equal(core.routeMode('#inbox'), 'inbox');
  assert.equal(core.routeMode('#inbox/FMfcgzQ123456789'), 'thread');
  assert.equal(core.routeMode('#sent'), 'other');
});

test('creates a centered screen-fit layout without changing typography', () => {
  const value = core.centeredLayoutSettings({
    ...core.DEFAULT_SETTINGS,
    senderFontSize: 19,
    senderOffset: 700,
    headerDateX: 9000
  }, 2270);

  assert.equal(value.senderFontSize, 19);
  assert.equal(value.senderWidth, 200);
  assert.equal(value.contentIndent, 148);
  assert.equal(value.subjectWidth, 493);
  assert.equal(value.senderOffset, 0);
  assert.equal(value.logoOffset, 4);
  assert.equal(value.subjectGap, 30);
  assert.equal(value.rightInset, 16);
  assert.equal(value.headerDateX, -1);
  assert.equal(value.senderTextGap, 20);
  assert.equal(value.groupTextGap, 20);
  assert.equal(value.logoTextGap, 20);
  assert.equal(value.subjectTextGap, 20);
  assert.equal(value.previewTextGap, 20);
  assert.equal(value.dateTextGap, 20);
});

test('parses a same-day clock without moving into the future', () => {
  assert.equal(
    core.parseGmailDate('11:30', NOW).toISOString(),
    '2026-06-08T09:30:00.000Z'
  );
  assert.equal(
    core.parseGmailDate('23:30', NOW).toISOString(),
    '2026-06-07T21:30:00.000Z'
  );
});

test('parses English and German short dates', () => {
  assert.equal(core.parseGmailDate('Jun 7', NOW).getMonth(), 5);
  assert.equal(core.parseGmailDate('Mai 30', NOW).getMonth(), 4);
  assert.equal(core.parseGmailDate('Okt 2, 2025', NOW).getMonth(), 9);
  assert.equal(core.parseGmailDate('7. Juni', NOW).getMonth(), 5);
});

test('groups messages by Gmail-style calendar buckets', () => {
  assert.equal(core.groupForDate(new Date('2026-06-08T11:00:00+02:00'), NOW), 'LAST 24 HOURS');
  assert.equal(core.groupForDate(new Date('2026-06-07T00:01:00+02:00'), NOW), 'LAST 24 HOURS');
  assert.equal(core.groupForDate(new Date('2026-06-06T11:00:00+02:00'), NOW), 'LAST 3 DAYS');
  assert.equal(core.groupForDate(new Date('2026-06-03T11:00:00+02:00'), NOW), 'LAST 7 DAYS');
  assert.equal(
    core.groupForDate(
      new Date('2026-06-01T11:00:00+02:00'),
      new Date('2026-06-20T12:00:00+02:00')
    ),
    'THIS MONTH'
  );
  assert.equal(core.groupForDate(new Date('2026-05-01T11:00:00+02:00'), NOW), 'MAY 2026');
});

test('labels archive months by name and keeps OLDER for unparseable dates', () => {
  assert.equal(core.groupForDate(new Date('2026-05-19T11:00:00+02:00'), NOW), 'MAY 2026');
  assert.equal(core.groupForDate(new Date('2025-12-24T11:00:00+01:00'), NOW), 'DECEMBER 2025');
  assert.equal(core.groupForDate(new Date('invalid'), NOW), 'OLDER');
});

test('enables unread emphasis and group unread counts by default', () => {
  assert.equal(core.DEFAULT_SETTINGS.unreadEmphasis, true);
  assert.equal(core.DEFAULT_SETTINGS.groupUnreadCounts, true);
  assert.equal(core.normalizeSettings({}).unreadEmphasis, true);
  assert.equal(core.normalizeSettings({ unreadEmphasis: false }).unreadEmphasis, false);
  assert.equal(core.normalizeSettings({ groupUnreadCounts: false }).groupUnreadCounts, false);
});

test('merges the tabs row into the toolbar row by default', () => {
  assert.equal(core.DEFAULT_SETTINGS.mergeTabsRow, true);
  assert.equal(core.normalizeSettings({}).mergeTabsRow, true);
  assert.equal(core.normalizeSettings({ mergeTabsRow: false }).mergeTabsRow, false);
});

test('uses a transparent background by default so Gmail themes show through', () => {
  assert.equal(core.DEFAULT_SETTINGS.transparentBackground, true);
  assert.equal(core.normalizeSettings({}).transparentBackground, true);
  assert.equal(core.normalizeSettings({ transparentBackground: false }).transparentBackground, false);
});

test('keeps the white reading panel on by default and lets it toggle', () => {
  assert.equal(core.DEFAULT_SETTINGS.readablePanel, true);
  assert.equal(core.normalizeSettings({}).readablePanel, true);
  assert.equal(core.normalizeSettings({ readablePanel: false }).readablePanel, false);
});

test('uses the taller default row height', () => {
  assert.equal(core.DEFAULT_SETTINGS.rowHeight, 38);
  assert.equal(core.normalizeSettings({}).rowHeight, 38);
});

test('controls the gaps above and below group labels separately', () => {
  assert.equal(core.DEFAULT_SETTINGS.groupLineGapTop, 9);
  assert.equal(core.DEFAULT_SETTINGS.groupLineGapBottom, 14);
  assert.equal(core.normalizeSettings({}).groupLineGapTop, 9);
  assert.equal(core.normalizeSettings({}).groupLineGapBottom, 14);
  assert.equal(core.normalizeSettings({ groupLineGapTop: 0 }).groupLineGapTop, 2);
  assert.equal(core.normalizeSettings({ groupLineGapBottom: 500 }).groupLineGapBottom, 40);
});

test('uses category colors for nested labels and stable fallback colors', () => {
  assert.equal(core.labelColor('Finance/PayPal'), core.CATEGORY_COLORS.finance);
  assert.equal(core.labelColor('Tools/Anthropic'), core.CATEGORY_COLORS.tools);
  assert.equal(core.labelColor('Unknown Sender'), core.labelColor('Unknown Sender'));
});

test('colors the user own label families consistently', () => {
  assert.equal(core.labelColor('Money/PayPal'), core.CATEGORY_COLORS.money);
  assert.equal(core.labelColor('Money/Klarna'), core.CATEGORY_COLORS.money);
  assert.equal(core.labelColor('Shopping/Tech'), core.CATEGORY_COLORS.shopping);
  assert.equal(core.labelColor('School/WU'), core.CATEGORY_COLORS.school);
  assert.equal(core.labelColor('WIFI/Wien'), core.CATEGORY_COLORS.wifi);
});

test('creates local sender monograms without network data', () => {
  assert.equal(core.senderMonogram('Ada Lovelace', 'ada@example.com'), 'AL');
  assert.equal(core.senderMonogram('GitHub', 'noreply@github.com'), 'GI');
  assert.equal(core.senderMonogram('', 'hello.world@example.com'), 'HE');
});
