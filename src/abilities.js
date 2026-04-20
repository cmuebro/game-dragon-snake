(function (Dragon) {
  'use strict';

  const list = [];
  function register(def) { list.push(def); }

  function shootFire(state) {
    const head = state.snake[0];
    const tier = (state.abilityLevels && state.abilityLevels.fire) || 1;
    const length = tier >= 2 ? 12 : 6;
    const dx = state.dir.x, dy = state.dir.y;
    const nx = -dy, ny = dx;
    const lateralOffsets = tier >= 3 ? [-1, 0, 1] : [0];
    for (let i = 1; i <= length; i++) {
      for (const lo of lateralOffsets) {
        const p = { x: head.x + dx * i + nx * lo, y: head.y + dy * i + ny * lo };
        state.fireballs.push({ ...p, life: 500, dx, dy });
        const wi = state.walls.findIndex(w => w.x === p.x && w.y === p.y);
        if (wi >= 0) { state.walls.splice(wi, 1); Dragon.particles.burst(p, 15, '#ff6f4a'); }
        const si = state.spikes.findIndex(s => s.x === p.x && s.y === p.y);
        if (si >= 0) { state.spikes.splice(si, 1); Dragon.particles.burst(p, 12, '#ff6f4a'); }
        for (const r of [...state.rivals]) {
          if (r.segments.some(s => s.x === p.x && s.y === p.y)) {
            Dragon.rivals.damage(state, r, Dragon.config.DAMAGE.FIRE_VS_RIVAL);
            Dragon.particles.burst(p, 18, '#ff6f4a');
            break;
          }
        }
      }
    }
    state.screenShake = 8;
  }

  // --- Ability registry: add with Dragon.abilities.register({...}) ---

  register({
    id: 'shed', slot: 'primary', price: 25,
    icon: '🪶', name: 'Häutung',
    desc: 'Leertaste: streift 3 Schuppen ab — verkürzt den Drachen.',
    cooldown: 30000,
    upgrades: [
      { desc: '+ Streift 5 Schuppen ab.', price: 70 },
      { desc: '+ Streift 7 Schuppen ab.', price: 140 },
    ],
    activate(state) {
      if (state.snake.length <= 4) return false;
      const tier = (state.abilityLevels && state.abilityLevels.shed) || 1;
      const count = tier >= 3 ? 7 : tier >= 2 ? 5 : 3;
      const reduceBy = Math.min(count, state.snake.length - 2);
      for (let i = 0; i < reduceBy; i++) {
        const tail = state.snake[state.snake.length - 1];
        Dragon.particles.burst(tail, 10, '#ffe27a');
        state.snake.pop();
      }
      Dragon.particles.floatText(state.snake[0], 'Häutung', 1000);
    },
  });

  register({
    id: 'shield', slot: 'passive', price: 45,
    icon: '🛡', name: 'Schuppenschild',
    desc: 'Passiv: halbiert Schaden. 10s Abklingzeit nach jedem Treffer.',
    cooldown: 0,
    onUnlock(state) { state.shieldCd = 0; },
  });

  register({
    id: 'magnet', slot: 'passive', price: 55,
    icon: '🧲', name: 'Magnet',
    desc: 'Passiv: zieht Juwelen & Münzen in geringer Reichweite an.',
    cooldown: 0,
    upgrades: [
      { desc: '+ Größere Reichweite und stärkere Anziehung.', price: 100 },
      { desc: '+ Zieht zusätzlich Früchte aus 1 Feld Entfernung an.', price: 170 },
    ],
  });

  register({
    id: 'fire', slot: 'primary', price: 70,
    icon: '🔥', name: 'Feueratem',
    desc: 'Leertaste: Flammen verbrennen Hindernisse (6 Felder).',
    cooldown: 6000,
    upgrades: [
      { desc: '+ Doppelte Reichweite (12 Felder).', price: 130 },
      { desc: '+ 3 Felder breit.', price: 220 },
    ],
    activate(state) { shootFire(state); },
  });

  register({
    id: 'slowtime', slot: 'secondary', price: 80,
    icon: '⏳', name: 'Zeitlupe',
    desc: 'Shift: 8s Zeit verlangsamen.',
    cooldown: 30000,
    activate(state) { state.activeEffects.slowtime = 8000; },
  });

  register({
    id: 'ghost', slot: 'secondary', price: 100,
    icon: '👻', name: 'Geisterwandeln',
    desc: 'Shift: 2s durch Wände fliegen.',
    cooldown: 9000,
    activate(state) { state.activeEffects.ghost = 2000; },
  });

  register({
    id: 'hammer', slot: 'primary', price: 120,
    icon: '🔨', name: 'Thors Hammer',
    desc: 'Schwingt 7s im Kreis um den Drachen, trifft Gegner.',
    cooldown: 60000,
    upgrades: [
      { desc: '+ Größerer Radius, zertrümmert auch Stacheln und Wände.', price: 200 },
    { desc: '+ Dreht sich deutlich schneller.', price: 280 },
    ],
    activate(state) {
      state.activeEffects.hammer = 7000;
      state.hammerAngle = 0;
      state.hammerHitLog = {};
      Dragon.particles.burst(state.snake[0], 20, '#ffd060');
      state.screenShake = 8;
    },
  });

  register({
    id: 'firestorm', slot: 'secondary', price: 180,
    icon: '🌋', name: 'Feuersturm',
    desc: 'Shift: 3s lang speit jedes Körpersegment Feuerbälle in alle Richtungen.',
    cooldown: 60000,
    upgrades: [
      { desc: '+ Schnellere und dichtere Feuerbälle.', price: 220 },
      { desc: '+ Noch dichter, zerstört zusätzlich Wände & Stacheln.', price: 300 },
    ],
    activate(state) {
      state.activeEffects.firestorm = 3000;
      state.firestormAcc = 0;
      Dragon.particles.burst(state.snake[0], 22, '#ff8a3a');
      state.screenShake = 7;
    },
  });

  register({
    id: 'storm', slot: 'secondary', price: 90,
    icon: '❄', name: 'Eissturm',
    desc: 'Shift: friert alle Rivalen 4s ein.',
    cooldown: 15000,
    upgrades: [
      { desc: '+ Dauer 6s, friert zusätzlich Bodenfallen ein.', price: 140 },
    ],
    activate(state) {
      const tier = levelOf(state, 'storm');
      const duration = tier >= 2 ? 6000 : 4000;
      for (const r of state.rivals) r.frozen = duration;
      if (tier >= 2) {
        for (const sp of state.spikes) sp.frozen = duration;
      }
      state.screenShake = 6;
      Dragon.particles.burst(state.snake[0], 24, '#c8f0ff');
    },
  });

  register({
    id: 'steady', slot: 'passive', price: 90,
    icon: '🪷', name: 'Gelassenheit',
    desc: 'Passiv: verlangsamt die Drachenbewegung um 25%.',
    cooldown: 0,
    upgrades: [
      { desc: '+ Verlangsamt um insgesamt 40%.', price: 160 },
      { desc: '+ Verlangsamt um insgesamt 60%.', price: 250 },
    ],
  });

  register({
    id: 'regen', slot: 'passive', price: 75,
    icon: '🕊', name: 'Läuterung',
    desc: 'Passiv: regeneriert 1 HP pro Sekunde.',
    cooldown: 0,
    upgrades: [
      { desc: '+ Regeneriert 3 HP pro Sekunde.', price: 120 },
      { desc: '+ Regeneriert 5 HP pro Sekunde.', price: 200 },
    ],
  });

  register({
    id: 'bonus', slot: 'passive', price: 130,
    icon: '👑', name: 'Drachenhort',
    desc: 'Passiv: +50% Punkte auf alle Beute.',
    cooldown: 0,
    upgrades: [
      { desc: '+ Zusätzlich +30% Münzen.', price: 180 },
    ],
  });

  function byId(id) { return list.find(a => a.id === id); }

  function levelOf(state, id) { return (state.abilityLevels && state.abilityLevels[id]) || 0; }

  function maxLevel(a) { return 1 + ((a.upgrades && a.upgrades.length) || 0); }

  function tierInfo(a, tier) {
    if (tier === 1) return { desc: a.desc, price: a.price };
    const up = (a.upgrades || [])[tier - 2];
    return up ? { desc: up.desc, price: up.price } : null;
  }

  function currentForSlot(state, slot) {
    const id = state.equipped[slot];
    if (!id) return null;
    const a = byId(id);
    if (!a || !state.unlocked.has(id)) return null;
    return a;
  }

  function trigger(state, slot) {
    const a = currentForSlot(state, slot);
    if (!a) return false;
    return triggerById(state, a.id);
  }

  function triggerById(state, id) {
    const a = byId(id);
    if (!a || !a.activate) return false;
    if (!state.unlocked.has(id)) return false;
    if ((state.cooldown[id] || 0) > 0) return false;
    const result = a.activate(state);
    if (result === false) return false;
    state.cooldown[id] = state.cheatShortCd ? 3000 : a.cooldown;
    return true;
  }

  function equip(state, abilityId) {
    const a = byId(abilityId);
    if (!a || !state.unlocked.has(abilityId)) return false;
    if (a.slot === 'passive') return false;
    state.equipped[a.slot] = abilityId;
    return true;
  }

  function autoEquip(state, abilityId) {
    const a = byId(abilityId);
    if (!a || a.slot === 'passive') return;
    state.equipped[a.slot] = abilityId;
  }

  Dragon.abilities = {
    list, register, byId, currentForSlot, trigger, triggerById, equip, autoEquip,
    levelOf, maxLevel, tierInfo,
  };
})(window.Dragon = window.Dragon || {});
