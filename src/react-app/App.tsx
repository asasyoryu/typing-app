import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { emptyAnalysis, recordKey, topMisses } from "../game/analysis.ts";
import { createMatcher } from "../game/romaji.ts";
import { calcAccuracy, calcPay, calcSpeed } from "../game/score.ts";
import type {
  Difficulty,
  PlayAnalysis,
  PlayResult,
  Puzzle,
  StatsResponse,
} from "../shared/types.ts";
import { getAnonId } from "./anon.ts";

type Screen = "title" | "play" | "result" | "analysis";

const LABELS: Record<Difficulty, { title: string; sub: string; klass: string }> = {
  beginner: { title: "初級", sub: "新米エンジニア", klass: "b" },
  intermediate: { title: "中級", sub: "慣れてきた人", klass: "i" },
  advanced: { title: "上級", sub: "つよつよ", klass: "a" },
};

const FINGER_JA: Record<string, string> = {
  leftPinky: "左小指",
  leftRing: "左薬指",
  leftMiddle: "左中指",
  leftIndex: "左人差指",
  thumb: "親指",
  rightIndex: "右人差指",
  rightMiddle: "右中指",
  rightRing: "右薬指",
  rightPinky: "右小指",
};

const LIMIT_MS = 90_000;

function yen(n: number) {
  return `¥${Math.round(n).toLocaleString("ja-JP")}`;
}

