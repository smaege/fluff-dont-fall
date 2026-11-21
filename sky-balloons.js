(() => {
  'use strict';

  const tau = Math.PI * 2;
  const straightLength = 96;
  const turnRadius = 6;
  const halfLap = straightLength + Math.PI * turnRadius;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const palettes = {
    cloud: ['#d6759c', '#fff1cc', '#ed9a9a'],
    candy: ['#ba72a4', '#fff0cf', '#f49f9b'],
    night: ['#a37ac9', '#ffdf92', '#e6a1b3'],
    grove: ['#6ba491', '#f9e8b9', '#eaae83'],
    reef: ['#648bb9', '#fff1c6', '#e690a6'],
    orchard: ['#ce8266', '#ffedc0', '#e9a25c'],
    frost: ['#828ccd', '#fbe5bf', '#a6c5e9'],
    rose: ['#c06f94', '#ffebd2', '#e8a0b1'],
    meadow: ['#72a78c', '#ffedc0', '#d6a0b4'],
    lagoon: ['#668db4', '#fff0c5', '#8fc7d2'],
    tulip: ['#ac7abd', '#fff0cc', '#eaa1a5'],
    tower: ['#a68ac1', '#fff0ce', '#81bcb6'],
  };
  const materialColors = {
    'balloon-ropes': '#955f4b',
    'balloon-basket': '#b77c51',
    'balloon-wicker': '#ddb487',
  };
  const zero = [0, 0, 0];
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mix = (a, b, t) => a + (b - a) * t;
  const cross = ([ax, ay, az], [bx, by, bz]) => [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx,
  ];
  const subtract = (a, b) => a.map((v, i) => v - b[i]);
  const unit = (v) => {
    const length = Math.hypot(...v);
    return v.map((value) => value / length);
  };

  function shellPoint(angle, latitude) {
    const shoulder = Math.cos(latitude);
    const seam = 1 - 0.032 * Math.cos(angle * 8);
    const radius = 2.04 * Math.sin(latitude) * (1 + 0.28 * shoulder) * seam;
    return [radius * Math.cos(angle), 2.52 * shoulder, radius * Math.sin(angle)];
  }

  function shellVertex(angle, latitude) {
    if (latitude === 0) return [0, 2.52, 0, 0, 1, 0];
    const around = subtract(shellPoint(angle + 0.001, latitude), shellPoint(angle - 0.001, latitude));
    const down = subtract(shellPoint(angle, latitude + 0.001), shellPoint(angle, latitude - 0.001));
    return [...shellPoint(angle, latitude), ...unit(cross(around, down))];
  }

  function face(out, a, b, c, d) {
    const normal = unit(cross(subtract(b, a), subtract(c, a)));
    for (const point of [a, b, c, a, c, d]) out.push(...point, ...normal);
  }

  function collar(out, top, bottom) {
    for (let i = 0; i < top.length; i++) {
      const next = (i + 1) % top.length;
      face(out, top[i], top[next], bottom[next], bottom[i]);
    }
  }

  function rectangle(x, y, z) {
    return [
      [x, y, -z],
      [x, y, z],
      [-x, y, z],
      [-x, y, -z],
    ];
  }

  function meshes() {
    const panels = [[], [], []];
    for (let gore = 0; gore < 8; gore++) {
      const out = panels[[0, 1, 0, 2][gore % 4]];
      const rings = Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 6 }, (_, column) =>
          shellVertex(((gore + column / 5) * tau) / 8, (row * 2.92) / 14),
        ),
      );
      for (let row = 0; row < rings.length - 1; row++) {
        const top = rings[row];
        const bottom = rings[row + 1];
        for (let column = 0; column < top.length - 1; column++) {
          if (row) out.push(...top[column], ...top[column + 1], ...bottom[column + 1]);
          out.push(...top[column], ...bottom[column + 1], ...bottom[column]);
        }
      }
    }
    const ropes = [],
      basket = [],
      wicker = [];
    for (const x of [-1, 1]) {
      for (const z of [-1, 1]) {
        const ropeEnd = (width, y, depth) =>
          rectangle(0.043, y, 0.043).map(([dx, dy, dz]) => [width * x + dx, dy, depth * z + dz]);
        collar(ropes, ropeEnd(0.31, -2.39, 0.29), ropeEnd(0.54, -3.54, 0.41));
      }
    }
    const rim = rectangle(0.67, -3.48, 0.52);
    const inside = rectangle(0.52, -3.48, 0.37);
    const bottom = rectangle(0.55, -4.15, 0.43);
    collar(basket, rectangle(0.63, -3.56, 0.49), bottom);
    const floor = rectangle(0.5, -4.02, 0.37).reverse();
    collar(basket, inside.slice().reverse(), floor);
    face(basket, ...floor);
    face(basket, ...bottom);
    collar(wicker, rim, rectangle(0.66, -3.62, 0.51));
    collar(wicker, inside, rim);
    for (const height of [-3.77, -3.97]) {
      const t = (height + 4.15) / 0.59;
      const width = mix(0.55, 0.63, t) + 0.017,
        depth = mix(0.43, 0.49, t) + 0.017;
      collar(
        wicker,
        rectangle(width, height, depth),
        rectangle(width - 0.005, height - 0.06, depth - 0.005),
      );
    }
    return {
      'balloon-shell-0': panels[0],
      'balloon-shell-1': panels[1],
      'balloon-shell-2': panels[2],
      'balloon-ropes': ropes,
      'balloon-basket': basket,
      'balloon-wicker': wicker,
    };
  }

  function fixedRoutes(course) {
    if (course.tower) {
      return {
        path: null,
        balloons: [
          { x: 16, y: 29, z: 31, scale: 1.2, phase: 1.48, colors: palettes.tower },
          { x: -24, y: 17, z: 47, scale: 0.88, phase: 4.35, colors: palettes.tower },
        ],
      };
    }
    const path = course.path.filter((pad) => pad[6] !== 'stairs' && pad[6] !== 'slide');
    const finish = path.at(-1)[1];
    const phase = course.id.charCodeAt(0) * 0.37;
    const colors = palettes[course.id];
    const balloons = [];
    const openingZ = 34;
    const [openingLane, openingAltitude] = coursePosition(path, openingZ);
    const openingSide = openingLane < 0 ? 1 : -1;
    const baseHeight = course.id === 'grove' ? 12 : 9;
    for (let z = openingZ, i = 0; z < finish + 45; z += 28 + (i % 3) * 3, i++) {
      const side = i % 2 ? -openingSide : openingSide;
      const tint = i % 3 === 1 ? [colors[2], colors[1], colors[0]] : colors;
      balloons.push({
        x: side * (i === 0 ? 7 : 11 + 4 * (i % 3)),
        y: i === 0 ? 9.3 - openingAltitude : baseHeight + (i % 3) * 1.05,
        z,
        scale: 1.1 + (i % 3) * 0.12,
        phase: phase + i * 1.83,
        colors: tint,
      });
    }
    return { path, balloons };
  }

  function coursePosition(path, z) {
    const end = path.at(-1);
    if (z >= end[1]) return [end[0], end[2]];
    let low = 0,
      high = path.length - 1;
    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      if (path[mid][1] <= z) low = mid;
      else high = mid;
    }
    const a = path[low],
      b = path[high];
    const t = Math.max(0, (z - a[1]) / (b[1] - a[1]));
    const ease = t * t * (3 - 2 * t);
    return [mix(a[0], b[0], ease), mix(a[2], b[2], ease)];
  }

  function pose(balloon, time, offsetZ, path, motionScale) {
    const phase = balloon.phase;
    const speed = 5.2 + 0.65 * Math.sin(phase);
    const start = straightLength / 2 - Math.abs(balloon.x);
    const distance = (start + time * speed) % (2 * halfLap);
    // The two crossings are joined at their ends by climbing semicircles.
    const returning = distance >= halfLap;
    const direction = (returning ? 1 : -1) * Math.sign(balloon.x);
    const endDistance = (distance % halfLap) - straightLength;
    const turn = Math.max(0, endDistance) / turnRadius;
    const bend = Math.sin(turn);
    const routeX = direction * (straightLength / 2 + Math.min(0, endDistance) + turnRadius * bend);
    const routeZ = turnRadius * (1 - (returning ? -1 : 1) * Math.cos(turn));
    const z = balloon.z + offsetZ + routeZ * motionScale;
    const [lane, altitude] = path ? coursePosition(path, z) : [0, 0];
    const wind = time * 0.46 + phase;
    return [
      lane + mix(balloon.x, routeX, motionScale),
      altitude + balloon.y + (6 * bend * bend + 0.65 * Math.sin(wind)) * motionScale,
      z,
      phase + 0.24 * Math.sin(wind - 0.42) * motionScale,
      0.05 * Math.cos(wind + 0.78) * motionScale,
      (0.065 * Math.sin(wind + 2.5) - direction * 0.1 * bend * bend) * motionScale,
    ];
  }

  function draw(world, balloons, offsetZ, time, view, path = null) {
    const { camera, forward, right, up, lensX, lensY } = view;
    const motionScale = reducedMotion?.matches ? 0.16 : 1;
    const { gl, u } = world;
    let drew = false;
    for (const balloon of balloons) {
      if (Math.abs(balloon.z + offsetZ - camera[2]) > 110) continue;
      const [x, y, z, yaw, pitch, roll] = pose(balloon, time, offsetZ, path, motionScale);
      const scale = balloon.scale;
      const dx = x - camera[0],
        dy = y - camera[1] - scale * 0.7,
        dz = z - camera[2];
      const reach = 4 * scale;
      const depth = dx * forward[0] + dy * forward[1] + dz * forward[2];
      if (depth < -reach || depth > 95 + reach) continue;
      const across = dx * right[0] + dy * right[1] + dz * right[2];
      const above = dx * up[0] + dy * up[1] + dz * up[2];
      const half = Math.max(depth, 0) + reach;
      if (Math.abs(across) > half / lensX + reach || Math.abs(above) > half / lensY + reach) continue;
      const cy = Math.cos(yaw),
        sy = Math.sin(yaw),
        cp = Math.cos(pitch),
        sp = Math.sin(pitch),
        cr = Math.cos(roll),
        sr = Math.sin(roll);
      const axisX = [cy, 0, -sy],
        axisY = [sy * sp, cp, cy * sp];
      const basis = [
        ...axisX.map((value, i) => value * cr + axisY[i] * sr),
        ...axisY.map((value, i) => value * cr - axisX[i] * sr),
        ...cross(axisX, axisY),
      ];
      gl.uniform3fv(u.modelBase, [x, y, z]);
      gl.uniformMatrix3fv(u.modelBasis, false, basis);
      const size = [scale, scale, scale];
      for (const [i, color] of balloon.colors.entries())
        world.draw(`balloon-shell-${i}`, zero, size, color);
      for (const [mesh, color] of Object.entries(materialColors)) world.draw(mesh, zero, size, color);
      drew = true;
    }
    if (drew) {
      gl.uniform3fv(u.modelBase, zero);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
  }

  window.FluffSkyBalloons = { meshes, fixedRoutes, draw };
})();
