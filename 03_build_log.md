# Build log

## 2026-07-17 - foundation

- Verified the source-of-truth competition rules in `00_facts.md` before choosing scope.
- Used parallel Codex research passes to score 20 concepts across all tracks. Locked Runway in `01_idea_selection.md`; rejected proof/trace dashboards after checking the live category for close competitors.
- Chose a local React/Vite dashboard plus dependency-free Node CLI: the judge can run the real demo without keys, a hosted account, or opaque model output.
- Chose a bounded JS/TS semantic-collision engine rather than claiming universal code understanding. Alerts must name the concrete overlapping evidence.
- Designed the Codex contribution as an executable skill + CLI protocol: reserve lane -> inspect collision -> work -> attach evidence -> hand off.

## 2026-07-17 - working core

- Used the official Vite setup path and kept the product browser-local; no runtime model/API, account, CDN, or telemetry is needed for the judge demo.
- Implemented the same collision semantics in the dashboard and CLI: exact shared files, exported symbols, contracts, and module-area proximity each produce named evidence rather than an opaque score.
- Added the `parcel-ops` source fixture so the product can scan real JS/JSX files, not only render mock cards.
- Initialized and validated the bundled `runway` Codex skill. It encodes a low-freedom safety sequence for coordination-sensitive actions while leaving implementation decisions to the agent.
- Validation run: `npm test` (5/5), `npm run build`, and `npm run lint`; fixed the Windows file-URL test path before recording the passing suite.

## 2026-07-17 - demo hardening

- Browser-tested the full user path: initial critical hold -> safe reroute -> reserve -> evidence-backed handoff; also created a fresh overlapping lane and verified Runway held it with exact file, symbol, and contract evidence. Browser console had no errors.
- Added a checked-in static demo and dependency-free local server so a judge can run the dashboard without an install or rebuild. HTTP smoke test returned 200 for the document and hashed JS asset.
- Forward-tested the generated `runway` skill against the real fixture. It correctly stopped before edits on a critical hold and reported exact scope evidence. Tightened the skill to require inspection of `lane create` clearance before reservation.
- Hardened ownership semantics so only the established airborne lane remains protected when two airborne scopes collide; the later collision is held. Added a regression test for that case.
- Final verification: `npm test` (6/6), `npm run lint`, `npm run build`, `npm run package:demo`, static-demo HTTP smoke, and the skill validator all passed. Removed only the ignored fixture state created by validation.

## 2026-07-17 - model access gate

- Attempted a read-only Codex CLI review with `--model gpt-5.6` after the build. The current ChatGPT-account login rejected that model, and no OpenAI/Codex API credential is configured. This attempt is not used as GPT-5.6 compliance evidence; a GPT-5.6-enabled Codex account or API credential is required before submission.
