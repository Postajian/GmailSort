# Changelog - GmailView

Format: Keep a Changelog, semver. Version source of truth: `manifest.json`. Tag format
`vX.Y.Z-stable`, created ONLY by `tools/G9-Release.ps1` (bump + verify + changelog draft +
tag + store zip in one guarded run). See vault `G9_VERSIONING_POLICY.md`.

## [Unreleased]

### Added
- `tools/G9-Release.ps1` release automation (W2-5): version bump with auto-revert on failed
  verify, changelog draft from git log, local `-stable` tag, store zip; never submits.

## [0.20.93] - 2026-07-04

Current main-branch state (far ahead of the store-submitted v0.20.17, which is pending
review; features reach users only via store updates).

### Added
- Everything since v0.20.17 store submission, including the 2026-06-16 batch with umbrella
  roll-up on by default. Detailed per-version history lives in git log and the release
  script's drafts from here on.
