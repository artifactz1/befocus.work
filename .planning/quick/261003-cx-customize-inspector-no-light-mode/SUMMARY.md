# 261003-cx: Customize panel as a floating inspector, remove light/dark mode

Captain reviewed three directions on a Lavish board and picked A: a floating inspector that overlays the dashboard while the timer stays centered and untouched.

- Desktop: 360px solid card inset 16px (radius 18). Phone: floating card inset 10px, about 380px tall (radius 24).
- One scrolling list, no tabs: Looks, Background, Typeface, Accent, Timer progress, Density, Finish. Phone gets jump chips.
- Live model: every control paints immediately. Done, close, Escape and route change keep the change; Revert restores the look the panel opened with.
- Five starter Looks (Default, Paper, Moss, Night, Plum) that set background, accent and typeface together.
- Overlay and blur controls hidden (still in the schema).
- Light/dark toggle removed with next-themes: one dark palette in globals.css, static `dark` class on `<html>`, so a stale `localStorage.theme='light'` is ignored. Command menu gets "Customize look..." in place of the theme item.

Verified in a real browser (local API + Postgres, throwaway user) at 1440 and 390: timer geometry identical closed vs open, Looks/Revert/Escape/chips/command menu work, stale theme stays dark.

Note: the look is still not persisted across reloads (`persisted` stays DEFAULT_LOOK); persistence is a later phase.
