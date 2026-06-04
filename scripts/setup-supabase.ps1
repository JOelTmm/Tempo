param(
    [string]$Url,
    [string]$AnonKey,
    [string]$ServiceRoleKey
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root ".env"
$SchemaFile = Join-Path $Root "supabase\schema.sql"

Write-Host "=== Configuration Supabase pour Tempo ===" -ForegroundColor Cyan

if (-not $Url) {
    $Url = Read-Host "Collez la Project URL (https://xxxxx.supabase.co)"
}
if (-not $AnonKey) {
    $AnonKey = Read-Host "Collez la cle anon public"
}

$Url = $Url.Trim().TrimEnd("/")
if ($Url -notmatch "^https://.+\.supabase\.co$") {
    Write-Host "URL invalide. Exemple: https://abcdefgh.supabase.co" -ForegroundColor Red
    exit 1
}

# Étape 5 — .env
$envContent = @"
VITE_SUPABASE_URL=$Url
VITE_SUPABASE_ANON_KEY=$AnonKey
SPOTIFY_CLIENT_ID=
DEEZER_APP_ID=
"@
Set-Content -Path $EnvFile -Value $envContent -Encoding UTF8
Write-Host "[OK] Fichier .env cree : $EnvFile" -ForegroundColor Green

# Vérifier connexion + table
Write-Host "`nVerification de la table tempo_rooms..." -ForegroundColor Yellow
$headers = @{
    "apikey"        = $AnonKey
    "Authorization" = "Bearer $AnonKey"
}
$testUrl = "$Url/rest/v1/tempo_rooms?select=code&limit=1"

try {
    $resp = Invoke-RestMethod -Uri $testUrl -Headers $headers -Method Get -ErrorAction Stop
    Write-Host "[OK] Table tempo_rooms accessible. Multijoueur Internet pret." -ForegroundColor Green
    Write-Host "Salons actuels : $(if ($resp) { $resp.Count } else { 0 })"
} catch {
    $msg = $_.Exception.Message
    if ($msg -match "404|42P01|relation|does not exist") {
        Write-Host "[!] Table absente — executez l'etape 2 (SQL) dans le dashboard." -ForegroundColor Yellow
        Write-Host "    Fichier : $SchemaFile"
        Write-Host "    Supabase → SQL Editor → coller schema.sql → Run"
    } else {
        Write-Host "[!] Erreur API : $msg" -ForegroundColor Red
        Write-Host "    Verifiez URL, cle anon, et que le projet est actif."
    }
}

Write-Host "`n--- Etape 3 Realtime (manuel dans le dashboard) ---" -ForegroundColor Cyan
Write-Host "Database → Replication (ou Publications) → activer tempo_rooms"

Write-Host "`nRelancez Tempo :" -ForegroundColor Cyan
Write-Host "  cd $Root"
Write-Host "  npm run dev"
Write-Host "`nDans l'app : bandeau vert 'Supabase actif'" -ForegroundColor Green