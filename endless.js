(() => {
  'use strict';
  const course = {
    id: 'endless',
    petalTheme: 'lilac',
    title: 'Pilvivaellus',
    difficulty: 'Loputon',
    endless: true,
    caption: 'Kuinka pitkälle pehmosi pääsee?',
    description:
      'Pilvien asukkaat vaihtuvat matkan varrella. Etsi rusettipaketteja ja pysähdy tarvittaessa välilipulle, joka tulee vastaan 12 hypyn välein.',
    sky: ['#c1a3ca', '#f4c5bd', '#ffe1bd'],
    fog: '#f1d5d0',
    fabric: ['#f2bca8', '#cfaddb', '#f2dfb5', '#b9d7d0'],
    side: '#b789ae',
  };
  const batch = 12;
  const earlyHazards = ['bun', 'bee', 'hurdle', 'ball'];
  const middleHazards = [...earlyHazards, 'hoops', 'pendulum', 'hedgehog'];
  const lateHazards = [...middleHazards, 'shutter', 'sweeper', 'moth'];
  const trails = [
    [1, 1, 0.5, -0.6, -1, -0.7],
    [1, -0.5, -1, 0.4, 1, 0.8],
    [0.35, 0.65, 1, 1, 0.3, -0.8],
    [1, 0.2, -1, -0.3, 1, -0.5],
    [0.2, 0.4, -0.8, -1, -0.45, 0.6],
  ];
  function create(seed = Math.floor(Math.random() * 4294967296)) {
    let randomState = seed >>> 0;
    return {
      ...course,
      seed: randomState,
      firstIndex: 0,
      originZ: 0,
      path: [[0, 0, 0, 5.5, 6]],
      hazards: [],
      stars: [],
      gifts: [],
      nextGift: 2,
      checkpoints: [],
      nextHazard: 4,
      nextSpecial: 6,
      nextKind: 'crumble',
      hazardDeck: [],
      hazardTier: -1,
      safePadsUntilStar: 1,
      lastStarIndex: 0,
      pattern: trails[0],
      direction: 1,
      random() {
        randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0;
        return randomState / 4294967296;
      },
    };
  }
  function appendHazard(run, index, difficulty) {
    const tier = index < 12 ? 0 : index < 24 ? 1 : 2;
    const newTier = tier !== run.hazardTier;
    if (newTier || !run.hazardDeck.length) {
      run.hazardDeck = [...[earlyHazards, middleHazards, lateHazards][tier]];
      run.hazardTier = tier;
    }
    const last = run.hazards.at(-1)?.type;
    const candidates = run.hazardDeck.filter((type) => type !== last);
    const type = newTier
      ? ['bun', 'hoops', 'shutter'][tier]
      : candidates[Math.floor(run.random() * candidates.length)] || run.hazardDeck[0];
    run.hazardDeck.splice(run.hazardDeck.indexOf(type), 1);
    const hazard = { at: index, type, rate: 1.15 + 0.95 * difficulty };
    if (type === 'pendulum') hazard.amplitude = 1.02 + 0.29 * difficulty;
    if (type === 'ball') hazard.amplitude = 0.62 + 0.38 * difficulty;
    if (type === 'hurdle') hazard.amplitude = 0.14 + 0.34 * difficulty;
    run.hazards.push(hazard);
    const spacing = difficulty >= 0.55 ? 2 : 3;
    run.nextHazard = index + spacing + Math.floor(run.random() * (difficulty < 0.35 ? 3 : 2));
  }
  function append(run) {
    const index = run.firstIndex + run.path.length;
    const phase = (index - 1) % 6,
      random = run.random;
    if (phase === 0) {
      run.pattern = trails[Math.floor(random() * trails.length)];
      run.direction = random() < 0.5 ? -1 : 1;
    }
    const [x, z, y, , depth, , previousKind] = run.path.at(-1);
    // Reserve two neighbouring pads between flags. Keep the first ride close to the start.
    const section = Math.floor(index / 24);
    const rideStart = section === 0 ? 8 : 4 + ((Math.imul(run.seed ^ section, 0x85ebca6b) >>> 12) % 5);
    if (index % 24 === rideStart) {
      run.path.push(...window.FluffSkyRides.rowsAfter(run.path.at(-1)));
      const at = index + 1;
      const reward = { at, dx: (section % 2 ? -1 : 1) * 0.8, dz: 0 };
      if (run.nextGift <= at) {
        run.gifts.push(reward);
        run.nextGift = at + 7 + Math.floor(random() * 4);
      } else {
        run.stars.push(reward);
        run.lastStarIndex = at;
      }
      return;
    }
    const difficulty = window.FluffCourses.challenge(run, index);
    const checkpoint = index % batch === 0;
    const practicing = index < 24;
    // Even in the densest stretch, leave a reachable star between checkpoints.
    const starRest = !practicing && index - run.lastStarIndex >= 7;
    const gift = index >= run.nextGift && !checkpoint && !starRest;
    const steady = checkpoint || starRest || gift;
    const afterHazard = run.hazards.at(-1)?.at === index - 1;
    // Leave a steady cushion on either side of each special platform during the opening stretch.
    const obstacle =
      !steady &&
      index >= run.nextHazard &&
      (!practicing || (!previousKind && index !== run.nextSpecial && index + 1 !== run.nextSpecial));
    const kind =
      !steady && !obstacle && index >= run.nextSpecial && (!practicing || !afterHazard)
        ? run.nextKind
        : null;
    const move =
      !steady &&
      !obstacle &&
      !kind &&
      previousKind !== 'crumble' &&
      (!practicing || (!previousKind && !afterHazard && index + 1 !== run.nextSpecial)) &&
      index > 4 &&
      index % 3 === 1 &&
      random() < 0.48 + 0.32 * difficulty;
    const width = checkpoint ? 5.4 : obstacle ? 4.8 : 4.3 + random() * 0.35 - difficulty * 0.63;
    // Leave room to land, jump the full-width obstacle and take off for the next cushion.
    const length = checkpoint
      ? 4.8
      : obstacle
        ? 10.2 - difficulty * 0.6
        : 3.93 + random() * 0.31 - difficulty * 0.32;
    const gap = 1.06 + random() * 0.57 + difficulty * 0.42;
    const shift = run.pattern[phase] * run.direction * (1.05 + random() * 0.63 + difficulty * 0.4);
    const nextX = Math.max(-4.45, Math.min(4.45, x + shift));
    const nextY = Math.max(-0.8, Math.min(2.4, y + (random() - 0.47) * (0.3 + 0.16 * difficulty)));
    run.path.push([
      nextX,
      z + (depth + length) * 0.5 + gap,
      nextY,
      width,
      length,
      move ? 0.38 + random() * 0.19 + difficulty * 0.17 : 0,
      kind,
    ]);
    if (checkpoint) {
      run.checkpoints.push(index);
      if (index % 24 === 12)
        run.gifts.push({
          at: index,
          dx: section % 2 ? -1.15 : 1.15,
          dz: 0.55,
          loft: 2.75,
          aerial: true,
        });
    } else if (gift) {
      run.gifts.push({ at: index, dx: (random() - 0.5) * 0.8, dz: 0 });
      run.nextGift = index + 7 + Math.floor(random() * 4);
    } else if (obstacle) {
      appendHazard(run, index, difficulty);
    } else if (kind) {
      const spacing = difficulty >= 0.65 ? 2 : difficulty >= 0.35 ? 3 : 4;
      run.nextSpecial = index + spacing;
      run.nextKind = kind === 'crumble' ? 'tilt' : 'crumble';
    } else if (!move && (starRest || --run.safePadsUntilStar === 0)) {
      // Derive pickups from the pad index to keep the route's random sequence intact.
      const bits = Math.imul(run.seed ^ Math.imul(index, 0x9e3779b9), 0x85ebca6b);
      run.stars.push({
        at: index,
        dx: index === 1 ? 0 : (bits & 255) / 255 - 0.5,
        dz: index === 1 ? 0 : ((bits >>> 8) & 255) / 255 - 0.5,
      });
      run.safePadsUntilStar = 2 + ((bits >>> 16) & 1);
      run.lastStarIndex = index;
    }
  }
  function starPosition(star, pad, time) {
    const x = pad.x + star.dx,
      z = pad.z + star.dz;
    return {
      x,
      z,
      y: window.FluffCourses.surfaceHeight(pad, x, z) + 0.98 + Math.sin(time * 3.1 + star.at) * 0.11,
    };
  }
  // Rebase the active strip so GPU coordinates stay small, even very far from the start.
  function advance(run, progress) {
    let shift = 0;
    if (progress - run.firstIndex >= 2 * batch) {
      run.path.splice(0, batch);
      run.firstIndex += batch;
      run.hazards = run.hazards.filter((h) => h.at >= run.firstIndex);
      run.stars = run.stars.filter((star) => star.at >= run.firstIndex);
      run.gifts = run.gifts.filter((gift) => gift.at >= run.firstIndex);
      run.checkpoints = run.checkpoints.filter((index) => index >= run.firstIndex);
      shift = run.path[0][1];
      run.originZ += shift;
      for (const pad of run.path) pad[1] -= shift;
    }
    if (run.firstIndex + run.path.length - progress < 22) {
      const end = Math.max(run.firstIndex + run.path.length + batch, progress + 22);
      while (run.firstIndex + run.path.length < end) append(run);
    }
    return shift;
  }
  window.FluffEndless = { course, create, advance, starPosition };
})();
