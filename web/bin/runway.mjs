#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import {
  buildHandoff,
  createLane,
  deriveConflicts,
  formatList,
  laneClearance,
  runwayMetrics,
} from '../src/core/runway.js'
import { createDemoState } from '../src/demo/demoState.js'

const STATE_DIR = '.runway'
const STATE_FILE = 'state.json'
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'])
const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist', 'coverage', '.runway'])

function parseArgs(args) {
  const options = {}
  const positionals = []

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]
    if (!value.startsWith('--')) {
      positionals.push(value)
      continue
    }
    const key = value.slice(2)
    const next = args[index + 1]
    if (next && !next.startsWith('--')) {
      options[key] = next
      index += 1
    } else {
      options[key] = true
    }
  }

  return { options, positionals }
}

function statePath(root) {
  return path.join(root, STATE_DIR, STATE_FILE)
}

function now() {
  return new Date().toISOString()
}

function emptyState(root) {
  return {
    version: 1,
    repo: {
      name: path.basename(root),
      root,
      branch: 'unknown',
      language: 'JavaScript / TypeScript',
      lastScan: 'not run',
    },
    lanes: [],
    activity: [],
  }
}

export function loadState(root) {
  const target = statePath(root)
  if (!existsSync(target)) return emptyState(root)
  return JSON.parse(readFileSync(target, 'utf8'))
}

