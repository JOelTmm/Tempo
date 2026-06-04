$AppName = "Tempo"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "$AppName.lnk"
$LauncherVbs = Join-Path $ProjectRoot "scripts\Launch-Tempo.vbs"
$IconPath = Join-Path $ProjectRoot "public\logo-tempo.ico"

$GenIcon = Join-Path $ProjectRoot "scripts\generate-icon.py"
if (-not (Test-Path $IconPath) -and (Test-Path $GenIcon)) {
    python $GenIcon 2>$null
}

$Wsh = New-Object -ComObject WScript.Shell
$Sc = $Wsh.CreateShortcut($ShortcutPath)
$Sc.TargetPath = "wscript.exe"
$Sc.Arguments = "`"$LauncherVbs`""
$Sc.WorkingDirectory = $ProjectRoot
$Sc.Description = "Tempo - Votre Arene Musicale"
if (Test-Path $IconPath) {
    $Sc.IconLocation = "$IconPath,0"
} else {
    $Jfif = Join-Path $ProjectRoot "public\logo-tempo.jfif"
    if (Test-Path $Jfif) { $Sc.IconLocation = "$Jfif,0" }
}
$Sc.Save()

Write-Host "Raccourci Bureau : $ShortcutPath"
Write-Host "Lanceur : $LauncherVbs"