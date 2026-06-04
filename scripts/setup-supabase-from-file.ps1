# Lit supabase.credentials.json (copiez depuis supabase.credentials.example.json)
$Root = Split-Path -Parent $PSScriptRoot
$Creds = Join-Path $Root "supabase.credentials.json"
if (-not (Test-Path $Creds)) {
    Write-Host "Creez $Creds avec url et anonKey depuis Supabase → Settings → API"
    exit 1
}
$j = Get-Content $Creds -Raw | ConvertFrom-Json
& "$PSScriptRoot\setup-supabase.ps1" -Url $j.url -AnonKey $j.anonKey