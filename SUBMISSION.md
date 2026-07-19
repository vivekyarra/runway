# Runway submission kit

Final copy-and-record handoff for OpenAI Build Week. Track: **Developer Tools**.

## Devpost fields

**Project name:** Runway

**Tagline:** Declare before code. Block out-of-lane patches. Prove the handoff.

**Repository:** https://github.com/vivekyarra/runway

**Live demo:** https://vivekyarra.github.io/runway/

**Codex plugin install:** `codex plugin marketplace add vivekyarra/runway --ref main`, then `codex plugin add runway@runway-marketplace`

**Final video file:** `submission/video/runway-build-week-demo.mp4` (2:31.8, 1280x800, H.264/AAC, audible, one-line captioned)

**Verification workflow:** https://github.com/vivekyarra/runway/actions/workflows/pages.yml

**Built with:** Codex plugin, Codex skill, `PreToolUse` hook, GPT-5.6, React, Vite, Node.js

**Supported platform:** The hosted demo works in modern desktop browsers. The plugin and CLI require Codex, Node.js 20.19+, and Git; they are tested on Windows and by Linux CI. The POSIX hook path is supplied for macOS but is not part of CI.

**Short description:** Git catches collisions after code exists. Runway compares planned files, symbols, and behavioral contracts before parallel Codex work, blocks direct patches outside the reserved lane, then executes proof and audits Git before handoff.

## Full project description

### Inspiration

This is not a synthetic-only failure shape. One public ESLint issue produced three independent human implementations. Two later pull requests were closed to avoid duplicating work. Git eventually exposed the coordination failure, but only after contributors had already written code. That evidence proves duplicate implementation is real and reconstructable; it does not prove AI agents collide at scale.

The agent-specific premise comes from a separate primary source: official Codex documentation says parallel write-heavy agent workflows can create conflicts and increase coordination overhead. Runway targets that documented boundary without pretending the historical contributors were agents.

Worktrees isolate edit locations and merge tools resolve completed changes. Neither asks the earlier question: before two agents start, do they intend to change the same behavior?

### What it does

Runway connects forensic proof to prevention.

**Collision Replay** accepts two Git ranges, resolves exact commit SHAs, extracts changed JavaScript/TypeScript paths and changed function declarations, and feeds both scopes through Runway's deterministic collision engine. The bundled public replay reconstructs ESLint PRs #20248 and #20487. It finds four shared paths and the same changed function, then emits a SHA-256-fingerprinted JSON artifact. The replay is explicitly counterfactual and human-authored: it proves overlap existed; it does not claim Runway was deployed there or measure agent-collision prevalence.

**Live lanes** turn the lesson into a code-scope contract. Before implementation, each agent declares expected files, exported symbols, and behavioral contracts. Runway returns an inspectable clear, caution, protected-owner, or hold decision. Direct scope overlap can stop the later lane; shallow dependency proximity remains a caution, not false certainty.

**Native Codex guard** narrows the cooperative-declaration gap. The installable plugin binds each Codex process to `RUNWAY_LANE`. Its trusted `PreToolUse` hook inspects direct `apply_patch`/`Edit`/`Write` targets and denies missing, unknown, non-airborne, traversal, and out-of-lane paths before the patch runs.

**Verified handoff** remains the final backstop. `lane verify` executes the exact trusted test command itself, captures exit status, duration, output hashes, and byte counts, then re-reads staged, unstaged, and untracked Git paths. Only a successful command plus a conformant post-command audit creates a receipt. Manual passing handoffs are rejected.

The build includes an interactive React control tower, installable Codex marketplace plugin, auto-discovered skill, native patch hook, standalone dependency-free CLI, Parcel Ops source fixture, 39 tests, JSON state import/export, a published replay artifact, and a checked-in no-rebuild demo.

### How we built it

The replay path, plugin CLI, and dashboard share the same dependency-free collision core. The CLI persists `.runway/state.json`, scans common JS/TS exports and relative imports, guards lane transitions, serializes local writers with an exclusive lock, and atomically replaces state. The hook reads the same persisted lane boundary before Codex patch calls.

