(function (Dragon) {
  'use strict';

  const consumables = [];
  function registerConsumable(def) { consumables.push(def); }

  registerConsumable({
    id: 'extra_life',
    icon: '❤', name: 'Heiltrank',
    desc: 'Gewährt ein zusätzliches Leben (max. 6).',
    price: 40,
    canBuy(state) { return state.lives < Dragon.config.MAX_LIVES; },
    buy(state) { state.lives++; },
  });

  registerConsumable({
    id: 'shield_refill',
    icon: '🛡', name: 'Schuppen-Öl',
    desc: 'Beendet die Abklingzeit des Schuppenschilds sofort.',
    price: 30,
    canBuy(state) { return state.unlocked.has('shield') && (state.shieldCd || 0) > 0; },
    buy(state) { state.shieldCd = 0; },
  });

  registerConsumable({
    id: 'double_coins',
    icon: '🪙', name: 'Segensspruch',
    desc: 'Verdoppelt Bonus-Münzen am Ende des nächsten Levels.',
    price: 80,
    canBuy(state) { return !state.buffs.doubleCoins; },
    buy(state) { state.buffs.doubleCoins = true; },
  });

  function abilityOffer(state, a) {
    const level = Dragon.abilities.levelOf(state, a.id);
    const max = Dragon.abilities.maxLevel(a);
    const fullyLeveled = level >= max;
    let nextTier = null;
    if (!fullyLeveled) {
      const info = Dragon.abilities.tierInfo(a, level + 1);
      if (info) nextTier = { desc: info.desc, price: info.price, tierNum: level + 1 };
    }
    return {
      id: a.id,
      icon: a.icon,
      name: a.name,
      baseDesc: a.desc,
      currentLevel: level,
      maxLevel: max,
      nextTier,
      fullyLeveled,
      owned: level >= 1,
      affordable: nextTier ? state.totalCoins >= nextTier.price : false,
      slot: a.slot,
    };
  }

  function offers(state) {
    const active = [];
    const passive = [];
    for (const a of Dragon.abilities.list) {
      const o = abilityOffer(state, a);
      if (a.slot === 'passive') passive.push(o);
      else active.push(o);
    }
    return {
      active,
      passive,
      consumables: consumables.map(c => ({
        id: c.id, icon: c.icon, name: c.name, desc: c.desc, price: c.price,
        disabled: !c.canBuy(state),
        affordable: state.totalCoins >= c.price,
      })),
    };
  }

  function buy(state, id, kind) {
    if (kind === 'ability') {
      const a = Dragon.abilities.byId(id);
      if (!a) return false;
      const level = Dragon.abilities.levelOf(state, id);
      const max = Dragon.abilities.maxLevel(a);
      if (level >= max) return false;
      const nextTier = level + 1;
      const info = Dragon.abilities.tierInfo(a, nextTier);
      if (!info) return false;
      if (state.totalCoins < info.price) return false;
      state.totalCoins -= info.price;
      state.abilityLevels[id] = nextTier;
      if (level === 0) {
        state.unlocked.add(id);
        if (a.onUnlock) a.onUnlock(state);
        Dragon.abilities.autoEquip(state, id);
      }
      if (a.onLevelUp) a.onLevelUp(state, nextTier);
      return true;
    }
    if (kind === 'consumable') {
      const c = consumables.find(x => x.id === id);
      if (!c || !c.canBuy(state) || state.totalCoins < c.price) return false;
      state.totalCoins -= c.price;
      c.buy(state);
      return true;
    }
    return false;
  }

  Dragon.shop = { offers, buy, registerConsumable, consumables };
})(window.Dragon = window.Dragon || {});
