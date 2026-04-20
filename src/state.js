(function (Dragon) {
  'use strict';

  function create() {
    return {
      running: false, paused: false, over: false,
      countdown: 0,

      levelIdx: 0,
      goalProgress: 0,

      snake: [],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },

      items: [],
      walls: [],
      rivals: [],
      spikes: [],
      decorations: [],
      fireballs: [],
      firestorms: [],
      firestormAcc: 0,
      particles: [],
      floatTexts: [],

      tickMs: 150, tickAcc: 0, rivalAcc: 0, lastTs: 0,
      timeScale: 1,
      screenShake: 0,

      score: 0,
      totalGems: 0,
      totalCoins: 40,

      unlocked: new Set(),
      abilityLevels: {},
      equipped: { primary: null, secondary: null },
      cooldown: {},
      activeEffects: {},

      hammerAngle: 0,
      hammerHitLog: {},

      buffs: {},
      cheatShortCd: false,

      hp: 100,
      maxHp: 100,
      iframes: 0,
      shieldCd: 0,
      lives: 3,
      lastEat: 0,
    };
  }

  Dragon.createState = create;
  Dragon.state = create();
})(window.Dragon = window.Dragon || {});
