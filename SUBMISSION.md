# Runway submission kit

This file is the final copy-and-record handoff for OpenAI Build Week. Track: **Developer Tools**.

## Devpost fields

**Project name:** Runway

**Tagline:** Declare before code. Prove the diff after.

**Repository:** https://github.com/vivekyarra/runway

**Live demo:** https://vivekyarra.github.io/runway/

**Verification workflow:** https://github.com/vivekyarra/runway/actions/workflows/pages.yml

**Built with:** Codex, GPT-5.6-terra, React, Vite, Node.js

**Supported platform:** The hosted browser demo works on modern desktop browsers. The verified CLI path is Windows PowerShell with Node.js 20.19+; the included static server is platform-neutral wherever Node can run.

**Short description:** Runway gives parallel Codex agents a code-scope contract: declare expected files, symbols, and behavior before coding; then check the actual Git changed-file set before handoff. Exact overlap can hold unsafe work, and undeclared changed files block the receipt.

## Full project description

### Inspiration

Parallel coding agents make teams faster, but Git usually reveals coordination failures after code has diverged. Worktrees isolate edit locations and merge tools resolve completed changes; neither asks whether two agents intend to change the same behavior before they begin. That is the cheapest moment to redirect work.

### What it does

Runway adds a two-sided code-scope contract. Before implementation, each Codex agent declares a bounded work lane using expected files, exported symbols, and behavioral contracts. A deterministic engine compares active lanes and returns one of four inspectable states: clear, caution, protected owner, or hold.

A persisted repository scan grounds declared files and symbols and contributes non-blocking one-hop relative-import warnings. Direct file, symbol, or contract overlap can stop a later lane. Every decision names its evidence. After implementation, `lane audit` reads staged, unstaged, and untracked Git paths and compares them with the declared files. A missing, failed, or stale audit blocks handoff. A successful receipt contains the declared scope, changed-file conformance, the actual command recorded by the operator, its observed result, and remaining risk.

The submission includes an interactive React control tower, a dependency-free Node CLI, a reusable Codex skill, a real Parcel Ops source fixture, 27 tests, browser-local JSON state import/export, and a checked-in no-rebuild demo.

### How we built it

The dashboard and CLI share the same dependency-free collision core. The CLI persists `.runway/state.json`, scans common JavaScript/TypeScript exports and relative imports, validates lane transitions, and protects concurrent local writers with an exclusive lock plus same-directory atomic replacement.

The bundled Parcel Ops scenario is intentionally concrete: Pricing already owns `src/quote.js`, `quoteTotal`, and the `pricing` contract. Tax declares the same behavior and is held before editing. A safe reroute isolates Tax in `src/tax/adjustments.js`; it can then be reserved, checked against a labeled fixture diff snapshot, and handed off with its focused test evidence. Checkout remains only a caution because its scanned import reaches Pricing without direct declared overlap. The CLI, unlike the browser, reads the actual Git worktree.

### How Codex and GPT-5.6 were used

Codex with GPT-5.6-terra was the engineering collaborator, not a runtime chat wrapper. It narrowed the product to the testable boundary between planned code scope and actual changed code, implemented the core/CLI/dashboard/skill, and performed adversarial QA.

That QA found and fixed path normalization, JavaScript symbol-case, ownership ordering, invalid state transitions, concurrent state writes, stale locks, and inaccurate product claims. The session of record is `019f6e9b-8401-78c0-a71b-56273ec52b3f`; the decision and verification trail is in `03_build_log.md`.

### Challenges

The hardest product decision was resisting an oversized “agent orchestration” claim. Declarations are cooperative, and a lightweight JS/TS scanner cannot know intent. We therefore split direct collision evidence from repository proximity: exact declared overlap can hold work, while scanned import edges remain visible cautions. We then added an actual-file check at the opposite end of the lane: a declaration is not enough for handoff unless the Git changed-file set conforms to it.

The hardest engineering problem was local concurrent CLI mutation. Runway now serializes writers, reloads state under lock, atomically replaces the state file, and recovers locks left by dead processes. Tests reproduce concurrent creation and duplicate-lane races.

### Accomplishments

- Intercepts the bundled three-signal behavior collision before either competing edit begins.
- Grounds 100% of declared files and exported symbols in the bundled source scan.
- Separates blocking declaration overlap from non-blocking repository dependency review.
- Blocks a handoff when the real Git worktree contains an undeclared changed file, and names the drifted path.
- Completes the full hold -> reroute -> reserve -> diff audit -> verified handoff flow in five guided actions.
- Runs from a public one-click URL with no account, API key, hosted backend, package install, or rebuild on the judge path.
- Passes 27 automated tests plus lint, production build, static-demo packaging, and browser-flow QA.

