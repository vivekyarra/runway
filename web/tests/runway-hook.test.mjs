import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { evaluatePatchGuard, extractPatchPaths, hookResponse } from '../../.agents/plugins/plugins/runway/hooks/guard-core.mjs'

const testDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(testDirectory, '..', '..')
const pluginRoot = path.join(repositoryRoot, '.agents', 'plugins', 'plugins', 'runway')
const hookScript = path.join(pluginRoot, 'hooks', 'pre_tool_use_guard.mjs')
const pluginCli = path.join(pluginRoot, 'bin', 'runway.mjs')

function makeRoot(lane = null) {
  const root = mkdtempSync(path.join(tmpdir(), 'runway-hook-'))
  mkdirSync(path.join(root, '.runway'), { recursive: true })
  mkdirSync(path.join(root, 'src', 'tax'), { recursive: true })
  const state = { version: 1, lanes: lane ? [lane] : [] }
  writeFileSync(path.join(root, '.runway', 'state.json'), `${JSON.stringify(state, null, 2)}\n`)
  return root
}

function patchInput(root, command, cwd = root) {
  return {
    hook_event_name: 'PreToolUse',
    tool_name: 'apply_patch',
    cwd,
    tool_input: { command },
  }
}

function patchFor(...files) {
  return ['*** Begin Patch', ...files.flatMap((file) => [
    `*** Update File: ${file}`,
    '@@',
    '-old',
    '+new',
  ]), '*** End Patch'].join('\n')
}

test('extracts add, update, delete, and move targets from an apply_patch payload', () => {
  const patch = [
    '*** Begin Patch',
    '*** Add File: src/a.js',
    '*** Update File: src/b.js',
    '*** Move to: src/c.js',
    '*** Delete File: src/d.js',
    '*** End Patch',
  ].join('\n')
  assert.deepEqual(extractPatchPaths(patch), ['src/a.js', 'src/b.js', 'src/c.js', 'src/d.js'])
})

