(function (Dragon) {
  'use strict';
  const KEY = 'dragonSnake.highscores';
  const MAX = 15;
  const NAME_MAX = 16;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function save(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function list() {
    return load().slice().sort((a, b) => b.score - a.score).slice(0, MAX);
  }

  function add(name, score) {
    const cleanName = String(name || '').trim().slice(0, NAME_MAX);
    const entry = {
      name: cleanName || 'Namenloser Drache',
      score: Math.max(0, Math.floor(Number(score) || 0)),
      date: new Date().toISOString(),
    };
    const arr = load();
    arr.push(entry);
    arr.sort((a, b) => b.score - a.score);
    if (arr.length > MAX) arr.length = MAX;
    save(arr);
    return entry;
  }

  function qualifies(score) {
    const l = list();
    if (l.length < MAX) return true;
    return score > l[l.length - 1].score;
  }

  function clear() { save([]); }

  Dragon.highscores = { list, add, qualifies, clear, NAME_MAX, MAX };
})(window.Dragon = window.Dragon || {});
