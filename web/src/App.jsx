import { useMemo, useState } from 'react'
import './App.css'
import {
  buildHandoff,
  conflictsForLane,
  createLane,
  deriveConflicts,
  formatList,
  laneClearance,
  runwayMetrics,
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

  const conflicts = useMemo(() => deriveConflicts(runway.lanes), [runway.lanes])
  const metrics = useMemo(() => runwayMetrics(runway), [runway])
  const selectedLane = runway.lanes.find((lane) => lane.id === selectedId) ?? runway.lanes[0]
  const selectedConflicts = conflictsForLane(selectedLane.id, conflicts)
  const selectedClearance = laneClearance(selectedLane, conflicts)

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  const updateLane = (laneId, update, activity) => {
    setRunway((current) => ({
      ...current,
      lanes: current.lanes.map((lane) => (lane.id === laneId ? { ...update(lane), updatedAt: new Date().toISOString() } : lane)),
      activity: [{ time: formatTime(), ...activity }, ...current.activity].slice(0, 7),
    }))
  }

  const reserveLane = () => {
    const clearance = laneClearance(selectedLane, conflicts)
    if (clearance.state === 'hold') {
      updateLane(
        selectedLane.id,
        (lane) => ({ ...lane, status: 'holding' }),
        { type: 'hold', lane: selectedLane.id, text: `${selectedLane.agent} was held for a collision.` },
      )
      notify('Runway issued a hold: reroute before editing shared behavior.')
      return
    }

    updateLane(
      selectedLane.id,
      (lane) => ({ ...lane, status: 'airborne' }),
      { type: 'launch', lane: selectedLane.id, text: `${selectedLane.agent} received clearance.` },
    )
    notify('Lane reserved. The agent can begin scoped work.')
  }

  const rerouteLane = () => {
    updateLane(
      selectedLane.id,
      (lane) => ({
        ...lane,
        status: 'queued',
        files: lane.files.filter((file) => file !== 'src/quote.js'),
        symbols: lane.symbols.filter((symbol) => symbol.toLowerCase() !== 'quotetotal'),
        contracts: lane.contracts.filter((contract) => contract.toLowerCase() !== 'pricing'),
        note: 'Rerouted to its own tax adjustment seam. Pricing remains owned by Theo.',
      }),
      { type: 'reroute', lane: selectedLane.id, text: `${selectedLane.agent} accepted a safe reroute.` },
    )
    notify('Reroute applied. Recheck clearance, then reserve the lane.')
  }

  const createHandoff = () => {
    const receipt = buildHandoff(selectedLane, conflicts)
    const evidence = [
      ...(selectedLane.evidence ?? []),
      { command: 'node --test', result: 'passing', at: formatTime() },
    ]

    updateLane(
      selectedLane.id,
      (lane) => ({ ...lane, status: 'handoff', evidence, handoff: receipt }),
      { type: 'evidence', lane: selectedLane.id, text: `${selectedLane.agent} created a structured handoff.` },
    )
    notify('Handoff receipt captured with scope, evidence, and remaining risk.')
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

  const addLane = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const id = (form.get('id') || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const lane = createLane({
      id: id || undefined,
      agent: form.get('agent'),
      task: form.get('task'),
      files: formatList(form.get('files')),
      symbols: formatList(form.get('symbols')),
      contracts: formatList(form.get('contracts')),
      note: 'Awaiting clearance from Runway.',
    })

    setRunway((current) => ({
      ...current,
      lanes: [...current.lanes, lane],
      activity: [{ time: formatTime(), type: 'reserve', lane: lane.id, text: `${lane.agent} requested ${lane.id}.` }, ...current.activity].slice(0, 7),
    }))
    setSelectedId(lane.id)
    setComposerOpen(false)
    notify('New lane entered the airspace. Inspect it before launch.')
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
            <button className="nav-link nav-link--active"><Icon name="radar" size={17} />Airspace <span>{metrics.lanes}</span></button>
            <button className="nav-link"><Icon name="shield" size={17} />Collision radar <span>{metrics.conflicts}</span></button>
            <button className="nav-link"><Icon name="check" size={17} />Evidence ledger <span>{metrics.evidenceCount}</span></button>
          </nav>

          <div className="protocol-card">
            <div className="protocol-icon"><Icon name="bolt" size={17} /></div>
            <div>
              <strong>Agent protocol</strong>
              <p>Reserve. Respect holds. Attach proof. Hand off.</p>
            </div>
          </div>

          <div className="sidebar-footer">
            <span className="status-led" />Local-only control plane
          </div>
        </aside>

        <main className="main-content">
          <section className="hero-panel">
            <div>
              <div className="eyebrow eyebrow--lime">AIRSPACE STATUS / {runway.repo.name.toUpperCase()}</div>
              <h1>Every agent deserves a runway.</h1>
              <p>Assign a bounded lane before the diff exists. Runway exposes shared behavior before parallel work turns into a merge surprise.</p>
            </div>
            <div className="hero-badge">
              <span className="hero-badge__ring"><span /></span>
              <div><strong>{metrics.confidence}%</strong><span>clearance confidence</span></div>
            </div>
          </section>

          <section className="metric-grid" aria-label="Runway metrics">
            <article className="metric-card"><span>ACTIVE LANES</span><strong>{metrics.lanes}</strong><small>{metrics.ready} cleared or protected</small></article>
            <article className="metric-card metric-card--alert"><span>HOLDING</span><strong>{metrics.holding}</strong><small>requires a reroute</small></article>
            <article className="metric-card"><span>COLLISION SIGNALS</span><strong>{metrics.conflicts}</strong><small>file, symbol, or contract</small></article>
            <article className="metric-card"><span>EVIDENCE ATTACHED</span><strong>{metrics.evidenceCount}</strong><small>commands with outcomes</small></article>
          </section>

          <section className="operations-grid">
            <article className="panel airspace-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">LIVE AIRSPACE</div>
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

            <article className="panel radar-panel">
              <div className="panel-heading">
                <div><div className="eyebrow">PREDICTED BEFORE EDIT</div><h2>Collision radar</h2></div>
                <span className="radar-live"><i />Live</span>
              </div>
              <div className="radar-visual" aria-label="Collision radar graphic">
                <div className="radar-ring radar-ring--one" /><div className="radar-ring radar-ring--two" /><div className="radar-ring radar-ring--three" />
                <div className="radar-sweep" />
                <div className="radar-center"><Icon name="radar" size={24} /></div>
                <span className="radar-blip radar-blip--one" /><span className="radar-blip radar-blip--two" /><span className="radar-blip radar-blip--three" />
              </div>
              <div className="radar-summary">
                <span>Runway compares declared scope, not private reasoning.</span>
                <strong>{metrics.conflicts} signals found</strong>
              </div>
              <div className="signal-list">
                {conflicts.slice(0, 3).map((conflict) => (
                  <button key={conflict.id} className="signal-row" onClick={() => setSelectedId(conflict.laneIds.includes(selectedLane.id) ? selectedLane.id : conflict.laneIds[0])}>
                    <span className={`severity severity--${conflict.severity}`} />
                    <span><strong>{severityCopy[conflict.severity]}</strong><small>{conflict.evidence[0]?.kind}: {conflict.evidence[0]?.values.join(', ')}</small></span>
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
              <div className="detail-actions">
                {selectedClearance.state === 'hold' ? (
                  <button className="button button--warning" onClick={rerouteLane}><Icon name="arrow" size={16} />Apply safe reroute</button>
                ) : selectedClearance.state === 'protected' ? (
                  <button className="button button--ghost" onClick={() => notify('This agent owns the shared behavior. Keep the declared scope and let the other lane reroute.')}><Icon name="shield" size={16} />Protected owner</button>
                ) : (
                  <button className="button button--solid" onClick={reserveLane}><Icon name="runway" size={16} />Reserve this lane</button>
                )}
                <button className="button button--ghost" onClick={createHandoff}><Icon name="check" size={16} />Create handoff</button>
              </div>
            </article>

            <article className="panel evidence-panel">
              <div className="panel-heading"><div><div className="eyebrow">RECEIPT</div><h2>Evidence & risk</h2></div><button className="icon-button" onClick={exportState} aria-label="Export Runway state"><Icon name="export" size={17} /></button></div>
              <div className={`clearance-banner clearance-banner--${selectedClearance.state}`}>
                <span className="clearance-orb" /><div><strong>{selectedClearance.label}</strong><p>{selectedClearance.conflict ? 'Evidence is attached below. Resolve scope before takeoff.' : 'No declared semantic overlap in live lanes.'}</p></div>
              </div>
              {selectedConflicts.length > 0 ? (
                <div className="risk-evidence">
                  {selectedConflicts.map((conflict) => (
                    <div key={conflict.id} className="risk-row"><span className={`severity severity--${conflict.severity}`} /><div><strong>{severityCopy[conflict.severity]}</strong>{conflict.evidence.map((item) => <p key={item.kind}>{item.kind}: <code>{item.values.join(', ')}</code></p>)}</div><b>{conflict.score}</b></div>
                  ))}
                </div>
              ) : <div className="no-risk"><Icon name="check" size={20} />No live collision evidence.</div>}
              <div className="evidence-list">
                <span className="evidence-title">ATTACHED CHECKS</span>
                {selectedLane.evidence?.length ? selectedLane.evidence.map((item, index) => <div className="evidence-row" key={`${item.command}-${index}`}><span className="evidence-check"><Icon name="check" size={13} /></span><code>{item.command}</code><span>{item.result}</span><time>{item.at}</time></div>) : <div className="no-evidence">Nothing attached yet. A lane is not a handoff until it has evidence.</div>}
              </div>
            </article>
          </section>

          <section className="panel activity-panel">
            <div className="panel-heading"><div><div className="eyebrow">CONTROL TOWER LOG</div><h2>Recent flight activity</h2></div><span className="log-note">Local state · exportable JSON</span></div>
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
            <p>Describe the concrete code surface your agent expects to change. Runway only makes claims from the scope you declare.</p>
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
