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

## 2026-07-19 - scope-contract release evidence

- Separated the final work into reviewable milestones: `d188e8c` implements actual-Git scope auditing and `69c3811` replaces self-scoring with judge-visible proof, the new hook, the exact video path, and updated submission images.
- Ran the complete local gate after the product change: 27/27 tests, lint, production build, and checked-in demo packaging passed. The Windows concurrency test was also repeated to expose and fix a real lock-acquisition race before release.
- Executed the submission video's CLI sequence against a disposable Git repository. The first audit named undeclared `src/quote.js` and rejected handoff; after restoring that file, the audit passed with only `src/tax/adjustments.js` changed and handoff succeeded.
- Verified pushed commit `69c3811` from a fresh public clone: `npm ci` reported zero vulnerabilities, 27/27 tests passed, lint and build passed, and the no-rebuild static server returned HTTP 200 for both the document and hashed JavaScript asset.
- GitHub Actions run `29678201878` passed both Linux verification and deployment. The hosted judge path completed reroute -> reserve -> audit -> handoff, distinguished an import-based caution from a declared-overlap hold, displayed the diff-conformance receipt, emitted no browser warnings or errors, and fit a 390x844 mobile viewport without horizontal overflow.
- Final release evidence remains deliberately bounded: the dashboard audit is a labeled fixture snapshot, while the CLI is the executable proof that reads Git. The remaining account-bound work is video recording/upload, Devpost entry completion, and the required `/feedback` Session ID step.

## 2026-07-19 - problem-first and reproducibility gate

- Audited the literal first paragraphs after a final external review. The README and Devpost short description now open with the real coordination failure before introducing the solution; Codex and GPT-5.6 remain documented later as the build method rather than presented as the reason for the product.
- Made the bundled sample path explicit near the no-rebuild instructions: `web/fixtures/parcel-ops` contains the inspectable source, focused tests, and Pricing/Tax/Checkout scenario used by the dashboard and CLI, with no key, hosted dependency, or separate data download.

## 2026-07-19 - real collision replay milestone

- Accepted the valid part of an external differentiation review: a fixture-only collision proved implementation but did not establish external impact. Rejected a fake live-agent simulation as theater and rejected broad blast-radius prediction because it would require semantic-analysis claims outside the product boundary.
- Researched public primary-source pull-request history and found ESLint issue #20014 produced three independent implementation attempts. PR #20487 and PR #20526 were explicitly closed to avoid duplicating the earlier PR #20248. The replay uses only factual metadata, identifiers, exact Git refs, and MIT-licensed source identifiers; it includes a non-affiliation notice.
- Added generic `replay --left <base>..<head> --right <base>..<head>` support in milestone `fc1dff4`. The CLI resolves commit SHAs, reads changed paths and JS/TS declaration lines, uses the shared collision engine, and emits a counterfactual artifact. A real run exposed comment/context false positives, which were fixed before publishing the evidence.
- Published `docs/replays/eslint-20014.json`: four shared paths, shared changed function `isEvaluatedDuringInitialization`, exact source links and refs, explicit counterfactual disclosure, and SHA-256 `690814f55c81bd9b3c0224f53cbe827551c82287c1e93d55c65c72c7d92e8d9e`.

## 2026-07-19 - executed-proof milestone

- Replaced operator-asserted passing evidence with `lane verify` in milestone `8f12bdd`. Runway executes the exact trusted command in the target repository, records exit status, timeout, duration, stdout/stderr byte counts and SHA-256 hashes, then reacquires the state lock and reads Git again.
- A failed command, timeout, lane scope/status mutation during execution, or unexpected post-command Git path prevents handoff. Manual CLI handoff evidence is disabled. The scope check remains file-level and cooperative; no runtime write enforcement or semantic proof is claimed.
- Added regression coverage for failing command exit 7, successful executed proof, unexpected drift after a passing command, and lane mutation during verification. The suite reached 30 tests.

## 2026-07-19 - replay-first judge experience

