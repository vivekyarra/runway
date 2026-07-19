# Build log

## 2026-07-17 - session of record

- Hackathon-required Codex Session ID: `019f6e9b-8401-78c0-a71b-56273ec52b3f` (authenticated as `gpt-5.6-terra`; recorded before resume verification).

## 2026-07-17 - foundation

- Verified the source-of-truth competition rules in `00_facts.md` before choosing scope.
- Used parallel Codex research passes to evaluate candidate concepts across all tracks. Locked Runway in `01_idea_selection.md`; rejected proof/trace dashboards after checking the live category for close competitors.
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
- A supplied API credential was accepted by the OpenAI Models API and exposed `gpt-5.6-sol`, `gpt-5.6-terra`, and `gpt-5.6-luna`. The documented one-run `CODEX_API_KEY` path selected API authentication correctly, but the read-only `gpt-5.6-sol` review was rejected with `Quota exceeded`. No credential was written to the repository.

## 2026-07-17 - resume gate

- Reconfirmed the session of record, then reran `web` validation: `npm test` passed 6/6. The checked-in static demo served from `bin/demo-server.mjs` on its no-rebuild path and completed the visible hold -> reroute -> reserve -> evidence-backed handoff flow with no browser-console errors.
- Competitive check: the official Build Week gallery is still unpublished. No exact duplicate was found, but Regente materially overlaps the pitch (agent lanes, collision blocking, local state, handoffs for Codex/Claude/Gemini). Runway remains distinct only through its bounded pre-edit declared JS/TS scope plus deterministic file/symbol/contract reasoning. Per the owner stop condition, no differentiation or architecture change has been made pending direction.
- Independent QA found non-architectural candidate fixes in the lane transitions, receipt evidence ordering, path normalization, duplicate/unscoped lane validation, cold-start skill installation, and claim/documentation accuracy. It also found a separate concurrency-write concern in `web/bin/runway.mjs` that needs an owner decision before any locking protocol is introduced. No QA fixes have been applied while paused.
- QA detail (unfixed): `web/src/core/runway.js` has a Windows-path collision bypass, owner masking across multiple conflicts, case-insensitive JS-symbol matching, and an unreachable proximity-only warning; `web/bin/runway.mjs` has unsafe concurrent state writes and a reroute-empty-option failure. `web/src/App.jsx` permits invalid/repeated transitions, duplicate/unscoped lanes, and stale handoff receipt evidence. `README.md`, `SUBMISSION.md`, `web/skills/runway/SKILL.md`, CLI help, and `web/src/demo/demoState.js` need claim, portable-install, platform, GPT-5.6-record, and runnable-evidence corrections. See the relevant named files rather than treating this as resolved.
## 2026-07-17 - approved QA and differentiation pass

- Owner approved the local concurrency-safe write protocol and the non-architectural QA fixes; no core idea or architecture pivot was made.
- Implemented the declared-scope/path/case/order/transition/evidence fixes in web/src/core/runway.js, web/bin/runway.mjs, web/src/App.jsx, and their tests. CLI writers now use a bounded cooperative .runway/state.lock plus same-directory atomic state replacement; see README.md for its local-filesystem limitation.
- Competitive concern is resolved by positioning Runway as **pre-edit declared-scope clearance**, not generic agent orchestration. README.md, SUBMISSION.md, web/skills/runway/SKILL.md, 01_idea_selection.md, and 02_build_plan.md now state the intentional heuristic boundary.
- Corrected runnable fixture evidence, static-demo chronology, portable skill installation, metadata, and submission-facing GPT-5.6/Codex explanation. The static web/demo bundle was regenerated from the verified source.
- Latest validation: npm test passed 19/19; npm run lint, npm run build, and npm run package:demo passed. A clean temporary copy containing only web/demo, web/bin/demo-server.mjs, and its assets served the current title/bundle successfully. Browser QA completed hold -> reroute/recheck -> reserve -> handoff with the tax test evidence preserved and no console errors.
- The earlier model-access and unfixed-QA notes are historical and superseded by this authenticated gpt-5.6-terra session of record and the completed fixes above. /feedback remains an account-bound final submission step.
- Remaining bounded risks are intentional: declarations are cooperative, scanning is shallow JS/TS metadata inventory, and the local lock is neither a distributed lock nor a security boundary.

## 2026-07-19 - winning-pass product iteration

