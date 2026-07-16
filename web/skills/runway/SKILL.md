---
name: runway
description: Coordinate two or more coding agents working in the same JavaScript or TypeScript repository. Use when a task may overlap another agent's files, exported symbols, API contracts, pricing logic, routes, or validation work; reserve a bounded Runway lane before editing and leave an evidence-backed handoff when done.
---

# Runway

Use the Runway CLI from the Runway repository (`node bin/runway.mjs`) or set `RUNWAY_CLI` to its absolute path and invoke `node "$RUNWAY_CLI"`.

## Before editing

1. Initialize state if `.runway/state.json` does not exist:

   ```powershell
   node bin/runway.mjs init --root .
   ```

2. Inspect the local JS/TS surface:

   ```powershell
   node bin/runway.mjs scan --root . --write
   ```

3. Declare only the files, exported symbols, and behavioral contracts you actually expect to touch. Inspect the JSON result from `lane create`; it contains `clearance.state` and any exact collision evidence.

   ```powershell
   node bin/runway.mjs lane create --root . --id <lane> --agent "Codex / <role>" --task "<outcome>" --files "src/a.ts" --symbols "exportedSymbol" --contracts "api-contract"
   ```

4. Only when `clearance.state` is `clear` or `caution`, reserve the lane before editing:

   ```powershell
   node bin/runway.mjs lane reserve --root . --id <lane>
   ```

## Clearance rules

- If Runway returns `hold`, do **not** reserve or edit the overlapping behavior. Narrow the scope, coordinate with the owner, or declare a reroute with `lane reroute`, then inspect its clearance result again.
- Treat `caution` as a review signal, not permission to broaden the task.
- Do not describe a guessed file, symbol, command outcome, or test result as evidence.
- Runway is heuristic coordination support; it cannot guarantee a conflict-free merge.

## During and after work

1. Keep edits inside the reserved scope. If the scope expands, update the lane first.
2. Run focused verification.
3. Leave a receipt that another agent can trust:

   ```powershell
   node bin/runway.mjs lane handoff --root . --id <lane> --evidence "<command actually run>" --result "passing" --note "<remaining risk or next step>"
   ```

4. Report the lane ID, verification command/outcome, and any remaining risk in the final task summary.
