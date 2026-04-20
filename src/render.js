(function (Dragon) {
  'use strict';
  const { CELL, W } = Dragon.config;

  let canvas, ctx;

  function init(canvasEl) {
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
  }

  function render(state, ts) {
    const lvl = Dragon.levels.get(state.levelIdx);
    const theme = lvl.theme;

    ctx.save();
    if (state.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * state.screenShake, (Math.random() - 0.5) * state.screenShake);
      state.screenShake = Math.max(0, state.screenShake - 0.5);
    }

    drawBackground(theme);
    drawGrid(theme);
    if (theme.name === 'Sternennebel' || theme.name === 'Schattenreich') drawStarfield(ts);

    for (const dec of state.decorations) Dragon.decorations.draw(ctx, dec, ts);
    for (const w of state.walls)  drawWall(w, theme);
    for (const s of state.spikes) drawFloorSpike(s);
    for (const r of state.rivals) Dragon.rivals.draw(ctx, r, ts);

    for (const item of state.items) {
      const def = Dragon.items.types[item.type];
      if (def && def.draw) def.draw(ctx, item, ts);
    }

    for (const f of state.fireballs) drawFireball(f);
    if (state.firestorms && state.firestorms.length) drawFirestorms(state);
    if (state.boss) drawBoss(state, ts);

    Dragon.dragonRenderer.draw(ctx, state, ts);

    if (state.activeEffects.hammer > 0) drawHammer(state, ts);

    drawParticles(state);
    drawFloatTexts(state);
    drawEffectOverlays(state);
    drawCountdown(state);

    ctx.restore();
  }

  function drawBackground(theme) {
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, theme.bg1);
    g.addColorStop(1, theme.bg2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid(theme) {
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= W; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL + 0.5, 0); ctx.lineTo(i * CELL + 0.5, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL + 0.5); ctx.lineTo(canvas.width, i * CELL + 0.5); ctx.stroke();
    }
  }

  function drawStarfield(ts) {
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + ts * 0.01) % canvas.width);
      const sy = ((i * 89) % canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.1 + (i % 5) * 0.05) + ')';
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  function drawWall(w, theme) {
    const v = w.variant;
    if      (v === 'trunk')         drawTrunk(w);
    else if (v === 'leaves')        drawLeaves(w);
    else if (v === 'bush')          drawBush(w);
    else if (v === 'hut_wall')      drawHutWall(w);
    else if (v === 'tower_wall')    drawTowerWall(w);
    else if (v === 'glacier_peak')  drawGlacierPeak(w);
    else if (v === 'glacier_base')  drawGlacierBase(w);
    else if (v === 'iceshard')      drawIceshard(w);
    else                            drawGenericWall(w, theme);

    if (w.spiked) drawWallSpikes(w.x * CELL, w.y * CELL);
  }

  function drawGenericWall(w, theme) {
    const px = w.x * CELL, py = w.y * CELL;
    const g = ctx.createLinearGradient(px, py, px, py + CELL);
    g.addColorStop(0, theme.wall);
    g.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = g;
    roundRect(px + 2, py + 2, CELL - 4, CELL - 4, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();
  }

  function drawTrunk(w) {
    const px = w.x * CELL, py = w.y * CELL;
    const g = ctx.createLinearGradient(px, py, px + CELL, py);
    g.addColorStop(0, '#5a3818');
    g.addColorStop(0.5, '#8a5a28');
    g.addColorStop(1, '#3a2410');
    ctx.fillStyle = g;
    roundRect(px + 3, py + 3, CELL - 6, CELL - 6, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,0,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const ly = py + 6 + i * 5;
      ctx.moveTo(px + 5, ly);
      ctx.lineTo(px + CELL - 5, ly);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,160,0.22)';
    ctx.beginPath();
    ctx.moveTo(px + 5, py + 5); ctx.lineTo(px + 5, py + CELL - 5);
    ctx.stroke();
  }

  function drawLeaves(w) {
    const px = w.x * CELL + CELL / 2, py = w.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = 'rgba(20,40,10,0.4)';
    ctx.shadowBlur = 6;
    const g = ctx.createRadialGradient(-2, -2, 1, 0, 0, CELL / 2);
    g.addColorStop(0, '#8cd45a');
    g.addColorStop(0.7, '#4a8a2a');
    g.addColorStop(1, '#264a15');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, CELL / 2 - 2, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,210,0.28)';
    ctx.beginPath(); ctx.arc(-4, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,40,10,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, CELL / 2 - 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawBush(w) {
    const px = w.x * CELL + CELL / 2, py = w.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = 'rgba(20,40,10,0.6)'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#3e7a1f';
    ctx.beginPath(); ctx.arc(-5, 4, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, 4, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -5, 9, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#5aa838';
    ctx.beginPath(); ctx.arc(-5, 3, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, 3, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -4, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,255,170,0.45)';
    ctx.beginPath(); ctx.arc(-3, -2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4, 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(30,55,15,0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(-5, 4, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(5, 4, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -5, 9, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawTowerWall(w) {
    const px = w.x * CELL, py = w.y * CELL;
    const g = ctx.createLinearGradient(px, py, px, py + CELL);
    g.addColorStop(0, '#b0a592');
    g.addColorStop(0.5, '#7d7363');
    g.addColorStop(1, '#48413a');
    ctx.fillStyle = g;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.strokeStyle = 'rgba(30,25,20,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 1,      py + 8);  ctx.lineTo(px + CELL - 1, py + 8);
    ctx.moveTo(px + 1,      py + 16); ctx.lineTo(px + CELL - 1, py + 16);
    ctx.moveTo(px + 8,      py + 1);  ctx.lineTo(px + 8,        py + 8);
    ctx.moveTo(px + 16,     py + 8);  ctx.lineTo(px + 16,       py + 16);
    ctx.moveTo(px + 10,     py + 16); ctx.lineTo(px + 10,       py + CELL - 1);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,220,0.3)';
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 2); ctx.lineTo(px + CELL - 2, py + 2);
    ctx.moveTo(px + 2, py + 2); ctx.lineTo(px + 2,        py + CELL - 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,15,10,0.55)';
    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
  }

  function drawHutWall(w) {
    const px = w.x * CELL, py = w.y * CELL;
    const g = ctx.createLinearGradient(px, py, px + CELL, py + CELL);
    g.addColorStop(0, '#9a6830');
    g.addColorStop(0.5, '#7a4c1c');
    g.addColorStop(1, '#4a2c10');
    ctx.fillStyle = g;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    ctx.strokeStyle = 'rgba(30,20,10,0.65)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 1, py + 8);  ctx.lineTo(px + CELL - 1, py + 8);
    ctx.moveTo(px + 1, py + 16); ctx.lineTo(px + CELL - 1, py + 16);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,160,0.28)';
    ctx.beginPath();
    ctx.moveTo(px + 1, py + 2); ctx.lineTo(px + CELL - 1, py + 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,20,10,0.5)';
    ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);
  }

  function drawGlacierPeak(w) {
    const px = w.x * CELL + CELL / 2, py = w.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = 'rgba(160,210,240,0.7)';
    ctx.shadowBlur = 10;
    const g = ctx.createLinearGradient(0, -12, 0, 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#cfe5f2');
    g.addColorStop(1, '#7aa8c4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, 10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(60,110,150,0.55)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2, -6); ctx.lineTo(-5, 4);
    ctx.stroke();
    ctx.restore();
  }

  function drawGlacierBase(w) {
    const px = w.x * CELL, py = w.y * CELL;
    const g = ctx.createLinearGradient(px, py, px, py + CELL);
    g.addColorStop(0, '#e0eef7');
    g.addColorStop(1, '#7aa8c4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(px + 2, py + 4);
    ctx.lineTo(px + CELL / 2, py + 1);
    ctx.lineTo(px + CELL - 2, py + 4);
    ctx.lineTo(px + CELL - 2, py + CELL - 2);
    ctx.lineTo(px + 2, py + CELL - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,110,150,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,230,250,0.7)';
    ctx.beginPath();
    ctx.moveTo(px + 7, py + 6); ctx.lineTo(px + 5, py + 16);
    ctx.moveTo(px + 14, py + 8); ctx.lineTo(px + 16, py + 18);
    ctx.stroke();
  }

  function drawIceshard(w) {
    const px = w.x * CELL + CELL / 2, py = w.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = 'rgba(180,230,250,0.6)';
    ctx.shadowBlur = 8;
    const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.6, '#bde0f0');
    g.addColorStop(1, '#5a8aaa');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, -2);
    ctx.lineTo(8, 6);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-7, -2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,110,150,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawWallSpikes(px, py) {
    ctx.fillStyle = '#e8dcc8';
    ctx.strokeStyle = 'rgba(40,20,10,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // up
    ctx.moveTo(px + CELL * 0.3, py + 2);
    ctx.lineTo(px + CELL * 0.5, py - 6);
    ctx.lineTo(px + CELL * 0.7, py + 2);
    // down
    ctx.moveTo(px + CELL * 0.3, py + CELL - 2);
    ctx.lineTo(px + CELL * 0.5, py + CELL + 6);
    ctx.lineTo(px + CELL * 0.7, py + CELL - 2);
    // left
    ctx.moveTo(px + 2, py + CELL * 0.3);
    ctx.lineTo(px - 6, py + CELL * 0.5);
    ctx.lineTo(px + 2, py + CELL * 0.7);
    // right
    ctx.moveTo(px + CELL - 2, py + CELL * 0.3);
    ctx.lineTo(px + CELL + 6, py + CELL * 0.5);
    ctx.lineTo(px + CELL - 2, py + CELL * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawFloorSpike(s) {
    const active = Dragon.world.spikeActive(s);
    const px = s.x * CELL + CELL / 2, py = s.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    if (active) {
      ctx.fillStyle = '#ff4d6d';
      ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 14;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
        const a2 = a + Math.PI / 6;
        ctx.lineTo(Math.cos(a2) * 4, Math.sin(a2) * 4);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255,77,109,0.25)';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFireball(f) {
    const px = f.x * CELL + CELL / 2, py = f.y * CELL + CELL / 2;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = '#ff6f4a';
    ctx.shadowColor = '#ff6f4a'; ctx.shadowBlur = 20;
    const s = Math.max(0.1, f.life / 500);
    ctx.beginPath(); ctx.arc(0, 0, 8 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath(); ctx.arc(0, 0, 4 * s, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawBoss(state, ts) {
    const b = state.boss;
    if (!b) return;
    ctx.save();
    for (const seg of b.segments) {
      const px = seg.x * CELL + CELL / 2;
      const py = seg.y * CELL + CELL / 2;
      ctx.fillStyle = '#4a2818';
      ctx.shadowColor = '#7a1f28';
      ctx.shadowBlur = 14;
      ctx.fillRect(px - CELL / 2 + 1, py - CELL / 2 + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = '#3a1a0c';
      ctx.fillRect(px - CELL / 2 + 4, py - CELL / 2 + 4, CELL - 8, CELL - 8);
      const thornPulse = 0.6 + 0.4 * Math.sin(ts / 400 + seg.x * 0.7 + seg.y * 0.5);
      ctx.fillStyle = `rgba(140, 50, 40, ${thornPulse})`;
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const wp of b.weakpoints) {
      if (!wp.active) continue;
      const px = (wp.px != null) ? wp.px : (wp.x * CELL + CELL / 2);
      const py = (wp.py != null) ? wp.py : (wp.y * CELL + CELL / 2);
      const pulse = 0.85 + 0.15 * Math.sin(ts / 300);
      const radius = (CELL / 2 - 2) * pulse;
      ctx.shadowColor = '#ffd060';
      ctx.shadowBlur = 20;
      const grad = ctx.createRadialGradient(px, py, 2, px, py, radius);
      grad.addColorStop(0, '#fff4a8');
      grad.addColorStop(0.5, '#ffd060');
      grad.addColorStop(1, '#b88420');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(60, 30, 10, 0.8)';
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2 + ts / 800;
        ctx.beginPath();
        ctx.arc(px + Math.cos(a) * radius * 0.55, py + Math.sin(a) * radius * 0.55, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (b.spores && b.spores.length) {
      for (const sp of b.spores) {
        const fade = Math.max(0.75, Math.min(1, sp.life / 800));
        ctx.globalAlpha = fade;
        const pulse = 0.9 + 0.15 * Math.sin(ts / 130 + sp.px * 0.1);

        ctx.shadowColor = '#9fff5a';
        ctx.shadowBlur = 32;
        ctx.fillStyle = 'rgba(200, 255, 120, 0.35)';
        ctx.beginPath(); ctx.arc(sp.px, sp.py, 14 * pulse, 0, Math.PI * 2); ctx.fill();

        ctx.shadowColor = '#6cd02a';
        ctx.shadowBlur = 22;
        const r1 = 10 * pulse;
        const grad = ctx.createRadialGradient(sp.px, sp.py, 1, sp.px, sp.py, r1);
        grad.addColorStop(0, '#f2ffd0');
        grad.addColorStop(0.45, '#9fff5a');
        grad.addColorStop(1, '#3a7018');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(sp.px, sp.py, r1, 0, Math.PI * 2); ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(20, 50, 5, 0.9)';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(sp.px, sp.py, r1, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = 'rgba(20, 50, 5, 0.85)';
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + ts / 350;
          ctx.beginPath();
          ctx.arc(sp.px + Math.cos(a) * r1 * 0.55, sp.py + Math.sin(a) * r1 * 0.55, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawFirestorms(state) {
    ctx.save();
    ctx.shadowColor = '#ff8a3a';
    ctx.shadowBlur = 14;
    for (const f of state.firestorms) {
      const fade = Math.max(0.15, Math.min(1, f.life / 600));
      ctx.fillStyle = '#ff6f4a';
      ctx.globalAlpha = fade;
      ctx.beginPath(); ctx.arc(f.px, f.py, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath(); ctx.arc(f.px, f.py, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawParticles(state) {
    for (const p of state.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life / 800);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function drawFloatTexts(state) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px "Cinzel", "Palatino Linotype", Georgia, serif';
    ctx.lineJoin = 'round';
    for (const t of state.floatTexts) {
      ctx.globalAlpha = Math.max(0, t.life / 900);
      ctx.strokeStyle = 'rgba(10,5,0,0.95)';
      ctx.lineWidth = 4;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(t.text, t.x, t.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawEffectOverlays(state) {
    if (state.activeEffects.slowtime > 0) {
      drawSlowtimeOverlay();
    }
    if (state.activeEffects.ghost > 0) {
      ctx.fillStyle = 'rgba(200,150,255,0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (state.iframes > 0) {
      const pulse = 0.08 + Math.sin(performance.now() / 80) * 0.04;
      ctx.fillStyle = `rgba(255,230,180,${pulse})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawSlowtimeOverlay() {
    const w = canvas.width, h = canvas.height;
    const t = performance.now() / 1000;

    ctx.fillStyle = 'rgba(80,180,230,0.16)';
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2, cy = h / 2;
    const vignette = ctx.createRadialGradient(cx, cy, w * 0.22, cx, cy, w * 0.75);
    vignette.addColorStop(0, 'rgba(80,180,230,0)');
    vignette.addColorStop(0.55, 'rgba(80,180,230,0.1)');
    vignette.addColorStop(1, 'rgba(60,140,200,0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const edge = 36;

    const topGrad = ctx.createLinearGradient(0, 0, 0, edge);
    topGrad.addColorStop(0, 'rgba(210,230,255,0.65)');
    topGrad.addColorStop(0.35, 'rgba(220,180,255,0.4)');
    topGrad.addColorStop(0.7, 'rgba(180,220,255,0.2)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, edge);

    const botGrad = ctx.createLinearGradient(0, h - edge, 0, h);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(0.3, 'rgba(160,255,220,0.22)');
    botGrad.addColorStop(0.65, 'rgba(180,220,255,0.4)');
    botGrad.addColorStop(1, 'rgba(230,220,255,0.65)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h - edge, w, edge);

    const leftGrad = ctx.createLinearGradient(0, 0, edge, 0);
    leftGrad.addColorStop(0, 'rgba(210,230,255,0.65)');
    leftGrad.addColorStop(0.35, 'rgba(180,255,220,0.32)');
    leftGrad.addColorStop(0.7, 'rgba(180,220,255,0.18)');
    leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leftGrad;
    ctx.fillRect(0, 0, edge, h);

    const rightGrad = ctx.createLinearGradient(w - edge, 0, w, 0);
    rightGrad.addColorStop(0, 'rgba(0,0,0,0)');
    rightGrad.addColorStop(0.3, 'rgba(180,220,255,0.18)');
    rightGrad.addColorStop(0.65, 'rgba(230,180,255,0.35)');
    rightGrad.addColorStop(1, 'rgba(230,220,255,0.65)');
    ctx.fillStyle = rightGrad;
    ctx.fillRect(w - edge, 0, edge, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    const speed = 120;
    for (let i = 0; i < 8; i++) {
      const alpha = 0.25 + Math.abs(Math.sin(t * 2.4 + i * 0.7)) * 0.55;
      ctx.globalAlpha = alpha;
      const xA = ((t * speed + i * 160) % (w + 80)) - 40;
      ctx.beginPath();
      ctx.moveTo(xA, 0);        ctx.lineTo(xA + 28, 22);
      ctx.moveTo(w - xA, h);    ctx.lineTo(w - xA - 28, h - 22);
      ctx.stroke();
      const yA = ((t * speed + i * 160) % (h + 80)) - 40;
      ctx.beginPath();
      ctx.moveTo(0, yA);        ctx.lineTo(22, yA + 28);
      ctx.moveTo(w, h - yA);    ctx.lineTo(w - 22, h - yA - 28);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    const pulse = 0.5 + Math.sin(t * 1.8) * 0.5;
    ctx.globalAlpha = 0.25 + pulse * 0.35;
    ctx.strokeRect(edge * 0.4, edge * 0.4, w - edge * 0.8, h - edge * 0.8);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawCountdown(state) {
    if (!state.running || state.countdown <= 0) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const sec = state.countdown / 1000;
    const label = sec > 1 ? String(Math.ceil(sec)) : (sec > 0 ? '1' : 'LOS!');
    const frac = sec - Math.floor(sec);
    const scale = 1.4 - frac * 0.6;
    const alpha = 0.3 + frac * 0.7;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha;
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(255,250,230,0.95)';
    ctx.strokeStyle = 'rgba(138,26,48,0.95)';
    ctx.lineWidth = 6;
    ctx.font = 'bold 160px "MedievalSharp", "Cinzel", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(40,20,0,0.85)';
    ctx.shadowBlur = 24;
    ctx.strokeText(label, 0, 0);
    ctx.fillText(label, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff4d2';
    ctx.font = 'italic 18px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(40,20,0,0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText('Mach dich bereit …', cx, cy + 100);
    ctx.restore();
  }

  function drawHammer(state, ts) {
    const head = state.snake[0];
    if (!head) return;
    const prog = state.tickMs > 0 ? Math.min(1, (state.tickAcc || 0) / state.tickMs) : 0;
    const prev = (state.prevSnake && state.prevSnake[0]) || head;
    const dx = head.x - prev.x, dy = head.y - prev.y;
    const wrapped = Math.abs(dx) > 2 || Math.abs(dy) > 2;
    const vx = wrapped ? head.x : prev.x + dx * prog;
    const vy = wrapped ? head.y : prev.y + dy * prog;
    const cx = vx * CELL + CELL / 2;
    const cy = vy * CELL + CELL / 2;
    const tier = Dragon.abilities.levelOf(state, 'hammer');
    const radius = (tier >= 2 ? 2.5 : 1.8) * 1.7 * CELL;
    const ang = state.hammerAngle || 0;
    const hx = cx + Math.cos(ang) * radius;
    const hy = cy + Math.sin(ang) * radius;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 220, 120, 0.35)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, ang - 1.1, ang);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 240, 180, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, ang - 0.5, ang);
    ctx.stroke();

    ctx.strokeStyle = '#7a5828';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.translate(hx, hy);
    ctx.rotate(ang + Math.PI / 2);
    ctx.shadowColor = '#ffd060';
    ctx.shadowBlur = 14;

    const grad = ctx.createLinearGradient(-12, -8, 12, 8);
    grad.addColorStop(0, '#e8dcc8');
    grad.addColorStop(0.4, '#8a7560');
    grad.addColorStop(1, '#3a2818');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1a0e04';
    ctx.lineWidth = 2;
    ctx.fillRect(-14, -9, 28, 18);
    ctx.strokeRect(-14, -9, 28, 18);
    ctx.fillStyle = '#c9a227';
    ctx.fillRect(-12, -1, 24, 2);
    ctx.fillRect(-12, -7, 3, 14);
    ctx.fillRect(9, -7, 3, 14);

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  Dragon.renderer = { init, render };
})(window.Dragon = window.Dragon || {});
