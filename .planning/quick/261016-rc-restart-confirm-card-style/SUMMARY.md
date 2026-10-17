---
status: complete
---

# 261016-rc: Restart confirm styled like the session card

- `.confirm` and `.card` share one rule set (tokens, fixed centering, `min(400px, 100vw - 32px)` width, 18px radius, surface, shadow, rise/sink animation); the confirm gets its own padding and a hairline-separated action row. On phone the actions are a 2-column grid with 44px targets.
- Verified in guest mode in a real browser (dark): 1440, 390 and 320 wide. Confirm is centered with 16px side margins and rounded corners, Escape closes only the confirm, no new console errors (the only one is the unstarted API at :8787).
- `bun run check`, web tsc and api tsc pass.
