const LIVE_STATUSES = new Set(['queued', 'holding', 'airborne', 'blocked'])

const severityForScore = (score) => {
  if (score >= 85) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

const normalizeText = (value) => String(value ?? '').trim().toLowerCase()
const normalizeSymbol = (value) => String(value ?? '').trim()

const SOURCE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']

export function normalizeFile(value) {
  const segments = []
  for (const segment of String(value ?? '').trim().replace(/\\/g, '/').split('/')) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      if (segments.length && segments[segments.length - 1] !== '..') segments.pop()
      else segments.push(segment)
      continue
    }
    segments.push(segment)
  }
  return segments.join('/')
}

const cleanList = (values = [], normalizer = normalizeText) => {
  const seen = new Set()
  const list = Array.isArray(values) ? values : []
  return list
    .map(normalizer)
    .filter((item) => {
      if (!item || seen.has(item)) return false
      seen.add(item)
      return true
    })
}

const overlap = (left = [], right = [], normalizer = normalizeText) => {
  const rightSet = new Set(cleanList(right, normalizer))
  return cleanList(left, normalizer).filter((item) => rightSet.has(item))
}

const sharedArea = (left = [], right = []) => {
  const moduleArea = (file) => normalizeFile(file).split('/').slice(0, 2).join('/')
  return overlap(left.map(moduleArea), right.map(moduleArea), normalizeFile)
}

const dirname = (file) => {
  const segments = normalizeFile(file).split('/')
  segments.pop()
  return segments.join('/')
}

const resolveScannedImport = (fromFile, specifier, knownFiles) => {
  if (!String(specifier ?? '').startsWith('.')) return null
  const base = normalizeFile(`${dirname(fromFile)}/${specifier}`)
  const candidates = [base, ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`)]
  candidates.push(...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`))
  return candidates.find((candidate) => knownFiles.has(candidate)) ?? null
}

export function buildDependencyEdges(scan = {}) {
  const files = Array.isArray(scan?.files) ? scan.files : []
  const knownFiles = new Set(files.map((entry) => normalizeFile(entry.file)).filter(Boolean))
  const edges = []
  const seen = new Set()

  for (const entry of files) {
    const from = normalizeFile(entry.file)
    for (const specifier of entry.imports ?? []) {
      const to = resolveScannedImport(from, specifier, knownFiles)
      if (!to) continue
      const id = `${from}->${to}`
      if (seen.has(id)) continue
      seen.add(id)
      edges.push({ from, to })
    }
  }

  return edges.sort((left, right) => `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`))
}

const dependencyOverlap = (left = [], right = [], scan = {}) => {
  const leftFiles = new Set(cleanList(left, normalizeFile))
  const rightFiles = new Set(cleanList(right, normalizeFile))
  return buildDependencyEdges(scan)
    .filter((edge) => (
      (leftFiles.has(edge.from) && rightFiles.has(edge.to))
      || (rightFiles.has(edge.from) && leftFiles.has(edge.to))
    ))
    .map((edge) => `${edge.from} -> ${edge.to}`)
}

