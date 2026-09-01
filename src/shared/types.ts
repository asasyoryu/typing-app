export type Difficulty = "beginner" | "intermediate" | "advanced";

export type Puzzle = {
  id: number;
  difficulty: Difficulty;
  sender_name: string;
  sender_role: string;
  channel: string;
  incoming: string;
  reply: string;
  reading: string;
  genre: string;
};

export type KeyStat = {
  hits: number;
  misses: number;
};

export type PlayAnalysis = {
  keys: Record<string, KeyStat>;
  fingers: Record<string, KeyStat>;
  bigrams: Record<string, KeyStat>;
};

export type PlayResult = {
  anonId: string;
  difficulty: Difficulty;
  salary: number;
  speed: number;
  accuracy: number;
  missCount: number;
  maxCombo: number;
  replyCount: number;
  durationMs: number;
  analysis: PlayAnalysis;
};

export type StatsResponse = {
  playCount: number;
  analysis: PlayAnalysis;
};
