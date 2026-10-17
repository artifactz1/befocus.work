// Run: bun run src/lib/session/session.check.ts (cwd apps/next)
import assert from 'node:assert/strict'
import {
  ASK_KEY,
  clampToLimit,
  endsAt,
  formatTotal,
  isFinished,
  isFresh,
  LIMITS,
  limitText,
  rangeText,
  readAskBeforeStart,
  startAction,
  stepValue,
  totalMinutes,
  unitText,
  valueText,
  writeAskBeforeStart,
} from './session'

assert.deepEqual(LIMITS, {
  focus: { min: 5, max: 90, step: 5 },
  break: { min: 5, max: 30, step: 5 },
  rounds: { min: 1, max: 12, step: 1 },
})

const fresh = {
  isRunning: false,
  isWorking: true,
  currentSession: 1,
  sessions: 6,
  timeLeft: 1500,
  workDuration: 1500,
}
assert.equal(isFresh(fresh), true)
assert.equal(isFresh({ ...fresh, isRunning: true }), false)
assert.equal(isFresh({ ...fresh, isWorking: false }), false)
assert.equal(isFresh({ ...fresh, currentSession: 2 }), false)
assert.equal(isFresh({ ...fresh, timeLeft: 1499 }), false)

const done = { ...fresh, currentSession: 6, sessions: 6, timeLeft: 0, isRunning: true }
assert.equal(isFinished(done), true)
assert.equal(isFinished({ ...done, isRunning: false }), true)
assert.equal(isFinished({ ...done, currentSession: 5 }), false)
assert.equal(isFinished({ ...done, timeLeft: 1 }), false)

assert.equal(startAction({ ...fresh, askBeforeStart: true }), 'open')
assert.equal(startAction({ ...done, askBeforeStart: true }), 'open')
assert.equal(startAction({ ...done, askBeforeStart: false }), 'restart')
assert.equal(startAction({ ...fresh, askBeforeStart: false }), 'toggle')
assert.equal(
  startAction({ ...fresh, currentSession: 2, timeLeft: 900, askBeforeStart: true }),
  'toggle',
)
assert.equal(
  startAction({ ...fresh, isRunning: true, timeLeft: 1000, askBeforeStart: true }),
  'toggle',
)

assert.equal(clampToLimit(120, 'focus'), 90)
assert.equal(clampToLimit(2, 'break'), 5)
assert.equal(clampToLimit(20, 'rounds'), 12)
assert.equal(clampToLimit(52, 'focus'), 52)
assert.equal(clampToLimit(1.5, 'break'), 5)

assert.equal(stepValue(27, 'focus', 1), 30)
assert.equal(stepValue(27, 'focus', -1), 25)
assert.equal(stepValue(25, 'focus', 1), 30)
assert.equal(stepValue(90, 'focus', 1), 90)
assert.equal(stepValue(5, 'break', -1), 5)
assert.equal(stepValue(27, 'focus', 1, 3), 40)
assert.equal(stepValue(10, 'focus', -1, 3), 5)
assert.equal(stepValue(12, 'rounds', 1), 12)
assert.equal(stepValue(1, 'rounds', -1), 1)

assert.equal(rangeText('focus'), '5-90 min')
assert.equal(rangeText('break'), '5-30 min')
assert.equal(rangeText('rounds'), '1-12 rounds')
assert.equal(limitText('focus', 5), 'Minimum 5 min')
assert.equal(limitText('focus', 90), 'Maximum 90 min')
assert.equal(limitText('break', 30), 'Maximum 30 min')
assert.equal(limitText('rounds', 1), 'Minimum 1 round')
assert.equal(limitText('rounds', 12), 'Maximum 12 rounds')
assert.equal(limitText('focus', 25), null)

assert.equal(valueText('focus', 25), '25 minutes')
assert.equal(valueText('rounds', 1), '1 round')
assert.equal(valueText('rounds', 6), '6 rounds')
assert.equal(unitText('rounds', 1), 'round')
assert.equal(unitText('rounds', 2), 'rounds')
assert.equal(unitText('break', 5), 'min')

assert.equal(totalMinutes(25, 5, 6), 175)
assert.equal(formatTotal(175), '2h 55m')
assert.equal(formatTotal(120), '2h')
assert.equal(formatTotal(45), '45m')
assert.equal(endsAt(0, 175), 10500000)

const fake = (init: Record<string, string> = {}) => {
  const m = { ...init }
  return {
    m,
    getItem: (k: string) => m[k] ?? null,
    setItem: (k: string, v: string) => {
      m[k] = v
    },
  } as unknown as Storage & { m: Record<string, string> }
}
const boom = {
  getItem: () => {
    throw new Error('denied')
  },
  setItem: () => {
    throw new Error('denied')
  },
} as unknown as Storage
assert.equal(ASK_KEY, 'befocus.askBeforeStart')
assert.equal(readAskBeforeStart(fake()), true)
assert.equal(readAskBeforeStart(fake({ [ASK_KEY]: '0' })), false)
assert.equal(readAskBeforeStart(fake({ [ASK_KEY]: '1' })), true)
assert.equal(readAskBeforeStart(fake({ [ASK_KEY]: 'false' })), true)
assert.equal(readAskBeforeStart(boom), true)
assert.equal(readAskBeforeStart(undefined), true)
const f = fake()
writeAskBeforeStart(false, f)
assert.equal(f.m[ASK_KEY], '0')
writeAskBeforeStart(true, f)
assert.equal(f.m[ASK_KEY], '1')
assert.doesNotThrow(() => writeAskBeforeStart(false, boom))

console.log('session.check OK')
