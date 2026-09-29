# Quick: GitHub Actions deploy to Cloudflare

Added `.github/workflows/deploy.yml`: on push to master, lint + typecheck, then deploy API (wrangler) and web (OpenNext) with the `production` environment. Documented secrets/variables in README ("Automatic Deploys").

Finding: `next build` validates server env `API_URL` too, so CI needs `API_URL` at build time as well as the runtime Worker secret.

Validated locally without credentials: install --frozen-lockfile, biome lint, tsc (web + api), OpenNext build, `wrangler deploy --dry-run`.
