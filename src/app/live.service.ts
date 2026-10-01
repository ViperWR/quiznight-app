import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Quiz } from './quiz.model';
import { QuizService } from './quiz.service';

/**
 * Free public pub/sub relay (https://ntfy.sh) that carries the scoreboard from
 * the host's phone to a TV's web browser. No account or server of our own.
 */
const RELAY = 'https://ntfy.sh';
const TOPIC_PREFIX = 'quiznight-viperwr-';
/** Letters and digits that can't be confused when read off a TV across a room */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const PHONE_KEY = 'quiznight.live.phone';
const TV_KEY = 'quiznight.live.tv';
/** ntfy.sh rejects bigger messages */
const MAX_BYTES = 4000;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // storage unavailable; the link just won't survive a reload
  }
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Only what the TV may show: scores of rounds not yet revealed stay on the phone. */
function boardOnly(q: Quiz | null): Quiz | null {
  if (!q) return null;
  const scores: Quiz['scores'] = {};
  for (const t of q.teams) {
    scores[t.id] = q.rounds.map((_, i) => (q.revealed[i] ? (q.scores[t.id]?.[i] ?? null) : null));
  }
  return { ...q, scores, currentRound: 0, updatedAt: 0 };
}

/**
 * Live scoreboard link for any TV with a web browser.
 * TV: opens /tv, shows a short code and listens on that code.
 * Phone: enters the code and publishes the board whenever it changes.
 */
@Injectable({ providedIn: 'root' })
export class LiveService {
  private quiz = inject(QuizService);

  // ---- phone side ----
  readonly phoneCode = signal<string | null>(read(PHONE_KEY));
  readonly phoneError = signal<string | null>(null);
  readonly sending = signal(false);
  private payload = computed(() => JSON.stringify(boardOnly(this.quiz.quiz())));
  private lastSent = '';
  private timer: ReturnType<typeof setTimeout> | null = null;

  // ---- TV side ----
  readonly tvCode = signal<string | null>(null);
  readonly tvConnected = signal(false);
  private source: EventSource | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastId = 'all';

  constructor() {
    effect(() => {
      const code = this.phoneCode();
      const body = this.payload();
      if (!code) return;
      // Debounce so a burst of taps sends one update
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.publish(code, body), 600);
    });
  }

  private topic(code: string) {
    return `${RELAY}/${TOPIC_PREFIX}${code}`;
  }

  // ---------------- phone ----------------

  connect(raw: string) {
    const code = normalizeCode(raw);
    if (code.length < 4) {
      this.phoneError.set('Type the 4-character code shown on the TV.');
      return;
    }
    this.phoneError.set(null);
    this.lastSent = '';
    write(PHONE_KEY, code);
    this.phoneCode.set(code);
  }

  disconnect() {
    write(PHONE_KEY, null);
    this.phoneCode.set(null);
  }

  private async publish(code: string, body: string, force = false) {
    if (!force && body === this.lastSent) return;
    if (new Blob([body]).size > MAX_BYTES) {
      this.phoneError.set('Too many teams to send to the TV in one go. Shorten team names and try again.');
      return;
    }
    this.sending.set(true);
    try {
      const res = await fetch(this.topic(code), { method: 'POST', body });
      if (!res.ok) throw new Error(String(res.status));
      this.lastSent = body;
      this.phoneError.set(null);
    } catch {
      this.phoneError.set("Couldn't reach the TV link. Check the phone has internet; it will retry on the next change.");
      // Try again shortly so a brief signal drop doesn't leave the TV behind
      setTimeout(() => this.phoneCode() === code && this.publish(code, this.payload()), 5000);
    } finally {
      this.sending.set(false);
    }
  }

  // ---------------- TV ----------------

  /** Start listening as the TV; reuses this TV's code across reloads. */
  startTv() {
    if (this.tvCode()) return;
    this.quiz.displayOnly();
    let code = read(TV_KEY);
    if (!code) {
      code = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => ALPHABET[b % ALPHABET.length]).join('');
      write(TV_KEY, code);
    }
    this.tvCode.set(code);
    this.listen(code);
  }

  /** Forget this TV's code and show a fresh one. */
  newTvCode() {
    this.stopListening();
    write(TV_KEY, null);
    this.tvCode.set(null);
    this.tvConnected.set(false);
    this.quiz.replace(null);
    this.startTv();
  }

  private onMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);
      if (msg.event !== 'message') return;
      if (msg.id) this.lastId = msg.id;
      this.quiz.replace(JSON.parse(msg.message));
      this.tvConnected.set(true);
    } catch {
      // ignore anything that isn't a quiz
    }
  }

  private listen(code: string) {
    // since=all replays recent updates, so a reloaded TV catches up straight away
    if (typeof EventSource === 'function') {
      this.source = new EventSource(`${this.topic(code)}/sse?since=all`);
      this.source.onmessage = (e) => this.onMessage(e.data);
    } else {
      // Older TV browsers: poll instead
      const poll = async () => {
        try {
          const res = await fetch(`${this.topic(code)}/json?poll=1&since=${this.lastId}`);
          (await res.text()).split('\n').filter(Boolean).forEach((line) => this.onMessage(line));
        } catch {
          // try again next tick
        }
      };
      poll();
      this.pollTimer = setInterval(poll, 4000);
    }
  }

  private stopListening() {
    this.source?.close();
    this.source = null;
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.lastId = 'all';
  }
}
