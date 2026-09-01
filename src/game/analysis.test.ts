import { describe, expect, it } from "vitest";
import { emptyAnalysis, fingerOf, recordKey, topMisses } from "./analysis.ts";

describe("analysis", () => {
  it("maps home-row keys to fingers", () => {
    expect(fingerOf("a")).toBe("leftPinky");
    expect(fingerOf("j")).toBe("rightIndex");
    expect(fingerOf(" ")).toBe("thumb");
  });

  it("ranks high miss-rate keys", () => {
    const a = emptyAnalysis();
    for (let i = 0; i < 8; i += 1) recordKey(a, "@", i < 3, null);
    for (let i = 0; i < 8; i += 1) recordKey(a, "a", false, null);
    const top = topMisses(a.keys, 4, 3);
    expect(top[0]?.id).toBe("@");
  });
});
