import { Injectable, computed, effect, signal } from '@angular/core';
import { Quiz, Round, Standing, Team } from './quiz.model';

const STORAGE_KEY = 'quiznight.quiz.v1';

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultRounds(count: number, questions: number): Round[] {
  return Array.from({ length: count }, (_, i) => ({ name: `Round ${i + 1}`, questions }));
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  readonly quiz = signal<Quiz | null>(this.load());

  /** Standings using only rounds that have been revealed on the scoreboard. */
  readonly boardStandings = computed(() => this.standings(true));
  /** Standings using every score entered so far (host view). */
  readonly liveStandings = computed(() => this.standings(false));

  readonly revealedCount = computed(() => this.quiz()?.revealed.filter(Boolean).length ?? 0);

  /** Off on a TV showing someone else's quiz, so it never overwrites a quiz saved on this device. */
  private persist = true;

  constructor() {
    effect(() => {
      const q = this.quiz();
      if (!this.persist) return;
      try {
        if (q) localStorage.setItem(STORAGE_KEY, JSON.stringify(q));
        else localStorage.removeItem(STORAGE_KEY);
      } catch {
        // storage unavailable (private mode) — the quiz still works for this session
      }
    });

    // Keep a second window (e.g. a scoreboard on a TV/laptop screen) in sync.
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && this.persist) this.quiz.set(this.parse(e.newValue));
    });
  }

  private load(): Quiz | null {
    try {
      return this.parse(localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  private parse(raw: string | null): Quiz | null {
    if (!raw) return null;
    try {
      const q = JSON.parse(raw) as Quiz;
      return Array.isArray(q.rounds) && Array.isArray(q.teams) ? q : null;
    } catch {
      return null;
    }
  }

  /** Show a quiz that lives on another device (TV mode): stop saving and start empty. */
  displayOnly() {
    this.persist = false;
    this.quiz.set(null);
  }

  /** Replace state wholesale, e.g. from a cast connection. */
  replace(q: Quiz | null) {
    this.quiz.set(q);
  }

  private update(fn: (q: Quiz) => Quiz) {
    const q = this.quiz();
    if (!q) return;
    this.quiz.set({ ...fn(q), updatedAt: Date.now() });
  }

  create(title: string, rounds: Round[], teamNames: string[]) {
    const teams: Team[] = teamNames.map((name) => ({ id: newId(), name }));
    const scores: Quiz['scores'] = {};
    for (const t of teams) scores[t.id] = rounds.map(() => null);
    this.quiz.set({
      title: title.trim() || 'Watergat Quiz Night',
      rounds,
      teams,
      scores,
      currentRound: 0,
      revealed: rounds.map(() => false),
      updatedAt: Date.now(),
    });
  }

  /** Change title and round layout while keeping scores where rounds still exist. */
  updateSetup(title: string, rounds: Round[]) {
    this.update((q) => {
      const scores: Quiz['scores'] = {};
      for (const t of q.teams) {
        const old = q.scores[t.id] ?? [];
        scores[t.id] = rounds.map((r, i) => {
          const v = old[i] ?? null;
          return v == null ? null : Math.min(v, r.questions);
        });
      }
      return {
        ...q,
        title: title.trim() || 'Watergat Quiz Night',
        rounds,
        scores,
        revealed: rounds.map((_, i) => q.revealed[i] ?? false),
        currentRound: Math.min(q.currentRound, rounds.length - 1),
      };
    });
  }

  addTeam(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.update((q) => {
      const team = { id: newId(), name: trimmed };
      return {
        ...q,
        teams: [...q.teams, team],
        scores: { ...q.scores, [team.id]: q.rounds.map(() => null) },
      };
    });
  }

  renameTeam(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    this.update((q) => ({
      ...q,
      teams: q.teams.map((t) => (t.id === id ? { ...t, name: trimmed } : t)),
    }));
  }

  removeTeam(id: string) {
    this.update((q) => {
      const scores = { ...q.scores };
      delete scores[id];
      return { ...q, teams: q.teams.filter((t) => t.id !== id), scores };
    });
  }

  setScore(teamId: string, round: number, value: number | null) {
    this.update((q) => {
      const max = q.rounds[round]?.questions ?? 0;
      const clean = value == null || Number.isNaN(value) ? null : Math.max(0, Math.min(max, value));
      const row = [...(q.scores[teamId] ?? q.rounds.map(() => null))];
      row[round] = clean;
      return { ...q, scores: { ...q.scores, [teamId]: row } };
    });
  }

  setCurrentRound(round: number) {
    this.update((q) => ({ ...q, currentRound: Math.max(0, Math.min(q.rounds.length - 1, round)) }));
  }

  setRevealed(round: number, revealed: boolean) {
    this.update((q) => {
      const r = [...q.revealed];
      r[round] = revealed;
      return { ...q, revealed: r };
    });
  }

  reset() {
    this.quiz.set(null);
  }

  private standings(revealedOnly: boolean): Standing[] {
    const q = this.quiz();
    if (!q) return [];
    const rows = q.teams.map((team) => {
      const all = q.scores[team.id] ?? [];
      const roundScores = q.rounds.map((_, i) =>
        revealedOnly && !q.revealed[i] ? null : (all[i] ?? null),
      );
      const total = roundScores.reduce<number>((s, v) => s + (v ?? 0), 0);
      return { team, total, roundScores, rank: 0 };
    });
    rows.sort((a, b) => b.total - a.total || a.team.name.localeCompare(b.team.name));
    // Standard competition ranking: equal totals share a rank (1, 2, 2, 4)
    rows.forEach((r, i) => {
      r.rank = i > 0 && rows[i - 1].total === r.total ? rows[i - 1].rank : i + 1;
    });
    return rows;
  }
}
