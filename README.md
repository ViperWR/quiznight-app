# Quiz Night

A phone app for running a pub quiz night, styled after the Watergat Pub & Grill quiz night voucher.

- Set the number of rounds and questions per round (each round can differ), and add teams or players.
- After every round, enter each team's score and tap **Show on the scoreboard**.
- Put the scoreboard on the TV: **Cast** (Chrome with a Chromecast or Cast TV), screen mirroring
  (Android Cast / Smart View, iPhone Screen Mirroring), or a second window on a laptop plugged into the TV.

It is an installable web app (PWA): open it in Chrome on Android or Safari on iPhone and use
**Add to Home screen**. It works offline, and everything is saved on the phone; there's no account or server.

## Run it on a laptop

Double-click **Quiz Night.bat** (Windows, needs [Node.js](https://nodejs.org)). It builds the app the first time
or after a change, serves it at `http://localhost:4321` on this laptop only, and opens it in its own Chrome window
(Edge if Chrome is missing). Keep the black window open while you use it. `npm run laptop` does the same from a terminal.

From the laptop the scoreboard goes to a TV three ways, all under the **TV** button:

- **TV plugged into this laptop** (HDMI or wireless display): opens a scoreboard-only window to drag onto the TV.
- **Any smart TV**: the TV's browser opens `viperwr.github.io/quiznight-app/tv` and the laptop types its code. Both need internet.
- **Chromecast or Google TV**: Chrome only. The laptop and the Chromecast must be on the same Wi-Fi.

## Artwork

The savanna backgrounds, acacia and trophy in `public/art`, `public/icons` and `src/app/art.ts` are made from
Adobe Stock free-collection files (#1349907275, #617853745, #429576165) under the standard licence. No attribution is needed.

- Only the cropped, web-sized versions belong in this repo. Don't add the original stock files (.ai, .eps or full size).
- Don't register the badge or title lockup as a trademark: they contain a stock element.

## Development

```bash
npm install
npm start        # http://localhost:4200
npm run build    # production build in dist/
```

Pushing to `main` builds the app and publishes it to the `gh-pages` branch, which GitHub Pages serves (`.github/workflows/deploy.yml`).
