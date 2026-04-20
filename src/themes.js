(function (Dragon) {
  'use strict';

  const list = [
    { name: 'Sonnenwiese',    pattern: 'meadow',   bg1: '#d5eeaa', bg2: '#8bc066', grid: 'rgba(60,40,10,0.10)',  wall: '#7d5a2f', glow: '#fff0a0', mood: 'bright' },
    { name: 'Smaragdwald',    pattern: 'forest',   bg1: '#7fb07a', bg2: '#3f6a3a', grid: 'rgba(40,30,10,0.14)',  wall: '#5a3b1a', glow: '#c8f0a0', mood: 'bright' },
    { name: 'Frostgipfel',    pattern: 'icicles',  bg1: '#dceef7', bg2: '#88afcf', grid: 'rgba(30,60,90,0.14)',  wall: '#5c7791', glow: '#f0faff', mood: 'mystical' },
    { name: 'Lavaklüfte',     pattern: 'rivers',   bg1: '#f0a964', bg2: '#b44520', grid: 'rgba(60,10,0,0.18)',   wall: '#3a1a0f', glow: '#ffe08a', mood: 'combat' },
    { name: 'Sternennebel',   pattern: 'islands',  bg1: '#c0b3dd', bg2: '#6b5ba0', grid: 'rgba(255,240,200,0.12)', wall: '#382860', glow: '#ffe6ff', mood: 'mystical' },
    { name: 'Tiefsee',        pattern: 'coral',    bg1: '#7fd2df', bg2: '#1e7892', grid: 'rgba(255,255,255,0.10)', wall: '#1a334a', glow: '#c8f5f5', mood: 'mystical' },
    { name: 'Goldwüste',      pattern: 'dunes',    bg1: '#f0d598', bg2: '#c0955a', grid: 'rgba(60,30,0,0.12)',   wall: '#6b4a28', glow: '#fff5c0', mood: 'combat' },
    { name: 'Schattenreich',  pattern: 'maze',     bg1: '#8a7aa4', bg2: '#453360', grid: 'rgba(255,240,220,0.10)', wall: '#26183a', glow: '#d4baf0', mood: 'dark' },
    { name: 'Kristallhöhlen', pattern: 'crystals', bg1: '#c8e0ee', bg2: '#6a97b5', grid: 'rgba(255,255,255,0.12)', wall: '#2d4a66', glow: '#e0f5ff', mood: 'bright' },
    { name: 'Drachenthron',   pattern: 'castle',   bg1: '#c95050', bg2: '#6a1a1a', grid: 'rgba(255,215,100,0.14)', wall: '#2a0a0a', glow: '#ffd070', mood: 'combat' },
  ];

  Dragon.themes = {
    list,
    forLevel(level) {
      return list[Math.min(list.length - 1, Math.floor((level - 1) / 5))];
    },
    register(theme) { list.push(theme); },
  };
})(window.Dragon = window.Dragon || {});
