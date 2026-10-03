# 261002-ts: Keep timer full size when customize panel opens

Root cause: `computeTimerTransform` (timer-scale.ts) scaled the clock 0.2-0.72 while the panel was open. Scale is now always 1; the timer only translates into the free area (left of the 520px dock on desktop, above the 60dvh sheet on mobile). Self-check updated. Not verified in a browser: dashboard is auth-gated and no API env exists locally. Timer can overlap the panel at narrow widths now that it no longer shrinks.
