# 261027-nx: Upgrade Next.js 15.1.9 to 16.4.3 to unblock the Cloudflare deploy

Every production deploy since #125 failed in `opennextjs-cloudflare build` with `Next.js version 15.1.9 is not supported`. Phase 9 (to-do list, #126) and Phase 10 never reached www.befocus.work.

- Cause: `@opennextjs/aws` `isNextVersionSupported` is date based (major release + 2 years). Next 15 shipped 2024-10-21, so every 15.x is rejected since 2026-10-21. Bumping within 15.x cannot help.
- Fix: `next` 15.1.9 to 16.4.3 (latest) in `apps/next/package.json`. Adapter stays at 1.20.6 (peer `>=16.3.3`). React 18.3.1 stays (Next 16 peer allows `^18.2`). No source changes.
- Left as is: `middleware.ts` still builds ("Proxy (Middleware)"); `next dev` prints a deprecation hint to rename it to `proxy.ts`. Separate chore.
- Verified: `opennextjs-cloudflare build` passes; `bun run lint`; `tsc --noEmit` for apps/next and packages/api; no test runner exists. Browser check on local dev: guest timer and Tasks panel (add task) at 1440 and 390 wide.
- Signed-in `/` and `/log` not exercised locally (needs auth against the real DB).
