# 返信打

チャット返信をローマ字で打つタイピングゲーム。仕様は `docs/specs/mvp.md`。

```bash
direnv allow
just db-migrate
just db-seed
just dev
```

`just check` で lint / typecheck / test / build。`just deploy` で Cloudflare Workers へ出す。
