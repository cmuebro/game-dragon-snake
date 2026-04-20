(function (Dragon) {
  'use strict';
  const { W, H } = Dragon.config;

  const MID_X = Math.floor(W / 2);
  const MID_Y = Math.floor(H / 2);

  function rand(n) { return Math.floor(Math.random() * n); }
  function eq(a, b) { return a.x === b.x && a.y === b.y; }
  function inStartZone(c) {
    return c.y >= MID_Y - 1 && c.y <= MID_Y + 1 && c.x >= MID_X - 6 && c.x <= MID_X + 10;
  }
  function inBounds(c) { return c.x >= 2 && c.x <= W - 3 && c.y >= 2 && c.y <= H - 3; }
  function tryPush(arr, c, max, variant) {
    if (!inBounds(c)) return false;
    if (inStartZone(c)) return false;
    if (arr.some(w => eq(w, c))) return false;
    arr.push({ x: c.x, y: c.y, spiked: false, variant: variant || null });
    return arr.length < max;
  }

  function tree(arr, cx, cy, max) {
    if (!tryPush(arr, { x: cx, y: cy }, max, 'trunk')) return false;
    tryPush(arr, { x: cx, y: cy - 1 }, max, 'leaves');
    tryPush(arr, { x: cx, y: cy + 1 }, max, 'leaves');
    tryPush(arr, { x: cx - 1, y: cy }, max, 'leaves');
    tryPush(arr, { x: cx + 1, y: cy }, max, 'leaves');
    return true;
  }

  function hut(arr, cx, cy, max) {
    const bw = 11 + rand(3);
    const bh = 8 + rand(2);
    const x0 = cx - Math.floor(bw / 2);
    const y0 = cy - Math.floor(bh / 2);
    if (x0 < 2 || x0 + bw > W - 2 || y0 < 2 || y0 + bh > H - 2) return false;

    const walls = [];
    for (let dx = 0; dx < bw; dx++) {
      walls.push({ x: x0 + dx, y: y0 });
      walls.push({ x: x0 + dx, y: y0 + bh - 1 });
    }
    for (let dy = 1; dy < bh - 1; dy++) {
      walls.push({ x: x0, y: y0 + dy });
      walls.push({ x: x0 + bw - 1, y: y0 + dy });
    }
    const midX = x0 + Math.floor(bw / 2);
    for (let dy = 1; dy < bh - 1; dy++) {
      walls.push({ x: midX, y: y0 + dy });
    }

    const doors = new Set();
    const mark = (x, y) => doors.add(x + ',' + y);
    const outerDoorX = x0 + 2 + rand(bw - 5);
    mark(outerDoorX, y0 + bh - 1); mark(outerDoorX + 1, y0 + bh - 1);
    if (Math.random() < 0.6) {
      const doorTop = x0 + 2 + rand(bw - 5);
      mark(doorTop, y0); mark(doorTop + 1, y0);
    }
    const innerDoorY = y0 + 1 + rand(bh - 3);
    mark(midX, innerDoorY); mark(midX, Math.min(innerDoorY + 1, y0 + bh - 2));

    for (const p of walls) {
      if (doors.has(p.x + ',' + p.y)) continue;
      if (inStartZone(p)) continue;
      tryPush(arr, p, max, 'hut_wall');
    }
    return true;
  }

  function tower(arr, cx, cy, max) {
    const bw = 9 + rand(2);
    const bh = 13 + rand(3);
    const x0 = cx - Math.floor(bw / 2);
    const y0 = cy - Math.floor(bh / 2);
    if (x0 < 2 || x0 + bw > W - 2 || y0 < 2 || y0 + bh > H - 2) return false;

    const walls = [];
    for (let dx = 0; dx < bw; dx++) {
      walls.push({ x: x0 + dx, y: y0 });
      walls.push({ x: x0 + dx, y: y0 + bh - 1 });
    }
    for (let dy = 1; dy < bh - 1; dy++) {
      walls.push({ x: x0, y: y0 + dy });
      walls.push({ x: x0 + bw - 1, y: y0 + dy });
    }

    const floorGap = Math.max(3, Math.floor(bh / 3));
    const floorYs = [];
    for (let fy = y0 + floorGap; fy < y0 + bh - 2; fy += floorGap) floorYs.push(fy);
    for (const fy of floorYs) {
      for (let dx = 1; dx < bw - 1; dx++) walls.push({ x: x0 + dx, y: fy });
    }

    const doors = new Set();
    const mark = (x, y) => doors.add(x + ',' + y);
    const bottomDoor = x0 + 2 + rand(bw - 5);
    mark(bottomDoor, y0 + bh - 1); mark(bottomDoor + 1, y0 + bh - 1);
    if (Math.random() < 0.4) {
      const topDoor = x0 + 2 + rand(bw - 5);
      mark(topDoor, y0); mark(topDoor + 1, y0);
    }
    for (const fy of floorYs) {
      const stairX = x0 + 1 + rand(bw - 4);
      mark(stairX, fy); mark(stairX + 1, fy);
    }

    for (const p of walls) {
      if (doors.has(p.x + ',' + p.y)) continue;
      if (inStartZone(p)) continue;
      tryPush(arr, p, max, 'tower_wall');
    }
    return true;
  }

  function meadow(lvl) {
    const arr = [];
    const useTower = Math.random() < 0.5;
    let placed = false, tries = 0;
    while (!placed && tries < 25) {
      tries++;
      const cx = 8 + rand(W - 16), cy = 7 + rand(H - 14);
      placed = useTower ? tower(arr, cx, cy, 999) : hut(arr, cx, cy, 999);
    }
    const minWalls = Math.max(lvl.walls, arr.length + 6);
    let t2 = 0;
    while (arr.length < minWalls && t2 < 400) {
      t2++;
      const cx = 3 + rand(W - 6), cy = 3 + rand(H - 6);
      if (Math.random() < 0.4) {
        tree(arr, cx, cy, minWalls);
      } else {
        tryPush(arr, { x: cx, y: cy }, minWalls, 'bush');
      }
    }
    return arr;
  }

  function forest(lvl) {
    const arr = [];
    const trees = Math.max(1, Math.floor(lvl.walls / 5));
    for (let t = 0; t < trees && arr.length < lvl.walls; t++) {
      const cx = 3 + rand(W - 6), cy = 3 + rand(H - 6);
      tree(arr, cx, cy, lvl.walls);
    }
    let tries = 0;
    while (arr.length < lvl.walls && tries < 150) {
      tries++;
      tryPush(arr, { x: 2 + rand(W - 4), y: 2 + rand(H - 4) }, lvl.walls, 'bush');
    }
    return arr;
  }

  function icicles(lvl) {
    const arr = [];
    const icebergs = Math.max(1, Math.floor(lvl.walls / 4));
    for (let t = 0; t < icebergs && arr.length < lvl.walls; t++) {
      const cx = 3 + rand(W - 6), cy = 3 + rand(H - 6);
      tryPush(arr, { x: cx, y: cy }, lvl.walls, 'glacier_peak');
      tryPush(arr, { x: cx + 1, y: cy }, lvl.walls, 'glacier_base');
      tryPush(arr, { x: cx - 1, y: cy }, lvl.walls, 'glacier_base');
      tryPush(arr, { x: cx, y: cy + 1 }, lvl.walls, 'glacier_base');
    }
    let tries = 0;
    while (arr.length < lvl.walls && tries < 200) {
      tries++;
      tryPush(arr, { x: 2 + rand(W - 4), y: 2 + rand(H - 4) }, lvl.walls, 'iceshard');
    }
    return arr;
  }

  function rivers(lvl) {
    const arr = [];
    let tries = 0;
    while (arr.length < lvl.walls && tries < 200) {
      tries++;
      const cy = 3 + rand(H - 6);
      const cx = 2 + rand(W - 14);
      const len = 5 + rand(6);
      for (let i = 0; i < len; i++) {
        if (!tryPush(arr, { x: cx + i, y: cy }, lvl.walls)) break;
      }
    }
    return arr;
  }

  function islands(lvl) {
    const arr = [];
    const clusters = Math.max(1, Math.floor(lvl.walls / 6));
    for (let i = 0; i < clusters && arr.length < lvl.walls; i++) {
      const cx = 3 + rand(W - 6), cy = 3 + rand(H - 6);
      const shape = [
        { x: cx, y: cy }, { x: cx + 1, y: cy }, { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 }, { x: cx, y: cy - 1 },
        { x: cx + 1, y: cy + 1 }, { x: cx - 1, y: cy - 1 },
      ];
      for (const p of shape) {
        if (!tryPush(arr, p, lvl.walls)) break;
      }
    }
    return arr;
  }

  function coral(lvl) {
    const arr = [];
    const rings = Math.max(1, Math.floor(lvl.walls / 8));
    for (let i = 0; i < rings && arr.length < lvl.walls; i++) {
      const cx = 4 + rand(W - 8), cy = 4 + rand(H - 8);
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
          if (Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;
          if (!tryPush(arr, { x: cx + dx, y: cy + dy }, lvl.walls)) return arr;
        }
      }
    }
    return arr;
  }

  function dunes(lvl) {
    const arr = [];
    let tries = 0;
    while (arr.length < lvl.walls && tries < 200) {
      tries++;
      const baseY = 3 + rand(H - 6);
      const startX = 2 + rand(W - 14);
      const len = 6 + rand(7);
      for (let i = 0; i < len; i++) {
        const dy = Math.round(Math.sin(i * 0.55) * 1.5);
        if (!tryPush(arr, { x: startX + i, y: baseY + dy }, lvl.walls)) break;
      }
    }
    return arr;
  }

  function maze(lvl) {
    const arr = [];
    let tries = 0;
    while (arr.length < lvl.walls && tries < 500) {
      tries++;
      const c = { x: 2 + rand(W - 4), y: 2 + rand(H - 4) };
      if (!tryPush(arr, c, lvl.walls)) continue;
      if (Math.random() < 0.75) {
        const dx = Math.random() < 0.5 ? 1 : 0;
        const dy = dx ? 0 : 1;
        for (let i = 1; i <= 5; i++) {
          if (!tryPush(arr, { x: c.x + dx * i, y: c.y + dy * i }, lvl.walls)) break;
        }
      }
    }
    return arr;
  }

  function crystals(lvl) {
    const arr = [];
    let tries = 0;
    while (arr.length < lvl.walls && tries < 200) {
      tries++;
      const cx = 2 + rand(W - 8);
      const cy = 2 + rand(H - 8);
      const diag = [
        { x: cx, y: cy },
        { x: cx + 1, y: cy + 1 },
        { x: cx + 2, y: cy + 2 },
        { x: cx + 3, y: cy + 3 },
        { x: cx + 4, y: cy + 4 },
      ];
      for (const p of diag) {
        if (!tryPush(arr, p, lvl.walls)) break;
      }
    }
    return arr;
  }

  function castle(lvl) {
    const arr = [];
    const cx = MID_X;
    const pillarYs = [3, 7, 11, 16, 20, 24, 27];
    for (const y of pillarYs) {
      for (const side of [-1, 1]) {
        const offset = 3 + rand(5);
        const x = cx + side * offset;
        for (let ext = 0; ext < 3; ext++) {
          if (!tryPush(arr, { x, y: y + ext }, lvl.walls)) break;
        }
        if (arr.length >= lvl.walls) return arr;
      }
    }
    return arr;
  }

  const PATTERNS = {
    meadow, forest, icicles, rivers, islands, coral, dunes, maze, crystals, castle,
  };

  function generateWalls(lvl) {
    const fn = PATTERNS[lvl.theme.pattern] || meadow;
    const walls = fn(lvl);
    if (lvl.level >= 12) {
      const pct = Math.min(0.3, (lvl.level - 11) * 0.02);
      for (const w of walls) {
        if (Math.random() < pct) w.spiked = true;
      }
    }
    return walls;
  }

  function generateSpikes(lvl, walls) {
    const arr = [];
    for (let i = 0; i < lvl.spikeFields; i++) {
      const c = { x: 2 + rand(W - 4), y: 2 + rand(H - 4) };
      if (inStartZone(c)) continue;
      if (walls.some(w => w.x === c.x && w.y === c.y)) continue;
      arr.push({ ...c, phase: rand(100), period: 60 + rand(60) });
    }
    return arr;
  }

  function spikeActive(s) {
    const t = (performance.now() + s.phase * 10) % (s.period * 16);
    const phase = t / (s.period * 16);
    return phase > 0.55 && phase < 0.9;
  }

  Dragon.world = { generateWalls, generateSpikes, spikeActive, patterns: PATTERNS };
})(window.Dragon = window.Dragon || {});
