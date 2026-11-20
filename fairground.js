(() => {
  'use strict';

  const tau = 2 * Math.PI;
  const shutterRadius = 0.24;
  const shutterHeight = 1.69;
  const shutterLift = 1.98;
  const ribbon = '#ffe49b';
  const confettiColors = ['#fa5a9b', '#ffca59', '#63d8bc', '#9883ef', '#96e3fa', '#ff9c64'];
  const confettiDelay = 0.096;
  const confettiStagger = 0.012;
  const confettiDuration = (reduced) => (reduced ? 0.48 : 0.74);

  function ease(value) {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  }

  function shutterPose(pad, time, difficulty) {
    const riseAt = 0.84 - 0.16 * difficulty;
    const openAt = riseAt + 0.56;
    const warnAt = openAt + 1.3 - 0.22 * difficulty;
    const closeAt = warnAt + 0.46;
    const period = closeAt + 0.48;
    const offset = pad.index * 0.619;
    const impactAt = Math.floor((time + offset) / period) * period - offset;
    const elapsed = time - impactAt;
    const opening = ease((elapsed - riseAt) / (openAt - riseAt));
    const closing = ease((elapsed - closeAt) / (period - closeAt));
    const bottom = pad.y - 0.015 + shutterLift * (opening - closing);
    const signal = elapsed >= warnAt ? 'warning' : elapsed >= openAt ? 'clear' : 'closed';
    return {
      at: pad.index,
      type: 'shutter',
      x: pad.x,
      y: bottom + shutterHeight / 2,
      z: pad.z,
      r: shutterRadius,
      halfSpan: pad.w / 2 + 0.06 - shutterRadius,
      angle: 0,
      minY: bottom,
      maxY: bottom + shutterHeight,
      impactAt,
      descending: elapsed >= closeAt,
      signal,
    };
  }

  function hoopsPose(pad, time, difficulty) {
    const r = 0.24;
    const gap = 1.82;
    const halfWidth = pad.w / 2 + 0.06;
    const room = Math.max(0, halfWidth - gap / 2 - 2 * r - 0.12);
    const amplitude = Math.min(room, 0.81 + 0.17 * difficulty);
    const center = pad.x + amplitude * Math.sin(time * (2.05 + 0.7 * difficulty) + pad.index);
    const bottom = pad.y - 0.015;
    const top = pad.y + 0.51;
    return [-1, 1].map((side) => {
      const outer = pad.x + side * (halfWidth - r);
      const inner = center + side * (gap / 2 + r);
      return {
        at: pad.index,
        type: 'hoops',
        side,
        x: (outer + inner) / 2,
        y: (bottom + top) / 2,
        z: pad.z,
        r,
        halfSpan: Math.abs(outer - inner) / 2,
        angle: 0,
        minY: bottom,
        maxY: top,
        gapX: center,
        opening: gap,
      };
    });
  }

  function pose(type, pad, time, difficulty = 0) {
    const level = Math.min(1, Math.max(0, difficulty));
    if (type === 'shutter') return [shutterPose(pad, time, level)];
    if (type === 'hoops') return hoopsPose(pad, time, level);
    return [];
  }

  function drawShutter(world, h, pad, time) {
    const { x, y, z, halfSpan, r } = h;
    const width = 2 * halfSpan;
    const depth = 2 * r;
    const beamY = pad.y + shutterLift + shutterHeight + 0.04;
    const postHeight = beamY - pad.y;
    const signalColors = {
      closed: '#dc7197',
      clear: '#94e9b6',
      warning: Math.sin(time * 12) > 0 ? '#fff4c3' : '#f9b455',
    };
    const signal = signalColors[h.signal];
    const floorMark = h.signal === 'closed' ? '#a981a4' : signal;
    world.draw('box', [x, pad.y + 0.011, z], [pad.w, 0.02, 0.65], floorMark, 0, 1);
    world.draw('box', [x, beamY, z], [pad.w + 0.73, 0.31, 0.53], '#885784', 0, 1);
    for (const side of [-1, 1]) {
      const postX = x + side * (pad.w / 2 + 0.27);
      world.draw('box', [postX - side * 0.12, pad.y - 0.14, z], [0.54, 0.28, 0.48], '#885784');
      world.draw('box', [postX, pad.y + postHeight / 2, z], [0.23, postHeight, 0.27], '#8d628e');
      world.draw('ball', [postX, pad.y + 1.35, z], [0.32, 0.32, 0.38], signal);
      world.draw('ball', [x + side * halfSpan, y, z], [depth, shutterHeight, depth], '#b664a2');
    }
    world.draw('box', [x, y, z], [width, shutterHeight, depth * 0.82], '#b664a2', 0, 1);
    for (const fold of [-1, 0, 1]) {
      const foldX = x + (fold * width) / 3;
      world.draw('box', [foldX, y + 0.035, z], [width / 6, shutterHeight - 0.13, depth], '#d182b9');
    }
    const hem = h.signal === 'warning' ? signal : '#ffe1bb';
    world.draw('box', [x, h.minY + 0.09, z], [width, 0.18, depth], hem, 0, 1);
  }

  function drawHoop(world, h, pad) {
    const { x, y, z, r, halfSpan, side } = h;
    const height = h.maxY - h.minY;
    const diameter = 2 * r;
    const outerX = x + side * halfSpan;
    const innerX = x - side * halfSpan;
    world.draw('box', [x, pad.y + 0.01, z], [2 * (halfSpan + r), 0.018, diameter], '#b28ea4');
    world.draw('cylinder', [x, y, z], [2 * halfSpan, height, diameter], '#8366b0', 0, 6);
    world.draw('ball', [outerX, y, z], [diameter, height, diameter], '#8366b0');
    world.draw('ball', [innerX, y, z], [diameter, height, diameter], '#f6ae68');
  }

  function draw(world, h, pad, time) {
    if (h.type === 'shutter') drawShutter(world, h, pad, time);
    if (h.type === 'hoops') drawHoop(world, h, pad);
  }

  function drawGift(world, position, time, openAge = null, reduced = false, boxScale = 1) {
    const { x, y, z } = position;
    if (openAge !== null && openAge >= 0.8) return;
    const opening = openAge === null ? 0 : ease(openAge / 0.52);
    const scale = boxScale * (openAge === null ? 1 : ease((0.8 - openAge) / 0.38));
    const part = (mesh, dx, dy, dz, w, h, d, color, rot = 0, material = 0) =>
      world.draw(
        mesh,
        [x + dx, y + dy, z + dz],
        [w * scale, h * scale, d * scale],
        color,
        rot,
        material,
      );

    if (position.aerial) {
      const wing = 0.22 * Math.sin(time * 5.4);
      for (const side of [-1, 1]) {
        part(
          'egg',
          side * 0.56 * scale,
          (0.16 + wing * 0.23) * scale,
          0,
          0.26,
          0.73,
          0.18,
          '#fff0d7',
          -side * (0.95 + wing),
        );
        part(
          'egg',
          side * 0.54 * scale,
          0.035 * scale,
          -0.035,
          0.21,
          0.53,
          0.16,
          '#bce4db',
          -side * (1.27 + wing),
        );
      }
    }
    part('box', 0, -0.069 * scale, 0, 0.81, 0.61, 0.77, position.aerial ? '#53769c' : '#bd4a7d', 0, 1);
    part('box', 0, -0.068 * scale, 0, 0.165, 0.61, 0.8, ribbon);
    part('box', 0, -0.068 * scale, 0, 0.84, 0.61, 0.165, ribbon);
    if (opening > 0) {
      part('box', 0, 0.23 * scale, 0, 0.65, 0.063, 0.62, '#652b62');
    }

    const lift = opening * (reduced ? 0.56 : 1) * boxScale;
    const lidX = 0.48 * lift;
    const lidY = 0.28 * scale + 0.73 * lift;
    const tilt = -0.61 * lift;
    const sway = 0.052 * Math.sin(time * 3.1);
    const c = Math.cos(tilt);
    const s = Math.sin(tilt);
    const lidPart = (mesh, dx, dy, w, h, d, color, rotation = 0, material = 0) =>
      part(
        mesh,
        lidX + (dx * c - dy * s) * scale,
        lidY + (dx * s + dy * c) * scale,
        0,
        w,
        h,
        d,
        color,
        tilt + rotation,
        material,
      );
    lidPart('box', 0, 0, 0.91, 0.17, 0.86, position.aerial ? '#87c6c5' : '#e26899', 0, 1);
    lidPart('box', 0, 0.006, 0.165, 0.18, 0.88, ribbon);
    lidPart('box', 0, 0.006, 0.93, 0.18, 0.165, ribbon);
    for (const side of [-1, 1]) {
      lidPart('ball', side * 0.162, 0.179, 0.35, 0.17, 0.21, '#fff2bb', side * 0.5 + sway);
    }
    lidPart('ball', 0, 0.135, 0.175, 0.14, 0.19, '#f5bd67');
  }

  function confettiMeshes() {
    const strip = (curl) => {
      const vertices = [];
      const sections = curl ? 12 : 4;
      const point = (side, step) => {
        const t = step / sections;
        const phase = t * tau * 1.45;
        const taper = 0.72 + 0.28 * Math.sin(Math.PI * t);
        const rise = curl ? Math.cos(phase) * 1.37 : Math.cos(t * Math.PI) * 0.42;
        const length = Math.hypot(1, rise);
        return [
          side * taper + (curl ? 0.26 * Math.sin(phase + 0.7) : 0),
          t - 0.5,
          curl ? 0.15 * Math.sin(phase) : 0.133 * Math.sin(t * Math.PI),
          0,
          -rise / length,
          1 / length,
        ];
      };
      for (let i = 0; i < sections; i++) {
        const a = point(-0.5, i),
          b = point(0.5, i);
        const c = point(0.5, i + 1),
          d = point(-0.5, i + 1);
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
      return vertices;
    };
    return { 'confetti-paper': strip(false), 'confetti-ribbon': strip(true) };
  }

  function confettiActive(age, reduced) {
    return age > confettiDelay && age < confettiDelay + 4 * confettiStagger + confettiDuration(reduced);
  }

  function drawConfetti(world, position, age, reduced) {
    const count = reduced ? 6 : 22;
    const duration = confettiDuration(reduced);
    const travel = reduced ? 0.51 : 1;
    const { gl, u } = world;
    let drew = false;
    for (let i = 0; i < count; i++) {
      const elapsed = age - confettiDelay - (i % 5) * confettiStagger;
      if (elapsed <= 0 || elapsed >= duration) continue;
      const angle = i * 2.399963;
      const ribbon = i % 4 === 0;
      const drift = 0.13 + travel * elapsed * (1.18 + 0.39 * (i % 5));
      const height = 0.3 + travel * elapsed * (3.25 + 0.31 * (i % 4) - 5.7 * elapsed);
      const size = ease(elapsed / 0.043) * ease((duration - elapsed) / 0.19);
      const yaw = angle + travel * elapsed * (2.6 + 0.31 * (i % 5));
      const tilt = 0.74 * Math.cos(angle + travel * elapsed * 8.7);
      const c = Math.cos(yaw),
        s = Math.sin(yaw),
        p = Math.cos(tilt),
        q = Math.sin(tilt);
      gl.uniform3fv(u.modelBase, [
        position.x + Math.cos(angle) * drift,
        position.y + height,
        position.z + Math.sin(angle) * drift * 0.75,
      ]);
      gl.uniformMatrix3fv(u.modelBasis, false, [c, 0, -s, s * q, p, c * q, s * p, -q, c * p]);
      world.draw(
        ribbon ? 'confetti-ribbon' : 'confetti-paper',
        [0, 0, 0],
        [(ribbon ? 0.083 : 0.124) * size, (ribbon ? 0.37 : 0.19) * size, 0.16 * size],
        confettiColors[i % confettiColors.length],
        angle + travel * elapsed * (ribbon ? -3.9 : 5.4),
        -9,
      );
      drew = true;
    }
    if (drew) {
      gl.uniform3fv(u.modelBase, [0, 0, 0]);
      gl.uniformMatrix3fv(u.modelBasis, false, [1, 0, 0, 0, 1, 0, 0, 0, 1]);
    }
  }

  window.FluffFairground = { pose, draw, drawGift, confettiMeshes, confettiActive, drawConfetti };
})();
