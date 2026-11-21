(() => {
  'use strict';

  const tau = Math.PI * 2;
  const origin = [0, 0, 0];
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const sides = [-1, 1];
  const tea = '#563e48';
  const gold = '#f9bc4e';
  const honey = '#ffda74';
  const cream = '#fff2da';
  const lilac = '#b985cf';
  const shadows = {
    cloud: ['#83b8aa', '#6f9d97'],
    candy: ['#c899a0', '#af8093'],
    night: ['#9181b7', '#77689f'],
    endless: ['#ba99af', '#a885a1'],
  };

  function smooth(start, end, value) {
    const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  function beeMotion(pad, time, difficulty, reach) {
    const phase = time * (1.49 + 0.35 * difficulty) + pad.index * 1.71;
    const sweep = Math.sin(phase);
    const rise = (1 + Math.cos(phase)) * 0.5;
    // Alternate a high crossing and a low return through the middle.
    const lift = rise * rise * (3 - 2 * rise);
    return {
      x: pad.x + reach * sweep,
      z: pad.z + 0.7 * Math.sin(phase + 0.45),
      height: 0.69 + 1.29 * lift + 0.03 * Math.sin(time * 10 + pad.index),
      yaw: -1.02 * Math.tanh(3 * Math.cos(phase)),
      bank: -0.2 * sweep,
      lift,
    };
  }

  function bunMotion(pad, time, difficulty, reach) {
    const cycle = (time * (0.23 + 0.047 * difficulty) + pad.index * 0.37) * 2;
    const leg = Math.floor(cycle);
    const phase = cycle - leg;
    const direction = leg % 2 === 0 ? 1 : -1;
    // Pause to wave and turn toward the open lane before crossing it.
    const travel = smooth(0.28, 0.94, phase);
    const moving = smooth(0.27, 0.39, phase) * (1 - smooth(0.82, 0.94, phase));
    const turning = smooth(0.15, 0.38, phase) * (1 - smooth(0.81, 1, phase));
    const stride = Math.sin(tau * travel * 3) * moving;
    return {
      x: pad.x + direction * reach * (2 * travel - 1),
      z: pad.z + 0.3 * (1 - 2 * Math.abs(travel - 0.5)),
      height: 0.48 + 0.077 * stride * stride,
      yaw: -0.96 * direction * turning,
      bank: -0.14 * direction * turning,
      wave: smooth(0, 0.1, phase) * (1 - smooth(0.19, 0.34, phase)),
      stride,
    };
  }

  function mothMotion(pad, time, difficulty, reach) {
    const pace = time * (1.01 + 0.21 * difficulty) + pad.index * 1.37;
    // Lengthen the low pass and keep the return flight farther down the pad.
    const phase = pace + 0.29 * Math.sin(pace);
    const glide = Math.cos(phase);
    const lift = smooth(0.07, 0.81, (1 + glide) * 0.5);
    const sweep = Math.sin(phase);
    return {
      x: pad.x + reach * sweep,
      z: pad.z + 0.84 * glide + 0.36 * Math.sin(phase * 2),
      height: 0.76 + 1.35 * lift + 0.06 * Math.sin(time * 5.2),
      yaw: -0.41 * glide,
      bank: -0.28 * sweep,
      lift,
    };
  }

  function hedgehogMotion(pad, time, difficulty, reach) {
    const cycle = time * (0.36 + 0.07 * difficulty) + pad.index * 0.61;
    const leg = Math.floor(cycle);
    const phase = cycle - leg;
    const direction = leg % 2 === 0 ? 1 : -1;
    const sniff = Math.sin(time * 16) * smooth(0, 0.05, phase) * (1 - smooth(0.3, 0.42, phase));
    const curl = smooth(0.32, 0.47, phase) * (1 - smooth(0.84, 0.98, phase));
    const travel = smooth(0.47, 0.84, phase);
    return {
      x: pad.x + direction * reach * (2 * travel - 1),
      z: pad.z + 0.26 * Math.sin(Math.PI * travel),
      height: 0.45 + 0.058 * curl + 0.026 * Math.sin(Math.PI * travel) ** 2,
      yaw: -direction * 0.24 * (1 - curl) * Math.sin(Math.PI * phase),
      bank: -direction * tau * travel + 0.04 * sniff,
      curl,
      sniff,
    };
  }

  function pose(type, pad, time, difficulty = 0, travelYaw = 0) {
    const model = models[type];
    const scale = model.scale + 0.035 * ((pad.index % 3) - 1);
    const reach = Math.max(0, pad.w * 0.5 - model.border * scale);
    const { x: motionX, z: motionZ, height, ...animation } = model.motion(pad, time, difficulty, reach);
    const dx = motionX - pad.x, dz = motionZ - pad.z;
    const c = Math.cos(travelYaw), s = Math.sin(travelYaw);
    const x = pad.x + dx * c + dz * s, z = pad.z + dz * c - dx * s;
    const floor = window.FluffCourses.surfaceHeight(pad, x, z);
    return {
      at: pad.index,
      type,
      x,
      y: floor + height + model.r * (scale - 1),
      z,
      r: model.r * scale,
      scale,
      halfSpan: 0,
      angle: 0,
      ...animation,
      yaw: animation.yaw + travelYaw,
    };
  }

  function drawBee(part, h, time) {
    const flutter = Math.sin(time * 27 + h.at);
    part('ball', [0, -0.02, 0.06], [0.82, 0.68, 1.0], gold);
    part('ball', [0, -0.02, 0.09], [0.86, 0.72, 0.22], tea);
    part('ball', [0, -0.02, 0.34], [0.71, 0.61, 0.22], tea);
    part('ball', [0, 0.02, -0.26], [0.72, 0.62, 0.58], honey, 0, -4);
    for (const side of sides) {
      const antenna = side * (0.4 + 0.1 * flutter);
      part('ball', [side * 0.17, 0.35, -0.25], [0.067, 0.29, 0.063], tea, -antenna);
      part('ball', [side * (0.221 + 0.014 * flutter), 0.48, -0.25], [0.116, 0.113, 0.1], gold);
      const wing = side * (0.75 + 0.55 * flutter);
      part('egg', [side * 0.44, 0.24 + 0.08 * flutter, 0.18], [0.25, 0.61, 0.19], '#b2e2e6', -wing);
      part('egg', [side * 0.45, 0.27 + 0.08 * flutter, 0.097], [0.165, 0.49, 0.075], '#edf8e9', -wing);
      part('ball', [side * 0.199, -0.29, -0.08], [0.15, 0.16, 0.2], tea, side * 0.32);
    }
  }

  function drawBun(part, h, time) {
    const earSway = 0.16 * h.stride + 0.06 * Math.sin(time * 5 + h.at);
    const greeting = h.wave * (0.95 + 0.25 * Math.sin(time * 14));
    part('egg', [0, -0.09, 0], [0.83, 0.72, 0.72], lilac);
    part('ball', [0, -0.15, -0.275], [0.55, 0.43, 0.23], cream);
    part('ball', [0, -0.22, 0.34], [0.31, 0.28, 0.29], cream);
    part('ball', [0, 0.183, -0.07], [0.77, 0.57, 0.69], '#d8ace5', 0, -5);
    for (const side of sides) {
      const x = side * 0.227;
      const ear = -side * 0.31 + earSway;
      part('ball', [x, 0.535, -0.035], [0.225, 0.585, 0.195], lilac, ear);
      part('ball', [x, 0.546, -0.108], [0.128, 0.408, 0.069], '#f4a6bc', ear);
      const step = side * h.stride;
      part(
        'ball',
        [side * 0.22, -0.37 + Math.max(0, step) * 0.075, -0.14 + step * 0.16],
        [0.255, 0.21, 0.34],
        '#d3a0dc',
        -side * 0.13,
      );
      const hello = side === 1 ? greeting : 0;
      part(
        'egg',
        [side * (0.383 + 0.089 * hello), -0.156 + 0.26 * hello, -0.155 - step * 0.08],
        [0.219, 0.34, 0.24],
        lilac,
        side * 0.33 + 1.18 * hello,
      );
    }
    part('ball', [0, 0.075, -0.374], [0.255, 0.16, 0.115], cream);
    part('ball', [0, 0.123, -0.431], [0.092, 0.064, 0.039], '#ab628d');
    part('ball', [0, 0.055, -0.432], [0.036, 0.053, 0.021], tea);
  }

  function drawMoth(part, h, time) {
    const open = 0.7 + 0.3 * Math.sin(time * 10.5 + h.at);
    const pearl = '#e2fff3';
    const wingColor = '#a1d8e0';
    const pattern = '#efdfad';
    for (const side of sides) {
      const x = side * (0.36 + 0.23 * open);
      const y = 0.15 + 0.22 * (1 - open);
      const tilt = side * (0.28 + 0.58 * (1 - open));
      part('egg', [x * 0.78, y - 0.37, 0.14], [0.63, 0.42, 0.22], '#879bc9', -tilt);
      part('egg', [x, y, 0.12], [0.95, 0.65, 0.23], wingColor, tilt);
      part('ball', [x + side * 0.095, y + 0.068, 0.004], [0.31, 0.3, 0.06], pattern);
      part('ball', [x + side * 0.15, y + 0.109, -0.025], [0.247, 0.228, 0.055], wingColor);
      part('ball', [x * 0.92, y - 0.373, 0.042], [0.112, 0.107, 0.047], pearl);
    }
    part('egg', [0, -0.105, 0.075], [0.59, 0.77, 0.67], '#82adca');
    part('ball', [0, 0.037, -0.119], [0.67, 0.39, 0.49], pearl);
    part('ball', [0, 0.169, -0.257], [0.56, 0.48, 0.53], '#b3eadd', 0, -4);
    for (const side of sides) {
      const feeler = -side * (0.41 + 0.13 * open);
      part('ear', [side * 0.17, 0.41, -0.24], [0.13, 0.34, 0.093], '#99c6dc', feeler);
      part('ball', [side * (0.22 + 0.016 * open), 0.54, -0.24], [0.095, 0.096, 0.082], pattern);
    }
  }

  function drawHedgehog(part, h) {
    const open = 1 - h.curl;
    const fur = '#ad704e';
    const snout = '#f1c6a0';
    const nose = '#58424b';
    const noseZ = -0.494 - 0.116 * open - 0.024 * h.sniff;
    const faceZ = -0.2 - 0.12 * open;
    const center = [0, 0.04 * open, 0.025];
    const torso = [0.89, 0.92 - 0.19 * open, 0.91];
    part('egg', center, torso, fur);
    // The mantle rounds up and draws forward when the little hedgehog curls into a ball.
    const coat = [torso[0] + 0.05 * h.curl, torso[1], torso[2] + 0.075 * h.curl];
    const shoulder = [0, center[1] + 0.025, center[2] - 0.052 * h.curl];
    part('quill-cap', shoulder, coat, '#835e51');
    part('quills-0', shoulder, coat, '#986a53');
    part('quills-1', shoulder, coat, '#a87859');
    part('quills-2', shoulder, coat, '#b38565');
    part('ball', [0, -0.075, faceZ], [0.64, 0.47, 0.39], snout, 0, -5);
    part('egg', [0, -0.088 + 0.018 * h.sniff, (faceZ + noseZ) * 0.5], [0.32, 0.248, 0.36], '#ffe0b3');
    part('ball', [0, -0.053 + 0.028 * h.sniff, noseZ], [0.157, 0.105, 0.11], nose);
    for (const side of sides) {
      const x = side * (0.17 + 0.08 * open);
      part(
        'ball',
        [x, 0.16 + 0.02 * open, faceZ + 0.064],
        [0.174, 0.18, 0.11],
        '#d49c76',
        -side * 0.22,
      );
      part('ball', [side * 0.22, -0.287 - 0.063 * open, faceZ + 0.072], [0.23, 0.168, 0.25], '#ca926b');
    }
  }

  const models = {
    bee: { border: 0.83, r: 0.46, scale: 0.91, motion: beeMotion, draw: drawBee, shadow: [1.04, 0.72] },
    bun: { border: 0.64, r: 0.48, scale: 1.04, motion: bunMotion, draw: drawBun, shadow: [1.07, 0.79] },
    moth: {
      border: 0.83,
      r: 0.55,
      scale: 0.97,
      motion: mothMotion,
      draw: drawMoth,
      shadow: [1.58, 0.77],
    },
    hedgehog: {
      border: 0.65,
      r: 0.48,
      scale: 1.1,
      motion: hedgehogMotion,
      draw: drawHedgehog,
      shadow: [1.02, 0.93],
    },
  };
  function drawKeepsake(world, h) {
    const y = h.type === 'bee' ? -0.16 : h.type === 'moth' ? -0.23 : -0.12;
    const x = -0.39,
      z = -0.32;
    if (h.item === 'carrot') {
      world.draw('ear', [x, y, z - 0.025], [0.23, 0.48, 0.23], '#ee9653', -0.37 + Math.PI);
      for (let i = 0; i < 3; i++)
        world.draw(
          'ear',
          [x + 0.06 + i * 0.035, y + 0.27, z - 0.07],
          [0.083, 0.28, 0.09],
          i % 2 ? '#9ac87f' : '#65a784',
          0.2 - i * 0.42,
        );
    } else if (h.item === 'dipper') {
      world.draw('ball', [x, y + 0.14, z], [0.067, 0.54, 0.067], '#a67453', -0.18);
      for (let i = 0; i < 4; i++)
        world.draw(
          'ball',
          [x + 0.045 + i * 0.009, y + 0.32 + i * 0.06, z],
          [0.21 + (i % 3) * 0.025, 0.085, 0.23],
          '#e3a44f',
          -0.18,
        );
    } else window.FluffPlush.heldItem(world, h.item, [x, y, z], 0.9);
  }

  function draw(world, h, pad, time) {
    const { gl, u } = world;
    const model = models[h.type];
    const scale = h.scale ?? 1;
    if (pad) {
      const [flightShadow, stepShadow] = shadows[world.course.id] || shadows.endless;
      const [shadowWidth, shadowDepth] = model.shadow;
      const lift = h.lift ?? 0;
      const shadow = [
        shadowWidth * scale * (1 - 0.4 * lift),
        0.016,
        shadowDepth * scale * (1 - 0.36 * lift),
      ];
      world.drawPadShadow(pad, h.x, h.z, shadow, h.lift === undefined ? stepShadow : flightShadow);
    }

    const c = Math.cos(h.yaw),
      s = Math.sin(h.yaw);
    const roll = Math.cos(h.bank),
      lean = Math.sin(h.bank);
    gl.uniform3fv(u.modelBase, [h.x, h.y, h.z]);
    gl.uniformMatrix3fv(
      u.modelBasis,
      false,
      [c * roll, lean, -s * roll, -c * lean, roll, s * lean, s, 0, c].map((value) => value * scale),
    );
    try {
      const part = (mesh, p, size, color, angle = 0, material = -1) =>
        world.draw(mesh, p, size, color, angle, material);
      model.draw(part, h, time);
      if (h.item) drawKeepsake(world, h);
    } finally {
      gl.uniform3fv(u.modelBase, origin);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
  }

  window.FluffCritters = { pose, draw, types: Object.freeze(Object.keys(models)) };
})();
