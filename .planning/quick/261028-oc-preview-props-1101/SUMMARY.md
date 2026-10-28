# 261028-oc: Fix production error 1101 after the Next 16 upgrade

After #129 deployed, `/guest` and `/sign-in` returned HTTP 500 (Cloudflare error 1101).

- Cause: reproduced in local `opennextjs-cloudflare preview`: `Unexpected loadManifest(/.next/server/preview-props.json) call!` thrown while constructing `NextNodeServer`. Next 16.4 reads `preview-props.json`; `@opennextjs/cloudflare` 1.20.6 (`@opennextjs/aws` 4.1.4) does not inline it into the Worker bundle.
- Fix: `@opennextjs/cloudflare` ^1.20.6 to ^1.20.14 (`@opennextjs/aws` 4.1.13, whose load-manifest patch covers `preview-props.json`); `wrangler` ^4.141.0 to ^4.148.0 (adapter peer requirement).
- Regression check: `apps/next/scripts/smoke.sh` (`bun run smoke` against a running `bun run preview`) fails on non-200 for `/guest` and `/sign-in`.
- Verified: local preview returns 200 for both routes; desktop and mobile screenshots in the PR.
