---
name: runway
description: Coordinate two or more coding agents working in the same JavaScript or TypeScript repository. Before editing, declare bounded files, exported symbols, and behavioral contracts; inspect clearance, honor holds, run real verification, and leave an evidence-backed handoff.
---

# Runway

Runway is a local, cooperative pre-edit clearance protocol. It compares lane declarations; it is not an agent runtime, write lock, merge solver, or proof of correctness.

Set RUNWAY_CLI to the absolute path of the Runway checkout before using this skill from another repository:

~~~powershell
$env:RUNWAY_CLI = 'C:\path\to\Runway\web\bin\runway.mjs'
~~~

Use node $env:RUNWAY_CLI for every command below. It only writes the target repository's .runway control-state folder.

## Before editing

1. If the target does not have .runway/state.json, initialize it once. Do not use init on an active Runway state because init intentionally replaces it.

   ~~~powershell
   node $env:RUNWAY_CLI init --root .
   ~~~

2. Optionally inventory the local JavaScript/TypeScript surface.

   ~~~powershell
   node $env:RUNWAY_CLI scan --root . --write
   ~~~

   Scan reports common named exports, imports, and routes separately. It helps you make an honest declaration but does not automatically feed the collision score.

3. Declare only the files, exported symbols, and behavioral contracts you actually expect to touch. At least one category is required. Read the JSON result from lane create; it contains clearance.state and exact declared collision evidence.

   ~~~powershell
   node $env:RUNWAY_CLI lane create --root . --id <lane> --agent "Codex / <role>" --task "<outcome>" --files "src/a.ts" --symbols "exportedSymbol" --contracts "api-contract"
   ~~~

4. Only if clearance.state is clear or caution, reserve the lane before editing.

   ~~~powershell
   node $env:RUNWAY_CLI lane reserve --root . --id <lane>
   ~~~

## Clearance rules

- If the result is hold or blocked, do not edit the overlapping behavior. Coordinate with the owner or narrow and re-declare the scope, then inspect clearance again.
- To reroute a queued or held lane, provide the full new declaration. Rerouting resets the lane for a fresh clearance decision; it is not a claim that the new scope is safe.

  ~~~powershell
  node $env:RUNWAY_CLI lane reroute --root . --id <lane> --files "src/new-area.ts" --symbols "newSymbol" --contracts "new-contract"
  ~~~

- Treat caution as a review signal, not permission to broaden work without another declaration.
- Do not describe a guessed file, a command you did not run, or a test result you did not observe as evidence.
- Keep edits within the reserved scope. If the scope expands, reroute and inspect clearance before making the expanded change.
- Runway is heuristic coordination support. It cannot guarantee a conflict-free merge.

## During and after work

1. Run focused verification in the target repository.
2. Hand off only an airborne lane, with the command you actually ran and its observed result.

   ~~~powershell
   node $env:RUNWAY_CLI lane handoff --root . --id <lane> --evidence "<command actually run>" --result "passing" --note "<remaining risk or next step>"
   ~~~

3. Report the lane ID, verification command and outcome, and any remaining risk in the final task summary.