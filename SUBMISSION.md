# Runway submission kit

This file is the final copy-and-record handoff for OpenAI Build Week. Track: **Developer Tools**.

## Devpost fields

**Project name:** Runway

**Tagline:** Stop two coding agents from changing the same behavior before either one edits.

**Repository:** https://github.com/vivekyarra/runway

**Live demo:** https://vivekyarra.github.io/runway/

**Verification workflow:** https://github.com/vivekyarra/runway/actions/workflows/pages.yml

**Built with:** Codex, GPT-5.6-terra, React, Vite, Node.js

**Supported platform:** The hosted browser demo works on modern desktop browsers. The verified CLI path is Windows PowerShell with Node.js 20.19+; the included static server is platform-neutral wherever Node can run.

**Short description:** Runway is pre-edit declared-scope clearance for parallel Codex agents. Agents declare files, exported symbols, and behavioral contracts before editing. Runway grounds them in a JS/TS repository scan, explains exact collisions, holds unsafe work, and preserves real verification evidence at handoff.

## Full project description

### Inspiration

Parallel coding agents make teams faster, but Git usually reveals coordination failures after code has diverged. Worktrees isolate edit locations and merge tools resolve completed changes; neither asks whether two agents intend to change the same behavior before they begin. That is the cheapest moment to redirect work.

### What it does

Runway adds a pre-edit clearance step. Each Codex agent declares a bounded work lane using expected files, exported symbols, and behavioral contracts. A deterministic engine compares active lanes and returns one of four inspectable states: clear, caution, protected owner, or hold.

A persisted repository scan grounds declared files and symbols and contributes non-blocking one-hop relative-import warnings. Direct file, symbol, or contract overlap can stop a later lane. Every decision names its evidence. Once rerouted and verified, an airborne lane can create a handoff receipt containing scope, the actual command recorded by the operator, its observed result, and remaining risk.

The submission includes an interactive React control tower, a dependency-free Node CLI, a reusable Codex skill, a real Parcel Ops source fixture, 23 tests, browser-local JSON state import/export, and a checked-in no-rebuild demo.

### How we built it

The dashboard and CLI share the same dependency-free collision core. The CLI persists `.runway/state.json`, scans common JavaScript/TypeScript exports and relative imports, validates lane transitions, and protects concurrent local writers with an exclusive lock plus same-directory atomic replacement.

The bundled Parcel Ops scenario is intentionally concrete: Pricing already owns `src/quote.js`, `quoteTotal`, and the `pricing` contract. Tax declares the same behavior and is held before editing. A safe reroute isolates Tax in `src/tax/adjustments.js`; it can then be reserved and handed off with its focused test evidence. Checkout remains only a caution because its scanned import reaches Pricing without direct declared overlap.

### How Codex and GPT-5.6 were used

Codex with GPT-5.6-terra was the engineering collaborator, not a runtime chat wrapper. It compared 20 candidate products against the published judging criteria, chose the narrow pre-edit clearance boundary, implemented the core/CLI/dashboard/skill, and performed adversarial QA.

That QA found and fixed path normalization, JavaScript symbol-case, ownership ordering, invalid state transitions, concurrent state writes, stale locks, and inaccurate product claims. The session of record is `019f6e9b-8401-78c0-a71b-56273ec52b3f`; the decision and verification trail is in `03_build_log.md`.

### Challenges

The hardest product decision was resisting an oversized “agent orchestration” claim. Declarations are cooperative, and a lightweight JS/TS scanner cannot know intent. We therefore split direct collision evidence from repository proximity: exact declared overlap can hold work, while scanned import edges remain visible cautions. The result is more explainable and more credible.

The hardest engineering problem was local concurrent CLI mutation. Runway now serializes writers, reloads state under lock, atomically replaces the state file, and recovers locks left by dead processes. Tests reproduce concurrent creation and duplicate-lane races.

### Accomplishments

- Intercepts the bundled three-signal behavior collision before either competing edit begins.
- Grounds 100% of declared files and exported symbols in the bundled source scan.
- Separates blocking declaration overlap from non-blocking repository dependency review.
- Completes the full hold -> reroute -> reserve -> verified handoff flow in four guided actions.
- Runs from a public one-click URL with no account, API key, hosted backend, package install, or rebuild on the judge path.
- Passes 23 automated tests plus lint, production build, static-demo packaging, and browser-flow QA.

### What we learned

Agent coordination needs a small, inspectable protocol more than another opaque prediction. Files are necessary but insufficient; named code symbols and behavioral contracts make intent reviewable. Repository analysis is valuable when it stays evidence, not false certainty. Finally, handoff quality improves when verification is a required state transition rather than prose added at the end.

### What's next

Next steps are opt-in adapters for additional languages, Git diff comparison against the reserved declaration, and a team transport for shared lanes. These would preserve the current explainable evidence model. A distributed service, compiler-grade analysis, or write enforcement is not claimed by this build.

