import { describe, expect, it } from "vitest";
import { calcAccuracy, calcPay, calcSpeed } from "./score.ts";

describe("score", () => {
  it("pays more for advanced than beginner", () => {
    const common = { reply: "確認します。", elapsedMs: 4000, hits: 20, misses: 0 };
    expect(calcPay({ ...common, difficulty: "advanced" })).toBeGreaterThan(
      calcPay({ ...common, difficulty: "beginner" }),
    );
  });

  it("lowers pay when there are many misses", () => {
    const base = {
      difficulty: "beginner" as const,
      reply: "確認します。",
      elapsedMs: 4000,
      hits: 20,
    };
    expect(calcPay({ ...base, misses: 12 })).toBeLessThan(calcPay({ ...base, misses: 0 }));
  });

  it("computes speed and accuracy", () => {
    expect(calcSpeed(120, 60_000)).toBe(120);
    expect(calcAccuracy(9, 1)).toBe(90);
  });
});
