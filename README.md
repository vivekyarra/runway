# Runway

> Pre-edit scope clearance for parallel Codex agents.

Before agents edit, Runway asks them to declare the files, exported symbols, and behavioral contracts they expect to touch. It compares those declarations, names the matching scope behind a hold, and records operator-supplied verification evidence at handoff.

## What Runway is - and is not

Runway is a local planning gate for cooperative coding agents. It is not an agent orchestrator, file-locking runtime, merge-conflict solver, or proof that a change is safe.

Agents voluntarily declare bounded scope before editing. Runway scores declared file, symbol, contract, and module-area overlap, explains a hold with named evidence, and keeps a compact handoff receipt. Its CLI separately inventories common named JavaScript/TypeScript exports, imports, and routes; that scan does not infer intent or automatically change clearance.

This is deliberately a transparent local heuristic. It does not enforce writes, read private prompts, predict every dependency conflict, or guarantee a conflict-free merge.

## Why it exists

Worktrees isolate where agents edit, and file-claim tools can react when editing begins. The missing pre-edit question is: given the code surface each agent says it intends to change, should either agent hold, reroute, or proceed - and what evidence supports that decision?

Runway makes that decision reviewable while a change is still cheap to redirect.

## What works today

- A browser dashboard with a deterministic multi-agent Parcel Ops scenario.
- A dependency-free Node CLI that initializes local control state, scans JS/TS surface metadata, creates and transitions declared lanes, and writes handoff receipts.
- Bounded local concurrency protection for CLI writes: exclusive state lock, reload-under-lock, and same-directory atomic state replacement.
- A reusable Codex skill for declaring scope, honoring holds, and attaching actual verification evidence.
- A bundled fixture, tests, and a checked-in static demo that need no keys, account, or hosted service.

## Requirements and supported path

The verified path is Windows PowerShell with Node.js 20.19 or newer. Node 24 was used for this build and test pass. The checked-in static demo requires only Node; source development also requires npm.

No API key, account, model call, CDN, or network service is required to run the product.

## Dashboard quick start

From the repository's web folder:

~~~powershell
npm ci
npm run dev
~~~

Open the Vite URL. The Tax lane begins on hold because its declared scope overlaps Pricing at src/quote.js, quoteTotal, and the pricing contract. Select Tax, choose **Remove overlap & recheck**, reserve the now-clear lane, then hand it off.

The dashboard is a browser-local demonstration. It does not run shell commands in the browser. Its displayed passing evidence is pre-recorded from the fixture tests and is copied into the receipt; use the CLI workflow below to record evidence from a command you actually ran.

For a source build:

~~~powershell
npm run lint
npm test
npm run build
~~~

## No-rebuild judge path

The checked-in web/demo folder is a portable static build. From the web folder:

~~~powershell
node bin/demo-server.mjs
~~~

Open http://127.0.0.1:4174. No package installation or rebuild is needed. After changing source, regenerate the checked-in demo with:

~~~powershell
npm run package:demo
~~~

## CLI demo

All control state is local to the target repository in .runway/state.json. Scan output is informational; clearance still compares the declared lane scope.

~~~powershell
# From this repository's web folder:
node bin/runway.mjs scan --root fixtures\parcel-ops

# This creates ignored demo state only under fixtures\parcel-ops\.runway.
node bin/runway.mjs init --root fixtures\parcel-ops --demo
node bin/runway.mjs status --root fixtures\parcel-ops

# Tax is held until its declared scope is narrowed, then rechecked.
node bin/runway.mjs lane reroute --root fixtures\parcel-ops --id tax-adjustment --files "src/tax/adjustments.js" --symbols "calculateTaxAdjustment" --contracts "tax-adjustment"
node bin/runway.mjs lane reserve --root fixtures\parcel-ops --id tax-adjustment

# Run this command yourself before recording it as evidence.
node --test fixtures/parcel-ops/tests/tax.test.mjs
node bin/runway.mjs lane handoff --root fixtures\parcel-ops --id tax-adjustment --evidence "node --test fixtures/parcel-ops/tests/tax.test.mjs" --result "passing" --note "Tax adjustment path verified after reroute."
~~~

A lane must declare at least one file, symbol, or contract. Runway permits a handoff only when the lane is airborne and the operator supplies recorded evidence; the operator must only record evidence from a command actually run. Init intentionally replaces control state, so use it only for a new Runway state.

### Local write protocol

Mutating CLI commands cooperate through .runway/state.lock. A writer obtains an exclusive local lock, reloads state while holding it, writes a temporary file in the same directory, and atomically replaces state.json. This prevents ordinary concurrent local CLI writers from losing each other's updates.

The lock is a cooperative local-filesystem protocol, not a security boundary or distributed lock. It is tested for normal local Windows-style repository use; do not treat it as a guarantee on SMB, NFS, or against a process that ignores the protocol.

## Use with Codex

Install the included skill from the web folder, then use the absolute CLI path when working in a target repository:

~~~powershell
$runwayCheckout = (Resolve-Path .).Path
$skillsRoot = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.codex\skills'
New-Item -ItemType Directory -Force -Path $skillsRoot | Out-Null
Copy-Item -Recurse -Force (Join-Path $runwayCheckout 'skills\runway') (Join-Path $skillsRoot 'runway')

# In the Codex session that will coordinate a target repository:
$env:RUNWAY_CLI = Join-Path $runwayCheckout 'bin\runway.mjs'
~~~

If Codex was already open, start a new session so it discovers the installed skill. The skill calls the local CLI; it never needs an API key.

## Verification

From web:

~~~powershell
npm test
npm run lint
npm run build
npm run package:demo
~~~

## Architecture

~~~text
Codex skill --> Runway CLI --> .runway/state.json
                      |
                      +--> scans JS/TS exports, imports, and routes
                      +--> compares declared file, symbol, contract, and module-area scope
                      +--> emits an evidence-backed handoff receipt

React dashboard --> same deterministic lane/collision model --> portable JSON export
~~~

## Codex collaboration record

Codex accelerated the build from idea selection through adversarial verification. Its key decisions and contributions were:

- **Product:** compare alternatives and position Runway as pre-edit declared-scope clearance rather than generic agent orchestration.
- **Engineering:** build the shared collision model, state-transition guards, Windows path and symbol-case fixes, and the bounded local atomic-write protocol.
- **Design:** make the hold -> reroute -> reserve -> evidence-backed handoff decision readable in one static, no-account demo.
- **QA:** generate edge-case tests for collision ordering, scope validation, concurrent writers, stale locks, and the actual fixture evidence commands.

The core-build session of record is 019f6e9b-8401-78c0-a71b-56273ec52b3f, authenticated as gpt-5.6-terra and recorded in 03_build_log.md. That log records the decisions, test evidence, and remaining bounded risks.

For Devpost copy, the video flow, and the remaining account-bound submission checklist, see [SUBMISSION.md](SUBMISSION.md).

## License

MIT. See [LICENSE](LICENSE).