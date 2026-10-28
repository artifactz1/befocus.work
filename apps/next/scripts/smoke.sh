#!/bin/sh
# Smoke test for the OpenNext build: run `bun run preview`, then `bun run smoke`.
# Catches runtime-only Worker crashes (HTTP 500 / error 1101) that `build` does not.
base=${1:-http://localhost:8787}
for path in /guest /sign-in; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$base$path")
  echo "$path $code"
  [ "$code" = 200 ] || exit 1
done