export function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [index, setIndex] = useState(0);
  const [messages, setMessages] = useState<
    Array<{ who: "them" | "me"; name: string; text: string }>
  >([]);
  const [typed, setTyped] = useState("");
  const [ghost, setGhost] = useState("");
  const [salary, setSalary] = useState(0);
  const [lastPay, setLastPay] = useState(0);
  const [combo, setCombo] = useState(0);
  const [leftMs, setLeftMs] = useState(LIMIT_MS);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [error, setError] = useState("");

  const matcherRef = useRef(createMatcher(""));
  const analysisRef = useRef<PlayAnalysis>(emptyAnalysis());
  const prevKeyRef = useRef<string | null>(null);
  const startRef = useRef(0);
  const puzzleStartRef = useRef(0);
  const puzzleHitsRef = useRef(0);
  const puzzleMissRef = useRef(0);
  const finishedRef = useRef(false);
  const snapshot = useRef({ salary: 0, hits: 0, misses: 0, maxCombo: 0, replies: 0, difficulty });

  const puzzle = puzzles[index];

  const resetMatcher = useCallback((reading: string) => {
    matcherRef.current = createMatcher(reading);
    setTyped("");
    setGhost(matcherRef.current.getGhost());
    puzzleStartRef.current = Date.now();
    puzzleHitsRef.current = 0;
    puzzleMissRef.current = 0;
  }, []);

  const finish = useCallback(async () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const s = snapshot.current;
    const durationMs = Math.min(LIMIT_MS, Date.now() - startRef.current);
    const payload: PlayResult = {
      anonId: getAnonId(),
      difficulty: s.difficulty,
      salary: s.salary,
      speed: calcSpeed(s.hits, durationMs),
      accuracy: calcAccuracy(s.hits, s.misses),
      missCount: s.misses,
      maxCombo: s.maxCombo,
      replyCount: s.replies,
      durationMs,
      analysis: analysisRef.current,
    };
    setResult(payload);
    setScreen("result");
    await fetch("/api/plays", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  }, []);

  const startPlay = async (next: Difficulty) => {
    setError("");
    const res = await fetch(`/api/puzzles?difficulty=${next}`);
    if (!res.ok) {
      setError("問題を読めませんでした。just db-migrate と just db-seed を実行してください。");
      return;
    }
    const list = (await res.json()) as Puzzle[];
    if (list.length === 0) {
      setError("この難易度の問題がありません。just db-seed を実行してください。");
      return;
    }
    finishedRef.current = false;
    analysisRef.current = emptyAnalysis();
    prevKeyRef.current = null;
    setDifficulty(next);
    setPuzzles(list);
    setIndex(0);
    setSalary(0);
    setLastPay(0);
    setCombo(0);
    setLeftMs(LIMIT_MS);
    startRef.current = Date.now();
    snapshot.current = { salary: 0, hits: 0, misses: 0, maxCombo: 0, replies: 0, difficulty: next };
    const first = list[0];
    setMessages([
      {
        who: "them",
        name: `${first.sender_name} · ${first.sender_role} · ${first.channel}`,
        text: first.incoming,
      },
    ]);
    resetMatcher(first.reading);
    setScreen("play");
  };

  useEffect(() => {
    if (screen !== "play") return;
    const id = window.setInterval(() => {
      const left = LIMIT_MS - (Date.now() - startRef.current);
      setLeftMs(Math.max(0, left));
      if (left <= 0) void finish();
    }, 200);
    return () => window.clearInterval(id);
  }, [screen, finish]);

  useEffect(() => {
    if (screen !== "play" || !puzzle) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === "Escape") {
        void finish();
        return;
      }
      if (ev.key.length !== 1) return;
      ev.preventDefault();
      const ch = ev.key;
      const outcome = matcherRef.current.feed(ch);
      recordKey(analysisRef.current, ch, outcome === "miss", prevKeyRef.current);
      if (outcome !== "miss") prevKeyRef.current = ch;
      if (outcome === "miss") {
        snapshot.current.misses += 1;
        puzzleMissRef.current += 1;
        setCombo(0);
        return;
      }
      snapshot.current.hits += 1;
      puzzleHitsRef.current += 1;
      setCombo((n) => {
        const next = n + 1;
        snapshot.current.maxCombo = Math.max(snapshot.current.maxCombo, next);
        return next;
      });
      setTyped(matcherRef.current.getTyped());
      setGhost(matcherRef.current.getGhost());
      if (outcome === "complete") {
        const pay = calcPay({
          difficulty,
          reply: puzzle.reply,
          elapsedMs: Date.now() - puzzleStartRef.current,
          hits: puzzleHitsRef.current,
          misses: puzzleMissRef.current,
        });
        setLastPay(pay);
        setSalary((n) => {
          const next = n + pay;
          snapshot.current.salary = next;
          return next;
        });
        snapshot.current.replies += 1;
        setMessages((cur) => [...cur, { who: "me", name: "あなた", text: puzzle.reply }]);
        const nextIndex = index + 1;
        if (nextIndex >= puzzles.length) {
          void finish();
          return;
        }
        const nxt = puzzles[nextIndex];
        setIndex(nextIndex);
        setMessages((cur) => [
          ...cur,
          {
            who: "them",
            name: `${nxt.sender_name} · ${nxt.sender_role} · ${nxt.channel}`,
            text: nxt.incoming,
          },
        ]);
        resetMatcher(nxt.reading);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, puzzle, difficulty, index, puzzles, finish, resetMatcher]);

  const openAnalysis = async () => {
    const res = await fetch(`/api/stats?anonId=${getAnonId()}`);
    if (res.ok) setStats((await res.json()) as StatsResponse);
    else setStats({ playCount: 0, analysis: emptyAnalysis() });
    setScreen("analysis");
  };

  const weakKeys = useMemo(() => (stats ? topMisses(stats.analysis.keys) : []), [stats]);
  const weakFingers = useMemo(() => (stats ? topMisses(stats.analysis.fingers, 8) : []), [stats]);
  const weakMoves = useMemo(() => (stats ? topMisses(stats.analysis.bigrams, 3) : []), [stats]);

  if (screen === "title") {
    return (
      <div className="title-screen">
        <div className="hero">
          <div className="kicker">トラブルベースの昼</div>
          <h1>返信打</h1>
          <p>スレッドが流れてくる。ローマ字で返して、年収を積み上げる。90秒。</p>
          <div className="cards">
            {(Object.keys(LABELS) as Difficulty[]).map((d) => (
              <button
                key={d}
                className={`card ${LABELS[d].klass} ${difficulty === d ? "on" : ""}`}
                onClick={() => setDifficulty(d)}
              >
                <b>{LABELS[d].title}</b>
                <div>{LABELS[d].sub}</div>
              </button>
            ))}
          </div>
          <div className="row">
            <button className="cta" onClick={() => void startPlay(difficulty)}>
              スレッドを開く
            </button>
            <button className="ghost" onClick={() => void openAnalysis()}>
              分析を見る
            </button>
          </div>
          {error ? <p>{error}</p> : null}
        </div>
      </div>
    );
  }

  if (screen === "play" && puzzle) {
    return (
      <div className="play">
        <div className="rail">
          <div className="dot" style={{ background: "#ffe56a" }}>
            #
          </div>
          <div className="dot" style={{ background: "#7b5cff", color: "#fff" }}>
            開
          </div>
          <div className="dot" style={{ background: "#ff5aa5", color: "#fff" }}>
            急
          </div>
        </div>
        <div className="thread">
          <div className="salary">
            {yen(salary)}　残り {Math.ceil(leftMs / 1000)}秒{combo > 0 ? `　コンボ ${combo}` : ""}
            {lastPay > 0 ? <span className="pay">+ {yen(lastPay)}</span> : null}
          </div>
          {messages.map((m, i) => (
            <div key={`${m.who}-${i}`} className={`bubble ${m.who}`}>
              <div className="who">{m.name}</div>
              <div>{m.text}</div>
            </div>
          ))}
          <div className="typebox">
            <div className="target">{puzzle.reply}</div>
            <div className="roma">
              <span className="ok">{typed}</span>
              <span className="now">{ghost.slice(0, 1) || " "}</span>
              <span className="yet">{ghost.slice(1)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "result" && result) {
    return (
      <div className="plain">
        <div className="wrap">
          <div className="kicker">今回の評価</div>
          <div className="yen">{yen(result.salary)}</div>
          <p>
            {LABELS[result.difficulty].sub} / {result.replyCount}通 / 90秒
          </p>
          <div className="stats">
            <div className="tile">
              速度
              <br />
              <b>{result.speed}</b>
            </div>
            <div className="tile">
              正確性
              <br />
              <b>{result.accuracy}%</b>
            </div>
            <div className="tile">
              ミス
              <br />
              <b>{result.missCount}</b>
            </div>
            <div className="tile">
              最大連続
              <br />
              <b>{result.maxCombo}</b>
            </div>
          </div>
          <div className="row" style={{ marginTop: 20 }}>
            <button className="cta" onClick={() => void startPlay(result.difficulty)}>
              もう一度
            </button>
            <button className="ghost" onClick={() => void openAnalysis()}>
              分析を見る
            </button>
            <button className="ghost" onClick={() => setScreen("title")}>
              タイトルへ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="plain">
      <div className="wrap">
        <h2>入力の癖</h2>
        <p>{stats ? `${stats.playCount} プレイ分の通算` : "まだ記録がありません"}</p>
        <div className="panel">
          <b>苦手キー</b>
          <table>
            <tbody>
              {weakKeys.map((k) => (
                <tr key={k.id}>
                  <td>{k.id}</td>
                  <td>{k.hits + k.misses} 回</td>
                  <td>{k.misses} ミス</td>
                  <td>{Math.round(k.rate * 1000) / 10}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <b>苦手な指</b>
          <table>
            <tbody>
              {weakFingers.map((k) => (
                <tr key={k.id}>
                  <td>{FINGER_JA[k.id] ?? k.id}</td>
                  <td>{Math.round(k.rate * 1000) / 10}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <b>苦手な動き</b>
          <table>
            <tbody>
              {weakMoves.map((k) => (
                <tr key={k.id}>
                  <td>{k.id}</td>
                  <td>{Math.round(k.rate * 1000) / 10}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="cta" onClick={() => setScreen("title")}>
          タイトルへ
        </button>
      </div>
    </div>
  );
}
