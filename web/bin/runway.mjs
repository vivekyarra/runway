#!/usr/bin/env node
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import {
  assertDeclaredScope,
  assertHandoffAllowed,
  assertRerouteAllowed,
  auditScope,
  buildHandoff,
  createLane,
  deriveConflicts,
  formatList,
  laneClearance,
  reserveLaneState,
  runwayMetrics,
  scopeGrounding,
} from '../src/core/runway.js'
import { buildCollisionReplay, changedSymbolsFromPatch } from '../src/core/replay.js'
import { createDemoState } from '../src/demo/demoState.js'

const STATE_DIR = '.runway'
const STATE_FILE = 'state.json'
const STATE_LOCK_FILE = 'state.lock'
const STATE_LOCK_TIMEOUT_MS = 5000
const STATE_LOCK_STALE_MS = 30000
const STATE_LOCK_RETRY_MS = 25
const STATE_LOCK_MAX_RETRY_MS = 200
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
    if (next !== undefined && !next.startsWith('--')) {
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

function lockPath(root) {
  return path.join(root, STATE_DIR, STATE_LOCK_FILE)
}

function now() {
  return new Date().toISOString()
}

function pause(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function readLockMetadata(target) {
  try {
    return JSON.parse(readFileSync(target, 'utf8'))
  } catch {
    return null
  }
}

function pidIsLive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

function staleLockCanBeReclaimed(target, metadata) {
  try {
    return Date.now() - statSync(target).mtimeMs > STATE_LOCK_STALE_MS && !pidIsLive(metadata?.pid)
  } catch {
    return false
  }
}

async function acquireStateLock(root) {
  const directory = path.dirname(statePath(root))
  const target = lockPath(root)
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const deadline = Date.now() + STATE_LOCK_TIMEOUT_MS
  let retryMs = STATE_LOCK_RETRY_MS

  mkdirSync(directory, { recursive: true })

  while (true) {
    let descriptor
    try {
      descriptor = openSync(target, 'wx')
      writeFileSync(descriptor, `${JSON.stringify({ pid: process.pid, createdAt: now(), token })}\n`, 'utf8')
      closeSync(descriptor)
      descriptor = undefined

      return () => {
        const current = readLockMetadata(target)
        if (current?.token === token) {
          try {
            unlinkSync(target)
          } catch (error) {
            if (error?.code !== 'ENOENT') throw error
          }
        }
      }
    } catch (error) {
      if (descriptor !== undefined) closeSync(descriptor)
      const lockExists = error?.code === 'EEXIST' || error?.code === 'EPERM'
      if (!lockExists) throw error

      const metadata = readLockMetadata(target)
      if (staleLockCanBeReclaimed(target, metadata)) {
        try {
          unlinkSync(target)
        } catch (unlinkError) {
          if (unlinkError?.code !== 'ENOENT') throw unlinkError
        }
        continue
      }

      if (Date.now() >= deadline) {
        throw new Error('Runway state is busy. Another local agent is updating it; retry shortly.')
      }
      await pause(retryMs)
      retryMs = Math.min(retryMs * 2, STATE_LOCK_MAX_RETRY_MS)
    }
  }
}

async function withStateLock(root, mutate) {
  const release = await acquireStateLock(root)
  try {
    return await mutate()
  } finally {
    release()
  }
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
  const target = statePath(root)
  const temporary = path.join(directory, `.${STATE_FILE}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}.tmp`)
  mkdirSync(directory, { recursive: true })
  try {
    writeFileSync(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
    renameSync(temporary, target)
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary)
  }
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

function optionalListOption(options, key) {
  if (!Object.hasOwn(options, key)) return undefined
  if (options[key] === true) throw new Error(`Missing value for --${key}`)
  return formatList(options[key])
}

function resolveRoot(options) {
  return path.resolve(options.root && options.root !== true ? options.root : process.cwd())
}

function gitPaths(root, args) {
  const output = execFileSync('git', ['-C', root, '-c', 'core.quotepath=false', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  return output.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
}

function gitText(root, args) {
  return execFileSync('git', ['-C', root, '-c', 'core.quotepath=false', ...args], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function parseGitRange(value, option) {
  const range = requireOption({ [option]: value }, option)
  const parts = range.split('..')
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`--${option} must use the form <base>..<head>.`)
  }
  return { range, baseRef: parts[0], headRef: parts[1] }
}

function resolveCommit(root, reference) {
  try {
    return gitText(root, ['rev-parse', '--verify', '--end-of-options', `${reference}^{commit}`]).trim()
  } catch {
    throw new Error(`Cannot resolve Git commit: ${reference}`)
  }
}

function replayChange(root, rangeOption, label, task) {
  const parsed = parseGitRange(rangeOption.value, rangeOption.name)
  const baseSha = resolveCommit(root, parsed.baseRef)
  const headSha = resolveCommit(root, parsed.headRef)
  const resolvedRange = `${baseSha}..${headSha}`
  const changedFiles = gitPaths(root, ['diff', '--name-only', '--relative', '--no-renames', resolvedRange, '--'])
    .map((item) => item.replace(/\\/g, '/'))
  const sourceFiles = changedFiles.filter((file) => SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()))
  const patch = sourceFiles.length
    ? gitText(root, ['diff', '--unified=0', '--no-ext-diff', '--no-renames', resolvedRange, '--', ...sourceFiles])
    : ''

  return {
    label,
    task,
    range: parsed.range,
    baseRef: parsed.baseRef,
    headRef: parsed.headRef,
    baseSha,
    headSha,
    changedFiles,
    changedSymbols: changedSymbolsFromPatch(patch),
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function changedGitFiles(root) {
  try {
    gitPaths(root, ['rev-parse', '--is-inside-work-tree'])
    const paths = [
      ...gitPaths(root, ['diff', '--name-only', '--relative', '--no-renames', '--', '.']),
      ...gitPaths(root, ['diff', '--cached', '--name-only', '--relative', '--no-renames', '--', '.']),
      ...gitPaths(root, ['ls-files', '--others', '--exclude-standard', '--', '.']),
    ]
    return [...new Set(paths
      .map((item) => item.replace(/\\/g, '/'))
      .filter((item) => item && item !== '.runway' && !item.startsWith('.runway/')))]
      .sort((left, right) => left.localeCompare(right))
  } catch {
    throw new Error('Scope audit requires a Git worktree.')
  }
}

function commandHelp() {
  process.stdout.write(`
Runway - local air traffic control for coding agents

Usage:
  node bin/runway.mjs init --root <repo> [--demo]
  node bin/runway.mjs scan --root <repo> [--write]
  node bin/runway.mjs status --root <repo>
  node bin/runway.mjs replay --root <repo> --left <base>..<head> --right <base>..<head> [--left-label <text>] [--right-label <text>] [--source-url <url>] [--out <file>]
  node bin/runway.mjs lane create --root <repo> --id <lane> --agent <owner> --task <text> [--files a,b] [--symbols a,b] [--contracts a,b]
  node bin/runway.mjs lane reserve --root <repo> --id <lane>
  node bin/runway.mjs lane reroute --root <repo> --id <lane> [--files a,b] [--symbols a,b] [--contracts a,b]
  node bin/runway.mjs lane audit --root <repo> --id <lane>
  node bin/runway.mjs lane handoff --root <repo> --id <lane> --evidence <command> [--result passing] [--note <text>]

  Runway is intentionally advisory: clearance compares declared lane scope, and audit checks the current Git changed-file set before handoff. It does not prevent writes, infer intent, or guarantee a conflict-free merge.
`)
}

function commandReplay(options) {
  const root = resolveRoot(options)
  try {
    gitPaths(root, ['rev-parse', '--is-inside-work-tree'])
  } catch {
    throw new Error('Collision replay requires a Git repository.')
  }

  const left = replayChange(
    root,
    { name: 'left', value: options.left },
    options['left-label'] && options['left-label'] !== true ? options['left-label'] : 'Earlier lane',
    options['left-task'] && options['left-task'] !== true ? options['left-task'] : undefined,
  )
  const right = replayChange(
    root,
    { name: 'right', value: options.right },
    options['right-label'] && options['right-label'] !== true ? options['right-label'] : 'Later lane',
    options['right-task'] && options['right-task'] !== true ? options['right-task'] : undefined,
  )
  let remote = null
  try {
    remote = gitText(root, ['config', '--get', 'remote.origin.url']).trim() || null
  } catch {
    remote = null
  }
  const replay = buildCollisionReplay({
    source: {
      repository: options['source-url'] && options['source-url'] !== true ? options['source-url'] : remote,
    },
    left,
    right,
  })
  replay.artifactSha256 = sha256(JSON.stringify(replay))

  if (options.out) {
    const output = path.resolve(requireOption(options, 'out'))
    mkdirSync(path.dirname(output), { recursive: true })
    writeFileSync(output, `${JSON.stringify(replay, null, 2)}\n`, 'utf8')
    replay.output = output
  }
  print(replay)
}

async function commandInit(options) {
  const root = resolveRoot(options)
  return withStateLock(root, () => {
    const state = options.demo ? createDemoState() : emptyState(root)
    state.repo = { ...state.repo, root, name: path.basename(root) }
    addActivity(state, 'init', 'control', options.demo ? 'Initialized a bundled Runway demonstration.' : 'Initialized Runway control state.')
    saveState(root, state)
    print({ ok: true, state: statePath(root), lanes: state.lanes.length })
  })
}

async function commandScan(options) {
  const root = resolveRoot(options)
  const scan = scanWorkspace(root)
  if (options.write) {
    return withStateLock(root, () => {
      const state = loadState(root)
      state.repo = { ...state.repo, root, lastScan: scan.scannedAt }
      state.scan = scan
      addActivity(state, 'scan', 'control', `Scanned ${scan.files.length} JavaScript/TypeScript files.`)
      saveState(root, state)
      print({ ...scan, persisted: true, state: statePath(root) })
    })
  }
  print({ ...scan, persisted: false })
}

function commandStatus(options) {
  const root = resolveRoot(options)
  const state = loadState(root)
  const conflicts = deriveConflicts(state.lanes, state.scan)
  print({
    repo: state.repo,
    metrics: runwayMetrics(state),
    lanes: state.lanes.map((lane) => ({
      id: lane.id,
      agent: lane.agent,
      status: lane.status,
      clearance: laneClearance(lane, conflicts),
      grounding: scopeGrounding(lane, state.scan),
      scopeAudit: lane.scopeAudit ?? null,
    })),
    conflicts,
    state: statePath(root),
  })
}

async function commandLane(action, options) {
  const root = resolveRoot(options)
  return withStateLock(root, () => {
    const state = loadState(root)

    if (action === 'create') {
      const lane = createLane({
        id: requireOption(options, 'id'),
        agent: requireOption(options, 'agent'),
        task: requireOption(options, 'task'),
        files: optionalListOption(options, 'files') ?? [],
        symbols: optionalListOption(options, 'symbols') ?? [],
        contracts: optionalListOption(options, 'contracts') ?? [],
      })
      if (state.lanes.some((existing) => existing.id === lane.id)) throw new Error(`Lane already exists: ${lane.id}`)
      state.lanes.push(lane)
      addActivity(state, 'reserve', lane.id, `${lane.agent} declared ${lane.id}.`)
      saveState(root, state)
      const conflicts = deriveConflicts(state.lanes, state.scan)
      print({ ok: true, lane, clearance: laneClearance(lane, conflicts), grounding: scopeGrounding(lane, state.scan), conflicts: conflicts.filter((item) => item.laneIds.includes(lane.id)) })
      return
    }

    const laneId = requireOption(options, 'id')
    const lane = state.lanes.find((item) => item.id === laneId)
    if (!lane) throw new Error(`Unknown lane: ${laneId}`)
    const conflicts = deriveConflicts(state.lanes, state.scan)

    if (action === 'reserve') {
      const reservation = reserveLaneState(lane, conflicts)
      lane.status = reservation.status
      lane.scopeAudit = null
      lane.updatedAt = now()
      addActivity(state, lane.status === 'holding' ? 'hold' : 'launch', lane.id, `${lane.agent} ${lane.status === 'holding' ? 'was held for a collision' : 'received clearance'}.`)
      saveState(root, state)
      print({ ok: true, lane, clearance: reservation.clearance })
      return
    }

    if (action === 'reroute') {
      assertRerouteAllowed(lane)
      const files = optionalListOption(options, 'files')
      const symbols = optionalListOption(options, 'symbols')
      const contracts = optionalListOption(options, 'contracts')
      if (files !== undefined) lane.files = files
      if (symbols !== undefined) lane.symbols = symbols
      if (contracts !== undefined) lane.contracts = contracts
      assertDeclaredScope(lane)
      lane.status = 'queued'
      lane.scopeAudit = null
      lane.updatedAt = now()
      addActivity(state, 'reroute', lane.id, `${lane.agent} declared a new scope.`)
      saveState(root, state)
      const nextConflicts = deriveConflicts(state.lanes, state.scan)
      print({ ok: true, lane, clearance: laneClearance(lane, nextConflicts), grounding: scopeGrounding(lane, state.scan), conflicts: nextConflicts.filter((item) => item.laneIds.includes(lane.id)) })
      return
    }

    if (action === 'audit') {
      if (lane.status !== 'airborne') {
        throw new Error(`Only an airborne lane can audit changed files; ${lane.id} is ${lane.status}.`)
      }
      const changedFiles = changedGitFiles(root)
      lane.scopeAudit = auditScope(lane, changedFiles, {
        source: 'git worktree',
        auditedAt: now(),
      })
      lane.updatedAt = now()
      addActivity(
        state,
        lane.scopeAudit.passed ? 'audit' : 'hold',
        lane.id,
        lane.scopeAudit.passed
          ? `${lane.agent} proved the changed files stayed inside the declared lane.`
          : `${lane.agent} exposed changed-file drift outside the declared lane.`,
      )
      saveState(root, state)
      print({ ok: lane.scopeAudit.passed, lane: lane.id, audit: lane.scopeAudit, state: statePath(root) })
      return
    }

    if (action === 'handoff') {
      assertHandoffAllowed(lane, conflicts)
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
  })
}

export async function main(args = process.argv.slice(2)) {
  const { options, positionals } = parseArgs(args)
  const [command, action] = positionals
  if (!command || command === 'help' || options.help) return commandHelp()
  if (command === 'init') return commandInit(options)
  if (command === 'scan') return commandScan(options)
  if (command === 'status') return commandStatus(options)
  if (command === 'replay') return commandReplay(options)
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
