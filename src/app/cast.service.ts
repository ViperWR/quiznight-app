import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from './quiz.service';
import { CAST_APP_ID } from './cast.config';

/** Channel the phone uses to send the quiz to the TV. Must match on both sides. */
const NAMESPACE = 'urn:x-cast:com.viperwr.quiznight';
const SENDER_SDK = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
const RECEIVER_SDK = 'https://www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';

declare const cast: any;
declare const chrome: any;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

/**
 * Sends only the scoreboard to a Chromecast with the Google Cast SDK.
 *
 * Phone (sender): Chrome on Android or desktop starts a session with our
 * registered Custom Web Receiver and sends the quiz on every change.
 * TV (receiver): the same app opened as receiver.html on the Chromecast,
 * which listens for the quiz and shows the scoreboard.
 */
@Injectable({ providedIn: 'root' })
export class CastService {
  private quiz = inject(QuizService);
  private router = inject(Router);
  private session: any = null;

  /** Running on the Chromecast itself. */
  readonly isReceiver = location.pathname.endsWith('/receiver.html');
  /** Cast app registered; until then the app falls back to mirroring instructions. */
  readonly configured = !!CAST_APP_ID;
  /** The browser can cast (Chrome on Android/desktop with the Cast SDK available). */
  readonly supported = signal(false);
  readonly state = signal<'idle' | 'connecting' | 'connected'>('idle');
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.isReceiver) {
      this.startReceiver();
      return;
    }
    if (this.configured && /Chrome\//.test(navigator.userAgent) && !/CriOS/.test(navigator.userAgent)) {
      this.initSender();
    }
    effect(() => {
      const q = this.quiz.quiz();
      if (this.state() === 'connected') this.send(q);
    });
  }

  private initSender() {
    (window as any).__onGCastApiAvailable = (available: boolean) => {
      if (!available) return;
      const context = cast.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: CAST_APP_ID,
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      });
      context.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (e: any) => {
        const S = cast.framework.SessionState;
        if (e.sessionState === S.SESSION_STARTED || e.sessionState === S.SESSION_RESUMED) {
          this.session = context.getCurrentSession();
          this.state.set('connected');
          this.send(this.quiz.quiz());
        } else if (e.sessionState === S.SESSION_STARTING) {
          this.state.set('connecting');
        } else {
          this.session = null;
          this.state.set('idle');
        }
      });
      this.supported.set(true);
    };
    loadScript(SENDER_SDK).catch(() => this.supported.set(false));
  }

  async start() {
    this.error.set(null);
    if (!this.supported()) return;
    try {
      await cast.framework.CastContext.getInstance().requestSession();
    } catch (e: any) {
      // 'cancel' = the host closed the device picker
      if (e !== 'cancel' && e?.code !== 'cancel') {
        this.error.set('Could not connect to the TV. Check the phone and Chromecast are on the same Wi-Fi and try again.');
      }
      this.state.set(this.session ? 'connected' : 'idle');
    }
  }

  stop() {
    cast.framework.CastContext.getInstance().endCurrentSession(true);
  }

  private send(q: unknown) {
    this.session?.sendMessage(NAMESPACE, q ?? null).catch(() => {
      // a dropped message is replaced by the next change
    });
  }

  private async startReceiver() {
    this.router.navigate(['/board'], { queryParams: { tv: 1 } });
    try {
      await loadScript(RECEIVER_SDK);
      const context = cast.framework.CastReceiverContext.getInstance();
      context.addCustomMessageListener(NAMESPACE, (e: any) => {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        this.quiz.replace(data);
      });
      const options = new cast.framework.CastReceiverOptions();
      options.disableIdleTimeout = true; // keep the board up all night
      options.skipPlayersLoad = true;
      context.start(options);
    } catch {
      // not on a Cast device; the board still renders whatever is stored
    }
  }
}
