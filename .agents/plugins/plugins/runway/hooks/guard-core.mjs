import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const PATCH_FILE_LINE = /^\*\*\* (?:Add|Update|Delete) File:\s*(.+?)\s*$/
const PATCH_MOVE_LINE = /^\*\*\* Move to:\s*(.+?)\s*$/

export function normalizeFile(value) {
  return String(value ?? '').trim().replace(/\\/g, '/').replace(/^\.\//, '')
}

export function extractPatchPaths(command = '') {
  const paths = []
  for (const line of String(command).split(/\r?\n/)) {
    const target = line.match(PATCH_FILE_LINE)?.[1] ?? line.match(PATCH_MOVE_LINE)?.[1]
    if (target) paths.push(target)
  }
  return [...new Set(paths)]
}

export function findRunwayRoot(cwd) {
  let current = path.resolve(cwd || '.')
  while (true) {
    if (existsSync(path.join(current, '.runway', 'state.json'))) return current
    const parent = path.dirname(current)
    if (parent === current) return null
    current = parent
  }
}

function deny(reason, details = {}) {
  return { allowed: false, reason, ...details }
}

function targetFromPatch(root, cwd, target) {
  const absolute = path.isAbsolute(target) ? path.resolve(target) : path.resolve(cwd, target)
  const relative = path.relative(root, absolute)
  if (!relative || relative === '.') return null
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return null
  return normalizeFile(relative)
}

export function evaluatePatchGuard(input = {}, environment = process.env) {
  if (input.hook_event_name !== 'PreToolUse' || input.tool_name !== 'apply_patch') {
    return { allowed: true, reason: 'not a guarded patch call' }
  }

  const cwd = path.resolve(input.cwd || '.')
  const root = findRunwayRoot(cwd)
  if (!root) return { allowed: true, reason: 'repository has no Runway state' }

  const laneId = String(environment.RUNWAY_LANE ?? '').trim()
  if (!laneId) {
    return deny('Runway blocked this patch: set RUNWAY_LANE to a reserved lane before editing.', { root })
  }

  let state
  try {
    state = JSON.parse(readFileSync(path.join(root, '.runway', 'state.json'), 'utf8'))
  } catch {
    return deny('Runway blocked this patch: .runway/state.json is unreadable or invalid.', { root, laneId })
  }

  const lane = (state.lanes ?? []).find((candidate) => candidate.id === laneId)
  if (!lane) return deny(`Runway blocked this patch: unknown lane ${laneId}.`, { root, laneId })
  if (lane.status !== 'airborne') {
    return deny(`Runway blocked this patch: lane ${laneId} is ${lane.status}, not airborne.`, { root, laneId })
  }

  const command = input.tool_input?.command ?? input.tool_input?.patch ?? ''
  const rawTargets = extractPatchPaths(command)
  if (!rawTargets.length) {
    return deny('Runway blocked this patch: no inspectable apply_patch target was found.', { root, laneId })
  }

  const targetFiles = rawTargets.map((target) => targetFromPatch(root, cwd, target))
  if (targetFiles.some((target) => !target)) {
    return deny('Runway blocked this patch: a target resolves outside the Runway repository.', { root, laneId, rawTargets })
  }

  const declaredFiles = new Set((lane.files ?? []).map(normalizeFile).filter(Boolean))
  const unexpectedFiles = targetFiles.filter((target) => !declaredFiles.has(target))
  if (unexpectedFiles.length) {
    return deny(
      `Runway blocked this patch: ${unexpectedFiles.join(', ')} is outside lane ${laneId}. Reroute and reserve truthful scope first.`,
      { root, laneId, targetFiles, unexpectedFiles },
    )
  }

  return { allowed: true, reason: `patch stays inside airborne lane ${laneId}`, root, laneId, targetFiles }
}

export function hookResponse(decision) {
  if (decision.allowed) return null
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: decision.reason,
    },
  }
}
