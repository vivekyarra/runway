# Build plan - Runway

Deadline anchor: the Jul 21, 2026, 5:00 PM PT submission deadline in `00_facts.md`. Code freeze is Jul 20, 6:00 PM PT; the remaining time is submission/video buffer.

## Product architecture

- **Dashboard:** React + Vite, browser-local interactive mission control. It opens/edit/reroutes work lanes, shows evidence, exports a portable state file, and has a one-click deterministic demo.
- **Core:** shared, dependency-free JavaScript collision engine. It scores exact shared files, shared exported symbols, declared contracts, and import relationships; every alert carries the evidence and a confidence label.
- **CLI:** Node 24 command-line companion that initializes `.runway`, scans JS/TS exports/imports, reserves lanes, records evidence, and creates a handoff. It is intentionally local-only.
- **Codex integration:** a `runway` skill tells an agent to reserve before editing, honor blocked lanes, attach verification evidence, and hand off explicitly. It calls the local CLI rather than requiring an API key or an experimental runtime.
- **Demo fixture:** a small JS/TS repository with three concurrent tasks and one real shared-symbol collision. It makes the product testable without an account or rebuild.

## Milestones

| When (PT) | Exit criterion | Codex role |
|---|---|---|
| Jul 17 | lock idea, state model, visual system, demo narrative | evaluate candidates against `00_facts.md`; reject crowded categories |
| Jul 18 | collision engine, CLI, fixture, Node tests | implement bounded static analysis; independently review edge cases |
| Jul 19 | polished dashboard connected to the same state model | build interaction states; test clear/blocked/rerouted/handoff flows |
| Jul 20 12:00 PM | skill, README, demo/test path, accessibility/responsive pass | turn product workflow into explicit agent instructions; review docs as a judge |
| Jul 20 6:00 PM | code freeze, clean build, test evidence, screenshots | run verification and fix only confirmed regressions |
| Jul 21 1:00 PM | final video, Devpost fields, repo visibility/test instructions | produce a concise demo script and submission checklist |
| Jul 21 5:00 PM | submitted | buffer only; no feature work |

## Guardrails

- Scope semantic analysis to JS/TS and label it heuristic; never claim formal correctness or universal collision detection.
- Do not execute an agent, create a worktree, or modify a target repository unless an operator invokes that explicit CLI action.
- Keep the demo fully usable without credentials. `README.md` and `03_build_log.md` remain the submission evidence trail required by `00_facts.md`.


## 2026-07-17 - implementation clarification (append-only)

The original architecture line saying the collision engine scores import relationships was broader than the implemented clearance behavior. The current shared collision engine compares declared files, exported symbols, behavioral contracts, and module-area proximity. The CLI scan separately inventories common named JS/TS exports, imports, and routes; scan results do not automatically change clearance. This keeps the implemented heuristic transparent and preserves the guardrail against overclaiming static analysis.