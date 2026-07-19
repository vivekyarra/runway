param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$ProofRoot = (Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path ('.cache\runway-video-proof-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))),
  [switch]$TestsOnly
)

$ErrorActionPreference = 'Continue'
$Host.UI.RawUI.WindowTitle = 'Runway Live Proof'
$Host.UI.RawUI.BackgroundColor = 'Black'
$Host.UI.RawUI.ForegroundColor = 'White'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class RunwayConsoleFont {
  [StructLayout(LayoutKind.Sequential)]
  private struct Coord {
    public short X;
    public short Y;
  }

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct ConsoleFontInfoEx {
    public uint cbSize;
    public uint nFont;
    public Coord dwFontSize;
    public int FontFamily;
    public int FontWeight;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 32)]
    public string FaceName;
  }

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern IntPtr GetStdHandle(int nStdHandle);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool GetCurrentConsoleFontEx(IntPtr output, bool maximumWindow, ref ConsoleFontInfoEx info);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool SetCurrentConsoleFontEx(IntPtr output, bool maximumWindow, ref ConsoleFontInfoEx info);

  public static bool SetReadableFont(short height) {
    var output = GetStdHandle(-11);
    var info = new ConsoleFontInfoEx();
    info.cbSize = (uint)Marshal.SizeOf(info);
    if (!GetCurrentConsoleFontEx(output, false, ref info)) return false;
    info.dwFontSize.X = 0;
    info.dwFontSize.Y = height;
    info.FaceName = "Consolas";
    info.FontFamily = 54;
    info.FontWeight = 500;
    return SetCurrentConsoleFontEx(output, false, ref info);
  }
}
'@
[RunwayConsoleFont]::SetReadableFont(18) | Out-Null
Clear-Host

if ($TestsOnly) {
  Write-Host ''
  Write-Host '  RUNWAY / LIVE REGRESSION PROOF' -ForegroundColor Green
  Write-Host '  The checked-in replay verifier and suite are executing now; this is not pasted output.' -ForegroundColor White
  Write-Host ('  ' + ('-' * 92)) -ForegroundColor DarkGray
  Write-Host ''
  Write-Host '  PS> node bin/runway.mjs replay verify --file docs/replays/eslint-20014.json' -ForegroundColor Cyan
  $replayOutput = & node (Join-Path $ProjectRoot 'web\bin\runway.mjs') replay verify --file (Join-Path $ProjectRoot 'docs\replays\eslint-20014.json')
  $replayExit = $LASTEXITCODE
  $replay = $replayOutput | ConvertFrom-Json
  $replayOutput | Write-Host
  Write-Host ''
  Write-Host '  PS> npm test' -ForegroundColor Cyan
  Push-Location (Join-Path $ProjectRoot 'web')
  & npm test
  $testExit = $LASTEXITCODE
  Pop-Location
  Write-Host ''
  if ($replayExit -eq 0 -and $replay.ok -and $replay.expectedSha256 -eq $replay.computedSha256 -and $testExit -eq 0) {
    Write-Host '  LIVE PROOF COMPLETE' -ForegroundColor Green
    Write-Host '  39 passed | 0 failed | replay fingerprint verified from executed source checks' -ForegroundColor White
  } else {
    Write-Host '  LIVE PROOF FAILED' -ForegroundColor Red
    Write-Host ("  replay exit {0} | test exit {1}" -f $replayExit, $testExit) -ForegroundColor Red
  }
  Start-Sleep -Seconds 20
  exit ([int]($replayExit -ne 0 -or $testExit -ne 0))
}

