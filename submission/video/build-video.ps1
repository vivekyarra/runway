param(
  [string]$Ffmpeg = 'ffmpeg',
  [string]$Output = 'runway-build-week-demo.mp4'
)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot

try {
  $scenes = @(
    @{ Path = '..\..\docs\runway-judge-demo.png'; Duration = 18.75; Focus = 'center'; Zoom = 1.06; Step = 0.00011 },
    @{ Path = 'scene-02-exact-refs.png'; Duration = 23.32; Focus = 'center'; Zoom = 1.07; Step = 0.00010 },
    @{ Path = '..\..\docs\runway-real-replay.png'; Duration = 7.00; Focus = 'center'; Zoom = 1.04; Step = 0.00018 },
    @{ Path = 'scene-03-rerouted.png'; Duration = 8.00; Focus = 'center'; Zoom = 1.04; Step = 0.00017 },
    @{ Path = 'scene-04-reserved.png'; Duration = 8.31; Focus = 'center'; Zoom = 1.04; Step = 0.00016 },
    @{ Path = '..\..\docs\runway-cli-proof.png'; Duration = 21.02; Focus = 'left'; Zoom = 1.22; Step = 0.00035 },
    @{ Path = '..\..\docs\runway-cli-proof.png'; Duration = 12.00; Focus = 'right'; Zoom = 1.20; Step = 0.00055 },
    @{ Path = 'scene-06-audited.png'; Duration = 6.00; Focus = 'center'; Zoom = 1.03; Step = 0.00018 },
    @{ Path = 'scene-07-receipt.png'; Duration = 6.69; Focus = 'center'; Zoom = 1.03; Step = 0.00017 },
    @{ Path = 'scene-08-repro.png'; Duration = 20.12; Focus = 'center'; Zoom = 1.05; Step = 0.00009 },
    @{ Path = 'scene-08-repro.png'; Duration = 12.00; Focus = 'center'; Zoom = 1.03; Step = 0.00008 },
    @{ Path = 'scene-09-end.png'; Duration = 8.61; Focus = 'center'; Zoom = 1.03; Step = 0.00012 }
  )

  $arguments = @('-hide_banner', '-y')
  foreach ($scene in $scenes) {
    $arguments += @('-loop', '1', '-framerate', '30', '-t', ([string]$scene.Duration), '-i', $scene.Path)
  }
  $arguments += @('-i', 'runway-elevenlabs-voiceover.mp3')

  $filters = @()
  for ($index = 0; $index -lt $scenes.Count; $index++) {
    $scene = $scenes[$index]
    $x = switch ($scene.Focus) {
      'left' { '0' }
      'right' { 'iw-iw/zoom' }
      default { 'iw/2-(iw/zoom/2)' }
    }
    $filters += "[$index`:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=#071311,setsar=1,zoompan=z='min(zoom+$($scene.Step),$($scene.Zoom))':x='$x':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30,setsar=1,trim=duration=$($scene.Duration),setpts=PTS-STARTPTS[v$index]"
  }

  $concatInputs = (0..($scenes.Count - 1) | ForEach-Object { "[v$_]" }) -join ''
  $filters += "${concatInputs}concat=n=$($scenes.Count):v=1:a=0[vcat]"
  $filters += "[vcat]subtitles=runway-demo.en.srt:force_style='FontName=Segoe UI,FontSize=22,PrimaryColour=&H00F7FBF8,OutlineColour=&HCC071311,BorderStyle=3,BackColour=&H99071311,Outline=1,Shadow=0,MarginV=26'[vout]"
  $filterGraph = $filters -join ';'

  $audioIndex = $scenes.Count
  $arguments += @(
    '-filter_complex', $filterGraph,
    '-map', '[vout]',
    '-map', "$audioIndex`:a:0",
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '18',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=151.4:d=0.35',
    '-shortest',
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
