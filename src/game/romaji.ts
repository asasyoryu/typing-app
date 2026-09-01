export type Segment = { type: "lit"; text: string } | { type: "kana"; options: string[] };

const DIGRAPHS: Record<string, string[]> = {
  きゃ: ["kya", "kixya", "kilya"],
  きゅ: ["kyu", "kixyu", "kilyu"],
  きょ: ["kyo", "kixyo", "kilyo"],
  ぎゃ: ["gya", "gixya", "gilya"],
  ぎゅ: ["gyu", "gixyu", "gilyu"],
  ぎょ: ["gyo", "gixyo", "gilyo"],
  しゃ: ["sya", "sha", "sixya", "silya", "shixya"],
  しゅ: ["syu", "shu", "sixyu", "silyu", "shixyu"],
  しょ: ["syo", "sho", "sixyo", "silyo", "shixyo"],
  じゃ: ["ja", "jya", "zya", "jixya", "zixya"],
  じゅ: ["ju", "jyu", "zyu", "jixyu", "zixyu"],
  じょ: ["jo", "jyo", "zyo", "jixyo", "zixyo"],
  ちゃ: ["tya", "cha", "cya", "tixya"],
  ちゅ: ["tyu", "chu", "cyu", "tixyu"],
  ちょ: ["tyo", "cho", "cyo", "tixyo"],
  にゃ: ["nya", "nixya"],
  にゅ: ["nyu", "nixyu"],
  にょ: ["nyo", "nixyo"],
  ひゃ: ["hya", "hixya"],
  ひゅ: ["hyu", "hixyu"],
  ひょ: ["hyo", "hixyo"],
  びゃ: ["bya", "bixya"],
  びゅ: ["byu", "bixyu"],
  びょ: ["byo", "bixyo"],
  ぴゃ: ["pya", "pixya"],
  ぴゅ: ["pyu", "pixyu"],
  ぴょ: ["pyo", "pixyo"],
  みゃ: ["mya", "mixya"],
  みゅ: ["myu", "mixyu"],
  みょ: ["myo", "mixyo"],
  りゃ: ["rya", "rixya"],
  りゅ: ["ryu", "rixyu"],
  りょ: ["ryo", "rixyo"],
};

