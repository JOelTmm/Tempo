$sqlPath = Join-Path (Split-Path $PSScriptRoot -Parent) "supabase\ENABLE-REALTIME.sql"
$sql = Get-Content $sqlPath -Raw -Encoding UTF8
Set-Clipboard -Value $sql
$url = "https://supabase.com/dashboard/project/xuvtujchhchdvimtkyix/sql/new"
Start-Process $url
Write-Host ""
Write-Host "=== Realtime tempo_rooms ===" -ForegroundColor Cyan
Write-Host "1. Ctrl+V dans le SQL Editor puis RUN"
Write-Host "2. Publications : supabase_realtime doit afficher 1 table (pas 0)"
Write-Host "3. Lancez Tempo via le raccourci Bureau (pas l'URL supabase.co)"
Write-Host ""