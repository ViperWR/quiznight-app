import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
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

  private wakeLock: any = null;

  constructor() {
    const onFs = () => this.isFullscreen.set(!!document.fullscreenElement);
    const onVis = () => document.visibilityState === 'visible' && this.keepAwake();
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVis);
    this.keepAwake();

    inject(DestroyRef).onDestroy(() => {
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
