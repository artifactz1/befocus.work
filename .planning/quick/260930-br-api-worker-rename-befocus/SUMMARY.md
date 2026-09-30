# Quick: Rename API deploy name to befocus

Live api.befocus.work is Worker `befocus` in Telepathy Studio account. `packages/api/wrangler.toml` name `hono-learn` -> `befocus` (keep_vars kept). `apps/next/wrangler.jsonc` gains `keep_vars: true` so CI deploy keeps dashboard `API_URL` on `befocus-web`. README updated. Supersedes 260929-ba naming. Not deployed.

Before merge: production env CLOUDFLARE_ACCOUNT_ID/CLOUDFLARE_API_TOKEN must target Telepathy Studio. Old `hono-learn` Workers deletable after verify.
