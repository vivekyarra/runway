# Runway submission kit

Final copy-and-record handoff for OpenAI Build Week. Track: **Developer Tools**.

## Devpost fields

**Project name:** Runway

**Tagline:** Replay duplicate work. Stop the next collision.

**Repository:** https://github.com/vivekyarra/runway

**Live demo:** https://vivekyarra.github.io/runway/

**Verification workflow:** https://github.com/vivekyarra/runway/actions/workflows/pages.yml

**Built with:** Codex, GPT-5.6-terra, React, Vite, Node.js

**Supported platform:** The hosted demo works in modern desktop browsers. The CLI requires Node.js 20.19+ and Git; it is tested on Windows and by Linux CI.

**Short description:** Parallel coding agents can independently implement the same behavior. Runway replays that failure from exact Git history, then prevents recurrence with declared code scope, CLI-executed proof, and a post-command Git audit.

## Full project description

### Inspiration

This is not a synthetic-only problem. One public ESLint issue produced three independent implementations. Two later pull requests were closed to avoid duplicating work. Git eventually exposed the coordination failure, but only after contributors had already written code.

Worktrees isolate edit locations and merge tools resolve completed changes. Neither asks the earlier question: before two agents start, do they intend to change the same behavior?

### What it does

Runway connects forensic proof to prevention.

**Collision Replay** accepts two Git ranges, resolves exact commit SHAs, extracts changed JavaScript/TypeScript paths and changed function declarations, and feeds both scopes through Runway's deterministic collision engine. The bundled public replay reconstructs ESLint PRs #20248 and #20487. It finds four shared paths and the same changed function, then emits a SHA-256-fingerprinted JSON artifact. The replay is explicitly counterfactual: it proves the overlap existed; it does not claim Runway was deployed in that repository.

**Live lanes** turn the lesson into a code-scope contract. Before implementation, each agent declares expected files, exported symbols, and behavioral contracts. Runway returns an inspectable clear, caution, protected-owner, or hold decision. Direct scope overlap can stop the later lane; shallow dependency proximity remains a caution, not false certainty.

**Verified handoff** closes the cooperative-declaration gap. `lane verify` executes the exact trusted test command itself, captures exit status, duration, output hashes, and byte counts, then re-reads staged, unstaged, and untracked Git paths. Only a successful command plus a conformant post-command audit creates a receipt. Manual passing handoffs are rejected.

The build includes an interactive React control tower, dependency-free Node CLI, reusable Codex skill, Parcel Ops source fixture, 30 tests, JSON state import/export, a published replay artifact, and a checked-in no-rebuild demo.

### How we built it

The replay path, CLI, and dashboard share the same dependency-free collision core. The CLI persists `.runway/state.json`, scans common JS/TS exports and relative imports, guards lane transitions, serializes local writers with an exclusive lock, and atomically replaces state.

The browser opens on the public collision replay, then moves to a concrete prevention flow. Pricing owns `src/quote.js`, `quoteTotal`, and the `pricing` contract. Tax independently declares all three and is held before editing. Rerouting Tax to `src/tax/adjustments.js` clears it. Checkout remains only a caution because an import is review evidence, not proof of conflicting intent.

### How Codex and GPT-5.6 were used

Codex with GPT-5.6-terra was the engineering collaborator, not a runtime chat wrapper. It helped narrow the problem, implement the core, replay extractor, CLI, dashboard, skill, concurrency protocol, and adversarial tests. QA found and fixed Windows path normalization, symbol-case, ownership ordering, invalid transitions, concurrent writes, stale locks, diff drift, false-positive replay symbols, and inaccurate claims.

The session of record is `019f6e9b-8401-78c0-a71b-56273ec52b3f`; the evidence trail is in `03_build_log.md`.

### Challenges

The central challenge was credibility. A fixture alone could make Runway look like a linter built around its own example. Collision Replay grounds the problem in public Git history while preserving provenance and a clear counterfactual disclosure.

The second challenge was self-reported proof. Recording an operator's claim that tests passed was not enough. `lane verify` now owns command execution and performs the Git audit afterward, so a test that passes while creating undeclared drift still cannot produce a handoff.

The engineering challenge was safe local mutation. Runway locks writers, reloads state under lock, performs same-directory atomic replacement, and detects lane changes that occur while a verification command is running.

### Accomplishments

- Reconstructed a documented duplicate-work incident from exact public Git refs.
- Produced an inspectable replay with four shared paths, one shared changed function, source links, exact SHAs, and a verifiable fingerprint.
- Converted that historical failure into a pre-edit hold using the same collision engine.
- Distinguished direct overlap from an import-only caution.
- Made test evidence Runway-executed rather than operator-asserted.
- Rejected handoff after a passing command when the fresh Git audit found an undeclared file.
- Shipped a public no-login demo, reproducible fixture, Codex skill, and 30 passing tests.

### What we learned

The strongest proof of a coordination tool is not a simulated swarm; it is a real failure reconstructed from source history. The most useful control point is also not an opaque confidence score. It is a small, inspectable contract: declared before work, tested by the tool, and checked against Git after work.

### What's next

Next steps are opt-in adapters for more languages, hunk-level symbol conformance, and a shared transport for distributed teams. This build does not claim compiler-grade analysis, distributed locking, runtime write enforcement, autonomous intent detection, or guaranteed conflict-free merges.

## Judging-criteria proof map

