import {
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CastService } from '../cast.service';
import { LiveService } from '../live.service';
import { QuizService } from '../quiz.service';
import { Backdrop, Wordmark } from '../art';
import { TvDialog } from '../tv-dialog';

@Component({
  selector: 'app-board',
  imports: [RouterLink, Backdrop, Wordmark, TvDialog],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  protected quizService = inject(QuizService);
  protected cast = inject(CastService);
  private live = inject(LiveService);
  protected onTv = computed(() => this.cast.state() === 'connected' || !!this.live.phoneCode());

  /** ?tv=1 — opened on a TV (cast receiver or second window): no host controls */
  readonly tv = input<string>();

  protected q = this.quizService.quiz;
  protected standings = this.quizService.boardStandings;
  protected showTv = signal(false);
  protected controlsHidden = signal(false);
  protected isFullscreen = signal(!!document.fullscreenElement);
  protected canFullscreen = !!document.documentElement.requestFullscreen;

  protected tvMode = computed(() => !!this.tv() || this.cast.isReceiver);

  protected subtitle = computed(() => {
    const q = this.q();
    if (!q) return '';
    const shown = q.revealed.filter(Boolean).length;
    if (shown === 0) return 'Good luck at the quiz!';
    if (shown === q.rounds.length) return 'Final scores';
    const last = q.revealed.lastIndexOf(true);
    return `After ${q.rounds[last].name} · ${shown} of ${q.rounds.length}`;
  });

  /** Every round is on the board: time for the trophy */
  protected final = computed(() => {
    const q = this.q();
    return !!q && q.rounds.length > 0 && q.revealed.every(Boolean);
  });

  /** Index of the most recently revealed round, highlighted in the table */
  protected latest = computed(() => this.q()?.revealed.lastIndexOf(true) ?? -1);

  /** Highest score in each revealed round, highlighted for every team that got it; null if nobody scored */
  protected best = computed(() => {
    const rows = this.standings();
    return (this.q()?.rounds ?? []).map((_, i) => {
      const top = Math.max(0, ...rows.map((s) => s.roundScores[i] ?? 0));
      return top > 0 ? top : null;
    });
  });

  private rowsEl = viewChild<ElementRef<HTMLElement>>('rows');
  /** Screen width and the height left for the team rows, in pixels */
  private space = signal({ width: window.innerWidth, height: 0 });

  /**
   * Where each row goes. The list's height is shared out in units: an ordinary row takes one,
   * a top-three row takes more once a round is on the board. Done here rather than in CSS so
   * it works on TVs whose browser is years old. Positions are percentages of the list, so rows
   * can never overlap or run off the screen; only the text size needs the measured height.
   */
  protected layout = computed(() => {
    const { width, height } = this.space();
    const n = this.standings().length;
    const rounds = Math.max(this.q()?.rounds.length ?? 1, 1);
    const vw = width / 100;
    // Matches the media query in board.scss that drops the per-round columns
    const upright = width <= 700 && window.innerHeight > width;

    const roundWidth = Math.min(5.5 * vw, (38 * vw) / rounds);
    // Largest the row text may get: keeps room for about 17 letters of team name
    const cap = upright ? 5 * vw : Math.min(4.4 * vw, (72 * vw - rounds * (roundWidth + vw)) / 12);
    const extra = this.latest() >= 0 ? 0.55 : 0;
    // The minimum stops a short list from stretching into a few enormous bars
    const units = Math.max(n + Math.min(n, 3) * extra, upright ? 11 : 6.5);
    // Until the list has been measured, assume it gets most of the screen
    const unitPx = (height || window.innerHeight * 0.7) / units;

    const rows = Array.from({ length: n }, (_, i) => {
      const top3 = i < 3 ? 1 : 0;
      const share = 1 + top3 * extra;
      return {
        top: ((i + Math.min(i, 3) * extra) / units) * 100,
        height: (share / units) * 100,
        // Text fills the bar; with only a few teams the width cap takes over
        fontSize: Math.min(unitPx * share * 0.68, cap * (1 + top3 * extra * 0.2)),
      };
    });
    return { roundWidth, rows };
  });

  private wakeLock: any = null;

  constructor() {
    const measure = () => {
      const el = this.rowsEl()?.nativeElement;
      const next = { width: window.innerWidth, height: el?.clientHeight ?? 0 };
      const now = this.space();
      if (next.width !== now.width || next.height !== now.height) this.space.set(next);
    };
    // The list only exists once a quiz has arrived, and its height changes with the header
    afterEveryRender({ read: measure });
    window.addEventListener('resize', measure);


    const onFs = () => this.isFullscreen.set(!!document.fullscreenElement);
    const onVis = () => document.visibilityState === 'visible' && this.keepAwake();
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVis);
    this.keepAwake();

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('resize', measure);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('visibilitychange', onVis);
      this.wakeLock?.release?.();
    });
  }

  /** Stop the phone dimming while the scoreboard is up. */
  private async keepAwake() {
    try {
      this.wakeLock = await (navigator as any).wakeLock?.request('screen');
    } catch {
      // not supported or denied; the board still works
    }
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else {
        await document.documentElement.requestFullscreen();
        await (screen.orientation as any)?.lock?.('landscape').catch(() => {});
      }
    } catch {
      // ignore: browser refused
    }
  }

  /** Host view: show or hide the buttons. TV view: there are none, so a click fills the screen. */
  onClick() {
    if (this.tvMode()) this.toggleFullscreen();
    else this.controlsHidden.update((h) => !h);
  }
}
