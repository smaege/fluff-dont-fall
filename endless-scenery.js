(() => {
  'use strict';

  const balloonPalettes = [
    ['#eaa29b', '#fff0d9', '#f6c1ac'],
    ['#f3bd9f', '#fff5e4', '#e99e95'],
    ['#edb9ab', '#ffe8ca', '#f6d1bd'],
  ];
  const cloudColors = ['#fff5e4', '#ffe1cd', '#f2e2fa', '#dcefff'];

  window.FluffSkySector = (seed, sector) => {
    const props = [];
    const balloons = [];
    let state = 2166136261;
    const key = JSON.stringify([seed, sector]);
    for (let index = 0; index < key.length; index++) {
      state = Math.imul(state ^ key.charCodeAt(index), 16777619);
    }
    function random() {
      state = (state + 0x6d2b79f5) >>> 0;
      let bits = Math.imul(state ^ (state >>> 15), state | 1);
      bits ^= bits + Math.imul(bits ^ (bits >>> 7), bits | 61);
      return ((bits ^ (bits >>> 14)) >>> 0) / 4294967296;
    }
    const add = (mesh, p, s, c, rot = 0, mat = 0) => {
      props.push({ mesh, p, s, c, rot, mat });
    };

    const firstSide = random() < 0.5 ? -1 : 1;
    for (const side of [firstSide, -firstSide]) {
      const first = side === firstSide;
      const z = first ? 29 + random() * 5 : 34 + random() * 7;
      balloons.push({
        x: side * (first ? 5 + random() * 2 : 9 + random() * 8),
        y: first ? 7.8 + random() * 1.3 : 8.2 + random() * 2.2,
        z,
        scale: 0.98 + random() * 0.36,
        colors: balloonPalettes[Math.floor(random() * balloonPalettes.length)],
        phase: z * 1.71 + side * 1.4,
      });
    }

    const bankCount = 3 + Math.floor(random() * 2);
    for (let index = 0; index < bankCount; index++) {
      const side = index % 2 ? -firstSide : firstSide;
      const lane = (index + 0.5) / bankCount;
      add(
        'cloud',
        [side * (4 + random() * 20), -8 - random() * 4, 6 + 28 * lane + (random() - 0.5) * 4],
        [12 + random() * 12, 3 + random() * 4, 8 + random() * 6],
        cloudColors[Math.floor(random() * cloudColors.length)],
      );
    }
    for (const side of [firstSide, -firstSide]) {
      const z = side === firstSide ? 5 + random() * 12 : 22 + random() * 12;
      add(
        'cloud',
        [side * (16 + random() * 15), 2 + random() * 7, z],
        [6 + random() * 8, 3 + random() * 4, 4 + random() * 5],
        cloudColors[Math.floor(random() * cloudColors.length)],
      );
    }
    return { props, balloons };
  };
})();
