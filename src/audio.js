(function (Dragon) {
  'use strict';

  const CSV_URL = 'music/songs.csv';
  const MUSIC_DIR = 'music/';

  let tracks = [];
  let songs = [];
  let songsLoaded = false;
  let pendingPlay = false;

  let audioEl = null;
  let enabled = false;
  let volume = 0.05;
  let currentIdx = 0;
  let trackErrors = 0;

  let ctx = null;
  let master = null;
  let synthActive = false;

  const SEMI = Math.pow(2, 1 / 12);
  const freqFromMidi = (m) => 440 * Math.pow(SEMI, m - 69);

  // ---------- SONGS ----------
  // Each song is an 8-bar loop in 8/8 (8 eighth notes per bar).
  // Melody is given as 8 "bars", each a list of [semitoneFromRoot|null, eighthCount].
  // Bass has a per-bar root (semitone offset from rootMidi) and a rhythmic pattern
  // applied each bar: list of [semitoneAboveBassRoot, eighthCount].
  // Notes from medieval-style tunes: D Mixolydian carole (bright), D Dorian
  // Greensleeves-inspired (mystical), E Phrygian Saltarello-inspired (combat),
  // A Harmonic Minor O-Fortuna-inspired (dark).
  const SONGS = {
    bright: {
      rootMidi: 62,      // D
      bassOctave: -24,
      bpm: 112,
      bassLine: [0, 0, 5, 0, 7, 5, 10, 0],               // D D G D A G C D
      bassPattern: [[0,2],[7,2],[0,2],[7,2]],            // walking R-5-R-5 (quarters)
      melodyBars: [
        [[4,1],[2,1],[0,1],[2,1],[4,1],[5,1],[7,1],[4,1]],  // F# E D E F# G A F#
        [[5,1],[4,1],[2,1],[4,1],[0,4]],                    // G F# E F# D-
        [[7,1],[5,1],[4,1],[5,1],[7,1],[9,1],[7,1],[5,1]],  // A G F# G A B A G
        [[4,1],[2,1],[0,2],[null,2],[7,1],[12,1]],          // F# E D  . A D'
        [[7,1],[9,1],[7,1],[5,1],[4,1],[2,1],[0,2]],        // A B A G F# E D
        [[5,1],[7,1],[9,1],[7,1],[5,1],[4,1],[2,1],[0,1]],  // G A B A G F# E D
        [[2,1],[4,1],[5,1],[7,1],[5,1],[4,1],[2,2]],        // E F# G A G F# E-
        [[0,1],[2,1],[4,1],[2,1],[0,2],[null,2]],           // D E F# E D  .
      ],
      melodyType: 'triangle',
      melodyGain: 0.13,
      bassType: 'triangle',
      bassGain: 0.09,
      dronePad: 0.5,
      percOn: true,
    },
    mystical: {
      rootMidi: 62,      // D Dorian
      bassOctave: -24,
      bpm: 84,
      bassLine: [0, 3, 0, 5, 0, 7, 10, 0],               // D F D G D A C D
      bassPattern: [[0,4],[7,4]],                        // half-root, half-fifth
      melodyBars: [
        [[7,1],[10,1],[12,1],[14,3],[12,1],[10,1]],                 // A C D E. D C
        [[9,1],[5,1],[7,1],[9,3],[10,1],[7,1]],                     // B G A B. C A
        [[7,1],[10,1],[12,1],[14,3],[12,1],[10,1]],                 // A C D E. D C
        [[9,1],[5,1],[3,1],[5,1],[7,4]],                            // B G F G A-
        [[10,1],[15,2],[14,1],[12,1],[10,3]],                       // C F' E D C.
        [[9,1],[5,1],[7,1],[9,3],[10,1],[7,1]],                     // B G A B. C A
        [[10,1],[15,1],[14,1],[12,1],[10,1],[9,1],[7,1],[5,1]],     // C F E D C B A G
        [[3,1],[5,1],[7,1],[0,5]],                                  // F G A D-
      ],
      melodyType: 'triangle',
      melodyGain: 0.11,
      bassType: 'triangle',
      bassGain: 0.09,
      dronePad: 0.9,
      percOn: false,
    },
    combat: {
      rootMidi: 64,      // E Phrygian
      bassOctave: -24,
      bpm: 138,
      bassLine: [0, 0, 1, 0, 0, 7, 1, 0],                // E E F E E B F E
      bassPattern: [[0,1],[0,1],[12,1],[0,1],[0,1],[7,1],[12,1],[0,1]],  // driving 8ths
      melodyBars: [
        [[0,1],[0,1],[0,1],[7,1],[7,1],[7,1],[0,1],[0,1]],          // E E E B B B E E
        [[3,1],[5,1],[3,1],[0,1],[3,1],[7,1],[5,1],[3,1]],          // G A G E G B A G
        [[1,1],[3,1],[1,1],[8,1],[1,1],[5,1],[3,1],[1,1]],          // F G F C F A G F
        [[0,2],[0,1],[0,1],[3,1],[1,1],[3,1],[5,1]],                // E- E E G F G A
        [[0,1],[0,1],[0,1],[7,1],[7,1],[7,1],[0,1],[0,1]],          // E E E B B B E E
        [[5,1],[3,1],[5,1],[7,1],[5,1],[3,1],[1,1],[0,1]],          // A G A B A G F E
        [[1,1],[3,1],[1,1],[0,1],[1,1],[3,1],[5,1],[3,1]],          // F G F E F G A G
        [[0,2],[0,2],[0,4]],                                         // E- E- E--
      ],
      melodyType: 'square',
      melodyGain: 0.07,
      bassType: 'sawtooth',
      bassGain: 0.09,
      dronePad: 0.3,
      percOn: true,
    },
    dark: {
      rootMidi: 69,      // A Harmonic Minor
      bassOctave: -24,
      bpm: 82,
      bassLine: [0, 8, 5, 7, 0, 5, 7, 0],                // A F D E A D E A
      bassPattern: [[0,2],[0,1],[12,1],[7,2],[0,2]],     // R-R-oct-5-R
      melodyBars: [
        [[0,2],[0,1],[-1,1],[0,2],[-5,2]],                          // A- A G# A- E-
        [[0,1],[2,1],[3,1],[5,1],[3,1],[2,1],[0,2]],                // A B C D C B A-
        [[3,1],[5,1],[7,1],[8,1],[7,1],[5,1],[3,2]],                // C D E F E D C-
        [[7,4],[5,2],[3,2]],                                         // E-- D- C-
        [[0,1],[-1,1],[0,1],[2,1],[0,1],[-1,1],[-5,2]],             // A G# A B A G# E-
        [[3,1],[5,1],[3,1],[2,1],[0,1],[2,1],[3,2]],                // C D C B A B C-
        [[7,2],[8,2],[7,2],[5,2]],                                   // E- F- E- D-
        [[3,1],[2,1],[0,1],[-1,1],[0,4]],                            // C B A G# A--
      ],
      melodyType: 'triangle',
      melodyGain: 0.10,
      bassType: 'triangle',
      bassGain: 0.10,
      dronePad: 0.7,
      percOn: false,
    },
  };

  // ---------- SCHEDULER ----------
  let currentMood = 'mystical';
  let currentSong = SONGS.mystical;
  let barCount = 0;
  let nextBarTime = 0;
  let schedulerTimer = null;
  let dronePad = null;
  const LOOK_AHEAD = 0.3;
  const TICK_MS = 60;

  function parseCsv(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const header = lines[0].split(';').map(h => h.trim().toLowerCase());
    const idxOf = (name) => header.indexOf(name);
    const iFile = idxOf('filename');
    const iTitle = idxOf('title');
    const iArtist = idxOf('artist');
    const iLink = idxOf('link');
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      const filename = iFile >= 0 ? (cols[iFile] || '').trim() : '';
      if (!filename) continue;
      out.push({
        filename,
        title: iTitle >= 0 ? (cols[iTitle] || '').trim() : '',
        artist: iArtist >= 0 ? (cols[iArtist] || '').trim() : '',
        link: iLink >= 0 ? (cols[iLink] || '').trim() : '',
      });
    }
    return out;
  }

  function applyCsvText(text) {
    songs = parseCsv(text);
    tracks = songs.map(s => MUSIC_DIR + s.filename);
  }

  function loadSongsCsv() {
    return fetch(CSV_URL, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error('CSV ' + res.status);
        return res.text();
      })
      .then(applyCsvText)
      .catch(() => {
        // fetch scheitert unter file:// — Fallback auf Wrapper-Shim
        if (typeof window.__songsCsv === 'string' && window.__songsCsv.length > 0) {
          applyCsvText(window.__songsCsv);
        } else {
          songs = [];
          tracks = [];
        }
      });
  }

  function initAudioElement() {
    audioEl = new Audio();
    audioEl.volume = volume;
    audioEl.preload = 'auto';
    audioEl.addEventListener('ended', () => {
      if (!tracks.length) return;
      currentIdx = (currentIdx + 1) % tracks.length;
      audioEl.src = tracks[currentIdx];
      if (enabled) audioEl.play().catch(() => {});
    });
    audioEl.addEventListener('error', () => {
      trackErrors++;
      if (trackErrors >= tracks.length) {
        synthActive = true;
        if (enabled) startSynth();
      } else {
        currentIdx = (currentIdx + 1) % tracks.length;
        audioEl.src = tracks[currentIdx];
      }
    });
    currentIdx = Math.floor(Math.random() * tracks.length);
    audioEl.src = tracks[currentIdx];
  }

  function init() {
    loadSongsCsv().then(() => {
      songsLoaded = true;
      if (tracks.length === 0) {
        synthActive = true;
        if (enabled && pendingPlay) startSynth();
        pendingPlay = false;
        return;
      }
      initAudioElement();
      if (enabled && pendingPlay) {
        const p = audioEl.play();
        if (p && p.catch) p.catch(() => {});
      }
      pendingPlay = false;
    });
  }

  function getSongs() {
    return songs.slice();
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  function playNote(startTime, freq, duration, type, gain) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type || 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(g);
    g.connect(master);
    const attack = 0.015;
    const release = Math.min(0.18, duration * 0.4);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + attack);
    g.gain.setValueAtTime(gain, startTime + Math.max(attack, duration - release));
    g.gain.linearRampToValueAtTime(0, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  function playBassNote(startTime, freq, duration, type, gain) {
    const osc1 = ctx.createOscillator();
    osc1.type = type || 'triangle';
    osc1.frequency.setValueAtTime(freq, startTime);
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 0.5, startTime);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.8;
    const g = ctx.createGain();
    const attack = 0.02;
    const release = Math.min(0.2, duration * 0.3);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(gain, startTime + attack);
    g.gain.setValueAtTime(gain, startTime + Math.max(attack, duration - release));
    g.gain.linearRampToValueAtTime(0, startTime + duration);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(g);
    g.connect(master);
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.05);
    osc2.stop(startTime + duration + 0.05);
  }

  function playPerc(startTime, gain) {
    // short noise burst for percussion accent
    const bufferSize = ctx.sampleRate * 0.05;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 200;
    filter.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(startTime);
    src.stop(startTime + 0.1);
  }

  function buildDronePad(song) {
    const rootHz = freqFromMidi(song.rootMidi - 12);
    const fifthHz = freqFromMidi(song.rootMidi - 12 + 7);
    const nodes = [];
    const g = ctx.createGain();
    g.gain.value = 0.022 * song.dronePad;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.5;
    [rootHz, fifthHz].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      o.connect(filter);
      o.start();
      nodes.push(o);
    });
    filter.connect(g);
    g.connect(master);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    const lfoAmp = ctx.createGain();
    lfoAmp.gain.value = 60;
    lfo.connect(lfoAmp);
    lfoAmp.connect(filter.frequency);
    lfo.start();
    nodes.push(lfo);
    return { gain: g, nodes };
  }

  function stopDronePad() {
    if (!dronePad) return;
    const now = ctx.currentTime;
    try {
      dronePad.gain.gain.cancelScheduledValues(now);
      dronePad.gain.gain.setValueAtTime(dronePad.gain.gain.value, now);
      dronePad.gain.gain.linearRampToValueAtTime(0, now + 0.4);
    } catch (_) {}
    dronePad.nodes.forEach((n) => { try { n.stop(now + 0.5); } catch (_) {} });
    dronePad = null;
  }

  function scheduleBar(song, barIdx, startTime) {
    const eighthSec = 60 / song.bpm / 2; // bpm is quarter-notes; eighth is half
    // actually: if bpm counts quarter notes, an eighth = 60/bpm/2.
    // but our "bar = 8 eighths" means bar is 4 quarters. Fine.
    const barSec = 8 * eighthSec;

    // --- bass ---
    const bassDegree = song.bassLine[barIdx % song.bassLine.length];
    const bassRootMidi = song.rootMidi + song.bassOctave + bassDegree;
    let t = startTime;
    for (const [offset, len] of song.bassPattern) {
      const dur = len * eighthSec;
      const freq = freqFromMidi(bassRootMidi + offset);
      playBassNote(t, freq, dur * 0.95, song.bassType, song.bassGain);
      t += dur;
    }

    // --- percussion accent on beats 1 and 5 ---
    if (song.percOn) {
      playPerc(startTime, 0.05);
      playPerc(startTime + 4 * eighthSec, 0.04);
    }

    // --- melody ---
    const barNotes = song.melodyBars[barIdx % song.melodyBars.length];
    let mt = startTime;
    for (const [semi, len] of barNotes) {
      const dur = len * eighthSec;
      if (semi !== null && semi !== undefined) {
        // melody octave: play one octave above the song root
        const noteMidi = song.rootMidi + semi;
        playNote(mt, freqFromMidi(noteMidi), dur * 0.92, song.melodyType, song.melodyGain);
      }
      mt += dur;
    }

    // --- counter-melody ornament every 4 bars (bar 2 and 6), simple harmony ---
    if (barIdx % 4 === 2) {
      let ct = startTime;
      for (const [semi, len] of barNotes) {
        const dur = len * eighthSec;
        if (semi !== null && semi !== undefined) {
          // a third above (4 semitones) — in-mode approximation, soft
          const harmMidi = song.rootMidi + semi + 4;
          playNote(ct, freqFromMidi(harmMidi), dur * 0.85, 'sine', song.melodyGain * 0.4);
        }
        ct += dur;
      }
    }
  }

  function schedulerTick() {
    if (!synthActive || !enabled || !ctx) return;
    const song = currentSong;
    const eighthSec = 60 / song.bpm / 2;
    const barSec = 8 * eighthSec;
    const now = ctx.currentTime;
    while (nextBarTime < now + LOOK_AHEAD) {
      scheduleBar(song, barCount, nextBarTime);
      barCount++;
      nextBarTime += barSec;
    }
    schedulerTimer = setTimeout(schedulerTick, TICK_MS);
  }

  function startSynth() {
    if (!ensureCtx()) return;
    synthActive = true;
    master.gain.setValueAtTime(volume, ctx.currentTime);
    if (!dronePad) dronePad = buildDronePad(currentSong);
    if (nextBarTime < ctx.currentTime) {
      nextBarTime = ctx.currentTime + 0.15;
      barCount = 0;
    }
    if (!schedulerTimer) schedulerTick();
  }

  function stopSynth() {
    if (master && ctx) master.gain.setValueAtTime(0, ctx.currentTime);
    if (schedulerTimer) { clearTimeout(schedulerTimer); schedulerTimer = null; }
    stopDronePad();
    nextBarTime = 0;
  }

  function setMood(mood) {
    if (!mood || !SONGS[mood]) return;
    if (mood === currentMood && currentSong) return;
    currentMood = mood;
    currentSong = SONGS[mood];
    if (ctx && synthActive && enabled) {
      stopDronePad();
      dronePad = buildDronePad(currentSong);
      barCount = 0;
      nextBarTime = ctx.currentTime + 0.2;
    }
  }

  function play() {
    if (!enabled) return;
    if (!songsLoaded) { pendingPlay = true; return; }
    if (synthActive) { startSynth(); return; }
    if (audioEl) {
      const p = audioEl.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  function pause() {
    pendingPlay = false;
    if (audioEl) audioEl.pause();
    if (synthActive) stopSynth();
  }

  function toggle() {
    enabled = !enabled;
    if (enabled) play();
    else pause();
    return enabled;
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
    if (audioEl) audioEl.volume = volume;
    if (master && ctx && enabled) master.gain.setValueAtTime(volume, ctx.currentTime);
  }

  function ensureStarted() { play(); }
  function isEnabled() { return enabled; }

  Dragon.audio = { init, play, pause, toggle, setVolume, ensureStarted, isEnabled, setMood, getSongs };
})(window.Dragon = window.Dragon || {});
