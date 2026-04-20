(function (Dragon) {
  'use strict';

  const el = (id) => document.getElementById(id);

  const screens = {
    start: null, shop: null, over: null, win: null, pause: null, cheat: null, impressum: null,
  };

  function init() {
    screens.start = el('startScreen');
    screens.shop  = el('shopScreen');
    screens.over  = el('gameOverScreen');
    screens.win   = el('winScreen');
    screens.pause = el('pauseScreen');
    screens.cheat = el('cheatScreen');
    screens.impressum = el('impressumScreen');
    buildAbilityGrid();
    wireButtons();
  }

  function buildAbilityGrid() {
    const grid = el('abilityGrid');
    grid.innerHTML = '';
    const passives = Dragon.abilities.list.filter(a => a.slot === 'passive');
    for (const a of passives) {
      const div = document.createElement('div');
      div.className = 'ability locked';
      div.dataset.id = a.id;
      div.innerHTML = `
        <span class="ability-icon">${a.icon}</span>
        <span class="cd-overlay"></span>
        <span class="cd-text">0</span>
        <span class="ability-label">🪙${a.price}</span>
      `;
      div.title = `${a.name} — ${a.desc}`;
      grid.appendChild(div);
    }
  }

  const _prevPassiveCd = {};
  function updateAbilityGrid(state) {
    const grid = el('abilityGrid');
    const passives = Dragon.abilities.list.filter(a => a.slot === 'passive');
    for (const a of passives) {
      const div = grid.querySelector(`[data-id="${a.id}"]`);
      if (!div) continue;
      const level = Dragon.abilities.levelOf(state, a.id);
      const unlocked = level >= 1;
      div.classList.toggle('locked', !unlocked);

      let cd = state.cooldown[a.id] || 0;
      let cdMax = state.cheatShortCd ? 3000 : (a.cooldown || 0);
      if (a.id === 'shield') {
        cd = state.shieldCd || 0;
        cdMax = state.cheatShortCd ? 3000 : 10000;
      }

      const prev = _prevPassiveCd[a.id] || 0;
      if (prev > 0 && cd === 0) {
        div.classList.remove('ready');
        void div.offsetWidth;
        div.classList.add('ready');
        setTimeout(() => div.classList.remove('ready'), 750);
      }
      _prevPassiveCd[a.id] = cd;

      const overlay = div.querySelector('.cd-overlay');
      const cdTextEl = div.querySelector('.cd-text');
      if (cd > 0 && cdMax > 0) {
        const pct = Math.min(1, cd / cdMax);
        if (overlay) overlay.style.setProperty('--cd-angle', (pct * 360).toFixed(1) + 'deg');
        if (cdTextEl) cdTextEl.textContent = (cd / 1000).toFixed(cd < 1000 ? 1 : 0);
        div.classList.add('cooling');
      } else {
        if (overlay) overlay.style.setProperty('--cd-angle', '0deg');
        div.classList.remove('cooling');
      }

      const label = div.querySelector('.ability-label');
      if (unlocked) {
        const max = Dragon.abilities.maxLevel(a);
        label.textContent = max > 1 ? `${level}/${max}` : '✓';
      } else {
        label.textContent = '🪙' + a.price;
      }
    }
    updateAbilityBar(state);
  }

  const _prevCd = {};
  let _barSignature = '';

  function updateAbilityBar(state) {
    const bar = el('abilityBar');
    if (!bar) return;
    bar.style.visibility = (state.running || state.paused) ? 'visible' : 'hidden';
    const activatables = Dragon.abilities.list
      .filter(a => state.unlocked.has(a.id) && a.activate)
      .sort((a, b) => a.price - b.price);
    const sig = activatables.map(a => a.id).join('|');

    if (sig !== _barSignature) {
      bar.innerHTML = '';
      for (let i = 0; i < activatables.length; i++) {
        const a = activatables[i];
        const btn = document.createElement('button');
        btn.className = 'ability-btn-top';
        btn.dataset.id = a.id;
        btn.title = `${a.name} — ${a.desc} (Taste ${i + 1})`;
        btn.innerHTML = `
          <span class="ability-icon">${a.icon}</span>
          <span class="cd-overlay"></span>
          <span class="cd-text">0</span>
          <span class="key-badge">${i + 1}</span>
        `;
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const s = Dragon.state;
          if (!s.running || s.paused || s.countdown > 0) return;
          Dragon.abilities.triggerById(s, a.id);
        });
        bar.appendChild(btn);
      }
      _barSignature = sig;
    }

    const cdMaxFor = (a) => state.cheatShortCd ? 3000 : a.cooldown;
    for (const a of activatables) {
      const btn = bar.querySelector(`[data-id="${a.id}"]`);
      if (!btn) continue;
      const cd = state.cooldown[a.id] || 0;
      const prev = _prevCd[a.id] || 0;
      if (prev > 0 && cd === 0) {
        btn.classList.remove('ready');
        void btn.offsetWidth;
        btn.classList.add('ready');
        setTimeout(() => btn.classList.remove('ready'), 750);
      }
      _prevCd[a.id] = cd;

      const overlay = btn.querySelector('.cd-overlay');
      const text = btn.querySelector('.cd-text');
      const cdMax = cdMaxFor(a);
      if (cd > 0 && cdMax > 0) {
        const pct = Math.min(1, cd / cdMax);
        overlay.style.setProperty('--cd-angle', (pct * 360).toFixed(1) + 'deg');
        text.textContent = (cd / 1000).toFixed(cd < 1000 ? 1 : 0);
        btn.classList.add('cooling');
      } else {
        overlay.style.setProperty('--cd-angle', '0deg');
        btn.classList.remove('cooling');
      }
    }
  }

  function updateStats(state) {
    const lvl = Dragon.levels.get(state.levelIdx);
    el('statScore').textContent   = state.score;
    el('statGems').textContent    = state.totalGems;
    el('statCoins').textContent   = state.totalCoins;
    el('statGoal').textContent    = state.goalProgress;
    el('statGoalMax').textContent = lvl.goal;
    el('progressBar').style.width = Math.min(100, state.goalProgress / lvl.goal * 100) + '%';
    el('worldName').textContent   = lvl.theme.name;
    el('worldSpeed').textContent  = Math.round(1000 / lvl.speed) + ' f/s';
    const haz = [];
    if (lvl.walls)       haz.push(lvl.walls + ' Wände');
    if (lvl.rivals)      haz.push(lvl.rivals + ' Rivalen');
    if (lvl.spikeFields) haz.push(lvl.spikeFields + ' Fallen');
    if (lvl.isBoss)      haz.push('⚔ Boss');
    el('worldHazard').textContent = haz.join(', ') || 'keine';

    const active = state.running || state.paused;
    const topHud = el('topHud');
    if (topHud) topHud.style.visibility = active ? 'visible' : 'hidden';

    const lvlName = el('hudLevelName');
    const themeName = el('hudThemeName');
    if (lvlName) lvlName.textContent = `Level ${lvl.level} · ${lvl.name}`;
    if (themeName) themeName.textContent = lvl.theme.name;

    const hpFill = el('hudHpFill');
    const hpText = el('hudHpText');
    const hpPct = Math.max(0, Math.min(100, state.hp / state.maxHp * 100));
    if (hpFill) hpFill.style.width = hpPct + '%';
    if (hpText) hpText.textContent = `${Math.ceil(state.hp)} / ${state.maxHp}`;

    const livesEl = el('hudLives');
    if (livesEl) {
      livesEl.innerHTML = '';
      for (let i = 0; i < state.lives; i++) {
        const span = document.createElement('span');
        span.textContent = '❤';
        span.style.color = i < 3 ? '#c8252f' : '#e8b820';
        livesEl.appendChild(span);
      }
    }

    const pauseBtn = el('btnPause');
    if (pauseBtn) {
      pauseBtn.style.visibility = active ? 'visible' : 'hidden';
      const icon = el('btnPauseIcon');
      if (icon) icon.textContent = state.paused ? '▶' : '⏸';
    }

    const canvasEl = el('game');
    if (canvasEl) {
      canvasEl.classList.toggle('slowtime', (state.activeEffects.slowtime || 0) > 0);
    }
  }

  function showScreen(name) {
    for (const k of Object.keys(screens)) screens[k].classList.toggle('show', k === name);
  }
  function hideAllScreens() {
    for (const k of Object.keys(screens)) screens[k].classList.remove('show');
  }
  function isPaused() { return screens.pause.classList.contains('show'); }

  function showShop(state, completedLvl, nextLvl, bonus, coinsEarned) {
    el('shopChip').textContent = completedLvl.isBoss ? '👑 BOSS BESIEGT' : 'LEVEL GESCHAFFT';
    el('shopTitle').textContent = `${completedLvl.name}`;
    el('shopSubtitle').textContent = `Level ${completedLvl.level} geschafft`;
    el('shopDesc').textContent = nextLvl
      ? `Als Nächstes erwartet dich „${nextLvl.name}" in ${nextLvl.theme.name}.`
      : '';
    el('shopSummary').innerHTML =
      `<span class="pill">+${bonus} Punkte</span>` +
      `<span class="pill pill-gold">🪙 +${coinsEarned} Münzen</span>` +
      (completedLvl.isBoss ? `<span class="pill pill-crimson">⚔ Boss-Bonus</span>` : '');
    renderShopGrid(state);
    showScreen('shop');
  }

  function renderShopGrid(state) {
    el('shopCoins').textContent = state.totalCoins;
    const offers = Dragon.shop.offers(state);
    const grid = el('shopGrid');
    grid.innerHTML = '';

    addShopSection(grid, 'Aktive Fähigkeiten', offers.active, 'ability', state);
    addShopSection(grid, 'Passive Fähigkeiten', offers.passive, 'ability', state);
    addShopSection(grid, 'Alchemistische Tränke', offers.consumables, 'consumable', state);
  }

  function addShopSection(grid, title, list, kind, state) {
    if (!list.length) return;
    const section = document.createElement('div');
    section.className = 'shop-section';
    section.innerHTML = `<h3 class="shop-section-title">${title}</h3><div class="shop-section-grid"></div>`;
    const sectionGrid = section.querySelector('.shop-section-grid');
    for (const o of list) {
      sectionGrid.appendChild(makeShopTile(state, o, kind));
    }
    grid.appendChild(section);
  }

  function makeShopTile(state, offer, kind) {
    const tile = document.createElement('div');
    if (kind === 'ability') {
      const nextTier = offer.nextTier;
      const fully = offer.fullyLeveled;
      const affordable = offer.affordable;
      let classes = 'shop-item';
      if (fully) classes += ' owned';
      if (!affordable && !fully) classes += ' poor';
      tile.className = classes;

      const tierLabel = offer.maxLevel > 1
        ? `<div class="shop-tier">Stufe ${offer.currentLevel} / ${offer.maxLevel}</div>`
        : '';
      const desc = fully
        ? 'Voll erlernt — keine weiteren Stufen.'
        : (offer.currentLevel === 0 ? offer.baseDesc : nextTier.desc);
      const priceHtml = nextTier ? `🪙 ${nextTier.price}` : '—';
      const btnLabel = fully
        ? '✓ Voll erlernt'
        : (offer.currentLevel === 0
          ? (affordable ? 'Erlernen' : 'zu teuer')
          : (affordable ? `Stufe ${nextTier.tierNum} freischalten` : 'zu teuer'));

      tile.innerHTML = `
        <div class="shop-icon">${offer.icon}</div>
        <div class="shop-name">${offer.name}</div>
        ${tierLabel}
        <div class="shop-desc">${desc}</div>
        <div class="shop-price">${priceHtml}</div>
        <button class="shop-buy">${btnLabel}</button>
      `;
      const btn = tile.querySelector('.shop-buy');
      if (fully || !affordable) btn.disabled = true;
      else btn.addEventListener('click', onBuy(state, offer.id, kind));
      return tile;
    }

    const disabled = offer.disabled;
    const affordable = offer.affordable;
    let classes = 'shop-item';
    if (disabled) classes += ' disabled';
    if (!affordable && !disabled) classes += ' poor';
    tile.className = classes;
    tile.innerHTML = `
      <div class="shop-icon">${offer.icon}</div>
      <div class="shop-name">${offer.name}</div>
      <div class="shop-desc">${offer.desc}</div>
      <div class="shop-price">🪙 ${offer.price}</div>
      <button class="shop-buy">${
        disabled ? 'nicht nötig' : (!affordable ? 'zu teuer' : 'Kaufen')
      }</button>
    `;
    const btn = tile.querySelector('.shop-buy');
    if (disabled || !affordable) btn.disabled = true;
    else btn.addEventListener('click', onBuy(state, offer.id, kind));
    return tile;
  }

  function onBuy(state, id, kind) {
    return () => {
      if (Dragon.shop.buy(state, id, kind)) {
        renderShopGrid(state);
        updateStats(state);
        updateAbilityGrid(state);
      }
    };
  }

  function showGameOver(state, msg) {
    el('goLevel').textContent = Dragon.levels.get(state.levelIdx).level;
    el('goScore').textContent = state.score;
    el('goGems').textContent  = state.totalGems;
    el('goCoins').textContent = state.totalCoins;
    el('deathMsg').textContent = msg;
    showScreen('over');
  }

  function showWin(state) {
    el('winScore').textContent = state.score;
    el('winGems').textContent  = state.totalGems;
    el('winCoins').textContent = state.totalCoins;
    showScreen('win');
  }

  function wireButtons() {
    el('btnStart').addEventListener('click',      () => { hideAllScreens(); Dragon.audio.ensureStarted(); Dragon.game.start(0); });
    el('btnShopNext').addEventListener('click',   () => { hideAllScreens(); Dragon.game.nextLevel(); });
    el('btnRetry').addEventListener('click',      () => { hideAllScreens(); Dragon.game.retry(); });
    el('btnFromStart').addEventListener('click',  () => { hideAllScreens(); Dragon.game.start(0); });
    el('btnRestart').addEventListener('click',    () => { hideAllScreens(); Dragon.game.start(0); });
    function updateMusicUi(on) {
      const hudIcon = el('btnMusicIcon');
      if (hudIcon) hudIcon.textContent = on ? '🎵' : '🔇';
      const hudBtn = el('btnMusic');
      if (hudBtn) hudBtn.classList.toggle('muted', !on);
      const panelIcon = el('btnVolumeMuteIcon');
      if (panelIcon) panelIcon.textContent = on ? '🎵' : '🔇';
      const panelText = el('btnVolumeMuteText');
      if (panelText) panelText.textContent = on ? 'Musik an' : 'Musik aus';
      const panelBtn = el('btnVolumeMute');
      if (panelBtn) panelBtn.classList.toggle('muted', !on);
    }
    el('btnMusic').addEventListener('click', () => {
      updateMusicUi(Dragon.audio.toggle());
    });
    el('btnCheatClose').addEventListener('click', () => { closeCheat(); });

    el('btnInfo').addEventListener('click', () => { showImpressum(); });
    el('btnImpressumClose').addEventListener('click', () => { closeImpressum(); });
    el('impressumScreen').addEventListener('click', (e) => {
      if (e.target === el('impressumScreen')) closeImpressum();
    });

    const volumePanel = el('volumePanel');
    const volumeSlider = el('volumeSlider');
    const volumeValue = el('volumeValue');
    el('btnVolume').addEventListener('click', (e) => {
      e.stopPropagation();
      volumePanel.hidden = !volumePanel.hidden;
    });
    volumePanel.addEventListener('click', (e) => { e.stopPropagation(); });
    volumeSlider.addEventListener('input', () => {
      const pct = parseInt(volumeSlider.value, 10);
      volumeValue.textContent = pct + '%';
      Dragon.audio.setVolume(pct / 100);
    });
    el('btnVolumeMute').addEventListener('click', (e) => {
      e.stopPropagation();
      updateMusicUi(Dragon.audio.toggle());
    });
    document.addEventListener('click', (e) => {
      if (volumePanel.hidden) return;
      if (e.target === el('btnVolume') || el('btnVolume').contains(e.target)) return;
      volumePanel.hidden = true;
    });

    el('cheatCoins').addEventListener('click', () => {
      Dragon.state.totalCoins += 500;
      updateStats(Dragon.state);
    });
    el('cheatHp').addEventListener('click', () => {
      Dragon.state.hp = Dragon.state.maxHp;
      updateStats(Dragon.state);
    });
    el('cheatLives').addEventListener('click', () => {
      const s = Dragon.state;
      if (s.lives < Dragon.config.MAX_LIVES) s.lives++;
      updateStats(s);
    });
    el('cheatReset').addEventListener('click', () => {
      const keepLevel = Dragon.state.levelIdx || 0;
      closeCheat();
      Dragon.game.start(keepLevel, true);
    });
    el('cheatShortCd').addEventListener('click', () => {
      const s = Dragon.state;
      s.cheatShortCd = !s.cheatShortCd;
      if (s.cheatShortCd) {
        for (const k in s.cooldown) s.cooldown[k] = Math.min(s.cooldown[k], 3000);
        s.shieldCd = Math.min(s.shieldCd || 0, 3000);
      }
      updateShortCdLabel();
    });
  }

  function updateShortCdLabel() {
    const btn = el('cheatShortCd');
    if (!btn) return;
    btn.textContent = Dragon.state.cheatShortCd ? 'CD: 3s' : 'CD: Default';
    btn.classList.toggle('cheat-active', !!Dragon.state.cheatShortCd);
  }

  function showCheatMenu() {
    const s = Dragon.state;
    if (s.running) s.paused = true;
    renderCheatAbilities(s);
    renderCheatLevels(s);
    updateShortCdLabel();
    showScreen('cheat');
  }

  function closeCheat() {
    hideAllScreens();
    const s = Dragon.state;
    if (s.running) s.paused = false;
  }

  let _impressumPausedByDialog = false;
  function showImpressum() {
    const s = Dragon.state;
    _impressumPausedByDialog = false;
    if (s.running && !s.paused) {
      s.paused = true;
      _impressumPausedByDialog = true;
    }
    renderImpressumSongs();
    showScreen('impressum');
  }

  function closeImpressum() {
    hideAllScreens();
    const s = Dragon.state;
    if (_impressumPausedByDialog && s.running) s.paused = false;
    _impressumPausedByDialog = false;
  }

  function renderImpressumSongs() {
    const list = el('impressumSongs');
    if (!list) return;
    list.innerHTML = '';
    const songs = (Dragon.audio.getSongs && Dragon.audio.getSongs()) || [];
    if (!songs.length) {
      const li = document.createElement('li');
      li.textContent = 'Derzeit ist keine externe Hintergrundmusik eingebunden — es läuft ausschließlich die prozedural erzeugte Synth-Musik.';
      list.appendChild(li);
      return;
    }
    for (const song of songs) {
      const li = document.createElement('li');
      const title = song.title || song.filename || 'Unbenannt';
      const artist = song.artist || 'Unbekannter Urheber';
      const linkHtml = song.link
        ? `<a class="impressum-song-link" href="${escapeAttr(song.link)}" target="_blank" rel="noopener noreferrer">${escapeHtml(song.link)}</a>`
        : '';
      li.innerHTML =
        `<span class="impressum-song-title">${escapeHtml(title)}</span>` +
        `<span class="impressum-song-artist">von ${escapeHtml(artist)}</span>` +
        linkHtml;
      list.appendChild(li);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  function renderCheatAbilities(state) {
    const grid = el('cheatAbilities');
    grid.innerHTML = '';
    for (const a of Dragon.abilities.list) {
      const level = Dragon.abilities.levelOf(state, a.id);
      const max = Dragon.abilities.maxLevel(a);
      const btn = document.createElement('button');
      btn.className = 'cheat-ability-btn';
      if (level >= max) btn.classList.add('full');
      if (level === 0) btn.classList.add('off');
      btn.innerHTML = `
        <span class="cheat-icon">${a.icon}</span>
        <span class="cheat-name">${a.name}</span>
        <span class="cheat-tier">${level} / ${max}</span>
      `;
      btn.title = a.desc;
      btn.addEventListener('click', () => {
        const cur = Dragon.abilities.levelOf(state, a.id);
        if (cur >= max) {
          state.abilityLevels[a.id] = 0;
          state.unlocked.delete(a.id);
          if (state.equipped.primary === a.id) state.equipped.primary = null;
          if (state.equipped.secondary === a.id) state.equipped.secondary = null;
        } else {
          const newLevel = cur + 1;
          state.abilityLevels[a.id] = newLevel;
          if (cur === 0) {
            state.unlocked.add(a.id);
            if (a.onUnlock) a.onUnlock(state);
            Dragon.abilities.autoEquip(state, a.id);
          }
        }
        renderCheatAbilities(state);
        updateAbilityGrid(state);
      });
      grid.appendChild(btn);
    }
  }

  function renderCheatLevels(state) {
    const container = el('cheatLevels');
    container.innerHTML = '';
    const count = Dragon.levels.list.length;
    for (let i = 0; i < count; i++) {
      const lvl = Dragon.levels.get(i);
      const btn = document.createElement('button');
      btn.className = 'cheat-level-btn';
      if (i === state.levelIdx) btn.classList.add('current');
      btn.textContent = lvl.level;
      btn.title = lvl.name;
      btn.addEventListener('click', () => {
        hideAllScreens();
        Dragon.game.goToLevel(i);
      });
      container.appendChild(btn);
    }
  }

  Dragon.ui = {
    init,
    updateStats,
    updateAbilityGrid,
    showScreen,
    hideAllScreens,
    isPaused,
    showShop,
    showGameOver,
    showWin,
    showCheatMenu,
    closeCheat,
  };
})(window.Dragon = window.Dragon || {});
