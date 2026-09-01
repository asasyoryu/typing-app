#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/share/vite-plus/bin:$HOME/.local/bin:/usr/bin:/bin"
cd /home/toro/projects/typing-app
vp build
node node_modules/wrangler/bin/wrangler.js deploy
