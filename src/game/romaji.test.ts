import { describe, expect, it } from "vitest";
import { createMatcher, parseReading } from "./romaji.ts";

function typeAll(reading: string, input: string) {
  const m = createMatcher(reading);
  let last: string = "ok";
  for (const ch of input) last = m.feed(ch);
  return { last, complete: m.isComplete() };
}

describe("parseReading", () => {
  it("keeps ascii and symbols as literals", () => {
    const segs = parseReading("#incident");
    expect(segs.every((s) => s.type === "lit")).toBe(true);
  });

  it("accepts shi and si", () => {
    expect(typeAll("し", "shi").complete).toBe(true);
    expect(typeAll("し", "si").complete).toBe(true);
  });

  it("accepts a full beginner reply reading", () => {
    const reading = "かくにんします。";
    expect(typeAll(reading, "kakuninsimasu.").complete).toBe(true);
    expect(typeAll(reading, "kakuninshimasu.").complete).toBe(true);
  });

  it("counts a wrong key as miss and does not advance", () => {
    const m = createMatcher("あ");
    expect(m.feed("b")).toBe("miss");
    expect(m.feed("a")).toBe("complete");
  });
});
