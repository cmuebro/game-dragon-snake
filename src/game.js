(function (Dragon) {
  'use strict';
  const { W, H, MAX_HP, IFRAMES_MS, DAMAGE } = Dragon.config;
  const COUNTDOWN_MS = 3000;

  function boot() {
    Dragon.levels.init();
    Dragon.ui.init();
    Dragon.input.init();
    Dragon.audio.init();
    Dragon.renderer.init(document.getElementById('game'));
    loadLevel(0);
    Dragon.state.running = false;
    Dragon.state.countdown = 0;
    Dragon.ui.showScreen('start');
    requestAnimationFrame(loop);
  }

  function start(fromLevel, keepLayout) {
    const s = Dragon.state;
    s.score = 0;
    s.totalGems = 0;
    s.totalCoins = 40;
    s.unlocked = new Set();
    s.abilityLevels = {};
    s.equipped = { primary: null, secondary: null };
    s.cooldown = {};
    s.activeEffects = {};
    s.buffs = {};
    s.shieldCd = 0;
    s.hp = s.maxHp;
    s.iframes = 0;
    s.lives = 3;
    s.over = false;
    s.paused = false;
    loadLevel(fromLevel, keepLayout);
    s.running = true;
  }

  function cloneRival(r) {
    return {
      segments: r.segments.map(s => ({ x: s.x, y: s.y })),
      dir: { x: r.dir.x, y: r.dir.y },
      hp: r.hp,
      maxHp: r.maxHp,
      hue: r.hue,
      stepInterval: r.stepInterval,
      stepAcc: r.stepAcc,
    };
  }

  function loadLevel(idx, keepLayout) {
    const s = Dragon.state;
    const lvl = Dragon.levels.get(idx);
    s.levelIdx = idx;
    s.snake = [
      { x: Math.floor(W / 2),     y: Math.floor(H / 2) },
      { x: Math.floor(W / 2) - 1, y: Math.floor(H / 2) },
      { x: Math.floor(W / 2) - 2, y: Math.floor(H / 2) },
      { x: Math.floor(W / 2) - 3, y: Math.floor(H / 2) },
    ];
    s.prevSnake = s.snake.map(seg => ({ x: seg.x, y: seg.y }));
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };

    const hasSnapshot = keepLayout && s.levelSnapshot && s.levelSnapshot.levelIdx === idx;
    if (hasSnapshot) {
      s.walls = s.levelSnapshot.walls.map(w => ({ ...w }));
      s.rivals = s.levelSnapshot.rivals.map(cloneRival);
      s.spikes = s.levelSnapshot.spikes.map(sp => ({ ...sp }));
      s.decorations = s.levelSnapshot.decorations.slice();
    } else {
      s.walls = Dragon.world.generateWalls(lvl);
      s.rivals = Dragon.rivals.generate(lvl.rivals, s.walls, s.snake, lvl.speed);
      s.spikes = Dragon.world.generateSpikes(lvl, s.walls);
      s.decorations = Dragon.decorations.generateFor(lvl);
      s.levelSnapshot = {
        levelIdx: idx,
        walls: s.walls.map(w => ({ ...w })),
        rivals: s.rivals.map(cloneRival),
        spikes: s.spikes.map(sp => ({ ...sp })),
        decorations: s.decorations.slice(),
      };
    }
    s.items = [];
    s.fireballs = [];
    s.firestorms = [];
    s.firestormAcc = 0;
    s.particles = [];
    s.floatTexts = [];
    s.tickMs = lvl.speed;
    s.tickAcc = 0;
    s.rivalAcc = 0;
    s.goalProgress = 0;
    s.timeScale = 1;
    s.screenShake = 0;
    s.activeEffects = {};
    s.cooldown = {};
    s.hp = s.maxHp;
    s.iframes = 0;
    s.shieldCd = 0;
    s.countdown = COUNTDOWN_MS;
    Dragon.items.spawn(s, 'food');
    if (lvl.level >= 3 && Math.random() < 0.7) Dragon.items.spawn(s, 'gem');
    if (lvl.level >= 8 && Math.random() < 0.5) Dragon.items.spawn(s, 'coin');
    Dragon.ui.updateStats(s);
    Dragon.ui.updateAbilityGrid(s);
    if (Dragon.audio && Dragon.audio.setMood && lvl.theme && lvl.theme.mood) {
      Dragon.audio.setMood(lvl.theme.mood);
    }
  }

  function takeDamage(state, amount, source, opts) {
    opts = opts || {};
    if (amount <= 0) return;
    if (!opts.bypass && state.iframes > 0) return;

    let shielded = false;
    if (state.unlocked.has('shield') && (state.shieldCd || 0) <= 0) {
      amount = Math.ceil(amount / 2);
      state.shieldCd = state.cheatShortCd ? 3000 : 10000;
      shielded = true;
      Dragon.particles.burst(state.snake[0], 18, '#a0d8ff');
      Dragon.particles.floatText(state.snake[0], '🛡 halbiert', 900);
    }

    state.hp = Math.max(0, state.hp - amount);
    Dragon.particles.burst(state.snake[0], 14, '#ff4d6d');
    Dragon.particles.floatText(state.snake[0], `-${amount} HP`, 800);
    state.screenShake = Math.min(24, Math.max(state.screenShake, amount / 3.5));
    state.iframes = IFRAMES_MS;

    if (!opts.skipSteer) autoSteerAway(state);

    if (state.hp <= 0) loseLife(state, source);
  }

  function isDestructive(state, c) {
    if (state.walls.some(w => w.x === c.x && w.y === c.y)) return true;
    if (state.spikes.some(s => s.x === c.x && s.y === c.y)) return true;
    if (state.rivals.some(r => r.segments.some(seg => seg.x === c.x && seg.y === c.y))) return true;
    if (state.snake.some(seg => seg.x === c.x && seg.y === c.y)) return true;
    return false;
  }

  function isSafeAhead(state, from, dir, steps) {
    for (let i = 1; i <= steps; i++) {
      const c = {
        x: (from.x + dir.x * i + W) % W,
        y: (from.y + dir.y * i + H) % H,
      };
      if (isDestructive(state, c)) return false;
    }
    return true;
  }

  function autoSteerAway(state) {
    const head = state.snake[0];
    if (!head) return;
    const d = state.dir;
    const candidates = [
      { x: -d.y, y:  d.x },
      { x:  d.y, y: -d.x },
      { x: -d.x, y: -d.y },
    ];
    for (const steps of [3, 2, 1]) {
      for (const nd of candidates) {
        if (isSafeAhead(state, head, nd, steps)) {
          state.dir = nd;
          state.nextDir = nd;
          return;
        }
      }
    }
  }

  function loseLife(state, source) {
    state.lives--;
    if (state.lives <= 0) {
      state.over = true;
      state.running = false;
      Dragon.particles.burst(state.snake[0], 60, '#ff4d6d');
      state.screenShake = 28;
      setTimeout(() => Dragon.ui.showGameOver(state, `Niederlage: ${source}`), 800);
      return;
    }
    Dragon.particles.burst(state.snake[0], 45, '#ffd060');
    Dragon.particles.floatText(state.snake[0], '❤ Leben verloren', 1500);
    state.screenShake = 20;
    state.running = false;
    setTimeout(() => { loadLevel(state.levelIdx); state.running = true; }, 900);
  }

  function step() {
    const s = Dragon.state;
    s.prevSnake = s.snake.map(seg => ({ x: seg.x, y: seg.y }));
    const nd = s.nextDir;
    if (!(nd.x === -s.dir.x && nd.y === -s.dir.y)) s.dir = nd;

    const head = s.snake[0];
    const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };
    const ghost = s.activeEffects.ghost > 0;

    if (newHead.x < 0 || newHead.x >= W || newHead.y < 0 || newHead.y >= H) {
      newHead.x = (newHead.x + W) % W;
      newHead.y = (newHead.y + H) % H;
    }

    if (!ghost) {
      const wall = s.walls.find(w => w.x === newHead.x && w.y === newHead.y);
      if (wall) {
        let dmg = DAMAGE.WALL, src = 'Wand';
        if (wall.spiked) {
          dmg = DAMAGE.WALL_SPIKE;
          src = 'Wandstachel';
          wall.spiked = false;
          Dragon.particles.burst(newHead, 22, '#e8dcc8');
        }
        takeDamage(s, dmg, src);
        return;
      }
    }

    const floorSpike = s.spikes.find(p => p.x === newHead.x && p.y === newHead.y && !(p.frozen > 0) && Dragon.world.spikeActive(p));
    if (floorSpike) {
      takeDamage(s, DAMAGE.FLOOR_SPIKE, 'Bodenfalle');
      return;
    }

    const hitRival = s.rivals.some(r => r.segments.some(seg => seg.x === newHead.x && seg.y === newHead.y));
    if (hitRival) {
      takeDamage(s, DAMAGE.RIVAL_DRAGON, 'Rivaldrache');
      return;
    }

    const body = s.snake.slice(0, -1);
    if (body.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      takeDamage(s, 40, 'Selbstbiss', { skipSteer: true });
    }

    s.snake.unshift(newHead);
    if (s.unlocked.has('magnet')) applyMagnet(s);
    const eaten = Dragon.items.consume(s, newHead);
    if (!eaten) s.snake.pop();

    const lvl = Dragon.levels.get(s.levelIdx);
    if (s.goalProgress >= lvl.goal) levelComplete();
  }

  const FIRESTORM_TIERS = [
    { interval: 300, everyN: 2, perSegment: 1, speed: 4.0, lifeMs: 900, affectWalls: false },
    { interval: 220, everyN: 1, perSegment: 1, speed: 5.5, lifeMs: 900, affectWalls: false },
    { interval: 140, everyN: 1, perSegment: 2, speed: 7.0, lifeMs: 900, affectWalls: true  },
  ];
  const FIRESTORM_MAX_ACTIVE = 260;

  function firestormTier(s) {
    const t = Dragon.abilities.levelOf(s, 'firestorm');
    return FIRESTORM_TIERS[Math.max(0, Math.min(FIRESTORM_TIERS.length - 1, t - 1))];
  }

  function spawnFirestormBurst(s) {
    const cfg = firestormTier(s);
    const CELL = Dragon.config.CELL;
    if (s.firestorms.length > FIRESTORM_MAX_ACTIVE) return;
    for (let i = 0; i < s.snake.length; i += cfg.everyN) {
      const seg = s.snake[i];
      const cx = seg.x * CELL + CELL / 2;
      const cy = seg.y * CELL + CELL / 2;
      for (let k = 0; k < cfg.perSegment; k++) {
        const ang = Math.random() * Math.PI * 2;
        s.firestorms.push({
          px: cx, py: cy,
          vx: Math.cos(ang) * cfg.speed,
          vy: Math.sin(ang) * cfg.speed,
          life: cfg.lifeMs,
        });
      }
    }
  }

  function updateFirestorm(s, dt) {
    const cfg = firestormTier(s);
    s.firestormAcc = (s.firestormAcc || 0) + dt;
    while (s.firestormAcc >= cfg.interval) {
      s.firestormAcc -= cfg.interval;
      spawnFirestormBurst(s);
    }
  }

  function updateFirestormProjectiles(s, dt) {
    const cfg = firestormTier(s);
    const CELL = Dragon.config.CELL;
    const CW = Dragon.config.CANVAS_SIZE;
    const out = [];
    for (const f of s.firestorms) {
      f.px += f.vx;
      f.py += f.vy;
      f.life -= dt;
      if (f.life <= 0 || f.px < -20 || f.py < -20 || f.px > CW + 20 || f.py > CW + 20) continue;
      const gx = Math.floor(f.px / CELL);
      const gy = Math.floor(f.py / CELL);
      let hit = false;
      for (const r of [...s.rivals]) {
        if (r.segments.some(seg => seg.x === gx && seg.y === gy)) {
          Dragon.rivals.damage(s, r, Math.round(DAMAGE.FIRE_VS_RIVAL * 0.4));
          Dragon.particles.burst({ x: gx, y: gy }, 8, '#ff6f4a');
          hit = true;
          break;
        }
      }
      if (hit) continue;
      if (cfg.affectWalls) {
        const wi = s.walls.findIndex(w => w.x === gx && w.y === gy);
        if (wi >= 0) {
          const wall = s.walls[wi];
          if (wall.spiked) { wall.spiked = false; Dragon.particles.burst({ x: gx, y: gy }, 8, '#e8dcc8'); }
          else { s.walls.splice(wi, 1); Dragon.particles.burst({ x: gx, y: gy }, 10, '#b0841e'); }
          continue;
        }
        const si = s.spikes.findIndex(sp => sp.x === gx && sp.y === gy);
        if (si >= 0) { s.spikes.splice(si, 1); Dragon.particles.burst({ x: gx, y: gy }, 8, '#ff6f4a'); continue; }
      }
      out.push(f);
    }
    s.firestorms = out;
  }

  function updateHammer(s, dt) {
    const tier = Dragon.abilities.levelOf(s, 'hammer');
    const rotSpeed = tier >= 3 ? 0.01215 : tier >= 2 ? 0.00945 : 0.00765;
    s.hammerAngle = (s.hammerAngle || 0) + dt * rotSpeed;
    const head = s.snake[0];
    if (!head) return;
    const CELL = Dragon.config.CELL;
    const radius = (tier >= 2 ? 2.5 : 1.8) * 1.7 * CELL;
    const headPx = head.x * CELL + CELL / 2;
    const headPy = head.y * CELL + CELL / 2;
    const ca = Math.cos(s.hammerAngle);
    const sa = Math.sin(s.hammerAngle);
    const steps = Math.max(2, Math.ceil(radius / (CELL * 0.5)));
    const now = performance.now();
    const seen = new Set();
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const gx = Math.floor((headPx + ca * radius * t) / CELL);
      const gy = Math.floor((headPy + sa * radius * t) / CELL);
      const cx = ((gx % W) + W) % W;
      const cy = ((gy % H) + H) % H;
      const key = cx + ',' + cy;
      if (seen.has(key)) continue;
      seen.add(key);
      if ((now - (s.hammerHitLog[key] || 0)) > 300) {
        s.hammerHitLog[key] = now;
        processHammerHit(s, cx, cy);
      }
    }
  }

  function processHammerHit(s, cx, cy) {
    const cell = { x: cx, y: cy };
    for (const r of [...s.rivals]) {
      if (r.segments.some(seg => seg.x === cx && seg.y === cy)) {
        Dragon.rivals.damage(s, r, Dragon.config.DAMAGE.HAMMER_VS_RIVAL);
        Dragon.particles.burst(cell, 10, '#ffd060');
        s.screenShake = Math.max(s.screenShake, 5);
      }
    }
    if (Dragon.abilities.levelOf(s, 'hammer') >= 2) {
      const idx = s.walls.findIndex(w => w.x === cx && w.y === cy);
      if (idx >= 0) {
        const wall = s.walls[idx];
        if (wall.spiked) {
          wall.spiked = false;
          Dragon.particles.burst(cell, 14, '#e8dcc8');
        } else {
          s.walls.splice(idx, 1);
          Dragon.particles.burst(cell, 18, '#b0841e');
        }
        s.screenShake = Math.max(s.screenShake, 6);
      }
    }
  }

  function applyMagnet(s) {
    const h = s.snake[0];
    const tier = Dragon.abilities.levelOf(s, 'magnet');
    const PULL = tier >= 2 ? 2 : 1;
    const RANGE = tier >= 2 ? 9 : 5;
    for (const it of s.items) {
      const def = Dragon.items.types[it.type];
      if (!def) continue;
      const foodPull = tier >= 3 && it.type === 'food';
      if (!def.magnetic && !foodPull) continue;
      const dx = h.x - it.x, dy = h.y - it.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      const range = foodPull ? 1 : RANGE;
      if (dist > range) continue;
      it.x += Math.min(Math.abs(dx), PULL) * Math.sign(dx);
      it.y += Math.min(Math.abs(dy), PULL) * Math.sign(dy);
    }
  }

  function levelComplete() {
    const s = Dragon.state;
    s.running = false;
    const lvl = Dragon.levels.get(s.levelIdx);
    const bonus = 100 + lvl.level * 20;
    Dragon.scoring.add(s, bonus, s.snake[0], `Level-Bonus +${bonus}`);
    for (let i = 0; i < 40; i++) {
      Dragon.particles.burst(s.snake[Math.min(i, s.snake.length - 1)], 3, '#ffe27a');
    }
    s.screenShake = 8;

    let coinsEarned = 5 + lvl.level * 2 + (lvl.isBoss ? 25 : 0);
    if (s.buffs.doubleCoins) {
      coinsEarned *= 2;
      s.buffs.doubleCoins = false;
    }
    if (s.buffs.halvedCooldowns) s.buffs.halvedCooldowns = false;
    s.totalCoins += coinsEarned;

    Dragon.ui.updateStats(s);
    Dragon.ui.updateAbilityGrid(s);

    if (s.levelIdx >= Dragon.levels.list.length - 1) {
      setTimeout(() => Dragon.ui.showWin(s), 900);
      return;
    }
    const nextLvl = Dragon.levels.get(s.levelIdx + 1);
    setTimeout(() => Dragon.ui.showShop(s, lvl, nextLvl, bonus, coinsEarned), 700);
  }

  function nextLevel() {
    loadLevel(Dragon.state.levelIdx + 1);
    Dragon.state.running = true;
  }

  function goToLevel(idx) {
    const s = Dragon.state;
    s.over = false;
    s.paused = false;
    loadLevel(idx);
    s.running = true;
  }

  function retry() {
    const s = Dragon.state;
    s.over = false;
    s.lives = 3;
    loadLevel(s.levelIdx);
    s.running = true;
  }

  function togglePause() {
    const s = Dragon.state;
    if (!s.running || s.over) return;
    s.paused = !s.paused;
    if (s.paused) Dragon.ui.showScreen('pause');
    else Dragon.ui.hideAllScreens();
  }

  function restart() { Dragon.ui.hideAllScreens(); start(0); }

  function loop(ts) {
    const s = Dragon.state;
    if (!s.lastTs) s.lastTs = ts;
    let dt = ts - s.lastTs;
    s.lastTs = ts;
    if (dt > 100) dt = 100;

    if (s.running && !s.paused) {
      if (s.countdown > 0) {
        s.countdown = Math.max(0, s.countdown - dt);
      } else {
        for (const k in s.cooldown)      s.cooldown[k]      = Math.max(0, s.cooldown[k] - dt);
        for (const k in s.activeEffects) s.activeEffects[k] = Math.max(0, s.activeEffects[k] - dt);
        s.iframes = Math.max(0, s.iframes - dt);
        s.shieldCd = Math.max(0, (s.shieldCd || 0) - dt);

        for (const r of s.rivals) if (r.frozen > 0) r.frozen = Math.max(0, r.frozen - dt);
        for (const sp of s.spikes) if (sp.frozen > 0) sp.frozen = Math.max(0, sp.frozen - dt);

        if (s.unlocked.has('regen')) {
          const tier = Dragon.abilities.levelOf(s, 'regen');
          const rate = tier >= 3 ? 5 : (tier >= 2 ? 3 : 1);
          s.hp = Math.min(s.maxHp, s.hp + rate * dt / 1000);
        }

        if (s.activeEffects.hammer > 0) updateHammer(s, dt);
        if (s.activeEffects.firestorm > 0) updateFirestorm(s, dt);
        if (s.firestorms && s.firestorms.length) updateFirestormProjectiles(s, dt);
        const slow = s.activeEffects.slowtime > 0;
        s.timeScale = slow ? 0.6 : 1;
        const rivalScale = slow ? 0.45 : 1;

        s.tickAcc += dt * s.timeScale;
        const steadyTier = Dragon.abilities.levelOf(s, 'steady');
        const steadyMult = steadyTier >= 3 ? 1 / 0.40 : steadyTier >= 2 ? 1 / 0.60 : steadyTier >= 1 ? 1 / 0.75 : 1;
        const interval = s.tickMs * steadyMult;
        let safety = 10;
        while (s.tickAcc >= interval && s.running && safety-- > 0) {
          s.tickAcc -= interval;
          step();
        }
        if (!s.running) s.tickAcc = 0;

        Dragon.rivals.step(s, dt * rivalScale);
      }
      Dragon.particles.update(s, dt);
    }

    Dragon.renderer.render(s, ts);
    Dragon.ui.updateAbilityGrid(s);
    Dragon.ui.updateStats(s);
    requestAnimationFrame(loop);
  }

  Dragon.game = { boot, start, nextLevel, retry, togglePause, restart, loadLevel, step, takeDamage, goToLevel, levelComplete };

  document.addEventListener('DOMContentLoaded', boot);
})(window.Dragon = window.Dragon || {});
