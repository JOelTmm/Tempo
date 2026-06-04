# Genere l'installateur Windows Tempo dans release/
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "Build Tempo (Vite + Electron)..."
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Creation installateur (electron-builder)..."
cmd /c "npx electron-builder --win"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Termine. Fichiers dans: $Root\release"
Get-ChildItem "$Root\release" -Filter *.exe | ForEach-Object { Write-Host "  - $($_.Name)" }