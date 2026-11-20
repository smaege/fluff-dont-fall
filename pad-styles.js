(() => {
  'use strict';
  const tau = 2 * Math.PI;
  const segments = 96;
  const shapes = ['flower', 'hexagon', 'oval', 'cushion'];
  const themes = {
    cloud: ['#f4bca9', '#9ddbe7', '#a9dcb2', '#ffe0a5'],
    candy: ['#f39ac1', '#f8c588', '#daa6df', '#f6aab0'],
    night: ['#c193e2', '#9eacef', '#bfb7f4', '#efb3d9'],
    grove: ['#ebcd85', '#a9c979', '#89c29b', '#d1dd96'],
    reef: ['#f4b3ac', '#a8bee8', '#81d4c2', '#f5c78c'],
    orchard: ['#efabb7', '#f6d18d', '#afcf86', '#d48491'],
    frost: ['#bbdafa', '#83dbd8', '#acb2eb', '#e1b8eb'],
    rose: ['#f6a3c7', '#ffd0dc', '#dc7cab', '#ef94b0'],
    meadow: ['#a8dc90', '#71ccaa', '#89d4a0', '#b4dc81'],
    lagoon: ['#82c4ec', '#a9d8fa', '#7ccfe8', '#8cb4f3'],
    tulip: ['#c896e7', '#af91dc', '#e1b9ef', '#be9dec'],
    endless: ['#edabb3', '#b8a5e1', '#addbd0', '#ffd5a1'],
  };
  const offsets = {
    cloud: 0, candy: 1, night: 2, grove: 1, reef: 2, orchard: 0, frost: 1,
    rose: 0, meadow: 2, lagoon: 3, tulip: 0, endless: 0,
  };
  const styles = Object.fromEntries(
    Object.entries(themes).map(([theme, colors]) => [
      theme,
      shapes.map((shape, i) => ({ shape, color: colors[i] })),
    ]),
  );

  function hexRadius(angle) {
    const power = 18;
    const faces = [0, Math.PI / 3, (2 * Math.PI) / 3];
    const sum = faces.reduce((total, face) => total + Math.abs(Math.cos(angle - face)) ** power, 0);
    return sum ** (-1 / power);
  }
  const hexAxes = [hexRadius(0), hexRadius(Math.PI / 2)];

  function outlinePoint(shape, i) {
    const angle = (i * tau) / segments;
    const x = Math.cos(angle),
      z = Math.sin(angle);
    switch (shape) {
      case 'flower': {
        const radius = 0.439 + 0.061 * Math.cos(8 * angle);
        return [x * radius, z * radius];
      }
      case 'hexagon': {
        const rawAngle = Math.atan2(z * hexAxes[1], x * hexAxes[0]);
        const radius = hexRadius(rawAngle) / Math.hypot(x * hexAxes[0], z * hexAxes[1]) / 2;
        return [x * radius, z * radius];
      }
      case 'cushion': {
        const radius = 0.5 * (Math.abs(x) ** 4.7 + Math.abs(z) ** 4.7) ** (-1 / 4.7);
        return [x * radius, z * radius];
      }
      default:
        return [x / 2, z / 2];
    }
  }

  const contours = Object.fromEntries(
    shapes.map((shape) => [shape, Array.from({ length: segments }, (_, i) => outlinePoint(shape, i))]),
  );

  function style(course, index, kind) {
    if (
      kind ||
      index === 0 ||
      (!course.endless && index === course.path.length - 1) ||
      course.checkpoints?.includes(index) ||
      course.hazards?.some((hazard) => hazard.at === index)
    )
      return null;
    const theme = styles[course.id] ? course.id : 'cloud';
    return styles[theme][(index - 1 + offsets[theme]) % shapes.length];
  }

  function contains(style, dx, dz, width, depth) {
    if (!style) return Math.abs(dx) <= width / 2 && Math.abs(dz) <= depth / 2;
    const x = dx / width,
      z = dz / depth;
    const outline = contours[style.shape];
    const segment = Math.floor(((Math.atan2(z, x) + tau) * segments) / tau) % segments;
    const [x1, z1] = outline[segment];
    const [x2, z2] = outline[(segment + 1) % segments];
    // Each sector is bounded by the same straight edge as the widest mesh ring.
    return (x2 - x1) * (z - z1) - (z2 - z1) * (x - x1) >= -1e-10;
  }

  function mesh(shape) {
    const outline = contours[shape];
    // Scale and height of each ring from the flat landing surface to the rounded underside.
    const profile = [
      [0, 0.5],
      [0.66, 0.5],
      [0.84, 0.49],
      [0.92, 0.45],
      [0.97, 0.39],
      [0.991, 0.31],
      [0.997, 0.18],
      [1, 0.04],
      [0.995, -0.12],
      [0.98, -0.25],
      [0.93, -0.37],
      [0.83, -0.45],
      [0.64, -0.49],
      [0, -0.5],
    ];
    const rings = profile.map(([scale, y], ring) => {
      const [aboveScale, aboveY] = profile[Math.max(0, ring - 1)];
      const [belowScale, belowY] = profile[Math.min(profile.length - 1, ring + 1)];
      const vertical = belowY - aboveY,
        radial = belowScale - aboveScale;
      return outline.map(([x, z], i) => {
        if (scale === 0) return [0, y, 0, 0, Math.sign(y), 0];
        const [previousX, previousZ] = outline[(i + segments - 1) % segments];
        const [nextX, nextZ] = outline[(i + 1) % segments];
        const tangentX = nextX - previousX,
          tangentZ = nextZ - previousZ;
        const nx = -tangentZ * vertical;
        const ny = radial * (tangentZ * x - tangentX * z);
        const nz = tangentX * vertical;
        const length = Math.hypot(nx, ny, nz);
        return [x * scale, y, z * scale, nx / length, ny / length, nz / length];
      });
    });
    const vertices = [];
    for (let ring = 0; ring < rings.length - 1; ring++) {
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        const a = rings[ring][i],
          b = rings[ring][next];
        const c = rings[ring + 1][next],
          d = rings[ring + 1][i];
        if (ring > 0) vertices.push(...a, ...b, ...c);
        if (ring < rings.length - 2) vertices.push(...a, ...c, ...d);
      }
    }
    return vertices;
  }

  window.FluffPadStyles = { shapes, style, contains, mesh };
})();
