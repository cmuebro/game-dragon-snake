(function (Dragon) {
  'use strict';
  const { CELL } = Dragon.config;

  function draw(ctx, state, ts) {
    if (!state.snake || state.snake.length === 0) return;
    const lvl = Dragon.levels.get(state.levelIdx);
    const theme = lvl.theme;
    const ghost = state.activeEffects.ghost > 0;
    const len = state.snake.length;

    const prog = state.tickMs > 0 ? Math.min(1, (state.tickAcc || 0) / state.tickMs) : 0;
    const prev = state.prevSnake || state.snake;
    const visual = new Array(len);
    for (let i = 0; i < len; i++) {
      const cur = state.snake[i];
      const old = prev[i] || cur;
      const dx = cur.x - old.x, dy = cur.y - old.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        visual[i] = { x: cur.x, y: cur.y };
      } else {
        visual[i] = { x: old.x + dx * prog, y: old.y + dy * prog };
      }
    }

    for (let i = len - 1; i >= 1; i--) {
      const segV = visual[i];
      const innerV = visual[i - 1];
      const px = segV.x * CELL + CELL / 2, py = segV.y * CELL + CELL / 2;
      const t = i / len;
      const hue = 20 + (1 - t) * 40 + lvl.level * 3;
      ctx.save();
      ctx.translate(px, py);
      ctx.globalAlpha = ghost ? 0.7 : 1;
      const r = CELL / 2 - 2 - t * 3;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 10;
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r + 2);
      g.addColorStop(0, `hsl(${hue}, 80%, 65%)`);
      g.addColorStop(1, `hsl(${hue + 20}, 70%, 30%)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.6, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
      if (i % 2 === 0) {
        const dx = segV.x - innerV.x, dy = segV.y - innerV.y;
        const nx = -dy, ny = dx;
        ctx.fillStyle = `hsl(${hue - 30}, 80%, 50%)`;
        ctx.beginPath();
        ctx.moveTo(nx * 2, ny * 2);
        ctx.lineTo(-nx * 2, -ny * 2);
        ctx.lineTo(0, 0);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }

    const headV = visual[0];
    const headCur = state.snake[0];
    const headPrev = prev[0] || headCur;
    const mdx = headCur.x - headPrev.x;
    const mdy = headCur.y - headPrev.y;
    const headWrapped = Math.abs(mdx) > 2 || Math.abs(mdy) > 2;
    const headAng = (headWrapped || (mdx === 0 && mdy === 0))
      ? Math.atan2(state.dir.y, state.dir.x)
      : Math.atan2(mdy, mdx);

    const hx = headV.x * CELL + CELL / 2, hy = headV.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(headAng);
    ctx.shadowColor = theme.glow;
    ctx.shadowBlur = 18;

    const hg = ctx.createRadialGradient(-2, 0, 2, 0, 0, 13);
    hg.addColorStop(0, `hsl(${30 + lvl.level * 3}, 90%, 70%)`);
    hg.addColorStop(1, `hsl(${10 + lvl.level * 3}, 80%, 30%)`);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(8, -10, -8, -8);
    ctx.quadraticCurveTo(-12, 0, -8, 8);
    ctx.quadraticCurveTo(8, 10, 12, 0);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e6d8a8';
    ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-2, -14); ctx.lineTo(0, -7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4,  8); ctx.lineTo(-2,  14); ctx.lineTo(0,  7); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(4, -3, 2.8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0020';
    ctx.beginPath(); ctx.arc(5, -3, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(5.5, -3.5, 0.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1a0010';
    ctx.beginPath(); ctx.arc(10, -1.5, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10,  1.5, 0.8, 0, Math.PI * 2); ctx.fill();

    if (performance.now() - state.lastEat < 300) {
      ctx.strokeStyle = '#ff3e5a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(18, 0); ctx.stroke();
    }
    ctx.restore();
  }

  Dragon.dragonRenderer = { draw };
})(window.Dragon = window.Dragon || {});
