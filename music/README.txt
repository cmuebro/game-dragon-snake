Mittelalterliche Hintergrundmusik
=================================

Standardmäßig spielt das Spiel eine prozedural generierte Mittelalter-
Atmosphäre über die Web Audio API (Dudelsack-ähnliche Drones in D Dorian
plus wechselnde Melodie-Patterns). Diese Fallback-Musik wird automatisch
aktiviert, wenn keine externen Audio-Dateien geladen werden können.


Track-Liste pflegen
-------------------

Die Liste der abgespielten Tracks wird NICHT mehr in src/audio.js
gepflegt, sondern direkt in dieser Datei:

  music/songs.csv

Die CSV verwendet das Semikolon (;) als Trennzeichen. Die erste Zeile
enthält die Spaltenüberschriften, jede weitere Zeile beschreibt einen
Track. Erwartete Spalten:

  filename   Dateiname relativ zum Ordner music/ (z.B. bg-medieval-1.mp3)
  title      Titel des Stücks — wird im Impressum angezeigt
  artist     Urheberin/Urheber — wird im Impressum angezeigt
  link       Quell-Link zur Originalseite — wird im Impressum verlinkt

Beispiel:

  filename;title;artist;link
  bg-medieval-1.mp3;Medieval: Battle;RandomMind;https://www.chosic.com/...
  bg-medieval-2.mp3;Tavern Brawl;Alexander Nakarada;https://www.chosic.com/...

Um einen neuen Track hinzuzufügen, leg die Audio-Datei in diesen Ordner
und ergänze eine Zeile in der CSV. Das Spiel lädt die Liste beim Start
automatisch über fetch() und spielt die Tracks in zufälliger Reihenfolge.
Fehlende oder fehlerhafte Tracks werden zur Laufzeit übersprungen; sind
alle Tracks nicht abspielbar (oder ist die CSV leer/nicht erreichbar),
schaltet das Spiel auf die prozedurale Synth-Musik um.


Lokaler Betrieb (file://) und der Shim music/songs.csv.js
---------------------------------------------------------

Chromium-basierte Browser blockieren fetch() auf lokale file://-Dateien
aus Sicherheitsgründen. Damit das Spiel auch per Doppelklick auf die
HTML-Datei startet, liegt zusätzlich music/songs.csv.js neben der CSV —
ein kleines Shim-Skript, das den CSV-Inhalt als Fallback-String in
window.__songsCsv bereitstellt. Sobald fetch() die echte CSV nicht
lesen kann, greift das Spiel automatisch auf diesen Shim zurück.

Wichtig: Nach jeder Änderung an songs.csv muss der Shim neu erzeugt
werden, sonst läuft er aus dem Takt. Dafür liegen im Projekt-Root zwei
Skripte bereit, die jeweils ohne zusätzliche Installationen auskommen:

  Windows:   refresh-mp3-list.bat   (Doppelklick genügt)
  Linux:     ./refresh-mp3-list.sh  (ggf. vorher „chmod +x" setzen)

Beide lesen music/songs.csv ein, escapen den Inhalt korrekt und
schreiben music/songs.csv.js neu.

Wer das Spiel ausschließlich über einen Webserver bereitstellt, kann
die songs.csv.js bedenkenlos löschen — der fetch()-Pfad greift dann
weiterhin und die Datei wird gar nicht gebraucht.


Impressum & Quellenangaben
--------------------------

Im Spiel unten rechts befindet sich ein Info-Button (ⓘ), der ein
Impressums-Dialog öffnet. Dieser zeigt am Ende automatisch alle in der
songs.csv gepflegten Tracks mit Titel, Urheber und Quell-Link als
Quellenangabe an. Wer neue Musik einbindet, muss also nur die CSV
pflegen — die Kreditierung im Dialog passt sich von selbst an.


Lizenzfreie Quellen für mittelalterliche/Fantasy-Musik
------------------------------------------------------

1. Kevin MacLeod  —  https://incompetech.com
   Lizenz: CC-BY 4.0 (Urheber nennen!)
   Suchbegriffe: "medieval", "celtic", "fantasy"
   Empfehlungen: "Folk Round", "Impromptu in Quarter Comma Meantone",
                 "Hidden Wonders", "Rauchfang Tollhaus"

2. Pixabay Music  —  https://pixabay.com/music/
   Lizenz: Pixabay Content License (kostenlos, keine Namensnennung nötig)
   Suchbegriffe: "medieval", "lute", "fantasy tavern", "celtic"

3. Free Music Archive  —  https://freemusicarchive.org/
   Gemischte CC-Lizenzen — Urheber und Lizenz jeweils prüfen

4. OpenGameArt  —  https://opengameart.org/
   Spielemusik mit klaren CC-Lizenzen
   Suche nach "medieval" oder "fantasy"

5. Tabletop Audio  —  https://tabletopaudio.com/
   Atmosphärische Tracks, persönliche Nutzung frei

6. Chosic  —  https://www.chosic.com/free-music/
   Aggregator für freie Musik, Lizenz pro Track prüfen


Technische Hinweise
-------------------

- Format: MP3 oder OGG (MP3 empfohlen für beste Kompatibilität).
- Direkter file://-Aufruf funktioniert dank music/songs.csv.js (Shim)
  ebenso wie Hosting per Webserver (z.B. „python -m http.server").
- Die erste Wiedergabe startet erst, nachdem du „Abenteuer beginnen" klickst
  (moderne Browser blockieren Autoplay ohne Nutzer-Interaktion).
- Lautstärke liegt bei 30 % als Voreinstellung. In src/audio.js änderbar
  (Konstante `volume`).
- Der Musik-Button im HUD schaltet Musik an/aus (🎵 / 🔇).
