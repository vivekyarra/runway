# Runway

> Air-traffic control for parallel Codex agents.

Runway gives every coding agent a small, explicit work lane before it edits code. It detects declared overlap at the file, exported-symbol, and behavioral-contract level, holds risky lanes before a diff exists, and records a compact evidence-backed handoff when work is complete.

## Why it exists

Git tells a team about file conflicts late. Parallel agents can collide earlier and more subtly: two agents can independently change the same exported symbol, response contract, or pricing rule. Runway makes that overlap visible while it is still cheap to reroute.

This is coordination support, not a formal merge or correctness guarantee. Its JS/TS scanner and collision engine are intentionally transparent: every warning includes the exact declared overlap that caused it.

## What works today

- A polished browser dashboard with a deterministic four-agent demo.
- A dependency-free Node CLI that initializes control state, scans JS/TS exports/imports, creates lanes, reserves/holds them, reroutes scope, and writes handoff receipts.
- A reusable Codex skill that makes lane reservation and evidence capture part of an agent’s workflow.
- A bundled `parcel-ops` fixture that lets judges run the product without a key, account, or hosted service.
- Node test coverage for collision scoring, handoff receipts, source scanning, and CLI persistence.

## Quick start

Requirements: Node.js 20.19+ (Node 24 was used to verify this build).

```powershell
cd D:\OpenAI-BuildWeek\web
npm install
npm run dev
```

Open the local URL Vite prints. The dashboard starts with the `parcel-ops` scenario: the Tax lane is held because it overlaps the Pricing lane on `src/quote.js`, `quoteTotal`, and the `pricing` contract. Select it, choose **Apply safe reroute**, then reserve it to see the conflict clear.

For a production build:

```powershell
npm run build
npm run preview
```

## No-rebuild judge path

The checked-in `web/demo` folder is a static build of the dashboard. It needs only Node.js 20.19+; no package installation or rebuild is required.

```powershell
cd D:\OpenAI-BuildWeek\web
node bin/demo-server.mjs
```

Open `http://127.0.0.1:4174`. To regenerate that portable demo after a source change, run `npm run package:demo` and commit the resulting `demo` folder.

## CLI demo

All commands are local. Runway stores project state in `.runway/state.json`.

```powershell
cd D:\OpenAI-BuildWeek\web

# Inspect the supplied real source fixture.
node bin/runway.mjs scan --root fixtures\parcel-ops

# Create a standalone demo control state in any target repository.
node bin/runway.mjs init --root fixtures\parcel-ops --demo
node bin/runway.mjs status --root fixtures\parcel-ops

# Reroute the held demo lane away from Pricing, then reserve it.
node bin/runway.mjs lane reroute --root fixtures\parcel-ops --id tax-adjustment --files "src/tax/adjustments.js" --symbols "calculateTaxAdjustment" --contracts "tax-adjustment"
node bin/runway.mjs lane reserve --root fixtures\parcel-ops --id tax-adjustment
```

The `init --demo` command changes only the fixture’s ignored `.runway` folder. Delete that folder to reset the CLI fixture.

## Use with Codex

Install the included skill into Codex, then ask Codex to use `$runway` whenever two or more agents may work in the same repository.

```powershell
$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME ".codex" }
Copy-Item -Recurse -Force D:\OpenAI-BuildWeek\web\skills\runway (Join-Path $codexHome "skills\runway")
```

The skill directs Codex to declare scope, reserve a lane, respect a hold, attach actual test evidence, and hand work off safely. It uses the local CLI rather than an API key.

## Verification

```powershell
cd D:\OpenAI-BuildWeek\web
npm test
npm run build
npm run lint
```

## Architecture

```text
Codex skill ──calls──> Runway CLI ──writes──> .runway/state.json
                               │
                               ├── scans JS/TS exports + imports
                               ├── scores file/symbol/contract overlap
                               └── emits a lane handoff receipt

React dashboard ──> same deterministic lane/collision model ──> portable JSON export
```

## Codex contribution

Codex was used to evaluate the idea against the official rubric, design the bounded collision model, implement the dashboard/CLI/fixture, and run an iterative test-and-review loop. `03_build_log.md` records the concrete decisions and verification work; the Runway skill makes the same agent discipline available to users.

For the prepared Devpost copy, video flow, and final account-bound submission checklist, see [SUBMISSION.md](SUBMISSION.md).

## License

MIT. See [LICENSE](LICENSE).