| Criterion | Judge-visible proof | Verifiable artifact |
|---|---|---|
| Technical implementation (25%) | Exact-ref replay, shared engine, executed proof, post-command Git audit, concurrent state protocol | `web/src/core/replay.js`, `web/bin/runway.mjs`, 30 tests |
| Design (25%) | Real incident first; exact refs on demand; one guided prevention path; hold versus caution is legible | Hosted no-rebuild dashboard and two submission images |
| Potential impact (25%) | Public duplicate work becomes measurable, then preventable before another implementation begins | ESLint replay plus live Pricing/Tax scope contract |
| Quality of idea (25%) | One loop connects historical collision evidence to pre-edit prevention and verified handoff | Collision Replay -> Declare -> Reserve -> Run proof -> Audit -> Receipt |

## Exact public video plan - target 2:50

Record at 1080p, browser zoom 100%, with readable terminal text and clear narration. Keep the final upload under three minutes.

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

**0:00-0:24 - Real failure first**

Show the replay card at the top of the hosted demo.

> "One public issue produced three independent implementations. Two later pull requests were closed to avoid duplicate work. Runway reconstructs two exact Git ranges and finds four shared paths plus the same changed function. This is real history, not a simulated agent swarm."

**0:24-0:43 - Provenance, not theater**

Expand **Inspect exact refs + receipt** and point to the SHAs, source links, disclosure, and fingerprint.

> "Every ref is inspectable, and the JSON artifact is fingerprinted. This is a counterfactual replay: Runway was not deployed there. It proves the overlap existed and shows what would have been held for review."

**0:43-1:13 - Turn the failure into prevention**

Show the Tax hold, then click **Reroute held lane** and **Reserve clear lane**.

> "Now the prevention contract. Pricing is airborne. Tax declared the same file, exported symbol, and pricing behavior, so Runway protects the owner and holds the later lane before editing. I reroute Tax to its own module and reserve it. Checkout is only a caution because an import is evidence, not proof of conflict."

**1:13-1:34 - Honest browser boundary**

Click **Audit changed files** and **Create fixture receipt**.

> "The browser uses a clearly labeled fixture snapshot; it does not pretend to execute Git or tests. It demonstrates the same decision model and preserves declared scope, diff conformance, and fixture evidence."

**1:34-2:10 - Executed proof and post-command audit**

Switch to the prepared terminal. Run the first failing `lane verify`, then the corrected one.

> "The real CLI executes this focused test itself. The test passes, but the fresh Git audit finds undeclared `src/quote.js`, so no handoff is created. I remove only that drift and rerun. Now Runway records the real exit code, timing, output hashes, and conformant changed files before issuing the receipt."

**2:10-2:31 - Reproducible engineering**

Show successful `replay verify`, `npm test`, and briefly the bundled skill.

> "The replay artifact verifies, and thirty tests cover extraction, tampering, collision logic, real Git drift, command failure, lane mutation, concurrent writers, and lifecycle guards. The Codex skill turns the flow into a reusable agent protocol."

**2:31-2:50 - Close**

Return to the replay and live-flow overview.

> "Codex with GPT-5.6-terra helped build and pressure-test this end to end. Runway does one job: prove duplicate implementation happened, then stop the next collision before code and verify the result after."

## Capture checklist

- Use `docs/runway-judge-demo.png` as the first image and `docs/runway-real-replay.png` as the second.
- Keep exact source URLs, commit refs, overlap evidence, and disclosure readable.
- Use Runway-owned UI only; do not show third-party logos, hover source links, expose third-party marks in the browser chrome, or copy third-party screenshots. The replay card intentionally uses a generic source label while preserving the real links for inspection.
- The terminal must visibly show the passing test followed by `unexpectedFiles: ["src/quote.js"]` and no handoff, then the corrected receipt.
- Capture a fresh `npm test` result showing 30 passing tests.
- Hide notifications, credentials, bookmarks, unrelated tabs, and local personal paths where practical.
- Test audio, public YouTube visibility, repository, and demo links while signed out.
- Final duration must remain under three minutes.

## Claims to make - and not make

Say: **real Git-history collision replay**, **counterfactual**, **exact refs**, **code-scope contract**, **Runway-executed proof**, **post-command Git audit**, and **advisory, not enforcement**.

Do not say: Runway caught the original ESLint work, nobody noticed until merge, signed artifact, universal semantic analysis, autonomous intent detection, distributed lock, runtime write enforcement, symbol-level diff enforcement, or guaranteed safe merge.

## Final account-bound checklist

- [ ] Start or open the project on the registered OpenAI Build Week Devpost account.
- [ ] Confirm the public repository contains the final demo, README, license, tests, replay notice, and submission kit.
- [ ] Run the README path from a clean clone.
- [ ] Record, trim, upload, and publish the audible YouTube video under three minutes.
- [ ] Verify YouTube, repository, and live demo while signed out.
- [ ] Paste the public video URL into Devpost.
- [ ] Run `/feedback` in the core-build Codex thread and paste the returned Session ID into Devpost.
- [ ] Select **Developer Tools**, paste this copy, and use the two new replay-first images.
- [ ] Add the hosted demo as the primary test path and `cd web; node bin\demo-server.mjs` as the fallback.
- [ ] Submit before **Jul 21, 2026, 5:00 PM PT**.
- [ ] Open the submitted entry signed out and verify every link.
