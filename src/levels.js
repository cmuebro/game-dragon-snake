(function (Dragon) {
  'use strict';

  const NAMES = [
    null,
    'Der erste Flug',        'Morgenlicht',           'Blumenpfad',            'Das verborgene Tal',    'Sonnentanz',
    'Flüsternder Hain',      'Smaragdgarten',         'Der verwucherte Pfad',  'Dickicht',              'Hüter der Wälder',
    'Eisiger Aufstieg',      'Frostkamm',             'Kristallhang',          'Schneesturm',           'Gipfel der Ahnen',
    'Glutader',              'Aschefeld',             'Obsidiankluft',         'Lavariss',              'Zorn des Vulkans',
    'Aufbruch ins Nichts',   'Sternenfall',           'Kometenpfad',           'Nebelschleier',         'Das stumme Licht',
    'Abtauchen',             'Korallenriff',          'Tiefenströmung',        'Geistergalleone',       'Der Abyss',
    'Wüstenhauch',           'Sanddünen',             'Skorpionenhof',         'Oase der Fata Morgana', 'Verlorene Pyramide',
    'Dämmerwall',            'Schattenlabyrinth',     'Flüsternde Mauer',      'Gruft der Namenlosen',  'Herr der Schatten',
    'Funkelnder Eingang',    'Spiegelhalle',          'Gläserner Abgrund',     'Kristalldrachenei',     'Portal der Ewigkeit',
    'Schwellenfeuer',        'Thronsaalweg',          'Wächter der Krone',     'Altar der Ahnen',       'Drachenthron',
  ];

  const SUBTITLES = {
    1:  'Dein Ei ist geschlüpft. Die Wiese wartet.',
    5:  'Am Horizont tanzt goldenes Licht.',
    10: 'Der alte Waldgeist stellt sich dir in den Weg.',
    15: 'Die Berge ächzen unter ewigem Frost.',
    20: 'Der Vulkan erinnert sich an deine Ahnen.',
    25: 'Zwischen Sternen gibt es keinen Ton.',
    30: 'Im Abyss träumen vergessene Götter.',
    35: 'Die Pyramide verbirgt den ersten Schatz.',
    40: 'Schatten flüstern deinen wahren Namen.',
    45: 'Das Portal zeigt dir dein eigenes Ich.',
    50: 'Der Thron wartet auf seinen rechtmäßigen Herrn.',
  };

  function nameFor(i) { return NAMES[i] || `Prüfung ${i}`; }
  function subtitleFor(i) { return SUBTITLES[i] || ''; }

  function generate(count) {
    const arr = [];
    for (let i = 1; i <= count; i++) {
      const theme = Dragon.themes.forLevel(i);
      const goal = 4 + Math.min(16, Math.floor(i * 0.5) + 2);
      const speed = 150 - Math.min(110, i * 2.8);
      const wallsBase = Math.min(68, 10 + Math.floor(i * 1.4));
      const rivals = i >= 2 ? Math.min(5, 1 + Math.floor((i - 2) / 8)) : 0;
      const spikeFields = i >= 15 ? Math.min(12, Math.floor((i - 13) / 3)) : 0;
      const isBoss = i % 10 === 0;
      arr.push({
        level: i,
        name: nameFor(i),
        subtitle: subtitleFor(i),
        theme,
        goal,
        speed,
        walls: isBoss ? wallsBase + 10 : wallsBase,
        rivals,
        spikeFields,
        isBoss,
      });
    }
    return arr;
  }

  const list = [];
  const overrides = {};

  Dragon.levels = {
    list,
    init() {
      list.length = 0;
      list.push(...generate(Dragon.config.LEVEL_COUNT));
      for (const [k, patch] of Object.entries(overrides)) {
        const idx = Number(k) - 1;
        if (idx >= 0 && idx < list.length) Object.assign(list[idx], patch);
      }
    },
    get(idx) { return list[idx]; },
    setName(levelNum, name) { NAMES[levelNum] = name; },
    setSubtitle(levelNum, sub) { SUBTITLES[levelNum] = sub; },
    addOverride(levelNum, patch) { overrides[levelNum] = patch; },
  };
})(window.Dragon = window.Dragon || {});
