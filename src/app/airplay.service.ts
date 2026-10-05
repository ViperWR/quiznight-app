import { Injectable, effect, inject, signal } from '@angular/core';
import { QuizService } from './quiz.service';

/** The picture sent to the TV: a 1080p frame */
const W = 1920;
const H = 1080;
/** Length of the looping clip in 'clip' mode */
const CLIP_MS = 2000;
/** How long the live picture gets to be offered an AirPlay TV before the clip takes over */
const LIVE_PROBE_MS = 2500;

const DISPLAY = "'Abril Fatface', Georgia, serif";
const SCRIPT = "'Yellowtail', 'Brush Script MT', cursive";
const BODY = "'Montserrat', system-ui, sans-serif";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Sends only the scoreboard to an AirPlay TV from Safari on iPhone, iPad or Mac.
 *
 * Safari can AirPlay a video but not a web page, so the revealed-only scoreboard
 * is painted on a canvas and played as a video, and Safari's AirPlay picker sends
 * that video to the TV. Two ways of making the video, because it is not known
 * which one a given TV accepts:
 *   live — the canvas as a live stream (captureStream)
 *   clip — a short recording of the canvas on a loop, re-recorded when the board changes
 *
 * Not yet tried on real AirPlay hardware.
 */
@Injectable({ providedIn: 'root' })
export class AirplayService {
  private quiz = inject(QuizService);

  /** Safari's AirPlay picker exists and the scoreboard can be turned into a video. */
  readonly supported =
    typeof (HTMLVideoElement.prototype as any).webkitShowPlaybackTargetPicker === 'function' &&
    'WebKitPlaybackTargetAvailabilityEvent' in window &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function';
  /** The looping clip needs Safari's video recorder. */
  readonly canClip = typeof MediaRecorder === 'function' && MediaRecorder.isTypeSupported('video/mp4');

  readonly mode = signal<'live' | 'clip'>('live');
  /** Safari reports an AirPlay TV on this Wi-Fi for the current video. */
  readonly available = signal(false);
  readonly connected = signal(false);
  readonly error = signal<string | null>(null);

  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private background: HTMLImageElement | null = null;
  private badge: HTMLImageElement | null = null;
  private trophy: HTMLImageElement | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private probe: ReturnType<typeof setTimeout> | null = null;
  private clipUrl: string | null = null;
  private recording = false;
  private stale = false;
  /** The host picked a mode by hand, so stop choosing for them */
  private pinned = false;

  constructor() {
    effect(() => {
      this.quiz.quiz();
      if (!this.canvas) return;
      this.draw();
      if (this.mode() === 'clip') this.refreshClip();
    });
  }

  /** Get the video ready, so the picker can open straight from the tap. */
  async prepare() {
    if (!this.supported || this.canvas) return;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    this.canvas = canvas;

    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('x-webkit-airplay', 'allow');
    // Has to be on the page to be offered to AirPlay; kept to a speck in the corner
    video.style.cssText =
      'position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none;z-index:-1';
    video.addEventListener('webkitplaybacktargetavailabilitychanged', (e: any) =>
      this.available.set(e.availability === 'available'),
    );
    video.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', () =>
      this.connected.set(!!(video as any).webkitCurrentPlaybackTargetIsWireless),
    );
    document.body.appendChild(video);
    this.video = video;

    this.draw();
    this.useLive();
    // Repaint so the video keeps getting frames, and so late fonts and art show up
    this.keepAlive = setInterval(() => this.draw(), 1000);

    // Live first; if Safari offers no TV for a live picture, fall back to the clip
    this.probe = setTimeout(() => {
      if (!this.pinned && !this.available() && !this.connected() && this.canClip) this.setMode('clip');
    }, LIVE_PROBE_MS);

