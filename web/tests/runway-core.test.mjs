import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { buildHandoff, createLane, deriveConflicts, laneClearance, runwayMetrics } from '../src/core/runway.js'
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

test('makes a handoff receipt from declared scope and evidence', () => {
  const lane = createLane({
    id: 'ui', agent: 'Mira', task: 'Protect checkout',
    files: ['src/checkout/CheckoutForm.jsx'], symbols: ['CheckoutForm'], contracts: ['submit-order'],
    evidence: [{ command: 'node --test', result: 'passing' }],
  })
  const receipt = buildHandoff(lane, [])

  assert.equal(receipt.owner, 'Mira')
  assert.deepEqual(receipt.scope.symbols, ['checkoutform'])
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
