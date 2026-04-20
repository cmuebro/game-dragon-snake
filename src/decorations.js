(function (Dragon) {
  'use strict';
  const { CANVAS_SIZE } = Dragon.config;

  function scatter(count, types) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * CANVAS_SIZE,
        y: Math.random() * CANVAS_SIZE,
        type: types[Math.floor(Math.random() * types.length)],
        hue: Math.random(),
        size: 0.7 + Math.random() * 0.5,
        rot: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }

  const GENERATORS = {
    meadow:   () => scatter(45, ['flower_white', 'flower_pink', 'flower_yellow', 'grass_tuft', 'grass_tuft']),
    forest:   () => scatter(35, ['fern', 'fern', 'mushroom', 'grass_tuft']),
    icicles:  () => scatter(35, ['snowflake', 'snow_patch']),
    rivers:   () => scatter(30, ['crack', 'ember', 'ember']),
    islands:  () => scatter(40, ['star_dec', 'moon_dust', 'moon_dust']),
    coral:    () => scatter(35, ['bubble', 'bubble', 'seaweed']),
    dunes:    () => scatter(25, ['cactus', 'bone']),
    maze:     () => scatter(22, ['rune', 'candle_dec']),
    crystals: () => scatter(30, ['crystal_small', 'sparkle']),
    castle:   () => scatter(20, ['banner', 'shield_dec', 'sparkle']),
  };

  const DRAW = {};

  function register(type, fn) { DRAW[type] = fn; }

  function generateFor(lvl) {
    const gen = GENERATORS[lvl.theme.pattern] || GENERATORS.meadow;
    return gen();
  }

  function draw(ctx, d, ts) {
    const fn = DRAW[d.type];
    if (!fn) return;
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.scale(d.size, d.size);
    ctx.globalAlpha = 0.82;
    fn(ctx, d, ts);
    ctx.restore();
  }

  register('flower_white',  (ctx, d) => flower(ctx, '#ffffff', '#ffd870'));
  register('flower_pink',   (ctx, d) => flower(ctx, '#ffb0c8', '#ffd870'));
  register('flower_yellow', (ctx, d) => flower(ctx, '#ffec88', '#c97030'));

  function flower(ctx, petal, center) {
    ctx.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 3.5, Math.sin(a) * 3.5, 2.4, 4, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = center;
    ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill();
  }

  register('grass_tuft', (ctx) => {
    ctx.strokeStyle = '#4a7a2a';
    ctx.lineWidth = 1.3;
    for (let i = -3; i <= 3; i += 2) {
      ctx.beginPath();
      ctx.moveTo(i, 3);
      ctx.quadraticCurveTo(i * 1.2, -2, i * 0.7, -6);
      ctx.stroke();
    }
  });

  register('fern', (ctx) => {
    ctx.strokeStyle = '#2f5a2a';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(2, 0, 0, -8); ctx.stroke();
    ctx.fillStyle = '#3e7038';
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(k > 0 ? 2.5 : -2.5, -k * 1.6, 1.8, 3.2, k * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  register('mushroom', (ctx) => {
    ctx.fillStyle = '#e8dcc8';
    ctx.fillRect(-1.2, -1, 2.4, 5);
    ctx.fillStyle = '#b8282a';
    ctx.beginPath(); ctx.arc(0, -2, 4.2, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-1.5, -3.5, 0.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(1.2, -2.8, 0.6, 0, Math.PI * 2); ctx.fill();
  });

  register('snowflake', (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 5, Math.sin(a) * 5);
      ctx.stroke();
    }
  });

  register('snow_patch', (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  });

  register('crack', (ctx) => {
    ctx.strokeStyle = 'rgba(60,20,10,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-2, -1);
    ctx.lineTo(0, 1);
    ctx.lineTo(3, -1);
    ctx.lineTo(6, 0);
    ctx.stroke();
  });

  register('ember', (ctx, d, ts) => {
    const p = 0.8 + Math.sin((ts || 0) / 300 + d.rot * 10) * 0.2;
    ctx.fillStyle = '#ffb040';
    ctx.shadowColor = '#ff6030';
    ctx.shadowBlur = 8 * p;
    ctx.beginPath(); ctx.arc(0, 0, 2.6 * p, 0, Math.PI * 2); ctx.fill();
  });

  register('star_dec', (ctx) => {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.9, 3, a, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  register('moon_dust', (ctx) => {
    ctx.fillStyle = 'rgba(220,200,255,0.55)';
    ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
  });

  register('bubble', (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.fillStyle = 'rgba(180,220,255,0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-1.2, -1.2, 0.8, 0, Math.PI * 2); ctx.fill();
  });

  register('seaweed', (ctx) => {
    ctx.strokeStyle = '#3a8a6a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, 7);
    ctx.quadraticCurveTo(3, 0, -1, -5);
    ctx.quadraticCurveTo(-3, -8, 1, -11);
    ctx.stroke();
  });

  register('cactus', (ctx) => {
    ctx.fillStyle = '#4a8a3a';
    ctx.fillRect(-1.8, -7, 3.6, 11);
    ctx.fillRect(-5, -3, 2.2, 4);
    ctx.fillRect(2.8, -4, 2.2, 4);
    ctx.fillStyle = '#1a3a1a';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(-2 + (i % 2) * 3, -5 + i * 2, 0.5, 0.5);
    }
  });

  register('bone', (ctx) => {
    ctx.fillStyle = '#f0e6d0';
    ctx.fillRect(-5, -1, 10, 2);
    ctx.beginPath(); ctx.arc(-5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
  });

  register('rune', (ctx) => {
    ctx.strokeStyle = 'rgba(200,150,255,0.65)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-3, -3); ctx.lineTo(3, -3); ctx.lineTo(0, 3); ctx.closePath();
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(0, 3); ctx.stroke();
  });

  register('candle_dec', (ctx, d, ts) => {
    ctx.fillStyle = '#d8c890';
    ctx.fillRect(-1, -1, 2, 5);
    ctx.fillStyle = '#ffc040';
    ctx.shadowColor = '#ff8030';
    ctx.shadowBlur = 8;
    const flicker = 1 + Math.sin((ts || 0) / 180 + d.rot * 10) * 0.15;
    ctx.beginPath(); ctx.ellipse(0, -2, 1.2, 2 * flicker, 0, 0, Math.PI * 2); ctx.fill();
  });

  register('crystal_small', (ctx) => {
    ctx.fillStyle = 'rgba(180,240,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -4); ctx.lineTo(3, 0); ctx.lineTo(0, 4); ctx.lineTo(-3, 0); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(1, -2); ctx.lineTo(-1, -2); ctx.closePath(); ctx.fill();
  });

  register('sparkle', (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, 0); ctx.lineTo(4, 0);
    ctx.moveTo(0, -4); ctx.lineTo(0, 4);
    ctx.stroke();
  });

  register('banner', (ctx) => {
    ctx.fillStyle = '#a8282a';
    ctx.fillRect(-2, -7, 4, 11);
    ctx.beginPath();
    ctx.moveTo(-2, 4); ctx.lineTo(0, 2); ctx.lineTo(2, 4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd870';
    ctx.beginPath(); ctx.arc(0, -2, 1.6, 0, Math.PI * 2); ctx.fill();
  });

  register('shield_dec', (ctx) => {
    ctx.fillStyle = '#a88038';
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(4, -3); ctx.lineTo(3, 3); ctx.lineTo(0, 6); ctx.lineTo(-3, 3); ctx.lineTo(-4, -3); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8c050';
    ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
  });

  Dragon.decorations = { generateFor, draw, register };
})(window.Dragon = window.Dragon || {});
