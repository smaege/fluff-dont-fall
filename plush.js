(() => {
  'use strict';
  const { colors, choices, dyes, originalDyes } = window.FluffLooks;
  const ink = '#513847',
    cream = '#fff0d1',
    blush = '#eca1ae';
  const cache = new Map();
  let studio;
  function tinted(hex, other, amount) {
    const channel = (i) => {
      const a = parseInt(hex.slice(i, i + 2), 16),
        b = parseInt(other.slice(i, i + 2), 16);
      return Math.round(a + (b - a) * amount)
        .toString(16)
        .padStart(2, '0');
    };
    return '#' + channel(1) + channel(3) + channel(5);
  }

  const paletteCache = new Map();
  function outfitPalette(dye) {
    if (!paletteCache.has(dye))
      paletteCache.set(dye, {
        dye,
        light: tinted(dye, '#ffeace', 0.34),
        shade: tinted(dye, '#473549', 0.31),
        tie: tinted(dye, '#663956', 0.135),
        thread: '#eabf89',
        wool: '#f5ddba',
        gold: '#deb461',
        rgb: [1, 3, 5].map((i) => parseInt(dye.slice(i, i + 2), 16) / 255),
      });
    return paletteCache.get(dye);
  }

  // Each palette starts with the main surface color, followed by untouched trim and details.
  const accessoryPalettes = {
    hat: {
      beanie: ['#b86b8f', '#ffdbb1', cream],
      mushroom: ['#d26072', '#f9dcae', cream],
      topper: ['#50476d', '#ffe086'],
    },
    shoes: {
      boots: ['#e9af48'],
      sneakers: ['#a575be', '#fff1de', cream, '#eacb74'],
      slippers: ['#e7a9b5', cream, ink, '#d2859d'],
      comet: ['#575092', '#ffe584'],
      cloverslippers: ['#79ad78', '#577e67', '#d2e7ab', '#eef3c5', '#588d67', '#9ccd8e'],
    },
    head: {
      bow: ['#d989a5'],
      flower: ['#fff1d4', '#91ac7d', '#e9ba57', '#ffe193'],
      crown: ['#f2c86b', cream, '#ffe4a0', '#c47a9c', '#cf83a0'],
      butterfly: ['#dc9ed9', '#fff1d6', '#efbc79', '#ffe3a0'],
      leaves: ['#a0bc77', '#e7b775'],
      strawberry: ['#d76f82', '#ffd4a8', '#83aa72', '#a6bf7f', '#ffe4a8'],
      shell: ['#c1a4d3', '#fff1de', '#fffaf1'],
      star: ['#8cbfcf', '#d4a46d', '#ffe6ac', '#edf7e6'],
      rosecrown: ['#df8ba7', '#658b6a', '#8bb582', '#bfd297'],
    },
    patch: {
      heart: ['#d98399'],
      star: ['#e8b65b'],
      rainbow: ['#db91a7', cream],
      cherries: ['#c86b82', '#779974', '#97b481'],
      sun: ['#e6a952', '#fff0ac'],
      cloud: ['#d3e9ee'],
      strawberry: ['#d76f82', '#83aa72', '#a6bf7f', '#ffe4a8'],
      daisy: ['#fff4dc', '#e2aa55', '#f8d278'],
    },
    item: {
      wand: ['#ebbc55'],
      pop: ['#ec96ad', '#f2dfc7', '#ffe5cf'],
      lantern: ['#ae8e73', '#ffe4a3', '#efb453'],
      balloon: ['#fff6df', '#ebc0cc'],
      scope: ['#254f59', '#c29d5f', '#e5bd75', '#659dbb', '#aad4e8'],
      bee: ['#f4ba47', '#614455', '#cce7ee', '#f4f5e2', '#f4c871', ink, blush],
      moonlantern: ['#6879ac', '#ffe28b', '#fff3c9', '#f3bd71'],
      lagoonlantern: ['#5b9bd1', '#506782', '#a8cbd7', '#6dab9d', '#dffcf4'],
    },
  };
  const accessoryPaletteCache = new WeakMap();
  const unchangedColor = (color) => color;
  const rgbChannels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const brightness = ([r, g, b]) => r * 0.2126 + g * 0.7152 + b * 0.0722;

  function accessoryPalette(dye, palette) {
    if (!Array.isArray(palette) || !Object.hasOwn(dyes, dye)) return unchangedColor;
    let variants = accessoryPaletteCache.get(palette);
    if (!variants) {
      variants = new Map();
      accessoryPaletteCache.set(palette, variants);
    }
    if (!variants.has(dye)) {
      const [reference, ...details] = palette;
      const base = rgbChannels(reference);
      const colorCache = new Map(details.map((color) => [color, color]));
      const target = dyes[dye];
      colorCache.set(reference, target);
      variants.set(dye, (color) => {
        if (!colorCache.has(color)) {
          // Anchor the main surface to the dye and retain the surrounding shade and hue variation.
          const difference = rgbChannels(color).map((channel, i) => channel - base[i]);
          const light = brightness(difference);
          const tone = light < 0 ? '#281e38' : '#fff5e8';
          const shaded = tinted(target, tone, Math.min(1, Math.abs(light) / 180));
          const channels = rgbChannels(shaded).map((channel, i) => {
            const adjusted = Math.round(channel + 0.25 * (difference[i] - light));
            return Math.max(0, Math.min(255, adjusted)).toString(16).padStart(2, '0');
          });
          colorCache.set(color, '#' + channels.join(''));
        }
        return colorCache.get(color);
      });
    }
    return variants.get(dye);
  }

  // Rolled fabric petals rise toward the curled center of the rose.
  function roseFold(radius, flare, depth, turns, lobes, phase) {
    const segments = 48,
      sides = 8,
      rows = [],
      vertices = [];
    function point(t, section) {
      const angle = phase + t * 2 * Math.PI * turns;
      const scallop = Math.cos(angle * lobes + phase);
      const roll = Math.cos(section);
      const fullness = flare ? 0.5 + 0.48 * Math.sin(Math.PI * t) : 1;
      const radial = radius + flare * t + 0.022 * scallop + (0.087 + 0.014 * scallop) * roll * fullness;
      return [
        Math.cos(angle) * radial,
        Math.sin(angle) * radial,
        depth +
          (flare ? t * 0.09 : 0) +
          0.025 * scallop +
          fullness * (-0.047 * roll + 0.073 * Math.sin(section)),
      ];
    }
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const row = [];
      for (let j = 0; j < sides; j++) {
        const section = (j * 2 * Math.PI) / sides;
        const p = point(t, section);
        const travel = point(t + 0.001, section).map((n, k) => n - p[k]);
        const around = point(t, section + 0.001).map((n, k) => n - p[k]);
        const normal = [
          travel[1] * around[2] - travel[2] * around[1],
          travel[2] * around[0] - travel[0] * around[2],
          travel[0] * around[1] - travel[1] * around[0],
        ];
        const length = Math.hypot(...normal);
        row.push([...p, ...normal.map((n) => n / length)]);
      }
      rows.push(row);
    }
    for (let i = 0; i < segments; i++)
      for (let j = 0; j < sides; j++) {
        const next = (j + 1) % sides;
        const a = rows[i][j],
          b = rows[i + 1][j],
          c = rows[i + 1][next],
          d = rows[i][next];
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    return new Float32Array(vertices);
  }

  const roseFolds = [
    roseFold(0.386, 0, -0.035, 1, 5, 0.5),
    roseFold(0.274, 0, -0.152, 1, 4, 1.2),
    roseFold(0.074, 0.079, -0.287, 1.18, 3, -0.8),
  ];

  function drawRose(world, position, size, colors, material, reverse = false) {
    const scale = [size, size, reverse ? -size : size];
    for (let i = 0; i < roseFolds.length; i++)
      world.drawDetail(roseFolds[i], position, colors[i], material, scale);
  }

  // The very same object is drawn in the studio and in the first-person paw.
  function heldItem(world, item, origin, scale = 1, dye = 'classic') {
    const [x, y, z] = origin;
    const itemColor = accessoryPalette(dye, accessoryPalettes.item[item]);
    const part = (mesh, at, size, color, angle = 0, material = 0) =>
      world.draw(
        mesh,
        [x + at[0] * scale, y + at[1] * scale, z + at[2] * scale],
        size.map((n) => n * scale),
        itemColor(color),
        angle,
        material,
      );
    if (item === 'wand' || item === 'pop') {
      part(
        'box',
        [0.02, 0.22, 0],
        [0.058, 0.61, 0.058],
        item === 'wand' ? '#b393cb' : '#f2dfc7',
        -0.14,
      );
      if (item === 'wand') {
        part('star', [0.073, 0.56, -0.012], [0.42, 0.42, 0.17], '#ebbc55', -0.11);
        part('star', [0.073, 0.56, -0.047], [0.32, 0.32, 0.16], '#ffdb82', -0.11);
        part('ball', [0.06, 0.37, -0.015], [0.15, 0.075, 0.09], '#db94a5');
      } else {
        part('ball', [0.07, 0.55, 0], [0.39, 0.39, 0.18], '#ec96ad', 0.33, 2);
        part('ball', [0.07, 0.55, -0.083], [0.122, 0.12, 0.045], '#ffe5cf');
      }
    } else if (item === 'lantern') {
      part('arch', [0, -0.05, 0], [0.31, 0.39, 0.48], '#aa845d');
      part('box', [0, -0.24, 0], [0.265, 0.34, 0.21], '#ffe4a3');
      for (const side of [-1, 1])
        part('box', [side * 0.127, -0.24, -0.08], [0.028, 0.35, 0.042], '#9f826b');
      part('box', [0, -0.42, 0], [0.33, 0.065, 0.27], '#ae8e73');
      part('ear', [0, -0.053, 0], [0.35, 0.135, 0.29], '#c99274');
      part('star', [0, -0.24, -0.11], [0.115, 0.115, 0.035], '#efb453');
    } else if (item === 'balloon') {
      const cord = '#ae8394';
      part('box', [0.033, 0.103, 0], [0.031, 0.25, 0.032], cord, -0.31);
      part('box', [0.108, 0.303, 0], [0.031, 0.19, 0.032], cord, -0.43);
      for (const [stitchX, stitchY] of [
        [0.026, 0.079],
        [0.044, 0.136],
        [0.063, 0.193],
        [0.094, 0.272],
        [0.12, 0.329],
      ]) {
        part('ball', [stitchX, stitchY, 0], [0.038, 0.017, 0.039], '#ebc0cc', -0.37);
      }
      part('ball', [0.17, 0.457, 0], [0.229, 0.16, 0.171], '#d5e9f0');
      part('ball', [0.098, 0.517, 0], [0.178, 0.172, 0.17], cream);
      part('ball', [0.219, 0.563, 0], [0.204, 0.221, 0.209], '#fff6df');
      part('ball', [0.328, 0.492, 0], [0.168, 0.159, 0.173], '#e3eff5');
      part('ball', [0.149, 0.396, 0], [0.078, 0.063, 0.067], blush, -0.42);
    } else if (item === 'scope') {
      const angle = -0.85,
        brass = '#c29d5f',
        brightBrass = '#e5bd75';
      const barrel = (mesh, along, width, length, color) =>
        part(
          mesh,
          [0.048 - along * Math.sin(angle), 0.096 + along * Math.cos(angle), 0],
          [width, length, width],
          color,
          angle,
        );
      barrel('box', -0.091, 0.084, 0.229, '#34646a');
      barrel('box', 0.102, 0.144, 0.28, '#254f59');
      barrel('box', -0.187, 0.105, 0.057, brass);
      barrel('box', -0.018, 0.151, 0.056, brightBrass);
      barrel('box', 0.224, 0.189, 0.087, brass);
      barrel('box', 0.255, 0.198, 0.039, brightBrass);
      barrel('ball', 0.275, 0.158, 0.047, '#659dbb');
      barrel('ball', 0.29, 0.087, 0.026, '#aad4e8');
    } else if (item === 'bee') {
      const stripe = '#614455';
      part('ball', [0.015, 0.114, 0.027], [0.23, 0.22, 0.23], '#d79849', 0.42);
      part('ball', [0.113, 0.264, 0], [0.45, 0.294, 0.309], '#f4ba47');
      part('ball', [0.131, 0.267, 0], [0.077, 0.303, 0.319], stripe);
      part('ball', [0.245, 0.266, 0], [0.063, 0.25, 0.261], stripe);
      for (const side of [-1, 1]) {
        part(
          'ball',
          [0.137 + side * 0.072, 0.422, 0.063],
          [0.122, 0.236, 0.087],
          '#cce7ee',
          -side * 0.66,
        );
        part(
          'ball',
          [0.145 + side * 0.098, 0.45, 0.036],
          [0.044, 0.111, 0.043],
          '#f4f5e2',
          -side * 0.66,
        );
        part(
          'ball',
          [-0.08 + side * 0.057, 0.408, -0.071],
          [0.029, 0.118, 0.031],
          stripe,
          -side * 0.39,
        );
        part('ball', [-0.08 + side * 0.077, 0.459, -0.071], [0.053, 0.052, 0.052], '#f4c871');
      }
      part('ball', [-0.067, 0.288, -0.09], [0.263, 0.248, 0.231], '#ffcf65');
      for (const side of [-1, 1]) {
        part('ball', [-0.067 + side * 0.047, 0.308, -0.193], [0.029, 0.039, 0.024], ink);
        part('ball', [-0.067 + side * 0.074, 0.268, -0.181], [0.046, 0.022, 0.023], blush);
      }
      part('ball', [-0.067, 0.271, -0.203], [0.035, 0.018, 0.016], ink);
    } else if (item === 'moonlantern') {
      const frame = '#6879ac',
        silver = '#a9bed7';
      part('ball', [0.023, 0.089, 0], [0.083, 0.26, 0.076], frame, -0.23);
      part('ball', [0.048, 0.196, 0], [0.192, 0.089, 0.14], silver);
      for (const angle of [0, Math.PI])
        part('arch', [0.091, 0.377, 0], [0.422, 0.421, 1.73], frame, angle);
      for (const side of [-1, 1])
        part('ball', [0.091 + side * 0.19, 0.377, 0], [0.057, 0.061, 0.167], silver);
      part('ball', [0.091, 0.566, 0], [0.103, 0.072, 0.155], silver);
      for (let segment = 0; segment <= 12; segment++) {
        const progress = segment / 12,
          angle = 0.95 + progress * (Math.PI * 2 - 1.9),
          fullness = Math.sin(Math.PI * progress);
        part(
          'ball',
          [0.097 + Math.cos(angle) * 0.101, 0.377 + Math.sin(angle) * 0.117, 0],
          [0.025 + fullness * 0.078, 0.042 + fullness * 0.071, 0.04 + fullness * 0.092],
          '#ffe28b',
          angle,
        );
      }
      part('star', [0.173, 0.411, 0], [0.123, 0.123, 0.128], '#fff3c9', 0.14);
      part('ball', [0.166, 0.329, 0], [0.03, 0.034, 0.053], '#f3bd71');
    } else if (item === 'lagoonlantern') {
      const frame = '#506782',
        trim = '#a8cbd7',
        stem = 0.095,
        cupY = 0.232,
        roseY = 0.397,
        shades = ['#5b9bd1', '#8bd6f1', '#c3f5fa'].map(itemColor);
      part('ball', [0.032, 0.082, 0], [0.096, 0.275, 0.086], frame, -0.36, -1);
      for (let i = 0; i < 3; i++)
        part('ball', [0.018 + i * 0.018, 0.055 + i * 0.045, 0], [0.105, 0.021, 0.097], trim, -0.36);
      part('ball', [stem - 0.014, cupY - 0.037, 0], [0.172, 0.068, 0.149], trim, -0.16);
      part('ball', [stem, cupY + 0.015, 0], [0.29, 0.131, 0.198], frame, 0, -1);
      part('ball', [stem, roseY, 0], [0.432, 0.418, 0.198], '#416b9f', 0, -1);
      for (const side of [-1, 1]) {
        part(
          'ear',
          [stem + side * 0.136, cupY + 0.033, 0],
          [0.084, 0.171, 0.142],
          '#6dab9d',
          -side * 0.72,
          -1,
        );
        const position = [x + stem * scale, y + roseY * scale, z + side * 0.059 * scale];
        drawRose(world, position, 0.5 * scale, shades, -19, side === 1);
        part(
          'ball',
          [stem + 0.011, roseY + 0.008, side * 0.214],
          [0.081, 0.073, 0.059],
          '#dffcf4',
          0,
          -19,
        );
        part(
          'ball',
          [stem - 0.014, roseY + 0.026, side * 0.234],
          [0.026, 0.021, 0.012],
          '#f8fff9',
          0,
          -19,
        );
      }
    }
  }

  const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  function motion(s) {
    const amount = motionPreference?.matches ? 0.35 : 1;
    const stride = Math.sin(s.walk) * s.gait * amount;
    const age = s.time - s.landAt;
    const impact = age < 0.38 ? s.landingPower * Math.exp(-age * 12) * Math.sin(age * 24) * amount : 0;
    const spring = Math.max(-1, Math.min(1, s.vy / 7.3)) * s.airBlend * amount;
    const lift = s.airBlend * amount;
    const phase = s.spinAt >= 0 ? Math.min(1, Math.max(0, (s.time - s.spinAt) / 0.54)) : 1;
    const spinning = phase < 1 ? Math.sin(Math.PI * phase) : 0;
    return {
      stride,
      impact,
      spring,
      lift,
      spin:
        phase === 1
          ? 0
          : motionPreference?.matches
            ? 0.18 * spinning
            : 2 * Math.PI * phase * phase * (3 - 2 * phase),
      twirl: spinning * amount,
      height: 1 + 0.09 * spring - 0.29 * impact - 0.032 * Math.cos(s.walk * 2) * s.gait * amount,
      roll: 0.074 * stride,
      tilt: (0.085 * s.gait + 0.065 * spring) * amount,
      ear: 0.08 * stride - 0.11 * spring - 0.12 * impact,
      tail: 0.17 * Math.sin(s.walk - 0.65) * s.gait * amount + 0.07 * spring,
    };
  }

  function forepaws(world, a, aspect, s) {
    const pose = motion(s);
    const sway = pose.stride * 0.042,
      lift = pose.spring * 0.072 - pose.impact * 0.12;
    const fur = colors[a.color][1],
      width = 0.37 + (0.14 * a.roundness) / 100;
    const size = Math.min(1, Math.max(0.7, aspect)),
      handX = 0.8 * aspect;
    for (const side of [-1, 1]) {
      const carrying = side === -1 && (a.item === 'lantern' || a.item === 'lagoonlantern');
      const x = side * (handX + pose.lift * 0.024 - pose.twirl * 0.15) + sway * 0.56,
        y = (carrying ? -0.76 : -1.36) + side * sway + lift + pose.twirl * (side === -1 ? 0.21 : 0.34);
      world.draw('egg', [x, y, 1.89], [width * size, 0.69 * size, 0.46 * size], fur, side * 0.37, -1);
      if (a.outfit === 'coat' || a.outfit === 'aviator') {
        world.draw(
          'ball',
          [x + side * 0.06, y - 0.15, 1.82],
          [width * size * 1.08, 0.34 * size, 0.44 * size],
          dyes[a.dye] || originalDyes[a.outfit],
          side * 0.37,
        );
      }
      if (a.outfit === 'aviator')
        world.draw(
          'ball',
          [x + side * 0.039, y - 0.04, 1.83],
          [width * size * 1.04, 0.105 * size, 0.443 * size],
          '#f5ddba',
          side * 0.37,
          -1,
        );
      if (side === -1)
        heldItem(
          world,
          a.item,
          [x - 0.032, y + (carrying ? 0.13 : 0.1), carrying ? 1.67 : 1.94],
          1.2 * size,
          a.itemDye,
        );
    }
  }

  function seam(part, x0, y0, x1, y1, z, width, color) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    part(
      'ball',
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      z,
      width,
      Math.hypot(dx, dy) + width * 0.6,
      width,
      color,
      -Math.atan2(dx, dy),
    );
  }

  function strawberry(part) {
    part('ear', 0, -0.016, 0, 0.242, 0.252, 0.1, '#d76f82', Math.PI);
    for (const side of [-1, 1])
      part('ear', side * 0.041, 0.096, -0.025, 0.041, 0.105, 0.049, '#83aa72', -side * 1.02);
    part('ear', 0.004, 0.116, -0.025, 0.039, 0.091, 0.047, '#a6bf7f', -0.14);
    for (const [x, y, z, rotation] of [
      [-0.051, 0.031, -0.042, 0.24],
      [0.052, 0.031, -0.042, -0.24],
      [0, 0.004, -0.05, 0],
      [-0.035, -0.046, -0.035, 0.17],
      [0.035, -0.046, -0.035, -0.17],
      [0, -0.084, -0.032, 0.03],
    ])
      part('ball', x, y, z, 0.014, 0.026, 0.016, '#ffe4a8', rotation);
  }

  // Brim width, depth, height below the crown, and front-to-back placement.
  const hatFits = {
    cat: [0.405, 0.67, 0.052, -0.076],
    bear: [0.413, 0.69, 0.058, -0.079],
    bunny: [0.345, 0.66, 0.048, -0.093],
    fox: [0.386, 0.67, 0.05, -0.092],
    frog: [0.338, 0.56, 0.024, 0.106],
    axolotl: [0.545, 0.73, 0.083, -0.035],
    dog: [0.544, 0.75, 0.085, -0.038],
    deer: [0.376, 0.65, 0.049, -0.097],
    penguin: [0.545, 0.75, 0.086, -0.033],
    hedgehog: [0.448, 0.64, 0.041, -0.087],
  };

  function drawHat(part, kind, y, z, width, depth, height, decorated, dye) {
    const hatColor = accessoryPalette(dye, accessoryPalettes.hat[kind]);
    const layer = (mesh, dx, dy, dz, sx, sy, sz, color, rotation = 0, material = 0) =>
      part(
        mesh,
        dx * width,
        y + dy * height,
        z + dz * depth,
        sx * width,
        sy * height,
        sz * depth,
        hatColor(color),
        rotation,
        material,
      );
    if (kind === 'beanie') {
      layer('egg', 0, 0.092, 0, 0.94, 0.405, 0.955, '#b86b8f', 0, -11);
      layer('ball', 0, -0.044, 0, 0.995, 0.103, 0.987, '#bd7592', 0, -11);
      layer('knit-cuff', 0, -0.01, 0, 1.023, 0.119, 1.023, '#de8ea6', 0, -11);
      layer('ball', 0.035, 0.319, 0.005, 0.29, 0.178, 0.239, '#ffdbb1', 0, -1);
      layer('ball', -0.025, 0.349, -0.038, 0.145, 0.103, 0.13, cream, 0, -1);
    } else if (kind === 'mushroom') {
      layer('ball', 0, -0.022, 0, 0.99, 0.128, 0.99, '#f9dcae');
      layer('ball', 0, 0.011, 0, 1.045, 0.143, 1.04, '#d86e7a');
      layer('egg', 0, 0.077, 0, 1.025, 0.374, 1.02, '#d26072');
      for (const [x, dy, dz, size] of [
        [-0.28, 0.169, -0.312, 0.15],
        [0.11, 0.217, -0.247, 0.18],
        [0.365, 0.115, -0.283, 0.13],
        [-0.088, 0.253, 0.063, 0.142],
        [-0.307, 0.179, 0.263, 0.159],
        [0.205, 0.185, 0.297, 0.16],
      ])
        layer('ball', x, dy, dz, size, 0.075, size * 0.87, cream, -x);
    } else if (kind === 'topper') {
      const tube = (dy, sx, sy, sz, color) =>
        part(
          'cylinder',
          0,
          y + dy * height,
          z,
          sy * height,
          sx * width,
          sz * depth,
          hatColor(color),
          Math.PI / 2,
        );
      layer('ball', 0, -0.022, 0, 1.085, 0.102, 1.049, '#82749c');
      layer('ball', 0, -0.004, 0, 1.09, 0.103, 1.054, '#484063');
      tube(0.149, 0.731, 0.327, 0.73, '#50476d');
      layer('ball', 0, 0.304, 0, 0.733, 0.082, 0.735, '#685b83');
      tube(0.045, 0.765, 0.102, 0.764, '#ae739a');
      layer(
        'star',
        decorated ? 0.293 : 0.16,
        decorated ? 0.209 : 0.056,
        decorated ? -0.244 : -0.367,
        0.214,
        decorated ? 0.105 : 0.132,
        0.112,
        '#ffe086',
        0.2,
      );
    }
  }

  function roseCrown(world, part, a, top, w, h, d, surface, cap) {
    const frog = a.ears === 'frog';
    const narrow = frog || a.ears === 'bunny';
    const width = cap ? cap.width * 0.44 : w * (narrow ? 0.171 : 0.204);
    const rise = cap ? cap.y : top - h * (frog ? 0.033 : 0.075);
    const scale = Math.min(1.07, 0.71 + width * 0.87);
    const shades = ['#b95e86', '#df8ba7', '#f4b5c7'].map(
      accessoryPalette(a.headDye, accessoryPalettes.head.rosecrown),
    );
    function band(t) {
      const x = width * t;
      const y = rise + (0.038 - 0.073 * t * t) * scale;
      const z = cap
        ? cap.center + (cap.front - cap.center) * Math.sqrt(1 - 0.67 * t * t)
        : surface(x, y) - 0.021 - (frog ? 0.075 : 0);
      return [x, y, z];
    }
    for (const [t, angle] of [
      [-0.87, 1.15],
      [-0.65, -0.88],
      [-0.2, 0.96],
      [0.24, -0.93],
      [0.69, 0.91],
      [0.87, -1.1],
    ]) {
      const [x, y, z] = band(t);
      part('ball', x, y - 0.035 * scale, z + 0.011, width * 0.61, 0.054, 0.071, '#658b6a', t * -0.38);
      part('ear', x, y - 0.006, z - 0.01, 0.074 * scale, 0.15 * scale, 0.061, '#8bb582', angle);
      part('ball', x, y - 0.006, z - 0.038, 0.011, 0.08 * scale, 0.014, '#bfd297', angle);
    }
    for (const [t, diameter] of [
      [-0.76, 0.129],
      [-0.42, 0.169],
      [-0.01, 0.222],
      [0.43, 0.174],
      [0.76, 0.126],
    ]) {
      const [x, y, z] = band(t);
      const size = diameter * scale;
      part('ball', x, y, z + 0.012, size * 0.84, size * 0.84, size * 0.53, shades[0]);
      drawRose(world, [x, y, z - 0.018], size, shades, -1);
    }

    const quills = !cap && a.ears === 'hedgehog';
    const backY = rise + (quills ? 0.061 : -0.011);
    const backZ = cap ? 2 * cap.center - cap.front : -surface(0, backY) + d * (quills ? 0.112 : 0.021);
    part('ball', 0, backY, backZ, width * 0.93, 0.055, 0.063, '#658b6a');
    for (const side of [-1, 1])
      part(
        'ear',
        side * 0.074 * scale,
        backY + 0.013,
        backZ + 0.025,
        0.059,
        0.151 * scale,
        0.053,
        '#8bb582',
        -side * 1.06,
      );
    drawRose(world, [0, backY + 0.026, backZ + 0.038], 0.139 * scale, shades, -1, true);
  }

  function headAccessories(world, part, a, top, w, h, d, surface) {
    const frog = a.ears === 'frog';
    const hasHat = a.hat && a.hat !== 'none';
    const hasOrnament = a.head && a.head !== 'none';
    if (!hasHat && !hasOrnament) return;

    let y = top - h * 0.112;
    let x = frog ? 0 : -w * (a.ears === 'hedgehog' ? 0.119 : 0.142);
    let z = surface(x, y) - 0.027;
    let scale = 0.88 + (0.12 * w) / 1.64;
    let angle = frog ? -0.03 : -0.18;
    if (hasHat) {
      const mushroom = a.hat === 'mushroom';
      const hedgehog = a.ears === 'hedgehog';
      const [widthRatio, depthRatio, drop, shift] = hatFits[a.ears];
      const width = w * widthRatio;
      const depth = d * depthRatio;
      // A fuller cap clears the frog's raised eyes and the hedgehog's rear quills.
      const baseY = top - h * drop + (mushroom && frog ? 0.062 : 0);
      const baseZ = d * (shift - (mushroom && frog ? 0.026 : 0));
      const height = mushroom && (frog || hedgehog) ? 1.22 : a.ears === 'bunny' ? 0.92 : 1;
      drawHat(part, a.hat, baseY, baseZ, width, depth, height, hasOrnament, a.hatDye);

      // A clip mounts to the front of the turned cuff, cap, or ribbon.
      const [rise, front] = {
        beanie: frog ? [0.101, 0.467] : [-0.004, 0.484],
        mushroom: frog ? [0.091, 0.492] : [0.059, 0.506],
        topper: frog ? [0.14, 0.367] : [0.071, 0.367],
      }[a.hat];
      if (a.head === 'rosecrown') {
        roseCrown(world, part, a, top, w, h, d, surface, {
          width,
          y: baseY + rise * height,
          center: baseZ,
          front: baseZ - depth * front - 0.019,
        });
        return;
      }
      x = width * (a.head === 'crown' ? 0 : frog ? (mushroom ? -0.155 : 0) : -0.197);
      y = baseY + rise * height;
      z = baseZ - depth * front - 0.014;
      scale = Math.min(scale, 0.62 + width * 0.33);
      if (frog && mushroom) scale *= 0.88;
    } else if (a.head === 'rosecrown') {
      roseCrown(world, part, a, top, w, h, d, surface);
      return;
    } else if (a.head === 'crown') {
      x = 0;
      y = top - h * 0.013;
      z = d * (frog ? 0.05 : a.ears === 'hedgehog' ? -0.085 : -0.039);
      angle = 0;
    }
    if (!hasOrnament) return;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const followsForehead = !hasHat && a.head !== 'crown';
    const anchorSurface = followsForehead ? surface(x, y) : 0;
    const ornamentColor = accessoryPalette(a.headDye, accessoryPalettes.head[a.head]);
    const ornament = (mesh, dx, dy, dz, sx, sy, sz, color, rotation = 0) => {
      const px = x + (dx * cos - dy * sin) * scale;
      const py = y + (dx * sin + dy * cos) * scale;
      const bend = followsForehead ? Math.min(0, surface(px, py) - anchorSurface) : 0;
      part(
        mesh,
        px,
        py,
        z + bend + dz * scale,
        sx * scale,
        sy * scale,
        sz * scale,
        ornamentColor(color),
        rotation + angle,
        a.head === 'crown' ? 0 : -1,
      );
    };
    const bead = (dx, dy, dz, sx, sy, sz, color, rotation) =>
      ornament('ball', dx, dy, dz, sx, sy, sz, color, rotation);
    if (a.head === 'bow') {
      const bowEdge = hasHat ? '#9f608c' : '#d989a5';
      const bowKnot = hasHat ? '#a15980' : '#bf6d8c';
      for (const side of [-1, 1]) {
        bead(side * 0.098, 0.019, 0, 0.219, 0.14, 0.101, bowEdge, side * 0.38);
        bead(side * 0.102, 0.025, -0.029, 0.144, 0.088, 0.065, '#eca5b8', side * 0.38);
        bead(side * 0.062, -0.058, 0.005, 0.076, 0.128, 0.065, '#c97796', side * 0.37);
      }
      bead(0, 0.004, -0.046, 0.091, 0.102, 0.087, bowKnot, 0.12);
      bead(-0.012, 0.021, -0.082, 0.031, 0.045, 0.021, '#f3bbca', 0.12);
    } else if (a.head === 'flower') {
      for (let j = 0; j < 6; j++) {
        const petal = (j * Math.PI) / 3;
        bead(
          Math.sin(petal) * 0.076,
          Math.cos(petal) * 0.076,
          -0.009,
          0.086,
          0.133,
          0.073,
          '#fff1d4',
          -petal,
        );
      }
      bead(-0.071, -0.077, 0.018, 0.095, 0.05, 0.056, '#91ac7d', 0.69);
      bead(0, 0, -0.044, 0.109, 0.108, 0.082, '#e9ba57');
      bead(-0.013, 0.017, -0.079, 0.036, 0.036, 0.026, '#ffe193');
    } else if (a.head === 'crown') {
      if (hasHat) {
        bead(0, -0.015, 0, 0.278, 0.067, 0.079, '#dfaa58');
        for (const i of [-1, 0, 1]) {
          const rise = i === 0 ? 0.054 : 0.03;
          ornament('ear', i * 0.082, rise, -0.004, 0.106, 0.147, 0.067, '#f2c86b', -i * 0.21);
          bead(i * 0.082, rise + 0.064, -0.004, 0.035, 0.035, 0.036, cream);
        }
        bead(0, -0.006, -0.037, 0.043, 0.037, 0.027, '#c47a9c');
      } else {
        bead(0, -0.031, 0, 0.366, 0.122, 0.341, '#e2ab54');
        bead(0, -0.013, 0, 0.37, 0.062, 0.345, '#f4cd79');
        for (let j = 0; j < 5; j++) {
          const point = (j * 2 * Math.PI) / 5;
          const dx = Math.sin(point) * 0.13;
          const dz = -Math.cos(point) * 0.126;
          ornament('ear', dx, 0.055, dz, 0.128, 0.192, 0.116, '#f2c86b', -dx * 1.1);
          bead(dx * 1.077, 0.143, dz, 0.048, 0.048, 0.048, '#ffe4a0');
        }
        bead(0, 0.047, -0.178, 0.048, 0.062, 0.037, '#cf83a0');
      }
    } else if (a.head === 'butterfly') {
      for (const side of [-1, 1]) {
        const upper = -side * 0.69;
        const lower = side * 0.59;
        bead(side * 0.108, 0.049, -0.005, 0.144, 0.237, 0.091, '#8860ad', upper);
        bead(side * 0.117, 0.063, -0.033, 0.109, 0.182, 0.069, '#dc9ed9', upper);
        bead(side * 0.091, -0.071, -0.006, 0.134, 0.157, 0.087, '#62999d', lower);
        bead(side * 0.09, -0.069, -0.035, 0.103, 0.121, 0.061, '#ade1cc', lower);
        bead(side * 0.136, 0.099, -0.061, 0.043, 0.04, 0.036, '#fff1d6', upper);
        bead(side * 0.036, 0.094, -0.033, 0.018, 0.081, 0.021, '#83547f', -side * 0.56);
        bead(side * 0.056, 0.124, -0.034, 0.029, 0.03, 0.031, '#efbc79');
      }
      bead(0, 0, -0.04, 0.067, 0.159, 0.078, '#ad6d9f');
      bead(0, 0.028, -0.076, 0.044, 0.049, 0.035, '#ffe3a0');
    } else if (a.head === 'leaves') {
      ornament('ear', -0.078, 0.019, 0, 0.123, 0.226, 0.078, '#73967b', 1.07);
      ornament('ear', 0.052, 0.061, -0.009, 0.143, 0.243, 0.078, '#a0bc77', -0.73);
      bead(-0.075, 0.029, -0.035, 0.016, 0.132, 0.02, '#bbd8a6', 1.07);
      bead(0.056, 0.068, -0.047, 0.017, 0.144, 0.021, '#deedb0', -0.73);
      bead(-0.006, -0.061, -0.034, 0.087, 0.061, 0.064, '#e7b775', 0.38);
    } else if (a.head === 'strawberry') {
      if (a.hat === 'mushroom')
        ornament('ear', 0, -0.016, 0.005, 0.273, 0.281, 0.096, '#ffd4a8', Math.PI);
      strawberry(ornament);
    } else if (a.head === 'shell') {
      for (const [dx, dy, length, rotation, color] of [
        [-0.08, -0.004, 0.189, 3.99, '#ad92c5'],
        [0.08, -0.004, 0.189, 2.29, '#ad92c5'],
        [-0.048, 0.027, 0.211, 3.56, '#c1a4d3'],
        [0.048, 0.027, 0.211, 2.72, '#c1a4d3'],
        [0, 0.039, 0.226, Math.PI, '#d4b6df'],
      ])
        ornament('ear', dx, dy, -0.014, 0.092, length, 0.071, color, rotation);
      bead(0, -0.062, -0.012, 0.163, 0.072, 0.076, '#ad8dbc');
      bead(0, -0.056, -0.052, 0.055, 0.055, 0.048, '#fff1de');
      bead(-0.006, -0.045, -0.073, 0.021, 0.019, 0.012, '#fffaf1');
    } else if (a.head === 'star') {
      bead(0.051, -0.076, 0.002, 0.212, 0.061, 0.058, '#d4a46d', -0.15);
      bead(0.131, -0.087, -0.019, 0.03, 0.028, 0.025, '#ffe6ac');
      ornament('star', -0.025, 0.018, -0.025, 0.273, 0.273, 0.112, '#8cbfcf', 0.11);
      ornament('star', -0.025, 0.018, -0.055, 0.208, 0.208, 0.072, '#b3dee1', 0.11);
      bead(-0.056, 0.041, -0.078, 0.032, 0.019, 0.018, '#edf7e6', 0.53);
    }
  }

  function shoe(part, kind, x, y, z, side, shoeColor) {
    const layer = (mesh, dx, dy, dz, sx, sy, sz, color, tilt = 0) =>
      part(
        mesh,
        x + side * dx,
        y + dy,
        z + dz,
        sx,
        sy,
        sz,
        shoeColor(color),
        side * tilt,
        kind === 'slippers' || kind === 'cloverslippers' ? -1 : 0,
      );
    if (kind === 'boots') {
      layer('box', 0, -0.069, -0.06, 0.457, 0.105, 0.591, '#9c624d');
      layer('egg', 0, 0.017, -0.118, 0.453, 0.227, 0.486, '#e9af48');
      layer('box', 0, 0.112, 0.017, 0.405, 0.322, 0.398, '#efbc55');
      layer('ball', 0, 0.26, 0.017, 0.43, 0.108, 0.421, '#ffdf89');
      layer('ball', 0, 0.273, -0.111, 0.184, 0.072, 0.149, '#d79142');
      layer('box', 0.023, 0.045, 0.164, 0.413, 0.205, 0.29, '#e9af48');
      layer('ball', 0.108, 0.23, 0.217, 0.088, 0.146, 0.103, '#ffe7a6', -0.18);
    } else if (kind === 'sneakers') {
      layer('box', 0, -0.063, -0.085, 0.455, 0.11, 0.588, '#8f78a1');
      layer('box', 0, -0.023, -0.089, 0.465, 0.111, 0.597, '#fff1de');
      layer('egg', 0, 0.06, -0.057, 0.451, 0.266, 0.54, '#a575be');
      layer('ball', 0, 0.027, -0.279, 0.412, 0.173, 0.21, '#f6dcde');
      for (const [dy, dz] of [
        [0.131, -0.23],
        [0.161, -0.172],
        [0.187, -0.113],
      ])
        layer('ball', 0, dy, dz, 0.221, 0.045, 0.044, cream, 0.14);
      layer('star', 0.165, 0.066, -0.169, 0.114, 0.115, 0.087, '#eacb74', -0.15);
      layer('box', 0.026, 0, 0.173, 0.423, 0.114, 0.27, '#fff1de');
      layer('ball', 0.106, 0.096, 0.229, 0.242, 0.184, 0.197, '#a575be');
      layer('ball', 0.142, 0.155, 0.292, 0.095, 0.052, 0.061, '#f6dcde');
    } else if (kind === 'slippers') {
      layer('box', 0, -0.056, -0.071, 0.456, 0.115, 0.587, '#bb7c8c');
      layer('ball', 0, 0.036, -0.079, 0.452, 0.263, 0.584, '#e7a9b5');
      layer('ball', 0, 0.118, -0.268, 0.353, 0.222, 0.281, cream);
      for (const toe of [-1, 1]) {
        layer('egg', toe * 0.101, 0.231, -0.254, 0.101, 0.199, 0.085, cream, -toe * 0.29);
        layer('ball', toe * 0.112, 0.247, -0.286, 0.055, 0.1, 0.043, '#e5a4b2', -toe * 0.29);
        layer('ball', toe * 0.082, 0.132, -0.383, 0.044, 0.051, 0.047, ink);
      }
      layer('ball', 0, 0.091, -0.403, 0.046, 0.038, 0.025, '#d2859d');
      layer('ball', 0.049, 0.016, 0.196, 0.412, 0.157, 0.265, '#e7a9b5');
      layer('ball', 0.112, 0.069, 0.268, 0.202, 0.12, 0.137, cream);
    } else if (kind === 'comet') {
      layer('box', 0, -0.068, -0.081, 0.462, 0.115, 0.601, '#4b426f');
      layer('box', 0, -0.026, -0.086, 0.469, 0.102, 0.609, '#97dfe0');
      layer('egg', 0, 0.071, -0.073, 0.462, 0.302, 0.566, '#575092');
      layer('ball', 0, 0.146, -0.244, 0.36, 0.14, 0.194, '#817bc6');
      layer('star', 0, 0.132, -0.337, 0.212, 0.21, 0.077, '#ffe584', -0.17);
      layer('egg', 0.258, 0.132, 0.185, 0.108, 0.28, 0.239, '#dc9eda', -0.42);
      layer('egg', 0.229, 0.085, 0.257, 0.108, 0.233, 0.241, '#81d4da', -0.57);
      layer('box', 0.023, -0.017, 0.186, 0.425, 0.111, 0.359, '#97dfe0');
      layer('ball', 0.092, 0.076, 0.24, 0.343, 0.181, 0.267, '#575092');
      layer('star', 0.151, 0.113, 0.345, 0.113, 0.113, 0.08, '#ffe584', 0.23);
    } else if (kind === 'cloverslippers') {
      layer('box', 0, -0.064, -0.063, 0.457, 0.107, 0.584, '#577e67');
      layer('box', 0, -0.015, -0.064, 0.462, 0.053, 0.588, '#d2e7ab');
      layer('egg', 0, 0.082, -0.074, 0.455, 0.287, 0.565, '#79ad78', -0.025);
      layer('ball', 0.012, 0.154, 0.067, 0.319, 0.111, 0.317, '#d2e7ab', 0.05);
      layer('ball', 0.019, 0.18, 0.078, 0.234, 0.089, 0.229, '#5b8762', 0.05);
      layer('ball', 0.027, 0.087, 0.176, 0.413, 0.185, 0.316, '#79ad78');
      layer('ball', 0.09, 0.104, 0.297, 0.257, 0.149, 0.098, '#83b584', 0.15);
      for (const [center, dy, dz, size, direction] of [
        [0.022, 0.152, -0.334, 1, -1],
        [0.089, 0.112, 0.334, 0.66, 1],
      ]) {
        layer(
          'ball',
          center - 0.035 * size,
          dy - 0.092 * size,
          dz,
          0.027,
          0.092 * size,
          0.045,
          '#588d67',
          -0.39,
        );
        for (const [dx, offset, tilt] of [
          [-0.064, 0.052, 0.68],
          [0.058, 0.057, -0.68],
          [-0.062, -0.041, -0.69],
          [0.056, -0.043, 0.69],
        ]) {
          const x = center + dx * size,
            y = dy + offset * size;
          layer('ball', x, y, dz, 0.113 * size, 0.134 * size, 0.067, '#588d67', tilt);
          layer(
            'ball',
            x,
            y + 0.007 * size,
            dz + direction * 0.021,
            0.086 * size,
            0.108 * size,
            0.057,
            '#9ccd8e',
            tilt,
          );
          layer(
            'ball',
            x + Math.sign(dx) * 0.015 * size,
            y + 0.018 * size,
            dz + direction * 0.046,
            0.015 * size,
            0.039 * size,
            0.016,
            '#eef3c5',
            tilt,
          );
        }
      }
      for (const dx of [-0.136, -0.084, -0.031, 0.025, 0.078, 0.131])
        layer('ball', dx, -0.008, -0.351 + dx * dx * 1.56, 0.025, 0.012, 0.014, '#eef3c5', -dx);
    }
  }

  const wingRates = { dragon: 2.65, feather: 3.55, moth: 5.3, aurora: 2.35, tulippetals: 3.15 };
  function bodyShape(roundness) {
    const fat = roundness / 100;
    const w = 1.31 + 0.65 * fat,
      h = 1.78 - 0.29 * fat,
      d = 1.08 + 0.41 * fat;
    return { w, h, d, y0: 0.1 + 0.5 * h };
  }
  function wingShoulder(a, { w, h, d, y0 }) {
    const x = 0.255,
      y = 0.135;
    const r = Math.sqrt(0.25 - y * y) * (1 - 0.32 * y);
    const mantle = a.ears === 'hedgehog' ? 0.054 : 0;
    return [w * x, y0 + h * y, d * (Math.sqrt(r * r - x * x) + mantle) - 0.036];
  }
  function wings(world, kind, shoulder, state, pose, dye) {
    const { layers, dyePalettes, restSweep } = window.FluffWings;
    const wingLayers = layers(kind);
    const wingColor = accessoryPalette(dye, dyePalettes[kind]);
    const lift = pose?.lift || 0,
      stride = pose?.stride || 0,
      twirl = pose?.twirl || 0;
    const idle = state ? (motionPreference?.matches ? 0.016 : 0.033) + 0.025 * Math.abs(stride) : 0;
    const flight = 0.172 * lift;
    const phase = (state?.time || 0) * wingRates[kind];
    const flap = idle * Math.sin(phase) + flight * Math.sin(phase * 1.64);
    const sweep = restSweep + 0.11 * lift + 0.21 * twirl - 0.45 * flap;
    const flex = 0.63 * (idle * Math.sin(phase - 1.32) + flight * Math.sin(phase * 1.64 - 1.32));
    world.gl.uniform3f(world.u.wingPose, flap, sweep, flex);
    for (const side of [-1, 1]) {
      const anchor = [side * shoulder[0], shoulder[1], shoulder[2]];
      const size = [side, 1, 1];
      for (const layer of wingLayers)
        world.drawDetail(layer.vertices, anchor, wingColor(layer.color), layer.material, size);
    }
  }

  const faceGeometry = new Map();
  const faceOrigin = [0, 0, 0];
  const embroidery = 9.75;

  function embroideredFace(a, w, h, y0, earY, surface) {
    const key = `${a.ears}/${a.face}/${a.roundness}`;
    const cached = faceGeometry.get(key);
    if (cached) return cached;
    const layers = new Map();
    const frog = a.ears === 'frog';
    const penguin = a.ears === 'penguin';
    const eyeY = frog ? earY + 0.01 : y0 + h * 0.146;
    const eyeX = w * (frog ? 0.275 * 0.94 : 0.154);
    const thread = penguin ? '#392c42' : ink;
    let followLobe = false;

    // Each stitch is a shallow ribbon or fill projected onto the fabric beneath it.
    function sewing(under, color, material, geometry) {
      const key = `${color}/${material}/${followLobe}`;
      if (!layers.has(key)) layers.set(key, { vertices: [], color, material, followLobe });
      const { vertices } = layers.get(key);
      function sample(x, y, relief) {
        const e = 0.0003;
        const gx = (under(x + e, y) - under(x - e, y)) / (2 * e);
        const gy = (under(x, y + e) - under(x, y - e)) / (2 * e);
        const n = Math.hypot(gx, gy, 1);
        const z = under(x, y) - relief;
        return [x, y, z, gx / n, gy / n, -1 / n];
      }
      const triangle = (a, b, c) => vertices.push(...a, ...b, ...c);
      geometry(sample, triangle);
    }

    function fill(under, x, y, rx, ry, color, options = {}) {
      const {
        height = 0.005,
        turn = 0,
        taper = 0,
        material = embroidery,
        rings = 4,
        edge = 0.002,
      } = options;
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      function crown(r) {
        return height * Math.max(0, 1 - r * r) ** 0.68;
      }
      function topAt(px, py) {
        const u = (c * (px - x) + s * (py - y)) / rx;
        const v = (-s * (px - x) + c * (py - y)) / ry;
        return under(px, py) - edge - crown(Math.hypot(u / (1 + taper * v), v));
      }
      sewing(topAt, color, material, (sample, triangle) => {
        const steps = Math.max(rx, ry) < 0.032 ? 16 : 32;
        function row(radial) {
          return Array.from({ length: steps }, (_, i) => {
            const angle = (i * 2 * Math.PI) / steps;
            const v = radial * Math.sin(angle);
            const dx = radial * rx * Math.cos(angle) * (1 + taper * v);
            const dy = v * ry;
            return sample(x + c * dx - s * dy, y + s * dx + c * dy, 0);
          });
        }
        const center = sample(x, y, 0);
        let previous = row(1 / rings);
        for (let i = 0; i < steps; i++) triangle(center, previous[(i + 1) % steps], previous[i]);
        for (let ring = 2; ring <= rings; ring++) {
          const next = row(ring / rings);
          for (let i = 0; i < steps; i++) {
            const j = (i + 1) % steps;
            triangle(previous[i], previous[j], next[j]);
            triangle(previous[i], next[j], next[i]);
          }
          previous = next;
        }
      });
      return topAt;
    }

    function stroke(under, color, width, path) {
      sewing(under, color, embroidery, (sample, triangle) => {
        function row(step) {
          const t = step / 22;
          const [x, y] = path(t);
          const [ax, ay] = path(Math.max(0, t - 0.009));
          const [bx, by] = path(Math.min(1, t + 0.009));
          const length = Math.hypot(bx - ax, by - ay);
          const cap = Math.sqrt(Math.min(1, t * 15, (1 - t) * 15));
          return [-1, -0.56, 0, 0.56, 1].map((v) => {
            const offset = (v * width * cap) / 2;
            const relief = 0.002 + 0.0045 * cap * Math.sqrt(1 - v * v);
            return sample(x - ((by - ay) / length) * offset, y + ((bx - ax) / length) * offset, relief);
          });
        }
        let previous = row(0);
        for (let i = 1; i <= 22; i++) {
          const next = row(i);
          for (let j = 0; j < next.length - 1; j++) {
            if (i > 1) triangle(previous[j], previous[j + 1], next[j + 1]);
            if (i < 22) triangle(previous[j], next[j + 1], next[j]);
          }
          previous = next;
        }
      });
    }

    function bow(under, color, x, y, width, height, thickness) {
      stroke(under, color, thickness, (t) => [
        x + (t - 0.5) * width,
        y + Math.sin(Math.PI * t) * height,
      ]);
    }

    let face = surface;
    if (a.ears === 'dog')
      face = fill(surface, -eyeX * 1.045, eyeY - 0.014, w * 0.09, h * 0.082, 'dark', {
        height: 0.004,
        turn: -0.27,
        material: -1,
      });

    for (const side of [-1, 1]) {
      const x = side * eyeX;
      // The lobe moves with the ear spring. Its stitching uses the same translation at draw time.
      const lobe = (px, py) => {
        const r2 = ((px - x) / 0.21) ** 2 + ((py - (earY - 0.02)) / 0.21) ** 2;
        return -0.14 - 0.18 * Math.sqrt(Math.max(0.0001, 1 - r2));
      };
      const cloth = frog ? lobe : side < 0 ? face : surface;
      followLobe = frog;
      const wink = side === 1 && (a.face === 'wink' || a.face === 'tongue');
      if (wink || a.face === 'happy' || a.face === 'dreamy') {
        const dreamy = a.face === 'dreamy';
        const width = penguin ? 0.183 : frog ? 0.149 : 0.164;
        const lidY = eyeY - (dreamy ? 0 : 0.019);
        bow(cloth, 'eye', x, lidY, width, dreamy ? -0.023 : 0.042, penguin ? 0.032 : 0.026);
        if (wink)
          stroke(cloth, 'eye', 0.018, (t) => [
            x + width * (0.422 + 0.235 * t),
            lidY + 0.009 - 0.017 * Math.sin(t * Math.PI) + 0.011 * t,
          ]);
      } else {
        const wideOpen = a.face === 'amazed';
        const top = fill(cloth, x, eyeY, frog ? 0.061 : 0.068, wideOpen ? 0.091 : 0.076, 'eye', {
          turn: side * 0.06,
        });
        fill(top, x - 0.022, eyeY + 0.029, 0.018, 0.023, '#fff5e4', { height: 0.002, turn: -0.3 });
        fill(top, x + 0.024, eyeY - 0.027, 0.0075, 0.008, '#bbaaaf', { height: 0.001 });
      }
      followLobe = false;
      const cheekX = side * w * (frog ? 0.237 : 0.228);
      const cheekY = y0 + h * (frog ? 0.208 : 0.09);
      fill(surface, cheekX, cheekY, penguin ? 0.073 : 0.065, 0.032, blush, {
        turn: side * 0.11,
        height: 0.002,
      });
      if (a.ears === 'cat') {
        stroke(surface, thread, 0.016, (t) => [
          cheekX + side * (0.068 + 0.112 * t),
          cheekY + 0.018 + t * (0.049 - 0.018 * t),
        ]);
        stroke(surface, thread, 0.014, (t) => [
          cheekX + side * (0.066 + 0.091 * t),
          cheekY - 0.018 - t * (0.017 + 0.016 * t),
        ]);
      }
    }

    const mouthY = y0 + h * (frog ? 0.164 : 0.085);
    if (penguin) {
      const y = mouthY + 0.012;
      const bill = fill(surface, 0, y, 0.127, 0.066, '#efab57', {
        height: 0.096,
        taper: 0.24,
        material: -1,
        edge: 0.001,
        rings: 13,
      });
      if (a.face === 'amazed') {
        fill(bill, 0, y - 0.014, 0.042, 0.034, '#854e45', { height: 0.002 });
      } else if (a.face === 'tongue') {
        const opening = fill(bill, 0.013, y - 0.012, 0.063, 0.028, '#854e45', { height: 0.002 });
        fill(opening, 0.03, y - 0.026, 0.029, 0.017, '#dc8992', { height: 0.002 });
      } else {
        const sleepy = a.face === 'dreamy';
        const seamY = y + (sleepy ? -0.005 : 0.015);
        bow(bill, '#996144', 0, seamY, sleepy ? 0.089 : 0.194, sleepy ? -0.006 : -0.031, 0.02);
      }
    } else if (a.face === 'amazed') {
      fill(surface, 0, mouthY - 0.008, 0.045, 0.056, thread);
    } else if (a.face === 'dreamy') {
      bow(surface, thread, 0, mouthY, 0.112, -0.012, 0.023);
    } else if (a.face === 'tongue') {
      const opening = fill(surface, 0, mouthY - 0.01, frog ? 0.096 : 0.077, 0.045, thread, {
        taper: 0.37,
      });
      fill(opening, 0.014, mouthY - 0.036, 0.033, 0.024, '#da8199', { turn: -0.19, height: 0.002 });
    } else if (a.face === 'happy' || a.face === 'wink' || frog) {
      bow(surface, thread, 0, mouthY + 0.018, frog ? 0.255 : 0.208, -0.054, 0.027);
    } else {
      for (const side of [-1, 1])
        stroke(surface, thread, 0.024, (t) => [
          side * t * 0.094,
          mouthY - 0.024 * Math.sin(Math.PI * t) + 0.01 * t,
        ]);
      fill(surface, 0, mouthY, 0.011, 0.011, thread, { height: 0.002 });
    }

    const noseLift = a.face === 'amazed' ? 0.03 : 0;
    if (a.ears === 'fox') {
      fill(surface, 0, mouthY + 0.061 + noseLift, 0.047, 0.03, thread, { taper: 0.36 });
      for (const side of [-1, 1])
        fill(surface, side * w * 0.25, y0 + h * 0.126, 0.055, 0.018, cream, {
          turn: side * 0.43,
          material: -1,
          height: 0.002,
        });
    }
    if (a.ears === 'dog' || a.ears === 'hedgehog') {
      const y = mouthY + 0.067 + noseLift;
      const muzzle = fill(surface, 0, y + 0.015, a.ears === 'dog' ? 0.148 : 0.121, 0.051, cream, {
        height: 0.032,
        material: -1,
        rings: 9,
      });
      const nose = fill(muzzle, 0, y + 0.018, a.ears === 'dog' ? 0.068 : 0.056, 0.032, thread, {
        taper: 0.32,
      });
      fill(nose, -0.017, y + 0.03, 0.017, 0.006, '#c08e97', { turn: 0.2, height: 0.002 });
    } else if (a.ears === 'deer') {
      fill(surface, 0, mouthY + 0.062 + noseLift, 0.045, 0.027, thread, { taper: 0.31 });
      for (const side of [-1, 1]) {
        for (const [px, py, rx, ry] of [
          [0.104, 0.241, 0.032, 0.019],
          [0.177, 0.21, 0.019, 0.014],
          [0.244, 0.178, 0.022, 0.014],
        ])
          fill(surface, side * w * px, y0 + h * py, rx, ry, cream, { material: -1, height: 0.001 });
      }
    }
    if (a.ears === 'cat') {
      for (const i of [-1, 0, 1]) {
        const x = i * w * 0.059;
        const y = y0 + h * (i === 0 ? 0.403 : 0.385);
        stroke(surface, 'dark', 0.032, (t) => [x + i * 0.016 * t, y + 0.038 - 0.089 * t]);
      }
    }
    const meshes = Array.from(layers.values(), (layer) => ({
      ...layer,
      vertices: new Float32Array(layer.vertices),
    }));
    if (faceGeometry.size >= 24) faceGeometry.delete(faceGeometry.keys().next().value);
    faceGeometry.set(key, meshes);
    return meshes;
  }

  function model(world, a, state = null, pose = null) {
    const earSway = pose?.ear || 0,
      tailSway = pose?.tail || 0;
    const body = bodyShape(a.roundness);
    const { w, h, d, y0 } = body;
    const top = y0 + h * 0.5,
      fur = colors[a.color][1];
    const dark = tinted(fur, '#614b72', 0.34),
      light = tinted(fur, '#fff4e3', 0.27);
    const speciesInk = tinted(fur, '#493b55', 0.79);
    const penguin = a.ears === 'penguin',
      dog = a.ears === 'dog',
      deer = a.ears === 'deer',
      hedgehog = a.ears === 'hedgehog';
    const part = (mesh, x, y, z, sx, sy, sz, color, rot = 0, mat = -1) =>
      world.draw(mesh, [x, y, z], [sx, sy, sz], color, rot, mat);
    const oval = (x, y, z, sx, sy, sz, color, angle = 0) =>
      part('ball', x, y, z, sx, sy, sz, color, angle);
    function surface(x, y) {
      const v = (y - y0) / h,
        radius = Math.sqrt(Math.max(0.001, 0.25 - v * v)) * (1 - 0.32 * v);
      return -d * Math.sqrt(Math.max(0.0001, radius * radius - (x / w) ** 2));
    }
    function button(x, y, sx, sy, color, zLift = 0.018) {
      oval(x, y, surface(x, y) - zLift, sx, sy, 0.052, color);
    }
    function stitch(points, color, thickness) {
      for (let i = 1; i < points.length; i++) {
        const [x0, yA] = points[i - 1],
          [x1, yB] = points[i],
          dx = x1 - x0,
          dy = yB - yA;
        const x = (x0 + x1) / 2,
          y = (yA + yB) / 2;
        oval(
          x,
          y,
          surface(x, y) - 0.028,
          thickness,
          Math.hypot(dx, dy) + thickness * 0.76,
          thickness,
          color,
          -Math.atan2(dx, dy),
        );
      }
    }
    // A cream studio plinth and its contact shadow make the silhouette readable from any angle.
    if (!state) {
      const shod = a.shoes && a.shoes !== 'none';
      world.gl.uniform2f(
        world.u.studioFeet,
        (w * (shod ? 0.322 : 0.253)) / 2.28,
        (shod ? -0.06 : -d * 0.19) / 1.88,
      );
      part('cushion', 0, 0.003, 0, 2.32, 0.13, 1.91, '#dfcce0', 0, 0);
      part('cushion', 0, 0.041, 0, 2.28, 0.103, 1.88, '#fcf0df', 0, -3);
    }
    const earX = w * 0.275,
      earY = top - h * 0.07;
    if (a.wings && a.wings !== 'none')
      wings(world, a.wings, wingShoulder(a, body), state, pose, a.wingsDye);
    for (const side of [-1, 1]) {
      const x = side * earX - earSway * 0.052;
      if (a.ears === 'cat' || a.ears === 'fox') {
        const fox = a.ears === 'fox';
        const hatted = a.hat && a.hat !== 'none';
        const earCenter = x + side * w * (hatted ? 0.025 : 0);
        const rootY = earY + (fox ? 0.014 : -0.022);
        const rootZ = -d * (fox ? 0.009 : 0.028);
        const width = side * (fox ? 0.397 : 0.435),
          height = fox ? 0.65 : 0.53,
          depth = fox ? 0.275 : 0.255;
        const tilt = -side * (fox ? 0.28 : 0.21) + earSway * 0.48;
        part('sewn-ear', earCenter, rootY, rootZ, width, height, depth, fox ? speciesInk : fur, tilt);
        part(
          'ear-lining',
          earCenter,
          rootY,
          rootZ,
          width,
          height,
          depth,
          fox ? cream : '#df9caf',
          tilt,
        );
        part(
          'ear-stitches',
          earCenter,
          rootY,
          rootZ,
          width,
          height,
          depth,
          fox ? '#b68275' : light,
          tilt,
        );
      } else if (a.ears === 'bunny') {
        oval(
          x * 0.82 - earSway * 0.13,
          earY + 0.23,
          0.05,
          0.285,
          0.73,
          0.24,
          fur,
          -side * 0.15 + earSway,
        );
        oval(
          x * 0.82 + side * 0.008 - earSway * 0.13,
          earY + 0.257,
          -0.049,
          0.144,
          0.51,
          0.067,
          '#e8b6c3',
          -side * 0.15 + earSway,
        );
      } else if (a.ears === 'bear') {
        oval(x, earY, 0, 0.42, 0.41, 0.29, fur);
        oval(x, earY + 0.024, -0.115, 0.239, 0.235, 0.078, cream);
      } else if (a.ears === 'frog') {
        oval(x * 0.94, earY - 0.02, -0.14, 0.42, 0.42, 0.36, fur);
      } else if (dog) {
        const baseX = side * w * 0.392 - earSway * 0.08;
        const droop = side * 0.32 + earSway;
        part('egg', baseX, earY - 0.26, -0.028, 0.338, 0.735, 0.273, speciesInk, droop);
        oval(baseX + side * 0.045, earY - 0.324, -0.139, 0.181, 0.449, 0.075, dark, droop);
      } else if (deer) {
        const branchX = side * w * 0.265;
        const branchY = earY + 0.066;
        const antler = '#9e715b';
        for (const [fromX, fromY, toX, toY] of [
          [-0.04, -0.11, 0.017, 0.133],
          [0.017, 0.133, 0.112, 0.33],
          [0.112, 0.33, 0.125, 0.441],
          [0.04, 0.18, -0.061, 0.29],
          [0.088, 0.277, 0.23, 0.345],
        ])
          seam(
            part,
            branchX + side * fromX,
            branchY + fromY,
            branchX + side * toX,
            branchY + toY,
            0.038,
            0.062,
            antler,
          );
        part(
          'egg',
          side * w * 0.335,
          earY - 0.073,
          -0.022,
          0.267,
          0.46,
          0.213,
          dark,
          -side * 0.96 + earSway,
        );
        oval(
          side * w * 0.358,
          earY - 0.059,
          -0.104,
          0.153,
          0.296,
          0.092,
          '#efc8af',
          -side * 0.96 + earSway,
        );
      } else if (hedgehog) {
        const earX = x * 0.99,
          earZ = -d * 0.127,
          tilt = -side * 0.34;
        oval(earX, earY - 0.107, earZ, 0.253, 0.281, 0.175, dark, tilt);
        oval(earX + side * 0.016, earY - 0.086, earZ - 0.064, 0.144, 0.162, 0.074, '#e9b19f', tilt);
      } else if (a.ears === 'axolotl') {
        for (const [level, angle] of [
          [0, 0.82],
          [1, 1.39],
          [2, 2.03],
        ]) {
          const baseX = side * w * (0.355 + level * 0.019),
            baseY = top - h * (0.18 + level * 0.071);
          oval(baseX + side * 0.12, baseY, -0.005, 0.162, 0.52, 0.15, blush, -side * angle);
          for (const j of [-1, 1])
            oval(
              baseX + side * 0.225,
              baseY + j * 0.052,
              -0.012,
              0.085,
              0.15,
              0.08,
              '#f5bac5',
              -side * (angle + j * 0.45),
            );
        }
      }
    }
    const outfitIndex = ['none', 'denim', 'scarf', 'coat', 'cape', 'aviator'].indexOf(a.outfit);
    world.gl.uniform1f(world.u.garment, outfitIndex);
    const dye = dyes[a.dye] || originalDyes[a.outfit];
    const palette = outfitPalette(dye);
    world.gl.uniform3fv(world.u.clothTint, palette.rgb);
    if (hedgehog) {
      const mantle = a.hat && a.hat !== 'none' ? -6.5 : -6;
      part('quill-cap', 0, y0, 0, w, h, d, tinted(fur, '#74534f', 0.86), 0, mantle);
      for (const [i, quill] of ['#775650', '#866359', '#917064'].entries())
        part(`quills-${i}`, 0, y0, 0, w, h, d, tinted(fur, quill, 0.76), 0, mantle);
    }
    part('egg', 0, y0, 0, w, h, d, penguin ? speciesInk : fur, 0, penguin ? 3.25 : 3);
    if (hedgehog && outfitIndex > 0 && a.outfit !== 'scarf' && a.outfit !== 'cape')
      part('egg', 0, y0, 0, w, h, d, fur, 0, 3.4);
    if (outfitIndex > 0) {
      if (a.outfit === 'scarf') {
        const swing = (pose?.stride || 0) * 0.031 + (pose?.twirl || 0) * 0.018;
        world.gl.uniform2f(
          world.u.scarfSwing,
          swing,
          Math.abs(swing) * 0.55 + (pose?.lift || 0) * 0.024,
        );
      }
      const center = [0, y0, 0],
        size = [w, h, d];
      for (const layer of window.FluffOutfits.pattern(a.outfit, hedgehog))
        world.drawDetail(layer.vertices, center, palette[layer.color], layer.material, size);
    }
    // Tail and paws have real depth, including the portions behind the body.
    if (a.ears === 'cat' || a.ears === 'fox') {
      const fox = a.ears === 'fox';
      part(
        'ear',
        -w * 0.32 - tailSway * 0.095,
        y0 - 0.03,
        d * 0.39,
        0.35,
        fox ? 0.83 : 0.73,
        0.33,
        fox ? fur : dark,
        -0.62 + tailSway,
      );
      if (fox)
        part(
          'ear',
          -w * 0.32 + 0.15 - tailSway * 0.3,
          y0 + 0.23,
          d * 0.39,
          0.22,
          0.33,
          0.22,
          cream,
          -0.62 + tailSway,
        );
    } else if (a.ears === 'bunny' || a.ears === 'bear')
      oval(
        0,
        y0 - 0.33,
        d * (a.outfit === 'cape' ? 0.493 : 0.43),
        0.34,
        0.32,
        0.31,
        a.ears === 'bunny' ? cream : fur,
      );
    else if (a.ears === 'axolotl') part('ear', 0, y0 - 0.19, d * 0.49, 0.24, 0.5, 0.58, light, 0.45);
    else if (dog || deer)
      part(
        'ear',
        -w * 0.185,
        y0 - h * 0.174,
        d * 0.52,
        0.216,
        dog ? 0.567 : 0.331,
        0.199,
        dog ? speciesInk : cream,
        -0.49 + tailSway,
      );
    const stride = pose?.stride || 0;
    const hop = pose ? 0.13 * pose.lift + 0.038 * pose.spring : 0;
    const shoeColor = accessoryPalette(a.shoesDye, accessoryPalettes.shoes[a.shoes]);
    for (const side of [-1, 1]) {
      const footX = side * w * 0.253,
        footY = 0.177 + Math.max(0, side * stride * 0.105) + hop,
        footZ = -d * 0.19 + side * stride * 0.1055;
      // Keep the colored heels visible from the high follow camera as the feet move.
      if (a.shoes && a.shoes !== 'none')
        shoe(part, a.shoes, footX + side * w * 0.069, footY, footZ + d * 0.206, side, shoeColor);
      else oval(footX, footY, footZ, 0.37, 0.213, 0.43, penguin ? '#eab065' : light, side * 0.06);
      const raised = side === 1 && a.item !== 'none';
      const armX = side * w * 0.474;
      const armY = y0 - (raised ? 0.1 : 0.16) + hop;
      const armZ = (raised ? -d * 0.18 : -0.03) - side * stride * 0.105;
      const angle = side * ((raised ? -0.7 : 0.33) - hop * 3);
      const armHeight = penguin ? 0.61 : 0.49;
      const armWidth = penguin ? 0.232 : 0.245;
      oval(armX, armY, armZ, armWidth, armHeight, 0.267, penguin ? speciesInk : fur, angle);
      if (a.outfit === 'coat' || a.outfit === 'aviator') {
        const shearling = a.outfit === 'aviator';
        const segment = (offset, width, height, depth, color, material) => {
          part(
            'ball',
            armX - Math.sin(angle) * offset,
            armY + Math.cos(angle) * offset,
            armZ,
            width,
            height,
            depth,
            color,
            angle,
            material,
          );
        };
        segment(0.027, armWidth * 1.105, armHeight * 0.83, 0.292, dye, -9);
        segment(
          -armHeight * 0.2,
          armWidth * 1.018,
          0.072,
          0.278,
          shearling ? palette.wool : palette.light,
          shearling ? -1 : -9,
        );
      }
    }
    const lobeOrigin = a.ears === 'frog' && earSway ? [-earSway * 0.052 * 0.94, 0, 0] : faceOrigin;
    const originalEye = a.ears === 'penguin' ? '#392c42' : ink;
    const eye =
      a.eyeColor === 'classic'
        ? originalEye
        : (window.FluffLooks.eyeColors[a.eyeColor]?.[1] ?? originalEye);
    for (const layer of embroideredFace(a, w, h, y0, earY, surface))
      world.drawDetail(
        layer.vertices,
        layer.followLobe ? lobeOrigin : faceOrigin,
        layer.color === 'eye' ? eye : layer.color === 'dark' ? dark : layer.color,
        layer.material,
      );
    if (a.outfit === 'denim')
      for (const side of [-1, 1])
        button(side * w * 0.182, y0 - h * 0.056, 0.053, 0.056, '#edcd85', 0.021);
    if (a.outfit === 'coat')
      for (const v of [-0.09, -0.19, -0.29]) button(0, y0 + h * v, 0.036, 0.036, '#a47c4e', 0.021);
    if (a.outfit === 'cape') {
      const claspY = y0 - h * 0.049;
      button(0, claspY, 0.136, 0.069, '#ab7749');
      part('star', 0, claspY, surface(0, claspY) - 0.046, 0.086, 0.086, 0.036, '#f6d78c');
      for (const [column, row, size, angle] of [
        [-0.178, 0.03, 0.122, -0.16],
        [0.161, 0.026, 0.136, 0.14],
        [0.018, -0.086, 0.192, -0.08],
        [-0.176, -0.193, 0.105, 0.13],
        [0.19, -0.206, 0.093, -0.16],
        [0.03, -0.284, 0.11, 0.11],
      ]) {
        const [x, v, z] = window.FluffOutfits.capeStar(column, row, hedgehog);
        part('star', x * w, y0 + v * h, z * d + 0.017, size, size, 0.082, '#ecc375', angle);
      }
    } else if (a.outfit === 'aviator') {
      button(0, y0 - h * 0.1, 0.047, 0.091, '#c9985a', 0.03);
      button(-w * 0.173, y0 - h * 0.126, 0.154, 0.064, '#6e5242');
      button(-w * 0.173, y0 - h * 0.126, 0.131, 0.036, '#e4be80', 0.051);
      for (const side of [-1, 1])
        stitch(
          [
            [side * w * 0.19, y0 - h * 0.244],
            [side * w * 0.249, y0 - h * 0.219],
          ],
          '#cc9b71',
          0.021,
        );
    }
    const hasFrontClosure = a.outfit === 'coat' || a.outfit === 'aviator';
    const patchY = y0 - h * 0.18,
      patchX = hasFrontClosure ? w * 0.13 : 0;
    const patchSurface = surface(patchX, patchY);
    const patchZ = patchSurface - (a.outfit === 'denim' ? 0.032 * d + 0.019 : 0.025),
      patchScale = hasFrontClosure ? 0.73 : 1;
    const patchColor = accessoryPalette(a.patchDye, accessoryPalettes.patch[a.patch]);
    const placePatch =
      (followSurface) =>
      (mesh, x, y, z, width, height, depth, color, rot = 0) => {
        const px = patchX + x * patchScale;
        const py = patchY + y * patchScale;
        const bend = followSurface ? surface(px, py) - patchSurface : 0;
        part(
          mesh,
          px,
          py,
          patchZ + bend + z * patchScale,
          width * patchScale,
          height * patchScale,
          depth * patchScale,
          patchColor(color),
          rot,
        );
      };
    const patch = placePatch(false);
    if (a.patch === 'heart') {
      patch('ball', -0.036, 0.004, 0, 0.1, 0.173, 0.049, '#d98399', 0.61);
      patch('ball', 0.036, 0.004, -0.003, 0.1, 0.173, 0.049, '#d98399', -0.61);
    } else if (a.patch === 'star') patch('star', 0, 0, 0, 0.247, 0.247, 0.072, '#e8b65b', -0.1);
    else if (a.patch === 'rainbow') {
      ['#db91a7', '#eab674', '#92c6ad'].forEach((color, i) =>
        patch('arch', 0, -0.051, -i * 0.004, 0.27 - i * 0.052, 0.27 - i * 0.052, 0.29, color),
      );
      for (const side of [-1, 1])
        patch('ball', side * 0.108, -0.049, -0.003, 0.087, 0.049, 0.047, cream);
    } else if (a.patch === 'cherries') {
      for (const side of [-1, 1]) {
        patch('ball', side * 0.058, -0.029, 0, 0.097, 0.099, 0.051, '#c86b82');
        patch('ball', side * 0.033, 0.044, 0.003, 0.019, 0.117, 0.035, '#779974', -side * 0.5);
      }
      patch('ball', 0.031, 0.086, 0, 0.098, 0.038, 0.038, '#97b481', 0.3);
    } else if (a.patch !== 'none') {
      bellyDecoration(placePatch(true), a.patch);
    }
    headAccessories(world, part, a, top, w, h, d, surface);
    const itemX =
      a.item === 'bee' || a.item === 'moonlantern' || a.item === 'lagoonlantern' ? 0.565 : 0.523;
    heldItem(world, a.item, [w * itemX, y0 - 0.091 + hop, -d * 0.29 - stride * 0.105], 1, a.itemDye);
  }

  function bellyDecoration(part, kind) {
    if (kind === 'sun') {
      for (let i = 0; i < 8; i++) {
        const ray = (i * Math.PI) / 4;
        part(
          'ball',
          Math.sin(ray) * 0.125,
          Math.cos(ray) * 0.125,
          0,
          0.034,
          0.057,
          0.035,
          '#e2a65f',
          -ray,
        );
      }
      part('ball', 0, 0, 0, 0.189, 0.189, 0.051, '#e6a952');
      part('ball', 0, 0.002, -0.016, 0.157, 0.157, 0.042, '#f3c969');
      part('ball', -0.034, 0.036, -0.034, 0.048, 0.025, 0.015, '#fff0ac', 0.46);
    } else if (kind === 'cloud') {
      part('ball', 0, -0.025, 0, 0.299, 0.108, 0.062, '#a3c3d7');
      part('ball', -0.084, 0.016, -0.012, 0.118, 0.11, 0.055, '#d3e9ee');
      part('ball', 0.016, 0.04, -0.019, 0.162, 0.146, 0.069, '#e8f3ee');
      part('ball', 0.104, -0.011, -0.015, 0.096, 0.092, 0.06, '#d3e9ee');
      part('ball', 0, -0.024, -0.026, 0.248, 0.081, 0.044, '#d6e8ed');
      for (const x of [-0.055, 0.045])
        part('ear', x, -0.108, 0.001, 0.035, 0.061, 0.033, '#81b7d2', -0.35);
    } else if (kind === 'strawberry') {
      strawberry(part);
    } else if (kind === 'daisy') {
      for (let i = 0; i < 8; i++) {
        const petal = (i * Math.PI) / 4;
        part(
          'ball',
          Math.sin(petal) * 0.084,
          Math.cos(petal) * 0.084,
          0,
          0.048,
          0.13,
          0.043,
          '#fff4dc',
          -petal,
        );
      }
      part('ball', 0, 0, -0.024, 0.111, 0.111, 0.058, '#e2aa55');
      part('ball', -0.016, 0.017, -0.048, 0.042, 0.031, 0.019, '#f8d278', 0.44);
    }
  }

  function getStudio() {
    if (!studio) {
      const canvas = document.createElement('canvas');
      const world = new window.FluffWorld(canvas);
      studio = { canvas, world };
    }
    return studio;
  }
  function render(a, theta, size, tilt = 0.1) {
    const { canvas, world } = getStudio(),
      { gl, u } = world;
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = canvas.height = size;
      gl.viewport(0, 0, size, size);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const st = Math.sin(theta),
      ct = Math.cos(theta),
      sp = Math.sin(tilt),
      cp = Math.cos(tilt);
    const tall = a.ears === 'bunny' || a.ears === 'deer' || (a.hat && a.hat !== 'none');
    const targetY = tall ? 1.13 : 1.01;
    const distance = tall ? 4.85 : 4.5;
    gl.uniform3fv(u.camera, [distance * st * cp, targetY + distance * sp, -distance * ct * cp]);
    gl.uniform3fv(u.rightDir, [ct, 0, st]);
    gl.uniform3fv(u.upDir, [-st * sp, cp, ct * sp]);
    gl.uniform3fv(u.forwardDir, [-st * cp, -sp, ct * cp]);
    let lens = 3.4;
    if (a.item === 'balloon' || a.item === 'scope') lens = 3.0;
    if (a.item === 'bee' || a.item === 'moonlantern') lens = 2.75;
    if (a.item === 'lagoonlantern') lens = 3.0;
    if (a.wings && a.wings !== 'none') {
      const shoulder = wingShoulder(a, bodyShape(a.roundness));
      lens = Math.min(lens, window.FluffWings.previewLens(a.wings, shoulder, targetY, distance));
    }
    gl.uniform2f(u.lens, lens, lens);
    gl.uniform3fv(u.fog, [0.94, 0.9, 0.94]);
    model(world, a);
    return canvas;
  }
  function portrait(a) {
    const key = JSON.stringify(a);
    if (!cache.has(key)) {
      if (cache.size >= 120) cache.delete(cache.keys().next().value);
      cache.set(key, render(a, 0.085, 138).toDataURL('image/png'));
    }
    return cache.get(key);
  }
  function description(a) {
    return [
      colors[a.color][0],
      choices.ears[a.ears],
      choices.face[a.face],
      ...(a.eyeColor && a.eyeColor !== 'classic'
        ? ['Silmien väri ' + choices.eyeColor[a.eyeColor][0]]
        : []),
      ...['outfit', 'head', 'hat', 'patch', 'shoes', 'wings', 'item']
        .filter((k) => a[k] && a[k] !== 'none')
        .map((k) => {
          const shade = a[k === 'outfit' ? 'dye' : k + 'Dye'];
          return (
            choices[k][a[k]] + (shade && shade !== 'classic' ? ' (' + choices.dye[shade] + ')' : '')
          );
        }),
    ].join(', ');
  }
  window.FluffPlush = { render, portrait, description, forepaws, heldItem, model, motion };
})();
