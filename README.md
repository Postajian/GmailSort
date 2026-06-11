# Gmail View Next

A clean-room, independent rewrite of the newspaper-inspired Gmail inbox view.
The existing `Desktop/GmailView` extension is not used or modified by this
project.

## What is different

- Gmail selectors live in one adapter instead of being scattered through the app.
- Styling is active only on the Inbox route, not Sent, Search, labels, or threads.
- A `MutationObserver` and `ResizeObserver` replace full-page polling every 1.5 seconds.
- Errors are reported in the console instead of silently discarded.
- Sender marks are generated locally, so sender domains are not sent to a favicon service.
- Layout values and behavior are configurable through the extension options page.
- Every DOM change is marked and can be removed by the extension's teardown routine.
- Core date grouping, colors, route handling, and manifest structure have automated tests.
- Narrow screens receive a reduced layout instead of fixed desktop-only widths.

## Install for development

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this `gmail-view-next` folder.
5. Disable the old extension while comparing them so both do not style Gmail at once.
6. Open Gmail and refresh the tab.

The options page is available from the extension's **Details** screen.

## Verify

```powershell
npm run verify
```

No package installation is required. Tests use Node's built-in test runner.

## Project structure

- `src/core.js`: pure, testable settings/date/color logic
- `src/gmail-adapter.js`: all knowledge of Gmail's current DOM
- `src/styles.js`: route-scoped CSS generation
- `src/content.js`: lifecycle, observers, decoration, and cleanup
- `options/`: extension settings page
- `tests/`: dependency-free Node tests

## Known boundary

Gmail does not publish a stable DOM contract for its inbox. Any extension that
restyles Gmail's internal rows can require selector updates after a Gmail UI
release. This rewrite contains that risk in `src/gmail-adapter.js` and fails
quietly when the expected row structure is absent rather than rewriting unknown
markup.
