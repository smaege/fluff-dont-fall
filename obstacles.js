(() => {
  'use strict';

  const combinations = ['ropeGate', 'gatePress'];
  const types = ['jumpRope', 'zipperGate', 'pillowPress', ...combinations];

  function jumpRope(pad, time, difficulty, trackZ = pad.z, travelScale = 1) {
    const span = Math.min(2.22, pad.d * 0.22);
    const speed = 2.75 + 1.05 * difficulty;
    const phase = ((time * speed + pad.index * 0.79) / (2 * span)) % 2;
    const travel = span * travelScale;
    const radius = 0.19;
    return {
      at: pad.index,
      type: 'jumpRope',
      x: pad.x,
      y: pad.y + 0.25,
      z: trackZ + (1 - 2 * Math.abs(phase - 1)) * travel,
      r: radius,
      halfSpan: pad.w / 2 + 0.06 - radius,
      travel,
      trackZ,
    };
  }

  function zipperGate(pad, time, difficulty, z = pad.z) {
    const halfWidth = pad.w / 2 + 0.06;
    const opening = 1.78 - 0.18 * difficulty;
    const travel = Math.min(0.73 + 0.24 * difficulty, halfWidth - opening / 2 - 0.29);
    const gapX = pad.x + travel * Math.sin(time * (1.72 + 0.68 * difficulty) + pad.index);
    const height = 3.84;
    const depth = 0.64;
    return [-1, 1].map((side) => {
      const inner = gapX + side * opening / 2;
      const outer = pad.x + side * halfWidth;
      return {
        at: pad.index,
        type: 'zipperGate',
        side,
        x: (inner + outer) / 2,
        y: pad.y + height / 2,
        z,
        width: Math.abs(outer - inner),
        depth,
        minY: pad.y,
        maxY: pad.y + height,
        gapX,
        opening,
      };
    });
  }

  function ease(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function pillowPress(pad, time, difficulty, z = pad.z) {
    const liftAt = 0.83 - 0.15 * difficulty;
    const openAt = liftAt + 0.57;
    const warnAt = openAt + 1.45 - 0.32 * difficulty;
    const dropAt = warnAt + 0.66;
    const period = dropAt + 0.36;
    const offset = pad.index * 0.493;
    // Each cycle starts with the stamp resting on the cushion.
    const impactAt = Math.floor((time + offset) / period) * period - offset;
    const t = time - impactAt;
    const lift = ease((t - liftAt) / (openAt - liftAt));
    const drop = ease((t - dropAt) / (period - dropAt));
    const bottom = pad.y + 2.14 * (lift - drop);
    const height = 1.48;
    return {
      at: pad.index,
      type: 'pillowPress',
      x: pad.x,
      y: bottom + height / 2,
      z,
      width: pad.w + 0.12,
      depth: 2.26,
      minY: bottom,
      maxY: bottom + height,
      impactAt,
      descending: t >= dropAt,
      signal: t >= dropAt ? 'closed' : t >= warnAt ? 'warning' : t >= openAt ? 'clear' : 'closed',
    };
  }

  function pose(type, pad, time, difficulty) {
    if (type === 'ropeGate') {
      // Keep the rope in front of the gap and within a single running jump of it.
      return [
        jumpRope(pad, time, difficulty, pad.z - 1.12, 0.27),
        ...zipperGate(pad, time, difficulty, pad.z + 0.96),
      ];
    }
    if (type === 'gatePress') {
      // Leave a safe strip after the gate where the player can wait for the press.
      return [
        ...zipperGate(pad, time, difficulty, pad.z - 1.45),
        pillowPress(pad, time, difficulty, pad.z + 1.65),
      ];
    }
    if (type === 'jumpRope') return [jumpRope(pad, time, difficulty)];
    if (type === 'zipperGate') return zipperGate(pad, time, difficulty);
    if (type === 'pillowPress') return [pillowPress(pad, time, difficulty)];
    return [];
  }

  function drawJumpRope(world, h, pad) {
    const { x, y, z, r, halfSpan, travel, trackZ } = h;
    const diameter = 2 * r;
    world.draw('box', [x, pad.y + 0.012, z], [halfSpan * 2 + diameter, 0.017, diameter], '#b98da5');
    world.draw('cylinder', [x, y, z], [halfSpan * 2, diameter * 0.85, diameter * 0.85], '#c35478');
    const wraps = Math.ceil(halfSpan * 2 / 0.42);
    for (let i = 0; i <= wraps; i++) {
      const wrapX = x + halfSpan * (2 * i / wraps - 1);
      const wrapWidth = i === 0 || i === wraps ? diameter : diameter * 1.2;
      const yarn = i % 2 ? '#ffce82' : '#ed7895';
      world.draw('ball', [wrapX, y, z], [wrapWidth, diameter, diameter], yarn, 0, 2);
    }
    for (const sign of [-1, 1]) {
      const railX = x + sign * (pad.w / 2 + 0.14);
      world.draw('box', [railX, pad.y + 0.094, trackZ], [0.16, 0.19, travel * 2 + 0.45], '#9b698c');
      world.draw('box', [railX, pad.y + 0.191, trackZ], [0.09, 0.016, travel * 2 + 0.34], '#e4b3b1');
      world.draw('box', [railX, y, z], [0.36, diameter, 0.45], '#a55282', 0, 1);
      world.draw('ball', [railX, y + 0.11, z], [0.17, 0.19, 0.17], '#ffe6a5');
      world.draw('ball', [railX, pad.y + 0.1, trackZ - travel], [0.3, 0.25, 0.31], '#de96ab');
      world.draw('ball', [railX, pad.y + 0.1, trackZ + travel], [0.3, 0.25, 0.31], '#de96ab');
    }
  }

  function drawZipperGate(world, h, pad) {
    const { x, y, z, width, depth, side, gapX, opening } = h;
    const height = h.maxY - h.minY;
    const sliderX = x - side * width * 0.43;
    const color = side < 0 ? '#8e6bb1' : '#4f928f';
    const border = side < 0 ? '#be98dc' : '#8cd0c0';
    world.draw('box', [x, y, z], [width, height, depth], color, 0, 2);
    for (let i = 0; i < 4; i++) {
      const squareY = pad.y + (i + 0.5) * height / 4;
      const patch = i % 2 ? border : color;
      world.draw('box', [x, squareY, z], [width * 0.82, 0.86, depth + 0.025], patch, 0, 1);
    }
    world.draw('box', [sliderX, y, z], [0.13, height - 0.08, depth + 0.045], '#fbd39b');
    for (const face of [-1, 1]) {
      const front = z + face * (depth / 2 + 0.04);
      for (let i = 0; i < 8; i++) {
        const threadY = pad.y + 0.26 + i * 0.45;
        world.draw('cylinder', [sliderX, threadY, front], [0.16, 0.09, 0.045], '#956988', face * 0.16);
      }
    }
    if (side < 0) {
      world.draw('box', [pad.x, pad.y + 0.014, z], [pad.w, 0.016, depth + 0.24], '#887093');
      world.draw('box', [gapX, pad.y + 0.024, z], [opening, 0.019, depth + 0.25], '#a6e2bb');
      world.draw('box', [pad.x, h.maxY + 0.12, z], [pad.w + 0.6, 0.24, depth + 0.18], '#8b6396', 0, 1);
    }
  }

  function drawPillowPress(world, h, pad, time) {
    const { x, y, z, width, depth } = h;
    const height = h.maxY - h.minY;
    const signalY = pad.y + 1.35;
    const warning = h.signal === 'warning';
    const signal = warning ? '#ffcc58' : h.signal === 'clear' ? '#a3eca8' : '#de7698';
    const flash = warning && Math.sin(time * 11) > 0 ? '#fff3bf' : signal;
    world.draw('box', [x, pad.y + 0.016, z], [pad.w, 0.027, depth], signal, 0, 1);
    for (const edge of [-1, 1]) {
      const postX = x + edge * (pad.w / 2 + 0.22);
      world.draw('box', [postX, pad.y + 1.95, z], [0.25, 3.9, 0.38], '#a66f96', 0, 1);
      world.draw('ball', [postX, signalY, z], [0.43, 0.43, 0.54], flash);
      for (let i = -2; i <= 2; i++) {
        world.draw(
          'cylinder',
          [x + i * width / 5, pad.y + 0.038, z + edge * depth * 0.45],
          [0.34, 0.021, 0.085],
          '#ffeed2',
        );
      }
    }
    world.draw('box', [x, pad.y + 3.88, z], [width + 0.64, 0.25, 0.52], '#8e5f8f', 0, 1);
    const rodLength = pad.y + 3.88 - h.maxY;
    world.draw('box', [x, h.maxY + rodLength / 2, z], [0.38, rodLength, 0.46], '#a580a3', 0, 1);
    world.draw('box', [x, y, z], [width, height, depth], '#c35f84', 0, 2);
    world.draw('box', [x, h.minY + 0.21, z], [width + 0.015, 0.29, depth + 0.015], flash, 0, 1);
    for (const face of [-1, 1]) {
      const front = z + face * (depth / 2 + 0.014);
      world.draw('star', [x, y + 0.11, front], [0.62, 0.61, 0.16], '#ffdb99');
      for (const offset of [-0.72, 0.72])
        world.draw('ball', [x + offset, y + 0.1, front], [0.12, 0.12, 0.08], '#f9afbb');
    }
  }

  function draw(world, h, pad, time) {
    if (h.type === 'jumpRope') drawJumpRope(world, h, pad);
    if (h.type === 'zipperGate') drawZipperGate(world, h, pad);
    if (h.type === 'pillowPress') drawPillowPress(world, h, pad, time);
  }

  window.FluffObstacles = { types, combinations, pose, draw };
})();
