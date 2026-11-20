(() => {
  'use strict';

  const tau = 2 * Math.PI;
  const knit = -7,
    knitEnds = -8,
    woven = -9,
    knitKnot = -10,
    capeCloth = 3.48;
  const patterns = new Map();
  const mix = (a, b, t) => a + (b - a) * t;
  function smooth(a, b, value) {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  const radius = (y) => Math.sqrt(Math.max(0.0001, 0.25 - y * y)) * (1 - 0.32 * y);
  const signedPower = (x, p) => Math.sign(x) * Math.abs(x) ** p;

  // Garments are cut in body coordinates. The rear allowance fits the hedgehog's quill coat.
  function point(angle, y, loft, hedgehog) {
    const ease = hedgehog ? smooth(-0.34, 0.13, -Math.cos(angle)) : 0;
    const r = radius(y) + loft;
    return [Math.sin(angle) * r * (1 + 0.15 * ease), y, -Math.cos(angle) * r * (1 + 0.18 * ease)];
  }
  function capeCut(angle) {
    const front = smooth(-0.82, 0.62, Math.cos(angle));
    return [
      mix(0.18, 0.016, front),
      mix(-0.43, -0.108, front) - 0.016 * (0.5 + 0.5 * Math.cos(12 * angle)) ** 2,
    ];
  }
  function capePoint(angle, drop, hedgehog, trim = 0) {
    const [neck, hem] = capeCut(angle);
    const flutes = 0.5 + 0.5 * Math.cos(14 * angle + 0.38 * drop);
    const fullness = 0.4 + 0.6 * (1 - Math.cos(angle)) * 0.5;
    const lift = 0.012 + fullness * drop ** 1.5 * (0.016 + 0.058 * flutes) + trim;
    return point(angle, mix(neck, hem, drop), lift, hedgehog);
  }
  function capeStar(x, y, hedgehog) {
    const angle = Math.PI - Math.asin(x / radius(y));
    const [neck, hem] = capeCut(angle);
    return capePoint(angle, (y - neck) / (hem - neck), hedgehog, 0.003);
  }

  // A grid with shared samples gives the soft rolls and folded fabric smooth vertex normals.
  function panel(layers, color, material, columns, rows, shape) {
    const stride = columns + 1;
    const points = [];
    for (let j = 0; j <= rows; j++)
      for (let i = 0; i <= columns; i++) points.push(shape(i / columns, j / rows));
    const group = color + '/' + material;
    if (!layers.has(group)) layers.set(group, { color, material, vertices: [] });
    const out = layers.get(group).vertices;
    const verts = points.map((p, k) => {
      const i = k % stride,
        j = Math.floor(k / stride);
      const left = points[i === 0 ? k : k - 1],
        right = points[i === columns ? k : k + 1];
      const lower = points[j === 0 ? k : k - stride],
        upper = points[j === rows ? k : k + stride];
      const dx = right[0] - left[0],
        dy = right[1] - left[1],
        dz = right[2] - left[2];
      const sx = upper[0] - lower[0],
        sy = upper[1] - lower[1],
        sz = upper[2] - lower[2];
      const nx = dy * sz - dz * sy,
        ny = dz * sx - dx * sz,
        nz = dx * sy - dy * sx;
      const len = Math.hypot(nx, ny, nz) || 1;
      return [...p, nx / len, ny / len, nz / len];
    });
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < columns; i++) {
        const k = j * stride + i;
        out.push(
          ...verts[k],
          ...verts[k + 1],
          ...verts[k + stride + 1],
          ...verts[k],
          ...verts[k + stride + 1],
          ...verts[k + stride],
        );
      }
  }
  function pattern(outfit, hedgehog) {
    const key = outfit + (hedgehog ? '/quills' : '');
    if (patterns.has(key)) return patterns.get(key);
    const layers = new Map();
    const skin = (a, y, r) => point(a, y, r, hedgehog);

    // The oval cross-section closes behind the fabric and catches light on each turned edge.
    function roll(color, material, center, halfHeight, depth, start = 0, end = tau, sections = 88) {
      const crossSection = (u, v) => {
        const a = mix(start, end, u),
          t = -tau * v;
        const [height, loft] = center(a);
        return skin(
          a,
          height + halfHeight * signedPower(Math.sin(t), 0.8),
          loft + depth * signedPower(Math.cos(t), 0.85),
        );
      };
      panel(layers, color, material, sections, 12, crossSection);
      if (end - start < tau) {
        const vertices = layers.get(color + '/' + material).vertices;
        for (const u of [0, 1]) {
          const a = mix(start, end, u),
            side = u === 0 ? -1 : 1;
          const [y, loft] = center(a);
          const normal = [side * Math.cos(a), 0, side * Math.sin(a)];
          const middle = [...skin(a, y, loft), ...normal];
          for (let j = 0; j < 12; j++) {
            const step = u === 0 ? j : 12 - j;
            vertices.push(
              ...middle,
              ...crossSection(u, step / 12),
              ...normal,
              ...crossSection(u, (step - side) / 12),
              ...normal,
            );
          }
        }
      }
    }

    // Padded panels have a face, a bevel, and a return to the body along each edge.
    function pad(color, material, sample, cols = 14, rows = 14) {
      panel(layers, color, material, cols, rows, (s, t) => sample(s, t, 1));
      for (const edge of [(u) => [1 - u, 0], (u) => [1, 1 - u], (u) => [u, 1], (u) => [0, u]]) {
        panel(layers, color, material, 16, 3, (u, v) => {
          const [s, t] = edge(u);
          return sample(s, t, 1 - v);
        });
      }
    }

    if (outfit === 'scarf') {
      const neck = (a) => -0.059 + 0.023 * Math.sin(a + 0.26) + 0.034 * (1 - Math.cos(a));
      panel(layers, 'dye', knit, 104, 32, (u, v) => {
        const a = u * tau,
          t = -v * tau;
        const side = signedPower(Math.sin(t), 0.77),
          outer = Math.cos(t);
        const crease = side - 0.24 * Math.sin(a + 0.4);
        const folds = 0.011 * Math.exp(-crease * crease * 13) * Math.max(0, outer);
        return skin(a, neck(a) + 0.055 * side, 0.02 + 0.036 * signedPower(outer, 0.83) - folds);
      });
      for (const [angle, length, bend, width, lift] of [
        [-0.71, 0.156, -0.17, 0.104, 0.024],
        [-0.47, 0.213, 0.15, 0.126, 0.041],
      ]) {
        const top = neck(angle) - 0.012;
        function end(s, t, face) {
          const a =
            angle +
            bend * t +
            0.045 * Math.sin(t * Math.PI) +
            (s - 0.5) * width * (0.93 + 0.26 * t) * 2;
          const y = top - length * t + 0.021 * t ** 4 * (s - 0.45) + 0.008 * (2 * s - 1) ** 2 * t ** 6;
          const ridge = Math.sin(s * Math.PI) * (0.009 + 0.004 * Math.cos(t * 5));
          return skin(a, y, lift + 0.012 * (1 - t) + 0.02 * Math.sin(t * 4) + face * (0.014 + ridge));
        }
        pad('dye', knitEnds, end);
        for (const [lo, hi] of [
          [0.72, 0.765],
          [0.822, 0.898],
        ]) {
          panel(layers, 'light', knitEnds, 14, 3, (s, t) => end(s, mix(lo, hi, t), 1.11));
        }
        // Four doubled yarn tassels hang from the bound edge of each end.
        for (let i = 0; i < 4; i++) {
          const s = (i + 0.6) / 4.2;
          const fin = angle + bend + (s - 0.5) * width * 2.52;
          const y = end(s, 1, 1)[1];
          panel(layers, i % 2 ? 'dye' : 'light', knitEnds, 8, 7, (u, v) => {
            const t = -tau * u,
              taper = 0.002 + 0.005 * Math.sin(Math.PI * (0.1 + 0.89 * v));
            return skin(
              fin + 0.025 * Math.sin(2 * v + i) + taper * 2 * Math.cos(t),
              y - v * (0.028 + 0.011 * (i % 2)),
              lift + 0.004 + Math.sin(t) * taper,
            );
          });
        }
      }
      // The tie cinches the two ends; its curved lower lip casts a shadow over them.
      pad('tie', knitKnot, (s, t, face) => {
        const a = -0.58 + (s - 0.5) * (0.29 + 0.064 * Math.cos(tau * t)) + 0.088 * (t - 0.5);
        const y = neck(a) + 0.059 - 0.107 * t + 0.014 * Math.sin(Math.PI * s);
        return skin(
          a,
          y,
          0.042 + face * (0.032 + 0.039 * Math.sin(Math.PI * s) * Math.sin(Math.PI * t)),
        );
      });
    } else if (outfit === 'denim') {
      roll('dye', woven, () => [-0.245, 0.003], 0.018, 0.012);
      // A pocket's folded lip sits proud of the bib; the base tapers to a point.
      for (const [mid, width, top, length] of [
        [0, 0.48, -0.075, 0.132],
        [2.62, 0.41, -0.25, 0.101],
        [-2.62, 0.41, -0.25, 0.101],
      ]) {
        const pocket = (s, t, face) => {
          const a = mid + (s - 0.5) * width * (1 - 0.15 * t);
          const y = top - length * t + 0.029 * Math.abs(2 * s - 1) * t ** 2;
          return skin(a, y, 0.008 + face * (0.01 + 0.013 * Math.sin(Math.PI * s) * (1 - 0.6 * t)));
        };
        pad('dye', woven, pocket);
        panel(layers, 'light', woven, 16, 3, (s, t) => pocket(s, 0.035 + 0.085 * t, 1.12));
        for (let i = 0; i < 12; i++) {
          for (const side of [0.06, 0.92])
            panel(layers, 'thread', woven, 1, 2, (s, t) =>
              pocket(side + 0.022 * s, 0.14 + (i + t * 0.56) * 0.066, 1.12),
            );
          panel(layers, 'thread', woven, 2, 1, (s, t) =>
            pocket(0.065 + (i + s * 0.58) * 0.073, 0.925 + t * 0.02, 1.13),
          );
        }
      }
    } else if (outfit === 'coat') {
      roll('light', woven, () => [-0.027, 0.005], 0.012, 0.018);
      for (const side of [-1, 1]) {
        pad(
          'light',
          woven,
          (s, t, face) => {
            const along = side > 0 ? s : 1 - s;
            const a = side * (0.033 + 1.24 * along);
            const top = -0.01 + 0.015 * along;
            const lapel =
              0.014 + 0.093 * Math.sin(Math.PI * (0.14 + 0.86 * along)) * (1 - 0.47 * along);
            return skin(
              a,
              top - t * lapel,
              0.007 + face * (0.016 + 0.014 * Math.sin(t * Math.PI)) + 0.009 * t,
            );
          },
          20,
          8,
        );
      }
      // The collapsed rain hood has a scooped opening, a rounded pouch and a folded lip.
      const hood = (s, t, face) => {
        const side = 2 * s - 1;
        const a = Math.PI + side * (0.89 - 0.43 * t * t);
        const scoop = 1 - side * side;
        const y = mix(0.014 - 0.046 * scoop, -0.135 - 0.11 * scoop, t);
        return skin(a, y, 0.009 + face * (0.016 + scoop * (0.042 + 0.045 * Math.sin(t * Math.PI))));
      };
      pad('dye', woven, hood, 34, 18);
      panel(layers, 'shade', woven, 32, 5, (s, t) => hood(s, t * 0.17, 1.035));
      panel(layers, 'light', woven, 32, 4, (s, t) => hood(s, 0.12 + t * 0.07, 1.08));
      for (const side of [-1, 1]) {
        pad('light', woven, (s, t, face) => {
          const a = side * 0.44 + (s - 0.5) * 0.25;
          return skin(a, -0.25 + 0.024 * side * (s - 0.5) - 0.029 * t, 0.009 + 0.012 * face);
        });
      }
    } else if (outfit === 'cape') {
      panel(layers, 'dye', capeCloth, 128, 22, (u, t) => capePoint(u * tau, t, hedgehog));
      for (const [edge, width, height] of [
        [0, 0.009, 0.006],
        [1, 0.01, 0.006],
      ]) {
        panel(layers, 'gold', woven, 128, 8, (u, t) => {
          const a = u * tau;
          const p = capePoint(a, edge, hedgehog, 0.003 + width * Math.cos(t * tau));
          p[1] -= Math.sin(t * tau) * height;
          return p;
        });
      }
    } else if (outfit === 'aviator') {
      const neck = (a) => {
        const x = Math.sin(a) * 0.49,
          z = -Math.cos(a) * 0.49;
        return -0.05 + 0.27 * Math.min(Math.abs(x), 0.34) + 0.09 * smooth(0.03, 0.29, z);
      };
      // A shearling collar opens on either side of the zip, deepening into two folded lapels.
      roll(
        'wool',
        -1,
        (a) => [
          neck(a) - 0.013 - 0.024 * Math.exp(-((Math.min(a, tau - a) - 0.4) ** 2) / 0.041),
          0.015,
        ],
        0.03,
        0.024,
        0.082,
        tau - 0.082,
      );
      roll('shade', woven, () => [-0.379, 0.004], 0.018, 0.013);
    }
    const result = [...layers.values()].map((l) => ({ ...l, vertices: new Float32Array(l.vertices) }));
    patterns.set(key, result);
    return result;
  }
  function cuffMesh() {
    const layers = new Map();
    panel(layers, 'rib', knit, 144, 12, (u, v) => {
      const a = tau * u,
        t = -tau * v;
      const rib = 0.0045 * Math.cos(a * 36);
      const r = 0.464 + 0.034 * signedPower(Math.cos(t), 0.78) + rib;
      return [r * Math.sin(a), 0.488 * signedPower(Math.sin(t), 0.75), -r * Math.cos(a)];
    });
    return layers.values().next().value.vertices;
  }
  let stockinette;
  function knitTile() {
    if (stockinette) return stockinette;
    const tile = document.createElement('canvas');
    tile.width = tile.height = 128;
    const ctx = tile.getContext('2d');
    ctx.fillStyle = '#484848';
    ctx.fillRect(0, 0, 128, 128);
    ctx.lineCap = 'round';
    // Four columns of interlocking knit loops. Each strand has a shaded edge and a rounded crown.
    for (let row = -1; row <= 4; row++)
      for (let col = -1; col <= 4; col++) {
        const x = 32 * col + 16,
          y = 32 * row + 4;
        for (const side of [-1, 1]) {
          for (const [width, shade, shift] of [
            [13, '#575757', 1.2],
            [10.5, '#929292', 0],
            [5.6, '#c6c6c6', -1.4],
            [2.1, '#d5d5d5', -2],
          ]) {
            ctx.beginPath();
            ctx.moveTo(x + side * 12 + shift, y - 6);
            ctx.bezierCurveTo(
              x + side * 19 + shift,
              y + 8,
              x + side * 2 + shift,
              y + 21,
              x + side * 2 + shift,
              y + 29,
            );
            ctx.lineWidth = width;
            ctx.strokeStyle = shade;
            ctx.stroke();
          }
        }
      }
    stockinette = tile;
    return tile;
  }
  window.FluffOutfits = { pattern, capeStar, knitTile, cuffMesh };
})();
