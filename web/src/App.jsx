import { useMemo, useRef, useState } from 'react'
import './App.css'
import {
  assertHandoffAllowed,
  assertRerouteAllowed,
  auditScope,
  buildHandoff,
  conflictsForLane,
  createLane,
  deriveConflicts,
  formatList,
  hasDeclaredScope,
  laneClearance,
  reserveLaneState,
  rerouteScope,
  runwayMetrics,
  scopeGrounding,
} from './core/runway.js'
import { createDemoState } from './demo/demoState.js'

const statusCopy = {
  queued: 'Queued',
  airborne: 'Airborne',
  holding: 'Holding',
  blocked: 'Blocked',
  handoff: 'Handoff',
}

const severityCopy = {
  critical: 'Critical collision',
  high: 'High collision risk',
  medium: 'Caution zone',
  low: 'Low proximity',
}

function conflictLabel(conflict) {
  return conflict.evidence.some((item) => item.kind === 'dependency edge')
    ? 'Dependency review'
    : severityCopy[conflict.severity]
}

function Icon({ name, size = 18 }) {
  const paths = {
    runway: <path d="M4 20 20 4m-8-1h7v7M4 4l16 16M4 12h3m10 0h3M12 4v3m0 10v3" />,
    plus: <path d="M12 5v14M5 12h14" />,
    reset: <path d="M4 12a8 8 0 1 0 2.34-5.66L4 8.67M4 4v4.67h4.67" />,
    export: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3" />,
    radar: <path d="M12 12 19.5 4.5M12 12 5.5 18.5M12 3a9 9 0 1 1-9 9M12 7a5 5 0 1 1-5 5" />,
    shield: <path d="M12 3 19 6v5c0 4.7-2.9 8.1-7 10-4.1-1.9-7-5.3-7-10V6l7-3Zm-3.5 9 2.2 2.2L15.8 9" />,
    branch: <path d="M7 4v12a4 4 0 0 0 4 4h2m4-16v7a4 4 0 0 1-4 4H7m10-11a2 2 0 1 0 0 .01M17 20a2 2 0 1 0 0 .01" />,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    bolt: <path d="m13 2-9 12h7l-1 8 10-13h-7l0-7Z" />,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function Pill({ status, children }) {
  return <span className={`pill pill--${status}`}>{children}</span>
}

function formatTime() {
  return new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
}

function shortPath(path) {
  return path.replace(/^src\//, '')
}

function App() {
  const [runway, setRunway] = useState(createDemoState)
  const [selectedId, setSelectedId] = useState('tax-adjustment')
  const [composerOpen, setComposerOpen] = useState(false)
  const [toast, setToast] = useState('')
  const importInputRef = useRef(null)

  const conflicts = useMemo(() => deriveConflicts(runway.lanes, runway.scan), [runway.lanes, runway.scan])
  const metrics = useMemo(() => runwayMetrics(runway), [runway])
  const selectedLane = runway.lanes.find((lane) => lane.id === selectedId) ?? runway.lanes[0]
  const selectedConflicts = conflictsForLane(selectedLane.id, conflicts)
  const selectedClearance = laneClearance(selectedLane, conflicts)
  const selectedHasEvidence = Boolean(selectedLane.evidence?.length)
  const selectedAudit = selectedLane.scopeAudit
  const selectedGrounding = scopeGrounding(selectedLane, runway.scan)
  const demoLane = runway.lanes.find((lane) => lane.id === 'tax-adjustment')
  const demoClearance = demoLane ? laneClearance(demoLane, conflicts) : null
  const blockingConflict = conflicts.find((conflict) => conflict.severity === 'critical' || conflict.severity === 'high')
  const primaryConflict = blockingConflict ?? conflicts[0]

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const navigateTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const updateLane = (laneId, update, activity) => {
    setRunway((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => (lane.id === laneId ? { ...update(lane), updatedAt: new Date().toISOString() } : lane)),
      activity: [{ time: formatTime(), ...activity }, ...current.activity].slice(0, 7),
    }))
  }

  const reserveLane = (targetLane = selectedLane) => {
    try {
      const reservation = reserveLaneState(targetLane, conflicts)
      updateLane(
        targetLane.id,
        (lane) => ({ ...lane, status: reservation.status, scopeAudit: null }),
        { type: reservation.status === 'holding' ? 'hold' : 'launch', lane: targetLane.id, text: `${targetLane.agent} ${reservation.status === 'holding' ? 'was held for a collision.' : 'received clearance.'}` },
      )
      notify(reservation.status === 'holding'
        ? 'Runway issued a hold: reroute the declared scope before editing.'
        : 'Lane reserved. The agent can begin scoped work.')
    } catch (error) {
      notify(error.message)
    }
  }

  const rerouteLane = (targetLane = selectedLane) => {
    try {
      assertRerouteAllowed(targetLane)
      const targetConflicts = conflictsForLane(targetLane.id, conflicts)
      const candidate = {
        ...rerouteScope(targetLane, targetConflicts),
        status: 'queued',
        note: 'Removed directly overlapping declarations. Recheck clearance before reserving.',
      }
      if (!hasDeclaredScope(candidate)) {
        notify('Runway cannot remove all overlap without losing the declared scope. Narrow it with the CLI, then recheck.')
        return
      }

      const nextLanes = runway.lanes.map((lane) => (lane.id === targetLane.id ? candidate : lane))
      const nextClearance = laneClearance(candidate, deriveConflicts(nextLanes, runway.scan))
      updateLane(
        targetLane.id,
        () => candidate,
        { type: 'reroute', lane: targetLane.id, text: `${targetLane.agent} removed directly overlapping scope.` },
      )
      notify(nextClearance.state === 'hold'
        ? 'Direct overlap was removed, but this lane still holds. Narrow it with the CLI and recheck.'
        : 'Scope rerouted. Recheck clearance, then reserve.')
    } catch (error) {
      notify(error.message)
    }
  }

  const createHandoff = (targetLane = selectedLane) => {
    try {
      assertHandoffAllowed(targetLane, conflicts)
      if (!targetLane.evidence?.length) {
        notify('Attach actual operator-provided evidence with the CLI before creating a handoff.')
        return
      }
      const receipt = buildHandoff(targetLane, conflicts)
      updateLane(
        targetLane.id,
        (lane) => ({ ...lane, status: 'handoff', handoff: receipt }),
        { type: 'evidence', lane: targetLane.id, text: `${targetLane.agent} created a structured handoff.` },
      )
      notify('Handoff receipt captured with declared scope, recorded evidence, and remaining risk.')
    } catch (error) {
      notify(error.message)
    }
  }

  const resetDemo = () => {
    setRunway(createDemoState())
    setSelectedId('tax-adjustment')
    notify('Demo airspace reset.')
  }

  const exportState = () => {
    const payload = JSON.stringify({ ...runway, conflicts, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const href = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.download = 'runway-state.json'
    anchor.click()
    URL.revokeObjectURL(href)
    notify('Portable Runway state exported.')
  }

  const auditLane = (targetLane = selectedLane) => {
    try {
      if (targetLane.status !== 'airborne') {
        throw new Error(`Only an airborne lane can audit changed files; ${targetLane.id} is ${targetLane.status}.`)
      }
      if (!targetLane.changedFiles?.length) {
        notify('Run the CLI scope audit in the agent worktree before handoff.')
        return
      }
      const scopeAudit = auditScope(targetLane, targetLane.changedFiles, { source: 'bundled fixture diff snapshot' })
      updateLane(
        targetLane.id,
        (lane) => ({ ...lane, scopeAudit }),
        {
          type: scopeAudit.passed ? 'audit' : 'hold',
          lane: targetLane.id,
          text: scopeAudit.passed
            ? `${targetLane.agent} matched the fixture diff to the declared lane.`
            : `${targetLane.agent} exposed changed-file drift outside the declared lane.`,
        },
      )
      notify(scopeAudit.passed
        ? 'Diff audit passed: every changed file stayed inside the declared lane.'
        : `Diff audit failed: ${scopeAudit.unexpectedFiles.join(', ')} was outside the lane.`)
    } catch (error) {
      notify(error.message)
    }
  }

  const importState = async (event) => {
    const [file] = event.target.files ?? []
    if (!file) return

    try {
      const payload = JSON.parse(await file.text())
      if (!Array.isArray(payload.lanes) || !payload.repo) throw new Error('This file is not a Runway state export.')
      if (!payload.lanes.length) throw new Error('The imported state has no lanes to inspect.')
      const lanes = payload.lanes.map((lane) => ({
        ...createLane(lane),
        handoff: lane.handoff,
        updatedAt: lane.updatedAt,
      }))
      setRunway({
        ...payload,
        lanes,
        activity: Array.isArray(payload.activity) ? payload.activity : [],
        scan: payload.scan && typeof payload.scan === 'object' ? payload.scan : {},
      })
      setSelectedId(lanes[0]?.id ?? '')
      notify(`Imported ${lanes.length} declared lanes from ${file.name}.`)
    } catch (error) {
      notify(`Import failed: ${error.message}`)
    } finally {
      event.target.value = ''
    }
  }

  const advanceGuidedDemo = () => {
    if (!demoLane) {
      resetDemo()
      return
    }
    setSelectedId(demoLane.id)
    if (demoClearance?.state === 'hold') rerouteLane(demoLane)
    else if (demoLane.status === 'queued') reserveLane(demoLane)
    else if (demoLane.status === 'airborne' && !demoLane.scopeAudit) auditLane(demoLane)
    else if (demoLane.status === 'airborne') createHandoff(demoLane)
    else resetDemo()
  }

  const demoStep = demoLane?.status === 'handoff'
    ? 5
    : demoLane?.status === 'airborne' && demoLane.scopeAudit?.passed
      ? 4
      : demoLane?.status === 'airborne'
        ? 3
      : demoLane?.status === 'queued' && demoClearance?.state !== 'hold'
        ? 2
        : 1
  const demoAction = demoStep === 1
    ? 'Reroute held lane'
    : demoStep === 2
      ? 'Reserve clear lane'
      : demoStep === 3
        ? 'Audit changed files'
        : demoStep === 4
          ? 'Create verified handoff'
          : 'Replay interception'

  const addLane = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const id = (form.get('id') || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    try {
      const lane = createLane({
        id: id || undefined,
        agent: form.get('agent'),
        task: form.get('task'),
        files: formatList(form.get('files')),
        symbols: formatList(form.get('symbols')),
        contracts: formatList(form.get('contracts')),
        note: 'Awaiting clearance from Runway.',
      })
      if (runway.lanes.some((existing) => existing.id === lane.id)) {
        notify(`A lane named ${lane.id} already exists. Choose a unique lane ID.`)
        return
      }

      setRunway((current) => ({
        ...current,
        lanes: [...current.lanes, lane],
        activity: [{ time: formatTime(), type: 'reserve', lane: lane.id, text: `${lane.agent} requested ${lane.id}.` }, ...current.activity].slice(0, 7),
      }))
      setSelectedId(lane.id)
      setComposerOpen(false)
      notify('New lane entered the airspace. Inspect it before launch.')
    } catch (error) {
      notify(error.message)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark"><Icon name="runway" size={22} /></span>
          <span className="brand-word">RUNWAY</span>
          <span className="brand-divider" />
          <span className="control-label">MULTI-AGENT CONTROL</span>
        </div>
        <div className="topbar-actions">
          <div className="branch-chip"><Icon name="branch" size={15} /><span>{runway.repo.branch}</span></div>
          <input ref={importInputRef} className="visually-hidden" type="file" accept="application/json,.json" aria-label="Import Runway state file" onChange={importState} />
          <button className="button button--ghost import-button" onClick={() => importInputRef.current?.click()}><Icon name="export" size={16} />Import state</button>
          <button className="button button--ghost" onClick={resetDemo}><Icon name="reset" size={16} />Reset demo</button>
          <button className="button button--solid" onClick={() => setComposerOpen(true)}><Icon name="plus" size={16} />Open lane</button>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="repo-card">
            <div className="eyebrow">ACTIVE REPOSITORY</div>
            <div className="repo-title"><span className="repo-dot" />{runway.repo.name}</div>
            <p>{runway.repo.language}</p>
            <div className="scan-status"><span className="pulse-dot" />Last scan {runway.repo.lastScan}</div>
          </div>

          <nav className="sidebar-nav" aria-label="Runway navigation">
            <button className="nav-link nav-link--active" aria-controls="airspace" onClick={() => navigateTo('airspace')}><Icon name="radar" size={17} />Airspace <span>{metrics.lanes}</span></button>
            <button className="nav-link" aria-controls="collision-radar" onClick={() => navigateTo('collision-radar')}><Icon name="shield" size={17} />Collision radar <span>{metrics.conflicts}</span></button>
            <button className="nav-link" aria-controls="evidence-ledger" onClick={() => navigateTo('evidence-ledger')}><Icon name="check" size={17} />Evidence ledger <span>{metrics.evidenceCount}</span></button>
          </nav>

          <div className="protocol-card">
            <div className="protocol-icon"><Icon name="bolt" size={17} /></div>
            <div>
              <strong>Agent protocol</strong>
              <p>Declare. Reserve. Prove the diff. Hand off.</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <span className="status-led" />Local-only control plane
          </div>
        </aside>

        <main className="main-content">
          <section className="hero-panel">
            <div>
              <div className="eyebrow eyebrow--lime">CODE SCOPE CONTRACT / {runway.repo.name.toUpperCase()}</div>
              <h1>Declare before code. Prove the diff after.</h1>
              <p>Runway stops parallel agents from duplicating the same change before they start, then checks that each Git diff stayed inside its declared lane before handoff.</p>
            </div>
            <div className="hero-badge">
              <span className="hero-badge__ring" style={{ '--clearance': `${metrics.confidence}%` }}><span /></span>
              <div><strong>{metrics.confidence}%</strong><span>clearance rate</span></div>
            </div>
          </section>

          <section className={`intercept-strip ${blockingConflict ? 'intercept-strip--hold' : primaryConflict ? 'intercept-strip--caution' : 'intercept-strip--clear'}`} aria-label="Current collision interception">
            <div className="intercept-intro">
              <span className="intercept-pulse" />
              <div><span>LIVE DECISION</span><strong>{blockingConflict ? '1 lane held before edit' : primaryConflict ? 'Dependency caution only' : 'Airspace clear'}</strong></div>
            </div>
            {(primaryConflict?.evidence ?? []).slice(0, 3).map((item) => (
              <div className="intercept-proof" key={item.kind}><span>{item.kind}</span><code>{item.values[0]}</code></div>
            ))}
            {!primaryConflict && <div className="intercept-proof"><span>RESULT</span><code>No blocking overlap</code></div>}
          </section>

          <section className={`guided-demo guided-demo--step-${demoStep}`} aria-label="45 second guided demo">
            <div className="guided-demo__copy">
              <span className="eyebrow eyebrow--lime">45-SECOND JUDGE PATH</span>
              <strong>{demoStep === 1 ? 'Runway caught three matching declarations.' : demoStep === 2 ? 'The direct overlap is gone. Recheck passed.' : demoStep === 3 ? 'The lane is isolated and airborne.' : demoStep === 4 ? 'The changed files stayed inside the lane.' : 'Collision avoided. Scope and evidence preserved.'}</strong>
              <p>{demoStep === 1 ? 'Pricing already owns the shared behavior, so Sol cannot start yet.' : demoStep === 2 ? 'Sol now owns only the tax module and tax-adjustment contract.' : demoStep === 3 ? 'Compare the recorded fixture diff with the file boundary Sol declared.' : demoStep === 4 ? 'Now turn diff conformance and the focused test into one handoff receipt.' : 'The two agents can continue independently with an auditable scope contract.'}</p>
            </div>
            <div className="guided-demo__progress" aria-label={`Demo step ${demoStep} of 5`}>
              {[1, 2, 3, 4, 5].map((step) => <span key={step} className={step <= demoStep ? 'is-complete' : ''}>{step}</span>)}
            </div>
            <button className={`button ${demoStep === 5 ? 'button--ghost' : 'button--solid'}`} onClick={advanceGuidedDemo}>{demoAction}<Icon name="arrow" size={16} /></button>
          </section>

          <section className="metric-grid" aria-label="Runway metrics">
            <article className="metric-card"><span>ACTIVE LANES</span><strong>{metrics.lanes}</strong><small>{metrics.ready} cleared or reviewable</small></article>
            <article className="metric-card metric-card--alert"><span>HOLDING</span><strong>{metrics.holding}</strong><small>requires a reroute</small></article>
            <article className="metric-card"><span>EXACT OVERLAPS</span><strong>{metrics.exactOverlapCount}</strong><small>named before implementation</small></article>
            <article className="metric-card"><span>REPO GROUNDED</span><strong>{metrics.groundedRate ?? '—'}{metrics.groundedRate !== null && <small className="metric-unit">%</small>}</strong><small>declared files & symbols found</small></article>
          </section>

          <section className="operations-grid">
            <article id="airspace" className="panel airspace-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">DECLARED LANES</div>
                  <h2>Agent lanes</h2>
                </div>
                <div className="legend" aria-label="Lane status legend">
                  <span><i className="legend-dot legend-dot--airborne" />Airborne</span>
                  <span><i className="legend-dot legend-dot--holding" />Holding</span>
                  <span><i className="legend-dot legend-dot--queued" />Queued</span>
                </div>
              </div>
              <div className="lane-stack">
                {runway.lanes.map((lane, index) => {
                  const clearance = laneClearance(lane, conflicts)
                  const laneConflicts = conflictsForLane(lane.id, conflicts)
                  return (
                    <button
                      key={lane.id}
                      className={`lane-card lane-card--${lane.status} ${selectedLane.id === lane.id ? 'lane-card--selected' : ''}`}
                      onClick={() => setSelectedId(lane.id)}
                    >
                      <span className="lane-index">0{index + 1}</span>
                      <span className="lane-strip"><i /></span>
                      <span className="lane-main">
                        <span className="lane-card__top"><Pill status={lane.status}>{statusCopy[lane.status]}</Pill><span className={`clearance clearance--${clearance.state}`}>{clearance.label}</span></span>
                        <strong>{lane.task}</strong>
                        <span className="lane-agent">{lane.agent}</span>
                      </span>
                      <span className="lane-signal">
                        {laneConflicts.length ? <b>{laneConflicts[0].score}</b> : <Icon name="check" size={20} />}
                        <small>{laneConflicts.length ? 'risk' : 'clear'}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </article>

            <article id="collision-radar" className="panel radar-panel">
              <div className="panel-heading">
                <div><div className="eyebrow">CLEARANCE BEFORE EDIT</div><h2>Collision radar</h2></div>
                <span className="radar-live"><i />Scope + repo scan</span>
              </div>
              <div className="radar-visual" aria-label="Collision radar graphic">
                <div className="radar-ring radar-ring--one" /><div className="radar-ring radar-ring--two" /><div className="radar-ring radar-ring--three" />
                <div className="radar-sweep" />
                <div className="radar-center"><Icon name="radar" size={24} /></div>
                <span className="radar-blip radar-blip--one" /><span className="radar-blip radar-blip--two" /><span className="radar-blip radar-blip--three" />
              </div>
              <div className="radar-summary">
                <span>Declared intent is checked against exact overlap and one-hop scanned imports.</span>
                <strong>{metrics.conflicts} signals found</strong>
              </div>
              <div className="signal-list">
                {conflicts.slice(0, 3).map((conflict) => (
                  <button key={conflict.id} className="signal-row" onClick={() => setSelectedId(conflict.laneIds.includes(selectedLane.id) ? selectedLane.id : conflict.laneIds[0])}>
                    <span className={`severity severity--${conflict.severity}`} />
                    <span><strong>{conflictLabel(conflict)}</strong><small>{conflict.laneIds.join(' × ')} · {conflict.evidence[0]?.kind}: {conflict.evidence[0]?.values.join(', ')}</small></span>
                    <b>{conflict.score}</b>
                  </button>
                ))}
                {!conflicts.length && <div className="empty-signal">No declared overlap. New lanes are clear.</div>}
              </div>
            </article>
          </section>

          <section className="detail-grid">
            <article className="panel lane-detail">
              <div className="panel-heading">
                <div><div className="eyebrow">SELECTED LANE</div><h2>{selectedLane.id}</h2></div>
                <Pill status={selectedLane.status}>{statusCopy[selectedLane.status]}</Pill>
              </div>
              <p className="detail-task">{selectedLane.task}</p>
              <div className="scope-grid">
                <ScopeColumn title="FILES" items={selectedLane.files.map(shortPath)} />
                <ScopeColumn title="SYMBOLS" items={selectedLane.symbols} />
                <ScopeColumn title="CONTRACTS" items={selectedLane.contracts} />
              </div>
              <div className="lane-note"><Icon name="shield" size={16} /><span>{selectedLane.note || 'No extra constraints declared.'}</span></div>
              {selectedGrounding.available && (
                <div className={`grounding-row ${selectedGrounding.rate === 100 ? 'grounding-row--complete' : ''}`}>
                  <span><Icon name="check" size={15} />Repository grounding</span>
                  <div>
                    <strong>{selectedGrounding.grounded}/{selectedGrounding.declared} file & symbol declarations found</strong>
                    {selectedGrounding.rate < 100 && <small>Review: {[...selectedGrounding.unknownFiles, ...selectedGrounding.unknownSymbols].join(', ')}</small>}
                  </div>
                </div>
              )}
              <div className="detail-actions">
                {selectedLane.status === 'handoff' ? (
                  <span className="action-note">Handoff complete. Open a new lane for follow-up work.</span>
                ) : selectedClearance.state === 'blocked' ? (
                  <span className="action-note">Declare at least one bounded scope before reserving.</span>
                ) : selectedClearance.state === 'hold' ? (
                  <button className="button button--warning" onClick={() => rerouteLane()}><Icon name="arrow" size={16} />Remove overlap & recheck</button>
                ) : selectedLane.status === 'queued' ? (
                  <button className="button button--solid" onClick={() => reserveLane()}><Icon name="runway" size={16} />Reserve this lane</button>
                ) : selectedClearance.state === 'protected' ? (
                  <span className="action-note"><Icon name="shield" size={16} />Protected owner</span>
                ) : (
                  <span className="action-note">Lane is airborne in its declared scope.</span>
                )}
                {selectedLane.status === 'airborne' && selectedClearance.state !== 'hold' && (
                  !selectedAudit ? (
                    selectedLane.changedFiles?.length
                      ? <button className="button button--ghost" onClick={() => auditLane()}><Icon name="check" size={16} />Audit changed files</button>
                      : <span className="action-note">Run the CLI Git diff audit before handoff.</span>
                  ) : !selectedAudit.passed ? (
                    <span className="action-note">Scope drift found. Reroute or revert the unexpected files.</span>
                  ) : selectedHasEvidence ? (
                    <button className="button button--ghost" onClick={() => createHandoff()}><Icon name="check" size={16} />Create handoff</button>
                  ) : <span className="action-note">Attach operator-provided test evidence before handoff.</span>
                )}
              </div>
            </article>

            <article id="evidence-ledger" className="panel evidence-panel">
              <div className="panel-heading"><div><div className="eyebrow">RECEIPT</div><h2>Evidence & risk</h2></div><button className="icon-button" onClick={exportState} aria-label="Export Runway state"><Icon name="export" size={17} /></button></div>
              <div className={`clearance-banner clearance-banner--${selectedClearance.state}`}>
                <span className="clearance-orb" /><div><strong>{selectedClearance.label}</strong><p>{selectedClearance.conflict ? 'Evidence is attached below. Resolve scope before takeoff.' : 'No declared overlap among active lanes.'}</p></div>
              </div>
              {selectedConflicts.length > 0 ? (
                <div className="risk-evidence">
                  {selectedConflicts.map((conflict) => (
                    <div key={conflict.id} className="risk-row"><span className={`severity severity--${conflict.severity}`} /><div><strong>{conflictLabel(conflict)}</strong>{conflict.evidence.map((item) => <p key={item.kind}>{item.kind}: <code>{item.values.join(', ')}</code></p>)}</div><b>{conflict.score}</b></div>
                  ))}
                </div>
              ) : <div className="no-risk"><Icon name="check" size={20} />No declared collision evidence.</div>}
              <div className={`scope-audit-row ${selectedAudit?.passed ? 'scope-audit-row--passed' : selectedAudit ? 'scope-audit-row--failed' : ''}`}>
                <span className="evidence-check"><Icon name={selectedAudit?.passed ? 'check' : 'branch'} size={13} /></span>
                <div>
                  <strong>{selectedAudit ? (selectedAudit.passed ? 'DIFF CONFORMANT' : 'SCOPE DRIFT') : 'DIFF AUDIT REQUIRED'}</strong>
                  <p>{selectedAudit
                    ? `${selectedAudit.inScopeFiles.length}/${selectedAudit.changedFiles.length} changed files inside the declared lane${selectedAudit.unexpectedFiles.length ? `; unexpected: ${selectedAudit.unexpectedFiles.join(', ')}` : ''}.`
                    : 'CLI reads the Git worktree; this browser demo uses a labeled fixture diff snapshot.'}</p>
                </div>
                {selectedAudit && <small>{selectedAudit.source}</small>}
              </div>
              <div className="evidence-list">
                <span className="evidence-title">ATTACHED EVIDENCE</span>
                {selectedLane.evidence?.length ? selectedLane.evidence.map((item, index) => <div className="evidence-row" key={`${item.command}-${index}`}><span className="evidence-check"><Icon name="check" size={13} /></span><code>{item.command}</code><span>{item.result}</span><time>{item.at}</time></div>) : <div className="no-evidence">Runway records operator-provided evidence; it does not execute commands in the browser.</div>}
              </div>
            </article>
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading"><div><div className="eyebrow">CONTROL TOWER LOG</div><h2>Recent flight activity</h2></div><span className="log-note">Local state / exportable JSON</span></div>
            <div className="activity-list">
              {runway.activity.map((event, index) => <div className="activity-row" key={`${event.time}-${event.lane}-${index}`}><time>{event.time}</time><span className={`activity-mark activity-mark--${event.type}`} /><code>{event.lane}</code><p>{event.text}</p></div>)}
            </div>
          </section>
        </main>
      </div>

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setComposerOpen(false)}>
          <section className="lane-modal" role="dialog" aria-modal="true" aria-labelledby="lane-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setComposerOpen(false)} aria-label="Close lane composer"><Icon name="close" size={18} /></button>
            <div className="eyebrow eyebrow--lime">DECLARE BEFORE EDITING</div>
            <h2 id="lane-modal-title">Open a work lane</h2>
            <p>Describe the concrete code surface your agent expects to change. Runway only makes claims from the scope you declare, and requires at least one file, symbol, or contract.</p>
            <form onSubmit={addLane} className="lane-form">
              <label>Lane ID<input name="id" placeholder="invoice-guardrail" autoFocus /></label>
              <label>Agent owner<input name="agent" placeholder="Rowan / API" required /></label>
              <label>Task<textarea name="task" placeholder="Add a safe invoice retry boundary." required rows="2" /></label>
              <label>Files <small>comma separated</small><input name="files" placeholder="src/billing/invoice.js" /></label>
              <label>Symbols <small>comma separated</small><input name="symbols" placeholder="retryInvoice, createInvoice" /></label>
              <label>Contracts <small>comma separated</small><input name="contracts" placeholder="invoice-status" /></label>
              <button className="button button--solid button--wide" type="submit"><Icon name="runway" size={17} />Enter airspace</button>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="check" size={16} />{toast}</div>}
    </div>
  )
}

function ScopeColumn({ title, items }) {
  return <div className="scope-column"><span>{title}</span>{items.length ? items.map((item) => <code key={item}>{item}</code>) : <em>Not declared</em>}</div>
}

export default App
