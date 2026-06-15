# Gmail View — Privacy Policy

_Last updated: 2026-06-15_

Gmail View ("the extension") restyles your Gmail inbox into a newspaper-style layout. This policy explains exactly what it does and does not do with data.

## What we do NOT collect
- We do **not** read, store, transmit, or sell the **content of your emails**.
- We do **not** track your browsing, build a profile, or use analytics/ads.
- We have **no** server that receives your email data.

## Data the extension uses
- **Your layout settings** (column sizes, fonts, toggles, label styling, presets) are stored **in your own browser** via Chrome's `storage` API (synced to your Google account by Chrome if you have sync on). They never leave Google's storage for us.
- **Sender logos (optional).** To show a real company logo next to a sender, the extension sends only that sender's **email domain** (e.g. `github.com`) to logo-lookup services — **Clearbit** (`logo.clearbit.com`) and **Google's favicon service** (`google.com`/`gstatic.com`). No email content, addresses, names, or your identity are sent. You can turn this off in **Settings → "Fetch real sender logos"**, in which case the extension uses local letter tiles and makes no external requests.

## Permissions, and why
- `storage` — save your settings locally.
- access to `mail.google.com` — restyle the Gmail inbox (the core purpose).
- `logo.clearbit.com`, `google.com/s2`, `*.gstatic.com` — fetch the optional sender logos described above.

## Payments
If you subscribe or buy a lifetime license, payment is handled by our payment provider (ExtensionPay / Stripe). **We never receive or store your card details.**

## Changes
We may update this policy; the "Last updated" date will change.

## Contact
Questions? Contact: **arkpostajian@gmail.com**
