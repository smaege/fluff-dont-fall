(() => {
  'use strict';
  const colors = {
    mint: ['Minttu', '#a4d6af'],
    rose: ['Roosa', '#edacbd'],
    lilac: ['Lila', '#c4a9e0'],
    peach: ['Persikka', '#f1bd98'],
    sky: ['Taivas', '#9ccddd'],
    honey: ['Hunaja', '#eac47b'],
    cocoa: ['Kaakao', '#b68c77'],
    snow: ['Vanilja', '#f2e4ca'],
  };
  const eyeColors = {
    classic: ['Alkuperäinen', '#513847'],
    amber: ['Meripihka', '#ae6a25'],
    ocean: ['Meri', '#376eaf'],
    emerald: ['Smaragdi', '#30826d'],
    violet: ['Ametisti', '#82509f'],
    berry: ['Karpalo', '#a34869'],
  };
  const dyeSlots = {
    dye: 'outfit',
    headDye: 'head',
    patchDye: 'patch',
    hatDye: 'hat',
    shoesDye: 'shoes',
    wingsDye: 'wings',
    itemDye: 'item',
  };
  const choices = {
    color: colors,
    eyeColor: eyeColors,
    ears: {
      cat: 'Kissa',
      bear: 'Karhu',
      bunny: 'Pupu',
      fox: 'Kettu',
      frog: 'Sammakko',
      axolotl: 'Aksolotli',
      dog: 'Koira',
      deer: 'Peura',
      penguin: 'Pingviini',
      hedgehog: 'Siili',
    },
    face: {
      smile: 'Hymy',
      happy: 'Ilo',
      wink: 'Vinkkaus',
      dreamy: 'Unelias',
      amazed: 'Hämmästys',
      tongue: 'Kieli ulkona',
    },
    outfit: {
      none: 'Ei asua',
      denim: 'Farkkuhaalarit',
      scarf: 'Neulehuivi',
      coat: 'Sadetakki',
      cape: 'Tähtiviitta',
      aviator: 'Lentäjäntakki',
    },
    dye: {
      classic: 'Alkuperäinen',
      raspberry: 'Vadelma',
      moss: 'Metsä',
      lavender: 'Laventeli',
      blue: 'Mustikka',
      honey: 'Hunaja',
      lagoon: 'Laguuni',
      peach: 'Aprikoosi',
    },
    item: {
      none: 'Tyhjä tassu',
      wand: 'Tähtisauva',
      pop: 'Tikkari',
      lantern: 'Lyhty',
      balloon: 'Pilvi-ilmapallo',
      scope: 'Kaukoputki',
      bee: 'Mehiläiskaveri',
      moonlantern: 'Kuulyhty',
      lagoonlantern: 'Siniruusulyhty',
    },
    head: {
      none: 'Ei koristetta',
      bow: 'Rusetti',
      flower: 'Kukka',
      crown: 'Kruunu',
      butterfly: 'Perhosrusetti',
      leaves: 'Lehtipari',
      strawberry: 'Mansikkapinni',
      shell: 'Simpukkapinni',
      star: 'Tähtipinni',
      rosecrown: 'Ruusukruunu',
    },
    hat: {
      none: 'Ei hattua',
      beanie: 'Tupsupipo',
      mushroom: 'Kärpässienihattu',
      topper: 'Silinteri',
    },
    shoes: {
      none: 'Paljaat tassut',
      boots: 'Sadekumisaappaat',
      sneakers: 'Nauhalenkkarit',
      slippers: 'Puputohvelit',
      comet: 'Komeettakengät',
      cloverslippers: 'Apilatossut',
    },
    wings: {
      none: 'Ei siipiä',
      feather: 'Höyhensiivet',
      moth: 'Yöperhosen siivet',
      dragon: 'Lohikäärmeen siivet',
      aurora: 'Revontulisiivet',
      tulippetals: 'Liilat terälehtisiivet',
    },
    patch: {
      none: 'Ei merkkiä',
      heart: 'Sydän',
      star: 'Tähti',
      rainbow: 'Sateenkaari',
      cherries: 'Kirsikat',
      sun: 'Aurinko',
      cloud: 'Pilvi',
      strawberry: 'Mansikka',
      daisy: 'Päivänkakkara',
    },
  };
  const defaults = {
    color: 'mint',
    eyeColor: 'classic',
    ears: 'cat',
    face: 'smile',
    roundness: 50,
    outfit: 'none',
    item: 'none',
    head: 'none',
    patch: 'none',
    hat: 'none',
    shoes: 'none',
    wings: 'none',
  };
  for (const field of Object.keys(dyeSlots)) {
    choices[field] = choices.dye;
    defaults[field] = 'classic';
  }
  function appearance(base, changes) {
    const look = { ...base };
    if (!changes || typeof changes !== 'object') return look;
    for (const [field, options] of Object.entries(choices)) {
      if (typeof changes[field] === 'string' && Object.hasOwn(options, changes[field]))
        look[field] = changes[field];
    }
    if (Number.isFinite(changes.roundness))
      look.roundness = Math.round(Math.max(0, Math.min(100, changes.roundness)));
    return look;
  }
  const dyes = {
    raspberry: '#cc7c91',
    moss: '#83ac8b',
    lavender: '#bb9fd2',
    blue: '#738ab8',
    honey: '#e0ad54',
    lagoon: '#52b3ba',
    peach: '#ed9979',
  };
  const originalDyes = {
    none: '#eee1d8',
    denim: '#769bbb',
    scarf: '#c56787',
    coat: '#efb746',
    cape: '#8676bf',
    aviator: '#bb8968',
  };
  const prices = Object.freeze({
    'outfit:cape': 6,
    'outfit:aviator': 10,
    'item:balloon': 3,
    'item:scope': 8,
  });
  const exclusives = Object.freeze(['item:bee', 'item:moonlantern', 'head:butterfly']);
  const aerialExclusives = Object.freeze(['wings:aurora', 'shoes:comet']);
  const flowerGifts = Object.freeze({
    rose: 'head:rosecrown',
    meadow: 'shoes:cloverslippers',
    lagoon: 'item:lagoonlantern',
    tulip: 'wings:tulippetals',
  });
  window.FluffLooks = {
    colors,
    choices,
    defaults,
    appearance,
    dyes,
    dyeSlots,
    eyeColors,
    originalDyes,
    prices,
    exclusives,
    aerialExclusives,
    flowerGifts,
  };
})();
