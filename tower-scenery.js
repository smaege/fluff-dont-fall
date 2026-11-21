(() => {
  'use strict';

  const tau = 2 * Math.PI;
  const origin = [0, 0, 20];
  const unit = [1, 1, 1];
  const palette = {
    mortar: ['#aa94b7', -9],
    lilac: ['#c6b6d7', 0],
    lavender: ['#d2c1dd', 0],
    blush: ['#cfb8d0', 0],
    pale: ['#e8d6e7', 0],
    cream: ['#f6e2ca', 0],
    gold: ['#d7a474', -9],
    shade: ['#92799d', -9],
    mint: ['#b7dac4', -9],
    jade: ['#78a5a2', -9],
    teal: ['#42677b', -9],
    glass: ['#77adad', 9.75],
    shine: ['#c0ded0', 9.75],
    coral: ['#e58a99', 0],
    blue: ['#7ba5ca', 0],
  };

  const point = (radius, angle, y) => [radius * Math.sin(angle), y, -radius * Math.cos(angle)];
  const radial = (angle) => point(1, angle, 0);

  function triangle(out, a, b, c, na, nb = na, nc = na) {
    out.push(...a, ...na, ...b, ...nb, ...c, ...nc);
  }

  function quad(out, a, b, c, d, na, nb = na, nc = na, nd = nb) {
    triangle(out, a, b, c, na, nb, nc);
    triangle(out, b, d, c, nb, nd, nc);
  }

  function face(out, a, b, c, d) {
    const u = b.map((value, i) => value - a[i]);
    const v = c.map((value, i) => value - a[i]);
    const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const length = Math.hypot(...normal);
    quad(out, a, b, c, d, normal.map((value) => value / length));
  }

  // The profile is traced from bottom to top on the outside, then inward across any cap.
  function lathe(out, profile, start = 0, end = tau, steps = 64) {
    const bands = profile.slice(1).map(([radius, y], i) => {
      const [r0, y0] = profile[i];
      const length = Math.hypot(y - y0, r0 - radius);
      return [(y - y0) / length, (r0 - radius) / length];
    });
    const normal = (angle, [r, y]) => point(r, angle, y);
    for (const [i, [ra, ya]] of profile.slice(0, -1).entries()) {
      const [rb, yb] = profile[i + 1];
      for (let j = 0; j < steps; j++) {
        const a = start + (end - start) * j / steps;
        const b = start + (end - start) * (j + 1) / steps;
        const na = normal(a, bands[i]);
        const nb = normal(b, bands[i]);
        if (ra === 0) triangle(out, point(ra, a, ya), point(rb, a, yb), point(rb, b, yb), na, na, nb);
        else if (rb === 0) triangle(out, point(ra, a, ya), point(rb, a, yb), point(ra, b, ya), na, na, nb);
        else quad(out, point(ra, a, ya), point(rb, a, yb), point(ra, b, ya), point(rb, b, yb), na, na, nb, nb);
      }
    }
  }

  function moulding(out, radius, y, height, inset = 0.13) {
    const bottom = y - height / 2;
    const top = y + height / 2;
    lathe(out, [
      [radius - inset, bottom], [radius - inset * 0.27, bottom + height * 0.2],
      [radius, bottom + height * 0.4], [radius, top - height * 0.26],
      [radius - inset * 0.41, top - height * 0.07], [radius - inset, top],
    ]);
  }

  const tiers = [
    { low: -3.8, high: 3.65, radius: 6.25, colors: ['lilac', 'lavender', 'blush', 'lavender'] },
    { low: 3.65, high: 11.03, radius: 6.13, colors: ['lavender', 'pale', 'lilac', 'blush'] },
    { low: 11.03, high: 18.44, radius: 6.02, colors: ['pale', 'lavender', 'pale', 'blush'] },
    { low: 18.44, high: 22.79, radius: 6.13, colors: ['lavender', 'pale', 'lilac', 'pale'] },
  ];

  function masonry(mesh) {
    for (const [tierIndex, { low, high, radius, colors }] of tiers.entries()) {
      lathe(mesh.mortar, [[radius, low - 0.07], [radius, high]]);
      const tileCount = 18;
      const rows = tierIndex === 3 ? 3 : 6;
      const step = tau / tileCount;
      const rise = (high - low) / rows;
      for (let row = 0; row < rows; row++) {
        const y = low + row * rise + 0.039;
        for (let tile = 0; tile < tileCount; tile++) {
          const hue = (tile * 5 + row * 3 + Math.floor((tile + row) / 3) + tierIndex) % colors.length;
          const arc = (tile + (row % 2) * 0.5) * step;
          lathe(mesh[colors[hue]], [
            [radius - 0.015, y], [radius + 0.056, y + 0.09],
            [radius + 0.056, y + rise - 0.16], [radius - 0.015, y + rise - 0.078],
          ], arc - step / 2 + 0.011, arc + step / 2 - 0.011, 3);
        }
      }
    }

    lathe(mesh.shade, [[0, -6.22], [4.78, -6.22], [5.46, -6.01], [6.23, -5.56], [6.36, -5.35]]);
    lathe(mesh.blush, [[6.25, -5.75], [6.51, -5.21], [6.57, -4.67], [6.48, -4.11], [6.26, -3.79]]);
    moulding(mesh.shade, 6.67, -5.38, 0.24, 0.32);
    moulding(mesh.cream, 6.82, -4.33, 0.52, 0.42);
    moulding(mesh.gold, 6.70, -4.62, 0.11, 0.36);
    moulding(mesh.lilac, 6.53, -3.87, 0.19, 0.32);

    for (const [y, radius] of [[3.65, 6.65], [11.03, 6.54], [18.44, 6.51]]) {
      moulding(mesh.shade, radius - 0.18, y - 0.26, 0.22, 0.31);
      moulding(mesh.cream, radius, y, 0.35, 0.43);
      moulding(mesh.gold, radius - 0.026, y + 0.18, 0.098, 0.39);
      moulding(mesh.mint, radius - 0.14, y + 0.31, 0.22, 0.34);
    }
  }

  function opening(half, base, spring, rise) {
    const outline = [[half, base]];
    for (let i = 0; i <= 12; i++) {
      const arc = Math.PI * i / 12;
      outline.push([half * Math.cos(arc), spring + rise * Math.sin(arc)]);
    }
    outline.push([-half, base]);
    return outline;
  }

  function archRing(out, outer, inner) {
    for (let i = 0; i < outer.length; i++) {
      const next = (i + 1) % outer.length;
      face(out, inner[i], inner[next], outer[i], outer[next]);
    }
  }

  function archedWindow(mesh, angle, radius, base, scale, door = false) {
    const half = 0.57 * scale;
    const spring = base + 1.38 * scale;
    const rise = 0.77 * scale;
    const onWall = (r, x, y) => point(radius + r, angle + x / radius, y);
    const ring = (r, width, bottom, height) => opening(width, bottom, spring, height).map(([x, y]) => onWall(r, x, y));
    const outer = ring(0.103, half + 0.22, base - 0.18, rise + 0.23);
    const bevel = ring(0.24, half + 0.155, base - 0.12, rise + 0.16);
    const lip = ring(0.23, half, base, rise);
    const panes = ring(0.144, half - 0.045, base + 0.04, rise - 0.044);
    archRing(mesh.shade, outer, bevel);
    archRing(door ? mesh.gold : mesh.cream, bevel, lip);
    archRing(mesh.jade, lip, panes);

    const center = onWall(0.144, 0, base + scale);
    const normal = radial(angle);
    for (let i = 0; i < panes.length; i++) {
      const next = (i + 1) % panes.length;
      triangle(door || i % 5 < 2 ? mesh.teal : mesh.glass, center, panes[next], panes[i], normal);
    }
    const detail = (out, x0, y0, x1, y1) => quad(
      out, onWall(0.169, x0, y0), onWall(0.169, x0, y1),
      onWall(0.169, x1, y0), onWall(0.169, x1, y1), normal,
    );
    const crossbar = base + 0.98 * scale;
    detail(mesh.gold, -0.041, base + 0.068, 0.041, spring + rise - 0.075);
    detail(mesh.jade, -half + 0.075, crossbar, half - 0.075, crossbar + 0.068);
    if (door) {
      detail(mesh.jade, -half * 0.54, base + 0.11, -half * 0.49, spring + rise * 0.81);
      detail(mesh.jade, half * 0.49, base + 0.11, half * 0.54, spring + rise * 0.81);
      for (const side of [-1, 1]) {
        const x = side * 0.145;
        const y = base + 0.91 * scale;
        const knot = onWall(0.191, x, y);
        for (let i = 0; i < 8; i++) {
          const edge = (arc) => onWall(0.188, x + 0.07 * Math.cos(arc), y + 0.07 * Math.sin(arc));
          triangle(mesh.gold, knot, edge((i + 1) * tau / 8), edge(i * tau / 8), normal);
        }
      }
    } else {
      const gleam = (x, y) => onWall(0.17, x * scale, base + y * scale);
      quad(mesh.shine, gleam(-0.44, 1.15), gleam(-0.44, 1.32), gleam(-0.14, 1.7), gleam(-0.14, 1.84), normal);
      quad(mesh.shine, gleam(0.17, 0.33), gleam(0.17, 0.44), gleam(0.43, 0.74), gleam(0.43, 0.86), normal);
    }

    const end = (half + 0.28) / radius;
    lathe(mesh.cream, [
      [radius + 0.026, base - 0.28], [radius + 0.29, base - 0.24],
      [radius + 0.30, base - 0.11], [radius + 0.036, base - 0.047],
    ], angle - end, angle + end, 7);
  }

  function windows(mesh) {
    for (let i = 0; i < 8; i++) {
      const angle = i * tau / 8;
      archedWindow(mesh, angle, tiers[0].radius, i === 0 ? -3.34 : -1.95, i === 0 ? 1.69 : 1.15, i === 0);
      archedWindow(mesh, angle + tau / 16, tiers[1].radius, 5.38, 1.48);
      archedWindow(mesh, angle, tiers[2].radius, 12.94, 1.55);
      archedWindow(mesh, angle + tau / 16, tiers[3].radius, 19.15, 0.95);
    }
  }

  function battlement(out, inner, outer, bottom, top, a, b) {
    const tiers = [
      [inner, bottom], [outer - 0.08, bottom], [outer, bottom + 0.075],
      [outer, top - 0.075], [outer - 0.08, top], [inner + 0.08, top],
      [inner, top - 0.08], [inner, bottom],
    ];
    lathe(out, tiers, a, b, Math.ceil((b - a) * 14));
    for (const angle of [a, b]) {
      const normal = radial(angle + (angle === a ? -Math.PI / 2 : Math.PI / 2));
      const span = (radius, y) => point(radius, angle, y);
      const center = span((inner + outer) / 2, (bottom + top) / 2);
      for (let i = 1; i < tiers.length; i++) {
        const [first, second] = angle === a ? [tiers[i], tiers[i - 1]] : [tiers[i - 1], tiers[i]];
        triangle(out, center, span(...first), span(...second), normal);
      }
    }
  }

  function crown(mesh) {
    // The complete deck sits below the playable cushion's surface. Only the outer rim rises above it.
    lathe(mesh.shade, [[6.18, 21.33], [6.28, 21.36], [6.43, 21.51], [6.46, 21.62]]);
    lathe(mesh.lavender, [[6.19, 21.55], [6.45, 21.65], [6.77, 22.03], [6.83, 22.21], [6.76, 22.52]]);
    moulding(mesh.cream, 6.99, 22.30, 0.38, 0.33);
    moulding(mesh.gold, 6.95, 22.46, 0.10, 0.25);
    lathe(mesh.mint, [[6.66, 22.35], [6.96, 22.55], [6.96, 22.68], [6.76, 22.74],
      [6.57, 22.74], [6.54, 22.33], [0, 22.33]]);

    const entrance = tau * 0.075;
    for (const half of [0, Math.PI]) {
      const start = half + entrance, end = half + Math.PI - entrance;
      battlement(mesh.lavender, 5.90, 6.79, 22.72, 23.33, start, end);
      const count = 6;
      const block = (end - start) / (count * 2 - 1);
      for (let i = 0; i < count; i++) {
        const a = start + i * block * 2;
        const b = a + block;
        battlement(mesh.pale, 5.93, 6.78, 23.29, 24.20, a + 0.006, b - 0.006);
        battlement(mesh.cream, 5.85, 6.93, 24.12, 24.40, a, b);
      }
    }
  }

  function facadeBanners(mesh) {
    const radius = tiers[2].radius;
    for (const [angle, color] of [[-tau / 16, 'coral'], [tau / 16, 'blue'], [Math.PI + tau / 16, 'mint']]) {
      const top = 17.96;
      const bottom = 15.17;
      const cloth = (x, y, r = 0.23) => point(radius + r, angle + x / radius, y);
      const normal = radial(angle);
      quad(mesh[color], cloth(-0.52, bottom), cloth(-0.52, top), cloth(0, bottom + 0.46), cloth(0, top), normal);
      quad(mesh[color], cloth(0, bottom + 0.46), cloth(0, top), cloth(0.52, bottom), cloth(0.52, top), normal);
      for (const side of [-1, 1]) {
        const x = side * 0.425;
        quad(mesh.cream, cloth(x - 0.024, bottom + 0.13, 0.252), cloth(x - 0.024, top - 0.12, 0.252),
          cloth(x + 0.024, bottom + 0.13, 0.252), cloth(x + 0.024, top - 0.12, 0.252), normal);
      }
      const motif = (x, y) => cloth(x, y + 16.95, 0.255);
      const center = motif(0, 0);
      for (let i = 0; i < 8; i++) {
        const edge = (index) => {
          const a = index * tau / 8;
          const size = index % 2 === 0 ? 1 : 0.39;
          return motif(Math.cos(a) * 0.31 * size, Math.sin(a) * 0.42 * size);
        };
        triangle(mesh.cream, center, edge(i + 1), edge(i), normal);
      }
      lathe(mesh.gold, [[radius + 0.023, top - 0.045], [radius + 0.34, top - 0.013],
        [radius + 0.34, top + 0.067], [radius + 0.023, top + 0.101]],
      angle - 0.69 / radius, angle + 0.69 / radius, 8);
    }
  }

  function roofPennants(mesh) {
    for (const [angle, color] of [[1.41, 'coral'], [tau - 1.41, 'blue']]) {
      const pole = point(6.35, angle, 0);
      const bannerTop = 26.65;
      const spindle = mesh.gold;
      const first = spindle.length;
      lathe(spindle, [[0.11, 23.04], [0.11, 24.11], [0.056, 24.28], [0.056, bannerTop + 0.03],
        [0.145, bannerTop + 0.19], [0.105, bannerTop + 0.31], [0, bannerTop + 0.35]], 0, tau, 12);
      for (let i = first; i < spindle.length; i += 6) {
        spindle[i] += pole[0];
        spindle[i + 2] += pole[2];
      }

      const flag = (part, y, offset = 0) => point(6.39 + Math.sin(tau * part) * 0.14 + offset, angle + 0.32 * part, y);
      for (let i = 0; i < 8; i++) {
        const a = i / 8;
        const b = (i + 1) / 8;
        const upper = (part) => bannerTop - 0.1 - 0.25 * part + 0.075 * Math.sin(tau * part);
        const lower = (part) => upper(part) - 0.87 + 0.55 * part;
        face(mesh[color], flag(a, upper(a)), flag(b, upper(b)), flag(a, lower(a)), flag(b, lower(b)));
        face(mesh[color], flag(b, upper(b), -0.008), flag(a, upper(a), -0.008),
          flag(b, lower(b), -0.008), flag(a, lower(a), -0.008));
      }
    }
  }

  let templates;
  function meshes() {
    if (!templates) {
      const mesh = Object.fromEntries(Object.keys(palette).map((name) => [name, []]));
      masonry(mesh);
      windows(mesh);
      crown(mesh);
      facadeBanners(mesh);
      roofPennants(mesh);
      templates = Object.fromEntries(Object.entries(mesh).map(([name, vertices]) => [
        `tower-${name}`,
        new Float32Array(vertices),
      ]));
    }
    return templates;
  }

  function draw(world) {
    for (const [name, [color, material]] of Object.entries(palette)) {
      world.draw(`tower-${name}`, origin, unit, color, 0, material);
    }
  }

  window.FluffTowerScenery = { meshes, draw };
})();
