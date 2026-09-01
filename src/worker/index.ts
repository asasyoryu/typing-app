import { Hono } from "hono";
import { mergeAnalysis } from "../game/analysis.ts";
import type { Difficulty, PlayAnalysis, PlayResult, Puzzle, StatsResponse } from "../shared/types.ts";

type AppEnv = { Bindings: Env };

const DIFFICULTIES = new Set<Difficulty>(["beginner", "intermediate", "advanced"]);
const ANON = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const app = new Hono<AppEnv>();

app.get("/api/puzzles", async (c) => {
  const difficulty = c.req.query("difficulty") ?? "";
  if (!DIFFICULTIES.has(difficulty as Difficulty)) {
    return c.json({ error: "invalid difficulty" }, 400);
  }
  const rows = await c.env.DB.prepare(
    "SELECT id, difficulty, sender_name, sender_role, channel, incoming, reply, reading, genre FROM puzzles WHERE difficulty = ? ORDER BY RANDOM()",
  )
    .bind(difficulty)
    .all<Puzzle>();
  return c.json(rows.results ?? []);
});

app.post("/api/plays", async (c) => {
  const body = (await c.req.json()) as PlayResult;
  if (!ANON.test(body.anonId) || !DIFFICULTIES.has(body.difficulty)) {
    return c.json({ error: "invalid play" }, 400);
  }
  if (typeof body.salary !== "number" || typeof body.analysis !== "object") {
    return c.json({ error: "invalid play" }, 400);
  }
  await c.env.DB.prepare(
    `INSERT INTO plays (anon_id, difficulty, salary, speed, accuracy, miss_count, max_combo, reply_count, duration_ms, analysis_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      body.anonId,
      body.difficulty,
      Math.round(body.salary),
      body.speed,
      body.accuracy,
      body.missCount,
      body.maxCombo,
      body.replyCount,
      body.durationMs,
      JSON.stringify(body.analysis),
    )
    .run();
  return c.json({ ok: true });
});

app.get("/api/stats", async (c) => {
  const anonId = c.req.query("anonId") ?? "";
  if (!ANON.test(anonId)) return c.json({ error: "invalid id" }, 400);
  const rows = await c.env.DB.prepare("SELECT analysis_json FROM plays WHERE anon_id = ?")
    .bind(anonId)
    .all<{ analysis_json: string }>();
  const parts = (rows.results ?? []).map((row) => JSON.parse(row.analysis_json) as PlayAnalysis);
  const res: StatsResponse = { playCount: parts.length, analysis: mergeAnalysis(parts) };
  return c.json(res);
});

export default app;
