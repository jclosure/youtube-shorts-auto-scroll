# Auto Scroll YouTube Shorts

Auto-scrolls to the next YouTube Short when the current video ends.

## Features

- Listens for `video` `ended` events on Shorts.
- Uses a playback-threshold fallback when `ended` is unreliable.
- Clicks the **Next video** control automatically (with keyboard fallback).
- Handles YouTube SPA navigation + dynamic DOM updates.
- Simple, no-build, edit-in-place extension workflow.

## Match URL

- `https://www.youtube.com/shorts/*`

## Install (No Build Step)

### Chrome / Chromium

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json`

## Edit-in-place workflow

- Edit `contentScript.js` directly.
- Reload extension in browser.
- No bundling/transpile/copy required.

## Files

- `manifest.json`
- `contentScript.js`
- `popup.html`

## Notes

- YouTube UI may change over time. If so, update the selector list in `getNextButton()`.
- This extension uses minimal permissions and only runs on Shorts pages.

## License

MIT
