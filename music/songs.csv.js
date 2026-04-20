// Fallback-Wrapper für den file://-Modus.
// Enthält den exakten Inhalt von music/songs.csv als String,
// damit das Spiel auch ohne Webserver lauffähig ist (dort blockieren
// Browser fetch() auf lokale Dateien).
//
// Primärquelle bleibt music/songs.csv. Diese Datei hier muss nach
// Änderungen an der CSV neu generiert werden. Windows-PowerShell:
//   "window.__songsCsv = @'`r`n" + (Get-Content music\songs.csv -Raw) + "`r`n'@;" | Set-Content music\songs.csv.js
// Oder python:
//   python -c "print('window.__songsCsv = ' + repr(open('music/songs.csv', encoding='utf-8').read()) + ';')" > music/songs.csv.js
window.__songsCsv = "filename;title;artist;link\n" +
  "bg-medieval-1.mp3;Medieval: Battle;RandomMind;https://www.chosic.com/download-audio/28493/\n" +
  "bg-medieval-2.mp3;Tavern Brawl;Alexander Nakarada ft. Kevin MacLeod;https://www.chosic.com/download-audio/29627/\n" +
  "bg-medieval-3.mp3;Bustling Village;PeriTune;https://www.chosic.com/download-audio/57906/\n" +
  "bg-medieval-4.mp3;Ale And Anecdotes;Darren Curtis;https://www.chosic.com/download-audio/28515/\n" +
  "bg-medieval-5.mp3;Medieval: The Old Tower Inn;RandomMind;https://www.chosic.com/download-audio/28499/\n" +
  "bg-medieval-6.mp3;Battle Of The Creek;Alexander Nakarada;https://www.chosic.com/download-audio/29655/\n";
