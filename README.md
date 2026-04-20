# Drachen-Snake

Eine Chronik in fünfzig Prüfungen — klassisches Snake-Gameplay, eingebettet
in ein mittelalterliches Fantasy-Abenteuer mit Leveldesign, Shop-System,
Fähigkeiten und prozeduraler Hintergrundmusik. Reines HTML/CSS/JavaScript,
keine Build-Tools, kein Framework.

---

## Features

- **50 Level** über sieben Welten: Sonnenwiesen, Wälder,
  Eisberge, Vulkane, Sternenfelder, Ozean-Tiefen, Wüste, Schattenreich,
  Kristallhallen und schließlich der Drachenthron. Jedes zehnte Level ist
  ein Boss-Kampf.
- **Fähigkeiten-System** mit aktiven und passiven Upgrades — Feueratem,
  Zeitlupe, Teleport, Eissturm, Thors Hammer, Schuppenschild,
  Juwelenmagnet u.v.m. Fähigkeiten lassen sich im Marktplatz zwischen
  Leveln erlernen und aufleveln.
- **Marktplatz** nach jedem Level: Münzen gegen Fähigkeiten und Tränke
  tauschen.
- **Rivalen**, Wände, Stachelfelder, zerstörbare Dekorationen, variable
  Geschwindigkeiten pro Level.
- **Hintergrundmusik** aus frei lizenzierter MP3-Sammlung (pflegbar über
  CSV) oder prozedural generierte Synth-Fallback-Musik im Dorian-Modus
  (Web Audio API, Drones plus wechselnde Melodie-Patterns).
- **Touch- und Controller-tauglich**: virtueller Joystick auf Touch-
  Geräten, Pointer-Lock auf Desktops.
- **Impressum-Dialog** mit automatischer Quellenangabe der eingesetzten
  Hintergrundmusik (generiert aus der Songs-CSV).

---

## Schnellstart

### Option A: Lokal ohne Server (Doppelklick)

Einmalig den Musik-Shim erzeugen (nötig, weil Browser `fetch()` auf
lokale Dateien blockieren):

```bat
refresh-mp3-list.bat          :: Windows
./refresh-mp3-list.sh         # Linux / macOS
```

Dann `dragon-snake.html` doppelklicken. Fertig.

### Option B: Über einen Webserver

```bash
# Python-Bordmittel reichen
python -m http.server 8000
```

Anschließend im Browser `http://localhost:8000/dragon-snake.html`
öffnen. Beim Hosting über einen Webserver wird die echte `songs.csv`
per `fetch()` geladen — der Shim wird dann gar nicht gebraucht und
kann gelöscht werden.

---

## Steuerung

| Eingabe                        | Aktion                                |
| ------------------------------ | ------------------------------------- |
| Pfeiltasten / WASD             | Drachen bewegen                       |
| Leertaste                      | Hauptfähigkeit auslösen               |
| Shift                          | Sekundärfähigkeit                     |
| Tasten 1–9                     | Aktive Fähigkeiten aus der Leiste     |
| P                              | Pause an/aus                          |
| R                              | Level neu starten                     |
| Mausziehen / Touch-Drag        | Virtueller Joystick auf dem Spielfeld |

---

## Musik pflegen

Die Liste der abgespielten Tracks wird in **einer einzigen Quelle** gepflegt:

```
music/songs.csv
```

Erste Zeile sind die Spaltenüberschriften (`filename;title;artist;link`),
jede weitere Zeile ein Track. Die MP3-Dateien liegen im selben Ordner.
Das Spiel lädt die CSV beim Start, spielt die Tracks in zufälliger
Reihenfolge ab und überspringt fehlende oder defekte Dateien. Ist die
CSV leer oder nicht erreichbar, greift die prozedurale Synth-Musik.

Nach Änderungen an der CSV muss für den **lokalen file://-Betrieb** der
Shim `music/songs.csv.js` neu erzeugt werden. Das übernehmen die beiden
beigelegten Skripte:

```bat
refresh-mp3-list.bat          :: Windows
./refresh-mp3-list.sh         # Linux / macOS
```

Details und lizenzfreie Musikquellen: siehe
[`music/README.txt`](music/README.txt).

Die Angaben aus der CSV erscheinen automatisch im Impressum-Dialog
(i-Button unten rechts) als Quellenangabe — Pflege an einer Stelle,
Ausgabe überall wo sie gebraucht wird.

---

## Projektstruktur

```
dragon-snake.html       Einstieg — lädt alle Skripte
styles.css              Gesamtes Styling (mittelalterlicher Pergament-Look)
src/
  config.js             Konstanten (Spielfeldgröße, HP, Schaden)
  state.js              Globaler Spielzustand
  levels.js             50 Level-Definitionen
  themes.js             Farb- und Atmosphäre-Themes
  world.js              Wände, Stacheln, Level-Generierung
  decorations.js        Hintergrund-Deko pro Welt
  items.js              Sammelbare Objekte (Frucht, Juwel, Münze ...)
  abilities.js          Fähigkeiten-Definitionen und -Effekte
  shop.js               Marktplatz-Logik
  rivals.js             Gegner-KI
  movers.js             Bewegungs- und Kollisionslogik
  particles.js          Partikel-Effekte
  input.js              Tastatur, Touch, Joystick, Pointer-Lock
  render.js             Canvas-Rendering
  render-dragon.js      Drachen-Animation
  audio.js              MP3- und Synth-Musik
  ui.js                 HUD, Overlays, Dialoge
  game.js               Haupt-Gameloop und Level-Progression
music/
  songs.csv             Track-Liste (einzige Quelle der Wahrheit)
  songs.csv.js          Shim für lokalen file://-Betrieb
  *.mp3                 Audio-Dateien
refresh-mp3-list.bat    Shim-Generator (Windows)
refresh-mp3-list.sh     Shim-Generator (Linux / macOS)
```

---

## Tech-Stack

- Reines HTML5 / CSS3 / JavaScript (ES2017+) ohne Build-Step
- Canvas-API für das Spielfeld, Web Audio API für Synth-Musik
- Google Fonts: *Cinzel*, *MedievalSharp*, *Cormorant Garamond*
- IIFE-basierte Modulstruktur — jede `src/*.js` hängt sich an ein
  globales `window.Dragon`-Objekt

---

## Impressum & Lizenz

Das Spiel enthält einen Impressum-Dialog (i-Button unten rechts) mit
einem Template nach § 5 TMG. Wer das Spiel öffentlich hostet, muss
dort die eigenen Anbieter-Angaben (Name, Anschrift, Telefon)
eintragen — die entsprechenden Platzhalter sind im HTML markiert.

Die verwendete Musik stammt von freien Quellen (Chosic, Kevin MacLeod,
Pixabay u.a.) und wird im Impressum-Dialog mit Titel, Urheber und Link
als Quellenangabe ausgewiesen. Die konkrete Lizenz jedes Tracks ergibt
sich aus der Originalquelle.
