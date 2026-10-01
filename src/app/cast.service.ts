import { Injectable, effect, inject, signal } from '@angular/core';
import { QuizService } from './quiz.service';

// The Presentation API isn't in TypeScript's DOM lib, so keep a minimal typing here.
interface PresentationConnectionLike {
  state: 'connecting' | 'connected' | 'closed' | 'terminated';
  send(data: string): void;
  terminate(): void;
  addEventListener(type: string, cb: (e: any) => void): void;
}

/**
 * Sends the scoreboard to a TV with the browser's Presentation API (Chrome's
 * "Cast" on Android, Chrome desktop, Chromecast-enabled TVs). The TV loads the
 * scoreboard page and receives the quiz over the connection, so the phone can
 * keep entering scores while the TV only shows the board.
 */
@Injectable({ providedIn: 'root' })
export class CastService {
  private quiz = inject(QuizService);
  private connection: PresentationConnectionLike | null = null;

  readonly supported = typeof (window as any).PresentationRequest === 'function';
  readonly state = signal<'idle' | 'connecting' | 'connected'>('idle');
  readonly error = signal<string | null>(null);

  /** True when this page is itself running on the TV as a presentation receiver. */
  readonly isReceiver = !!(navigator as any).presentation?.receiver;

  constructor() {
    effect(() => {
      const q = this.quiz.quiz();
      if (this.state() === 'connected') this.send(q);
    });

    if (this.isReceiver) this.listenAsReceiver();
  }

  private boardUrl(): string {
    const base = location.href.split('#')[0];
    return `${base}#/board?tv=1`;
  }

  async start() {
    this.error.set(null);
    if (!this.supported) return;
    try {
      this.state.set('connecting');
      const request = new (window as any).PresentationRequest([this.boardUrl()]);
      const conn: PresentationConnectionLike = await request.start();
      this.attach(conn);
    } catch (e: any) {
      this.state.set('idle');
      // NotAllowedError = user dismissed the device picker; not worth showing.
      if (e?.name !== 'NotAllowedError' && e?.name !== 'AbortError') {
        this.error.set('Could not start casting from this browser. Try screen mirroring instead.');
      }
    }
  }

  stop() {
    this.connection?.terminate();
    this.connection = null;
    this.state.set('idle');
  }

  private attach(conn: PresentationConnectionLike) {
    this.connection = conn;
    const onConnected = () => {
      this.state.set('connected');
      this.send(this.quiz.quiz());
    };
    if (conn.state === 'connected') onConnected();
    conn.addEventListener('connect', onConnected);
    conn.addEventListener('close', () => this.state.set('idle'));
    conn.addEventListener('terminate', () => this.state.set('idle'));
  }

  private send(q: unknown) {
    try {
      if (this.connection?.state === 'connected') this.connection.send(JSON.stringify(q));
    } catch {
      // connection dropped between the state check and send
    }
  }

  private async listenAsReceiver() {
    const list = await (navigator as any).presentation.receiver.connectionList;
    const listen = (conn: PresentationConnectionLike) =>
      conn.addEventListener('message', (e: MessageEvent) => {
        try {
          this.quiz.replace(JSON.parse(e.data));
        } catch {
          // ignore malformed messages
        }
      });
    list.connections.forEach(listen);
    list.addEventListener('connectionavailable', (e: any) => listen(e.connection));
  }
}
