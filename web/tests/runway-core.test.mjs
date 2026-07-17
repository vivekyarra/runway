import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertHandoffAllowed,
  buildHandoff,
  createLane,
  deriveConflicts,
  hasDeclaredScope,
  inspectPair,
  laneClearance,
  reserveLaneState,
  rerouteScope,
  runwayMetrics,
} from '../src/core/runway.js'
import { scanWorkspace } from '../bin/runway.mjs'

test('holds a lane when it shares a file, symbol, and contract', () => {
  const pricing = createLane({
    id: 'pricing', agent: 'Theo', task: 'Change quote',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'], status: 'airborne',
  })
  const tax = createLane({
    id: 'tax', agent: 'Sol', task: 'Apply tax',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'], status: 'queued',
  })
  const conflicts = deriveConflicts([pricing, tax])

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].severity, 'critical')
  assert.equal(laneClearance(tax, conflicts).state, 'hold')
  assert.equal(laneClearance(pricing, conflicts).state, 'protected')
  assert.equal(runwayMetrics({ lanes: [pricing, tax] }).confidence, 50)
})

test('keeps only the established airborne owner protected', () => {
  const first = createLane({
    id: 'first', agent: 'Mira', task: 'First launch', status: 'airborne', createdAt: '2026-07-17T09:00:00.000Z',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'],
  })
  const later = createLane({
    id: 'later', agent: 'Theo', task: 'Late scope expansion', status: 'airborne', createdAt: '2026-07-17T09:10:00.000Z',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'],
  })
  const conflicts = deriveConflicts([first, later])

  assert.equal(conflicts[0].ownerLaneId, 'first')
  assert.equal(laneClearance(first, conflicts).state, 'protected')
  assert.equal(laneClearance(later, conflicts).state, 'hold')
})

test('does not mask a non-owned blocking collision behind a protected collision', () => {
  const alpha = createLane({
    id: 'alpha', agent: 'Alpha', task: 'Two seams', status: 'airborne', createdAt: '2026-07-17T09:00:00.000Z',
    files: ['src/a.js', 'src/b.js'],
  })
  const bravo = createLane({
    id: 'bravo', agent: 'Bravo', task: 'A seam', status: 'queued', files: ['src/a.js'],
  })
  const charlie = createLane({
    id: 'charlie', agent: 'Charlie', task: 'B seam', status: 'airborne', createdAt: '2026-07-17T08:00:00.000Z',
    files: ['src/b.js'],
  })

  const statesFor = (lanes) => {
    const conflicts = deriveConflicts(lanes)
    return Object.fromEntries(lanes.map((lane) => [lane.id, laneClearance(lane, conflicts).state]))
  }

  const expected = { alpha: 'hold', bravo: 'hold', charlie: 'protected' }
  assert.deepEqual(statesFor([alpha, bravo, charlie]), expected)
  assert.deepEqual(statesFor([bravo, charlie, alpha]), expected)
})

test('normalizes Windows and dot-segment file declarations but keeps JavaScript symbols case-sensitive', () => {
  const windows = createLane({ id: 'windows', agent: 'Mira', task: 'Quote', status: 'airborne', files: ['src\\quote.js'] })
  const posix = createLane({ id: 'posix', agent: 'Sol', task: 'Tax', status: 'queued', files: ['./src/quote.js'] })
  const pathConflict = deriveConflicts([windows, posix])

  assert.equal(pathConflict.length, 1)
  assert.deepEqual(pathConflict[0].evidence[0].values, ['src/quote.js'])
  assert.equal(laneClearance(posix, pathConflict).state, 'hold')

  const lowercase = createLane({ id: 'lowercase', agent: 'Theo', task: 'Lower', status: 'queued', files: ['client/render.js'], symbols: ['render'] })
  const uppercase = createLane({ id: 'uppercase', agent: 'Ada', task: 'Upper', status: 'queued', files: ['server/render.js'], symbols: ['Render'] })
  assert.equal(inspectPair(lowercase, uppercase).score, 0)
})

