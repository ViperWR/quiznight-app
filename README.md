# Quiz Night

A phone app for running a pub quiz night, styled after the Watergat Pub & Grill quiz night voucher.

- Set the number of rounds and questions per round (each round can differ), and add teams or players.
- After every round, enter each team's score and tap **Show on the scoreboard**.
- Put the scoreboard on the TV: **Cast** (Chrome with a Chromecast or Cast TV), screen mirroring
  (Android Cast / Smart View, iPhone Screen Mirroring), or a second window on a laptop plugged into the TV.
- On iPhone or iPad Safari the **TV** button also offers **AirPlay**, which sends only the scoreboard to an AirPlay TV
  as a video. It is experimental and has not been tried on a real AirPlay TV yet.

It is an installable web app (PWA): open it in Chrome on Android or Safari on iPhone and use
**Add to Home screen**. It works offline, and everything is saved on the phone; there's no account or server.

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
