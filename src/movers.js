(function (Dragon) {
  'use strict';
  const { CELL, W, H } = Dragon.config;

  function rand(n) { return Math.floor(Math.random() * n); }

  function generate(count, walls) {
    const arr = [];
    let tries = 0;
    while (arr.length < count && tries < 200) {
      tries++;
      const c = { x: 4 + rand(W - 8), y: 4 + rand(H - 8), cooldown: 0 };
      if (walls && walls.some(w => w.x === c.x && w.y === c.y)) continue;
      if (arr.some(o => o.x === c.x && o.y === c.y)) continue;
      arr.push(c);
    }
    return arr;
  }

  function step(state) {
    for (const m of state.movers) {
      if (m.cooldown > 0) { m.cooldown--; continue; }
      m.cooldown = 2 + rand(3);
      const h = state.snake[0];
      const dx = h.x - m.x, dy = h.y - m.y;
      let tryDirs;
      if (Math.abs(dx) > Math.abs(dy)) {
        tryDirs = [{ x: Math.sign(dx) || 1, y: 0 }, { x: 0, y: Math.sign(dy) || 1 }];
      } else {
        tryDirs = [{ x: 0, y: Math.sign(dy) || 1 }, { x: Math.sign(dx) || 1, y: 0 }];
      }
      if (Math.random() < 0.25) tryDirs.reverse();
      for (const d of tryDirs) {
        const n = { x: m.x + d.x, y: m.y + d.y };
        if (n.x < 1 || n.x >= W - 1 || n.y < 1 || n.y >= H - 1) continue;
        if (state.walls.some(w => w.x === n.x && w.y === n.y)) continue;
        if (state.movers.some(o => o !== m && o.x === n.x && o.y === n.y)) continue;
        m.x = n.x; m.y = n.y;
        break;
      }
    }
  }

  function draw(ctx, m, ts) {
    const px = m.x * CELL + CELL / 2, py = m.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    const wob = Math.sin(ts / 200) * 2;
    ctx.fillStyle = '#ff5ecf';
    ctx.shadowColor = '#ff5ecf'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, wob, 9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-3, wob - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3, wob - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0020';
    ctx.beginPath(); ctx.arc(-3, wob - 2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 3, wob - 2, 1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  Dragon.movers = { generate, step, draw };
})(window.Dragon = window.Dragon || {});
