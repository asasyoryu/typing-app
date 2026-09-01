---
name: vite-plus
description: Uses the official Vite+ toolchain (vp) for install, dev, check, test, and build. Use when working with Vite+, vp commands, Oxlint, Oxfmt, or this project's JavaScript tooling.
---

# Vite+

Official toolchain: https://viteplus.dev/llms-full.txt

Install if missing:

```bash
curl -fsSL https://vite.plus | bash
```

Project commands go through `just`, which calls `vp`:

- `vp install`
- `vp dev`
- `vp check` (format + lint + typecheck)
- `vp test`
- `vp build`

Do not add ESLint, Prettier, or a second package manager workflow. Read the official llms file before changing Vite+ config.