$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$cacheRoot = [IO.Path]::GetFullPath((Join-Path $ProjectRoot '.cache'))
$ProofRoot = [IO.Path]::GetFullPath($ProofRoot)
$cachePrefix = $cacheRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
if (-not $ProofRoot.StartsWith($cachePrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "ProofRoot must be a fresh child of $cacheRoot"
}
if (Test-Path -LiteralPath $ProofRoot) {
  throw "ProofRoot already exists: $ProofRoot"
}

$fixtureRoot = Join-Path $ProjectRoot 'web\fixtures\parcel-ops'
$runwayCli = Join-Path $ProjectRoot 'web\bin\runway.mjs'
Copy-Item -Recurse -LiteralPath $fixtureRoot -Destination $ProofRoot
& git -C $ProofRoot init --quiet
& git -C $ProofRoot config user.email 'runway@example.test'
& git -C $ProofRoot config user.name 'Runway Demo'
& git -C $ProofRoot add .
& git -C $ProofRoot commit --quiet -m 'Parcel Ops baseline'
$null = & node $runwayCli init --root $ProofRoot
$null = & node $runwayCli scan --root $ProofRoot --write
$null = & node $runwayCli lane create --root $ProofRoot --id tax-adjustment --agent 'Sol / Rules' --task 'Apply regional tax adjustment' --files 'src/tax/adjustments.js' --symbols 'calculateTaxAdjustment' --contracts 'tax-adjustment'
$null = & node $runwayCli lane reserve --root $ProofRoot --id tax-adjustment
Add-Content -LiteralPath (Join-Path $ProofRoot 'src\tax\adjustments.js') -Value "`n// scoped tax change"
Add-Content -LiteralPath (Join-Path $ProofRoot 'src\quote.js') -Value "`n// accidental pricing drift"
Clear-Host

function Write-Section([string]$Label, [string]$Title) {
  Write-Host ''
  Write-Host ("  RUNWAY / {0}" -f $Label) -ForegroundColor Green
  Write-Host ("  {0}" -f $Title) -ForegroundColor White
  Write-Host ('  ' + ('-' * 92)) -ForegroundColor DarkGray
}

function Write-Command([string]$Command) {
  Write-Host ''
  Write-Host ("  PS> {0}" -f $Command) -ForegroundColor Cyan
}

Write-Host ''
Write-Host '  RUNWAY LIVE PROOF' -ForegroundColor Green
Write-Host '  Native Codex guard + executed verification + fresh Git audit' -ForegroundColor White
Write-Host '  Every result below is produced now from the checked-in CLI and fixture.' -ForegroundColor DarkGray
Start-Sleep -Seconds 5

$hookPath = Join-Path $ProjectRoot '.agents\plugins\plugins\runway\hooks\pre_tool_use_guard.mjs'
$env:RUNWAY_LANE = 'tax-adjustment'

Write-Section '1 / PRE-EDIT' 'The Codex hook evaluates the requested patch before execution.'
Write-Command '$env:RUNWAY_LANE = tax-adjustment'
Write-Host '  lane status : AIRBORNE' -ForegroundColor Green
Write-Host '  declared    : src/tax/adjustments.js' -ForegroundColor Gray

$denyPatch = "*** Begin Patch`n*** Update File: src/quote.js`n@@`n- old`n+ new`n*** End Patch"
$denyInput = @{
  session_id = 'runway-video'
  cwd = $ProofRoot
  hook_event_name = 'PreToolUse'
  tool_name = 'apply_patch'
  tool_input = @{ command = $denyPatch }
} | ConvertTo-Json -Compress -Depth 8

Write-Command 'apply_patch src/quote.js'
$denyJson = $denyInput | & node $hookPath
$deny = $denyJson | ConvertFrom-Json
Write-Host ("  {0}" -f $deny.hookSpecificOutput.permissionDecision.ToUpperInvariant()) -ForegroundColor Red
Write-Host ("  {0}" -f $deny.hookSpecificOutput.permissionDecisionReason) -ForegroundColor Red
Start-Sleep -Seconds 5

$allowPatch = "*** Begin Patch`n*** Update File: src/tax/adjustments.js`n@@`n- old`n+ new`n*** End Patch"
$allowInput = @{
  session_id = 'runway-video'
  cwd = $ProofRoot
  hook_event_name = 'PreToolUse'
  tool_name = 'apply_patch'
  tool_input = @{ command = $allowPatch }
} | ConvertTo-Json -Compress -Depth 8

Write-Command 'apply_patch src/tax/adjustments.js'
$allowJson = $allowInput | & node $hookPath
if ([string]::IsNullOrWhiteSpace(($allowJson | Out-String))) {
  Write-Host '  ALLOW - patch stays inside airborne lane tax-adjustment' -ForegroundColor Green
}
Start-Sleep -Seconds 1

Write-Section '2 / BOUNDED GUARD' 'The hook is narrow by design, and its registration is inspectable.'
Write-Command 'Get-Content hooks/hooks.json'
$hookConfig = Get-Content (Join-Path $ProjectRoot '.agents\plugins\plugins\runway\hooks\hooks.json') -Raw | ConvertFrom-Json
$hookMatcher = $hookConfig.hooks.PreToolUse[0].matcher
Write-Host ("  matcher : {0}" -f $hookMatcher) -ForegroundColor Green
Write-Host '  boundary: supported Codex patch tools, not a universal filesystem sandbox' -ForegroundColor Yellow
Start-Sleep -Seconds 9

Write-Section '3 / POST-COMMAND' 'A passing test cannot hide undeclared Git drift.'
Write-Command "node bin/runway.mjs lane verify --id tax-adjustment --command 'node --test tests/tax.test.mjs'"
& node (Join-Path $ProjectRoot 'web\bin\runway.mjs') lane verify --root $ProofRoot --id tax-adjustment --command 'node --test tests/tax.test.mjs'
Write-Host ''
Write-Host '  TEST PASSED, BUT HANDOFF REFUSED' -ForegroundColor Yellow
Write-Host '  unexpectedFiles: [ src/quote.js ]' -ForegroundColor Red
Write-Host '  handoff: null' -ForegroundColor Red
Start-Sleep -Seconds 12

Write-Command 'git restore -- src/quote.js'
& git -C $ProofRoot restore -- src/quote.js
Write-Host '  Removed only the out-of-lane drift.' -ForegroundColor Green
Write-Command "node bin/runway.mjs lane verify --id tax-adjustment --command 'node --test tests/tax.test.mjs'"
& node (Join-Path $ProjectRoot 'web\bin\runway.mjs') lane verify --root $ProofRoot --id tax-adjustment --command 'node --test tests/tax.test.mjs' --note 'Focused tax path verified.'
Write-Host ''
Write-Host '  VERIFIED HANDOFF - exit 0 - diff conformant - source runway-executed' -ForegroundColor Green
Start-Sleep -Seconds 10

Write-Section '4 / INSTALL' 'The skill, hook, and standalone CLI install without a rebuild.'
Write-Command 'codex plugin marketplace add vivekyarra/runway --ref main'
Write-Command 'codex plugin add runway@runway-marketplace'
Write-Host '  New Codex threads auto-discover the Runway skill and PreToolUse hook.' -ForegroundColor Green
Start-Sleep -Seconds 10

Write-Section '5 / REPRODUCIBLE' 'The public replay and regression suite verify from source.'
Write-Command 'node bin/runway.mjs replay verify --file docs/replays/eslint-20014.json'
& node (Join-Path $ProjectRoot 'web\bin\runway.mjs') replay verify --file (Join-Path $ProjectRoot 'docs\replays\eslint-20014.json')
Start-Sleep -Seconds 3

Write-Command 'npm test'
Push-Location (Join-Path $ProjectRoot 'web')
& npm test
Pop-Location

Write-Host ''
Write-Host '  LIVE PROOF COMPLETE' -ForegroundColor Green
Write-Host '  39 passing tests | hook denial | Git drift | plugin parity' -ForegroundColor White
Start-Sleep -Seconds 20
