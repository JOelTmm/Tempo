@echo off
chcp 65001 >nul 2>&1
title Tempo
cd /d "%~dp0.."

set NODE_ENV=production
set PATH=%CD%\node_modules\.bin;%PATH%

where npm.cmd >nul 2>&1
if %ERRORLEVEL% EQU 0 (set NPM=npm.cmd) else (set NPM=npm)

if not exist "dist\index.html" (
  echo Build Tempo - attendez environ 30 secondes...
  call %NPM% run build
  if errorlevel 1 goto erreur
)

if not exist "dist-electron\main.cjs" (
  call %NPM% run build:electron
  if errorlevel 1 goto erreur
)

echo Lancement de Tempo...
if exist "node_modules\electron\dist\electron.exe" (
  start "" /wait "node_modules\electron\dist\electron.exe" "%CD%"
  exit /b 0
)

call %NPM% run start
if errorlevel 1 goto erreur
exit /b 0

:erreur
echo.
echo ERREUR au lancement de Tempo.
echo Verifiez que Node.js est installe: https://nodejs.org
pause
exit /b 1