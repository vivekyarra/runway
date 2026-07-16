import assert from 'node:assert/strict'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'

const root = path.join(process.cwd(), 'tests', `.tmp-runway-${process.pid}`)

function run(...args) {
  return JSON.parse(execFileSync(process.execPath, ['bin/runway.mjs', ...args], { cwd: process.cwd(), encoding: 'utf8' }))
}

test('CLI creates lanes, detects a collision, and persists a handoff', () => {
  if (existsSync(root)) rmSync(root, { recursive: true, force: true })
  mkdirSync(root, { recursive: true })

  try {
    run('init', '--root', root)
    run('lane', 'create', '--root', root, '--id', 'pricing', '--agent', 'Theo', '--task', 'Change quote', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    run('lane', 'create', '--root', root, '--id', 'tax', '--agent', 'Sol', '--task', 'Apply tax', '--files', 'src/quote.js', '--symbols', 'quoteTotal', '--contracts', 'pricing')
    const reserve = run('lane', 'reserve', '--root', root, '--id', 'tax')

    assert.equal(reserve.lane.status, 'holding')
    assert.equal(reserve.clearance.state, 'hold')

    const handoff = run('lane', 'handoff', '--root', root, '--id', 'pricing', '--evidence', 'node --test', '--result', 'passing')
    assert.equal(handoff.ok, true)
    assert.equal(handoff.handoff.evidence[0].command, 'node --test')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
