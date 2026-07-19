# Runway final video package

The submission video combines an isolated live browser recording of the real Runway build with real terminal executions from the checked-in CLI, hook, replay verifier, and test suite. The cursor moves across the rendered product, hovers the controls being discussed, clicks the real guided-flow buttons, and selects the evidence text. It contains no simulated agent typing, generated incident reenactment, or desktop footage from unrelated applications.

## Deliverables

- `runway-build-week-demo.mp4` - final 1280x800 H.264/AAC video, 2:31.8, audible, with one-line burned-in English captions
- `browser-live-capture.mp4` - isolated 1280x720 live product capture with real DOM interaction
- `terminal-live-capture.mp4` - 1280x720 live hook, audit, handoff, install, and replay proof
- `terminal-tests-live-capture.mp4` - 1280x720 live 39-test completion proof
- `scene-09-end.png` - 1280x720 YouTube thumbnail
- `runway-demo.en.srt` - uploadable English caption file
- `narration.txt` - exact narration transcript
- `runway-elevenlabs-voiceover.mp3` - generated narration source
- `build-video.ps1` - reproducible ffmpeg render
- `capture-browser.mjs` - dependency-free Edge DevTools screencast capture
- `capture-terminal.ps1` - self-contained driver for the isolated terminal take; it creates a fresh disposable proof repository before executing the visible commands
- `scene-*.png` and `scene-*.svg` - storyboard evidence frames

The complete 1280x720 product or terminal frame is preserved without cropping. The final 80-pixel rail sits below that footage, separated by a divider, so every caption stays on one centered movie-style line and never covers the product.

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
3. Upload `runway-demo.en.srt` as English captions even though the video already burns them in.
4. Set visibility to **Public** and wait for HD processing to finish.
5. Open the final URL signed out, confirm audio and HD playback, then paste it into Devpost.

## Rebuild

From this directory, with ffmpeg available:

```powershell
.\build-video.ps1
```

The render consumes the three checked-in live captures, narration MP3, and one-line caption file. It retimes only bounded terminal segments so the executed proof remains synchronized with the narration; it does not crop or synthesize the captured product state. The terminal driver runs the replay verifier itself and prints completion only when its expected and computed fingerprints match and all 39 tests pass.
