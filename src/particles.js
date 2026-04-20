(function (Dragon) {
  'use strict';
  const { CELL } = Dragon.config;

  function burst(cell, n, color) {
    const cx = cell.x * CELL + CELL / 2;
    const cy = cell.y * CELL + CELL / 2;
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * Math.PI * 2;
      const sp = 1 + Math.random() * 3;
      Dragon.state.particles.push({
        x: cx, y: cy,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        life: 500 + Math.random() * 500,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function floatText(cell, text, life) {
    const px = cell.x * CELL + CELL / 2;
    const py = cell.y * CELL + CELL / 2 - 16;
    const nearby = Dragon.state.floatTexts.filter(t => Math.abs(t.x - px) < 60 && t.life > 500).length;
    Dragon.state.floatTexts.push({
      x: px,
      y: py - nearby * 16,
      text,
      life: life || 900,
      vy: -0.55,
    });
  }

  function update(state, dt) {
    for (const p of state.particles) {
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);

    for (const t of state.floatTexts) { t.y += t.vy; t.life -= dt; }
    state.floatTexts = state.floatTexts.filter(t => t.life > 0);

    for (const f of state.fireballs) { f.life -= dt; }
    state.fireballs = state.fireballs.filter(f => f.life > 0);
  }

  Dragon.particles = { burst, floatText, update };

  Dragon.scoring = {
    add(state, v, at, label) {
      const mult = state.unlocked.has('bonus') ? 1.5 : 1;
      const final = Math.round(v * mult);
      state.score += final;
      if (at) floatText(at, label || ('+' + final), 900);
    },
    collect(state, opts) {
      const scoreMult = state.unlocked.has('bonus') ? 1.5 : 1;
      const bonusTier = (Dragon.abilities && Dragon.abilities.levelOf) ? Dragon.abilities.levelOf(state, 'bonus') : 0;
      const coinMult = bonusTier >= 2 ? 1.3 : 1;
      const score = Math.round((opts.score || 0) * scoreMult);
      const coins = Math.round((opts.coins || 0) * coinMult);
      state.score += score;
      state.totalCoins += coins;
      if (opts.cell && coins > 0) {
        const prefix = opts.icon ? `${opts.icon} ` : '';
        const label = opts.label || `${prefix}🪙 +${coins}`;
        floatText(opts.cell, label, 900);
      }
    },
  };
})(window.Dragon = window.Dragon || {});
