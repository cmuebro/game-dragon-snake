(function (Dragon) {
  'use strict';
  const { CELL, W, H } = Dragon.config;
  const types = {};

  function register(def) { types[def.id] = def; }

  function rand(n) { return Math.floor(Math.random() * n); }
  function eq(a, b) { return a.x === b.x && a.y === b.y; }

  function freeCell(state) {
    for (let i = 0; i < 300; i++) {
      const c = { x: rand(W), y: rand(H) };
      if (state.snake.some(s => eq(s, c))) continue;
      if (state.walls.some(w => eq(w, c))) continue;
      if (state.rivals.some(r => r.segments.some(seg => eq(seg, c)))) continue;
      if (state.spikes.some(s => eq(s, c))) continue;
      if (state.items.some(it => eq(it, c))) continue;
      return c;
    }
    return null;
  }

  function spawn(state, typeId, cell) {
    cell = cell || freeCell(state);
    if (!cell) return null;
    const item = { type: typeId, x: cell.x, y: cell.y };
    state.items.push(item);
    return item;
  }

  function consume(state, head) {
    const idx = state.items.findIndex(it => it.x === head.x && it.y === head.y);
    if (idx < 0) return null;
    const item = state.items[idx];
    state.items.splice(idx, 1);
    const def = types[item.type];
    if (def && def.onEat) def.onEat(state, item);
    return def;
  }

  // --- Item registry: to add a new item, call Dragon.items.register({...}) ---

  register({
    id: 'food',
    icon: '🍎',
    onEat(state, cell) {
      state.goalProgress++;
      state.lastEat = performance.now();
      Dragon.scoring.add(state, 10, cell);
      Dragon.particles.burst(cell, 14, '#ff7a85');
      const lvl = Dragon.levels.get(state.levelIdx);
      if (state.goalProgress >= lvl.goal) return;
      spawn(state, 'food');
      if (Math.random() < 0.35) spawn(state, 'gem');
      if (Math.random() < 0.25) spawn(state, 'coin');
      if (Math.random() < 0.05) spawn(state, 'star');
      if (Math.random() < 0.04) spawn(state, 'heart');
    },
    draw(ctx, item, ts) {
      const px = item.x * CELL + CELL / 2, py = item.y * CELL + CELL / 2;
      const pulse = 1 + Math.sin(ts / 250) * 0.1;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(pulse, pulse);
      ctx.shadowColor = '#ff7a85'; ctx.shadowBlur = 16;
      ctx.fillStyle = '#ff3e5a';
      ctx.beginPath(); ctx.arc(0, 1, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7bffa9';
      ctx.fillRect(-1, -8, 2, 4);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(-3, -2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  });

  register({
    id: 'gem',
    icon: '💎',
    magnetic: true,
    onEat(state, cell) {
      state.totalGems++;
      Dragon.scoring.collect(state, { score: 50, coins: 5, cell, icon: '💎' });
      Dragon.particles.burst(cell, 20, '#5ee3ff');
    },
    draw(ctx, item, ts) {
      const px = item.x * CELL + CELL / 2, py = item.y * CELL + CELL / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(ts / 500) * 0.2);
      ctx.shadowColor = '#5ee3ff'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#5ee3ff';
      ctx.beginPath();
      ctx.moveTo(0, -9); ctx.lineTo(8, 0); ctx.lineTo(0, 9); ctx.lineTo(-8, 0); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.moveTo(-3, -3); ctx.lineTo(0, -7); ctx.lineTo(3, -3); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  });

  register({
    id: 'coin',
    icon: '🪙',
    magnetic: true,
    onEat(state, cell) {
      Dragon.scoring.collect(state, { score: 10, coins: 3, cell });
      Dragon.particles.burst(cell, 12, '#ffb347');
    },
    draw(ctx, item, ts) {
      const px = item.x * CELL + CELL / 2, py = item.y * CELL + CELL / 2;
      const spin = Math.abs(Math.cos(ts / 300));
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(spin * 0.8 + 0.2, 1);
      ctx.shadowColor = '#ffb347'; ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffb347';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#5a3a10';
      ctx.font = 'bold 10px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, 0);
      ctx.restore();
    },
  });

  register({
    id: 'star',
    icon: '⭐',
    magnetic: true,
    onEat(state, cell) {
      Dragon.scoring.collect(state, { score: 200, coins: 25, cell, icon: '⭐' });
      Dragon.particles.burst(cell, 30, '#ffe27a');
    },
    draw(ctx, item, ts) {
      const px = item.x * CELL + CELL / 2, py = item.y * CELL + CELL / 2;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(ts / 400);
      ctx.fillStyle = '#ffe27a';
      ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 20;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? 10 : 4;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  });

  register({
    id: 'heart',
    icon: '❤',
    onEat(state, cell) {
      if (state.lives < Dragon.config.MAX_LIVES) {
        state.lives++;
        Dragon.particles.floatText(cell, '❤ +1 Leben', 1400);
      } else {
        state.hp = state.maxHp;
        Dragon.particles.floatText(cell, '❤ Vollständige Heilung', 1400);
      }
      Dragon.particles.burst(cell, 14, '#ff4d6d');
    },
    draw(ctx, item, ts) {
      const px = item.x * CELL + CELL / 2, py = item.y * CELL + CELL / 2;
      ctx.save();
      ctx.translate(px, py);
      const s = 1 + Math.sin(ts / 200) * 0.1;
      ctx.scale(s, s);
      ctx.fillStyle = '#ff4d6d';
      ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.bezierCurveTo(8, -3, 10, 2, 0, 9);
      ctx.bezierCurveTo(-10, 2, -8, -3, 0, 5);
      ctx.fill();
      ctx.restore();
    },
  });

  Dragon.items = { types, register, spawn, consume, freeCell };
})(window.Dragon = window.Dragon || {});
