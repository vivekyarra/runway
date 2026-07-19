# Runway video upload handoff

Large video artifacts are intentionally excluded from Git. The local upload package contains only what is needed for the account-bound YouTube step.

## Local deliverables

- `runway-build-week-demo.mp4` - final 1280x720 H.264/AAC video, 2:31.8, audible, uncropped, and caption-free
- `scene-09-end.png` - 1280x720 YouTube thumbnail

Do not upload the old SRT. The previous subtitles summarized the narration instead of transcribing it verbatim, so the final video contains no captions.

## YouTube upload copy

**Title**

Runway - Stop Duplicate Agent Work Before It Starts | OpenAI Build Week

**Description**

Runway is a control tower for parallel Codex work. It compares planned files, exported symbols, and behavioral contracts before implementation; a native Codex `PreToolUse` hook blocks supported out-of-lane patches; and a fresh Git audit refuses handoff when the executed diff escapes the declared scope.

Live demo: https://vivekyarra.github.io/runway/

Source, plugin, CLI, tests, and replay artifact: https://github.com/vivekyarra/runway

The historical replay is deliberately honest: public human-authored Git history proves a real duplicate-implementation failure shape, not agent-collision prevalence. Agent-specific risk is grounded separately in official Codex guidance. Runtime decisions are deterministic and keyless. GPT-5.6 was used through Codex to build and pressure-test the parser, plugin, hook, CLI, concurrency protocol, interface, and 39-test suite.

Track: Developer Tools

#OpenAIBuildWeek #Codex #DeveloperTools #MultiAgent

## Account-bound upload steps

1. Upload `runway-build-week-demo.mp4` to the registered YouTube account.
2. Paste the title and description above and use `scene-09-end.png` as the thumbnail.
3. Do not attach a caption or SRT file.
4. Set visibility to **Public** and wait for HD processing to finish.
5. Open the final URL signed out, confirm audio and HD playback, then paste it into Devpost.
