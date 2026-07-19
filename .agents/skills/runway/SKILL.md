---
name: runway
description: Use the repository's Runway Codex plugin before parallel JavaScript or TypeScript edits to declare scope, reserve a lane, honor collision holds, and verify Git-conformant handoff evidence.
---

# Runway source-checkout entrypoint

Read and follow the canonical plugin skill at `.agents/plugins/plugins/runway/skills/runway/SKILL.md` completely before editing.

In this source checkout, the bundled dependency-free CLI is `.agents/plugins/plugins/runway/bin/runway.mjs`. Resolve it to an absolute path before use. The plugin's `PreToolUse` guard is configured in `.agents/plugins/plugins/runway/hooks/hooks.json` and must be reviewed through `/hooks` after installation.

Do not broaden the plugin's claim: it blocks out-of-lane direct Codex patch calls, while the post-command Git audit catches other changed-file drift. It is a bounded guardrail, not universal write enforcement.
