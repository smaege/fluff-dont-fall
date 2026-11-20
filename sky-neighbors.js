(() => {
  'use strict';

  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const origin = [0, 0, 0];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const people = [
    {
      name: 'Onni',
      type: 'human-teal',
      height: 1.02,
      skin: '#bd7958',
      blush: '#c96e67',
      hair: '#423038',
      hairLight: '#61434a',
      shirt: '#50877f',
      seam: '#78a89a',
      trim: '#f0d4a7',
      pants: '#3f576a',
      shoes: '#995f50',
      curls: true,
    },
    {
      name: 'Aino',
      type: 'human-rose',
      height: 0.96,
      skin: '#efb395',
      blush: '#d5817f',
      hair: '#854837',
      hairLight: '#a85c44',
      shirt: '#b86379',
      seam: '#d8899b',
      trim: '#ffe4bd',
      pants: '#696086',
      shoes: '#614456',
    },
    {
      name: 'Eeli',
      type: 'human-teal',
      height: 0.96,
      skin: '#985c45',
      blush: '#a95457',
      hair: '#382e43',
      hairLight: '#54445b',
      shirt: '#5676a2',
      seam: '#7f9ac1',
      trim: '#f4ca83',
      pants: '#564d69',
      shoes: '#79504b',
      curls: true,
    },
    {
      name: 'Saana',
      type: 'human-rose',
      height: 1.02,
      skin: '#d99972',
      blush: '#ce746a',
      hair: '#593939',
      hairLight: '#89554a',
      shirt: '#a8764e',
      seam: '#c79766',
      trim: '#f9dfab',
      pants: '#4b6766',
      shoes: '#744b52',
    },
  ];
  const conversations = [
    [
      'Katso, pallo ehtii kohta pilven ohi.',
      'Veikkaan, että pilvi ehtii ensin.',
      'Mistä huomaat sen?',
      'Se lähti jo ennen kuin katsoit.',
    ],
    [
      'Toitko eväät?',
      'Toin. Yksi korvapuusti kummallekin.',
      'Minun tuoksuu kanelilta tänne asti.',
      'Niin minunkin. Istutaan kohta syömään.',
    ],
    [
      'Tuuli tarttui aamulla huiviini.',
      'Saitko sen kiinni?',
      'Sain, juuri ennen seuraavaa pilveä.',
      'Tehdään siihen ensi kerralla solmu.',
    ],
    [
      'Näin äsken pehmon hyppäävän kahdesti.',
      'Se taisi tehdä voltin ilmassa.',
      'Minä osaan vain kuperkeikan.',
      'Se on hyvä alku. Näytä minulle joskus.',
    ],
  ];

  const yawBasis = (yaw) => [
    Math.cos(yaw),
    0,
    -Math.sin(yaw),
    0,
    1,
    0,
    Math.sin(yaw),
    0,
    Math.cos(yaw),
  ];

  function place(matrix, base, [x, y, z]) {
    return base.map(
      (value, axis) => value + matrix[axis] * x + matrix[axis + 3] * y + matrix[axis + 6] * z,
    );
  }

  const normalize = (v) => {
    const len = Math.hypot(...v);
    return v.map((value) => value / len);
  };
  const cross = ([ax, ay, az], [bx, by, bz]) => [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx,
  ];

  function frame(world, position, basis) {
    world.gl.uniform3fv(world.u.modelBase, position);
    world.gl.uniformMatrix3fv(world.u.modelBasis, false, basis);
  }

  function pair(row, at, course) {
    const [x, z, y, width, , travel = 0] = row;
    const slot = (at - 3) / 7;
    const side = Math.abs(x) > 0.5 ? -Math.sign(x) : slot % 2 ? -1 : 1;
    const seed = course.seed ?? course.id.charCodeAt(0);
    let pairX = x + side * (width / 2 + travel + 2.7);
    if (slot === 0) {
      const animalAnchor = course.path[2][0];
      const animalsOnLeft = (course.endless && Math.abs(animalAnchor) < 0.55) || animalAnchor > 0;
      // Leave the foreground animals their own space and clear the track on sharp bends.
      const openingSide = Math.abs(x) > 3.05 ? -Math.sign(x) : animalsOnLeft ? 1 : -1;
      pairX = openingSide * 4.1;
    }
    return {
      at,
      slot,
      kind: 'human',
      x: pairX,
      y: slot === 0 ? Math.min(2.65, y + 1.68) : y + 1.55,
      z: z + (slot === 0 ? 2.2 : 0.9),
      cast: slot === 0 ? 0 : ((seed + slot) % 2) * 2,
    };
  }

  function dialogue(slot, round) {
    return conversations[(slot + round) % conversations.length];
  }

  function drawLegs(world, person) {
    const { pants, shoes, trim } = person;
    for (const side of [-1, 1]) {
      const x = side * 0.235;
      world.draw('box', [x, 0.0625, -0.112], [0.37, 0.125, 0.61], trim);
      world.draw('box', [x, 0.178, -0.104], [0.356, 0.2, 0.56], shoes);
      world.draw('ball', [x, 0.255, 0.012], [0.29, 0.27, 0.31], shoes);
      world.draw('box', [x, 0.293, -0.206], [0.205, 0.035, 0.056], trim);
      world.draw('box', [x, 0.411, 0.028], [0.28, 0.14, 0.33], pants, 0, -1);
      world.draw('box', [x, 0.85, 0.035], [0.35, 0.86, 0.4], pants, 0, -1);
    }
    world.draw('ball', [0, 1.22, 0.03], [0.8, 0.43, 0.5], pants, 0, -1);
  }

  function drawShirt(world, person) {
    const { shirt, seam, trim, curls } = person;
    world.draw('box', [0, 1.66, 0.025], [0.86, 0.78, 0.54], shirt, 0, -1);
    world.draw('ball', [0, 1.99, 0.025], [0.9, 0.39, 0.54], shirt, 0, -1);
    world.draw('box', [0, 1.32, 0.021], [0.82, 0.13, 0.53], seam, 0, -1);
    world.draw('ball', [0, 2.115, 0], [0.4, 0.13, 0.38], trim, 0, -1);
    if (curls) {
      world.draw('box', [-0.22, 1.84, -0.244], [0.2, 0.16, 0.054], seam, 0, -1);
      world.draw('box', [-0.22, 1.916, -0.275], [0.2, 0.025, 0.035], trim);
    } else {
      world.draw('box', [0, 1.72, -0.246], [0.09, 0.68, 0.035], seam, 0, -1);
      for (const y of [1.49, 1.68, 1.87])
        world.draw('ball', [0, y, -0.278], [0.058, 0.058, 0.034], trim);
    }
    world.draw('ball', [0, 2.23, 0.01], [0.34, 0.32, 0.32], person.skin);
  }

  function sleeve(world, root, start, end, width, color) {
    const segment = end.map((value, axis) => value - start[axis]);
    const up = normalize(segment);
    const across = normalize(cross(up, [0, 0, 1]));
    const middle = start.map((value, axis) => root[axis] + value + segment[axis] / 2);
    frame(world, middle, [...across, ...up, ...cross(across, up)]);
    world.draw('box', origin, [width, Math.hypot(...segment) + 0.142, width], color, 0, -1);
  }

  function drawArm(world, person, root, basis, side, offering, rhythm) {
    const shoulder = [side * 0.45, 1.996, 0.017];
    const elbow = [side * (0.55 + 0.16 * offering), 1.68 + 0.06 * offering, -0.028 - 0.16 * offering];
    const wrist = [
      side * (0.58 + (0.31 + 0.07 * rhythm) * offering),
      1.395 + (0.6 + 0.09 * rhythm) * offering,
      -0.085 - 0.4 * offering,
    ];
    const local = (point) =>
      place(
        basis,
        origin,
        point.map((value) => value * person.height),
      );
    const color = person.shirt;
    frame(world, root, identity);
    world.draw('ball', local(shoulder), [0.34, 0.34, 0.34], color, 0, -1);
    sleeve(world, root, local(shoulder), local(elbow), 0.29, color);
    sleeve(world, root, local(elbow), local(wrist), 0.24, color);
    frame(world, root, basis);
    const hand = [wrist[0] + side * 0.014, wrist[1] - 0.073 + 0.09 * offering, wrist[2] - 0.042];
    world.draw(
      'ball',
      wrist.map((value) => value * person.height),
      [0.249, 0.166, 0.238],
      person.seam,
      0,
      -1,
    );
    world.draw(
      'ball',
      hand.map((value) => value * person.height),
      [0.216, 0.233, 0.206],
      person.skin,
    );
    world.draw(
      'ball',
      [hand[0] - side * 0.083, hand[1] + 0.041, hand[2] - 0.044].map((value) => value * person.height),
      [0.098, 0.123, 0.112],
      person.skin,
    );
  }

  function drawHair(world, person) {
    const { hair, hairLight, curls, trim } = person;
    if (curls) {
      world.draw('ball', [0, 0.17, 0.099], [0.854, 0.65, 0.74], hair, 0, -1);
      const locks = [
        [-0.3, 0.22, -0.17, 0.3],
        [-0.21, 0.34, -0.13, 0.34],
        [-0.035, 0.34, -0.135, 0.365],
        [0.17, 0.31, -0.16, 0.34],
        [0.3, 0.22, -0.13, 0.32],
        [0.2, 0.35, 0.105, 0.31],
        [-0.04, 0.4, 0.115, 0.335],
        [-0.23, 0.32, 0.12, 0.32],
      ];
      for (const [index, [x, y, z, size]] of locks.entries())
        world.draw('ball', [x, y, z], [size, size, size], index % 3 === 0 ? hairLight : hair, 0, -1);
      return;
    }
    world.draw('ball', [0, 0.09, 0.15], [0.91, 0.97, 0.69], hair, 0, -1);
    world.draw('ball', [0.315, -0.127, 0.126], [0.32, 0.67, 0.48], hair, 0, -1);
    world.draw('ball', [-0.348, -0.138, 0.103], [0.31, 0.68, 0.475], hair, 0, -1);
    world.draw('ball', [-0.208, 0.265, -0.208], [0.418, 0.385, 0.294], hairLight, 0.3, -1);
    world.draw('ball', [0.15, 0.322, -0.131], [0.557, 0.34, 0.496], hair, -0.34, -1);
    world.draw('box', [-0.343, 0.192, -0.271], [0.131, 0.052, 0.05], trim, -0.2);
  }

  function drawHead(world, person, root, yaw, nod, speaking) {
    const c = Math.cos(yaw),
      s = Math.sin(yaw);
    const cp = Math.cos(nod),
      sp = Math.sin(nod);
    frame(world, root, [c, 0, -s, s * sp, cp, c * sp, s * cp, -sp, c * cp]);
    world.draw('ball', [0, 0, 0], [0.821, 0.89, 0.749], person.skin);
    world.draw('ball', [0, -0.212, -0.031], [0.625, 0.44, 0.623], person.skin);
    for (const side of [-1, 1]) {
      world.draw('ball', [side * 0.39, -0.049, 0.005], [0.168, 0.252, 0.166], person.skin);
      world.draw('ball', [side * 0.44, -0.055, -0.048], [0.069, 0.133, 0.046], person.blush);
      world.draw('ball', [side * 0.164, 0.021, -0.343], [0.133, 0.143, 0.068], '#fff1d9');
      world.draw('ball', [side * 0.156, 0.015, -0.378], [0.076, 0.1, 0.035], '#442f3e');
      world.draw('ball', [side * 0.156 - 0.013, 0.041, -0.397], [0.025, 0.028, 0.015], '#fff8e7');
      world.draw('ball', [side * 0.17, 0.136, -0.346], [0.154, 0.045, 0.065], person.hair);
      world.draw('ball', [side * 0.231, -0.089, -0.312], [0.119, 0.072, 0.059], person.blush);
    }
    world.draw('ball', [0, -0.045, -0.378], [0.155, 0.146, 0.158], person.skin);
    world.draw('ball', [0, -0.174, -0.346], [0.134, 0.045 + 0.064 * speaking, 0.041], '#753e45');
    world.draw('ball', [0, -0.203, -0.338], [0.105, 0.035, 0.044], person.blush);
    drawHair(world, person);
  }

  function draw(world, pair, index, time, line) {
    const person = people[pair.cast + index];
    const side = index === 0 ? -1 : 1;
    const calm = reducedMotion?.matches ? 0.22 : 1;
    const voice = line?.who === index ? line.emphasis : 0;
    const reply = line?.who === 1 - index ? line.emphasis : 0;
    const phase = time * 4.25 + index * 1.82;
    const yaw = side * 0.64;
    const root = [pair.x + side * 0.95, pair.y, pair.z + side * 0.15];
    const body = yawBasis(yaw);
    frame(world, root, body);
    drawLegs(world, person);
    drawShirt(world, person);
    drawArm(world, person, root, body, -side, voice * calm, Math.sin(phase));
    drawArm(world, person, root, body, side, voice * 0.18 * calm, Math.cos(phase));
    const head = place(body, root, [0, 2.495 + (person.height - 1) * 0.36, 0]);
    const headYaw = yaw + side * (0.12 * voice + 0.22 * reply) * calm;
    const nod = (0.031 * Math.sin(phase) + 0.085 * reply * Math.sin(phase * 1.2)) * calm;
    drawHead(world, person, head, headYaw, nod, voice * calm * (0.5 + 0.5 * Math.sin(phase * 2.4)));
    frame(world, origin, identity);
    return {
      name: person.name,
      type: person.type,
      head: [head[0] - 0.3 * Math.sin(headYaw), head[1] + 0.38, head[2] - 0.3 * Math.cos(headYaw)],
    };
  }

  window.FluffSkyNeighbors = { pair, draw, dialogue };
})();