export function saveState(root, state) {
  const directory = path.dirname(statePath(root))
  mkdirSync(directory, { recursive: true })
  writeFileSync(statePath(root), `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}

function addActivity(state, type, lane, text) {
  state.activity = [{ time: now(), type, lane, text }, ...(state.activity ?? [])].slice(0, 30)
}

function walk(root, records = []) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name)) walk(path.join(root, entry.name), records)
      continue
    }
    const absolute = path.join(root, entry.name)
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) records.push(absolute)
  }
  return records
}

function matchAll(source, expression) {
  return [...source.matchAll(expression)].map((match) => match[1]).filter(Boolean)
}

function unique(values) {
  return [...new Set(values)]
}

export function scanWorkspace(root) {
  const files = walk(root)
  const results = files.map((absolute) => {
    const source = readFileSync(absolute, 'utf8')
    const namedExports = matchAll(source, /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)
    const exportLists = matchAll(source, /export\s*{([^}]+)}/g)
      .flatMap((list) => list.split(',').map((item) => item.trim().split(/\s+as\s+/i).at(-1)))
      .filter((item) => /^[A-Za-z_$][\w$]*$/.test(item))
    const imports = matchAll(source, /(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g)
    const routes = matchAll(source, /(?:app|router)\.(?:get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi)
    return {
      file: path.relative(root, absolute).split(path.sep).join('/'),
      symbols: unique([...namedExports, ...exportLists]),
      imports: unique(imports),
      routes: unique(routes),
    }
  })

  return {
    root,
    scannedAt: now(),
    files: results,
    exports: results.flatMap((file) => file.symbols.map((symbol) => ({ symbol, file: file.file }))),
  }
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function requireOption(options, key) {
  if (!options[key] || options[key] === true) throw new Error(`Missing --${key}`)
  return options[key]
}

function resolveRoot(options) {
  return path.resolve(options.root && options.root !== true ? options.root : process.cwd())
}

function commandHelp() {
  process.stdout.write(`
Runway - local air traffic control for coding agents

Usage:
  node bin/runway.mjs init --root <repo> [--demo]
  node bin/runway.mjs scan --root <repo>
  node bin/runway.mjs status --root <repo>
  node bin/runway.mjs lane create --root <repo> --id <lane> --agent <owner> --task <text> [--files a,b] [--symbols a,b] [--contracts a,b]
  node bin/runway.mjs lane reserve --root <repo> --id <lane>
  node bin/runway.mjs lane reroute --root <repo> --id <lane> [--files a,b] [--symbols a,b] [--contracts a,b]
  node bin/runway.mjs lane handoff --root <repo> --id <lane> --evidence <command> [--result passing] [--note <text>]

Runway is intentionally heuristic: it reports declared and scanned overlap; it does not guarantee a conflict-free merge.
`)
}

function commandInit(options) {
  const root = resolveRoot(options)
  const state = options.demo ? createDemoState() : emptyState(root)
  state.repo = { ...state.repo, root, name: path.basename(root) }
  addActivity(state, 'init', 'control', options.demo ? 'Initialized a bundled Runway demonstration.' : 'Initialized Runway control state.')
  saveState(root, state)
  print({ ok: true, state: statePath(root), lanes: state.lanes.length })
}

function commandScan(options) {
  const root = resolveRoot(options)
  const scan = scanWorkspace(root)
  if (options.write) {
    const state = loadState(root)
    state.repo = { ...state.repo, root, lastScan: scan.scannedAt }
    state.scan = scan
    addActivity(state, 'scan', 'control', `Scanned ${scan.files.length} JavaScript/TypeScript files.`)
    saveState(root, state)
  }
  print(scan)
}

function commandStatus(options) {
  const root = resolveRoot(options)
  const state = loadState(root)
  const conflicts = deriveConflicts(state.lanes)
  print({
    repo: state.repo,
    metrics: runwayMetrics(state),
    lanes: state.lanes.map((lane) => ({
      id: lane.id,
      agent: lane.agent,
      status: lane.status,
      clearance: laneClearance(lane, conflicts),
    })),
    conflicts,
    state: statePath(root),
  })
}

function commandLane(action, options) {
  const root = resolveRoot(options)
  const state = loadState(root)

  if (action === 'create') {
    const lane = createLane({
      id: requireOption(options, 'id'),
      agent: requireOption(options, 'agent'),
      task: requireOption(options, 'task'),
      files: formatList(options.files || ''),
      symbols: formatList(options.symbols || ''),
      contracts: formatList(options.contracts || ''),
    })
    if (state.lanes.some((existing) => existing.id === lane.id)) throw new Error(`Lane already exists: ${lane.id}`)
    state.lanes.push(lane)
    addActivity(state, 'reserve', lane.id, `${lane.agent} declared ${lane.id}.`)
    saveState(root, state)
    const conflicts = deriveConflicts(state.lanes)
    print({ ok: true, lane, clearance: laneClearance(lane, conflicts), conflicts: conflicts.filter((item) => item.laneIds.includes(lane.id)) })
    return
  }

  const laneId = requireOption(options, 'id')
  const lane = state.lanes.find((item) => item.id === laneId)
  if (!lane) throw new Error(`Unknown lane: ${laneId}`)
  const conflicts = deriveConflicts(state.lanes)

  if (action === 'reserve') {
    const clearance = laneClearance(lane, conflicts)
    lane.status = clearance.state === 'hold' ? 'holding' : 'airborne'
    lane.updatedAt = now()
    addActivity(state, lane.status === 'holding' ? 'hold' : 'launch', lane.id, `${lane.agent} ${lane.status === 'holding' ? 'was held for a collision' : 'received clearance'}.`)
    saveState(root, state)
    print({ ok: true, lane, clearance })
    return
  }

  if (action === 'reroute') {
    if (options.files) lane.files = formatList(options.files)
    if (options.symbols) lane.symbols = formatList(options.symbols)
    if (options.contracts) lane.contracts = formatList(options.contracts)
    lane.status = 'queued'
    lane.updatedAt = now()
    addActivity(state, 'reroute', lane.id, `${lane.agent} declared a new scope.`)
    saveState(root, state)
    const nextConflicts = deriveConflicts(state.lanes)
    print({ ok: true, lane, clearance: laneClearance(lane, nextConflicts), conflicts: nextConflicts.filter((item) => item.laneIds.includes(lane.id)) })
    return
  }

  if (action === 'handoff') {
    lane.evidence = [...(lane.evidence ?? []), {
      command: requireOption(options, 'evidence'),
      result: options.result || 'recorded',
      at: now(),
    }]
    if (options.note && options.note !== true) lane.note = options.note
    lane.status = 'handoff'
    lane.updatedAt = now()
    lane.handoff = buildHandoff(lane, conflicts)
    addActivity(state, 'evidence', lane.id, `${lane.agent} created a handoff with evidence.`)
    saveState(root, state)
    print({ ok: true, handoff: lane.handoff, state: statePath(root) })
    return
  }

  throw new Error(`Unknown lane action: ${action}`)
}

export async function main(args = process.argv.slice(2)) {
  const { options, positionals } = parseArgs(args)
  const [command, action] = positionals
  if (!command || command === 'help' || options.help) return commandHelp()
  if (command === 'init') return commandInit(options)
  if (command === 'scan') return commandScan(options)
  if (command === 'status') return commandStatus(options)
  if (command === 'lane') return commandLane(action, options)
  throw new Error(`Unknown command: ${command}`)
}

const entrypoint = fileURLToPath(import.meta.url)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(entrypoint)) {
  main().catch((error) => {
    process.stderr.write(`Runway error: ${error.message}\n`)
    process.exitCode = 1
  })
}
