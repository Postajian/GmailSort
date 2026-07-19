<#
  G9-Release.ps1 - GmailView store-release kit (W2-5).
  One command: bump version -> verify (all tests) -> local commit + tag -> store zip
  -> changelog draft. NEVER submits anything to the Chrome Web Store, never pushes.

  Usage (from anywhere):
    powershell -ExecutionPolicy Bypass -File tools\G9-Release.ps1 -DryRun     # show the plan only
    powershell -ExecutionPolicy Bypass -File tools\G9-Release.ps1             # patch bump (x.y.Z+1)
    powershell -ExecutionPolicy Bypass -File tools\G9-Release.ps1 -Bump minor # x.Y+1.0
    powershell -ExecutionPolicy Bypass -File tools\G9-Release.ps1 -Version 0.21.0
    -AllowDirty  : allow releasing with uncommitted changes (default: refuse)
    -NoTag       : skip creating the vX.Y.Z-stable tag

  Respects the no-reload rule: the version bump is committed AND verified before the
  script declares it safe; reload the extension only after this script succeeds.
#>
param(
  [ValidateSet('patch','minor','major')] [string]$Bump = 'patch',
  [string]$Version = '',
  [switch]$DryRun,
  [switch]$AllowDirty,
  [switch]$NoTag
)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

if(-not (Test-Path "$repo\manifest.json")){ throw "manifest.json not found - run from the GmailView repo." }

# Current + next version
$manifestRaw = Get-Content "$repo\manifest.json" -Raw
if($manifestRaw -notmatch '"version":\s*"([0-9]+)\.([0-9]+)\.([0-9]+)"'){ throw "Could not read version from manifest.json" }
$cur = "$($Matches[1]).$($Matches[2]).$($Matches[3])"
if($Version){
  if($Version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+$'){ throw "-Version must be x.y.z" }
  $next = $Version
} else {
  $ma=[int]$Matches[1]; $mi=[int]$Matches[2]; $pa=[int]$Matches[3]
  switch($Bump){
    'patch' { $pa++ } 'minor' { $mi++; $pa=0 } 'major' { $ma++; $mi=0; $pa=0 }
  }
  $next = "$ma.$mi.$pa"
}

# Changelog scope: since the last vX.Y.Z-stable tag
$lastTag = (git tag --list 'v*-stable' --sort=-creatordate | Select-Object -First 1)
$range = if($lastTag){ "$lastTag..HEAD" } else { "HEAD" }
$commitCount = [int](git rev-list --count $range 2>$null)

$dirty = @(git status --porcelain).Count
$relDir = "C:\Users\Postajian\Desktop\G9\G9 HQ\12_Store_Assets\releases"
$zipPath = Join-Path $relDir "GmailView-v$next.zip"
$notesPath = Join-Path $relDir "RELEASE_NOTES_v$next.md"

Write-Host ""
Write-Host "=== GmailView release plan ===" -ForegroundColor Cyan
Write-Host "  Version:    $cur -> $next"
Write-Host "  Changelog:  $commitCount commits since $(if($lastTag){$lastTag}else{'repo start'})"
Write-Host "  Verify:     npm run verify (syntax checks + full test suite)"
Write-Host "  Commit+tag: release commit$(if(-not $NoTag){" + tag v$next-stable"}) (LOCAL only - you push)"
Write-Host "  Store zip:  $zipPath (manifest + icons + src + options)"
Write-Host "  Notes:      $notesPath (draft - edit before pasting into the store)"
Write-Host "  Submits:    NOTHING (you upload the zip in the Chrome dashboard yourself)"
Write-Host ""
if($dirty -gt 0){ Write-Host "  NOTE: $dirty uncommitted files in the repo." -ForegroundColor Yellow }
if($DryRun){ Write-Host "DryRun - nothing was changed." -ForegroundColor Green; return }

if($dirty -gt 0 -and -not $AllowDirty){
  throw "Working tree has $dirty uncommitted files. Commit them first (releases should be reproducible) or re-run with -AllowDirty."
}

# 1) Bump versions (manifest + package.json kept in sync)
$manifestRaw = $manifestRaw -replace '"version":(\s*)"[0-9.]+"', ('"version":$1"' + $next + '"')
Set-Content "$repo\manifest.json" -Value $manifestRaw -Encoding utf8 -NoNewline
$pkgRaw = Get-Content "$repo\package.json" -Raw
$pkgRaw = $pkgRaw -replace '"version":(\s*)"[0-9.]+"', ('"version":$1"' + $next + '"')
Set-Content "$repo\package.json" -Value $pkgRaw -Encoding utf8 -NoNewline
Write-Host "Version bumped to $next" -ForegroundColor Green

# 2) Verify - on failure, revert the bump and abort
Write-Host "Running npm run verify..." -ForegroundColor Cyan
npm run verify
if($LASTEXITCODE -ne 0){
  git checkout -- manifest.json package.json
  throw "VERIFY FAILED - version bump reverted, nothing released. Fix tests first."
}
Write-Host "Verify passed." -ForegroundColor Green

# 3) Changelog draft (from git history, before the release commit)
if(-not (Test-Path $relDir)){ New-Item -ItemType Directory -Path $relDir -Force | Out-Null }
$notes = @("# GmailView v$next - release notes draft", "", "> Draft generated from git history ($range). Rewrite in store-friendly language before submitting.", "")
$notes += (git log $range --no-merges --pretty="- %s")
$notes -join "`r`n" | Out-File $notesPath -Encoding utf8 -Force
Write-Host "Changelog draft: $notesPath" -ForegroundColor Green

# 4) Local release commit + tag
git add manifest.json package.json
git commit -m "release: v$next store package" | Out-Null
if(-not $NoTag){ git tag "v$next-stable" }
Write-Host "Committed$(if(-not $NoTag){" + tagged v$next-stable"}) (local only - YOU run git push --tags)" -ForegroundColor Green

# 5) Store zip (extension files only)
$staging = Join-Path $env:TEMP "gmailview_rel_$next"
if(Test-Path $staging){ Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null
Copy-Item "$repo\manifest.json" $staging
foreach($d in @('icons','src','options')){ Copy-Item "$repo\$d" $staging -Recurse }
if(Test-Path $zipPath){ Remove-Item $zipPath -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath
try { Remove-Item $staging -Recurse -Force -ErrorAction Stop } catch { Start-Sleep -Milliseconds 300; Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue }
Write-Host ("Store zip: {0} ({1:N0} KB)" -f $zipPath, ((Get-Item $zipPath).Length/1KB)) -ForegroundColor Green

Write-Host ""
Write-Host "=== DONE - next steps (manual, by you) ===" -ForegroundColor Cyan
Write-Host "  1. Read + polish the notes draft, then upload the zip at https://chrome.google.com/webstore/devconsole"
Write-Host "  2. git push --tags when ready (nothing was pushed)."
Write-Host "  3. Extension is committed + verified, so reloading it in Chrome is SAFE now."
