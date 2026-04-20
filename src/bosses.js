(function (Dragon) {
  'use strict';

  const defs = {};
  function register(def) { defs[def.id] = def; }
  function get(id) { return defs[id]; }
  function list() { return Object.values(defs); }

  function updateWeakpointPositions(b) {
    const CELL = Dragon.config.CELL;
    const centerPx = b.center.x * CELL + CELL / 2;
    const centerPy = b.center.y * CELL + CELL / 2;
    for (const wp of b.weakpoints) {
      const a = b.angle + wp.offsetAngle;
      wp.px = centerPx + Math.cos(a) * b.radius * CELL;
      wp.py = centerPy + Math.sin(a) * b.radius * CELL;
      wp.x = b.center.x + Math.round(Math.cos(a) * b.radius);
      wp.y = b.center.y + Math.round(Math.sin(a) * b.radius);
    }
  }

  // ---------- Wurzelherz (Level 10) ----------
  register({
    id: 'wurzelherz',
    name: 'Wurzelherz',
    subtitle: 'Hüter der Wälder',
    intro: 'Im Zentrum des Hains wartet regungslos ein uralter Wächter — das Wurzelherz. Vier goldene Dornenknospen umkreisen seinen dornigen Leib rastlos. Wenn du zu nahe kommst, speit er giftige Sporen aus, die dich verfolgen.',
    hint: 'Zerstöre alle vier Knospen nahezu gleichzeitig — nachwachsende Knospen heilen den Boss wieder um ihren Anteil. Nur wenn alle vier weg sind, stirbt das Wurzelherz. Weiche grünen Giftsporen aus, bevor du angreifst.',
    init(state) {
      const W = Dragon.config.W, H = Dragon.config.H;
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      const segments = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          segments.push({ x: cx + dx, y: cy + dy });
        }
      }
      const weakpoints = [0, 1, 2, 3].map(i => ({
        id: i,
        offsetAngle: (i / 4) * Math.PI * 2,
        active: true,
        respawnAt: 0,
        x: cx, y: cy, px: 0, py: 0,
      }));
      state.boss = {
        id: 'wurzelherz',
        name: 'Wurzelherz',
        hp: 100,
        maxHp: 100,
        center: { x: cx, y: cy },
        segments,
        weakpoints,
        baseRadius: 4,
        radius: 4,
        radiusT: 0,
        angle: -Math.PI / 2,
        angularSpeed: 0.0014,
        damagePerHit: 25,
        healPerRespawn: 15,
        respawnMs: 5000,
        spores: [],
        sporeCd: 5000,
        sporeInterval: 7500,
        sporeSpeed: 2.6,
        sporeLifeMs: 6000,
        sporeDamage: 22,
      };
      updateWeakpointPositions(state.boss);
    },
    update(state, dt) {
      const b = state.boss;
      if (!b) return;
      b.angle += dt * b.angularSpeed;
      b.radiusT = (b.radiusT || 0) + dt;
      b.radius = b.baseRadius + Math.sin(b.radiusT * 0.0009) * 1.3;
      updateWeakpointPositions(b);
      for (const wp of b.weakpoints) {
        if (!wp.active) {
          wp.respawnAt -= dt;
          if (wp.respawnAt <= 0) {
            wp.active = true;
            b.hp = Math.min(b.maxHp, b.hp + b.healPerRespawn);
            Dragon.particles.burst({ x: wp.x, y: wp.y }, 14, '#8fff8f');
            Dragon.particles.floatText({ x: wp.x, y: wp.y }, `+${b.healPerRespawn}`, 800);
          }
        }
      }

      b.sporeCd -= dt;
      if (b.sporeCd <= 0 && state.countdown <= 0) {
        const CELL = Dragon.config.CELL;
        b.spores.push({
          px: b.center.x * CELL + CELL / 2,
          py: b.center.y * CELL + CELL / 2,
          vx: 0, vy: 0,
          life: b.sporeLifeMs,
        });
        b.sporeCd = b.sporeInterval;
        Dragon.particles.burst(b.center, 20, '#8ed058');
      }

      const CELL = Dragon.config.CELL;
      const head = state.snake[0];
      const hx = head ? head.x * CELL + CELL / 2 : 0;
      const hy = head ? head.y * CELL + CELL / 2 : 0;
      const survivors = [];
      for (const sp of b.spores) {
        if (head) {
          const dx = hx - sp.px;
          const dy = hy - sp.py;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          sp.vx = sp.vx * 0.92 + (dx / dist) * b.sporeSpeed * 0.08;
          sp.vy = sp.vy * 0.92 + (dy / dist) * b.sporeSpeed * 0.08;
        }
        sp.px += sp.vx;
        sp.py += sp.vy;
        sp.life -= dt;
        if (head) {
          const ddx = hx - sp.px;
          const ddy = hy - sp.py;
          if (Math.sqrt(ddx * ddx + ddy * ddy) < CELL * 0.6) {
            Dragon.particles.burst({ x: head.x, y: head.y }, 18, '#8ed058');
            if (Dragon.game && Dragon.game.takeDamage) {
              Dragon.game.takeDamage(state, b.sporeDamage, 'Giftspore');
            }
            continue;
          }
        }
        if (sp.life > 0) survivors.push(sp);
      }
      b.spores = survivors;
    },
    onHeadEntersCell(state, cell) {
      const b = state.boss;
      if (!b) return false;
      const CELL = Dragon.config.CELL;
      const hx = cell.x * CELL + CELL / 2;
      const hy = cell.y * CELL + CELL / 2;
      const thresholdSq = (CELL * 0.95) * (CELL * 0.95);
      for (const wp of b.weakpoints) {
        if (!wp.active) continue;
        const dx = hx - wp.px;
        const dy = hy - wp.py;
        if (dx * dx + dy * dy < thresholdSq) {
          wp.active = false;
          wp.respawnAt = b.respawnMs;
          b.hp = Math.max(0, b.hp - b.damagePerHit);
          Dragon.particles.burst(cell, 24, '#ffd860');
          Dragon.particles.floatText(cell, `-${b.damagePerHit}`, 800);
          state.screenShake = Math.max(state.screenShake, 6);
          if (b.hp <= 0) onDefeat(state);
          return 'weakpoint';
        }
      }
      if (b.segments.some(s => s.x === cell.x && s.y === cell.y)) {
        return 'body';
      }
      return false;
    },
  });

  function onDefeat(state) {
    const b = state.boss;
    if (!b) return;
    for (const seg of b.segments) Dragon.particles.burst(seg, 16, '#ffd060');
    for (const wp of b.weakpoints) Dragon.particles.burst({ x: wp.x, y: wp.y }, 20, '#ffe27a');
    state.screenShake = Math.max(state.screenShake, 14);
    Dragon.scoring.add(state, 500, b.center, 'Boss-Bonus +500');
    state.totalCoins += 100;
    state.boss = null;
    if (Dragon.game && Dragon.game.levelComplete) {
      setTimeout(() => Dragon.game.levelComplete(), 400);
    }
  }

  function start(state, bossId) {
    const def = defs[bossId];
    if (!def) return false;
    def.init(state);
    state.boss._def = def;
    return true;
  }

  function update(state, dt) {
    const b = state.boss;
    if (!b || !b._def) return;
    if (b._def.update) b._def.update(state, dt);
  }

  function onHeadEntersCell(state, cell) {
    const b = state.boss;
    if (!b || !b._def || !b._def.onHeadEntersCell) return false;
    return b._def.onHeadEntersCell(state, cell);
  }

  Dragon.bosses = { register, get, list, start, update, onHeadEntersCell, onDefeat };
})(window.Dragon = window.Dragon || {});
