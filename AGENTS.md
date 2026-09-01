# AGENTS.md

返信打（へんしんだ）のエージェント向けメモ。詳細は `docs/specs/mvp.md`。

## 構成

- React SPA と Hono API を 1 つの Cloudflare Worker に載せる
- JS の install / lint / format / typecheck / test / build は Vite+（`vp`）に任せる
- 日常コマンドは `justfile` 経由

```
just dev
just check
just db-migrate
just db-seed
just deploy
```

## 守ること

- プレイ中のキー入力を API に送らない。結果は終了時だけ保存する
- 個人情報を保存しない。識別はブラウザの匿名 ID だけ
- D1 の変更は `migrations/` に追加する。ローカルと本番を混ぜない
- 授業指定の技術（Vite+ / Hono / Workers / D1 / Nix / direnv / just）を勝手に置き換えない
- 公式 Skill 以外の技術 Skill を増やさない

## 公式 Skill

- Vite+: https://viteplus.dev/llms-full.txt
- Cloudflare: https://github.com/cloudflare/skills
