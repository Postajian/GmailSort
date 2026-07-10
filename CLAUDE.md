# GmailView (GmailSort) Extension — Project Instructions

The **GmailView** Chrome extension (repo `Postajian/GmailSort`). The user calls it "GmailView".
Newspaper-style, editable Gmail workflow. Part of the **G9** umbrella.

## Wiki Knowledge Base (shared G9 memory)

Path: `C:\Users\exoni\Desktop\Gmail Sort\03_Obsidian_Vault`

When you need G9 / cross-project context not already here:

1. Read `wiki/hot.md` first (recent context).
2. If not enough, read `wiki/index.md`, then the `[[GmailView]]` entity page.
3. For deep history, read `G9_GMAILVIEW_FEATURE_BATCH_v0.20.33.md` and `G9_GMAILVIEW_STORE_LAUNCH.md`.

Do NOT read the vault for narrow coding tasks unrelated to G9 cross-project context.

## Hard rules

1. **No reload mid-edit** — this extension loads from a junction → live working dir. Only signal
   "reload" AFTER commit + `npm run verify` (23 tests). A half-saved file crashes the content script.
2. **Agent commits locally; the USER runs `git push`.**
3. **Warning Insurance** — every critical/editable part gets guardrails (validation, clamping,
   confirm-destructive, preview, backups, tests).
4. **Store vs main:** store-submitted = v0.20.17 (pending review); `main` is ahead (v0.20.33+).
   Features reach users only as a store update after approval.

## New Claude Skills Available (2026-07-08)

Global skills, auto-discovered in every Claude session regardless of folder — reach for these on
GmailView work instead of forgetting they exist:

- **`extension-create` / `extension-dev` / `extension-manifest` / `extension-analyze` / `extension-test` / `extension-assets` / `extension-payment` / `extension-backend` / `extension-ui` / `extension-review` / `extension-publish` / `extension-migration`** — full Chrome-extension lifecycle skill set (quangpl/browser-extension-skills). Use `extension-review`/`extension-publish` before any future store submission.
- **`chrome-web-store-compliance`** — checks against 30+ real CWS violation codes + MV3 requirements. Run before submitting the v0.20.18+ update batch once the pending v0.20.17 review clears.
- **`supply-chain-risk-auditor`, `codeql`, `semgrep`, `sarif-parsing`, `differential-review`, `fp-check`, `variant-analysis`** — Trail-of-Bits security/static-analysis skills, apply to JS/TS review of the extension.
- **`git-cleanup`, `gh-cli`** — general git hygiene / GitHub CLI helpers.

See [[G9_MASTER_REGISTRY]] "External Dependencies" for the full source list.

## Documentation protocol ("Update G9")

After each work block, append a one-line entry to the top of the vault's `wiki/log.md` and update
the GmailView feature/handoff notes. Do NOT hand-curate the HQ-owned `G9_PROGRESS_LOG.md`.

## LIMIT-HIT BATON (read FIRST when resuming or continuing G9 work)

If you are resuming work (or another AI hit its usage limit), read ONLY
`C:\Users\exoni\Desktop\Gmail Sort\03_Obsidian_Vault\G9_RESUME_NOW.md` and follow its
protocol: CLAIM your item there before starting, mark it DONE the moment it is verified,
rewrite the file live (not at session end). Never redo a DONE item - reconcile instead.
Do NOT re-read the codebase/vault to catch up; the baton IS the catch-up.
