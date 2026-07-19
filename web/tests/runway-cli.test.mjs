import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'

const testsRoot = path.join(process.cwd(), 'tests')

function makeRoot() {
  const root = path.join(testsRoot, `.tmp-runway-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(root, { recursive: true })
  return root
}

function initGit(root) {
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'runway@example.test'], { cwd: root })
  execFileSync('git', ['config', 'user.name', 'Runway Test'], { cwd: root })
  execFileSync('git', ['config', 'core.autocrlf', 'false'], { cwd: root })
}

function removeRoot(root) {
  if (!root.startsWith(`${testsRoot}${path.sep}`)) throw new Error(`Refusing to remove unexpected test root: ${root}`)
  rmSync(root, { recursive: true, force: true })
}

function run(_root, ...args) {
  return JSON.parse(execFileSync(process.execPath, ['bin/runway.mjs', ...args], { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))
}

function runAsync(_root, ...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['bin/runway.mjs', ...args], { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        try {
          resolve(JSON.parse(stdout))
        } catch (error) {
          reject(error)
        }
        return
      }
      reject(new Error(stderr || `Runway CLI exited ${code}`))
    })
  })
}

function runFailure(_root, ...args) {
  const result = spawnSync(process.execPath, ['bin/runway.mjs', ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  assert.notEqual(result.status, 0)
  return {
    output: result.stdout ? JSON.parse(result.stdout) : null,
    stderr: result.stderr,
  }
}

test('CLI creates lanes, holds overlap, and persists an airborne handoff', () => {
  const root = makeRoot()
  try {
    initGit(root)
    run(root, 'init', '--root', root)
    run(root, 'lane', 'create', '--root', root, '--id', 'pricing', '--agent', 'Theo', '--task', 'Change quote', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    const pricing = run(root, 'lane', 'reserve', '--root', root, '--id', 'pricing')
    run(root, 'lane', 'create', '--root', root, '--id', 'tax', '--agent', 'Sol', '--task', 'Apply tax', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    const reserve = run(root, 'lane', 'reserve', '--root', root, '--id', 'tax')

    assert.equal(pricing.lane.status, 'airborne')
    assert.equal(reserve.lane.status, 'holding')
    assert.equal(reserve.clearance.state, 'hold')

    const handoff = run(root, 'lane', 'verify', '--root', root, '--id', 'pricing', '--command', 'node -e "console.log(\'pricing verified\')"')
    assert.equal(handoff.ok, true)
    assert.equal(handoff.audit.passed, true)
    assert.equal(handoff.handoff.evidence[0].source, 'runway-executed')
    assert.equal(handoff.handoff.evidence[0].result, 'passing')
  } finally {
    removeRoot(root)
  }
})

test('CLI rejects unscoped lanes and invalid transitions without mutating state', () => {
  const root = makeRoot()
  try {
    initGit(root)
    run(root, 'init', '--root', root)
    assert.throws(
      () => run(root, 'lane', 'create', '--root', root, '--id', 'empty', '--agent', 'Mira', '--task', 'No scope'),
      /Declare at least one file, exported symbol, or behavioral contract/,
    )

    run(root, 'lane', 'create', '--root', root, '--id', 'clear', '--agent', 'Mira', '--task', 'Clear scope', '--files', 'src/clear.js')
    assert.throws(
      () => run(root, 'lane', 'verify', '--root', root, '--id', 'clear', '--command', 'node -e "process.exit(0)"'),
      /Only an airborne lane can run verified handoff evidence/,
    )
    const beforeReserve = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
    assert.equal(beforeReserve.lanes[0].status, 'queued')

    run(root, 'lane', 'reserve', '--root', root, '--id', 'clear')
    assert.throws(
      () => run(root, 'lane', 'handoff', '--root', root, '--id', 'clear', '--evidence', 'node --test'),
      /Manual CLI handoff evidence is disabled/,
    )
    run(root, 'lane', 'verify', '--root', root, '--id', 'clear', '--command', 'node -e "process.exit(0)"')
    assert.throws(
      () => run(root, 'lane', 'reserve', '--root', root, '--id', 'clear'),
      /Only a queued lane can be reserved/,
    )
  } finally {
    removeRoot(root)
  }
})

test('CLI accepts an empty reroute value without crashing and keeps remaining scope', () => {
  const root = makeRoot()
  try {
    run(root, 'init', '--root', root)
    run(root, 'lane', 'create', '--root', root, '--id', 'tax', '--agent', 'Sol', '--task', 'Apply tax', '--files', 'src/tax.js', '--symbols', 'calculateTax', '--contracts', 'tax')
    const reroute = run(root, 'lane', 'reroute', '--root', root, '--id', 'tax', '--contracts', '')

    assert.deepEqual(reroute.lane.contracts, [])
    assert.deepEqual(reroute.lane.files, ['src/tax.js'])
    assert.equal(reroute.lane.status, 'queued')
  } finally {
    removeRoot(root)
  }
})

test('CLI audits the real Git worktree and blocks drift before handoff', () => {
  const root = makeRoot()
  try {
    mkdirSync(path.join(root, 'src'), { recursive: true })
    writeFileSync(path.join(root, 'src', 'owned.js'), 'export const owned = 0\n')
    writeFileSync(path.join(root, 'src', 'drift.js'), 'export const drift = 0\n')
    initGit(root)
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-m', 'fixture baseline'], { cwd: root, stdio: 'ignore' })

    run(root, 'init', '--root', root)
    run(root, 'lane', 'create', '--root', root, '--id', 'owned', '--agent', 'Mira', '--task', 'Change owned file', '--files', 'src/owned.js')
    run(root, 'lane', 'reserve', '--root', root, '--id', 'owned')
    writeFileSync(path.join(root, 'src', 'owned.js'), 'export const owned = 1\n')
    writeFileSync(path.join(root, 'src', 'drift.js'), 'export const drift = 1\n')

    const failed = run(root, 'lane', 'audit', '--root', root, '--id', 'owned')
    assert.equal(failed.ok, false)
    assert.equal(failed.audit.source, 'git worktree')
    assert.deepEqual(failed.audit.unexpectedFiles, ['src/drift.js'])
    const driftedVerification = runFailure(root, 'lane', 'verify', '--root', root, '--id', 'owned', '--command', 'node -e "process.exit(0)"')
    assert.equal(driftedVerification.output.ok, false)
    assert.deepEqual(driftedVerification.output.audit.unexpectedFiles, ['src/drift.js'])

    writeFileSync(path.join(root, 'src', 'drift.js'), 'export const drift = 0\n')
    const passed = run(root, 'lane', 'audit', '--root', root, '--id', 'owned')
    assert.equal(passed.ok, true)
    assert.deepEqual(passed.audit.changedFiles, ['src/owned.js'])
    const handoff = run(root, 'lane', 'verify', '--root', root, '--id', 'owned', '--command', 'node -e "console.log(\'scope verified\')"')
    assert.equal(handoff.handoff.scopeAudit.passed, true)
    assert.equal(handoff.handoff.evidence.at(-1).source, 'runway-executed')
  } finally {
    removeRoot(root)
  }
})

test('CLI persists scan grounding and returns dependency-based clearance evidence', () => {
  const root = makeRoot()
  try {
    mkdirSync(path.join(root, 'src', 'checkout'), { recursive: true })
    writeFileSync(path.join(root, 'src', 'quote.js'), 'export function quoteTotal() { return 42 }\n')
    writeFileSync(
      path.join(root, 'src', 'checkout', 'CheckoutForm.jsx'),
      "import { quoteTotal } from '../quote.js'\nexport function CheckoutForm() { return quoteTotal() }\n",
    )

    run(root, 'init', '--root', root)
    const scan = run(root, 'scan', '--root', root, '--write')
    assert.equal(scan.persisted, true)

    run(root, 'lane', 'create', '--root', root, '--id', 'pricing', '--agent', 'Theo', '--task', 'Change quote', '--files', 'src/quote.js', '--symbols', 'quoteTotal')
    run(root, 'lane', 'reserve', '--root', root, '--id', 'pricing')
    const checkout = run(root, 'lane', 'create', '--root', root, '--id', 'checkout', '--agent', 'Mira', '--task', 'Change checkout', '--files', 'src/checkout/CheckoutForm.jsx', '--symbols', 'CheckoutForm')

    assert.equal(checkout.grounding.rate, 100)
    assert.equal(checkout.clearance.state, 'caution')
    assert.deepEqual(checkout.conflicts[0].evidence, [{
      kind: 'dependency edge',
      values: ['src/checkout/CheckoutForm.jsx -> src/quote.js'],
      weight: 'repository',
    }])
  } finally {
    removeRoot(root)
  }
})

test('CLI executes evidence, preserves a failed attempt, and hands off only after a passing command', () => {
  const root = makeRoot()
  try {
    mkdirSync(path.join(root, 'src'), { recursive: true })
    writeFileSync(path.join(root, 'src', 'owned.js'), 'export const owned = 0\n')
    initGit(root)
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-m', 'baseline'], { cwd: root, stdio: 'ignore' })
    run(root, 'init', '--root', root)
    run(root, 'lane', 'create', '--root', root, '--id', 'owned', '--agent', 'Mira', '--task', 'Change owned file', '--files', 'src/owned.js')
    run(root, 'lane', 'reserve', '--root', root, '--id', 'owned')
    writeFileSync(path.join(root, 'src', 'owned.js'), 'export const owned = 1\n')

    const failed = runFailure(root, 'lane', 'verify', '--root', root, '--id', 'owned', '--command', 'node -e "console.error(\'expected failure\'); process.exit(7)"')
    assert.equal(failed.output.ok, false)
    assert.equal(failed.output.verification.source, 'runway-executed')
    assert.equal(failed.output.verification.exitCode, 7)
    assert.equal(failed.output.verification.result, 'failing')
    assert.equal(failed.output.audit.passed, true)
    let state = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
    assert.equal(state.lanes[0].status, 'airborne')
    assert.equal(state.lanes[0].evidence[0].result, 'failing')

    const passed = run(root, 'lane', 'verify', '--root', root, '--id', 'owned', '--command', 'node -e "console.log(\'verified output\')"')
    assert.equal(passed.ok, true)
    assert.equal(passed.verification.exitCode, 0)
    assert.equal(passed.verification.stdout.bytes > 0, true)
    assert.match(passed.verification.stdout.sha256, /^[a-f0-9]{64}$/)
    assert.equal(passed.audit.source, 'git worktree after runway-executed command')
    state = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
    assert.equal(state.lanes[0].status, 'handoff')
    assert.equal(state.lanes[0].evidence.length, 2)
  } finally {
    removeRoot(root)
  }
})

test('CLI reconstructs a provenance-backed collision from two Git ranges', () => {
  const root = makeRoot()
  try {
    mkdirSync(path.join(root, 'src'), { recursive: true })
    writeFileSync(path.join(root, 'src', 'quote.js'), 'export function quoteTotal() { return 1 }\n')
    initGit(root)
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-m', 'base'], { cwd: root, stdio: 'ignore' })
    const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

    execFileSync('git', ['checkout', '-b', 'left'], { cwd: root, stdio: 'ignore' })
    writeFileSync(path.join(root, 'src', 'quote.js'), 'export function quoteTotal() { return 2 }\nexport function leftOnly() { return true }\n')
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-m', 'left change'], { cwd: root, stdio: 'ignore' })
    const left = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()

    execFileSync('git', ['checkout', '-b', 'right', base], { cwd: root, stdio: 'ignore' })
    writeFileSync(path.join(root, 'src', 'quote.js'), 'export function quoteTotal() { return 3 }\nexport function rightOnly() { return true }\n')
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['commit', '-m', 'right change'], { cwd: root, stdio: 'ignore' })
    const right = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
    const output = path.join(root, 'collision-replay.json')

    const replay = run(
      root,
      'replay', '--root', root,
      '--left', `${base}..${left}`, '--left-label', 'PR alpha',
      '--left-url', 'https://example.test/repo/pull/1', '--left-created-at', '2026-01-01T00:00:00Z',
      '--right', `${base}..${right}`, '--right-label', 'PR beta',
      '--right-url', 'https://example.test/repo/pull/2', '--right-created-at', '2026-01-02T00:00:00Z',
      '--source-url', 'https://example.test/repo', '--source-license', 'MIT',
      '--out', output,
    )

    assert.equal(replay.kind, 'runway-collision-replay')
    assert.equal(replay.mode, 'counterfactual')
    assert.equal(replay.verdict.state, 'would-hold')
    assert.equal(replay.verdict.ownerLane, 'PR alpha')
    assert.deepEqual(replay.evidence.find((item) => item.kind === 'shared file').values, ['src/quote.js'])
    assert.deepEqual(replay.evidence.find((item) => item.kind === 'shared symbol').values, ['quoteTotal'])
    assert.equal(replay.lanes[0].baseSha, base)
    assert.equal(replay.lanes[0].url, 'https://example.test/repo/pull/1')
    assert.equal(replay.lanes[1].createdAt, '2026-01-02T00:00:00Z')
    assert.equal(replay.lanes[1].headSha, right)
    assert.equal(replay.source.license, 'MIT')
    assert.match(replay.artifactSha256, /^[a-f0-9]{64}$/)
    assert.equal(existsSync(output), true)
    const receipt = run(root, 'replay', 'verify', '--file', output)
    assert.equal(receipt.ok, true)

    const tampered = JSON.parse(readFileSync(output, 'utf8'))
    tampered.verdict.state = 'clear'
    writeFileSync(output, `${JSON.stringify(tampered, null, 2)}\n`)
    const rejected = runFailure(root, 'replay', 'verify', '--file', output)
    assert.equal(rejected.output.ok, false)
    assert.notEqual(rejected.output.expectedSha256, rejected.output.computedSha256)
  } finally {
    removeRoot(root)
  }
})

test('CLI collision replay rejects malformed and unresolved Git ranges', () => {
  const root = makeRoot()
  try {
    initGit(root)
    assert.throws(
      () => run(root, 'replay', '--root', root, '--left', 'main', '--right', 'main..other'),
      /--left must use the form <base>..<head>/,
    )
    assert.throws(
      () => run(root, 'replay', '--root', root, '--left', 'missing..other', '--right', 'main..other'),
      /Cannot resolve Git commit: missing/,
    )
  } finally {
    removeRoot(root)
  }
})

test('CLI serializes concurrent lane creation and leaves valid complete state', async () => {
  const root = makeRoot()
  try {
    run(root, 'init', '--root', root)
    const operations = Array.from({ length: 12 }, (_, index) => runAsync(
      root,
      'lane', 'create', '--root', root,
      '--id', `lane-${index}`,
      '--agent', `Agent ${index}`,
      '--task', `Task ${index}`,
      '--files', `src/${index}.js`,
    ))
    const results = await Promise.all(operations)
    const state = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))

    assert.equal(results.length, 12)
    assert.equal(state.lanes.length, 12)
    assert.deepEqual(new Set(state.lanes.map((lane) => lane.id)).size, 12)
    assert.equal(existsSync(path.join(root, '.runway', 'state.lock')), false)
  } finally {
    removeRoot(root)
  }
})

test('CLI permits exactly one concurrent duplicate lane and recovers a dead stale lock', async () => {
  const root = makeRoot()
  try {
    run(root, 'init', '--root', root)
    const duplicate = await Promise.allSettled([
      runAsync(root, 'lane', 'create', '--root', root, '--id', 'same', '--agent', 'Alpha', '--task', 'First', '--files', 'src/a.js'),
      runAsync(root, 'lane', 'create', '--root', root, '--id', 'same', '--agent', 'Beta', '--task', 'Second', '--files', 'src/b.js'),
    ])
    assert.equal(duplicate.filter((result) => result.status === 'fulfilled').length, 1)
    assert.equal(duplicate.filter((result) => result.status === 'rejected').length, 1)

    const lock = path.join(root, '.runway', 'state.lock')
    writeFileSync(lock, JSON.stringify({ pid: 999999999, createdAt: '2000-01-01T00:00:00.000Z', token: 'dead-lock' }))
    const old = new Date(Date.now() - 60000)
    utimesSync(lock, old, old)
    const recovered = run(root, 'lane', 'create', '--root', root, '--id', 'after-stale', '--agent', 'Mira', '--task', 'Recovered', '--files', 'src/recovered.js')

    assert.equal(recovered.ok, true)
    assert.equal(existsSync(lock), false)
    const state = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
    assert.deepEqual(state.lanes.map((lane) => lane.id).sort(), ['after-stale', 'same'])
  } finally {
    removeRoot(root)
  }
})
