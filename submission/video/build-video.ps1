param(
  [string]$Ffmpeg = 'ffmpeg',
  [string]$Output = 'runway-build-week-demo.mp4'
)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot

try {
  $filterGraph = @'
[0:v]trim=start=0:end=65.38,setpts=PTS-STARTPTS[browser_open];
[1:v]trim=start=5:end=24,setpts=PTS-STARTPTS[terminal_guard];
[1:v]trim=start=24:end=33,setpts=(PTS-STARTPTS)*1.591111[terminal_drift];
[1:v]trim=start=33:end=43,setpts=(PTS-STARTPTS)*1.239[terminal_handoff];
[1:v]trim=start=43:end=53,setpts=(PTS-STARTPTS)*1.001[terminal_install];
[terminal_guard][terminal_drift][terminal_handoff][terminal_install]concat=n=4:v=1:a=0[terminal_main];
[2:v]trim=start=0.5:end=10.61,setpts=PTS-STARTPTS[terminal_tests];
[0:v]trim=start=71.41:end=92,setpts=PTS-STARTPTS[browser_close];
[browser_open][terminal_main][terminal_tests][browser_close]concat=n=4:v=1:a=0,fps=30,format=yuv420p,pad=1280:800:0:0:color=#071311,drawbox=x=0:y=720:w=1280:h=1:color=#28453f:t=fill,subtitles=runway-demo.en.srt:force_style='Alignment=2,FontName=Segoe UI,FontSize=10,PrimaryColour=&H00F7FBF8,Outline=0,Shadow=0,BorderStyle=1,MarginV=9'[video]
'@ -replace "`r?`n", ''

  $arguments = @(
    '-hide_banner',
    '-y',
    '-i', 'browser-live-capture.mp4',
    '-i', 'terminal-live-capture.mp4',
    '-i', 'terminal-tests-live-capture.mp4',
    '-i', 'runway-elevenlabs-voiceover.mp3',
    '-filter_complex', $filterGraph,
    '-map', '[video]',
    '-map', '3:a:0',
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=151.4:d=0.35',
    '-t', '151.8',
    '-movflags', '+faststart',
    $Output
  )

  & $Ffmpeg @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg exited with code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}
