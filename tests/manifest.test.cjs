const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

test('manifest is MV3 and every declared local file exists', () => {
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);

  const files = [
    manifest.options_page,
    ...manifest.content_scripts.flatMap((entry) => entry.js || [])
  ];
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  }
});

test('content script order keeps dependencies before the orchestrator', () => {
  assert.deepEqual(manifest.content_scripts[0].js, [
    'src/core.js',
    'src/gmail-adapter.js',
    'src/styles.js',
    'src/content.js'
  ]);
});