## Judging-criteria proof map

| Criterion | What to show | Verifiable evidence |
|---|---|---|
| Technical implementation (25%) | Shared core, scan-grounded scope, dependency evidence, guarded transitions, concurrent CLI writes | `web/src/core/runway.js`, `web/bin/runway.mjs`, 23 passing tests |
| Design (25%) | The collision is understandable immediately and the resolution is one guided path | No-rebuild dashboard; intercept strip; exact evidence; four-step judge demo |
| Potential impact (25%) | Parallel Codex teams can redirect duplicate behavior work before code diverges | Pricing/Tax hold and safe reroute in the real bundled fixture |
| Quality of idea (25%) | A pre-edit semantic lane, not generic orchestration, merge tooling, or post-hoc observability | File + symbol + contract declaration, transparent clearance, verified handoff |

## Exact public video plan — target 2:40

Record at 1080p with the browser at 100% zoom and terminal text large enough to read. Keep the mouse still when speaking. Do one continuous narration pass, then trim dead time. Do not exceed 2:55.

### Shot list and word-for-word narration

**0:00–0:18 — Hero and problem**

Open the public hosted demo and show the dashboard hero and collision strip.

> “Two coding agents can work in separate worktrees and still change the same behavior. Git tells us after code diverges. Runway is the decision layer before editing: declare expected files, symbols, and contracts, then get an evidence-backed clearance.”

**0:18–0:48 — Exact collision**

Select Tax and point to the three evidence rows and repository grounding.

> “Pricing is already airborne. Tax independently declared the same file, `src/quote.js`, the same exported symbol, `quoteTotal`, and the same pricing contract. Runway protects the established owner and holds Tax before either competing edit begins. Every signal is named, and the declarations are grounded against the scanned repository.”

**0:48–1:12 — Guided resolution**

Click **Reroute held lane**, then **Reserve clear lane**.

> “I reroute Tax to the isolated adjustment module. Runway removes the owned overlap, recomputes clearance, and now lets me reserve the lane. Checkout still shows a lower-severity dependency review because its real scanned import reaches the pricing file. That is a caution, not a fake claim of conflict.”

**1:12–1:30 — Handoff proof**

Click **Create verified handoff** and show the receipt.

> “After focused verification, the airborne lane creates a handoff containing bounded scope, the exact test command, its observed passing result, and remaining risk. The browser demo never executes a hidden shell command; the CLI records operator-supplied evidence honestly.”

**1:30–2:02 — Real CLI and scan**

Show a terminal in `web`. Run `node bin/runway.mjs scan --root fixtures\parcel-ops --write`, then `node bin/runway.mjs status --root fixtures\parcel-ops`. Scroll just enough to show `persisted: true`, grounding, and conflict evidence.

> “This is the real dependency-free CLI against the included Parcel Ops source. The persisted JavaScript and TypeScript scan inventories exports and relative imports, grounds each declaration, and adds one-hop dependency evidence to the same deterministic collision engine used by the dashboard.”

**2:02–2:25 — Technical credibility**

Show a prepared terminal with `npm test` completed, then briefly show `web/skills/runway/SKILL.md`.

> “Twenty-three tests cover the fixture, collision ordering, path and symbol semantics, dependency evidence, invalid transitions, concurrent writers, duplicate lanes, and stale-lock recovery. The included Codex skill makes declare, inspect, reserve, verify, and handoff a reusable agent protocol.”

**2:25–2:43 — Codex contribution and close**

Show `03_build_log.md`, then return to the hero.

> “I used Codex with GPT-5.6-terra to compare the product direction, implement the shared engine, CLI, dashboard, and skill, and pressure-test the concurrency and state-machine edge cases. The session and evidence are recorded in the build log. Runway stops duplicate agent work at its cheapest point: before the first edit.”

## Capture checklist

- Dashboard starts in its initial state; use **Replay judge demo** if needed.
- Upload `docs/runway-judge-demo.png` as the first Devpost project image.
- Upload `docs/runway-architecture.png` as the architecture visual.
- No notifications, bookmarks, credentials, API keys, or unrelated tabs are visible.
- Exact collision values are readable at 1080p.
- Terminal is already in `web`; commands are pasted, not typed slowly.
- `npm test` output is captured from a fresh final run and visibly says 23 passed.
- Audio is clear; music, if any, stays below narration.
- Public YouTube visibility is tested in a signed-out/incognito window.
- Final duration is below three minutes.

## Claims to make — and not make

Say: **pre-edit declared-scope clearance**, **transparent local heuristic**, **repository-grounded declarations**, **one-hop dependency review**, and **operator-supplied verification evidence**.

Do not say: universal semantic analysis, autonomous intent detection, distributed locking, runtime write enforcement, guaranteed safe merge, or tests executed by the browser.

## Final account-bound checklist

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
