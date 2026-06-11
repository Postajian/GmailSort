# Gmail View Next - Install

This folder is the clean, shareable extension build. It does not include old
screenshots, checkpoint folders, Chrome storage, or private Gmail data.

## Load In Chrome

1. Open `chrome://extensions/`.
2. Turn on `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `GmailViewNext-Final-Clean`.
5. Open or refresh Gmail.

If another Gmail styling extension is installed, turn the other one off first so
both extensions do not modify the same Gmail rows.

## Verify The Code

No dependency install is required.

```powershell
npm run verify
```

## What Carries Over

- Newspaper-style Gmail list layout.
- Column headers: sender, time sent, logo, subject, preview, date.
- Editable column controls.
- Sender/logo/subject/preview/date visual styling.
- Group bands such as `LAST 24 HOURS` and `LAST 3 DAYS`.
- Custom label styling and label editor.
- Label activity sorting so labels with newer/unread mail can rise to the top.

## What Does Not Carry Over

- Your emails.
- Your Gmail account state.
- Your private Chrome extension storage.
- Old broken experiments, outputs, screenshots, or checkpoint folders.

