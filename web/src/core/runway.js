const LIVE_STATUSES = new Set(['queued', 'holding', 'airborne', 'blocked'])

const severityForScore = (score) => {
  if (score >= 85) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

const normalize = (value) => String(value ?? '').trim().toLowerCase()

const cleanList = (values = []) => [...new Set(values.map(normalize).filter(Boolean))]

const overlap = (left = [], right = []) => {
  const rightSet = new Set(cleanList(right))
  return cleanList(left).filter((item) => rightSet.has(item))
}

const sharedArea = (left = [], right = []) => {
  const topLevel = (file) => normalize(file).split('/').slice(0, 2).join('/')
  return overlap(left.map(topLevel), right.map(topLevel))
}

const establishedOwner = (left, right) => {
  const leftAirborne = left.status === 'airborne'
  const rightAirborne = right.status === 'airborne'
  if (leftAirborne && !rightAirborne) return left.id
  if (rightAirborne && !leftAirborne) return right.id
  if (!leftAirborne || !rightAirborne) return null

  const leftStarted = Date.parse(left.createdAt || '')
  const rightStarted = Date.parse(right.createdAt || '')
  if (Number.isFinite(leftStarted) && Number.isFinite(rightStarted) && leftStarted !== rightStarted) {
    return leftStarted < rightStarted ? left.id : right.id
  }
  return [left.id, right.id].sort()[0]
}

export function inspectPair(left, right) {
  const sharedFiles = overlap(left.files, right.files)
  const sharedSymbols = overlap(left.symbols, right.symbols)
  const sharedContracts = overlap(left.contracts, right.contracts)
  const sharedAreas = sharedArea(left.files, right.files)

  let score = 0
  const evidence = []

  if (sharedFiles.length) {
    score += 55 + Math.min(sharedFiles.length * 5, 15)
    evidence.push({ kind: 'shared file', values: sharedFiles, weight: 'direct' })
  }
  if (sharedSymbols.length) {
    score += 40 + Math.min(sharedSymbols.length * 10, 20)
    evidence.push({ kind: 'shared symbol', values: sharedSymbols, weight: 'semantic' })
  }
  if (sharedContracts.length) {
    score += 35 + Math.min(sharedContracts.length * 8, 16)
    evidence.push({ kind: 'shared contract', values: sharedContracts, weight: 'behavioral' })
  }
  if (!sharedFiles.length && sharedAreas.length) {
    score += 18
    evidence.push({ kind: 'shared module area', values: sharedAreas, weight: 'proximity' })
  }

  score = Math.min(score, 100)
  return {
    id: [left.id, right.id].sort().join('::'),
    laneIds: [left.id, right.id],
    score,
    severity: severityForScore(score),
    evidence,
    ownerLaneId: establishedOwner(left, right),
    hasConflict: score >= 30,
  }
}

export function deriveConflicts(lanes = []) {
  const active = lanes.filter((lane) => LIVE_STATUSES.has(lane.status))
  const conflicts = []

  for (let first = 0; first < active.length; first += 1) {
    for (let second = first + 1; second < active.length; second += 1) {
      const collision = inspectPair(active[first], active[second])
      if (collision.hasConflict) conflicts.push(collision)
    }
  }

  return conflicts.sort((a, b) => b.score - a.score)
}

export function conflictsForLane(laneId, conflicts = []) {
  return conflicts.filter((conflict) => conflict.laneIds.includes(laneId))
}

export function laneClearance(lane, conflicts = []) {
  const own = conflictsForLane(lane.id, conflicts)
  const mostSevere = own[0]
  if (!mostSevere) return { state: 'clear', label: 'Cleared for work', conflict: null }
  if (mostSevere.ownerLaneId === lane.id) {
    return { state: 'protected', label: 'Protected owner', conflict: mostSevere }
  }
  if (mostSevere.severity === 'critical' || mostSevere.severity === 'high') {
    return { state: 'hold', label: 'Hold for reroute', conflict: mostSevere }
  }
  return { state: 'caution', label: 'Proceed with caution', conflict: mostSevere }
}

export function runwayMetrics(state) {
  const lanes = state?.lanes ?? []
  const conflicts = deriveConflicts(lanes)
  const clear = lanes.filter((lane) => laneClearance(lane, conflicts).state === 'clear').length
  const protectedOwners = lanes.filter((lane) => laneClearance(lane, conflicts).state === 'protected').length
  const holding = lanes.filter((lane) => laneClearance(lane, conflicts).state === 'hold').length
  const evidenceCount = lanes.reduce((total, lane) => total + (lane.evidence?.length ?? 0), 0)

  return {
    lanes: lanes.length,
    clear,
    protected: protectedOwners,
    ready: clear + protectedOwners,
    holding,
    conflicts: conflicts.length,
    evidenceCount,
    confidence: lanes.length ? Math.round((clear / lanes.length) * 100) : 100,
  }
}

export function createLane(input = {}) {
  const now = new Date().toISOString()
  return {
    id: input.id || `lane-${Math.random().toString(36).slice(2, 8)}`,
    agent: input.agent || 'Unassigned agent',
    task: input.task || 'Untitled work lane',
    status: input.status || 'queued',
    files: cleanList(input.files),
    symbols: cleanList(input.symbols),
    contracts: cleanList(input.contracts),
    evidence: input.evidence ?? [],
    note: input.note || '',
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
}

export function buildHandoff(lane, conflicts = []) {
  const clearance = laneClearance(lane, conflicts)
  return {
    lane: lane.id,
    owner: lane.agent,
    task: lane.task,
    scope: {
      files: lane.files,
      symbols: lane.symbols,
      contracts: lane.contracts,
    },
    evidence: lane.evidence ?? [],
    knownRisk: clearance.conflict
      ? clearance.conflict.evidence.map((item) => `${item.kind}: ${item.values.join(', ')}`)
      : [],
    nextSafeAction: clearance.state === 'hold'
      ? 'Reroute this lane before modifying the shared behavior.'
      : 'Review the attached evidence, then continue from the declared scope.',
    generatedAt: new Date().toISOString(),
  }
}

export function formatList(value = '') {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
