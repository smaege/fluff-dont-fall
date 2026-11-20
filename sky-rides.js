(() => {
  'use strict';
  const stepCount = 8,
    tread = 1.4,
    rise = 0.46,
    lifetime = 5,
    returnDelay = 1.25;
  const slideLength = 18,
    width = 4.4,
    crest = (stepCount - 1) * rise;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const smooth = (v) => v * v * (3 - 2 * v);
  const stairsColors = [
    '#78cfc3',
    '#85d8cd',
    '#9edbc7',
    '#c9deb1',
    '#f3d59a',
    '#f6bd99',
    '#efaab4',
    '#dca9cc',
  ];

  // Both rows use the valley floor as their Y origin, including after an endless rebase.
  function rowsAfter(previous) {
    const [x, z, y, , depth] = previous;
    // The bottom tread meets the approach cushion, including its rounded take-off edge.
    const start = z + depth / 2 - 0.48;
    const stairsEnd = start + stepCount * tread;
    return [
      [x, start + (stepCount * tread) / 2, y, width, stepCount * tread, 0, 'stairs'],
      [x, stairsEnd + slideLength / 2, y, width, slideLength, 0, 'slide'],
    ];
  }
  function progress(pad, z) {
    return clamp((z - pad.z) / pad.d + 0.5, 0, 1);
  }
  function treadAt(pad, z) {
    return Math.min(stepCount - 1, Math.floor(progress(pad, z) * stepCount));
  }
  function bend(t) {
    return 0.14 * Math.sin(2 * Math.PI * t) * Math.sin(Math.PI * t) ** 2;
  }
  function laneCenter(pad, z) {
    return pad.kind === 'slide' ? pad.x + pad.w * bend(progress(pad, z)) : pad.x;
  }
  function ramp(t) {
    return crest * (1 - smooth(clamp((t - 0.04) / 0.78, 0, 1)));
  }
  function lip(u) {
    return 0.49 * smooth(clamp((Math.abs(u) - 0.36) / 0.14, 0, 1));
  }
  function height(pad, x, z) {
    if (pad.kind === 'stairs') return pad.y + treadAt(pad, z) * rise;
    return pad.y + ramp(progress(pad, z)) + lip((x - laneCenter(pad, z)) / pad.w);
  }
  function dropped(pad, z, now) {
    const start = pad.footfalls?.[treadAt(pad, z)];
    return start != null && now - start >= lifetime - 1e-9 && now - start < lifetime + returnDelay;
  }
  function restoreTreads(pad, surface, now) {
    if (!surface) return;
    pad.footfalls = surface.footfalls;
    for (let i = 0; i < stepCount; i++) {
      const touched = pad.footfalls[i];
      if (touched !== null && now - touched >= lifetime + returnDelay) pad.footfalls[i] = null;
    }
  }
  function touchTread(state, pad, arriving) {
    let surface = state.surfaces.get(pad.index);
    if (!surface) {
      surface = { footfalls: Array(stepCount).fill(null) };
      state.surfaces.set(pad.index, surface);
    }
    pad.footfalls = surface.footfalls;
    const i = treadAt(pad, state.z);
    if (arriving || pad.footfalls[i] === null) pad.footfalls[i] = state.time;
  }
  function drawStairs(world, pad, time) {
    const depth = pad.d / stepCount;
    for (let i = 0; i < stepCount; i++) {
      const first = pad.footfalls?.[i];
      const elapsed = first == null ? 0 : Math.max(0, time - first);
      const fall = Math.max(0, elapsed - lifetime);
      const z = pad.z - pad.d / 2 + (i + 0.5) * depth;
      const returning = fall > 0.88;
      const scale = returning ? smooth(clamp((fall - 0.88) / (returnDelay - 0.88), 0, 1)) : 1;
      if (scale < 0.01) continue;
      const y = pad.y + i * rise - (returning ? (1 - scale) * 0.46 : fall * (1.5 + 9.5 * fall));
      // The material shows one lit stitch per remaining second on the top and front.
      const remaining = returning ? lifetime : Math.max(0, lifetime - Math.floor(elapsed));
      world.draw(
        'box',
        [pad.x, y - 0.27, z],
        [pad.w * scale, 0.54 * scale, depth * scale],
        stairsColors[i],
        0,
        10 + remaining / 10,
      );
    }
  }
  // A single continuous strip with rolled edges, a solid underside and a gently curved run-out.
  function slideMesh() {
    const out = [],
      count = 56;
    const columns = [-0.5, -0.478, -0.45, -0.42, -0.39, -0.36, 0, 0.36, 0.39, 0.42, 0.45, 0.478, 0.5];
    const point = (u, t, bottom = false) => [
      u + bend(t),
      ramp(t) + lip(u) - (bottom ? 0.28 : 0),
      t - 0.5,
    ];
    const normal = (u, t) => {
      const e = 0.0002;
      const dx = (lip(u + e) - lip(u - e)) / (2 * e);
      const dz = (ramp(t + e) - ramp(t - e) - dx * (bend(t + e) - bend(t - e))) / (2 * e);
      const len = Math.hypot(dx, 1, dz);
      return [-dx / len, 1 / len, -dz / len];
    };
    const edge = (u, t, face) => [
      ...point(u, t, face === 'bottom'),
      ...(face === 'bottom' ? [0, -1, 0] : normal(u, t)),
    ];
    const quad = (a, b, c, d) => out.push(...a, ...b, ...c, ...a, ...c, ...d);
    for (let row = 0; row < count; row++) {
      const a = row / count,
        b = (row + 1) / count;
      for (let i = 1; i < columns.length; i++) {
        const l = columns[i - 1],
          r = columns[i];
        for (const face of ['top', 'bottom'])
          quad(edge(l, a, face), edge(l, b, face), edge(r, b, face), edge(r, a, face));
      }
      for (const u of [-0.5, 0.5]) {
        const n = [Math.sign(u), 0, 0];
        quad(
          [...point(u, a), ...n],
          [...point(u, b), ...n],
          [...point(u, b, true), ...n],
          [...point(u, a, true), ...n],
        );
      }
    }
    for (const t of [0, 1]) {
      const n = [0, 0, t ? 1 : -1];
      for (let i = 1; i < columns.length; i++) {
        const l = columns[i - 1],
          r = columns[i];
        quad(
          [...point(l, t), ...n],
          [...point(r, t), ...n],
          [...point(r, t, true), ...n],
          [...point(l, t, true), ...n],
        );
      }
    }
    return out;
  }
  function secondsLeft(pad, z, time) {
    const start = pad.footfalls?.[treadAt(pad, z)];
    return start == null ? lifetime : Math.max(0, Math.ceil(lifetime - (time - start) - 1e-9));
  }
  window.FluffSkyRides = {
    rowsAfter,
    progress,
    laneCenter,
    height,
    treadAt,
    rise,
    dropped,
    restoreTreads,
    touchTread,
    secondsLeft,
    drawStairs,
    slideMesh,
  };
})();
