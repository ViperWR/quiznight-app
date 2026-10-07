export interface Round {
  name: string;
  questions: number;
}

export interface Team {
  id: string;
  name: string;
}

export interface Quiz {
  /** Where the quiz is held, shown big on the home screen, scoreboard and TV */
  venue?: string;
  title: string;
  rounds: Round[];
  teams: Team[];
  /** scores[teamId][roundIndex] — null means not entered yet */
  scores: Record<string, (number | null)[]>;
  /** Index of the round the host is currently scoring */
  currentRound: number;
  /** revealed[roundIndex] — round scores are shown on the scoreboard */
  revealed: boolean[];
  updatedAt: number;
}

export interface Standing {
  team: Team;
  rank: number;
  total: number;
  roundScores: (number | null)[];
}