The browser opens on the public collision replay, then moves to a concrete prevention flow. Pricing owns `src/quote.js`, `quoteTotal`, and the `pricing` contract. Tax independently declares all three and is held before editing. Rerouting Tax to `src/tax/adjustments.js` clears it. Checkout remains only a caution because an import is review evidence, not proof of conflicting intent.

### How Codex and GPT-5.6 were used

Runway now runs natively inside Codex as an installable skill, trusted `PreToolUse` hook, and bundled CLI. It still makes no runtime GPT call. GPT-5.6 ran through Codex as the engineering environment that built and pressure-tested the product. It helped narrow the problem, implement the core, replay extractor, CLI verification gate, dashboard, plugin, hook protocol, concurrency, and adversarial tests. QA found and fixed Windows path normalization, symbol-case, ownership ordering, invalid transitions, concurrent writes, stale locks, diff drift, false-positive replay symbols, traversal, missing lane bindings, and inaccurate claims.

Keeping collision decisions deterministic is a product choice: judges can reproduce every hold, verification result, and Git audit without an API key or hidden model judgment. The official rules ask entrants to build with Codex/GPT-5.6, explain that collaboration, and provide the `/feedback` Codex Session ID; they do not state that the shipped runtime must call a model API.

The session of record is `019f6e9b-8401-78c0-a71b-56273ec52b3f`; the evidence trail is in `03_build_log.md`.

### Challenges

The central challenge was credibility. A fixture alone could make Runway look like a linter built around its own example. Collision Replay grounds the failure shape in public Git history, while the visible evidence boundary states that the contributors were human and the replay is not agent-scale data. Official Codex guidance supplies the separate agent-workflow basis.

The second challenge was cooperative participation. A skill instruction alone could be ignored. The Codex hook now stops supported direct patches outside the active airborne lane before execution, while `lane verify` catches changed-file drift from shell, MCP, editor, or other paths afterward. Neither layer is described as universal enforcement.

The engineering challenge was safe local mutation. Runway locks writers, reloads state under lock, performs same-directory atomic replacement, and detects lane changes that occur while a verification command is running.

### Accomplishments

- Reconstructed a documented human duplicate-work incident from exact public Git refs without relabeling it as agent evidence.
- Produced an inspectable replay with four shared paths, one shared changed function, source links, exact SHAs, and a verifiable fingerprint.
- Converted that historical failure into a pre-edit hold using the same collision engine.
- Shipped an installable Codex plugin whose trusted lifecycle hook denies direct out-of-lane patches before execution.
- Distinguished direct overlap from an import-only caution.
- Made test evidence Runway-executed rather than operator-asserted.
- Rejected handoff after a passing command when the fresh Git audit found an undeclared file.
- Shipped a public no-login demo, reproducible fixture, Codex plugin, standalone CLI, and 39 passing tests.

### What we learned

Evidence must stay in its lane. Public history proves a duplicate-implementation failure; official product guidance establishes the agent-specific coordination risk; the working build proves Runway's mechanism. None alone proves prevalence or production impact. The useful control point is still a small, inspectable contract: declared before work, tested by the tool, and checked against Git after work.

### What's next

Next steps are coverage for additional trusted write surfaces, opt-in language adapters, hunk-level symbol conformance, and a shared transport for distributed teams. This build does not claim compiler-grade analysis, distributed locking, universal write enforcement, autonomous intent detection, or guaranteed conflict-free merges.

## Judging-criteria proof map

| Criterion | Judge-visible proof | Verifiable artifact |
|---|---|---|
| Technical implementation (25%) | Installable Codex plugin, native patch guard, exact-ref replay, executed proof, post-command Git audit, concurrent state protocol | `.agents/plugins/plugins/runway`, `web/bin/runway.mjs`, 39 tests |
| Design (25%) | Real incident first; exact refs on demand; one guided prevention path; hold versus caution is legible | Hosted no-rebuild dashboard, captioned 2:31 demo, and three submission images |
| Potential impact (25%) | Human public history proves the failure shape; official Codex guidance names agent conflict risk; Runway demonstrates a native before-edit intervention and after-edit backstop | Evidence boundary, live Pricing/Tax scope contract, denied patch, and verified receipt |
| Quality of idea (25%) | The loop acts before, during, and after implementation instead of waiting for merge | Replay -> Declare -> Reserve -> Guard patch -> Run proof -> Audit -> Receipt |

