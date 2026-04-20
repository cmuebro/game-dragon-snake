(function (Dragon) {
  'use strict';

  const CELL = 24;
  const GRID = 30;

  Dragon.config = Object.freeze({
    CELL,
    GRID,
    W: GRID,
    H: GRID,
    CANVAS_SIZE: CELL * GRID,
    LEVEL_COUNT: 50,
    MAX_LIVES: 6,
    MAX_HP: 100,
    IFRAMES_MS: 700,
    DAMAGE: Object.freeze({
      WALL: 50,
      WALL_EDGE: 40,
      WALL_SPIKE: 90,
      FLOOR_SPIKE: 70,
      RIVAL_DRAGON: 25,
      FIRE_VS_RIVAL: 30,
      HAMMER_VS_RIVAL: 35,
      RIVAL_BUMP: 40,
    }),
    RIVAL_MAX_HP: 60,
  });
})(window.Dragon = window.Dragon || {});
