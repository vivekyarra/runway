# Idea selection - locked

Scoring: T=technical implementation, D=design, I=potential impact, Q=idea quality, F=polished feasibility (1-10). Overall is the mean of T/D/I/Q, matching the four equal criteria in `00_facts.md`.

| Track | Idea | T | D | I | Q | F | Overall | Decision |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Apps | Blackout Book - household continuity planner | 8 | 8 | 9 | 8 | 7 | 8.25 | Shortlist |
| Apps | Care Relay - caregiver shift handoff | 7 | 8 | 9 | 7 | 6 | 7.75 | Cut: safety/domain burden |
| Apps | Proof Pocket - consumer evidence packet | 8 | 8 | 8 | 8 | 7 | 8.00 | Cut: legal-adjacent trust risk |
| Apps | MoveMap - moving-home dependency simulator | 7 | 7 | 7 | 5 | 9 | 6.50 | Cut: derivative |
| Apps | Friction Lab - energy-aware recovery planner | 7 | 8 | 8 | 6 | 8 | 7.25 | Cut: crowded planner category |
| Work | Handoff Zero - AI-to-human work transfer | 8 | 8 | 9 | 8 | 8 | 8.25 | Cut: crowded continuity category |
| Work | Incident Loom - incident rehearsal studio | 9 | 9 | 9 | 9 | 6 | 9.00 | Cut: simulation/product-scope risk |
| Work | Commitment Compiler - decision contract | 8 | 8 | 8 | 7 | 8 | 7.75 | Cut: summary-tool adjacent |
| Work | Policy Diff - role-specific policy impact | 8 | 8 | 8 | 7 | 8 | 7.75 | Cut: document-AI adjacent |
| Work | Fieldnote to Fork - field-to-decision board | 8 | 8 | 8 | 7 | 7 | 7.75 | Cut: needs integrations to feel real |
| Dev tools | **Runway - parallel-agent air traffic control** | **10** | **9** | **9** | **10** | **8** | **9.50** | **WINNER** |
| Dev tools | Proofline - proof-carrying change review | 10 | 9 | 9 | 7 | 8 | 8.75 | Cut: verifier category is crowded |
| Dev tools | Agent Flight Recorder - trace viewer | 9 | 9 | 8 | 8 | 8 | 8.50 | Cut: observability-only |
| Dev tools | Contract Atlas - legacy API promise map | 9 | 8 | 8 | 8 | 8 | 8.25 | Cut: less memorable demo |
| Dev tools | Failure Garden - counterexample generator | 9 | 8 | 9 | 9 | 8 | 8.75 | Cut: testing-agent adjacent |
| Education | Misconception Lab - prediction/counterexample learning | 9 | 10 | 9 | 9 | 8 | 9.25 | Runner-up |
| Education | Argument Gym - evidence-based claim practice | 8 | 9 | 9 | 8 | 8 | 8.50 | Cut: debate-tutor adjacent |
| Education | System Safari - emergent-system simulator | 10 | 10 | 9 | 9 | 5 | 9.50 | Cut: polish risk |
| Education | Code Archaeologist - infer-and-repair lab | 8 | 9 | 8 | 7 | 8 | 8.00 | Cut: familiar coding tutor |
| Education | Lab Bench - reproducible experiment builder | 9 | 9 | 9 | 9 | 7 | 9.00 | Cut: too broad to demonstrate deeply |

## Locked concept: Runway

**One-line pitch:** *Runway is air-traffic control for parallel Codex agents: it assigns work lanes, predicts shared-symbol and dependency collisions before edits start, and leaves an evidence-backed handoff when a lane is clear.*

### Why it wins

- **Technical implementation:** Codex is the active operator, not a chat wrapper: it reserves a lane, reads a collision report, works in a scoped branch/worktree, validates, and closes with an auditable handoff. The core delivers real JS/TS symbol/import analysis and deterministic collision reasoning.
- **Design:** a visual mission-control surface makes parallel-agent coordination legible in seconds; every warning names the exact overlapping file, symbol, or contract.
- **Potential impact:** as teams use multiple coding agents, file-level Git conflicts arrive too late. Runway catches the more expensive conflict—two agents independently changing the same behavior—before code diverges.
- **Quality of idea:** verification and agent-memory tools already exist; the differentiated unit here is a **pre-edit semantic work lane** with safe routing, not another post-hoc dashboard.
- **Feasibility:** the first release is deliberately bounded to local JavaScript/TypeScript repositories, a bundled demo repo, and explicit heuristic confidence. It never claims universal static analysis or formal correctness.

### Build contract

Ship a local dashboard, a Codex-ready CLI/skill, a real collision engine, a working demo fixture, tests, and an exportable lane handoff. No runtime API key, account, or hosted service is required. The Dev Tools submission will include the no-rebuild demo path required by `00_facts.md`.


## 2026-07-17 - implementation self-critique and differentiation addendum

This addendum does not change the locked choice above. It scores the product that now exists, rather than the earlier concept pitch.

| Judging criterion | Implemented score | Honest basis |
|---|---:|---|
| Technical implementation | 8.5 | Shared deterministic core, browser demo, dependency-free CLI, local atomic-write protocol, source fixture, and adversarial tests are real and runnable. The scanner is intentionally shallow JS/TS pattern matching, and declarations still depend on agent honesty. |
| Design | 8.0 | The hold -> reroute -> reserve -> handoff flow is easy to follow in the static demo and names the exact scope evidence. It remains a fixed local scenario rather than a live shared control plane. |
| Potential impact | 7.5 | Parallel agents create a genuine early-coordination problem, and this workflow makes it concrete. Adoption depends on teams consistently declaring scope before editing. |
| Idea quality | 6.5 | The pre-edit clearance boundary is focused and defensible, but the broader agent-lane category already has credible adjacent work. The product must stay precise rather than claim a category monopoly. |

**Implemented mean: 7.6/10.** The original 9.5 was an idea-selection estimate, not an earned implementation score.

### Weaknesses to state plainly

- A declaration can be incomplete, stale, or dishonest; Runway cannot discover every intended edit.
- The scanner inventories common JS/TS surface patterns but does not perform semantic program analysis.
- State coordination is local and cooperative, not a hosted team service or distributed lock.
- The dashboard demonstrates the protocol; it does not watch agents edit files or prove a merge will succeed.

### Two-minute defense: why Runway beats the alternatives

Parallel-agent tools usually solve a later problem. A worktree separates files after an agent starts. A file claim can stop two agents once they touch the same path. A trace or review tool explains what happened after work is done.

Runway occupies the earlier decision: before code diverges, ask each agent to say what it intends to change. Files alone are not enough, so the declaration also includes exported symbols and behavioral contracts. The product then gives a small, inspectable answer: proceed, proceed with caution, or hold - plus the exact scope that caused the answer.

That matters because the cheapest conflict is the one rerouted before implementation. It is also credible as a hackathon build: the judge can see the exact decision, reproduce it locally with no account, inspect the heuristic, and follow the evidence into the handoff. We do not pretend to replace Git, worktrees, tests, or code review. Runway is the pre-edit decision layer that makes those later safeguards start from a clearer plan.

### Calculated differentiation move

Lead every submission-facing surface with **pre-edit declared-scope clearance**, not generic agent orchestration. Show the file/symbol/contract evidence and the reroute-and-recheck decision. State the boundary explicitly: transparent local heuristic, not runtime enforcement or merge proof.
