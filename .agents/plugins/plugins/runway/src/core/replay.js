import { createLane, inspectPair } from './runway.js'

const CONTROL_WORDS = new Set(['catch', 'for', 'if', 'switch', 'while', 'with'])

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function symbolsFromLine(line = '') {
  const source = String(line).trim()
  const symbols = []
  const patterns = [
    /^(?:export\s+(?:default\s+)?)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
    /^(?:export\s+(?:default\s+)?)?class\s+([A-Za-z_$][\w$]*)/,
    /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/,
    /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*{/,
  ]

  for (const expression of patterns) {
    const symbol = source.match(expression)?.[1]
    if (symbol && !CONTROL_WORDS.has(symbol)) symbols.push(symbol)
  }
  return symbols
}

export function changedSymbolsFromPatch(patch = '') {
  const symbols = []

  for (const line of String(patch).split(/\r?\n/)) {
    if ((line.startsWith('+') || line.startsWith('-')) && !line.startsWith('+++') && !line.startsWith('---')) {
      symbols.push(...symbolsFromLine(line.slice(1)))
    }
  }

  return uniqueSorted(symbols)
}

function replayLane(change, status) {
  return createLane({
    id: change.label,
    agent: change.label,
    task: change.task || `Replay ${change.range}`,
    status,
    files: change.changedFiles,
    symbols: change.changedSymbols,
    contracts: change.contracts ?? [],
    createdAt: change.createdAt,
  })
}

export function buildCollisionReplay({ source = {}, left, right, generatedAt } = {}) {
  const leftLane = replayLane(left, 'airborne')
  const rightLane = replayLane(right, 'queued')
  const collision = inspectPair(leftLane, rightLane)
  const directEvidence = collision.evidence.filter((item) => item.kind === 'shared file' || item.kind === 'shared symbol')
  const wouldHold = directEvidence.length > 0 && (collision.severity === 'critical' || collision.severity === 'high')

  return {
    schemaVersion: 1,
    kind: 'runway-collision-replay',
    generatedAt: generatedAt || new Date().toISOString(),
    mode: 'counterfactual',
    source,
    disclosure: 'Historical Git changes are treated as the scopes that should have been declared. This proves overlap existed; it does not claim Runway was deployed for the original work.',
    symbolDetection: 'Lightweight JavaScript/TypeScript declaration-line extraction from the diff; not compiler-grade semantic analysis.',
    lanes: [left, right],
    verdict: {
      state: wouldHold ? 'would-hold' : collision.hasConflict ? 'review' : 'clear',
      label: wouldHold ? 'Runway would hold the later lane for review' : collision.hasConflict ? 'Runway would surface a caution' : 'No overlap reconstructed',
      severity: collision.severity,
      score: collision.score,
      ownerLane: collision.ownerLaneId,
    },
    evidence: collision.evidence,
  }
}
