# Idea selection and evidence review

This document records why Runway was selected and what the current build can prove. It intentionally contains no builder-assigned scores or win probabilities. Those numbers would be the project grading itself and are not evidence.

## Why Runway was selected

The candidate set covered Apps, Work, Developer Tools, and Education. Runway was selected because it offered the strongest combination of:

- a problem parallel coding-agent users recognize immediately;
- a concrete failure that can be demonstrated with exact code artifacts;
- a local implementation that judges can reproduce without an account or API key;
- a short interaction with a visible unsafe state, corrective action, and receipt;
- room to state limitations without making the core product disappear.

The rejected directions either needed sensitive-domain trust, integrations, longitudinal data, or a much broader simulator to feel complete. This is a product-scope decision, not a claim that Runway was objectively the highest-scoring idea.

## Current product sentence

> Runway replays duplicate implementation from exact Git history, then prevents recurrence with a declared code-scope contract, Runway-executed proof, and a post-command Git audit.

The shorter hook is: **Replay duplicate work. Stop the next collision.**

## Evidence against the published criteria

| Criterion | Checkable evidence | Remaining limitation |
|---|---|---|
| Technical implementation | Exact-ref Git replay; shared deterministic core; dependency-free CLI; Runway-executed proof; post-command Git audit; local writer lock and atomic replacement; 30 passing tests | Scanner and replay declaration extraction are pattern-based rather than compiler-grade; state protocol is local, not distributed |
| Design | Public no-rebuild demo opens with a real replay, keeps exact refs on demand, then shows a legible hold -> reroute -> reserve -> audit -> receipt path | Browser uses labeled fixture records and does not execute Git or tests |
| Potential impact | A documented duplicate-work incident makes the cost concrete; the live protocol redirects overlap before edits and rejects undeclared drift after tests | Requires teams and agents to adopt the protocol; no production adoption study is claimed |
| Quality of idea | One loop connects historical collision proof, pre-edit scope clearance, executed verification, and post-command Git conformance | The replay is counterfactual and JS/TS-focused; adjacent agent-lane products still exist |

## Product correction after adversarial review

An external review identified three valid credibility problems:

1. Builder-assigned scores were circular and have been removed.
2. Judge-profile inference was weak evidence and has been removed from product decisions and submission positioning.
3. Cooperative declarations were the load-bearing weakness. Runway now executes a trusted verification command itself, checks the actual Git worktree after that command, and rejects a failed command, unexpected path, stale lane, or self-reported passing handoff.

The third change narrows rather than hides the remaining weakness. The audit catches undeclared changed files. It does not prevent an agent from writing, detect every behavioral change within a declared file, or force a process to participate.

## Differentiation boundary

General agent control planes route agents and tasks. Runway connects a different loop: **prove duplicate implementation from source history, then install a code-specific prevention contract**. Before work, symbols and behavioral contracts make intent reviewable. After work, Runway-executed tests and fresh Git paths make the handoff checkable.

The differentiator was chosen after rejecting two tempting directions. A fake multi-agent typing simulation would be theater, not evidence. Broad blast-radius prediction would require semantic-analysis claims the current engine cannot support. The selected replay uses existing product mechanics, exact public refs, and a checkable counterfactual disclosure.

The public pitch should demonstrate that boundary instead of claiming a new category or naming a competitor. The strongest sequence is:

1. two public Git ranges reconstruct a real duplicate-work overlap;
2. exact file + symbol + contract overlap causes a live hold;
3. an import edge causes only a caution;
4. reroute and reserve isolate the work;
5. Runway executes the test, re-reads Git, and creates a receipt only when both pass.

## Completion gate

No subjective score decides that the build is ready. The release gate is objective:

- clean install succeeds;
- all tests, lint, build, and static packaging pass;
- the public replay resolves exact SHAs, names the overlap, and passes artifact verification;
- the real Git drift test blocks handoff after a passing command and names the unexpected path;
- the hosted guided flow reaches a diff-conformant receipt without console errors;
- README and submission copy preserve every material limitation;
- public links and CI are green;
- video and images visibly carry the proof a judge might never click through to inspect.

Account-bound submission actions and the final recorded video remain separate from code readiness.
