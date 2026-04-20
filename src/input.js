(function (Dragon) {
  'use strict';

  const keys = {};

  let _xCount = 0;
  let _xLast = 0;

  const JOY_RADIUS = 48;
  const JOY_THRESHOLD = 4;

  let joystickEl = null;
  let joyHandleEl = null;
  let dragStart = null;

  function init() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
    initPointerSteering();
    initTouchButtons();
  }

  function onKeyDown(e) {
    const state = Dragon.state;
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    keys[e.key.toLowerCase()] = true;
    const k = e.key.toLowerCase();
    const d = state.dir;

    if (['arrowup',    'w'].includes(k) && d.y === 0) state.nextDir = { x:  0, y: -1 };
    else if (['arrowdown',  's'].includes(k) && d.y === 0) state.nextDir = { x:  0, y:  1 };
    else if (['arrowleft',  'a'].includes(k) && d.x === 0) state.nextDir = { x: -1, y:  0 };
    else if (['arrowright', 'd'].includes(k) && d.x === 0) state.nextDir = { x:  1, y:  0 };
    else if (k === ' ') {
      if (Dragon.ui.isPaused()) Dragon.game.togglePause();
      else if (state.running) Dragon.abilities.trigger(state, 'primary');
      e.preventDefault();
    }
    else if (k === 'shift') {
      if (state.running) Dragon.abilities.trigger(state, 'secondary');
    }
    else if (k === 'p') Dragon.game.togglePause();
    else if (k === 'r') {
      if (state.running || state.over) Dragon.game.restart();
    }
    else if (k === 'x') {
      const now = performance.now();
      if (now - _xLast > 1500) _xCount = 0;
      _xLast = now;
      _xCount++;
      if (_xCount >= 5) {
        _xCount = 0;
        Dragon.ui.showCheatMenu();
      }
    }
    else if (/^[1-9]$/.test(k)) {
      if (!state.running || state.paused || state.countdown > 0) return;
      const idx = parseInt(k, 10) - 1;
      const activatables = Dragon.abilities.list
        .filter(a => state.unlocked.has(a.id) && a.activate)
        .sort((a, b) => a.price - b.price);
      const ability = activatables[idx];
      if (ability) Dragon.abilities.triggerById(state, ability.id);
    }
  }

  function setDirectionFromDelta(dx, dy) {
    const state = Dragon.state;
    if (Math.abs(dx) >= Math.abs(dy)) {
      state.nextDir = { x: dx > 0 ? 1 : -1, y: 0 };
    } else {
      state.nextDir = { x: 0, y: dy > 0 ? 1 : -1 };
    }
  }

  function initPointerSteering() {
    const stage = document.getElementById('stage');
    joystickEl = document.getElementById('floatJoystick');
    joyHandleEl = joystickEl ? joystickEl.querySelector('.fj-handle') : null;
    if (!stage) return;

    stage.addEventListener('pointerdown', (e) => {
      if (!Dragon.state.running || Dragon.state.paused) return;
      if (e.target.closest('.ability-btn-top, .corner-btn, .top-hud')) return;
      e.preventDefault();
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      const rect = stage.getBoundingClientRect();
      dragStart = {
        x: e.clientX, y: e.clientY,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        vx: 0, vy: 0,
      };
      document.body.classList.add('steering');
      if (joystickEl) {
        joystickEl.style.display = 'block';
        joystickEl.style.left = (e.clientX - rect.left) + 'px';
        joystickEl.style.top  = (e.clientY - rect.top)  + 'px';
        if (joyHandleEl) joyHandleEl.style.transform = 'translate(0,0)';
      }
      if (e.pointerType === 'mouse' && stage.requestPointerLock) {
        try { stage.requestPointerLock({ unadjustedMovement: false }); }
        catch (_) { try { stage.requestPointerLock(); } catch (_) {} }
      }
    });

    stage.addEventListener('pointermove', (e) => {
      if (!dragStart || e.pointerId !== dragStart.pointerId) return;
      let dx, dy;
      if (document.pointerLockElement === stage) {
        dragStart.vx += e.movementX;
        dragStart.vy += e.movementY;
        const mv = Math.hypot(dragStart.vx, dragStart.vy);
        if (mv > JOY_RADIUS) {
          dragStart.vx *= JOY_RADIUS / mv;
          dragStart.vy *= JOY_RADIUS / mv;
        }
        dx = dragStart.vx;
        dy = dragStart.vy;
      } else {
        dx = e.clientX - dragStart.x;
        dy = e.clientY - dragStart.y;
        const mag = Math.hypot(dx, dy);
        if (mag > JOY_RADIUS) {
          dx *= JOY_RADIUS / mag;
          dy *= JOY_RADIUS / mag;
        }
      }
      if (joyHandleEl) joyHandleEl.style.transform = `translate(${dx}px, ${dy}px)`;
      if (Math.hypot(dx, dy) > JOY_THRESHOLD) setDirectionFromDelta(dx, dy);
    });

    const endDrag = (e) => {
      if (!dragStart || e.pointerId !== dragStart.pointerId) return;
      dragStart = null;
      document.body.classList.remove('steering');
      if (document.pointerLockElement === stage && document.exitPointerLock) {
        try { document.exitPointerLock(); } catch (_) {}
      }
      if (joystickEl) joystickEl.style.display = 'none';
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerleave', endDrag);

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== stage && dragStart && dragStart.pointerType === 'mouse') {
        dragStart = null;
        document.body.classList.remove('steering');
        if (joystickEl) joystickEl.style.display = 'none';
      }
    });
  }

  function initTouchButtons() {
    const pauseBtn = document.getElementById('btnPause');
    if (pauseBtn) {
      pauseBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        Dragon.game.togglePause();
      });
    }

    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
      pauseScreen.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (Dragon.state.paused) Dragon.game.togglePause();
      });
    }
  }

  Dragon.input = { init, keys };
})(window.Dragon = window.Dragon || {});
