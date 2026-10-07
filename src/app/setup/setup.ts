import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Round } from '../quiz.model';
import { QuizService, defaultRounds } from '../quiz.service';

const MAX_ROUNDS = 20;
const MAX_QUESTIONS = 100;

@Component({
  selector: 'app-setup',
  imports: [RouterLink],
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class Setup {
  private quizService = inject(QuizService);
  private router = inject(Router);

  private existing = this.quizService.quiz();
  protected editing = !!this.existing;

  protected venue = signal(this.existing?.venue ?? this.quizService.lastVenue());
  protected title = signal(this.existing?.title ?? 'Quiz Night');
  protected rounds = signal<Round[]>(this.existing?.rounds.map((r) => ({ ...r })) ?? defaultRounds(6, 10));
  protected questionsForAll = signal(this.existing?.rounds[0]?.questions ?? 10);

  /** Teams for a brand-new quiz. When editing, teams live in the quiz service. */
  protected draftTeams = signal<string[]>([]);
  protected teamName = signal('');

  protected teams = computed(() =>
    this.editing
      ? (this.quizService.quiz()?.teams ?? []).map((t) => ({ id: t.id, name: t.name }))
      : this.draftTeams().map((name, i) => ({ id: String(i), name })),
  );

  protected totalQuestions = computed(() => this.rounds().reduce((s, r) => s + r.questions, 0));
  protected canSave = computed(() => this.venue().trim().length > 0 && this.rounds().length > 0 && this.teams().length > 0);

  setRoundCount(raw: number) {
    const n = clamp(Math.round(raw), 1, MAX_ROUNDS);
    this.rounds.update((rs) => {
      if (n <= rs.length) return rs.slice(0, n);
      const extra = Array.from({ length: n - rs.length }, (_, i) => ({
        name: `Round ${rs.length + i + 1}`,
        questions: this.questionsForAll(),
      }));
      return [...rs, ...extra];
    });
  }

  setQuestionsForAll(raw: number) {
    const n = clamp(Math.round(raw), 1, MAX_QUESTIONS);
    this.questionsForAll.set(n);
    this.rounds.update((rs) => rs.map((r) => ({ ...r, questions: n })));
  }

  setRound(i: number, patch: Partial<Round>) {
    this.rounds.update((rs) =>
      rs.map((r, j) => {
        if (j !== i) return r;
        const next = { ...r, ...patch };
        next.questions = clamp(Math.round(next.questions || 1), 1, MAX_QUESTIONS);
        return next;
      }),
    );
  }

  addTeam() {
    const name = this.teamName().trim();
    if (!name) return;
    if (this.editing) this.quizService.addTeam(name);
    else this.draftTeams.update((t) => [...t, name]);
    this.teamName.set('');
  }

  renameTeam(id: string, name: string) {
    if (!name.trim()) return;
    if (this.editing) this.quizService.renameTeam(id, name);
    else this.draftTeams.update((t) => t.map((n, i) => (String(i) === id ? name.trim() : n)));
  }

  removeTeam(id: string) {
    if (this.editing) this.quizService.removeTeam(id);
    else this.draftTeams.update((t) => t.filter((_, i) => String(i) !== id));
  }

  save() {
    // A name typed but not added yet is almost certainly meant to be a team.
    if (this.teamName().trim()) this.addTeam();
    if (!this.canSave()) return;
    const rounds = this.rounds().map((r, i) => ({ ...r, name: r.name.trim() || `Round ${i + 1}` }));
    if (this.editing) this.quizService.updateSetup(this.venue(), this.title(), rounds);
    else this.quizService.create(this.venue(), this.title(), rounds, this.draftTeams());
    this.router.navigate(['/score']);
  }

  num(e: Event): number {
    return Number((e.target as HTMLInputElement).value);
  }

  str(e: Event): string {
    return (e.target as HTMLInputElement).value;
  }
}

function clamp(n: number, min: number, max: number) {
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}