export function scopeGrounding(lane = {}, scan = {}) {
  const scannedFiles = Array.isArray(scan?.files) ? scan.files : []
  if (!scannedFiles.length) {
    return { available: false, declared: 0, grounded: 0, rate: null, unknownFiles: [], unknownSymbols: [] }
  }

  const knownFiles = new Set(scannedFiles.map((entry) => normalizeFile(entry.file)).filter(Boolean))
  const knownSymbols = new Set((scan.exports ?? []).map((entry) => normalizeSymbol(entry.symbol)).filter(Boolean))
  const files = cleanList(lane.files, normalizeFile)
  const symbols = cleanList(lane.symbols, normalizeSymbol)
  const unknownFiles = files.filter((file) => !knownFiles.has(file))
  const unknownSymbols = symbols.filter((symbol) => !knownSymbols.has(symbol))
  const declared = files.length + symbols.length
  const grounded = declared - unknownFiles.length - unknownSymbols.length

  return {
    available: true,
    declared,
    grounded,
    rate: declared ? Math.round((grounded / declared) * 100) : 100,
    unknownFiles,
    unknownSymbols,
  }
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

export function hasDeclaredScope(lane = {}) {
  return Boolean(
    cleanList(lane.files, normalizeFile).length
    || cleanList(lane.symbols, normalizeSymbol).length
    || cleanList(lane.contracts, normalizeText).length,
  )
}

export function assertDeclaredScope(lane = {}) {
  if (!hasDeclaredScope(lane)) {
    throw new Error('Declare at least one file, exported symbol, or behavioral contract.')
  }
}

export function inspectPair(left, right, scan = {}) {
  const sharedFiles = overlap(left.files, right.files, normalizeFile)
  const sharedSymbols = overlap(left.symbols, right.symbols, normalizeSymbol)
  const sharedContracts = overlap(left.contracts, right.contracts, normalizeText)
  const sharedAreas = sharedArea(left.files, right.files)
  const sharedDependencies = dependencyOverlap(left.files, right.files, scan)

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
  if (!sharedFiles.length && sharedDependencies.length) {
    score += 26
    evidence.push({ kind: 'dependency edge', values: sharedDependencies, weight: 'repository' })
  }

  score = Math.min(score, 100)
  return {
    id: [left.id, right.id].sort().join('::'),
    laneIds: [left.id, right.id],
    score,
    severity: severityForScore(score),
    evidence,
    ownerLaneId: establishedOwner(left, right),
    hasConflict: score > 0,
  }
}

export function deriveConflicts(lanes = [], scan = {}) {
  const active = lanes.filter((lane) => LIVE_STATUSES.has(lane.status))
  const conflicts = []

  for (let first = 0; first < active.length; first += 1) {
    for (let second = first + 1; second < active.length; second += 1) {
      const collision = inspectPair(active[first], active[second], scan)
      if (collision.hasConflict) conflicts.push(collision)
    }
  }

  return conflicts.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

export function conflictsForLane(laneId, conflicts = []) {
  return conflicts.filter((conflict) => conflict.laneIds.includes(laneId))
}

export function laneClearance(lane, conflicts = []) {
  if (!hasDeclaredScope(lane)) return { state: 'blocked', label: 'Declare scope first', conflict: null }

  const own = conflictsForLane(lane.id, conflicts)
  if (!own.length) return { state: 'clear', label: 'Cleared for work', conflict: null }

  const blocking = own.find((conflict) => (
    conflict.ownerLaneId !== lane.id
    && (conflict.severity === 'critical' || conflict.severity === 'high')
  ))
  if (blocking) return { state: 'hold', label: 'Hold for reroute', conflict: blocking }

  const caution = own.find((conflict) => conflict.ownerLaneId !== lane.id)
  if (caution) return { state: 'caution', label: 'Proceed with caution', conflict: caution }

  return { state: 'protected', label: 'Protected owner', conflict: own[0] }
}

export function reserveLaneState(lane, conflicts = []) {
  assertDeclaredScope(lane)
  if (lane.status !== 'queued') {
    throw new Error(`Only a queued lane can be reserved; ${lane.id} is ${lane.status}.`)
  }

  const clearance = laneClearance(lane, conflicts)
  if (clearance.state === 'blocked') throw new Error('Declare scope before reserving this lane.')
  return {
    status: clearance.state === 'hold' ? 'holding' : 'airborne',
    clearance,
  }
}

export function assertRerouteAllowed(lane) {
  if (lane.status === 'handoff') {
    throw new Error(`A handed-off lane cannot be rerouted; open a new lane for follow-up work.`)
  }
}

export function auditScope(lane = {}, changedFiles = [], metadata = {}) {
  const declaredFiles = cleanList(lane.files, normalizeFile)
  const observedFiles = cleanList(changedFiles, normalizeFile)
  const declared = new Set(declaredFiles)
  const inScopeFiles = observedFiles.filter((file) => declared.has(file))
  const unexpectedFiles = observedFiles.filter((file) => !declared.has(file))
  const passed = declaredFiles.length > 0 && unexpectedFiles.length === 0

  return {
    passed,
    state: passed ? 'conformant' : 'drifted',
    source: metadata.source || 'recorded changed-file set',
    declaredFiles,
    changedFiles: observedFiles,
    inScopeFiles,
    unexpectedFiles,
    auditedAt: metadata.auditedAt || new Date().toISOString(),
  }
}

function sameFileSet(left = [], right = []) {
  const leftFiles = cleanList(left, normalizeFile).sort()
  const rightFiles = cleanList(right, normalizeFile).sort()
  return leftFiles.length === rightFiles.length && leftFiles.every((file, index) => file === rightFiles[index])
}

export function assertScopeAudit(lane = {}) {
  const audit = lane.scopeAudit
  if (!audit) {
    throw new Error('Audit the actual changed files before creating a handoff.')
  }
  if (!sameFileSet(lane.files, audit.declaredFiles)) {
    throw new Error('Declared files changed after the last scope audit; audit the lane again.')
  }
  if (!audit.declaredFiles?.length) {
    throw new Error('Declare at least one file to create a changed-file handoff receipt.')
  }
  if (!audit.passed) {
    const unexpected = audit.unexpectedFiles?.length ? ` Unexpected files: ${audit.unexpectedFiles.join(', ')}.` : ''
    throw new Error(`Changed files drifted outside the declared lane.${unexpected}`)
  }
  return audit
}

export function assertHandoffAllowed(lane, conflicts = []) {
  assertDeclaredScope(lane)
  if (lane.status !== 'airborne') {
    throw new Error(`Only an airborne lane can create a handoff; ${lane.id} is ${lane.status}.`)
  }

  const clearance = laneClearance(lane, conflicts)
  if (clearance.state === 'hold' || clearance.state === 'blocked') {
    throw new Error('Resolve the hold before creating a handoff.')
  }
  assertScopeAudit(lane)
  return clearance
}

export function rerouteScope(lane, conflicts = []) {
  const directEvidence = conflictsForLane(lane.id, conflicts)
    .flatMap((conflict) => conflict.evidence)
    .filter((item) => item.kind === 'shared file' || item.kind === 'shared symbol' || item.kind === 'shared contract')

  const sharedFiles = new Set(directEvidence.filter((item) => item.kind === 'shared file').flatMap((item) => item.values.map(normalizeFile)))
  const sharedSymbols = new Set(directEvidence.filter((item) => item.kind === 'shared symbol').flatMap((item) => item.values.map(normalizeSymbol)))
  const sharedContracts = new Set(directEvidence.filter((item) => item.kind === 'shared contract').flatMap((item) => item.values.map(normalizeText)))

  return {
    ...lane,
    files: lane.files.filter((file) => !sharedFiles.has(normalizeFile(file))),
    symbols: lane.symbols.filter((symbol) => !sharedSymbols.has(normalizeSymbol(symbol))),
    contracts: lane.contracts.filter((contract) => !sharedContracts.has(normalizeText(contract))),
    scopeAudit: null,
  }
}

export function runwayMetrics(state) {
  const allLanes = state?.lanes ?? []
  const lanes = allLanes.filter((lane) => LIVE_STATUSES.has(lane.status))
  const conflicts = deriveConflicts(lanes, state?.scan)
  const clearances = lanes.map((lane) => laneClearance(lane, conflicts))
  const clear = clearances.filter((clearance) => clearance.state === 'clear').length
  const protectedOwners = clearances.filter((clearance) => clearance.state === 'protected').length
  const caution = clearances.filter((clearance) => clearance.state === 'caution').length
  const holding = clearances.filter((clearance) => clearance.state === 'hold').length
  const evidenceCount = allLanes.reduce((total, lane) => total + (lane.evidence?.length ?? 0), 0)
  const ready = clear + protectedOwners + caution
  const groundings = allLanes.map((lane) => scopeGrounding(lane, state?.scan)).filter((grounding) => grounding.available)
  const declaredScope = groundings.reduce((total, grounding) => total + grounding.declared, 0)
  const groundedScope = groundings.reduce((total, grounding) => total + grounding.grounded, 0)
  const exactOverlapCount = conflicts.reduce((total, conflict) => total + conflict.evidence.filter((item) => (
    item.kind === 'shared file' || item.kind === 'shared symbol' || item.kind === 'shared contract'
  )).reduce((count, item) => count + item.values.length, 0), 0)

  return {
    lanes: lanes.length,
    totalLanes: allLanes.length,
    clear,
    protected: protectedOwners,
    caution,
    ready,
    holding,
    conflicts: conflicts.length,
    evidenceCount,
    exactOverlapCount,
    groundedRate: declaredScope ? Math.round((groundedScope / declaredScope) * 100) : null,
    confidence: lanes.length ? Math.round((ready / lanes.length) * 100) : 100,
  }
}

export function createLane(input = {}) {
  const now = new Date().toISOString()
  const lane = {
    id: String(input.id || `lane-${Math.random().toString(36).slice(2, 8)}`).trim(),
    agent: input.agent || 'Unassigned agent',
    task: input.task || 'Untitled work lane',
    status: input.status || 'queued',
    files: cleanList(input.files, normalizeFile),
    symbols: cleanList(input.symbols, normalizeSymbol),
    contracts: cleanList(input.contracts, normalizeText),
    evidence: input.evidence ?? [],
    changedFiles: cleanList(input.changedFiles, normalizeFile),
    scopeAudit: input.scopeAudit ?? null,
    note: input.note || '',
    createdAt: input.createdAt || now,
    updatedAt: now,
  }
  assertDeclaredScope(lane)
  return lane
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
    scopeAudit: lane.scopeAudit ?? null,
    knownRisk: clearance.conflict
      ? clearance.conflict.evidence.map((item) => `${item.kind}: ${item.values.join(', ')}`)
      : [],
    nextSafeAction: clearance.state === 'hold'
      ? 'Reroute this lane before modifying the shared behavior.'
      : clearance.state === 'blocked'
        ? 'Declare a bounded scope before continuing.'
        : 'Review the attached evidence, then continue from the declared scope.',
    generatedAt: new Date().toISOString(),
  }
}

export function formatList(value = '') {
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
