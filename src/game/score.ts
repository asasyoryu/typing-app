import type { Difficulty } from "../shared/types.ts";

const BASE: Record<Difficulty, number> = {
  beginner: 110_000,
  intermediate: 210_000,
  advanced: 340_000,
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function calcPay(input: {
  difficulty: Difficulty;
  reply: string;
  elapsedMs: number;
  hits: number;
  misses: number;
}): number {
  const len = [...input.reply].length;
  const symbols = (input.reply.match(/[^\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}a-zA-Z0-9\s]/gu) ?? []).length;
  const base = BASE[input.difficulty] * (1 + Math.min(0.35, Math.max(0, len - 16) / 180)) * (1 + Math.min(0.2, symbols * 0.03));
  const cps = input.hits / Math.max(0.4, input.elapsedMs / 1000);
  const speed = clamp(1 + (cps - 2.2) * 0.16, 1, 1.5);
  const acc = input.hits / Math.max(1, input.hits + input.misses);
  const accuracy = clamp(0.7 + acc * 0.6, 0.7, 1.3);
  return Math.round(base * speed * accuracy);
}

export function calcSpeed(hits: number, durationMs: number): number {
  return Math.round((hits / Math.max(1, durationMs / 1000)) * 60);
}

export function calcAccuracy(hits: number, misses: number): number {
  return Math.round((hits / Math.max(1, hits + misses)) * 1000) / 10;
}
