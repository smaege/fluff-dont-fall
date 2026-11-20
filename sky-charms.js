(() => {
  'use strict';

  const tau = 2 * Math.PI;
  const origin = [0, 0, 0];
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const palettes = [
    ['#efc685', '#f6d39c', '#edb988'],
    ['#e3a0b0', '#d8aad1', '#efada8'],
  ];
  const routeSeeds = {
    cloud: 9, candy: 41, night: 62, grove: 87, reef: 103, orchard: 126, frost: 153,
    rose: 179, meadow: 207, lagoon: 229, tulip: 263,
  };
  const routePalettes = {
    orchard: [
      ['#efbf77', '#f9dc9c', '#c3d796'],
      ['#ef9baa', '#d98998', '#f5beb2'],
    ],
    frost: [
      ['#b0f3eb', '#b9dcf8', '#d0eaf9'],
      ['#baa6ec', '#c4b9f4', '#a4ddd9'],
    ],
    rose: [
      ['#f6c796', '#ffe2bd', '#ffd1bf'],
      ['#ef95b5', '#f3b1d7', '#eaa2b9'],
    ],
    meadow: [
      ['#f8e6a0', '#dcf3ab', '#c7e5a0'],
      ['#a4ddbc', '#bcdea4', '#e7c0a2'],
    ],
    lagoon: [
      ['#abe9ef', '#b4e7fb', '#b9d8f9'],
      ['#8eb9ed', '#b3c1f4', '#a3d8f5'],
    ],
    tulip: [
      ['#eed3f2', '#eee2a7', '#e1cbf3'],
      ['#ca9de7', '#d9a7ea', '#b1a7e6'],
    ],
  };
  const far = 76;
  const lens = 1.39;

  function starOutline() {
    const corners = Array.from({ length: 10 }, (_, index) => {
      const angle = Math.PI / 2 + (index * tau) / 10;
      const radius = index % 2 ? 0.255 : 0.54;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    });
    return corners.flatMap((corner, index) => {
      const previous = corners[(index + 9) % 10];
      const next = corners[(index + 1) % 10];
      const rounding = index % 2 ? 0.21 : 0.18;
      return Array.from({ length: 4 }, (_, sample) => {
        const t = sample / 3;
        return corner.map((coordinate, axis) => {
          const enter = (previous[axis] - coordinate) * (1 - t) ** 2;
          const exit = (next[axis] - coordinate) * t ** 2;
          return coordinate + rounding * (enter + exit);
        });
      });
    });
  }

  function heartOutline() {
    // One continuous outline, with a deep notch between the lobes and a rounded tip.
    const left = [
      [
        [0, 0.22],
        [-0.063, 0.22],
        [-0.107, 0.46],
        [-0.302, 0.447],
      ],
      [
        [-0.302, 0.447],
        [-0.45, 0.437],
        [-0.54, 0.324],
        [-0.497, 0.14],
      ],
      [
        [-0.497, 0.14],
        [-0.453, -0.045],
        [-0.193, -0.349],
        [-0.058, -0.464],
      ],
      [
        [-0.058, -0.464],
        [-0.035, -0.484],
        [-0.016, -0.497],
        [0, -0.497],
      ],
    ].flatMap(([a, b, c, d]) =>
      Array.from({ length: 6 }, (_, sample) => {
        const t = sample / 6;
        const s = 1 - t;
        return a.map(
          (coordinate, axis) =>
            s ** 3 * coordinate + 3 * s * t * (s * b[axis] + t * c[axis]) + t ** 3 * d[axis],
        );
      }),
    );
    return [
      ...left,
      [0, -0.497],
      ...left
        .slice(1)
        .reverse()
        .map(([x, y]) => [-x, y]),
    ];
  }

  function cushionMesh(outline) {
    // Carry the silhouette across both faces for a rounded, fully closed cushion.
    const sides = outline.length;
    const slices = 10;
    const rings = Array.from({ length: slices - 1 }, (_, slice) => {
      const angle = ((slice + 1) * Math.PI) / slices;
      const radius = Math.sin(angle);
      const depth = Math.cos(angle);
      return outline.map(([x, y], index) => {
        const previous = outline[(index + sides - 1) % sides];
        const next = outline[(index + 1) % sides];
        const dx = next[0] - previous[0];
        const dy = next[1] - previous[1];
        const normal = [(dy * radius) / 2, (-dx * radius) / 2, depth * (x * dy - y * dx)];
        const length = Math.hypot(...normal);
        return [x * radius, y * radius, depth / 2, ...normal.map((value) => value / length)];
      });
    });
    const vertices = [];
    const front = [0, 0, 0.5, 0, 0, 1];
    const back = [0, 0, -0.5, 0, 0, -1];
    for (let index = 0; index < sides; index++) {
      const next = (index + 1) % sides;
      vertices.push(...front, ...rings[0][index], ...rings[0][next]);
      for (let ring = 1; ring < rings.length; ring++) {
        const inner = rings[ring - 1];
        const outer = rings[ring];
        vertices.push(...inner[index], ...outer[index], ...outer[next]);
        vertices.push(...inner[index], ...outer[next], ...inner[next]);
      }
      vertices.push(...rings.at(-1)[index], ...back, ...rings.at(-1)[next]);
    }
    return new Float32Array(vertices);
  }

  const meshes = [cushionMesh(starOutline()), cushionMesh(heartOutline())];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const hash = (seed, index) => {
    const mixed = Math.imul(seed ^ index, 0x9e3779b1);
    return Math.imul(mixed ^ (mixed >>> 16), 0x85ebca6b) >>> 0;
  };

  function draw(world, pads, state, camera, forward, right, up, aspect) {
    const { course, gl, u } = world;
    const first = course.firstIndex || 0;
    const seed = course.seed ?? routeSeeds[course.id] ?? 0;
    const colors = routePalettes[course.id] ?? palettes;
    let drew = false;

    function charm(kind, x, y, z, size, phase, color) {
      const bob = state.time * 0.71 + phase;
      const p = [x + Math.cos(bob * 0.7) * 0.26, y + Math.sin(bob) * 0.23, z];
      const relative = p.map((coordinate, axis) => coordinate - camera[axis]);
      const depth = dot(relative, forward);
      if (
        depth < 0.15 ||
        depth >= far ||
        Math.abs(dot(relative, right)) > (depth * aspect) / lens + size ||
        Math.abs(dot(relative, up)) > depth / lens + size
      )
        return;

      const fade = Math.min(1, (far - depth) / 19);
      const visibleSize = size * fade * fade * (3 - 2 * fade);
      // Roll in the cushion's plane while the full volume rocks around the vertical axis.
      const yaw = 0.46 * Math.sin(bob * 0.68 + phase) + 0.16 * Math.sign(x);
      const roll = 0.15 * Math.sin(bob * 0.84);
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const cr = Math.cos(roll);
      const sr = Math.sin(roll);
      gl.uniform3fv(u.modelBase, p);
      gl.uniformMatrix3fv(u.modelBasis, false, [
        cy * cr,
        sr,
        -sy * cr,
        -cy * sr,
        cr,
        sy * sr,
        sy,
        0,
        cy,
      ]);
      world.drawDetail(meshes[kind], origin, color, 0, [visibleSize, visibleSize, visibleSize * 0.63]);
      drew = true;
    }

    for (const { index } of pads) {
      const finish = !course.endless && index === course.path.length - 1;
      if (!finish && (index < 2 || index % 3 !== 2)) continue;
      // Read the static path row so moving and crumbling platforms cannot move the scenery.
      const [x, z, y] = course.path[index - first];
      if (Math.abs(z - camera[2]) > far + 19) continue;
      const bits = hash(seed, index);
      const side = ((Math.floor(index / 3) + (seed & 1)) % 2) * 2 - 1;
      const phase = ((bits & 255) * tau) / 256;
      const color = (bits >>> 8) % colors[0].length;
      const main = bits >>> 31;
      const lx = x + side * (7.4 + ((bits >>> 12) & 7) * 0.23);
      const ly = y + 5.45 + ((bits >>> 16) & 7) * 0.28;
      const lz = z + (finish ? 12 : 2.6) + ((bits >>> 20) & 7) * 0.44;
      charm(main, lx, ly, lz, 1.6, phase, colors[main][color]);
      charm(
        1 - main,
        lx + side * 2.45,
        ly - 1.18,
        lz + 2.4,
        1.03,
        phase + 2.2,
        colors[1 - main][(color + 1) % colors[0].length],
      );
      if (finish || index % 6 === 2) {
        charm(
          1 - main,
          x - side * 8.5,
          ly + 0.12,
          lz + 7.3,
          1.26,
          phase + 4.2,
          colors[1 - main][color],
        );
      }
    }
    if (drew) {
      gl.uniform3fv(u.modelBase, origin);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
  }

  window.FluffSkyCharms = { draw };
})();
