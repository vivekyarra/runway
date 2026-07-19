import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  assertHandoffAllowed,
  assertScopeAudit,
  auditScope,
  buildDependencyEdges,
  buildHandoff,
  createLane,
  deriveConflicts,
  hasDeclaredScope,
  inspectPair,
  laneClearance,
  reserveLaneState,
  rerouteScope,
  runwayMetrics,
  scopeGrounding,
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

test('uses a persisted repository scan to surface one-hop dependency review signals', () => {
  const scan = {
    files: [
      { file: 'src/checkout/CheckoutForm.jsx', imports: ['../quote.js'] },
      { file: 'src/quote.js', imports: [] },
    ],
    exports: [
      { symbol: 'CheckoutForm', file: 'src/checkout/CheckoutForm.jsx' },
      { symbol: 'quoteTotal', file: 'src/quote.js' },
    ],
  }
  const checkout = createLane({
    id: 'checkout', agent: 'Mira', task: 'Protect submit flow', status: 'queued',
    files: ['src/checkout/CheckoutForm.jsx'], symbols: ['CheckoutForm'], contracts: ['submit-order'],
  })
  const pricing = createLane({
    id: 'pricing', agent: 'Theo', task: 'Change quote total', status: 'airborne',
    files: ['src/quote.js'], symbols: ['quoteTotal'], contracts: ['pricing'],
  })

  assert.deepEqual(buildDependencyEdges(scan), [
    { from: 'src/checkout/CheckoutForm.jsx', to: 'src/quote.js' },
  ])
  const conflicts = deriveConflicts([checkout, pricing], scan)
  assert.equal(conflicts.length, 1)
  assert.equal(conflicts[0].severity, 'low')
  assert.deepEqual(conflicts[0].evidence, [{
    kind: 'dependency edge',
    values: ['src/checkout/CheckoutForm.jsx -> src/quote.js'],
    weight: 'repository',
  }])
  assert.equal(laneClearance(checkout, conflicts).state, 'caution')
})

test('reports how much declared scope is grounded in the repository scan', () => {
  const lane = createLane({
    id: 'mixed', agent: 'Ada', task: 'Ground scope',
    files: ['src/quote.js', 'src/missing.js'],
    symbols: ['quoteTotal', 'missingExport'],
  })
  const grounding = scopeGrounding(lane, {
    files: [{ file: 'src/quote.js', imports: [] }],
    exports: [{ symbol: 'quoteTotal', file: 'src/quote.js' }],
  })

  assert.equal(grounding.available, true)
  assert.equal(grounding.rate, 50)
  assert.deepEqual(grounding.unknownFiles, ['src/missing.js'])
  assert.deepEqual(grounding.unknownSymbols, ['missingExport'])
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
  const audited = { ...lane, status: 'airborne', scopeAudit: auditScope(lane, ['src/clear.js']) }
  assert.equal(reservation.status, 'airborne')
  assert.throws(() => assertHandoffAllowed({ ...lane, status: 'airborne' }, []), /Audit the actual changed files/)
  assert.doesNotThrow(() => assertHandoffAllowed(audited, []))
  assert.throws(() => assertHandoffAllowed({ ...lane, status: 'holding' }, []), /Only an airborne lane/)
  assert.throws(() => reserveLaneState({ ...lane, status: 'handoff' }, []), /Only a queued lane/)
})

test('audits actual changed files against the declared file boundary', () => {
  const lane = createLane({
    id: 'tax', agent: 'Sol', task: 'Adjust tax', status: 'airborne',
    files: ['src/tax/adjustments.js'], symbols: ['calculateTaxAdjustment'], contracts: ['tax-adjustment'],
  })
  const conformant = auditScope(lane, ['.\\src\\tax\\adjustments.js'], { source: 'git worktree' })
  const drifted = auditScope(lane, ['src/tax/adjustments.js', 'src/quote.js'], { source: 'git worktree' })

  assert.equal(conformant.passed, true)
  assert.deepEqual(conformant.inScopeFiles, ['src/tax/adjustments.js'])
  assert.equal(drifted.passed, false)
  assert.deepEqual(drifted.unexpectedFiles, ['src/quote.js'])
  assert.throws(() => assertScopeAudit({ ...lane, scopeAudit: drifted }), /src\/quote\.js/)
})

test('invalidates a scope audit when the declared file boundary changes', () => {
  const lane = createLane({ id: 'copy', agent: 'Ada', task: 'Edit copy', status: 'airborne', files: ['src/copy.js'] })
  const scopeAudit = auditScope(lane, ['src/copy.js'])

  assert.throws(
    () => assertScopeAudit({ ...lane, files: ['src/copy.js', 'src/other.js'], scopeAudit }),
    /Declared files changed after the last scope audit/,
  )
})

test('requires a declared file boundary for a handoff audit', () => {
  const lane = createLane({ id: 'symbol-only', agent: 'Theo', task: 'Review symbol', status: 'airborne', symbols: ['quoteTotal'] })
  const scopeAudit = auditScope(lane, [])

  assert.equal(scopeAudit.passed, false)
  assert.throws(() => assertScopeAudit({ ...lane, scopeAudit }), /Declare at least one file/)
})

test('makes a handoff receipt from declared scope and evidence', () => {
  const lane = createLane({
    id: 'ui', agent: 'Mira', task: 'Protect checkout',
    files: ['src/checkout/CheckoutForm.jsx'], symbols: ['CheckoutForm'], contracts: ['submit-order'],
    evidence: [{ command: 'node --test', result: 'passing' }],
  })
  lane.scopeAudit = auditScope(lane, ['src/checkout/CheckoutForm.jsx'], { source: 'git worktree' })
  const receipt = buildHandoff(lane, [])

  assert.equal(receipt.owner, 'Mira')
  assert.deepEqual(receipt.scope.symbols, ['CheckoutForm'])
  assert.equal(receipt.evidence[0].result, 'passing')
  assert.equal(receipt.scopeAudit.passed, true)
  assert.equal(receipt.knownRisk.length, 0)
})

test('excludes completed handoffs from active-lane clearance metrics', () => {
  const active = createLane({ id: 'active', agent: 'Mira', task: 'Active work', files: ['src/active.js'] })
  const completed = createLane({ id: 'done', agent: 'Theo', task: 'Finished work', status: 'handoff', files: ['src/done.js'] })
  const metrics = runwayMetrics({ lanes: [active, completed] })

  assert.equal(metrics.lanes, 1)
  assert.equal(metrics.totalLanes, 2)
  assert.equal(metrics.confidence, 100)
})

test('scans the bundled fixture for JavaScript and JSX exports', () => {
  const scan = scanWorkspace(fileURLToPath(new URL('../fixtures/parcel-ops', import.meta.url)))
  const symbols = scan.exports.map((entry) => entry.symbol)

  assert.ok(symbols.includes('quoteTotal'))
  assert.ok(symbols.includes('CheckoutForm'))
  assert.ok(symbols.includes('DeliveryNote'))
  assert.ok(symbols.includes('calculateTaxAdjustment'))
})
