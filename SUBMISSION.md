# Submission handoff

Track: **Developer Tools**. Rules and required fields: 00_facts.md.

## Devpost copy

**Tagline:** Pre-edit scope clearance for parallel Codex agents.

**Short description:** Before parallel coding agents edit, Runway asks them to declare files, exported symbols, and behavioral contracts. It compares the declared scope, explains a hold with exact matching evidence, and records operator-supplied verification evidence at handoff. The dashboard, local CLI, Codex skill, source fixture, and no-rebuild static demo are included.

## Under-3-minute video flow

1. **0:00-0:18** - Open with the distinction: worktrees isolate edits and file claims react to edits; Runway is the pre-edit declared-scope decision layer.
2. **0:18-0:55** - Open the no-rebuild demo. Show the held Tax lane and the exact declared overlap with Pricing: src/quote.js, quoteTotal, and pricing.
3. **0:55-1:25** - Use **Remove overlap & recheck**, reserve the cleared Tax lane, and hand it off. State that the dashboard shows pre-recorded fixture-test evidence; it does not execute a shell command in the browser.
4. **1:25-2:05** - Run scan, lane create, and lane reserve against web/fixtures/parcel-ops. Explain that scanning inventories JS/TS surface metadata while clearance compares lane declarations.
5. **2:05-2:35** - Open web/skills/runway/SKILL.md and explain the Codex protocol: declare, inspect clearance, work only when clear, run real verification, hand off.
6. **2:35-2:55** - Show 03_build_log.md, the tests, and the static-demo path. End with the bounded promise: transparent local JS/TS heuristic coordination, not runtime enforcement or merge proof.

**Required spoken Codex/GPT-5.6 explanation:** “I used Codex with GPT-5.6-terra to compare the product direction, implement the shared collision engine and local CLI, and pressure-test concurrency and state-transition edge cases. The resulting decisions and verification evidence are recorded in 03_build_log.md.”

## Before submitting

- Publish this repository and add its URL to Devpost.
- Record and upload the public, audible YouTube video above, under three minutes.
- Core-build session of record: 019f6e9b-8401-78c0-a71b-56273ec52b3f, authenticated as gpt-5.6-terra and recorded in 03_build_log.md.
- Run /feedback in that core-build Codex thread and paste its resulting Session ID into Devpost.
- Follow the no-rebuild path in README.md from a clean copy of web/demo plus bin/demo-server.mjs.
- Re-run the README verification commands; confirm the repository, README, and license are public and current.