### What we learned

Agent coordination needs a small, inspectable protocol more than another opaque prediction. Files are necessary but insufficient before work; named code symbols and behavioral contracts make intent reviewable. After work, files become objective evidence again: the actual Git changed-file set can prove whether the implementation stayed inside its lane. Repository analysis is valuable when it stays evidence, not false certainty.

### What's next

Next steps are opt-in adapters for additional languages, hunk-level symbol checks, and a team transport for shared lanes. These would preserve the current explainable evidence model. A distributed service, compiler-grade analysis, or write enforcement is not claimed by this build.

## Judging-criteria proof map

| Criterion | What to show | Verifiable evidence |
|---|---|---|
| Technical implementation (25%) | Shared core, scan-grounded scope, actual Git changed-file audit, guarded transitions, concurrent CLI writes | `web/src/core/runway.js`, `web/bin/runway.mjs`, 27 passing tests including real-worktree drift |
| Design (25%) | The collision and its resolution are understandable in one guided path | No-rebuild dashboard; exact evidence; caution versus hold; five-step scope-contract flow |
| Potential impact (25%) | Parallel Codex teams can redirect duplicate work early and catch scope drift before accepting it | Pricing/Tax hold, safe reroute, and diff-conformance receipt |
| Quality of idea (25%) | One bounded control surface, not a general orchestrator | Planned code scope before implementation versus actual changed code before handoff |

## Exact public video plan — target 2:45

Record at 1080p with the browser at 100% zoom and terminal text large enough to read. Keep the mouse still when speaking. Do one continuous narration pass, then trim dead time. Do not exceed 2:55.

### Prepare the real Git proof segment before recording

Run this from `web` in a separate terminal. It creates a disposable Git repository under the system temp directory; it does not edit the Runway checkout.

