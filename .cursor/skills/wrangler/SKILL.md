---
name: wrangler
description: Official Cloudflare Wrangler CLI skill. Load before wrangler, D1, or deploy commands. Prefer current Cloudflare docs over memory.
---

# Wrangler CLI

Source: https://github.com/cloudflare/skills/blob/main/skills/wrangler/SKILL.md

- Docs: https://developers.cloudflare.com/workers/wrangler/
- Install: `npm install -D wrangler@latest`
- This project wraps commands in `justfile`. Prefer `just deploy`, `just db-migrate`, `just db-seed`.
- Local D1: `wrangler d1 migrations apply typing-app --local`
- Remote D1: `wrangler d1 migrations apply typing-app --remote`
- Auth: `wrangler login` then `wrangler whoami`
- After changing `wrangler.json`, keep `database_id` for remote D1 separate from local.
