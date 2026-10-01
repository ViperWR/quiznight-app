# Quiz Night

A phone app for running a pub quiz night, styled after the Watergat Pub & Grill quiz night voucher.

- Set the number of rounds and questions per round (each round can differ), and add teams or players.
- After every round, enter each team's score and tap **Show on the scoreboard**.
- Put the scoreboard on the TV: **Cast** (Chrome with a Chromecast or Cast TV), screen mirroring
  (Android Cast / Smart View, iPhone Screen Mirroring), or a second window on a laptop plugged into the TV.

It is an installable web app (PWA): open it in Chrome on Android or Safari on iPhone and use
**Add to Home screen**. It works offline, and everything is saved on the phone; there's no account or server.

## Development

```bash
npm install
npm start        # http://localhost:4200
npm run build    # production build in dist/
```

Pushing to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).
