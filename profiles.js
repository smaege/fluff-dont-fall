(() => {
  'use strict';

  const prefix = 'fluff-profile:';
  const {
    defaults: defaultAppearance,
    appearance: appearanceWith,
    prices,
    exclusives,
    aerialExclusives,
    flowerGifts,
  } = window.FluffLooks;
  const flowerExclusives = Object.values(flowerGifts);
  const lockedFields = ['outfit', 'item', 'head', 'hat', 'shoes', 'wings'];
  let lastTimestamp = 0;

  function normalizeName(name) {
    return typeof name === 'string' ? name.trim().normalize('NFC') : '';
  }

  function keyFor(name) {
    return prefix + name.toLocaleLowerCase('fi').normalize('NFC');
  }

  function validName(name) {
    return name.length > 0 && Array.from(name).length <= 24;
  }

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function validSeconds(seconds) {
    return Number.isFinite(seconds) && seconds >= 0;
  }

  function validCount(count) {
    return Number.isSafeInteger(count) && count >= 0;
  }

  function isPaid(sku) {
    return typeof sku === 'string' && Object.hasOwn(prices, sku);
  }

  function isExclusive(sku) {
    return exclusives.includes(sku) || aerialExclusives.includes(sku) || flowerExclusives.includes(sku);
  }

  function isLocked(sku, unlocked) {
    return (isPaid(sku) || isExclusive(sku)) && !unlocked.includes(sku);
  }

  function readProfile(storage, key) {
    const raw = storage.getItem(key);
    if (raw === null) return null;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }

    if (!isRecord(data)) return null;
    const name = normalizeName(data.name);
    if (!validName(name) || keyFor(name) !== key || !validSeconds(data.lastUsed)) {
      return null;
    }

    const unlocked = Array.isArray(data.unlocked)
      ? [...new Set(data.unlocked.filter((sku) => isPaid(sku) || isExclusive(sku)))]
      : [];
    const appearance = appearanceWith(defaultAppearance, data.appearance);
    for (const field of lockedFields) {
      if (isLocked(field + ':' + appearance[field], unlocked)) {
        appearance[field] = defaultAppearance[field];
      }
    }

    return {
      name,
      appearance,
      completed: isRecord(data.completed)
        ? Object.fromEntries(
            Object.entries(data.completed).filter(
              ([id, seconds]) => id.length > 0 && validSeconds(seconds),
            ),
          )
        : {},
      endlessBest: validCount(data.endlessBest) ? data.endlessBest : 0,
      stars: validCount(data.stars) ? data.stars : 0,
      unlocked,
      lastUsed: data.lastUsed,
    };
  }

  function list() {
    const profiles = [];
    try {
      const storage = window.localStorage;
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith(prefix)) continue;
        const profile = readProfile(storage, key);
        if (profile) profiles.push(profile);
      }
    } catch {
      return profiles.sort(mostRecentFirst);
    }
    return profiles.sort(mostRecentFirst);
  }

  function mostRecentFirst(a, b) {
    return b.lastUsed - a.lastUsed || a.name.localeCompare(b.name, 'fi');
  }

  function find(input) {
    const name = normalizeName(input);
    if (!validName(name)) return null;
    try {
      return readProfile(window.localStorage, keyFor(name));
    } catch {
      return null;
    }
  }

  function update(input, change) {
    const name = normalizeName(input);
    if (!validName(name)) {
      throw new Error('Anna 1–24 merkin pituinen pelaajanimi.');
    }

    const key = keyFor(name);
    let storage;
    let profile;
    try {
      storage = window.localStorage;
      profile = readProfile(storage, key) ?? {
        name,
        appearance: { ...defaultAppearance },
        completed: {},
        endlessBest: 0,
        stars: 0,
        unlocked: [],
        lastUsed: 0,
      };
    } catch {
      throw storageError();
    }

    if (change(profile) === false) return profile;
    profile.lastUsed = Math.max(Date.now(), lastTimestamp + 1, profile.lastUsed + 1);
    try {
      storage.setItem(key, JSON.stringify(profile));
    } catch {
      throw storageError();
    }
    lastTimestamp = profile.lastUsed;
    return profile;
  }

  function storageError() {
    return new Error(
      'Profiilia ei voitu tallentaa. Tarkista, että selaimen paikallinen tallennus on käytettävissä.',
    );
  }

  window.FluffProfiles = {
    list,
    find,
    isGift: isExclusive,
    isLocked,
    open(name) {
      return update(name, () => {});
    },
    look(name, appearance) {
      return update(name, (profile) => {
        const look = appearanceWith(profile.appearance, appearance);
        for (const field of lockedFields) {
          const sku = field + ':' + look[field];
          if (!isLocked(sku, profile.unlocked)) continue;
          if (aerialExclusives.includes(sku)) {
            throw new Error('Tämä varuste avautuu korkealta siipipaketista.');
          }
          if (isExclusive(sku)) {
            throw new Error('Tämä varuste avautuu yllätyslaatikosta.');
          }
          throw new Error('Avaa valitsemasi asu tai esine tassumerkeillä ennen käyttöä.');
        }
        profile.appearance = look;
      });
    },
    collectStar(name) {
      return update(name, (profile) => {
        if (profile.stars === Number.MAX_SAFE_INTEGER) {
          throw new Error('Tassumerkkikukkaro on täynnä.');
        }
        profile.stars += 1;
      });
    },
    unlock(name, sku) {
      if (!isPaid(sku)) throw new Error('Tuntematon ostettava asu tai esine.');
      return update(name, (profile) => {
        if (profile.unlocked.includes(sku)) return false;
        if (profile.stars < prices[sku]) throw new Error('Tassumerkkisi eivät riitä tähän ostokseen.');
        profile.stars -= prices[sku];
        profile.unlocked.push(sku);
      });
    },
    grantExclusive(name, sku) {
      if (!isExclusive(sku)) throw new Error('Tuntematon lahjavaruste.');
      return update(name, (profile) => {
        if (profile.unlocked.includes(sku)) return false;
        profile.unlocked.push(sku);
      });
    },
    finish(name, levelId, seconds) {
      const id = String(levelId ?? '');
      if (!id || id === 'endless' || !validSeconds(seconds)) {
        throw new Error('Anna kentän tunniste ja kelvollinen aika.');
      }
      return update(name, (profile) => {
        const previous = Object.hasOwn(profile.completed, id) ? profile.completed[id] : Infinity;
        if (seconds < previous) profile.completed = { ...profile.completed, [id]: seconds };
      });
    },
    recordEndless(name, count) {
      if (!validCount(count)) {
        throw new Error('Anna kelvollinen hyppyjen määrä.');
      }
      return update(name, (profile) => {
        profile.endlessBest = Math.max(profile.endlessBest, count);
      });
    },
  };
})();
