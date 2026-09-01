#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/share/vite-plus/bin:$HOME/.local/bin:/usr/bin:/bin"
cd /home/toro/projects/typing-app
W=(node node_modules/wrangler/bin/wrangler.js)

echo "=== migrations list remote ==="
"${W[@]}" d1 migrations list typing-app --remote

echo "=== migrations apply remote ==="
"${W[@]}" d1 migrations apply typing-app --remote

echo "=== tables ==="
"${W[@]}" d1 execute typing-app --remote --command "SELECT name FROM sqlite_master WHERE type='table';"

echo "=== seed remote ==="
"${W[@]}" d1 execute typing-app --remote --file=seed/puzzles.sql

echo "=== puzzle count ==="
"${W[@]}" d1 execute typing-app --remote --command "SELECT difficulty, COUNT(*) AS n FROM puzzles GROUP BY difficulty;"
