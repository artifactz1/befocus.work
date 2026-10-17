# 261016-rc: Style the restart confirm like the session settings card

Captain answered the open Phase 7.1 item: restyle the mid-session Save restart confirm (stock AlertDialog, full-bleed with square corners on phone) to match the session settings card.

- Swap `@repo/ui/alert-dialog` for `@radix-ui/react-alert-dialog` primitives in `SessionCard.tsx` (same primitive family the card already uses); keep role=alertdialog, focus trap, Escape cancels, title and description, wording and behavior unchanged.
- `session-card.module.css`: `.confirm` shares the card's tokens, surface, radius, shadow, centering, width and animation; reuses `.scrim`, `.title`, `.sub`, `.ghost`, `.primary`.
- Out of scope: SoundOptions delete dialog, the card, other 7.1 pending items.
