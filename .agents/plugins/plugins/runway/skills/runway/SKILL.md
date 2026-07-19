---
name: runway
description: Coordinate parallel Codex agents in a JavaScript or TypeScript repository. Use before editing to declare bounded files, symbols, and behavioral contracts; honor collision holds; let the bundled CLI execute proof and audit Git; and leave an evidence-backed handoff. The optional plugin hook blocks direct Codex patch edits outside the active reserved lane.
---

# Runway

Runway is a local code-scope contract for parallel Codex work: declare before code, guard the common patch path, execute proof, and audit Git before handoff. It is not a merge solver, compiler-grade analyzer, or universal write sandbox.

## Resolve the bundled CLI

This plugin includes `bin/runway.mjs` two directories above this `SKILL.md`. Resolve that file to an absolute path and set `RUNWAY_CLI` once before using the commands below. Never guess a cache path.

PowerShell shape:

~~~powershell
$env:RUNWAY_CLI = '<absolute plugin root>\bin\runway.mjs'
~~~

POSIX shape:

~~~bash
export RUNWAY_CLI='<absolute plugin root>/bin/runway.mjs'
~~~

Use `node $env:RUNWAY_CLI` on PowerShell or `node "$RUNWAY_CLI"` on POSIX for every command.

## Bind this Codex session to a lane

Launch Codex with one lane identifier per session or process:

~~~powershell
$env:RUNWAY_LANE = 'tax-adjustment'
codex
~~~

~~~bash
RUNWAY_LANE=tax-adjustment codex
~~~

After plugin installation, inspect and trust the hook with `/hooks`. The hook is inert outside repositories containing `.runway/state.json`. Inside a Runway-enabled repository it fails closed for direct Codex patch calls when `RUNWAY_LANE` is missing, unknown, not airborne, or targets undeclared files.

## Before editing

1. Initialize once, then persist the JavaScript/TypeScript surface:

   ~~~powershell
   node $env:RUNWAY_CLI init --root .
   node $env:RUNWAY_CLI scan --root . --write
   ~~~

2. Create the lane whose ID exactly matches `RUNWAY_LANE`. Declare only the expected files, exported symbols, and behavioral contracts:

   ~~~powershell
   node $env:RUNWAY_CLI lane create --root . --id $env:RUNWAY_LANE --agent "Codex / <role>" --task "<outcome>" --files "src/a.ts" --symbols "exportedSymbol" --contracts "api-contract"
   ~~~

3. Read the JSON `clearance`, `grounding`, and exact collision evidence. Resolve unknown declarations. Reserve only a `clear` or `caution` lane:

   ~~~powershell
   node $env:RUNWAY_CLI lane reserve --root . --id $env:RUNWAY_LANE
   ~~~

## Clearance rules

- If clearance is `hold` or `blocked`, do not edit. Coordinate with the owner or reroute to a truthful non-overlapping scope.
- A dependency-edge caution is evidence for review, not proof of incompatible intent.
- If scope expands, reroute and reserve again before the new edit:

  ~~~powershell
  node $env:RUNWAY_CLI lane reroute --root . --id $env:RUNWAY_LANE --files "src/new-area.ts" --symbols "newSymbol" --contracts "new-contract"
  node $env:RUNWAY_CLI lane reserve --root . --id $env:RUNWAY_LANE
  ~~~

- Never describe a guessed path or unexecuted command as evidence.

## Verify and hand off

Use a dedicated clean worktree. Ask Runway to execute a trusted focused command; it captures the exit status, duration, output hashes, and byte counts, then audits staged, unstaged, and untracked Git paths:

~~~powershell
node $env:RUNWAY_CLI lane verify --root . --id $env:RUNWAY_LANE --command "node --test <focused-test>" --note "<remaining risk>"
~~~

A failing command, timeout, unexpected changed file, or lane mutation prevents handoff. Report the lane ID, command result, Git audit, output hashes, and remaining risk. Manual passing handoffs are intentionally rejected.

## Guard boundary

The bundled `PreToolUse` hook guards Codex `apply_patch`/`Edit`/`Write` calls. It does not cover every shell command, hosted tool, MCP implementation, editor, or external process; Codex documentation also treats lifecycle hooks as guardrails rather than complete enforcement boundaries. The post-command Git audit remains the final backstop. A process can still ignore or disable the protocol, so never claim universal runtime enforcement.

## Historical replay

For two suspected duplicate Git ranges:

~~~powershell
node $env:RUNWAY_CLI replay --root . --left "<base-a>..<head-a>" --right "<base-b>..<head-b>" --left-label "<label-a>" --right-label "<label-b>" --out replay.json
node $env:RUNWAY_CLI replay verify --file replay.json
~~~

Replay is counterfactual evidence. Never claim Runway was deployed on the historical repository or caused its outcome.