- Rebuilt the first fold around the public incident: "One issue. Three implementations. Two duplicate-work closures." The replay card shows the three-PR timeline, four shared paths, shared function, verdict, exact refs, source links, counterfactual disclosure, artifact path, fingerprint, license, and non-affiliation statement.
- Added `replay verify --file` and source metadata fields. Artifact verification recomputes the published fingerprint and rejects tampering; it is described as a fingerprint, not a signature.
- Rewrote the README, Devpost copy, Codex skill, video plan, and architecture around the complete loop: Collision Replay -> Declare -> Reserve -> Run proof -> post-command Git audit -> receipt. The browser remains explicitly a fixture and never claims to execute Git or tests.
- Captured new Runway-owned 1280x720 submission images at `docs/runway-real-replay.png` and `docs/runway-judge-demo.png`. Desktop and 390x844 browser QA found no horizontal overflow; exact-ref expansion worked and the page emitted no console errors.
- Public sources: https://github.com/eslint/eslint/pull/20248, https://github.com/eslint/eslint/pull/20487, https://github.com/eslint/eslint/pull/20526, and https://github.com/eslint/eslint/blob/main/LICENSE.
- Rehearsing the documented disposable-repository video path exposed that the copied fixture inherited ESM mode only from the parent `web/package.json`. Added a fixture-local `package.json`, then reran the exact sequence: the focused test passed while undeclared `src/quote.js` still blocked handoff; after restoring only that path, the second verification created a conformant receipt.
- Rechecked the live Official Rules after the replay-first pass. The required under-three-minute public YouTube demo with audio, Codex/GPT-5.6 explanation, public repository, `/feedback` Session ID, Developer Tools installation/platform/no-rebuild path, four equally weighted criteria, and third-party-mark restriction are all reflected in `SUBMISSION.md`. The video uses only Runway-owned visuals and a generic source label; the real primary-source links remain inspectable outside the recording.

## 2026-07-19 - replay-first release evidence

- Committed and pushed the complete replay-first judge experience in `d8b3174`, after feature milestones `fc1dff4` (generic Git-history replay) and `8f12bdd` (Runway-executed verification). This preserves independent review points for the mechanism, credibility gate, and final presentation.
- GitHub Actions run `29680355247` passed the Linux clean-install, 30-test, lint, build, and Pages deployment jobs for `d8b3174`.
- Cloned the public repository at exact SHA `d8b3174c2ca2abf04a5991f11a0650c7291c2bd1`. `npm ci` found zero vulnerabilities; all 30 tests, lint, and production build passed. The checked-in no-rebuild server returned HTTP 200 for the document and hashed JavaScript asset with the replay-first title.
- The deployed Pages build exposed both full replay ranges and the fingerprint, completed the live reroute -> reserve -> fixture audit -> receipt path, and showed the diff-conformant end state. At 390x844, document width and scroll width were both 375 CSS pixels, so no horizontal overflow was present.
- The final code release remains bounded: public history proves overlap, not causality or historical deployment; verification proves command outcome plus file-level Git conformance, not semantic correctness or runtime enforcement. The remaining work is account-bound recording, YouTube publication, Devpost entry, and `/feedback` submission.

## 2026-07-19 - evidence-seam and GPT-runtime clarification

- Accepted a sharp external review that identified an evidence seam: the public replay involved human contributors, while the target user is a parallel coding-agent team. The replay now explicitly proves only an actor-agnostic duplicate-implementation failure shape and exact overlap; it does not claim AI-agent prevalence, scale, or historical causality.
- Added the separate agent-specific primary source instead of stretching the replay. Official Codex documentation says parallel write-heavy workflows require care because agents editing simultaneously can create conflicts and increase coordination overhead. The README, Devpost copy, first-fold UI, and narration now present an evidence ladder: observed human failure -> official agent-workflow risk -> demonstrated Runway mechanism -> unmeasured production scale.
- Rechecked the live Official Rules. They require building with Codex and GPT-5.6, explaining that use in the video and README, and supplying the `/feedback` Codex Session ID. They do not state that the shipped runtime must make a model API call.
- Chose not to add a decorative GPT request. The first fold and narration now disclose that GPT-5.6-terra ran through Codex to build and pressure-test the replay extractor, CLI verification gate, concurrency protocol, interface, documentation, and tests, while shipped collision decisions remain deterministic and keyless.

## 2026-07-19 - native Codex scope-guard milestone

