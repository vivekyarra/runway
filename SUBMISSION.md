# Submission handoff

Track: **Developer Tools**. Rules and required fields: `00_facts.md`.

## Devpost copy

**Tagline:** Air-traffic control for parallel Codex agents.

**Short description:** Runway gives each coding agent a declared work lane before it edits. It surfaces exact file, exported-symbol, and behavioral-contract overlap; holds unsafe work; and leaves evidence-backed handoffs. The dashboard, local CLI, reusable Codex skill, source fixture, and no-rebuild static demo are all included here.

## Under-3-minute video flow

1. **0:00-0:18** - State the parallel-agent merge-surprise problem and open the no-rebuild demo.
2. **0:18-0:55** - Show the held Tax lane, the exact overlap (`src/quote.js`, `quoteTotal`, `pricing`), and why Pricing remains the protected owner.
3. **0:55-1:25** - Apply the safe reroute, reserve the cleared lane, and create the evidence-backed handoff.
4. **1:25-2:05** - Run `scan`, `lane create`, and `lane reserve` against `web/fixtures/parcel-ops`; show the JSON evidence rather than claiming magic analysis.
5. **2:05-2:35** - Open `web/skills/runway/SKILL.md` and explain the Codex protocol: declare, inspect clearance, work only when clear, verify, hand off.
6. **2:35-2:55** - Show `03_build_log.md`, tests, and the static demo path. State the bounded promise: local JS/TS heuristic coordination, not formal merge proof.

## Before submitting

- Publish this repository and add its URL to Devpost.
- Record/upload the public, audible YouTube video above (under 3 minutes).
- Run `/feedback` in the core-build Codex thread and paste its Session ID into Devpost.
- Follow the no-rebuild test path in `README.md` on a clean machine.
- Re-run the three verification commands in `README.md`; confirm the repo, README, and license are public and current.