~~~powershell
$runwayProofRoot = Join-Path ([IO.Path]::GetTempPath()) ("runway-video-proof-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item -Recurse -Force (Resolve-Path 'fixtures\parcel-ops') $runwayProofRoot
git -C $runwayProofRoot init
git -C $runwayProofRoot config user.email 'runway@example.test'
git -C $runwayProofRoot config user.name 'Runway Demo'
git -C $runwayProofRoot add .
git -C $runwayProofRoot commit -m 'Parcel Ops baseline'

node bin\runway.mjs init --root $runwayProofRoot
node bin\runway.mjs lane create --root $runwayProofRoot --id tax-adjustment --agent 'Sol / Rules' --task 'Apply regional tax adjustment' --files 'src/tax/adjustments.js' --symbols 'calculateTaxAdjustment' --contracts 'tax-adjustment'
node bin\runway.mjs lane reserve --root $runwayProofRoot --id tax-adjustment
Add-Content -LiteralPath (Join-Path $runwayProofRoot 'src\tax\adjustments.js') -Value "`n// scoped tax change"
Add-Content -LiteralPath (Join-Path $runwayProofRoot 'src\quote.js') -Value "`n// accidental pricing drift"

# Record these: the audit names src/quote.js and handoff is rejected.
node bin\runway.mjs lane audit --root $runwayProofRoot --id tax-adjustment
node bin\runway.mjs lane handoff --root $runwayProofRoot --id tax-adjustment --evidence 'node --test' --result passing

# Then record the corrected pass.
git -C $runwayProofRoot restore -- src/quote.js
node bin\runway.mjs lane audit --root $runwayProofRoot --id tax-adjustment
~~~

### Shot list and word-for-word narration

**0:00–0:20 — Hook and boundary**

Open the public hosted demo and show the dashboard hero and collision strip.

> “Parallel coding agents can duplicate the same change without a Git conflict. Runway gives each agent a code-scope contract: declare before code, prove the diff after. This is not a general agent orchestrator. It controls one failure boundary: planned code scope versus actual changed code.”

**0:20–0:48 — Exact collision**

Select Tax and point to the three evidence rows and repository grounding.

> “Pricing is already airborne. Tax independently declared the same file, `src/quote.js`, the same exported symbol, `quoteTotal`, and the same pricing contract. Runway protects the owner and holds Tax before code diverges. Every signal is named and grounded against the scanned repository.”

**0:48–1:13 — Guided resolution and restraint**

Click **Reroute held lane**, then **Reserve clear lane**.

> “I reroute Tax to the isolated adjustment module and reserve it. Checkout still shows a dependency caution because its scanned import reaches Pricing. Tax was a hold because it declared the same behavior. Checkout is only a caution because an import is evidence for review, not proof of conflict.”

**1:13–1:38 — Diff contract and handoff**

Click **Audit changed files**, then **Create verified handoff** and show the receipt.

> “The other half of the contract happens after coding. This labeled fixture snapshot contains one changed file, and it is inside Tax’s declaration. Only then can Runway create a receipt with declared scope, diff conformance, the exact recorded test command, and remaining risk. The browser does not pretend to run Git or tests.”

**1:38–2:10 — Real Git drift, visibly blocked**

Show a prepared disposable Git copy of Parcel Ops where the Tax lane declared only `src/tax/adjustments.js`, but both that file and `src/quote.js` are changed. Run `lane audit`, show `source: "git worktree"` and `unexpectedFiles: ["src/quote.js"]`, then show the rejected handoff. Restore only the unexpected file and rerun the audit to show a pass.

> “This is the real dependency-free CLI reading staged, unstaged, and untracked Git paths. Tax declared only its adjustment file, but the worktree also changed `src/quote.js`. Runway names the drift and rejects handoff. After that unexpected change is removed, the same audit passes. This is advisory—not write enforcement—but a declaration alone is no longer enough.”

**2:10–2:31 — Technical credibility**

Show a prepared terminal with `npm test` completed, then briefly show `web/skills/runway/SKILL.md`.

> “Twenty-seven tests cover the fixture, collision logic, dependency evidence, invalid transitions, concurrent writers, stale locks, file-boundary and stale-audit guards, and real Git drift. The included Codex skill makes declare, reserve, audit, verify, and handoff a reusable protocol.”

**2:31–2:45 — Codex contribution and close**

Show `03_build_log.md`, then return to the hero.

> “Codex with GPT-5.6-terra helped build and pressure-test the shared engine, CLI, dashboard, and skill. Runway makes agent scope accountable at both ends: declared before code, proven against the diff after.”

## Capture checklist

- Dashboard starts in its initial state; use **Replay judge demo** if needed.
- Upload `docs/runway-judge-demo.png` as the first Devpost project image.
- Upload `docs/runway-diff-proof.png` as the second image; it carries declared scope, repository grounding, diff conformance, and the focused test result in one frame.
- Upload `docs/runway-architecture.svg` as the architecture visual if Devpost accepts SVG; otherwise export it to PNG without altering its content.
- No notifications, bookmarks, credentials, API keys, or unrelated tabs are visible.
- Exact collision values are readable at 1080p.
- Terminal is already in `web`; commands are pasted, not typed slowly.
- The real CLI segment visibly says `git worktree`, names the unexpected file, and shows the handoff rejection.
- `npm test` output is captured from a fresh final run and visibly says 27 passed.
- Audio is clear; music, if any, stays below narration.
- Public YouTube visibility is tested in a signed-out/incognito window.
- Final duration is below three minutes.

## Claims to make — and not make

Say: **code-scope contract**, **declare before code, prove the diff after**, **actual Git changed-file audit**, **repository-grounded declarations**, and **advisory, not write enforcement**.

Do not say: universal semantic analysis, autonomous intent detection, distributed locking, runtime write enforcement, guaranteed safe merge, symbol-level diff enforcement, or Git/tests executed by the browser.

## Final account-bound checklist

- [ ] Click **Start project** on the registered OpenAI Build Week Devpost account; the 2026-07-19 read-only check showed no accessible project draft yet.
- [ ] Confirm `https://github.com/vivekyarra/runway` is public and the default branch contains the final static demo, README, license, tests, and submission kit.
- [ ] Run every command in the README from a clean clone.
- [ ] Record, trim, upload, and publish the audible YouTube video under three minutes.
- [ ] Verify the YouTube video and repository from a signed-out browser.
- [ ] Paste the public YouTube URL into Devpost.
- [ ] Run `/feedback` in the core-build Codex thread and paste the resulting Session ID into Devpost.
- [ ] Select **Developer Tools** and paste the copy from this file.
- [ ] Add the free test path: clone repo -> `cd web` -> `node bin/demo-server.mjs` -> open `http://127.0.0.1:4174`.
- [ ] Add `https://vivekyarra.github.io/runway/` as the primary free test path and keep the local path above as fallback.
- [ ] Submit before **Jul 21, 2026, 5:00 PM PT**; do not use the deadline hour for feature work.
- [ ] Open the final Devpost entry in a signed-out window and verify every link.
