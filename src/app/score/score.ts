import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CastService } from '../cast.service';
import { QuizService } from '../quiz.service';
import { TvDialog } from '../tv-dialog';

@Component({
  selector: 'app-score',
  imports: [RouterLink, TvDialog],
  templateUrl: './score.html',
  styleUrl: './score.scss',
})
export class Score {
  protected quizService = inject(QuizService);
  protected cast = inject(CastService);
  private router = inject(Router);

  protected q = this.quizService.quiz;
  protected showTv = signal(false);

  protected roundIndex = computed(() => this.q()?.currentRound ?? 0);
  protected round = computed(() => this.q()?.rounds[this.roundIndex()]);
  protected revealed = computed(() => this.q()?.revealed[this.roundIndex()] ?? false);
  protected isLast = computed(() => this.roundIndex() >= (this.q()?.rounds.length ?? 1) - 1);

  protected rows = computed(() => {
    const q = this.q();
    if (!q) return [];
    return q.teams.map((t) => ({ team: t, score: q.scores[t.id]?.[this.roundIndex()] ?? null }));
  });
  protected missing = computed(() => this.rows().filter((r) => r.score == null).length);

  constructor() {
    effect(() => {
      if (!this.q()) this.router.navigate(['/setup']);
    });
  }

  roundDone(i: number): boolean {
    const q = this.q();
    return !!q && q.teams.length > 0 && q.teams.every((t) => q.scores[t.id]?.[i] != null);
  }

  step(teamId: string, current: number | null, delta: number) {
    this.quizService.setScore(teamId, this.roundIndex(), (current ?? 0) + delta);
  }

  typed(teamId: string, e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value.replace(',', '.');
    const value = raw.trim() === '' ? null : Number(raw);
    this.quizService.setScore(teamId, this.roundIndex(), value);
    // Show the clamped value if the host typed something out of range
    const stored = this.q()?.scores[teamId]?.[this.roundIndex()];
    input.value = stored == null ? '' : String(stored);
  }

  selectAll(e: Event) {
    (e.target as HTMLInputElement).select();
  }

  reveal() {
    const i = this.roundIndex();
    // Teams left blank scored nothing this round
    for (const r of this.rows()) if (r.score == null) this.quizService.setScore(r.team.id, i, 0);
    this.quizService.setRevealed(i, true);
    if (!this.isLast()) this.quizService.setCurrentRound(i + 1);
    else this.router.navigate(['/board']);
  }

  hide() {
    this.quizService.setRevealed(this.roundIndex(), false);
  }
}
