# Runway final video package

The submission video is fully rendered from real Runway product states and checkable repository evidence. It contains no simulated agent-typing footage and no generated incident reenactment.

## Deliverables

- `runway-build-week-demo.mp4` - final 1280x720 H.264/AAC video, 2:31.8, audible, with burned-in English captions
- `scene-09-end.png` - 1280x720 YouTube thumbnail
- `runway-demo.en.srt` - uploadable English caption file
- `narration.txt` - exact narration transcript
- `runway-elevenlabs-voiceover.mp3` - generated narration source
- `build-video.ps1` - reproducible ffmpeg render
- `scene-*.png` and `scene-*.svg` - storyboard evidence frames

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
5. Open the final URL signed out, confirm audio and 720p playback, then paste it into Devpost.

## Rebuild

From this directory, with ffmpeg available:

```powershell
.\build-video.ps1
```

The render consumes only checked-in frames, the narration MP3, and the caption file.