const KANA: Record<string, string[]> = {
  あ: ["a"],
  い: ["i"],
  う: ["u", "wu"],
  え: ["e"],
  お: ["o"],
  か: ["ka", "ca"],
  き: ["ki"],
  く: ["ku", "cu", "qu"],
  け: ["ke"],
  こ: ["ko", "co"],
  さ: ["sa"],
  し: ["si", "shi", "ci"],
  す: ["su"],
  せ: ["se", "ce"],
  そ: ["so"],
  た: ["ta"],
  ち: ["ti", "chi"],
  つ: ["tu", "tsu"],
  て: ["te"],
  と: ["to"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["hu", "fu"],
  へ: ["he"],
  ほ: ["ho"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo", "o"],
  ん: ["n", "nn", "xn"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  ざ: ["za"],
  じ: ["zi", "ji"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  だ: ["da"],
  ぢ: ["di", "ji"],
  づ: ["du", "zu"],
  で: ["de"],
  ど: ["do"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  ぁ: ["xa", "la"],
  ぃ: ["xi", "li", "xyi", "lyi"],
  ぅ: ["xu", "lu"],
  ぇ: ["xe", "le", "xye", "lye"],
  ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"],
  ゅ: ["xyu", "lyu"],
  ょ: ["xyo", "lyo"],
  っ: ["xtu", "ltu", "xtsu", "ltsu"],
  ゎ: ["xwa", "lwa"],
  ー: ["-"],
};

function toHiraganaChar(ch: string): string {
  const code = ch.charCodeAt(0);
  if (code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCharCode(code - 0x60);
  }
  return ch;
}

function firstConsonant(romaji: string): string {
  if (romaji.startsWith("ch")) return "c";
  if (romaji.startsWith("sh")) return "s";
  return romaji[0] ?? "";
}

export function parseReading(reading: string): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  let pendingSokuon = false;

  const pushKana = (options: string[]) => {
    if (pendingSokuon) {
      const doubled = options.flatMap((opt) => {
        const c = firstConsonant(opt);
        return c && /[bcdfghjklmnpqrstvwxyz]/.test(c) ? [c + opt] : [];
      });
      segs.push({
        type: "kana",
        options: [...doubled, ...options.map((o) => `xtu${o}`), ...options.map((o) => `ltu${o}`)],
      });
      pendingSokuon = false;
      return;
    }
    segs.push({ type: "kana", options });
  };

  while (i < reading.length) {
    const raw2 = reading.slice(i, i + 2);
    const h2 = [...raw2].map(toHiraganaChar).join("");
    if (DIGRAPHS[h2]) {
      pushKana(DIGRAPHS[h2]);
      i += 2;
      continue;
    }

    const raw1 = reading[i] ?? "";
    const h1 = toHiraganaChar(raw1);
    if (h1 === "っ") {
      pendingSokuon = true;
      i += 1;
      continue;
    }
    if (KANA[h1]) {
      if (h1 === "ー" && segs.length > 0) {
        const prev = segs[segs.length - 1];
        const vowels =
          prev?.type === "kana" ? prev.options.map((o) => o.at(-1) ?? "").filter(Boolean) : [];
        pushKana(["-", ...vowels]);
      } else {
        pushKana(KANA[h1]);
      }
      i += 1;
      continue;
    }

    if (pendingSokuon) {
      segs.push({ type: "kana", options: ["xtu", "ltu", "xtsu"] });
      pendingSokuon = false;
    }
    if (raw1 === "。" || raw1 === "．") {
      segs.push({ type: "kana", options: [".", "。"] });
    } else if (raw1 === "、" || raw1 === "，") {
      segs.push({ type: "kana", options: [",", "、"] });
    } else if (raw1 === "！" || raw1 === "!") {
      segs.push({ type: "kana", options: ["!", "！"] });
    } else if (raw1 === "？" || raw1 === "?") {
      segs.push({ type: "kana", options: ["?", "？"] });
    } else if (raw1 === "「") {
      segs.push({ type: "kana", options: ["[", "「"] });
    } else if (raw1 === "」") {
      segs.push({ type: "kana", options: ["]", "」"] });
    } else {
      segs.push({ type: "lit", text: raw1 });
    }
    i += 1;
  }

  if (pendingSokuon) {
    segs.push({ type: "kana", options: ["xtu", "ltu", "xtsu"] });
  }
  return segs;
}

export function expectedChars(reading: string): string {
  return parseReading(reading)
    .map((seg) => (seg.type === "lit" ? seg.text : (seg.options[0] ?? "")))
    .join("");
}

export type MatchResult = "ok" | "miss" | "complete";

export function createMatcher(reading: string) {
  const segs = parseReading(reading);
  let segIndex = 0;
  let pos = 0;
  let options: string[] = [];
  let typed = "";

  const load = () => {
    const seg = segs[segIndex];
    if (!seg) {
      options = [];
      return;
    }
    options = seg.type === "lit" ? [seg.text] : [...seg.options];
    pos = 0;
  };
  load();

  return {
    feed(ch: string): MatchResult {
      if (segIndex >= segs.length) return "complete";
      const next = options.filter((opt) => opt[pos] === ch);
      if (next.length === 0) {
        if (options.some((opt) => pos >= opt.length)) {
          segIndex += 1;
          load();
          return this.feed(ch);
        }
        return "miss";
      }
      options = next;
      pos += 1;
      typed += ch;
      if (options.every((opt) => pos >= opt.length)) {
        segIndex += 1;
        load();
      }
      return segIndex >= segs.length ? "complete" : "ok";
    },
    getTyped() {
      return typed;
    },
    getGhost() {
      return options[0]?.slice(pos) ?? "";
    },
    isComplete() {
      return segIndex >= segs.length;
    },
  };
}