    const fonts = (document as any).fonts;
    const [background, badge, trophy] = await Promise.all([
      loadImage('art/hero-tv.jpg'),
      loadImage('art/badge.png'),
      loadImage('art/trophy.png'),
      fonts?.load(`80px ${DISPLAY}`).catch(() => {}),
      fonts?.load(`60px ${SCRIPT}`).catch(() => {}),
      fonts?.load(`800 40px ${BODY}`).catch(() => {}),
    ]);
    this.background = background;
    this.badge = badge;
    this.trophy = trophy;
    this.draw();
    if (this.mode() === 'clip') this.refreshClip();
  }

  /** Open Safari's AirPlay picker. Call straight from a tap. */
  pick() {
    const video = this.video;
    if (!video) return;
    this.error.set(null);
    video.play().catch(() => {});
    try {
      (video as any).webkitShowPlaybackTargetPicker();
    } catch {
      this.error.set("Safari couldn't open the AirPlay list. Close this and try again.");
    }
  }

  /** Swap between the live picture and the looping clip, for a TV that stays black on one of them. */
  switchMode() {
    this.pinned = true;
    this.setMode(this.mode() === 'live' ? 'clip' : 'live');
  }

  /** Drop the video when it isn't on a TV, e.g. the dialog closed without connecting. */
  release() {
    if (this.connected() || !this.canvas) return;
    if (this.keepAlive) clearInterval(this.keepAlive);
    if (this.probe) clearTimeout(this.probe);
    this.keepAlive = null;
    this.probe = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video?.remove();
    this.video = null;
    this.canvas = null;
    if (this.clipUrl) URL.revokeObjectURL(this.clipUrl);
    this.clipUrl = null;
    this.available.set(false);
    this.pinned = false;
    this.mode.set('live');
  }

  private setMode(mode: 'live' | 'clip') {
    if (mode === 'clip' && !this.canClip) return;
    this.mode.set(mode);
    if (mode === 'live') this.useLive();
    else this.refreshClip();
  }

  private useLive() {
    const video = this.video;
    if (!video || !this.canvas) return;
    this.stream ??= this.canvas.captureStream(5);
    video.removeAttribute('src');
    video.srcObject = this.stream;
    video.play().catch(() => {});
  }

  /** Record the board as it stands now and loop it; runs again if the board changed meanwhile. */
  private async refreshClip() {
    if (this.recording) {
      this.stale = true;
      return;
    }
    const canvas = this.canvas;
    if (!canvas) return;
    this.recording = true;
    try {
      do {
        this.stale = false;
        const stream = canvas.captureStream(10);
        const recorder = new MediaRecorder(stream, { mimeType: 'video/mp4', videoBitsPerSecond: 4_000_000 });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const stopped = new Promise<void>((r) => (recorder.onstop = () => r()));
        recorder.start();
        // A still canvas gives the recorder nothing, so keep repainting while it records
        const paint = setInterval(() => this.draw(), 100);
        await wait(CLIP_MS);
        clearInterval(paint);
        recorder.stop();
        await stopped;
        stream.getTracks().forEach((t) => t.stop());

        const video = this.video;
        if (!video || this.mode() !== 'clip') return;
        if (this.stale) continue;
        const old = this.clipUrl;
        this.clipUrl = URL.createObjectURL(new Blob(chunks, { type: 'video/mp4' }));
        video.srcObject = null;
        video.src = this.clipUrl;
        video.play().catch(() => {});
        if (old) URL.revokeObjectURL(old);
      } while (this.stale);
    } catch {
      this.error.set("Couldn't make the scoreboard video on this device.");
    } finally {
      this.recording = false;
    }
  }

  // ---------------- drawing ----------------

  /** Paint the scoreboard: revealed rounds only, laid out like the TV view. */
  private draw() {
    const ctx = this.canvas?.getContext('2d');
    if (!ctx) return;
    const q = this.quiz.quiz();
    const rows = this.quiz.boardStandings();

    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0a0705';
    ctx.fillRect(0, 0, W, H);
    if (this.background) {
      const img = this.background;
      const scale = Math.max(W / img.width, H / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (W - w) * 0.7, (H - h) / 2, w, h);
    }
    const shade = ctx.createLinearGradient(0, 0, 0, H);
    shade.addColorStop(0, 'rgba(10, 7, 5, 0.8)');
    shade.addColorStop(0.32, 'rgba(10, 7, 5, 0.5)');
    shade.addColorStop(1, 'rgba(10, 7, 5, 0.18)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, W, H);

    if (!q) {
      ctx.textAlign = 'center';
      ctx.fillStyle = this.gold(ctx, H / 2 - 110, 140);
      ctx.font = `140px ${DISPLAY}`;
      ctx.fillText('QUIZ NIGHT', W / 2, H / 2 - 40);
      ctx.fillStyle = '#e8d9b8';
      ctx.font = `600 44px ${BODY}`;
      ctx.fillText('Waiting for the quiz to start…', W / 2, H / 2 + 90);
      return;
    }

    const pad = 58;
    const shown = q.revealed.filter(Boolean).length;
    const latest = q.revealed.lastIndexOf(true);
    const final = q.rounds.length > 0 && shown === q.rounds.length;
    const subtitle =
      shown === 0
        ? 'Good luck at the quiz!'
        : final
          ? 'Final scores'
          : `After ${q.rounds[latest].name} · ${shown} of ${q.rounds.length}`;

    // Header: badge and title on the left, where the night has got to on the right
    const headY = 84;
    let x = pad;
    if (this.badge) {
      ctx.drawImage(this.badge, x, headY - 56, 112, 112);
      x += 112 + 26;
    }
    ctx.textAlign = 'right';
    ctx.font = `56px ${SCRIPT}`;
    ctx.fillStyle = '#f8f0de';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 10;
    ctx.fillText(subtitle, W - pad, headY);
    const subW = ctx.measureText(subtitle).width;
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    if (final && this.trophy) {
      const th = 104;
      const tw = (this.trophy.width / this.trophy.height) * th;
      ctx.drawImage(this.trophy, W - pad - subW - tw - 18, headY - th / 2, tw, th);
    }
    ctx.textAlign = 'left';
    ctx.font = `80px ${DISPLAY}`;
    ctx.fillStyle = this.gold(ctx, headY - 40, 80);
    ctx.fillText(this.fit(ctx, q.title, W - pad - x - subW - 180), x, headY);

    const rule = ctx.createLinearGradient(0, 0, W, 0);
    rule.addColorStop(0, 'rgba(169, 120, 24, 0)');
    rule.addColorStop(0.08, '#a97818');
    rule.addColorStop(0.5, '#e8b84a');
    rule.addColorStop(0.92, '#a97818');
    rule.addColorStop(1, 'rgba(169, 120, 24, 0)');
    ctx.fillStyle = rule;
    ctx.fillRect(pad, 158, W - pad * 2, 3);

    // Columns: rank, team, one per round, total
    const gap = 19;
    const inner = 29;
    const rankW = 115;
    const totalW = 211;
    const n = q.rounds.length;
    const roundW = n ? Math.min(106, 730 / n) : 0;
    const left = pad + inner;
    const right = W - pad - inner;
    const totalX = right;
    const roundX = (i: number) => right - totalW - gap - (n - i) * (roundW + gap) + gap + roundW / 2;
    const teamX = left + rankW + gap;
    const teamW = right - totalW - gap - n * (roundW + gap) - teamX;

    const headRowY = 198;
    ctx.font = `800 27px ${BODY}`;
    ctx.fillStyle = '#e8d9b8';
    ctx.textAlign = 'center';
    ctx.fillText('#', left + rankW / 2, headRowY);
    ctx.textAlign = 'left';
    ctx.fillText('TEAM', teamX, headRowY);
    ctx.textAlign = 'center';
    q.rounds.forEach((_, i) => {
      ctx.fillStyle = i === latest ? '#ffe08a' : '#e8d9b8';
      ctx.fillText(`R${i + 1}`, roundX(i), headRowY);
    });
    ctx.fillStyle = '#e8d9b8';
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL', totalX, headRowY);

    // Top score of each revealed round, for the gold chips
    const best = q.rounds.map((_, i) => {
      const top = Math.max(0, ...rows.map((s) => s.roundScores[i] ?? 0));
      return top > 0 ? top : null;
    });

    // Rows share the height in units; the top three take more once a round is on the board
    const top = 226;
    const area = H - 32 - top;
    const podium = latest >= 0 ? 1.55 : 1;
    const units = Math.max(rows.length + Math.min(rows.length, 3) * (podium - 1), 6.5);
    const unit = area / units;
    const cap = Math.min(84, (1382 - n * (roundW + gap)) / 12);
    let y = top;
    rows.forEach((s, i) => {
      const big = i < 3;
      const h = unit * (big ? podium : 1);
      const first = s.rank === 1 && s.total > 0;
      const size = Math.min(h * 0.6, cap * (big ? 1 + (podium - 1) * 0.2 : 1));
      const mid = y + h / 2;

      const bar = ctx.createLinearGradient(0, y, first ? W : 0, y + h);
      if (first) {
        bar.addColorStop(0, '#fff4c2');
        bar.addColorStop(0.25, '#ffe08a');
        bar.addColorStop(0.65, '#e8b84a');
        bar.addColorStop(1, '#d4a030');
      } else {
        bar.addColorStop(0, i % 2 ? 'rgba(42, 32, 24, 0.78)' : 'rgba(36, 28, 20, 0.84)');
        bar.addColorStop(1, i % 2 ? 'rgba(26, 20, 15, 0.74)' : 'rgba(22, 16, 12, 0.8)');
      }
      ctx.beginPath();
      ctx.roundRect(pad, y + h * 0.04, W - pad * 2, h * 0.92, size * 0.5);
      ctx.fillStyle = bar;
      ctx.fill();
      ctx.lineWidth = big && latest >= 0 ? 2 : 1;
      ctx.strokeStyle = first ? '#fff0a0' : big && latest >= 0 ? 'rgba(255, 224, 138, 0.85)' : 'rgba(228, 178, 58, 0.4)';
      ctx.stroke();

      const text = first ? '#0a0705' : '#f8f0de';
      ctx.textAlign = 'center';
      ctx.font = `${size}px ${DISPLAY}`;
      ctx.fillStyle = first ? '#9e1a1c' : '#ffe08a';
      ctx.fillText(String(s.rank), left + rankW / 2, mid);

      ctx.textAlign = 'left';
      ctx.font = `800 ${size}px ${BODY}`;
      ctx.fillStyle = text;
      ctx.fillText(this.fit(ctx, s.team.name, teamW), teamX, mid);

      s.roundScores.forEach((v, j) => {
        if (v == null) return;
        const small = size * 0.8;
        const cx = roundX(j);
        ctx.textAlign = 'center';
        if (v === best[j]) {
          ctx.font = `800 ${small}px ${BODY}`;
          const w = Math.min(roundW, Math.max(small * 1.9, ctx.measureText(String(v)).width + small * 0.6));
          const chip = ctx.createLinearGradient(0, mid - small * 0.6, 0, mid + small * 0.6);
          chip.addColorStop(0, first ? '#2a2018' : '#ffe08a');
          chip.addColorStop(1, first ? '#2a2018' : '#e8b84a');
          ctx.beginPath();
          ctx.roundRect(cx - w / 2, mid - small * 0.6, w, small * 1.2, small * 0.35);
          ctx.fillStyle = chip;
          ctx.fill();
          ctx.fillStyle = first ? '#ffe08a' : '#0a0705';
        } else if (j === latest) {
          ctx.font = `700 ${small}px ${BODY}`;
          ctx.fillStyle = first ? '#9e1a1c' : '#ffe08a';
        } else {
          ctx.font = `600 ${small}px ${BODY}`;
          ctx.fillStyle = first ? 'rgba(10, 7, 5, 0.8)' : 'rgba(248, 240, 222, 0.8)';
        }
        ctx.fillText(String(v), cx, mid);
      });

      ctx.textAlign = 'right';
      ctx.font = `${size * 1.15}px ${DISPLAY}`;
      ctx.fillStyle = text;
      ctx.fillText(String(s.total), totalX, mid);
      y += h;
    });
  }

  private gold(ctx: CanvasRenderingContext2D, top: number, height: number) {
    const g = ctx.createLinearGradient(0, top, 0, top + height);
    g.addColorStop(0, '#fff4c2');
    g.addColorStop(0.28, '#ffe08a');
    g.addColorStop(0.58, '#e8b84a');
    g.addColorStop(1, '#a97818');
    return g;
  }

  /** Shorten text with an ellipsis until it fits the width, using the current font. */
  private fit(ctx: CanvasRenderingContext2D, text: string, width: number): string {
    if (ctx.measureText(text).width <= width) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > width) s = s.slice(0, -1);
    return s.trimEnd() + '…';
  }
}
