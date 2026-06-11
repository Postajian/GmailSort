# Final Clean Build Notes

Build: Gmail View Next `0.15.2`

Source basis: current stable G30 rollback build.

This clean folder is intended as the final product shape: the current working
extension code only, with old manufacturing history removed.

## Included Files

- `manifest.json`
- `package.json`
- `README.md`
- `ARCHITECTURE.md`
- `INSTALL.md`
- `FINAL-BUILD-NOTES.md`
- `src/`
- `options/`
- `tests/`

## Excluded Files

- `outputs/`
- checkpoint copies
- screenshots and videos
- Chrome storage dumps
- prior generated zips
- temporary test artifacts

## Default Layout Values

The default visual preset is baked into `src/core.js` and is what a fresh
install starts from:

- row height: `35px`
- sender column: `200px`
- logo size: `22px`
- sender text: `14px`
- subject text: `14px`, bold
- preview text: `14px`
- date text: `14px`
- masthead text: `INBOX`, `24px`
- custom-label font: `18px`
- label activity sorting: on

Per-user adjustments made through the extension UI are stored locally by Chrome
for that user.

