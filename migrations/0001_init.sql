CREATE TABLE puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  channel TEXT NOT NULL,
  incoming TEXT NOT NULL,
  reply TEXT NOT NULL,
  reading TEXT NOT NULL,
  genre TEXT NOT NULL
);

CREATE TABLE plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anon_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  salary INTEGER NOT NULL,
  speed REAL NOT NULL,
  accuracy REAL NOT NULL,
  miss_count INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  reply_count INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  analysis_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_puzzles_difficulty ON puzzles (difficulty);
CREATE INDEX idx_plays_anon ON plays (anon_id);
