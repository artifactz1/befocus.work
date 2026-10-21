# Deferred items

## Found during 09-11 (out of scope)

- Settings dialog Start path (`applySettings run:true` -> `resetWith`) assigns new session and block ids. Plan sync adopts them but `seed()` returns null, so the plan and session view stay "planning" forever in guest mode. Workaround while testing: reload, then press Start directly. Not caused by 09-11.
