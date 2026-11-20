(() => {
  'use strict';

  const tau = 2 * Math.PI;
  const finishes = { membrane: -12, spar: -13, feather: -14, silk: -15, aurora: -16 };
  const cache = new Map();
  const plus = (a, b) => a.map((x, i) => x + b[i]);
  const minus = (a, b) => a.map((x, i) => x - b[i]);
  const scale = (a, k) => a.map((x) => x * k);
  const cross = ([x, y, z], [a, b, c]) => [y * c - z * b, z * a - x * c, x * b - y * a];
  function unit(v, fallback = [0, 0, 1]) {
    const length = Math.hypot(...v);
    return length > 1e-10 ? scale(v, 1 / length) : fallback;
  }
  function cubic(a, b, c, d, t) {
    const u = 1 - t;
    return a.map(
      (x, i) => u * u * u * x + 3 * u * u * t * b[i] + 3 * u * t * t * c[i] + t * t * t * d[i],
    );
  }
  const mix = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

  function build(design) {
    const batches = new Map();
    function batch(color, finish) {
      const key = finish + '/' + color;
      if (!batches.has(key)) batches.set(key, { color, material: finishes[finish], vertices: [] });
      return batches.get(key).vertices;
    }
    function triangle(out, a, b, c) {
      const ux = b[0] - a[0],
        uy = b[1] - a[1],
        uz = b[2] - a[2];
      const vx = c[0] - a[0],
        vy = c[1] - a[1],
        vz = c[2] - a[2];
      const nx = uy * vz - uz * vy,
        ny = uz * vx - ux * vz,
        nz = ux * vy - uy * vx;
      if (nx * nx + ny * ny + nz * nz < 1e-24) return;
      const outward = nx * (a[3] + b[3] + c[3]) + ny * (a[4] + b[4] + c[4]) + nz * (a[5] + b[5] + c[5]);
      if (outward < 0) out.push(...a, ...c, ...b);
      else out.push(...a, ...b, ...c);
    }
    function quad(out, a, b, c, d) {
      triangle(out, a, b, c);
      triangle(out, a, c, d);
    }

    // Curved, double-sided fabric with a narrow cut edge. Coordinate +Z faces the follow camera.
    function sheet(color, finish, columns, rows, point, thickness = 0.012) {
      const out = batch(color, finish),
        stride = columns + 1,
        points = [],
        upper = [],
        lower = [];
      for (let j = 0; j <= rows; j++)
        for (let i = 0; i <= columns; i++) points.push(point(i / columns, j / rows));
      for (let k = 0; k < points.length; k++) {
        const i = k % stride,
          j = Math.floor(k / stride);
        const du = minus(points[i === columns ? k : k + 1], points[i === 0 ? k : k - 1]);
        const dv = minus(points[j === rows ? k : k + stride], points[j === 0 ? k : k - stride]);
        let n = unit(cross(du, dv));
        if (n[2] < 0) n = scale(n, -1);
        const offset = scale(n, thickness * 0.5);
        upper.push([...plus(points[k], offset), ...n]);
        lower.push([...minus(points[k], offset), ...scale(n, -1)]);
      }
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < columns; i++) {
          const a = j * stride + i,
            b = a + 1,
            c = b + stride,
            d = a + stride;
          quad(out, upper[a], upper[b], upper[c], upper[d]);
          quad(out, lower[d], lower[c], lower[b], lower[a]);
        }
      function hem(a, b, inside) {
        const normal = unit(cross(minus(points[b], points[a]), minus(upper[a].slice(0, 3), points[a])));
        const toInside = minus(points[inside], points[a]);
        const outward =
          normal.reduce((sum, x, i) => sum + x * toInside[i], 0) > 0 ? scale(normal, -1) : normal;
        const edge = (v) => [...v.slice(0, 3), ...outward];
        quad(out, edge(upper[a]), edge(lower[a]), edge(lower[b]), edge(upper[b]));
      }
      for (let i = 0; i < columns; i++) {
        hem(i, i + 1, i + stride);
        const a = rows * stride + i;
        hem(a, a + 1, a - stride);
      }
      for (let j = 0; j < rows; j++) {
        const a = j * stride;
        hem(a, a + stride, a + 1);
        hem(a + columns, a + columns + stride, a + columns - 1);
      }
    }

    function tube(color, finish, steps, path, radius, depthRatio = 1) {
      const out = batch(color, finish),
        rings = [],
        centers = [],
        tangents = [];
      const sides = 8;
      const width = typeof radius === 'function' ? radius : () => radius;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps,
          a = Math.max(0, t - 0.001),
          b = Math.min(1, t + 0.001);
        const delta = minus(path(b), path(a));
        const tangent = unit(delta, [1, 0, 0]);
        const axis = unit([-tangent[1], tangent[0], 0], [1, 0, 0]);
        const deep = cross(tangent, axis),
          center = path(t),
          ring = [];
        const slope = (width(b) - width(a)) / Math.max(0.0001, Math.hypot(...delta));
        for (let j = 0; j < sides; j++) {
          const c = Math.cos((tau * j) / sides),
            s = Math.sin((tau * j) / sides);
          const radial = plus(scale(axis, c), scale(deep, s * depthRatio));
          const normal = unit(
            minus(plus(scale(axis, c), scale(deep, s / depthRatio)), scale(tangent, slope)),
          );
          ring.push([...plus(center, scale(radial, width(t))), ...normal]);
        }
        centers.push(center);
        tangents.push(tangent);
        rings.push(ring);
      }
      for (let i = 0; i < steps; i++)
        for (let j = 0; j < sides; j++) {
          const k = (j + 1) % sides;
          quad(out, rings[i][j], rings[i][k], rings[i + 1][k], rings[i + 1][j]);
        }
      for (const i of [0, steps]) {
        const n = scale(tangents[i], i === 0 ? -1 : 1);
        for (let j = 0; j < sides; j++)
          triangle(
            out,
            [...centers[i], ...n],
            [...rings[i][j].slice(0, 3), ...n],
            [...rings[i][(j + 1) % sides].slice(0, 3), ...n],
          );
      }
    }
    design({ sheet, tube });
    return [...batches.values()].map((b) => ({ ...b, vertices: new Float32Array(b.vertices) }));
  }

  function feather(model) {
    function plume(start, tip, breadth, lift, color, shaft) {
      const [x0, y0, z0] = start;
      const [x1, y1, z1] = tip;
      const dx = x1 - x0;
      const dy = y1 - y0;

      function sample(u, v) {
        const arc = Math.sin(Math.PI * u);
        const tangentY = dy + lift * Math.PI * Math.cos(Math.PI * u);
        const tangentLength = Math.hypot(dx, tangentY);
        const edge = 2 * v - 1;
        const width = 0.0004 + breadth * arc ** 0.7 * (1.14 - 0.33 * u);
        const nick = shaft
          ? 0.22 * Math.exp(-(((u - (edge > 0 ? 0.71 : 0.83)) / 0.037) ** 2)) * Math.abs(edge) ** 3
          : 0;
        const vane = edge * width * (1 + 0.22 * edge) * (1 - nick);
        return [
          x0 + dx * u - (vane * tangentY) / tangentLength,
          y0 + dy * u + lift * arc + (vane * dx) / tangentLength,
          z0 + (z1 - z0) * u ** 1.32 + arc * (0.02 * (1 - edge ** 2) - 0.02 * edge),
        ];
      }

      model.sheet(color, 'feather', 23, 6, sample, 0.013);
      if (!shaft) return;
      for (const face of [-1, 1]) {
        model.tube(
          shaft,
          'feather',
          17,
          (t) => {
            const [x, y, z] = sample(0.12 + 0.82 * t, 0.5);
            return [x, y, z + face * 0.008];
          },
          (t) => 0.0008 + 0.0066 * (1 - t) ** 0.9,
          0.74,
        );
      }
    }

    for (const [start, tip, breadth, lift, color, shaft] of [
      [[0.08, 0.12, 0.005], [0.95, 0.71, 0.246], 0.089, 0.106, '#fff1d7', '#dfc395'],
      [[0.09, 0.08, 0.021], [1.025, 0.49, 0.272], 0.093, 0.092, '#fae6c6', '#dac098'],
      [[0.1, 0.035, 0.037], [1.016, 0.25, 0.291], 0.096, 0.08, '#fff0d6', '#dfc59d'],
      [[0.08, 0, 0.053], [0.92, 0.015, 0.291], 0.094, 0.064, '#f7e1bf', '#d7b991'],
      [[0.06, -0.02, 0.067], [0.78, -0.195, 0.26], 0.088, 0.052, '#fae8cc', '#dac09b'],
      [[0.045, -0.035, 0.075], [0.615, -0.33, 0.215], 0.079, 0.026, '#efd8b6', '#cfae86'],
      [[0.025, -0.054, 0.076], [0.418, -0.386, 0.168], 0.067, 0.008, '#ecd1ae', '#c9a581'],
    ]) {
      plume(start, tip, breadth, lift, color, shaft);
    }

    for (const [x, y, tipX, tipY, centerZ, tipZ, breadth, lift, color] of [
      [0.007, 0.065, 0.63, 0.539, 0.028, 0.137, 0.083, 0.094, '#fff6e3'],
      [0.019, 0.031, 0.677, 0.345, 0.046, 0.175, 0.088, 0.089, '#fbead0'],
      [0.025, 0.01, 0.651, 0.155, 0.065, 0.182, 0.083, 0.066, '#fff1d7'],
      [0.017, -0.023, 0.566, -0.014, 0.078, 0.182, 0.076, 0.049, '#f6e1c1'],
      [0.009, -0.046, 0.432, -0.175, 0.084, 0.155, 0.066, 0.031, '#f2dbbc'],
      [0.001, -0.046, 0.289, -0.242, 0.075, 0.136, 0.055, 0.009, '#e9cfb3'],
    ]) {
      for (const face of [-1, 1]) {
        plume([x, y, centerZ + face * 0.033], [tipX, tipY, tipZ + face * 0.064], breadth, lift, color);
      }
    }
  }
  function moth(model) {
    const forewing = [
      [0.004, -0.038],
      [0.105, 0.111],
      [0.265, 0.359],
      [0.453, 0.552],
      [0.712, 0.692],
      [0.913, 0.743],
      [1.019, 0.717],
      [1.033, 0.642],
      [0.974, 0.514],
      [0.91, 0.402],
      [0.831, 0.299],
      [0.703, 0.173],
      [0.563, 0.079],
      [0.364, -0.001],
      [0.146, -0.056],
    ];
    const hindwing = [
      [0.012, -0.048],
      [0.108, 0.043],
      [0.264, 0.153],
      [0.474, 0.214],
      [0.675, 0.181],
      [0.76, 0.094],
      [0.782, -0.015],
      [0.74, -0.15],
      [0.669, -0.246],
      [0.565, -0.331],
      [0.455, -0.368],
      [0.341, -0.401],
      [0.24, -0.365],
      [0.14, -0.311],
      [0.065, -0.213],
    ];

    // Interpolate the rounded margins while keeping the two wing lobes asymmetrical.
    function margin(points, u) {
      const count = points.length;
      const step = u * count;
      const i = Math.floor(step);
      const t = step - i;
      const previous = points[(i + count - 1) % count];
      const start = points[i % count];
      const end = points[(i + 1) % count];
      const next = points[(i + 2) % count];
      return start.map((a, axis) => {
        const b = end[axis];
        const startTangent = (b - previous[axis]) * 0.41;
        const endTangent = (next[axis] - a) * 0.41;
        return (
          a +
          t *
            (startTangent +
              t *
                (3 * (b - a) -
                  2 * startTangent -
                  endTangent +
                  t * (2 * (a - b) + startTangent + endTangent)))
        );
      });
    }

    function lobe(points, center, depth, palette, veins, spot) {
      const [cx, cy] = center;
      const surface = (x, y) => [x, y, depth(x, y)];
      const scallop = (u) =>
        Math.sin(tau * (3 * u + 0.17)) * 0.022 + Math.sin(tau * (7 * u + 0.29)) * 0.012;

      function contour(color, inner, outer, wave, rows, thickness) {
        model.sheet(
          color,
          'silk',
          60,
          rows,
          (u, v) => {
            const [x, y] = margin(points, u);
            const radius = inner + (outer - inner) * v + wave * scallop(u) * (1 - v);
            return surface(cx + (x - cx) * radius, cy + (y - cy) * radius);
          },
          thickness,
        );
      }

      contour(palette.field, 0, 1, 0, 14, 0.014);
      contour(palette.edge, 0.86, 1, 1, 4, 0.022);
      contour(palette.band, 0.745, 0.888, 0.92, 4, 0.026);
      contour(palette.stripe, 0.762, 0.799, 0.8, 3, 0.03);

      const [rootX, rootY] = [0.072, -0.025];
      for (const [endX, endY, bend] of veins) {
        model.sheet(
          palette.vein,
          'silk',
          18,
          2,
          (u, v) => {
            const x = rootX + (endX - rootX) * u;
            const y = rootY + (endY - rootY) * u + bend * u * (1 - u);
            return surface(x, y + (v - 0.5) * (0.003 + 0.011 * (1 - u)));
          },
          0.019,
        );
      }

      const [sx, sy, width, height, angle] = spot;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      function eyespot(color, inner, outer, thickness, highlight = false) {
        model.sheet(
          color,
          'silk',
          36,
          4,
          (u, v) => {
            const theta = -tau * u;
            const radius = (inner + (outer - inner) * v) * (1 + 0.045 * Math.sin(3 * theta));
            const x = width * (radius * Math.cos(theta) - (highlight ? 0.12 : 0));
            const y = height * (radius * Math.sin(theta) + (highlight ? 0.1 : 0));
            return surface(sx + c * x - s * y, sy + s * x + c * y);
          },
          thickness,
        );
      }

      eyespot(palette.eyeEdge, 0.78, 1, 0.034);
      eyespot('#edc2a5', 0.56, 0.78, 0.034);
      eyespot('#a96e92', 0.42, 0.56, 0.034);
      eyespot('#633c66', 0, 0.42, 0.034);
      eyespot('#f2d2cd', 0, 0.117, 0.04, true);
    }

    lobe(
      hindwing,
      [0.39, -0.118],
      (x, y) => 0.207 * x - 0.068 * y + 0.036 * Math.sin(Math.PI * x) - 0.013,
      {
        field: '#b399c7',
        edge: '#705382',
        band: '#9d76ad',
        stripe: '#d4acd0',
        vein: '#9976a6',
        eyeEdge: '#79507e',
      },
      [
        [0.622, -0.057, 0.061],
        [0.648, -0.177, 0.038],
        [0.537, -0.282, -0.01],
        [0.365, -0.323, -0.057],
        [0.239, -0.306, -0.073],
      ],
      [0.465, -0.166, 0.116, 0.095, -0.45],
    );

    lobe(
      forewing,
      [0.567, 0.303],
      (x, y) => 0.233 * x + 0.067 * y + 0.059 * Math.sin(Math.PI * x) + 0.01,
      {
        field: '#c88fab',
        edge: '#785079',
        band: '#a76d93',
        stripe: '#dfacc1',
        vein: '#a96d94',
        eyeEdge: '#80466f',
      },
      [
        [0.743, 0.604, 0.245],
        [0.903, 0.604, 0.138],
        [0.899, 0.481, 0.05],
        [0.793, 0.318, 0.007],
        [0.671, 0.204, -0.076],
        [0.511, 0.105, -0.093],
      ],
      [0.705, 0.386, 0.142, 0.113, 0.64],
    );
  }
  function aurora(model) {
    function ribbon([x0, y0, z0], [x1, y1, z1], breadth, sweep) {
      const dx = x1 - x0;
      const dy = y1 - y0;
      return (u, v) => {
        const arc = Math.sin(Math.PI * u);
        const wave = Math.sin(2 * Math.PI * u);
        const edge = 2 * v - 1;
        const tangentY =
          dy + sweep * Math.PI * (Math.cos(Math.PI * u) - 0.62 * Math.cos(2 * Math.PI * u));
        const tangentLength = Math.hypot(dx, tangentY);
        const width = (0.001 + breadth * arc ** 0.68 * (1.23 - 0.49 * u)) * (1 + 0.14 * wave);
        const offset = edge * width;
        const fold = (0.035 * edge + 0.023 * Math.sin(10 * u + 2.8 * edge)) * arc;
        return [
          x0 + dx * u - (offset * tangentY) / tangentLength,
          y0 + dy * u + sweep * (arc - 0.31 * wave) + (offset * dx) / tangentLength,
          z0 + (z1 - z0) * u ** 1.35 + fold,
        ];
      };
    }

    function sparkle(sample, u, v, length, width, color) {
      for (const face of [-1, 1]) {
        model.sheet(
          color,
          'aurora',
          12,
          4,
          (s, t) => {
            const ray = 2 * s - 1;
            const halfWidth = width * (1 - Math.abs(ray)) ** 2.3 + 0.0006;
            const [x, y, z] = sample(u + length * ray, v + (2 * t - 1) * halfWidth);
            return [x, y, z + face * 0.0075];
          },
          0.0026,
        );
      }
    }

    for (const [start, tip, breadth, sweep, colors, sparkles] of [
      [
        [0.003, 0.105, 0.008],
        [0.961, 0.711, 0.219],
        0.117,
        0.106,
        ['#704d9f', '#9463ca', '#c689e7', '#efb9f7', '#aa78d9'],
        [
          [0.593, 0.59, 0.039, 0.15, '#fff0ba'],
          [0.826, 0.59, 0.016, 0.084, '#ffe5f8'],
        ],
      ],
      [
        [-0.007, 0.035, 0.047],
        [1.032, 0.45, 0.297],
        0.143,
        0.132,
        ['#327f95', '#46a5af', '#7ce3c8', '#c2ffda', '#62c6c1'],
        [
          [0.472, 0.49, 0.053, 0.175, '#ffe9a4'],
          [0.765, 0.56, 0.024, 0.105, '#e5fff0'],
        ],
      ],
      [
        [-0.006, -0.023, 0.034],
        [0.933, 0.149, 0.191],
        0.144,
        0.104,
        ['#486c9e', '#589cce', '#8dd9ed', '#c1f5fe', '#72bae5'],
        [[0.665, 0.39, 0.021, 0.089, '#d6f6ff']],
      ],
      [
        [0.003, -0.069, 0.009],
        [0.701, -0.245, 0.159],
        0.112,
        0.065,
        ['#59539a', '#7676bf', '#9fafe7', '#d2d8fa', '#9c8ed7'],
        [[0.58, 0.52, 0.016, 0.078, '#f8dafd']],
      ],
    ]) {
      const sample = ribbon(start, tip, breadth, sweep);
      const edges = [0, 0.19, 0.38, 0.71, 0.82, 1];
      colors.forEach((color, index) => {
        const lo = edges[index];
        const hi = edges[index + 1];
        model.sheet(
          color,
          'aurora',
          26,
          index === 2 ? 4 : 2,
          (u, v) => sample(u, lo + (hi - lo) * v),
          0.013,
        );
      });
      for (const mark of sparkles) sparkle(sample, ...mark);
    }
  }
  function tulippetals(model) {
    const veins = [
      [0.87, 0.035, 0.027],
      [0.73, -0.35, 0.017],
      [0.78, 0.3, 0.017],
    ];
    function petal([root, bend, shoulder, tip], breadth, cup, color, veinColor) {
      function sample(u, v) {
        const center = cubic(root, bend, shoulder, tip, u);
        const tangent = unit(
          minus(
            cubic(root, bend, shoulder, tip, Math.min(1, u + 0.001)),
            cubic(root, bend, shoulder, tip, Math.max(0, u - 0.001)),
          ),
        );
        const edge = 2 * v - 1;
        // Tulip petals open wide toward their tips, with one lip curling back a little farther.
        const arch = Math.sin(Math.PI * u);
        const width = 0.002 + breadth * arch ** 0.56 * (0.63 + 0.64 * u);
        const offset = edge * width * (1 + 0.13 * edge);
        return [
          center[0] - tangent[1] * offset,
          center[1] + tangent[0] * offset,
          center[2] + arch * (cup * (0.45 * edge ** 2 + 0.55 * edge ** 4) + 0.024 * edge),
        ];
      }

      model.sheet(color, 'silk', 26, 10, sample, 0.014);
      for (const [length, splay, width] of veins) {
        // Raised strips leave the veins visible on both faces of the petal.
        model.sheet(
          veinColor,
          'silk',
          24,
          2,
          (u, v) => {
            const track = 0.5 + splay * Math.sin(u * Math.PI * 0.69) ** 1.35;
            const taper = 0.004 + width * Math.sin(u * Math.PI) ** 0.85;
            return sample(0.1 + (length - 0.1) * u, track + (2 * v - 1) * taper);
          },
          0.024,
        );
      }
    }

    petal(
      [
        [-0.035, 0.012, -0.022],
        [0.143, 0.138, 0.04],
        [0.255, 0.672, 0.094],
        [0.537, 0.77, 0.211],
      ],
      0.142,
      0.092,
      '#a778c1',
      '#cda6df',
    );
    petal(
      [
        [-0.018, -0.005, 0.009],
        [0.24, 0.089, 0.095],
        [0.736, 0.563, 0.152],
        [1.01, 0.542, 0.3],
      ],
      0.194,
      0.131,
      '#c29ade',
      '#e4c6ef',
    );
    petal(
      [
        [-0.022, -0.048, 0.055],
        [0.237, -0.059, 0.141],
        [0.753, 0.201, 0.244],
        [1.063, 0.115, 0.342],
      ],
      0.175,
      0.125,
      '#d7b2eb',
      '#f1d9f5',
    );
    petal(
      [
        [-0.045, -0.046, 0.088],
        [0.16, -0.079, 0.204],
        [0.441, -0.229, 0.29],
        [0.704, -0.308, 0.245],
      ],
      0.127,
      0.075,
      '#b187d0',
      '#d5ade5',
    );
  }
  function dragon(model) {
    const wrist = [0.45, 0.535, 0.145];
    const elbow = [0.214, 0.112, 0.061];
    const root = [-0.06, -0.083, -0.073];
    // The upper arm doubles back at the elbow. The long fingers all fan from a single wrist.
    const arm = (t) =>
      t < 0.65
        ? cubic(wrist, [0.376, 0.43, 0.126], [0.295, 0.203, 0.068], elbow, t / 0.65)
        : cubic(elbow, [0.16, 0.08, 0.05], [0.025, 0.005, -0.021], root, (t - 0.65) / 0.35);
    const ray = (first, second, end) => (t) => cubic(wrist, first, second, end, t);
    const fingers = [
      arm,
      ray([0.401, 0.323, 0.182], [0.345, -0.014, 0.193], [0.245, -0.296, 0.15]),
      ray([0.52, 0.364, 0.204], [0.59, 0.029, 0.273], [0.621, -0.279, 0.29]),
      ray([0.632, 0.441, 0.242], [0.827, 0.207, 0.326], [0.943, -0.078, 0.344]),
      ray([0.648, 0.612, 0.216], [0.932, 0.509, 0.303], [1.115, 0.303, 0.324]),
    ];
    const colors = ['#bc8faa', '#d4a3bb', '#c69ec4', '#b7a0cb'];
    for (let bay = 0; bay < fingers.length - 1; bay++) {
      const from = fingers[bay],
        to = fingers[bay + 1];
      function web(u, v) {
        const arch = Math.sin(Math.PI * u);
        // The free hem recedes towards the wrist between each pair of pointed digits.
        const t = v - (0.22 + 0.028 * bay) * Math.pow(v, 2.15) * arch;
        const p = mix(from(t), to(t), u);
        p[2] += (0.056 * Math.sin(Math.PI * v) + 0.018 * v) * arch;
        return p;
      }
      model.sheet(colors[bay], 'membrane', 16, 19, web, 0.008);
      // A fine bound hem preserves the scalloped silhouette from the opposite side as well.
      model.tube(
        '#95759f',
        'membrane',
        16,
        (u) => web(u, 1),
        (u) => 0.005 + 0.002 * Math.sin(u * Math.PI),
        0.78,
      );
    }
    model.tube('#725d87', 'spar', 26, arm, (t) => 0.033 + 0.014 * t - 0.005 * Math.sin(t * Math.PI));
    for (let i = 1; i < fingers.length; i++) {
      const leading = i === fingers.length - 1;
      const base = leading ? 0.036 : 0.023;
      model.tube(
        leading ? '#715a85' : '#806185',
        'spar',
        25,
        fingers[i],
        (t) => 0.0025 + (base - 0.0025) * (1 - t) ** 0.64,
        leading ? 1.04 : 1.32,
      );
    }
    // A single small recurved thumb at the wrist; the joint underneath belongs to the arm.
    model.tube(
      '#eed6b0',
      'spar',
      12,
      (t) =>
        cubic(
          [0.438, 0.516, 0.145],
          [0.421, 0.563, 0.158],
          [0.424, 0.62, 0.159],
          [0.468, 0.662, 0.153],
          t,
        ),
      (t) => 0.03 * (1 - t) ** 0.85 + 0.0008,
    );
  }

  const designs = { feather, moth, aurora, dragon, tulippetals };
  // The eyespots, sparkles, and claw keep their original colors beside the dyed fabric.
  const dyePalettes = {
    feather: ['#fae6c6'],
    moth: ['#c88fab', '#edc2a5', '#a96e92', '#633c66', '#f2d2cd'],
    aurora: ['#7ce3c8', '#fff0ba', '#ffe5f8', '#ffe9a4', '#e5fff0', '#d6f6ff', '#f8dafd'],
    dragon: ['#c69ec4', '#eed6b0'],
    tulippetals: ['#c29ade'],
  };
  function layers(kind) {
    if (!cache.has(kind)) cache.set(kind, build(designs[kind]));
    return cache.get(kind);
  }
  // A bounding sphere around the orbit target fits the whole span at every studio rotation.
  const lensCache = new Map();
  const restSweep = 0.055;
  function previewLens(kind, shoulder, targetY, distance) {
    const key = [kind, ...shoulder, targetY, distance].join('/');
    if (lensCache.has(key)) return lensCache.get(key);
    const c = Math.cos(restSweep),
      s = Math.sin(restSweep);
    let radiusSq = 0;
    for (const { vertices } of layers(kind))
      for (let i = 0; i < vertices.length; i += 6) {
        const x = shoulder[0] + c * vertices[i] - s * vertices[i + 2];
        const y = shoulder[1] - targetY + vertices[i + 1];
        const z = shoulder[2] + s * vertices[i] + c * vertices[i + 2];
        radiusSq = Math.max(radiusSq, x * x + y * y + z * z);
      }
    const lens = 0.93 * Math.sqrt((distance * distance) / radiusSq - 1);
    if (lensCache.size >= 96) lensCache.delete(lensCache.keys().next().value);
    lensCache.set(key, lens);
    return lens;
  }
  window.FluffWings = { layers, dyePalettes, previewLens, restSweep };
})();
