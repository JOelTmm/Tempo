$SchemaPath = Join-Path (Split-Path -Parent $PSScriptRoot) "supabase\schema.sql"
$Sql = Get-Content $SchemaPath -Raw
Set-Clipboard -Value $Sql
$url = "https://supabase.com/dashboard/project/xuvtujchhchdvimtkyix/sql/new"
Start-Process $url
Write-Host "SQL copie dans le presse-papiers."
Write-Host "Dans le navigateur : Ctrl+V puis Run"
Write-Host $url