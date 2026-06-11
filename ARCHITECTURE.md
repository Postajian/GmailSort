# Architecture notes

## Existing implementation audit

The original extension proved the visual concept and found several important
click-safety rules. Its current production script is nevertheless difficult to
extend safely:

- Gmail's private class names are repeated throughout CSS and JavaScript.
- A 1.5-second timer repeatedly scans all rows, labels, and layout geometry.
- `runAll()` suppresses every exception, hiding broken selectors and regressions.
- Inbox CSS is inserted globally even when the current Gmail route is different.
- Widths and offsets are mostly fixed pixels and assume one desktop geometry.
- Sender favicons depend on a remote Google favicon URL.
- Date grouping relies heavily on short English display text.
- Runtime code, 15 checkpoint copies, and production assets share one folder.
- There is no settings UI, teardown path, or automated test coverage.

## Rewrite boundaries

`core.js` has no DOM dependency and is tested directly.

`gmail-adapter.js` is the only module allowed to know Gmail's class names. When
Gmail changes, this should usually be the only file that needs repair.

`styles.js` generates CSS from validated settings. Every invasive rule is gated
by both `data-gvn-active="true"` and `data-gvn-route="inbox"`.

`content.js` owns lifecycle and mutation. It never inserts children into Gmail's
message rows or list table, and every attribute or custom property it adds has a
matching cleanup operation.

## Next milestones

1. Test the unpacked extension against the live Gmail account at wide and narrow widths.
2. Add a small diagnostics panel showing which Gmail selectors are currently healthy.
3. Add screenshot-based visual regression tests with sanitized Gmail fixtures.
4. Add an optional compact mode and per-column visibility settings.
5. Package release builds separately from source and development notes.
