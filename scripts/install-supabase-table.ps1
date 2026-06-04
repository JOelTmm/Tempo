# Ouvre le SQL Editor et copie le script tempo_rooms
$Schema = Join-Path (Split-Path $PSScriptRoot -Parent) "supabase\FIX-TABLE.sql"
$sql = Get-Content $Schema -Raw -Encoding UTF8
Set-Clipboard -Value $sql
$url = "https://supabase.com/dashboard/project/xuvtujchhchdvimtkyix/sql/new"
Start-Process $url
Write-Host ""
Write-Host "=== ETAPE 2 : Table tempo_rooms ===" -ForegroundColor Cyan
Write-Host "1. Dans le navigateur : Ctrl+V puis RUN"
Write-Host "2. Puis : Database -> Publications -> tempo_rooms -> Realtime ON"
Write-Host ""
Write-Host "Ensuite : cd C:\Users\User\Tempo && npm run verify:supabase"