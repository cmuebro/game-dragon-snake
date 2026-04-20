(function (Dragon) {
  'use strict';
  const { CELL, W, H, DAMAGE, RIVAL_MAX_HP } = Dragon.config;

  function rand(n) { return Math.floor(Math.random() * n); }

  function generate(count, walls, playerSnake, playerTick) {
    const arr = [];
    let tries = 0;
    const baseTick = playerTick || 150;
    while (arr.length < count && tries < 400) {
      tries++;
      const hx = 4 + rand(W - 8);
      const hy = 4 + rand(H - 8);
      if (walls && walls.some(w => w.x === hx && w.y === hy)) continue;
      if (playerSnake && playerSnake.some(s => Math.abs(s.x - hx) < 5 && Math.abs(s.y - hy) < 5)) continue;
      if (arr.some(r => r.segments.some(s => Math.abs(s.x - hx) < 3 && Math.abs(s.y - hy) < 3))) continue;
      const length = 5 + rand(3);
      const segments = [];
      for (let j = 0; j < length; j++) segments.push({ x: hx + j, y: hy });
      arr.push({
        segments,
        dir: { x: -1, y: 0 },
        hp: RIVAL_MAX_HP,
        maxHp: RIVAL_MAX_HP,
        hue: 180 + Math.floor(Math.random() * 120),
        stepInterval: baseTick * (1.1 + Math.random() * 0.3),
        stepAcc: Math.random() * baseTick,
      });
    }
    return arr;
  }

  function step(state, dt) {
    for (const r of [...state.rivals]) {
      if (r.frozen > 0) continue;
      r.stepAcc = (r.stepAcc || 0) + dt;
      let safety = 4;
      while (r.stepAcc >= r.stepInterval && safety-- > 0) {
        r.stepAcc -= r.stepInterval;
        moveOne(state, r);
      }
    }
  }

  function moveOne(state, r) {
    if (r.frozen > 0) return;
    r.prevSegments = r.segments.map(s => ({ x: s.x, y: s.y }));
    const head = r.segments[0];
    const ph = state.snake[0];
    let candidates;
    if (ph && Math.random() < 0.35) {
      const dx = ph.x - head.x, dy = ph.y - head.y;
      const dom = Math.abs(dx) > Math.abs(dy)
        ? { x: Math.sign(dx) || 1, y: 0 }
        : { x: 0, y: Math.sign(dy) || 1 };
      const sub = Math.abs(dx) > Math.abs(dy)
        ? { x: 0, y: Math.sign(dy) || 1 }
        : { x: Math.sign(dx) || 1, y: 0 };
      candidates = [dom, sub, { x: -dom.x, y: -dom.y }, { x: -sub.x, y: -sub.y }];
    } else {
      candidates = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
        .sort(() => Math.random() - 0.5);
    }
    const forwardCandidates = candidates.filter(d => !(d.x === -r.dir.x && d.y === -r.dir.y));

    let moved = false;
    for (const d of forwardCandidates) {
      if (tryMove(state, r, head, d, false)) { moved = true; break; }
    }
    if (!moved) {
      const allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
        .sort(() => Math.random() - 0.5);
      for (const d of allDirs) {
        if (tryMove(state, r, head, d, true)) break;
      }
    }
  }

  function tryMove(state, r, head, d, allowSelfPass) {
    const n = { x: head.x + d.x, y: head.y + d.y };
    if (n.x < 1 || n.x >= W - 1 || n.y < 1 || n.y >= H - 1) return false;
    if (state.walls.some(w => w.x === n.x && w.y === n.y)) return false;
    if (state.rivals.some(o => o !== r && o.segments.some(s => s.x === n.x && s.y === n.y))) return false;
    if (!allowSelfPass && r.segments.some(s => s.x === n.x && s.y === n.y)) return false;

    if (state.snake.some(s => s.x === n.x && s.y === n.y)) {
      damage(state, r, DAMAGE.RIVAL_BUMP);
      Dragon.particles.burst(n, 14, '#ffe27a');
      return true;
    }

    r.dir = d;
    r.segments.unshift(n);
    r.segments.pop();
    return true;
  }

  function damage(state, r, amount) {
    r.hp = Math.max(0, r.hp - amount);
    Dragon.particles.burst(r.segments[0], 12, '#ff6f4a');
    if (r.hp <= 0) kill(state, r);
  }

  function kill(state, r) {
    const idx = state.rivals.indexOf(r);
    if (idx < 0) return;
    state.rivals.splice(idx, 1);
    for (const s of r.segments) Dragon.particles.burst(s, 18, '#ff4d6d');
    Dragon.scoring.collect(state, { score: 50, coins: 10, cell: r.segments[0], icon: '🐉' });
  }

  function draw(ctx, r, ts) {
    const len = r.segments.length;
    const prog = r.stepInterval > 0 ? Math.min(1, (r.stepAcc || 0) / r.stepInterval) : 0;
    const prev = r.prevSegments || r.segments;
    const visual = new Array(len);
    for (let i = 0; i < len; i++) {
      const cur = r.segments[i];
      const old = prev[i] || cur;
      visual[i] = {
        x: old.x + (cur.x - old.x) * prog,
        y: old.y + (cur.y - old.y) * prog,
      };
    }

    for (let i = len - 1; i >= 1; i--) {
      const segV = visual[i];
      const px = segV.x * CELL + CELL / 2, py = segV.y * CELL + CELL / 2;
      const t = i / len;
      ctx.save();
      ctx.translate(px, py);
      const rr = CELL / 2 - 3 - t * 2;
      ctx.shadowColor = `hsl(${r.hue}, 70%, 55%)`;
      ctx.shadowBlur = 8;
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, rr + 2);
      g.addColorStop(0, `hsl(${r.hue}, 75%, 60%)`);
      g.addColorStop(1, `hsl(${r.hue + 20}, 65%, 28%)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const headV = visual[0];
    const hx = headV.x * CELL + CELL / 2, hy = headV.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(Math.atan2(r.dir.y, r.dir.x));
    ctx.shadowColor = `hsl(${r.hue}, 70%, 55%)`;
    ctx.shadowBlur = 12;
    const hg = ctx.createRadialGradient(-2, 0, 2, 0, 0, 11);
    hg.addColorStop(0, `hsl(${r.hue}, 85%, 65%)`);
    hg.addColorStop(1, `hsl(${r.hue + 20}, 75%, 28%)`);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(6, -8, -7, -7);
    ctx.quadraticCurveTo(-10, 0, -7, 7);
    ctx.quadraticCurveTo(6, 8, 10, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e6d8a8';
    ctx.beginPath(); ctx.moveTo(-4, -7); ctx.lineTo(-2, -11); ctx.lineTo(0, -6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4,  7); ctx.lineTo(-2,  11); ctx.lineTo(0,  6); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(3, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0020';
    ctx.beginPath(); ctx.arc(4, -2, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const barW = 32, barH = 4;
    const bx = hx - barW / 2, by = hy - CELL / 2 - 7;
    ctx.fillStyle = 'rgba(30,10,0,0.65)';
    ctx.fillRect(bx, by, barW, barH);
    const ratio = r.hp / r.maxHp;
    ctx.fillStyle = ratio > 0.5 ? '#7bffa9' : (ratio > 0.25 ? '#ffd060' : '#ff4d6d');
    ctx.fillRect(bx, by, barW * ratio, barH);
    ctx.strokeStyle = 'rgba(255,240,200,0.7)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx - 0.5, by - 0.5, barW + 1, barH + 1);

    if (r.frozen > 0) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.fillStyle = 'rgba(200,240,255,0.35)';
      ctx.beginPath(); ctx.arc(0, 0, CELL / 2 + 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(140,220,255,0.95)';
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + (ts / 600);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 4, Math.sin(a) * 4);
        ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  Dragon.rivals = { generate, step, damage, kill, draw };
})(window.Dragon = window.Dragon || {});
