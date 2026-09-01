import type { KeyStat, PlayAnalysis } from "../shared/types.ts";

export const FINGERS = [
  "leftPinky",
  "leftRing",
  "leftMiddle",
  "leftIndex",
  "thumb",
  "rightIndex",
  "rightMiddle",
  "rightRing",
  "rightPinky",
] as const;

export type Finger = (typeof FINGERS)[number];

const FINGER_BY_KEY: Record<string, Finger> = {
  "1": "leftPinky",
  q: "leftPinky",
  a: "leftPinky",
  z: "leftPinky",
  "!": "leftPinky",
  "2": "leftRing",
  w: "leftRing",
  s: "leftRing",
  x: "leftRing",
  "@": "leftRing",
  "3": "leftMiddle",
  e: "leftMiddle",
  d: "leftMiddle",
  c: "leftMiddle",
  "#": "leftMiddle",
  "4": "leftIndex",
  r: "leftIndex",
  f: "leftIndex",
  v: "leftIndex",
  "5": "leftIndex",
  t: "leftIndex",
  g: "leftIndex",
  b: "leftIndex",
  "%": "leftIndex",
  "6": "rightIndex",
  y: "rightIndex",
  h: "rightIndex",
  n: "rightIndex",
  "7": "rightIndex",
  u: "rightIndex",
  j: "rightIndex",
  m: "rightIndex",
  "&": "rightIndex",
  "8": "rightMiddle",
  i: "rightMiddle",
  k: "rightMiddle",
  ",": "rightMiddle",
  "*": "rightMiddle",
  "9": "rightRing",
  o: "rightRing",
  l: "rightRing",
  ".": "rightRing",
  "(": "rightRing",
  "0": "rightPinky",
  p: "rightPinky",
  ";": "rightPinky",
  "/": "rightPinky",
  "-": "rightPinky",
  "=": "rightPinky",
  "[": "rightPinky",
  "]": "rightPinky",
  "'": "rightPinky",
  ")": "rightPinky",
  _: "rightPinky",
  "`": "rightPinky",
  " ": "thumb",
};

export function fingerOf(key: string): Finger {
  return FINGER_BY_KEY[key.toLowerCase()] ?? (key === " " ? "thumb" : "rightPinky");
}

export function emptyAnalysis(): PlayAnalysis {
  return { keys: {}, fingers: {}, bigrams: {} };
}

function bump(map: Record<string, KeyStat>, id: string, miss: boolean) {
  const cur = map[id] ?? { hits: 0, misses: 0 };
  if (miss) cur.misses += 1;
  else cur.hits += 1;
  map[id] = cur;
}

export function recordKey(
  analysis: PlayAnalysis,
  key: string,
  miss: boolean,
  prevKey: string | null,
) {
  const id = key.length === 1 ? key : key;
  bump(analysis.keys, id, miss);
  bump(analysis.fingers, fingerOf(id), miss);
  if (prevKey) bump(analysis.bigrams, `${prevKey}→${id}`, miss);
}

export function mergeAnalysis(parts: PlayAnalysis[]): PlayAnalysis {
  const out = emptyAnalysis();
  for (const part of parts) {
    for (const [k, v] of Object.entries(part.keys)) {
      const cur = out.keys[k] ?? { hits: 0, misses: 0 };
      cur.hits += v.hits;
      cur.misses += v.misses;
      out.keys[k] = cur;
    }
    for (const [k, v] of Object.entries(part.fingers)) {
      const cur = out.fingers[k] ?? { hits: 0, misses: 0 };
      cur.hits += v.hits;
      cur.misses += v.misses;
      out.fingers[k] = cur;
    }
    for (const [k, v] of Object.entries(part.bigrams)) {
      const cur = out.bigrams[k] ?? { hits: 0, misses: 0 };
      cur.hits += v.hits;
      cur.misses += v.misses;
      out.bigrams[k] = cur;
    }
  }
  return out;
}

export function missRate(stat: KeyStat): number {
  const n = stat.hits + stat.misses;
  return n === 0 ? 0 : stat.misses / n;
}

export function topMisses(map: Record<string, KeyStat>, minAttempts = 4, limit = 5) {
  return Object.entries(map)
    .filter(([, s]) => s.hits + s.misses >= minAttempts)
    .sort((a, b) => missRate(b[1]) - missRate(a[1]) || b[1].misses - a[1].misses)
    .slice(0, limit)
    .map(([id, stat]) => ({ id, ...stat, rate: missRate(stat) }));
}
