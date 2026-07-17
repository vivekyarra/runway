import assert from 'node:assert/strict'
import { existsSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'

const testsRoot = path.join(process.cwd(), 'tests')

function makeRoot() {
  const root = path.join(testsRoot, `.tmp-runway-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  mkdirSync(root, { recursive: true })
  return root
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

test('CLI creates lanes, holds overlap, and persists an airborne handoff', () => {
  const root = makeRoot()
  try {
    run(root, 'init', '--root', root)
    run(root, 'lane', 'create', '--root', root, '--id', 'pricing', '--agent', 'Theo', '--task', 'Change quote', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    const pricing = run(root, 'lane', 'reserve', '--root', root, '--id', 'pricing')
    run(root, 'lane', 'create', '--root', root, '--id', 'tax', '--agent', 'Sol', '--task', 'Apply tax', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    const reserve = run(root, 'lane', 'reserve', '--root', root, '--id', 'tax')

    assert.equal(pricing.lane.status, 'airborne')
    assert.equal(reserve.lane.status, 'holding')
    assert.equal(reserve.clearance.state, 'hold')

    const handoff = run(root, 'lane', 'handoff', '--root', root, '--id', 'pricing', '--evidence', 'node --test', '--result', 'passing')
    assert.equal(handoff.ok, true)
    assert.equal(handoff.handoff.evidence[0].command, 'node --test')
  } finally {
    removeRoot(root)
  }
})

test('CLI rejects unscoped lanes and invalid transitions without mutating state', () => {
  const root = makeRoot()
  try {
    run(root, 'init', '--root', root)
    assert.throws(
      () => run(root, 'lane', 'create', '--root', root, '--id', 'empty', '--agent', 'Mira', '--task', 'No scope'),
      /Declare at least one file, exported symbol, or behavioral contract/,
    )

    run(root, 'lane', 'create', '--root', root, '--id', 'clear', '--agent', 'Mira', '--task', 'Clear scope', '--files', 'src/clear.js')
    assert.throws(
      () => run(root, 'lane', 'handoff', '--root', root, '--id', 'clear', '--evidence', 'node --test'),
      /Only an airborne lane can create a handoff/,
    )
    const beforeReserve = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
    assert.equal(beforeReserve.lanes[0].status, 'queued')

    run(root, 'lane', 'reserve', '--root', root, '--id', 'clear')
    run(root, 'lane', 'handoff', '--root', root, '--id', 'clear', '--evidence', 'node --test')
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
