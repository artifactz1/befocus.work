// Runnable self-check for the export text (no test runner exists in this repo).
// Run with: TZ=UTC bun run src/lib/logs/export.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import { escapeMd, exportFileName, toMarkdown, toText } from './export'
import { mdFixture, must } from './fixture'
import { buildSummary, makeFormat } from './summary'

const fmt = makeFormat('en-GB', 'UTC')
const summary = buildSummary(mdFixture())

// UI-SPEC section 7 sample. The spec prints "Tue 21 Oct 2026"; 21 Oct 2026 is a Wednesday.
const MD = `# Focus session · Wed 21 Oct 2026
09:00 - 10:44 · 1h 32m focused · 3 of 4 blocks · 1 skipped · +5 min added

## Done
- [x] Write notes
- [x] Review PR
- [x] Reply to Alex

## Not done
- [ ] Fix flaky timer test (later)
- [ ] Draft Phase 10 board (next session)

## Later
- Update README

## Blocks
1. 09:00 - 09:30 · Write notes · +5 min · Deep
   Outline done, intro drafted.
2. 09:35 - 10:00 · Review PR · Reply to Alex · Okay
   Reviewed the Phase 9 PR, left 3 comments. Answered Alex about the release.
3. 10:02 - 10:14 · Fix flaky timer test · skipped · Scattered
   Could not reproduce it, got pulled into Slack.
4. 10:19 - 10:44 · Draft Phase 10 board · Deep
   Mocks half done, export section left.

## Next time
Silence Slack before the third block.`
assert.equal(toMarkdown(summary, fmt), MD)

const TXT = MD.replace('# Focus', 'Focus')
  .replace(/^## /gm, '')
  .replace(/^- \[[ x]\] /gm, '- ')
assert.equal(toText(summary, fmt), TXT)

// empty sections, missing ratings and empty logs are omitted
const bare = mdFixture()
bare.live = false
bare.note = null
bare.links = []
bare.logs = [{ blockId: 'b1', sessionId: bare.sessionId, text: '', rating: null }]
const bareMd = toMarkdown(buildSummary(bare), fmt)
for (const h of ['## Done', '## Not done', '## Later', '## Next time'])
  assert.ok(!bareMd.includes(h), h)
assert.ok(bareMd.includes('1. 09:00 - 09:30 · +5 min\n2. 09:35 - 10:00\n'))

// escaping
assert.equal(escapeMd('<img src=x onerror=alert(1)>'), '\\<img src=x onerror=alert(1)\\>')
assert.equal(escapeMd('[a](javascript:x)'), '\\[a\\](javascript:x)')
assert.equal(escapeMd('\\ ` * _ [ ] < > # |'), '\\\\ \\` \\* \\_ \\[ \\] \\< \\> \\# \\|')
const evil = mdFixture()
evil.links[0] = { ...must(evil.links[0]), text: '<img src=x>\n# [a](b)' }
evil.note = { ...must(evil.note), extraDone: ['*bold*\nmore'], nextTime: 'a\n# b' }
evil.logs[0] = { ...must(evil.logs[0]), text: 'line one\n# line *two*' }
const evilMd = toMarkdown(buildSummary(evil), fmt)
assert.ok(evilMd.includes('- [x] \\<img src=x\\> \\# \\[a\\](b)\n'))
assert.ok(evilMd.includes('- [x] \\*bold\\* more\n'))
assert.ok(evilMd.includes('   line one\n   \\# line \\*two\\*\n'))
assert.ok(evilMd.endsWith('## Next time\na\n\\# b'))
assert.ok(!/^<|^#(?! Focus)/m.test(evilMd.replace(/^## .*$/gm, '')))
// plain text is not escaped
assert.ok(toText(buildSummary(evil), fmt).includes('- *bold* more\n'))

// file name
assert.equal(exportFileName(summary.start, 'md', fmt), 'befocus-2026-10-21-0900.md')
assert.equal(exportFileName(summary.start, 'txt', fmt), 'befocus-2026-10-21-0900.txt')

console.log('export.check OK')