- Rechecked the current official Codex skill, plugin, and hook contracts before implementation. Repository skills are discovered from `.agents/skills`; plugins can bundle skills and default `hooks/hooks.json`; `PreToolUse` can inspect and deny supported `apply_patch` calls. The official boundary that hooks are guardrails rather than complete enforcement is preserved everywhere.
- Added a public repository marketplace and installable `runway` plugin containing a standalone dependency-free CLI, auto-discovered skill, and trusted `PreToolUse` hook. The plugin is validation-clean and requires no npm install or rebuild.
- Bound hook decisions to one `RUNWAY_LANE` per Codex process. Outside repositories with `.runway/state.json` the hook is inert. Inside, it denies missing, unknown, non-airborne, traversal, uninspectable, multi-file drift, and undeclared patch targets before execution; a declared file on an airborne lane passes.
- Kept the claim bounded: the hook covers supported direct Codex patch/edit/write calls. It does not guarantee shell, hosted-tool, MCP, editor, disabled-hook, or external-process enforcement. `lane verify` and the fresh Git audit remain the final backstop.
- Added nine hook/plugin regression tests covering patch extraction, inert repositories, lane binding and lifecycle, nested Windows-style paths, traversal, exact Codex deny JSON, installable manifest structure, source/plugin parity, and standalone plugin CLI operation. The complete suite reached 39 passing tests.
- Published implementation milestone `09aa43a` before changing the judge-facing narrative, screenshots, and video assets.

## 2026-07-19 - submission video and final presentation pass

- Reframed the first fold around the coordination problem and the full differentiator: planned-scope comparison before work, native Codex patch denial during work, and fresh Git audit after execution. Updated the replay boundary so the human historical evidence is never presented as agent-prevalence proof.
- Captured three Runway-owned Devpost images plus real reroute, reserve, audit, receipt, exact-ref, installation, and regression-test states for the video. No simulated agent typing, generated incident reenactment, third-party screenshot, or unsupported runtime claim is used.
- Generated a 2:31.8 ElevenLabs narration from the checked-in transcript using the existing account without a purchase. The final render includes burned-in English captions, a separate SRT, an upload thumbnail, exact YouTube copy, and a reproducible ffmpeg build script.
- Verified the final MP4 at 1280x720 and 30 fps with H.264 video, 48 kHz mono AAC audio, 151.81-second duration, audible mean level of -16.9 dB and peak of -1.2 dB, and seven inspected frames spanning the complete timeline.
- Re-ran the release gate after presentation changes: 39/39 tests, lint, production build, checked-in demo packaging, plugin validation, all three skill validators, and replay fingerprint verification passed locally.

## 2026-07-19 - live-capture video replacement

- Replaced the storyboard-style render with an isolated live Edge DevTools screencast of the actual checked-in Runway UI. Recording-only behavior drives the real guided flow, adds a human-paced cursor, hovers the controls under discussion, clicks the rendered buttons, and selects the evidence boundary and Codex-basis text; the ordinary hosted demo path is unchanged.
- Captured a dedicated live terminal take from actual hook and CLI executions: an out-of-lane patch is denied, the declared file passes, a passing test plus undeclared Git drift refuses handoff, removing only that drift creates a verified receipt, the replay fingerprint verifies, and the complete suite reports 39 passing tests.
- Rebuilt the 2:31.8 final as 1280x800 H.264/AAC. Each full 1280x720 capture remains uncropped; a dedicated 80-pixel bottom rail holds exactly one centered caption line per cue so captions never cover product or terminal evidence.
- Inspected frames across the full sequence after retiming the bounded terminal segments. The narration now lands on the matching deny, drift, clean receipt, install, regression result, and live UI states without fabricating command output.

## 2026-07-19 - caption removal and repository cleanup

- Removed the non-verbatim burned-in subtitles instead of presenting summarized captions as an exact transcript. The final local upload artifact is now an uncropped 1280x720 H.264/AAC video with the original voice-over and no subtitle stream or caption rail.
- Removed the raw browser and terminal captures, narration audio, render scripts, storyboard frames, SRT, and final MP4 from Git tracking. The final MP4 and upload thumbnail remain local and ignored for account-bound YouTube upload; only lightweight upload instructions remain in the repository.
- Removed the recording-only cursor automation from the shipped React source after capture so the public product contains only runtime functionality required by the project.
