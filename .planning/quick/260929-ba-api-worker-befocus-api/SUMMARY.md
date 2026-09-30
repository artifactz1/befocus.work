# Quick: Deploy API to hono-learn Worker

API Worker name in `packages/api/wrangler.toml` is now `hono-learn` (holds prod secrets/vars, serves api.befocus.work) with `keep_vars = true` so deploys keep dashboard plain-text vars. README secrets line updated. deploy.yml has no hard-coded Worker name. Not deployed; CI deploys after merge.

Deferred: renaming to `befocus-api`. The dashboard cannot rename Workers, so it would need secrets re-set and the custom domain moved.
