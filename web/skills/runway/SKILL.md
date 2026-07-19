---
name: runway
description: Coordinate two or more coding agents working in the same JavaScript or TypeScript repository. Declare bounded scope before editing, honor holds, check the actual Git changed-file set against that scope, run real verification, and leave an evidence-backed handoff.
---

# Runway

Runway is a local, cooperative code-scope contract: declare before code, then prove the changed files stayed inside the lane before handoff. It is not an agent runtime, write lock, merge solver, or proof of correctness.

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

2. Inventory and persist the local JavaScript/TypeScript surface before declaring work.

   ~~~powershell
   node $env:RUNWAY_CLI scan --root . --write
   ~~~

   The persisted scan reports common named exports, imports, and routes. It grounds declared files and symbols and contributes one-hop relative-import evidence as a non-blocking review signal. It does not infer intent or turn dependency proximity into a hard hold.

3. Declare only the files, exported symbols, and behavioral contracts you actually expect to touch. At least one category is required. Read the JSON result from lane create; it contains `clearance`, `grounding`, and the exact collision evidence. Resolve unknown declared files or symbols before treating the declaration as repository-grounded.

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
- A dependency-edge caution means the declared files are connected by the persisted scan. Inspect the edge; it is evidence for review, not proof of incompatible intent.
- Do not describe a guessed file, a command you did not run, or a test result you did not observe as evidence.
- Keep edits within the reserved scope. If the scope expands, reroute and inspect clearance before making the expanded change.
- Runway is heuristic coordination support. It cannot guarantee a conflict-free merge.

## During and after work

1. Run focused verification in the target repository.
2. Audit the current Git worktree before handoff. Run this in the lane's dedicated, clean worktree so unrelated pre-existing changes do not contaminate the result. Runway reads staged, unstaged, and untracked paths, ignores its own `.runway` state, and blocks handoff if any changed file falls outside the declaration.

   ~~~powershell
   node $env:RUNWAY_CLI lane audit --root . --id <lane>
   ~~~

   If the audit reports `unexpectedFiles`, revert or coordinate those edits, or reroute and reserve a truthful expanded declaration before continuing. Reroute and reserve both invalidate an older audit.

3. Hand off only an airborne lane with a passing, current scope audit and the command you actually ran with its observed result.

   ~~~powershell
   node $env:RUNWAY_CLI lane handoff --root . --id <lane> --evidence "<command actually run>" --result "passing" --note "<remaining risk or next step>"
   ~~~

4. Report the lane ID, diff-audit result, verification command and outcome, and any remaining risk in the final task summary.

The audit is file-level conformance, not semantic enforcement. It catches undeclared changed paths; it cannot prove that edits inside an allowed file matched the declared symbol or contract, and a process can still ignore the protocol.