- Replaced the fixed-scenario-only impression with a repository-grounded workflow. Persisted scans now validate declared files/symbols and add resolved one-hop relative imports as non-blocking dependency review evidence; direct declared overlap remains the only hard-hold basis.
- Added a first-fold interception strip, 45-second guided judge path, live repository-grounding metric, exact-overlap metric, dependency-review labels, real state import, and active-lane metric correction.
- Expanded the Parcel Ops fixture with a grounded receipt-copy lane and added regression coverage for dependency edges, grounding, active handoff exclusion, and persisted CLI scan output. Local verification passed 23/23 tests, lint, build, and demo packaging.
- Published product milestone `08e0deb` and deployment milestone `7aac83d`. The first Linux workflow correctly exposed a cross-platform optional-dependency lock gap; `9630ccc` fixed the clean-install contract. The next GitHub Actions run passed verification and deployed the public judge demo at https://vivekyarra.github.io/runway/.

## 2026-07-19 - rules and precedent cross-check

- Rechecked the live Devpost overview and Official Rules. The four criteria remain equally weighted, with technological implementation first in tie-breaking. Judges may choose not to run the project and may score only the text, images, and video. This drove the one-click hosted demo, first-fold proof, submission screenshot, architecture visual, and exact video script.
- The official gallery is still unpublished, so no honest claim about the current field can be made. The earlier Regente check remains the closest known category overlap; Runway continues to lead with the narrower pre-edit declared-scope boundary.
- The most relevant winner precedent was GitLab's 2026 AI Hackathon, which used the same four judging dimensions. Its published recap praised serious test coverage, explainable decisions, strong demo/UX, in-workflow action, and projects that felt like products rather than hackathon prototypes. Runway adopted those patterns through the CLI/skill protocol, visible evidence, 23 focused tests, hosted demo, and coherent four-action resolution; it did not copy winner features or broaden into generic orchestration.
- Sources checked: https://openai.devpost.com/, https://openai.devpost.com/rules, and https://about.gitlab.com/blog/gitlab-ai-hackathon-2026-meet-the-winners/.

## 2026-07-19 - final release gate

- Cloned the public repository at the latest pushed commit into a fresh temporary directory. `npm ci`, 23/23 tests, lint, and production build all passed; the checked-in no-rebuild server returned HTTP 200 with the expected product title. The verified temporary clone and its demo process were removed afterward.
- Re-ran the public GitHub Pages flow in a clean browser state: hold -> reroute -> reserve -> verified handoff reached “Collision avoided. Evidence preserved.” The public GitHub README exposed the live-demo link and judge-facing pitch correctly.
- Confirmed the latest GitHub Actions verification/deployment run passed on Linux and the repository was clean and synchronized with `origin/main`.
- The release was evidence-complete for that iteration. Remaining required actions were account-bound: create the Devpost project, record/upload the public sub-three-minute video, run `/feedback` in the core-build thread, paste the Session ID, and submit.

## 2026-07-19 - adversarial credibility correction

- Accepted an external review that builder-assigned scores were circular evidence. Removed every self-rating and replaced them with an evidence-versus-limitations map. No internal win probability is used as a release signal.
- Removed judge-profile inference from the facts, build log, and positioning. The published rules and judging criteria are the decision source; named judges' public posts are not treated as product requirements.
- Reframed the hook as **Declare before code. Prove the diff after.** The differentiator is one inspectable boundary—planned code scope versus actual changed code—not a claim to be a general orchestration category leader.
- Added `lane audit`. By default it reads staged, unstaged, and untracked paths from the actual Git worktree, ignores `.runway`, compares them with the declared files, and persists exact in-scope and unexpected paths. Missing, failed, or stale audits reject handoff; reservation and reroute invalidate prior audits.
- Extended the browser judge path with a clearly labeled fixture diff audit and a visible diff-conformance receipt. The browser still does not claim to execute Git or tests.
- Added real temporary-Git regression coverage: an undeclared `src/drift.js` change is named and blocks handoff; restoring it makes the audit pass. Added a separate file-boundary guard for symbol-only declarations. The suite now contains 27 tests.
- Preserved the remaining limitations: participation is cooperative; the audit is file-level rather than symbol-level enforcement; declarations can be overly broad; and no distributed lock, runtime write prevention, compiler-grade analysis, or conflict-free merge guarantee is claimed.
- Recorded the product mechanism and regression coverage in milestone commit `d188e8c` before the submission-copy and visual update.
