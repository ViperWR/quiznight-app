// Runs Quiz Night on this laptop: builds the app if needed, serves it on
// http://localhost:4321 and opens it in its own window. No extra packages.
//
//   node scripts/serve.mjs            build if out of date, serve, open the browser
//   node scripts/serve.mjs --no-open  same, without opening the browser

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep this port: the browser files the saved quiz and the installed app under the address.
const PORT = 4321;
const URL_ = `http://localhost:${PORT}/`;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist', 'quiznight-app', 'browser');
const INDEX = join(DIST, 'index.html');
const RECEIVER_SDK = 'https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

function newest(path) {
  const s = statSync(path);
  if (!s.isDirectory()) return s.mtimeMs;
  return readdirSync(path).reduce((m, name) => Math.max(m, newest(join(path, name))), 0);
}

function run(cmd) {
  console.log(`> ${cmd}`);
  const r = spawnSync(cmd, { cwd: ROOT, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n"${cmd}" failed. Fix the error above and start Quiz Night again.`);
    process.exit(1);
  }
}

function build() {
  const sources = ['src', 'public', 'angular.json', 'package.json', 'ngsw-config.json'].map((p) => join(ROOT, p));
  const stale = !existsSync(INDEX) || sources.some((p) => newest(p) > statSync(INDEX).mtimeMs);
  if (!stale) return;
  console.log('Getting Quiz Night ready (this takes a minute the first time)...');
  if (!existsSync(join(ROOT, 'node_modules'))) run('npm install');
  run('npm run build');
}

function open() {
  if (process.argv.includes('--no-open')) return;
  if (process.platform !== 'win32') {
    spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [URL_], { stdio: 'ignore', detached: true }).unref();
    return;
  }
  // Chrome first: it is the browser that can cast. Each opens the app in a window of its own.
  for (const browser of ['chrome', 'msedge']) {
    const r = spawnSync('cmd', ['/c', 'start', browser, `--app=${URL_}`], { stdio: 'ignore' });
    if (r.status === 0) return;
  }
  spawnSync('cmd', ['/c', 'start', URL_], { stdio: 'ignore' });
}

function send(res, file, body) {
  res.writeHead(200, {
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    // Always check back with this server, so a rebuild shows up straight away
    'Cache-Control': 'no-cache',
  });
  res.end(body ?? readFileSync(file));
}

const server = createServer((req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, URL_).pathname);
    // Same extra page the published site has: the one a Chromecast loads
    if (path === '/receiver.html') {
      const html = readFileSync(INDEX, 'utf8').replace('</head>', `<script src="${RECEIVER_SDK}"></script></head>`);
      return send(res, INDEX, html);
    }
    const file = normalize(join(DIST, path));
    if (file !== DIST && !file.startsWith(DIST + sep)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isFile()) return send(res, file);
    // Anything else that isn't a file (/, /tv) is the app itself
    if (!extname(path)) return send(res, INDEX);
    res.writeHead(404).end('Not found');
  } catch {
    res.writeHead(500).end('Error');
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    // Most likely Quiz Night is already running: just bring up the window
    console.log(`Quiz Night is already running at ${URL_}`);
    open();
    process.exit(0);
  }
  console.error(e.message);
  process.exit(1);
});

build();
// This laptop only; nothing else on the network can reach it
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\nQuiz Night is running at ${URL_}`);
  console.log('Keep this window open while you use it. Close it to stop.\n');
  open();
});
