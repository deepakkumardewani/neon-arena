export interface Player {
  readonly uid: string;
  readonly nickname: string;
  readonly role: "X" | "O" | null;
}

export interface ScoreDoc {
  readonly uid: string;
  readonly nickname: string;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
}