test('surfaces same-module proximity as a low, non-blocking review signal', () => {
  const first = createLane({ id: 'billing-a', agent: 'Mira', task: 'Invoice', status: 'queued', files: ['src/billing/invoice.js'] })
  const second = createLane({ id: 'billing-b', agent: 'Theo', task: 'Tax', status: 'queued', files: ['src/billing/tax.js'] })
  const conflicts = deriveConflicts([first, second])

  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].severity, 'low')
  assert.equal(laneClearance(first, conflicts).state, 'caution')
})

test('clears a lane after it is rerouted away from shared behavior', () => {
  const pricing = createLane({
    id: 'pricing', agent: 'Theo', task: 'Change quote',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'], status: 'airborne',
  })
  const tax = createLane({
    id: 'tax', agent: 'Sol', task: 'Apply tax',
    files: ['src/tax/adjustments.js'], symbols: ['calculateTaxAdjustment'], contracts: ['tax-adjustment'], status: 'queued',
  })
  const conflicts = deriveConflicts([pricing, tax])

  assert.equal(conflicts.length, 0)
  assert.equal(laneClearance(tax, conflicts).state, 'clear')
  assert.equal(runwayMetrics({ lanes: [pricing, tax] }).clear, 2)
})

test('narrows direct overlap before a dashboard reroute and preserves a bounded scope', () => {
  const pricing = createLane({
    id: 'pricing', agent: 'Theo', task: 'Change quote', status: 'airborne',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'],
  })
  const tax = createLane({
    id: 'tax', agent: 'Sol', task: 'Apply tax', status: 'holding',
    files: ['src/quote.js', 'src/tax/adjustments.js'],
    symbols: ['quoteTotal', 'calculateTaxAdjustment'],
    contracts: ['pricing', 'tax-adjustment'],
  })
  const rerouted = rerouteScope(tax, deriveConflicts([pricing, tax]))

  assert.equal(hasDeclaredScope(rerouted), true)
  assert.deepEqual(rerouted.files, ['src/tax/adjustments.js'])
  assert.deepEqual(rerouted.symbols, ['calculateTaxAdjustment'])
  assert.deepEqual(rerouted.contracts, ['tax-adjustment'])
  assert.equal(deriveConflicts([pricing, { ...rerouted, status: 'queued' }]).length, 0)
})

test('requires declared scope and valid transitions before reserve or handoff', () => {
  assert.throws(
    () => createLane({ id: 'empty', agent: 'Mira', task: 'No scope' }),
    /Declare at least one file, exported symbol, or behavioral contract/,
  )

  const lane = createLane({ id: 'clear', agent: 'Mira', task: 'Clear work', status: 'queued', files: ['src/clear.js'] })
  const reservation = reserveLaneState(lane, [])
  assert.equal(reservation.status, 'airborne')
  assert.doesNotThrow(() => assertHandoffAllowed({ ...lane, status: 'airborne' }, []))
  assert.throws(() => assertHandoffAllowed({ ...lane, status: 'holding' }, []), /Only an airborne lane/)
  assert.throws(() => reserveLaneState({ ...lane, status: 'handoff' }, []), /Only a queued lane/)
})

test('makes a handoff receipt from declared scope and evidence', () => {
  const lane = createLane({
    id: 'ui', agent: 'Mira', task: 'Protect checkout',
    files: ['src/checkout/CheckoutForm.jsx'], symbols: ['CheckoutForm'], contracts: ['submit-order'],
    evidence: [{ command: 'node --test', result: 'passing' }],
  })
  const receipt = buildHandoff(lane, [])

  assert.equal(receipt.owner, 'Mira')
  assert.deepEqual(receipt.scope.symbols, ['CheckoutForm'])
  assert.equal(receipt.evidence[0].result, 'passing')
  assert.equal(receipt.knownRisk.length, 0)
})

test('scans the bundled fixture for JavaScript and JSX exports', () => {
  const scan = scanWorkspace(fileURLToPath(new URL('../fixtures/parcel-ops', import.meta.url)))
  const symbols = scan.exports.map((entry) => entry.symbol)

  assert.ok(symbols.includes('quoteTotal'))
  assert.ok(symbols.includes('CheckoutForm'))
  assert.ok(symbols.includes('calculateTaxAdjustment'))
})
