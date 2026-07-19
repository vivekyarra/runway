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

> Runway gives parallel coding agents a code-scope contract: declare expected files, symbols, and behavior before coding, then prove the actual Git changed-file set stayed inside that lane before handoff.

The shorter hook is: **Declare before code. Prove the diff after.**

## Evidence against the published criteria

| Criterion | Checkable evidence | Remaining limitation |
|---|---|---|
| Technical implementation | Shared deterministic core; dependency-free CLI; JS/TS repository scan; exclusive local writer lock and atomic state replacement; actual Git changed-file audit; guarded lane lifecycle; 27 passing tests | Scanner is pattern-based rather than compiler-grade; state protocol is local, not distributed |
| Design | Public no-rebuild demo; exact file/symbol/contract evidence; legible hold -> reroute -> reserve -> diff audit -> handoff path; caution is visually distinct from hold | Browser uses a labeled fixture diff snapshot and does not execute Git or tests |
| Potential impact | Prevents duplicate planned behavior work before edits and catches undeclared changed paths before accepting handoff | Requires teams and agents to adopt the protocol; no production adoption study is claimed |
| Quality of idea | Two-sided boundary between planned code scope and actual changed code; narrower than general agent routing and earlier than merge review | Adjacent agent-lane products exist; file conformance cannot prove semantic conformance inside an allowed file |

## Product correction after adversarial review

An external review identified three valid credibility problems:

1. Builder-assigned scores were circular and have been removed.
2. Judge-profile inference was weak evidence and has been removed from product decisions and submission positioning.
3. Cooperative declarations were the load-bearing weakness. Runway now checks the actual Git worktree before handoff, persists the audit, invalidates it after reservation or reroute, and rejects missing, failed, or stale audits.

The third change narrows rather than hides the remaining weakness. The audit catches undeclared changed files. It does not prevent an agent from writing, detect every behavioral change within a declared file, or force a process to participate.

## Differentiation boundary

General agent control planes route agents and tasks. Runway controls one code-specific failure boundary: **planned scope versus actual changed code**. Before work, symbols and behavioral contracts make intent reviewable. After work, Git paths make scope conformance checkable.

The public pitch should demonstrate that boundary instead of claiming a new category or naming a competitor. The strongest sequence is:

1. exact file + symbol + contract overlap causes a hold;
2. an import edge causes only a caution;
3. reroute and reserve isolate the work;
4. an actual undeclared Git path blocks handoff;
5. a conformant diff plus recorded test evidence creates the receipt.

## Completion gate

No subjective score decides that the build is ready. The release gate is objective:

- clean install succeeds;
- all tests, lint, build, and static packaging pass;
- the real Git drift test blocks handoff and names the unexpected path;
- the hosted guided flow reaches a diff-conformant receipt without console errors;
- README and submission copy preserve every material limitation;
- public links and CI are green;
- video and images visibly carry the proof a judge might never click through to inspect.

Account-bound submission actions and the final recorded video remain separate from code readiness.
