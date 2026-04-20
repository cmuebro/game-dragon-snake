@echo off
REM Regeneriert music/songs.csv.js aus music/songs.csv.
REM Der Shim wird nur fuer den lokalen file://-Betrieb benoetigt
REM (Chromium-Browser blockieren dort fetch() auf lokale Dateien).
REM
REM Doppelklick auf die Datei genuegt — keine Installation noetig,
REM PowerShell ist in Windows bereits enthalten.

setlocal
set "ROOT=%~dp0"
set "CSV=%ROOT%music\songs.csv"
set "JS=%ROOT%music\songs.csv.js"

if not exist "%CSV%" (
  echo FEHLER: "%CSV%" nicht gefunden.
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "$csv=[IO.File]::ReadAllText('%CSV%');$json=ConvertTo-Json -InputObject $csv -Compress;$nl=[Environment]::NewLine;$out='// AUTOMATISCH GENERIERT aus music/songs.csv - nicht manuell editieren.'+$nl+'// Neu erzeugen mit refresh-mp3-list.bat (Windows) oder refresh-mp3-list.sh (Linux).'+$nl+'window.__songsCsv = '+$json+';'+$nl;[IO.File]::WriteAllText('%JS%',$out,(New-Object Text.UTF8Encoding($false)))"

if errorlevel 1 (
  echo FEHLER beim Regenerieren.
  exit /b 1
)

echo OK: music/songs.csv.js regeneriert.
endlocal
