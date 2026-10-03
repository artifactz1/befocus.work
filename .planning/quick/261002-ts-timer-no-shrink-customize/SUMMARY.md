# 261002-ts: Keep timer full size when customize panel opens

Root cause: `computeTimerTransform` (timer-scale.ts) scaled the clock 0.2-0.72 and translated it while the panel was open. Captain picked "overlay": timer stays put at full size and the panel overlays it. Removed the transform entirely (timer-scale.ts, Timer.tsx measuring effect, `.clockTransition` CSS, the timer part of customize.check.ts). Also removed the backdrop blur on the mobile sheet's top edge.

Verified in a real browser (local API + Postgres, throwaway user) at 1440, 1280 and 390: timer geometry identical closed vs open.

Note: the mobile-only rule in packages/ui globals.css that fades header, progress grid and footer while the sheet is open is unchanged.