test('stays inert outside a Runway-enabled repository', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'runway-no-state-'))
  try {
    const decision = evaluatePatchGuard(patchInput(root, patchFor('src/a.js')), {})
    assert.equal(decision.allowed, true)
    assert.match(decision.reason, /no Runway state/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('fails closed when the lane binding is missing, unknown, or not airborne', () => {
  const root = makeRoot({ id: 'tax', status: 'queued', files: ['src/tax/adjustments.js'] })
  try {
    const input = patchInput(root, patchFor('src/tax/adjustments.js'))
    assert.match(evaluatePatchGuard(input, {}).reason, /set RUNWAY_LANE/)
    assert.match(evaluatePatchGuard(input, { RUNWAY_LANE: 'missing' }).reason, /unknown lane/)
    assert.match(evaluatePatchGuard(input, { RUNWAY_LANE: 'tax' }).reason, /not airborne/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('allows only declared files for the bound airborne lane from a nested cwd', () => {
  const root = makeRoot({ id: 'tax', status: 'airborne', files: ['src/tax/adjustments.js'] })
  try {
    const nested = path.join(root, 'src')
    const allowed = evaluatePatchGuard(patchInput(root, patchFor('tax\\adjustments.js'), nested), { RUNWAY_LANE: 'tax' })
    assert.equal(allowed.allowed, true)
    assert.deepEqual(allowed.targetFiles, ['src/tax/adjustments.js'])

    const blocked = evaluatePatchGuard(patchInput(root, patchFor('tax/adjustments.js', 'quote.js'), nested), { RUNWAY_LANE: 'tax' })
    assert.equal(blocked.allowed, false)
    assert.deepEqual(blocked.unexpectedFiles, ['src/quote.js'])
    assert.match(hookResponse(blocked).hookSpecificOutput.permissionDecisionReason, /outside lane tax/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('blocks uninspectable patches and targets outside the repository', () => {
  const root = makeRoot({ id: 'tax', status: 'airborne', files: ['src/tax/adjustments.js'] })
  try {
    assert.match(evaluatePatchGuard(patchInput(root, 'not a patch'), { RUNWAY_LANE: 'tax' }).reason, /no inspectable/)
    const outside = evaluatePatchGuard(patchInput(root, patchFor('../outside.js')), { RUNWAY_LANE: 'tax' })
    assert.equal(outside.allowed, false)
    assert.match(outside.reason, /outside the Runway repository/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('hook executable emits the supported Codex deny response', () => {
  const root = makeRoot({ id: 'tax', status: 'airborne', files: ['src/tax/adjustments.js'] })
  try {
    const result = spawnSync(process.execPath, [hookScript], {
      input: JSON.stringify(patchInput(root, patchFor('src/quote.js'))),
      encoding: 'utf8',
      env: { ...process.env, RUNWAY_LANE: 'tax' },
    })
    assert.equal(result.status, 0)
    const output = JSON.parse(result.stdout)
    assert.equal(output.hookSpecificOutput.hookEventName, 'PreToolUse')
    assert.equal(output.hookSpecificOutput.permissionDecision, 'deny')
    assert.match(output.hookSpecificOutput.permissionDecisionReason, /src\/quote\.js is outside lane tax/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('installed plugin contains an exact standalone copy of the verified CLI core', () => {
  const pairs = [
    ['web/bin/runway.mjs', '.agents/plugins/plugins/runway/bin/runway.mjs'],
    ['web/src/core/runway.js', '.agents/plugins/plugins/runway/src/core/runway.js'],
    ['web/src/core/replay.js', '.agents/plugins/plugins/runway/src/core/replay.js'],
    ['web/src/demo/demoState.js', '.agents/plugins/plugins/runway/src/demo/demoState.js'],
    ['web/skills/runway/SKILL.md', '.agents/plugins/plugins/runway/skills/runway/SKILL.md'],
  ]
  for (const [source, bundled] of pairs) {
    assert.equal(readFileSync(path.join(repositoryRoot, bundled), 'utf8'), readFileSync(path.join(repositoryRoot, source), 'utf8'), bundled)
  }
})

test('repository marketplace, plugin manifest, and hook configuration stay installable', () => {
  const marketplace = JSON.parse(readFileSync(path.join(repositoryRoot, '.agents', 'plugins', 'marketplace.json'), 'utf8'))
  const manifest = JSON.parse(readFileSync(path.join(pluginRoot, '.codex-plugin', 'plugin.json'), 'utf8'))
  const hooks = JSON.parse(readFileSync(path.join(pluginRoot, 'hooks', 'hooks.json'), 'utf8'))
  assert.equal(marketplace.name, 'runway-marketplace')
  assert.equal(marketplace.plugins[0].name, 'runway')
  assert.equal(marketplace.plugins[0].source.path, './plugins/runway')
  assert.equal(manifest.name, 'runway')
  assert.equal(manifest.skills, './skills/')
  assert.equal(manifest.license, 'MIT')
  assert.equal(hooks.hooks.PreToolUse[0].matcher, '^(apply_patch|Edit|Write)$')
  assert.match(hooks.hooks.PreToolUse[0].hooks[0].command, /PLUGIN_ROOT/)
  assert.match(hooks.hooks.PreToolUse[0].hooks[0].commandWindows, /PLUGIN_ROOT/)
})

test('bundled plugin CLI initializes, declares, and reserves a lane without the web project', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'runway-plugin-cli-'))
  try {
    execFileSync(process.execPath, [pluginCli, 'init', '--root', root])
    execFileSync(process.execPath, [pluginCli, 'lane', 'create', '--root', root, '--id', 'tax', '--agent', 'Codex', '--task', 'Tax', '--files', 'src/tax.js'])
    const reserve = JSON.parse(execFileSync(process.execPath, [pluginCli, 'lane', 'reserve', '--root', root, '--id', 'tax'], { encoding: 'utf8' }))
    assert.equal(reserve.lane.status, 'airborne')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
