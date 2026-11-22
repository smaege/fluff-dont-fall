(() => {
  'use strict';
  const api = window.FluffCourses,
    rides = window.FluffSkyRides,
    step = 1 / 120;
  const maxLives = 3,
    starsPerLife = 10,
    endlessFirstLife = 20,
    endlessLifeStep = 10,
    baseSpeed = 5.75,
    airAcceleration = 30,
    airDrag = 0.55,
    routePitch = -0.18;
  function angleDifference(target, from) {
    const angle = target - from;
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }
  function approachAngle(from, target, rate, maxSpeed, dt) {
    const angle = angleDifference(target, from);
    const rotation = angle * (1 - Math.exp(-rate * dt));
    return from + Math.max(-maxSpeed * dt, Math.min(maxSpeed * dt, rotation));
  }
  function routeDirection(pads, index, z, landingX, landingZ) {
    const pad = pads[index], next = pads[index + 1];
    if (!pad || !next || pad.kind === 'stairs') return 0;
    if (pad.kind === 'slide') {
      const end = pad.z + pad.d / 2;
      const here = Math.max(pad.z - pad.d / 2, Math.min(end, z));
      const ahead = Math.min(end, here + 4);
      const tangent = Math.atan2(rides.laneCenter(pad, ahead) - rides.laneCenter(pad, here), ahead - here);
      const exit = Math.atan2(next.x - pad.x, next.z - end);
      const blend = Math.max(0, 1 - (end - here) / 4);
      return tangent + angleDifference(exit, tangent) * blend;
    }
    const entrance = next.kind === 'stairs' || next.kind === 'slide' ? next.z - next.d / 2 + 1.25 : next.z;
    const end = pad.z + pad.d / 2;
    const longApproach = pad.d >= 7.5 && entrance > end;
    // Follow the length of large obstacle pads, then look across the next gap.
    const across = longApproach ? Math.max(0, Math.min(1, 1 - (end - z) / 3.8)) : 1;
    if (longApproach) return Math.atan2(next.x - pad.x, entrance - end + 2) * across;
    const axis = Math.atan2(next.x - pad.x, entrance - pad.z);
    const dx = next.x - pad.x - landingX, dz = entrance - pad.z - landingZ;
    const along = dx * Math.sin(axis) + dz * Math.cos(axis);
    const side = dx * Math.cos(axis) - dz * Math.sin(axis);
    // Allow for an off-centre landing. Later side steps keep the same steering axes.
    const correction = Math.atan2(side, Math.max(2.5, along));
    return axis + Math.max(-0.26, Math.min(0.26, correction));
  }
  function speedMultiplier(course, furthest) {
    return course.endless ? 1 + 0.25 * Math.min(1, furthest / 72) : 1;
  }
  function spawn(remainingItems = [], aerialItems = [], courseItem = null) {
    return {
      x: 0,
      y: 0,
      z: -1.35,
      yaw: 0,
      routeYaw: 0,
      routePad: 0,
      routeLandingX: 0,
      routeLandingZ: -1.35,
      airYaw: null,
      heading: 0,
      moving: false,
      pitch: routePitch,
      vx: 0,
      vy: 0,
      vz: 0,
      grounded: 0,
      furthest: 0,
      checkpoint: 0,
      lastHazard: null,
      lives: maxLives,
      lifeProgress: 0,
      lifeGoal: starsPerLife,
      surfaces: new Map(),
      stars: 0,
      lastStar: null,
      loot: { remainingItems, aerialItems, courseItem, pendingItems: [], deck: [], opened: 0 },
      lastGift: null,
      coyote: 0.09,
      buffer: 0,
      queuedJump: false,
      airJumpReady: false,
      spinAt: -1,
      time: 0,
      finishTime: null,
      walk: 0,
      gait: 0,
      airBlend: 0,
      landAt: -1,
      landingPower: 0,
      slideSpeed: 0,
      sliding: false,
      encounterAudio: new window.FluffEncounterAudio(),
    };
  }
  function onPad(pad, x, z) {
    if (pad.style) return window.FluffPadStyles.contains(pad.style, x - pad.x, z - pad.z, pad.w, pad.d);
    if (pad.kind === 'slide')
      return Math.abs(x - rides.laneCenter(pad, z)) <= pad.w / 2 && Math.abs(z - pad.z) <= pad.d / 2;
    const dx = Math.abs(x - pad.x),
      dz = Math.abs(z - pad.z);
    // Keep the standing surface inside the cushion's rounded corners.
    return (
      dx <= pad.w * 0.5 + 0.045 && dz <= pad.d * 0.5 + 0.045 && dx + dz < (pad.w + pad.d) * 0.5 - 0.12
    );
  }
  function startSurface(s, pad) {
    const surface =
      pad.kind === 'crumble'
        ? { warning: 0, droppedAt: null, impactAt: 0, impact: 0 }
        : { slopeX: 0, slopeZ: 0, rateX: 0, rateZ: 0, impactAt: 0, impact: 0 };
    s.surfaces.set(pad.index, surface);
    return surface;
  }
  function landOnSurface(s, pad) {
    if (pad.kind === 'stairs') return rides.touchTread(s, pad, true);
    if (pad.kind !== 'crumble' && pad.kind !== 'tilt') return;
    const surface = s.surfaces.get(pad.index) || startSurface(s, pad);
    surface.impactAt = s.time;
    surface.impact = s.landingPower;
    if (pad.kind === 'tilt') {
      // Even a centered landing rocks the pivot in the direction of the jump.
      const impulse = s.landingPower * 2.5;
      surface.rateX -= Math.sin(s.heading) * impulse;
      surface.rateZ -= Math.cos(s.heading) * impulse;
    }
  }
  // Read the same surface pose for collision and drawing. Only physics advances it.
  function poseSurface(pad, surface, time) {
    if (pad.kind === 'stairs') {
      pad.footfalls = surface.footfalls;
      return;
    }
    const age = Math.max(0, Math.min(time, surface.droppedAt ?? time) - surface.impactAt);
    pad.restY = pad.y;
    pad.y -= surface.impact * 0.46 * Math.exp(-7.5 * age) * Math.sin(20 * age);
    if (pad.kind === 'crumble') {
      const { warning } = surface;
      const shake = warning ** 2;
      const phase = warning * (13 + 21 * warning);
      pad.warning = warning;
      pad.y += 0.11 * shake * Math.sin(phase * 1.21);
      pad.slopeX = 0.16 * shake * Math.sin(phase);
      pad.slopeZ = 0.12 * shake * Math.cos(phase * 0.91);
      if (surface.droppedAt !== null) {
        const fallTime = time - surface.droppedAt;
        pad.gone = true;
        pad.y -= Math.min(24, 1.2 * fallTime + 14 * fallTime ** 2);
      }
    } else {
      pad.slopeX = surface.slopeX;
      pad.slopeZ = surface.slopeZ;
    }
  }
  function updateSurfaces(s, course, pads, dt) {
    for (const pad of pads) {
      if (pad.kind === 'stairs') rides.restoreTreads(pad, s.surfaces.get(pad.index), s.time);
      if (pad.kind !== 'tilt' && pad.kind !== 'crumble') continue;
      const occupied = s.grounded === pad.index;
      let surface = s.surfaces.get(pad.index);
      if (!surface) {
        if (!occupied) continue;
        surface = startSurface(s, pad);
      }
      if (s.grounded === null) {
        pad.previousSurface = { ...pad };
        poseSurface(pad.previousSurface, surface, s.time - dt);
      }
      const difficulty = api.challenge(course, pad.index);
      if (pad.kind === 'crumble') {
        if (surface.droppedAt === null) {
          surface.warning = occupied
            ? Math.min(1, surface.warning + dt / (2.4 - difficulty * 1.25))
            : Math.max(0, surface.warning - dt * 3);
          if (surface.warning >= 1) surface.droppedAt = s.time;
        }
      } else {
        const dx = occupied ? (s.x - pad.x) / (pad.w * 0.5) : 0;
        const dz = occupied ? (s.z - pad.z) / (pad.d * 0.5) : 0;
        const radius = Math.hypot(dx, dz);
        const leverage = Math.min(1, Math.max(0, (radius - 0.25) / 0.75));
        const slope = (-(0.54 + 0.22 * difficulty) * leverage) / (radius || 1);
        // A damped pivot responds to the toy's weight and settles when it leaves.
        surface.rateX += ((slope * dx - surface.slopeX) * 39 - surface.rateX * 9) * dt;
        surface.rateZ += ((slope * dz - surface.slopeZ) * 39 - surface.rateZ * 9) * dt;
        surface.slopeX += surface.rateX * dt;
        surface.slopeZ += surface.rateZ * dt;
        if (occupied && leverage > 0) {
          const steepness = Math.hypot(surface.slopeX, surface.slopeZ);
          const slide = (Math.max(0, steepness - 0.13) / (steepness || 1)) * (4.5 + difficulty * 1.5);
          s.x -= surface.slopeX * slide * dt;
          s.z -= surface.slopeZ * slide * dt;
        }
      }
      poseSurface(pad, surface, s.time);
    }
  }
  function touchesHazard(s, h) {
    if (h.width !== undefined) {
      if (s.y >= h.maxY || s.y + 1.05 <= h.minY) return false;
      const dx = Math.max(0, Math.abs(s.x - h.x) - h.width / 2),
        dz = Math.max(0, Math.abs(s.z - h.z) - h.depth / 2);
      return Math.hypot(dx, dz) < 0.18;
    }
    const bottom = h.minY ?? h.y - h.r,
      top = h.maxY ?? h.y + h.r;
    if (s.y >= top - 0.06 || s.y + 1.05 <= bottom) return false;
    const dx = s.x - h.x,
      dz = s.z - h.z;
    const angle = h.type === 'sweeper' ? h.angle : 0;
    const ax = Math.cos(angle),
      az = Math.sin(angle);
    const along = Math.max(-h.halfSpan, Math.min(h.halfSpan, dx * ax + dz * az));
    return Math.hypot(dx - ax * along, dz - az * along) < h.r + 0.18;
  }
  function addBadges(s, count, endless, fromGift = false) {
    s.stars += count;
    if (endless && fromGift) return false;
    s.lifeProgress += count;
    if (s.lifeProgress < s.lifeGoal) return false;
    s.lifeProgress -= s.lifeGoal;
    if (endless) s.lifeGoal += endlessLifeStep;
    if (s.lives === maxLives) return false;
    s.lives++;
    return true;
  }
  function drawPrize(options) {
    const index = Math.floor(Math.random() * options.length);
    return options.splice(index, 1)[0];
  }
  function openGift(s, position, endless) {
    const loot = s.loot;
    const items = position.aerial ? loot.aerialItems : loot.remainingItems;
    const courseItem = position.aerial ? null : loot.courseItem;
    let kind = 'item';
    if (courseItem) loot.courseItem = null;
    else if (position.aerial) kind = items.length ? 'item' : 'badges';
    else {
      if (!loot.deck.length)
        loot.deck = endless
          ? ['badges', 'badges', 'item']
          : ['life', 'badges', 'badges', 'badges', 'item', 'item'];
      kind = drawPrize(loot.deck);
      if (kind === 'item' && !items.length) kind = 'badges';
    }
    if (kind === 'life' && s.lives === maxLives) kind = 'badges';
    const reward = { ...position, kind, time: s.time };
    if (kind === 'life') s.lives++;
    else if (kind === 'badges') {
      reward.count = position.aerial ? 6 : 3 + Math.floor(Math.random() * 3);
      reward.bonusLife = addBadges(s, reward.count, endless, true);
    } else {
      reward.sku = courseItem ?? drawPrize(items);
      loot.pendingItems.push(reward.sku);
    }
    loot.opened++;
    s.lastGift = reward;
  }
  function requestJump(s) {
    // Two distinct taps can arrive between animation frames on a slow display.
    if (s.buffer > 0) s.queuedJump = true;
    s.buffer = 0.16;
  }
  function tick(s, course, keys, touch, freeLook, dt) {
    if (course.endless) {
      const shift = window.FluffEndless.advance(course, s.furthest);
      s.z -= shift;
      if (shift) {
        if (s.lastStar) s.lastStar.z -= shift;
        if (s.lastGift) s.lastGift.z -= shift;
        for (const index of s.surfaces.keys()) if (index < course.firstIndex) s.surfaces.delete(index);
      }
    }
    const offset = course.firstIndex || 0;
    const before = s.time;
    s.time += dt;
    s.buffer = Math.max(0, s.buffer - dt);
    if (!s.buffer) s.queuedJump = false;
    const previousX = s.x,
      previousZ = s.z;
    const pads = api.platforms(course, s.time);
    updateSurfaces(s, course, pads, dt);
    const ground = s.grounded === null ? null : pads[s.grounded - offset];
    const onSlide = ground?.kind === 'slide';
    if (ground && ground.index !== s.routePad) {
      s.routePad = ground.index;
      s.routeLandingX = s.x - ground.x;
      s.routeLandingZ = s.z - ground.z;
    }
    if (ground) {
      const [baseX, , , , , travel] = course.path[s.grounded - offset];
      if (travel) s.x += ground.x - (baseX + travel * Math.sin(before * 1.1 + s.grounded));
    }
    const turn =
      Number(keys.has('ArrowRight') || keys.has('KeyE')) -
      Number(keys.has('ArrowLeft') || keys.has('KeyQ'));
    const previousRouteYaw = s.routeYaw;
    const targetYaw = routeDirection(pads, s.routePad - offset, s.z, s.routeLandingX, s.routeLandingZ);
    s.routeYaw = approachAngle(previousRouteYaw, targetYaw, 13, 4.6, dt);
    if (turn) s.yaw += turn * 1.85 * dt;
    else if (!freeLook) {
      // Carry the camera with the route while smoothing out the remaining free-look offset.
      s.yaw = approachAngle(s.yaw + s.routeYaw - previousRouteYaw, s.routeYaw, 9, 4.3, dt);
      s.pitch += (routePitch - s.pitch) * (1 - Math.exp(-8 * dt));
    }
    const forward =
      Number(keys.has('KeyW') || keys.has('ArrowUp')) -
      Number(keys.has('KeyS') || keys.has('ArrowDown')) + touch.forward;
    const side = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + touch.side;
    const moveLength = Math.hypot(forward, side);
    // Joystick and keys are relative to the route. The take-off axes stay fixed in the air.
    const moveYaw = s.airYaw ?? s.routeYaw;
    const sy = Math.sin(moveYaw),
      cy = Math.cos(moveYaw);
    const pace = speedMultiplier(course, s.furthest);
    const speed = baseSpeed * pace / Math.max(1, moveLength);
    let vx = (forward * sy + side * cy) * speed,
      vz = (forward * cy - side * sy) * speed;
    if (s.grounded === null) {
      if (moveLength || touch.steering) {
        const dx = vx - s.vx,
          dz = vz - s.vz;
        // A held stick near its centre brakes. Releasing it still carries the jump's momentum.
        const acceleration = airAcceleration * (touch.steering ? 1.45 : 1);
        const steer = Math.min(1, (acceleration * pace * dt) / (Math.hypot(dx, dz) || 1));
        vx = s.vx + dx * steer;
        vz = s.vz + dz * steer;
      } else {
        const drag = Math.exp(-airDrag * dt);
        vx = s.vx * drag;
        vz = s.vz * drag;
      }
    } else if (s.buffer > 0 && !moveLength && ground?.kind !== 'slide') {
      // A jump tap and direction release can arrive between the same two physics steps.
      vx = s.vx;
      vz = s.vz;
    }
    s.sliding = onSlide;
    if (s.sliding) {
      const through = ground.slide?.through;
      const topSpeed = through ? 13.5 : 10.5;
      const exitSpeed = through ? 6.5 : 4.4;
      s.slideSpeed = Math.min(topSpeed, Math.max(2.3, s.slideSpeed) + 6.4 * dt);
      const runOut = Math.min(1, (1 - rides.progress(ground, s.z)) / 0.18);
      const speedLimit = exitSpeed + (topSpeed - exitSpeed) * runOut;
      // Slow down for the jump but preserve forward momentum when crossing the lip.
      vz = Math.max(1.5, Math.min(s.slideSpeed, speedLimit) + vz * 0.18);
      const nextZ = s.z + vz * dt;
      // Carry the rider round the curve while leaving both hands free to steer across the stripes.
      vx = vx * 0.76 + (rides.laneCenter(ground, nextZ) - rides.laneCenter(ground, s.z)) / dt;
    } else s.slideSpeed = 0;
    s.moving = Math.hypot(vx, vz) > 0.03;
    if (s.moving)
      s.heading += angleDifference(Math.atan2(vx, vz), s.heading) * (1 - Math.exp(-14 * dt));
    const wind = ground?.kind === 'gust' ? window.FluffGust.wind(ground, s.time) : 0;
    s.z += vz * dt;
    s.x += (vx + wind) * dt;
    if (course.tower && s.y < course.tower.roof - 0.003) {
      const { z, radius } = course.tower;
      const dz = s.z - z;
      const distance = Math.hypot(s.x, dz);
      const wall = radius + 0.19;
      if (distance > 0 && distance < wall) {
        s.x *= wall / distance;
        s.z = z + dz * (wall / distance);
      }
    }
    if (s.sliding) {
      const center = rides.laneCenter(ground, s.z),
        limit = ground.w * 0.418;
      s.x = Math.max(center - limit, Math.min(center + limit, s.x));
    }
    s.vx = vx;
    s.vz = vz;
    const stepping = s.moving && s.grounded !== null && !s.sliding;
    s.gait += (Number(stepping) - s.gait) * (1 - Math.exp(-13 * dt));
    if (s.gait > 0.015) s.walk += dt * (8 + 3 * s.gait) * pace;
    if (s.grounded !== null) {
      let pad = pads[s.grounded - offset];
      const next = pads[s.grounded - offset + 1];
      // The roof, descent and finish are joined surfaces the plush can cross without jumping.
      const boarding = pad.kind === 'tower-roof' && next?.slide?.through;
      const arriving = pad.slide?.through && s.z >= pad.z + pad.d / 2 - 1e-6;
      if ((boarding || arriving) && next && onPad(next, s.x, s.z)) {
        pad = next;
        s.grounded = pad.index;
        s.furthest = Math.max(s.furthest, pad.index);
        if (arriving) {
          s.sliding = false;
          if (!course.endless && pad.index === pads.at(-1).index) s.finishTime ??= s.time;
        }
      }
      if (
        pad.gone ||
        !onPad(pad, s.x, s.z) ||
        (pad.kind === 'stairs' && rides.dropped(pad, s.z, s.time))
      ) {
        s.grounded = null;
        s.coyote = 0.09;
      } else {
        s.y = api.surfaceHeight(pad, s.x, s.z);
        if (pad.kind === 'stairs') {
          const reachedTread = rides.treadAt(pad, previousZ) !== rides.treadAt(pad, s.z);
          rides.touchTread(s, pad, reachedTread);
        }
      }
    }
    let event = null;
    if (s.buffer > 0 && (s.grounded !== null || s.coyote > 0 || s.airJumpReady)) {
      const spin = s.grounded === null && s.coyote <= 0;
      s.vy = spin ? 9.5 : 7.3;
      s.airJumpReady = !spin;
      if (spin) s.spinAt = s.time;
      s.grounded = null;
      s.coyote = 0;
      s.buffer = s.queuedJump && !spin ? 0.16 : 0;
      s.queuedJump = false;
      event = spin ? 'spin' : 'jump';
    }
    if (s.grounded === null) {
      s.sliding = false;
      if (ground) {
        // Carry the actual launch velocity, including the cushion's motion, into the air.
        s.airYaw = moveYaw;
        s.vx = (s.x - previousX) / dt;
        s.vz = (s.z - previousZ) / dt;
      }
      const oldY = s.y;
      s.coyote = Math.max(0, s.coyote - dt);
      s.vy -= 19 * dt;
      s.y += s.vy * dt;
      if (s.vy <= 0) {
        for (const p of pads) {
          if (p.gone || !onPad(p, s.x, s.z) || (p.kind === 'stairs' && rides.dropped(p, s.z, s.time)))
            continue;
          const height = api.surfaceHeight(p, s.x, s.z);
          let previousHeight = p.previousSurface
            ? api.surfaceHeight(p.previousSurface, s.x, s.z)
            : height;
          // Sweep across the riser. The previous foot position can be below the new
          // tread even though it was still above the lower tread throughout the jump.
          if (p.kind === 'stairs') {
            const entered = !onPad(p, previousX, previousZ);
            const climbed =
              rides.treadAt(p, previousZ) < rides.treadAt(p, s.z) &&
              !rides.dropped(p, previousZ, s.time);
            if (entered || climbed) previousHeight = height - rides.rise - 0.05;
          }
          if (oldY >= previousHeight - 0.003 && s.y <= height) {
            s.landingPower = Math.min(1, -s.vy / 7.3);
            s.landAt = s.time;
            if (p.kind) landOnSurface(s, p);
            s.grounded = p.index;
            s.airYaw = null;
            s.airJumpReady = false;
            s.furthest = Math.max(s.furthest, p.index);
            s.y = height;
            s.vy = 0;
            s.coyote = 0.09;
            if (!course.endless && p.index === pads.length - 1) s.finishTime ??= s.time;
            if (p.index > s.checkpoint && course.checkpoints?.includes(p.index)) {
              s.checkpoint = p.index;
              event = 'checkpoint';
            }
            break;
          }
        }
      }
    }
    s.airBlend += (Number(s.grounded === null) - s.airBlend) * (1 - Math.exp(-16 * dt));
    const hazards = api.hazards(course, pads, s.time);
    const hazard = hazards.find((h) => touchesHazard(s, h));
    if (hazard) {
      s.lastHazard = hazard.type;
      event = 'bump';
    }
    if (s.y < -4.8) event = 'fall';
    if (event !== 'bump' && event !== 'fall') {
      const last = pads.at(-1);
      if (!course.endless && Math.abs(s.z - last.z) <= last.d / 2 && s.y >= last.y - 0.08) {
        const gate = api.finishPortal(last);
        const across = (s.x - gate.x) / gate.radiusX;
        const above = (s.y + 0.65 - gate.y) / gate.radiusY;
        if (Math.abs(s.z - gate.z) < 0.14 && across * across + above * above < 0.95) {
          s.finishTime ??= s.time;
          event = 'win';
        }
      }
      for (let i = 0; i < course.stars.length; i++) {
        const star = course.stars[i];
        const position = window.FluffEndless.starPosition(star, pads[star.at - offset], s.time);
        if (
          Math.hypot(position.x - s.x, position.z - s.z) <= 0.52 &&
          position.y >= s.y - 0.16 &&
          position.y <= s.y + 1.21
        ) {
          course.stars.splice(i, 1);
          const bonusLife = addBadges(s, 1, course.endless);
          s.lastStar = { ...position, time: s.time, bonusLife };
          break;
        }
      }
      for (let i = 0; i < course.gifts.length; i++) {
        const gift = course.gifts[i],
          pad = pads[gift.at - offset];
        if (Math.abs(pad.z + gift.dz - s.z) > 0.78) continue;
        const pos = api.giftPosition(gift, pad, s.time);
        if (
          Math.hypot(s.x - pos.x, s.z - pos.z) < 0.78 &&
          s.y < pos.y + 0.6 &&
          s.y + 1.05 > pos.y - 0.46
        ) {
          course.gifts.splice(i, 1);
          openGift(s, pos, course.endless);
          break;
        }
      }
    }
    if (event !== 'fall' && event !== 'win') s.encounterAudio.tick(s, pads, hazards, before, hazard);
    return event;
  }
  class Game {
    constructor(canvas, hooks) {
      this.canvas = canvas;
      this.hooks = hooks;
      this.world = new window.FluffWorld(canvas, { tryThree: true });
      this.keys = new Set();
      this.mode = 'idle';
      this.drag = null;
      this.frame = 0;
      this.touch = new window.FluffTouchControls(
        canvas,
        () => this.mode === 'running',
        (dx, dy, sensitivity) => this.look(dx, dy, sensitivity),
        () => requestJump(this.state),
      );
      window.addEventListener('keydown', (e) => this.key(e, true));
      window.addEventListener('keyup', (e) => this.key(e, false));
      document.addEventListener('mousemove', (e) => {
        if (this.mode === 'running' && this.drag && document.pointerLockElement === canvas)
          this.look(e.movementX, e.movementY);
      });
      document.addEventListener('pointerlockchange', () => {
        if (document.pointerLockElement === canvas) {
          this.locked = true;
        } else if (this.locked) {
          this.locked = false;
          if (this.mode === 'running') this.pause();
        }
      });
      canvas.addEventListener('pointerdown', (e) => {
        if (this.mode !== 'running' || e.pointerType === 'touch' || e.button !== 0) return;
        this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
        if (document.pointerLockElement !== canvas) {
          canvas.setPointerCapture(e.pointerId);
          if (e.pointerType === 'mouse') this.capture();
        }
      });
      canvas.addEventListener('pointermove', (e) => {
        if (
          this.mode !== 'running' ||
          document.pointerLockElement === canvas ||
          this.drag?.id !== e.pointerId
        )
          return;
        this.look(e.clientX - this.drag.x, e.clientY - this.drag.y);
        this.drag.x = e.clientX;
        this.drag.y = e.clientY;
      });
      for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        canvas.addEventListener(event, (e) => {
          if (this.drag?.id === e.pointerId) this.drag = null;
        });
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.pause();
      });
      window.addEventListener('blur', () => this.pause());
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        this.stop();
        this.hooks.error('3D-grafiikka keskeytyi. Lataa peli uudelleen jatkaaksesi.');
      });
    }
    start(course, carry, owned = [], waitForArrival = false) {
      // A portal continues on the same canvas. Keep mouse capture during the handoff.
      if (this.mode !== 'transferring') this.stop();
      this.course = course.endless
        ? window.FluffEndless.create()
        : { ...course, stars: [...course.stars], gifts: [...course.gifts] };
      const { exclusives, aerialExclusives, flowerGifts } = window.FluffLooks;
      const courseItem = Object.hasOwn(flowerGifts, course.id) ? flowerGifts[course.id] : null;
      this.state = spawn(
        exclusives.filter((sku) => !owned.includes(sku)),
        aerialExclusives.filter((sku) => !owned.includes(sku)),
        owned.includes(courseItem) ? null : courseItem,
      );
      if (Number.isInteger(carry?.lives))
        this.state.lives = Math.min(maxLives, Math.max(0, carry.lives));
      if (Number.isInteger(carry?.lifeProgress))
        this.state.lifeProgress = Math.min(starsPerLife - 1, Math.max(0, carry.lifeProgress));
      if (course.endless) {
        this.state.lifeGoal = endlessFirstLife;
        window.FluffEndless.advance(this.course, 0);
      }
      const yaw = routeDirection(api.platforms(this.course, 0), 0, this.state.z, 0, this.state.z);
      this.state.routeYaw = this.state.yaw = this.state.heading = yaw;
      this.world.setup(this.course);
      window.FluffSound.setCourse(course.id);
      if (waitForArrival) {
        this.mode = 'transferring';
        this.draw();
      } else this.resume();
    }
    retry() {
      if (this.mode !== 'recovering' || this.state.lives === 0) return;
      const { checkpoint, time, finishTime, lives, stars, lifeProgress, lifeGoal, furthest, loot } =
        this.state;
      this.stop();
      const pads = api.platforms(this.course, time);
      const index = finishTime === null ? checkpoint - (this.course.firstIndex || 0) : pads.length - 1;
      const pad = pads[index];
      const landingZ = pad.index ? 0 : -1.35;
      const yaw = routeDirection(pads, index, pad.z + landingZ, 0, landingZ);
      this.state = {
        ...spawn(),
        x: pad.x,
        y: pad.y,
        z: pad.z + landingZ,
        yaw,
        routeYaw: yaw,
        routePad: pad.index,
        routeLandingZ: landingZ,
        heading: yaw,
        grounded: pad.index,
        furthest: this.course.endless ? furthest : pad.index,
        checkpoint,
        time,
        finishTime,
        lives,
        stars,
        lifeProgress,
        lifeGoal,
        loot,
      };
      this.resume();
    }
    key(e, down) {
      if (this.mode !== 'running') return;
      if (
        ![
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'KeyQ',
          'KeyE',
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          'Space',
          'Escape',
          'KeyP',
          'KeyV',
          'KeyM',
        ].includes(e.code)
      )
        return;
      e.preventDefault();
      if (e.code === 'KeyV' || e.code === 'KeyM') {
        if (down && !e.repeat) {
          if (e.code === 'KeyV') this.hooks.camera();
          else this.hooks.music();
        }
        return;
      }
      if ((e.code === 'Escape' || e.code === 'KeyP') && down && !e.repeat) {
        this.pause();
        return;
      }
      if (e.code === 'Space' && down && !e.repeat && !this.keys.has('Space')) requestJump(this.state);
      if (down) this.keys.add(e.code);
      else this.keys.delete(e.code);
    }
    look(dx, dy, sensitivity = 0.0025) {
      this.state.yaw += dx * sensitivity;
      this.state.pitch = Math.max(-1.15, Math.min(0.98, this.state.pitch - dy * sensitivity * 0.92));
    }
    capture() {
      if (
        this.mode !== 'running' ||
        !matchMedia('(pointer:fine)').matches ||
        document.pointerLockElement === this.canvas
      )
        return;
      try {
        this.canvas.requestPointerLock?.()?.catch?.(() => {});
      } catch {}
    }
    release() {
      window.FluffSound.setPlaying(false);
      this.keys.clear();
      this.touch.clear();
      this.drag = null;
      this.locked = false;
      if (document.pointerLockElement === this.canvas) document.exitPointerLock();
      cancelAnimationFrame(this.frame);
    }
    pause() {
      if (this.mode !== 'running') return;
      this.mode = 'paused';
      this.release();
      this.hooks.pause();
    }
    resume() {
      this.keys.clear();
      this.touch.clear();
      this.state.buffer = 0;
      this.state.queuedJump = false;
      this.mode = 'running';
      window.FluffSound.setPlaying(true);
      this.acc = 0;
      this.previous = performance.now();
      this.canvas.focus({ preventScroll: true });
      this.capture();
      this.loop(this.previous);
    }
    stop() {
      this.mode = 'idle';
      this.release();
    }
    draw(focus = null) {
      const pads = api.platforms(this.course, this.state.time);
      for (const pad of pads) {
        const surface = this.state.surfaces.get(pad.index);
        if (surface) poseSurface(pad, surface, this.state.time);
      }
      this.world.render(this.state, pads, api.hazards(this.course, pads, this.state.time), focus);
      return pads;
    }
    loop(now) {
      if (this.mode !== 'running') return;
      this.acc += Math.min((now - this.previous) / 1000, 0.12);
      this.previous = now;
      let outcome = null;
      while (this.acc >= step && !outcome) {
        this.acc -= step;
        const freeLook = this.drag || this.touch.looking?.dragged;
        const event = tick(this.state, this.course, this.keys, this.touch, freeLook, step);
        if (event === 'checkpoint') {
          this.hooks.checkpoint(this.state.checkpoint);
        } else if (event === 'jump' || event === 'spin') {
          window.FluffSound.play(event);
          if (event === 'spin' && this.world.look) window.FluffSound.effect(this.world.look.ears, 0.64);
        } else if (event) outcome = event;
      }
      const lostLife = outcome === 'fall' || outcome === 'bump';
      if (lostLife) this.state.lives = Math.max(0, this.state.lives - 1);
      const pads = this.draw();
      this.hooks.frame(this.state, pads);
      if (outcome === 'win') {
        this.mode = 'transferring';
        this.touch.clear();
        this.hooks.end(outcome, this.state.finishTime);
      } else if (outcome) {
        this.mode = lostLife && this.state.lives > 0 ? 'recovering' : 'ended';
        this.release();
        this.hooks.end(outcome, this.state.time);
      } else this.frame = requestAnimationFrame((t) => this.loop(t));
    }
  }
  window.FluffGame = Game;
  Game.maxLives = maxLives;
  Game.starsPerLife = starsPerLife;
  Game.endlessFirstLife = endlessFirstLife;
  Game.endlessLifeStep = endlessLifeStep;
  Game.speedMultiplier = speedMultiplier;
})();