## Final public video - 2:31.8

The checked-in MP4 is 1280x800 H.264/AAC with audible ElevenLabs narration. It preserves the complete uncropped 1280x720 live browser or terminal capture and adds a dedicated 80-pixel rail below it. Every burned-in English caption is one centered movie-style line inside that rail, never over the product. The exact live captures, capture scripts, transcript, SRT, thumbnail, upload copy, and reproducible ffmpeg build are in `submission/video/`. The timing below follows the final render; keep any uploaded version unchanged and under three minutes.

### Prepare the CLI segment

Run from `web`. This creates a disposable Git repository under the system temp directory and does not edit the Runway checkout.

~~~powershell
$proofRoot = Join-Path ([IO.Path]::GetTempPath()) ("runway-video-proof-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -Recurse -Force (Resolve-Path 'fixtures\parcel-ops') $proofRoot
git -C $proofRoot init
git -C $proofRoot config user.email 'runway@example.test'
git -C $proofRoot config user.name 'Runway Demo'
git -C $proofRoot add .
git -C $proofRoot commit -m 'Parcel Ops baseline'

node bin\runway.mjs init --root $proofRoot
node bin\runway.mjs scan --root $proofRoot --write
node bin\runway.mjs lane create --root $proofRoot --id tax-adjustment --agent 'Sol / Rules' --task 'Apply regional tax adjustment' --files 'src/tax/adjustments.js' --symbols 'calculateTaxAdjustment' --contracts 'tax-adjustment'
node bin\runway.mjs lane reserve --root $proofRoot --id tax-adjustment
Add-Content -LiteralPath (Join-Path $proofRoot 'src\tax\adjustments.js') -Value "`n// scoped tax change"
Add-Content -LiteralPath (Join-Path $proofRoot 'src\quote.js') -Value "`n// accidental pricing drift"

# Capture this: tests pass, but the fresh audit names src/quote.js and blocks handoff.
node bin\runway.mjs lane verify --root $proofRoot --id tax-adjustment --command 'node --test tests/tax.test.mjs'

# Correct only the drift, then capture the verified handoff.
git -C $proofRoot restore -- src/quote.js
node bin\runway.mjs lane verify --root $proofRoot --id tax-adjustment --command 'node --test tests/tax.test.mjs' --note 'Focused tax path verified.'
~~~

Also prepare these completed commands in the Runway checkout:

~~~powershell
node bin\runway.mjs replay verify --file ..\docs\replays\eslint-20014.json
npm test
~~~

### Shot list and narration

**0:00-0:18 - Problem and differentiator**

Show the first fold and the live hold strip.

> "Two coding agents can edit different files and still implement the same behavior. Git tells you after both wrote code. Runway compares planned files, exported symbols, and behavioral contracts before either starts, blocks out-of-lane Codex patches, then verifies the final diff."

**0:18-0:42 - Real evidence, honest boundary**

Show the replay card, then expand **Inspect exact refs**.

> "A public issue produced three human implementations and two duplicate-work closures. Runway reconstructs two exact Git ranges: four shared paths and the same changed function. This proves the failure shape, not agent prevalence; official Codex guidance separately warns parallel write-heavy agents can conflict."

**0:42-1:05 - Turn evidence into prevention**

Show the Tax hold, then click **Reroute held lane** and **Reserve clear lane**.

> "Pricing is airborne. Tax declared the same file, exported symbol, and pricing behavior, so Runway protects the owner and holds Tax before editing. I reroute it to its own module and reserve it. Checkout is only a caution because an import is evidence, not proof of conflict."

**1:05-1:26 - Native Codex guard**

Show the two-sided proof frame: the trusted hook denies `src/quote.js` before editing, while the declared `src/tax/adjustments.js` path is the allowed lane.

> "The installable Codex plugin binds this session to the airborne Tax lane. Its trusted pre-tool hook denies a direct patch to undeclared `src/quote.js` before execution. The declared Tax file passes. This guards Codex patch tools; it is not a universal write sandbox."

**1:26-1:51 - Executed proof and Git backstop**

Continue across the proof frame, then show the audited and receipt states from the real guided flow.

> "Other write paths still need a backstop. Runway executes this focused test itself. The test passes, but the fresh Git audit finds undeclared `src/quote.js`, so no handoff exists. I remove only that drift and rerun. Runway records the exit code, output hashes, and conformant changed files before issuing the receipt."

**1:51-2:11 - Installable and reproducible**

Show the reproducibility card with both plugin install commands, successful replay fingerprint verification, and the fresh 39-test result.

> "The public repository is a Codex marketplace: two commands install the skill, hook, and standalone CLI without rebuilding. The replay fingerprint verifies, and thirty-nine tests cover collision logic, concurrency, real Git drift, hook denial, traversal, and plugin parity."

**2:11-2:31 - GPT-5.6 use and close**

Hold on the deterministic-runtime disclosure, then finish on the Runway end card and public links.

> "GPT-5.6 ran through Codex to build and pressure-test the parser, plugin, hook, CLI, concurrency, interface, and tests. Runtime decisions stay deterministic—there is no hidden model call. Runway acts before code, during the patch, and after execution, with evidence at every boundary."

## Capture checklist

- The final render uses isolated live browser and terminal captures, not a screenshot slideshow. The visible cursor hovers real controls, clicks the guided flow, and selects on-page evidence.
- Preserve the complete 1280x720 content frame. Captions belong only in the separate bottom rail, on one line per cue.
- Use `docs/runway-judge-demo.png` as the first image and `docs/runway-real-replay.png` as the second.
- Use `docs/runway-cli-proof.png` as the third image; it must show the native patch denial and the post-command drift block.
- Keep exact source URLs, commit refs, overlap evidence, and disclosure readable.
- Keep all three boundary cells readable: human incident, official agent-specific basis, and Codex/GPT-5.6 build versus deterministic runtime.
- Use Runway-owned UI only; do not show third-party logos, hover source links, expose third-party marks in the browser chrome, or copy third-party screenshots. The replay card intentionally uses a generic source label while preserving the real links for inspection.
- The CLI/hook proof must visibly show the passing focused test, `unexpectedFiles: ["src/quote.js"]`, no handoff, and the corrected diff-conformant receipt.
- Capture a fresh `npm test` result showing 39 passing tests.
- Hide notifications, credentials, bookmarks, unrelated tabs, and local personal paths where practical.
- Test audio, public YouTube visibility, repository, and demo links while signed out.
- Final duration must remain under three minutes.

## Claims to make - and not make

Say: **native Codex plugin**, **trusted PreToolUse patch guard**, **direct patch denial**, **human-authored historical replay**, **failure-shape proof, not prevalence**, **official Codex agent-conflict guidance**, **exact refs**, **GPT-5.6 used through Codex to build**, **deterministic runtime**, and **Runway-executed proof**.

Do not say: the historical contributors were agents, agent collisions are proven at scale, Runway caught the original ESLint work, nobody noticed until merge, GPT-5.6 runs inside the shipped product, signed artifact, universal semantic analysis, autonomous intent detection, distributed lock, universal write enforcement, shell/MCP/editor enforcement, symbol-level diff enforcement, or guaranteed safe merge.

## Final account-bound checklist

- [ ] Start or open the project on the registered OpenAI Build Week Devpost account.
- [ ] Confirm the public repository contains the final demo, README, license, tests, replay notice, and submission kit.
- [ ] Run the README path from a clean clone.
- [x] Render and inspect the audible, captioned video under three minutes.
- [ ] Upload `submission/video/runway-build-week-demo.mp4` to YouTube and publish it publicly.
- [ ] Verify YouTube, repository, and live demo while signed out.
- [ ] Paste the public video URL into Devpost.
- [ ] Run `/feedback` in the core-build Codex thread and paste the returned Session ID into Devpost.
- [ ] Select **Developer Tools**, paste this copy, and upload the three complementary images: first-fold problem, live prevention flow, and CLI/hook proof.
- [ ] Add the hosted demo as the primary test path and `cd web; node bin\demo-server.mjs` as the fallback.
- [ ] Submit before **Jul 21, 2026, 5:00 PM PT**.
- [ ] Open the submitted entry signed out and verify every link.
