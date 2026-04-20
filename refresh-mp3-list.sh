#!/usr/bin/env bash
# Regeneriert music/songs.csv.js aus music/songs.csv.
# Der Shim wird nur fuer den lokalen file://-Betrieb benoetigt
# (Chromium-Browser blockieren dort fetch() auf lokale Dateien).
#
# Nutzung (von ueberall, der Pfad wird selbst aufgeloest):
#   chmod +x refresh-mp3-list.sh   # einmalig
#   ./refresh-mp3-list.sh
#
# Nutzt nur Bash-Builtins — keine externen Tools (awk/sed/python) noetig.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV="$ROOT/music/songs.csv"
JS="$ROOT/music/songs.csv.js"

if [ ! -f "$CSV" ]; then
  echo "FEHLER: $CSV nicht gefunden." >&2
  exit 1
fi

if [ ! -s "$CSV" ]; then
  echo "FEHLER: $CSV ist leer." >&2
  exit 2
fi

# CSV zeilenweise lesen, Backslash und Anfuehrungszeichen escapen,
# jede Zeile als JS-Stringliteral mit \n-Abschluss erzeugen und mit '+'
# verknuepfen.
tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

{
  echo '// AUTOMATISCH GENERIERT aus music/songs.csv - nicht manuell editieren.'
  echo '// Neu erzeugen mit refresh-mp3-list.sh (Linux) oder refresh-mp3-list.bat (Windows).'
  printf 'window.__songsCsv ='
  first=1
  while IFS= read -r line || [ -n "$line" ]; do
    esc="${line//\\/\\\\}"
    esc="${esc//\"/\\\"}"
    if [ "$first" -eq 1 ]; then
      printf '\n  "%s\\n"' "$esc"
      first=0
    else
      printf ' +\n  "%s\\n"' "$esc"
    fi
  done < "$CSV"
  printf ';\n'
} > "$tmp"

mv "$tmp" "$JS"
trap - EXIT

echo "OK: music/songs.csv.js regeneriert."
