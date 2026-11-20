(() => {
  'use strict';

  const roseColors = [
    ['#ca5986', '#ec7da1', '#ffa3ba', '#cc567f'],
    ['#d7769c', '#f5a3bb', '#ffc2c7', '#d97694'],
    ['#be527e', '#e573a1', '#f691ad', '#ba5079'],
  ];
  const blueRose = ['#526fb9', '#7c9dea', '#9bc4fa', '#577ac9'];
  const meadowColors = [
    ['#658e50', '#91be59', '#bddf79', '#dfed9c'],
    ['#4b9365', '#73bf83', '#9ddb98', '#bce8a5'],
    ['#4e9b6a', '#7bc895', '#a7dfa6', '#d4eda5'],
  ];
  const towerColors = [
    ['#6d4aab', '#a37bd6', '#c5a0ea', '#e1b8f4'],
    ['#674b9f', '#8e78d1', '#b8a1ee', '#d6c3f7'],
    ['#7d4b9a', '#af78c7', '#ce98e0', '#f0baf1'],
  ];

  function rose(add, x, y, z, scale, colors, phase) {
    add('ball', [x, y, z], [1.86 * scale, 1.71 * scale, 1.33 * scale], colors[0]);
    // Each new petal moves inward and forward, leaving the darker folds exposed.
    for (const [i, radius, depth, width, height] of [
      [0, 0.52, 0.43, 1.3, 0.77],
      [1, 0.49, 0.49, 1.22, 0.74],
      [2, 0.45, 0.55, 1.12, 0.72],
      [3, 0.33, 0.61, 0.91, 0.57],
      [4, 0.22, 0.67, 0.76, 0.49],
      [5, 0.1, 0.72, 0.56, 0.38],
    ]) {
      const angle = phase + i * 1.83;
      add(
        'ball',
        [x + Math.cos(angle) * radius * scale, y + Math.sin(angle) * radius * scale, z - depth * scale],
        [width * scale, height * scale, 0.48 * scale],
        colors[i === 5 ? 3 : 1 + (i % 2)],
        angle + 1.13,
      );
    }
  }

  function tulip(add, x, y, z, scale, colors) {
    // The two raised outer petals leave a shallow notch in the lip of the cup.
    add('ball', [x, y + 0.4 * scale, z], [1.25 * scale, 1.03 * scale, 1.14 * scale], colors[0]);
    add(
      'ball',
      [x, y + 0.94 * scale, z + 0.24 * scale],
      [0.89 * scale, 1.26 * scale, 0.91 * scale],
      colors[1],
    );
    for (const side of [-1, 1]) {
      add(
        'ball',
        [x + side * 0.39 * scale, y + 0.88 * scale, z - 0.06 * scale],
        [0.76 * scale, 1.46 * scale, 1.18 * scale],
        colors[side === -1 ? 2 : 1],
        -side * 0.32,
      );
    }
    add(
      'ball',
      [x - 0.04 * scale, y + 0.61 * scale, z - 0.47 * scale],
      [0.82 * scale, 1.17 * scale, 0.61 * scale],
      colors[3],
      0.13,
    );
  }

  function bulbPlant(add, x, y, z, height, bloom, colors, stalk) {
    add('ball', [x, y + height * 0.52, z], [0.28 * bloom, height * 1.14, 0.36 * bloom], stalk[0]);
    for (const side of [-1, 1]) {
      add(
        'ball',
        [x + side * 0.43 * bloom, y + height * (side < 0 ? 0.32 : 0.48), z - side * 0.17 * bloom],
        [0.52 * bloom, height * 0.67, 0.22 * bloom],
        stalk[1],
        -side * 0.43,
      );
    }
    tulip(add, x, y + height, z, bloom, colors);
  }

  function roseGarden(add, { x, y, z, side, index }, random) {
    const width = 6.6 + random() * 0.7;
    const ground = y - 2.55;
    const spring = ground + 2.65;
    add('ball', [x + side * 1.2, ground - 1.1, z + 0.8], [11.8, 2.7, 10.4], '#d58da5');
    add('ball', [x + side * 1.1, ground - 0.34, z + 1], [11.3, 1.15, 9.8], '#efb7c2');
    add('ball', [x + side * 3.1, ground + 0.22, z + 3], [6.3, 1.7, 4.2], '#f28faa');
    for (const support of [-1, 1]) {
      const post = x + support * width * 0.45;
      add('box', [post, ground + 0.18, z], [1.03, 0.5, 1.0], '#f8d9c6');
      add('box', [post, ground + 1.54, z], [0.36, 2.75, 0.43], '#c2837c');
      add(
        'ball',
        [post + support * 0.07, ground + 1.48, z - 0.25],
        [0.75, 2.79, 0.72],
        '#748c64',
        support * 0.07,
      );
      add('ball', [post + support * 0.24, ground + 0.66, z - 0.25], [1.55, 1.16, 1.08], '#9dac77');
    }
    add('arch', [x, spring, z], [width, width * 0.92, 8.4], '#b47472');
    add('arch', [x, spring + 0.1, z - 0.24], [width - 0.13, width * 0.89, 10.6], '#78936c');
    const fractions = index % 2 ? [0.1, 0.44, 0.62, 0.94] : [0.05, 0.4, 0.71, 0.91];
    for (const [i, fraction] of fractions.entries()) {
      const angle = Math.PI * fraction;
      const vineX = x + Math.cos(angle) * width * 0.45;
      const vineY = spring + Math.sin(angle) * width * 0.405;
      add('ball', [vineX + 0.24, vineY + 0.3, z - 0.31], [1.04, 0.42, 0.76], '#a8b980', angle - 0.9);
      if (i % 2 === index % 2) {
        rose(add, vineX, vineY, z - 0.47, 0.59 + random() * 0.23, roseColors[(i + index) % 3], angle);
      }
    }
    const shrub = x - side * 2.7;
    add('ball', [shrub, ground + 0.29, z - 2.25], [3.15, 1.46, 2.4], '#9eaf7e');
    if (index % 3 === 0) {
      rose(add, shrub, ground + 0.87, z - 2.7, 0.65, roseColors[(index + 1) % 3], random() * Math.PI);
    }
    add('cloud', [x + side * 6.1, ground - 3.5, z - 2], [20.5, 4.2, 15.4], '#f7cbdd');
  }

  function emeraldMeadow(add, { x, y, z, side, index }, random) {
    const bank = y - 3.25;
    add('ball', [x + side * 3.2, bank - 2.8, z + 0.4], [22.8, 4.8, 25.4], '#318365');
    add('ball', [x + side * 2.2, bank - 0.46, z], [20.4, 4.5, 23.6], '#63b078');
    add('ball', [x + side * 6.1, bank + 0.25, z + 4], [13.8, 4.2, 19.8], '#8dc784');
    add('ball', [x - side * 0.7, bank + 0.13, z - 3.9], [10.5, 2.4, 13.1], '#a7cd75');
    const plants = [
      [0, -1.6, 1.0, -3.9, 1.6, 0.84],
      [1, 0.1, 0.96, -5.0, 2.5, 1.03],
      [2, 1.7, 1.1, -2.5, 2.15, 0.95],
      [3, 4.3, 1.6, 3.0, 2.7, 1.11],
    ];
    for (const [i, dx, dy, dz, height, size] of index % 2 ? plants.slice(1) : plants) {
      bulbPlant(
        add,
        x + side * dx,
        bank + dy,
        z + dz,
        height + random() * 0.25,
        size,
        meadowColors[(index + i) % 3],
        ['#367853', '#579b56'],
      );
    }
    add('cloud', [x + side * 6.5, bank - 4.9, z], [25.2, 4.1, 19.6], '#d3edc9');
  }

  function lily(add, x, y, z, scale, flowering) {
    add('ball', [x, y, z], [3.7 * scale, 0.23 * scale, 2.8 * scale], '#439c91');
    add(
      'ball',
      [x - 0.16 * scale, y + 0.1 * scale, z + 0.16 * scale],
      [3.14 * scale, 0.21 * scale, 2.44 * scale],
      '#75bba5',
    );
    add(
      'ball',
      [x + 0.54 * scale, y + 0.16 * scale, z - 0.54 * scale],
      [1.58 * scale, 0.065 * scale, 0.13 * scale],
      '#529c92',
      -0.04,
    );
    if (flowering) {
      for (const [dx, dy, dz, lean, color] of [
        [-0.41, 0.59, 0.06, 0.64, '#9ccdf7'],
        [0.42, 0.59, 0.05, -0.64, '#b4d9ff'],
        [0.09, 0.66, 0.26, 0.12, '#a9bbf5'],
        [-0.1, 0.37, -0.31, 0.72, '#d6e9fd'],
        [0.26, 0.41, -0.19, -0.51, '#c7d9fb'],
      ]) {
        add(
          'ball',
          [x + dx * scale, y + dy * scale, z + dz * scale],
          [0.5 * scale, 0.97 * scale, 0.51 * scale],
          color,
          lean,
        );
      }
      add(
        'ball',
        [x, y + 0.7 * scale, z + 0.02 * scale],
        [0.37 * scale, 0.37 * scale, 0.37 * scale],
        '#ffdeac',
      );
    }
  }

  function blueLagoon(add, { x, y, z, side, index }, random) {
    const water = y - 3.9;
    add('ball', [x + side * 1.9, water - 0.92, z + 1], [27.0, 2.34, 36.2], '#2f89b5');
    add('ball', [x + side * 1.6, water, z + 1], [26.6, 0.58, 35.4], '#57b8df', 0, 9.75);
    add('ball', [x - side * 2.9, water + 0.21, z - 3], [11.7, 0.31, 18.8], '#7ecbe4', 0, 9.75);
    add('ball', [x + side * 5.1, water + 0.22, z + 5], [13.6, 0.27, 20.8], '#7bcae8', 0, 9.75);
    for (const [dx, dz, length] of [
      [0.3, -7, 3.0],
      [-4.1, 0.4, 2.9],
      [2.2, 4.6, 2.8],
      [5.4, 9.4, 3.9],
    ]) {
      add(
        'ball',
        [x + side * dx, water + 0.37, z + dz],
        [length, 0.035, 0.1 + random() * 0.06],
        '#b1e3f2',
      );
    }
    lily(add, x - side * 0.8, water + 0.43, z - 2.8, 1.24, true);
    lily(add, x - side * 4.1, water + 0.4, z - 2.1, 0.73, false);
    if (index % 2 === 0) lily(add, x + side * 4.7, water + 0.4, z + 8.5, 0.76, true);
    add('ball', [x + side * 2.2, water + 0.39, z + 2], [6.8, 0.65, 4.85], '#82bdb2');
    add('ball', [x + side * 3.0, water + 0.63, z + 1.9], [4.75, 0.88, 3.9], '#a8d5b6');
    if (index % 3 === 0) {
      rose(add, x + side * 1.4, water + 1.3, z + 0.77, 0.85, blueRose, -0.35 + index * 0.63);
    }
    rose(add, x + side * 3.78, water + 1.63, z + 2, 1.12, blueRose, 0.45 + index * 0.58);
  }

  function tulipTowers(add, { x, y, z, side, index }, random) {
    const island = y - 4.9;
    const hue = index % towerColors.length;
    add('ball', [x + side * 1.4, island - 1.38, z], [12.5, 3.45, 11.4], '#735aab');
    add('ball', [x + side * 0.9, island - 0.33, z + 0.75], [11.7, 1.85, 10.9], '#b495d5');
    add('ball', [x + side * 4.5, island + 0.12, z + 2.5], [6.8, 2.15, 6.2], '#9c85c9');
    for (const [i, dx, dz, height, bloom] of [
      [0, -1.1, -2.8, 5.0, 1.44],
      [1, 1.7, 1.3, 8.4, 2.04],
      [2, 5.3, 3.95, 6.65, 1.64],
    ]) {
      bulbPlant(
        add,
        x + side * dx,
        island,
        z + dz,
        height + random() * 1.0,
        bloom,
        towerColors[(hue + i) % 3],
        ['#745998', '#9680b6'],
      );
    }
    add('cloud', [x + side * 6.8, island - 3.7, z + 3], [21.6, 4.5, 15.8], '#d7c4ef');
  }

  const scenery = {
    rose: { build: roseGarden, first: 9.2, side: -1, spacing: 25.0, clearance: 4.95 },
    meadow: { build: emeraldMeadow, first: 13.2, side: 1, spacing: 23.6, clearance: 4.6 },
    lagoon: { build: blueLagoon, first: 14.2, side: 1, spacing: 23.1, clearance: 5.2 },
    tulip: { build: tulipTowers, first: 10.4, side: -1, spacing: 24.4, clearance: 5.25 },
  };

  function routeEdge(path, z, side) {
    let closest = path[0];
    let edge = -Infinity;
    for (const pad of path) {
      const [x, padZ, , width, depth, travel = 0] = pad;
      if (Math.abs(padZ - z) < Math.abs(closest[1] - z)) closest = pad;
      // Include moving cushions and overlaps with adjacent scenery by the bends.
      if (Math.abs(padZ - z) < depth / 2 + 6.5) {
        edge = Math.max(edge, side * x + width / 2 + Math.abs(travel));
      }
    }
    const [x, , y, width, , travel = 0] = closest;
    return { edge: Math.max(edge, side * x + width / 2 + Math.abs(travel)), y };
  }

  window.FluffFlowerScenery = {
    build(course, add, random) {
      const theme = scenery[course.id];
      if (!theme || !course.path.length) return false;
      const finish = course.path.at(-1)[1];
      for (let z = theme.first, index = 0; z < finish + 14; z += theme.spacing, index++) {
        const side = index % 2 === 0 ? theme.side : -theme.side;
        const { edge, y } = routeEdge(course.path, z, side);
        const x = side * (edge + theme.clearance + random() * 0.7);
        theme.build(add, { x, y, z, side, index }, random);
      }
      return true;
    },
  };
})();
