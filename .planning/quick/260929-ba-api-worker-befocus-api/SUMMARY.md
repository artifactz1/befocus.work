# Quick: Rename API Worker to befocus-api

Renamed API Worker in `packages/api/wrangler.toml` from `befocus` to `befocus-api` and added `keep_vars = true` so deploys keep dashboard plain-text vars. README secrets line updated. deploy.yml has no hard-coded Worker name. Not deployed; CI deploys after merge.

Pre-merge step: the existing `hono-learn` Worker (holds prod secrets/vars, serves api.befocus.work) must be renamed to `befocus-api` in the Cloudflare dashboard BEFORE merge, otherwise CI creates an empty Worker without secrets.
