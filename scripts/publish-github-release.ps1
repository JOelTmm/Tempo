# Publie la release v1.0.0 avec les .exe locaux (nécessite: gh auth login)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Setup = Join-Path $Root "release\Tempo-Setup.exe"
$Portable = Join-Path $Root "release\Tempo-Portable.exe"

foreach ($f in @($Setup, $Portable)) {
  if (-not (Test-Path $f)) {
    Write-Host "Manquant: $f — lancez d'abord: npm run dist:win"
    exit 1
  }
}

$gh = Get-Command gh -ErrorAction SilentlyContinue
if (-not $gh) {
  Write-Host "Installez GitHub CLI (winget install GitHub.cli) puis: gh auth login"
  exit 1
}

gh release create v1.0.0 $Setup $Portable `
  --repo JOelTmm/Tempo `
  --title "Tempo 1.0.0" `
  --notes "Première version Windows — installateur et portable."

Write-Host "OK — https://github.com/JOelTmm/Tempo/releases/latest"