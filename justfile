set dotenv-load := false

db := "typing-app"

dev:
    vp dev

check:
    vp check
    vp test
    vp build

deploy:
    vp build
    wrangler deploy

db-migrate:
    wrangler d1 migrations apply {{ db }} --local

db-migrate-remote:
    wrangler d1 migrations apply {{ db }} --remote

db-seed:
    wrangler d1 execute {{ db }} --local --file=seed/puzzles.sql

db-seed-remote:
    wrangler d1 execute {{ db }} --remote --file=seed/puzzles.sql

db-create-remote:
    wrangler d1 create {{ db }}
