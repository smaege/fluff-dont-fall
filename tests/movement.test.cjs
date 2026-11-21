const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Drive the game's normal start, keyboard, fixed-step loop and retry paths without a graphics device.
function startGame(courseId = 'cloud', localStorage) {
  const noOp = () => {};
  function eventTarget(properties = {}) {
    const listeners = new Map();
    const captures = new Set();
    const target = {
      setPointerCapture: id => captures.add(id),
      hasPointerCapture: id => captures.has(id),
      releasePointerCapture: id => captures.delete(id),
      style: { setProperty: noOp },
      setAttribute: noOp,
      removeAttribute: noOp,
      ...properties,
      addEventListener(name, listen) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listen);
      },
      dispatch(name, values) {
        for (const listen of listeners.get(name) ?? []) {
          listen({ preventDefault: noOp, currentTarget: target, ...values });
        }
      },
    };
    return target;
  }
  const stick = eventTarget(), jump = eventTarget();
  const canvas = eventTarget({ focus: noOp, getBoundingClientRect: () => ({ width: 400, left: 0 }) });
  const context = vm.createContext({
    document: eventTarget({ getElementById: id => id === 'touch-stick' ? stick : jump }),
    addEventListener: noOp,
    localStorage,
    performance: { now: () => 0 },
    matchMedia: () => ({ matches: false }),
    cancelAnimationFrame: noOp,
    requestAnimationFrame: noOp,
  });
  context.window = context;
  context.FluffWorld = class {
    setup() {}
    render() {}
  };
  const effects = [];
  const sounds = [];
  context.FluffSound = {
    play: (cue) => sounds.push(cue),
    effect: (cue, gain, pan) => effects.push({ cue, gain, pan, time: game.state.time }),
    setPlaying: noOp,
    setCourse: noOp,
  };
  for (const name of [
    'plush-options',
    'profiles',
    'sky-rides',
    'gust',
    'pad-styles',
    'critters',
    'sky-friends',
    'fairground',
    'obstacles',
    'courses',
    'endless',
    'encounter-audio',
    'touch-controls',
    'game',
  ]) {
    const file = path.join(__dirname, '..', name + '.js');
    vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file });
  }
  const game = new context.FluffGame(canvas, {
    frame: noOp, end: noOp, checkpoint: noOp, pause: noOp,
  });
  const course =
    courseId === 'endless'
      ? context.FluffEndless.course
      : context.FluffCourses.all.find((candidate) => candidate.id === courseId);
  game.start(course);
  const pads = context.FluffCourses.platforms(game.course, 0);
  const place = (pad, x = pad.x, z = pad.z) =>
    Object.assign(game.state, {
      grounded: pad.index,
      furthest: pad.index,
      x,
      z,
      y: context.FluffCourses.surfaceHeight(pad, x, z),
      vy: 0,
    });
  const advance = (ticks) => {
    for (let i = 0; i < ticks && game.mode === 'running'; i++)
      game.loop(game.previous + 1000 / 120 + 1e-8);
  };
  const press = (code, down) => game.key({ code, repeat: false, preventDefault: noOp }, down);
  const tap = () => {
    press('Space', true);
    press('Space', false);
  };
  const touch = (name, pointerId, clientX, clientY, timeStamp = 0, target = canvas) =>
    target.dispatch(name, { pointerType: 'touch', pointerId, clientX, clientY, timeStamp, button: 0 });
  return {
    game, course, pads, place, advance, press, tap, touch, canvas, jump,
    effects, sounds,
    profiles: context.FluffProfiles, courses: context.FluffCourses, obstacles: context.FluffObstacles,
    endless: context.FluffEndless,
    gust: context.FluffGust, friends: context.FluffSkyFriends, critters: context.FluffCritters,
  };
}

test('releasing Space before takeoff preserves the jump arc and holding it never spends the spin', () => {
  const held = startGame();
  const tapped = startGame();
  held.press('Space', true);
  tapped.tap();
  for (let i = 0; i < 100; i++) {
    held.advance(1);
    tapped.advance(1);
    assert.equal(tapped.game.state.y, held.game.state.y);
    assert.equal(tapped.game.state.vy, held.game.state.vy);
  }
  assert.equal(held.game.state.spinAt, -1);
  assert.equal(held.game.state.grounded, 0);
});

test('releasing a keyboard direction in flight keeps momentum and steering can reverse it', () => {
  const { game, advance, press, tap } = startGame();
  press('KeyW', true);
  tap();
  advance(1);
  const launch = { z: game.state.z, vz: game.state.vz };
  press('KeyW', false);
  advance(1);
  assert.ok(game.state.vz > launch.vz * 0.95);
  advance(24);
  assert.ok(game.state.z - launch.z > 1);
  assert.ok(game.state.vz < launch.vz);
  press('KeyS', true);
  advance(1);
  assert.ok(game.state.vz > 0);
  advance(32);
  assert.ok(game.state.vz < 0);
});

test('touch taps and cancellation preserve the arc, and pausing clears held controls', () => {
  const held = startGame();
  const released = startGame();
  for (const run of [held, released]) {
    run.touch('pointerdown', 1, 65, 250);
    run.touch('pointermove', 1, 65, 205);
    run.touch('pointerdown', 2, 330, 250);
    run.touch('pointerup', 2, 330, 250, 80);
    run.advance(1);
  }
  const launchZ = released.game.state.z;
  released.touch('pointercancel', 1, 65, 205);
  held.advance(25);
  released.advance(25);
  assert.equal(released.game.state.y, held.game.state.y);
  assert.equal(released.game.state.vy, held.game.state.vy);
  assert.ok(released.game.state.z > launchZ + 1);
  assert.ok(released.game.state.z < held.game.state.z);

  held.game.pause();
  held.game.resume();
  held.advance(1);
  assert.ok(held.game.state.vz < 5.75 && held.game.state.vz > 5);
  held.touch('pointerdown', 3, 340, 250, 100, held.jump);
  held.touch('pointerup', 3, 340, 250, 178, held.jump);
  held.advance(1);
  assert.ok(held.game.state.spinAt > 0);

  Object.assign(held.game.state, { y: -5 });
  held.advance(1);
  assert.equal(held.game.mode, 'recovering');
  held.game.retry();
  const retryZ = held.game.state.z;
  held.advance(12);
  assert.equal(held.game.state.z, retryZ);
});

test('the left thumb controls speed and steering as the right thumb aims or jumps', () => {
  const { game, advance, touch } = startGame();
  const { state } = game;
  // Touching the left side anywhere establishes a neutral centre for that thumb.
  touch('pointerdown', 1, 156, 275);
  touch('pointermove', 1, 159, 273);
  advance(4);
  assert.equal(state.yaw, 0);
  assert.equal(state.vz, 0);
  touch('pointermove', 1, 178, 249);
  advance(12);
  assert.equal(state.yaw, 0);
  assert.ok(state.vx > 0);
  assert.ok(state.vz > 0 && state.vz < 5.75);

  const pitch = state.pitch;
  touch('pointerdown', 2, 315, 270, 100);
  touch('pointermove', 2, 269, 297, 140);
  touch('pointerup', 2, 269, 297, 155);
  assert.ok(state.yaw < 0);
  assert.ok(state.pitch < pitch);
  assert.equal(state.buffer, 0);
  assert.ok(game.touch.forward > 0 && game.touch.side > 0);

  touch('pointerdown', 3, 312, 265, 200);
  touch('pointerup', 3, 313, 266, 800);
  touch('pointerdown', 4, 310, 265, 900);
  touch('pointercancel', 4, 310, 265, 940);
  assert.equal(state.buffer, 0);

  touch('pointerdown', 5, 309, 260, 1000);
  touch('pointerup', 5, 312, 264, 1070);
  touch('pointerdown', 6, 320, 272, 1120);
  touch('pointerup', 6, 320, 272, 1165);
  advance(3);
  assert.equal(state.grounded, null);
  assert.ok(state.vy > 8 && state.spinAt > 0);
  touch('lostpointercapture', 1, 178, 249);
  assert.equal(game.touch.forward, 0);
  assert.equal(game.touch.side, 0);
});

test('the jump button responds immediately and centring the held stick brakes in midair', () => {
  const { game, advance, touch, jump } = startGame();
  const { state } = game;
  touch('pointerdown', 1, 71, 240);
  touch('pointermove', 1, 71, 192);
  advance(6);
  touch('pointerdown', 2, 352, 244, 100, jump);
  advance(3);
  assert.ok(state.vy > 0 && state.vz > 5);
  touch('pointermove', 1, 71, 240);
  advance(22);
  assert.ok(Math.abs(state.vz) < 0.01 && state.grounded === null);
  assert.equal(state.spinAt, -1);
  touch('pointerup', 2, 352, 244, 400, jump);
  advance(3);
  assert.equal(state.spinAt, -1);
});

test('a quick jump tap and a direction release in one physics step preserve running speed', () => {
  const run = startGame();
  run.press('KeyW', true);
  run.advance(5);
  run.tap();
  run.press('KeyW', false);
  const startZ = run.game.state.z;
  run.advance(25);
  assert.equal(run.game.state.grounded, null);
  assert.ok(run.game.state.z > startZ + 1);
});

test('a moving cushion contributes its sideways velocity to a standing jump', () => {
  const run = startGame('candy');
  const pad = run.pads.find(p => run.game.course.path[p.index][5] > 0);
  run.place(pad);
  run.advance(1);
  const startX = run.game.state.x;
  run.tap();
  run.advance(1);
  const launchSpeed = run.game.state.vx;
  assert.ok(Math.abs(launchSpeed) > 0.1);
  run.advance(24);
  assert.equal(run.game.state.grounded, null);
  assert.ok((run.game.state.x - startX) / launchSpeed > 0.17);
});

test('a coyote jump keeps the speed from stepping off an edge', () => {
  const { game, pads, place, advance, press, tap } = startGame();
  const pad = pads[0];
  place(pad, pad.x, pad.z + pad.d / 2 - 0.01);
  press('KeyW', true);
  for (let i = 0; i < 5 && game.state.grounded !== null; i++) advance(1);
  assert.equal(game.state.grounded, null);
  press('KeyW', false);
  tap();
  const edgeZ = game.state.z;
  advance(25);
  assert.ok(game.state.z > edgeZ + 1);
  assert.ok(game.state.y > 0.7);
  assert.equal(game.state.spinAt, -1);
  assert.equal(game.state.airJumpReady, true);
});

test('jumping from the slide carries the slide speed into the air', () => {
  const { game, pads, place, advance, tap } = startGame();
  const slide = pads.find((pad) => pad.kind === 'slide');
  place(slide, slide.x, slide.z - slide.d * 0.35);
  advance(40);
  assert.equal(game.state.sliding, true);
  const slideSpeed = game.state.vz;
  assert.ok(slideSpeed > 3);
  const takeoffZ = game.state.z;
  tap();
  advance(12);
  assert.equal(game.state.sliding, false);
  assert.equal(game.state.grounded, null);
  assert.ok(game.state.z > takeoffZ + slideSpeed * 0.09);
});

test('every new slide can be ridden from its checkpoint and jumped from the run-out', () => {
  const routes = { grove: 22, reef: 26, orchard: 27, rose: 22, meadow: 25, tulip: 30 };
  for (const [id, length] of Object.entries(routes)) {
    const { game, pads, place, advance, touch } = startGame(id);
    const slide = pads.find((pad) => pad.kind === 'slide');
    assert.equal(slide.d, length, id);
    assert.ok(game.course.checkpoints.includes(slide.index - 2), id);
    assert.equal(pads[slide.index - 1].kind, 'stairs', id);
    const before = pads[slide.index - 2], after = pads[slide.index + 1];
    const end = slide.z + slide.d / 2;
    game.course.hazards = [];
    place(before, before.x, before.z + before.d / 2 - 1);
    touch('pointerdown', 1, 64, 240);
    touch('pointermove', 1, 64, 194);
    let rode = false;
    for (let frame = 0; frame < 900 && game.state.z < end - 0.45; frame++) {
      advance(1);
      rode ||= game.state.sliding;
    }
    assert.ok(rode && game.state.z > end - 0.5, id);
    assert.equal(game.state.grounded, slide.index, id);
    assert.ok(!game.state.sliding, id);
    game.state.yaw = Math.atan2(after.x - game.state.x, after.z - game.state.z);
    touch('pointerdown', 2, 320, 250, 100);
    touch('pointerup', 2, 320, 250, 170);
    for (let frame = 0; frame < 125 && game.state.grounded !== after.index; frame++) advance(1);
    assert.equal(game.state.grounded, after.index, id);
  }
});

test('the tower is a continuous climb around two turns, with a solid wall below its roof', () => {
  const { game, course, pads, place, advance, press, tap } = startGame('tower');
  const roof = pads.find((pad) => pad.kind === 'tower-roof'), bridge = pads[roof.index - 1];
  assert.equal(roof.kind, 'tower-roof');
  assert.ok(roof.y > 22 && course.checkpoints.length >= 5);
  for (const turn of [2, 17, 32]) {
    assert.ok(Math.abs(pads[turn].x - pads[2].x) < 1e-6);
    assert.ok(Math.abs(pads[turn].z - pads[2].z) < 1e-6);
  }
  place(bridge);
  press('KeyW', true);
  advance(36);
  assert.ok(game.state.z <= course.tower.z - course.tower.radius);
  assert.equal(game.state.grounded, bridge.index);

  // Exercise every hop in the real fixed-step loop with the critters out of the way.
  for (let at = 0; at < roof.index; at++) {
    const from = pads[at], to = pads[at + 1];
    assert.ok(to.y > from.y);
    game.start(course);
    game.course.hazards = [];
    const yaw = Math.atan2(to.x - from.x, to.z - from.z);
    const runUp = from === bridge ? 0.08 : 1.2;
    place(from, from.x + Math.sin(yaw) * runUp, from.z + Math.cos(yaw) * runUp);
    game.state.yaw = yaw;
    press('KeyW', true);
    tap();
    for (let frame = 0; frame < 118 && game.state.grounded !== to.index; frame++) advance(1);
    assert.equal(game.state.grounded, to.index, `tower cushions ${at} → ${to.index}`);
  }
});

test('the tower slide carries a rider from the roof to the portal terrace without a jump', () => {
  const { game, pads, place, advance, press, touch, courses } = startGame('tower');
  const [roof, slide, finish] = pads.slice(-3);
  const entry = slide.z - slide.d / 2;
  const end = slide.z + slide.d / 2;
  assert.equal(slide.d, 56);
  assert.ok(game.course.checkpoints.includes(roof.index));
  assert.ok(Math.abs(courses.surfaceHeight(slide, 0, entry) - roof.y) < 0.04);
  assert.ok(courses.surfaceHeight(slide, 0, entry) - courses.surfaceHeight(slide, 0, end) > 22);
  place(roof, 0, entry - 0.5);
  assert.equal(game.state.finishTime, null);
  touch('pointerdown', 1, 64, 240);
  touch('pointermove', 1, 64, 194);
  advance(18);
  assert.equal(game.state.grounded, slide.index);
  touch('pointerup', 1, 64, 194);
  let fastest = 0;
  for (let i = 0; i < 1450 && game.state.grounded !== finish.index; i++) {
    advance(1);
    fastest = Math.max(fastest, game.state.vz);
    assert.notEqual(game.state.grounded, null);
  }
  assert.ok(fastest > 11);
  assert.equal(game.state.grounded, finish.index);
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.y, finish.y);
  assert.ok(game.state.finishTime > 0);
  press('KeyW', true);
  advance(150);
  assert.equal(game.mode, 'transferring');
});

test('the tower wildlife paths keep their wings and bodies clear of the masonry', () => {
  const { game, pads, courses, friends, critters } = startGame('tower');
  const tower = game.course.tower;
  const seen = new Set();
  critters.draw = (_, pose) => {
    seen.add(pose.at);
    assert.ok(Math.hypot(pose.x, pose.z - tower.z) > tower.radius + 2.4 * pose.scale);
  };
  const world = {
    course: game.course,
    project: () => null,
    view: {
      camera: [0, 12, -3], forward: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0],
      lensX: 0.55, lensY: 0.55, width: 800, height: 600,
    },
  };
  for (let t = 0; t <= 30; t += 0.1) {
    game.state.time = t;
    friends.draw(world, pads, game.state);
    for (const pose of courses.hazards(game.course, pads, t)) {
      assert.ok(Math.hypot(pose.x, pose.z - tower.z) > tower.radius + 1.6 * pose.scale);
    }
  }
  assert.ok(seen.size >= 5);
});

test('walk onto the staircase, revisit a tread, then try the same staircase after a fall', () => {
  const { game, pads, place, advance, press } = startGame();
  const stairs = pads.find((p) => p.kind === 'stairs'),
    approach = pads[stairs.index - 1];
  function walkToFirstTread() {
    place(approach);
    press('KeyW', true);
    for (let n = 0; n < 110 && game.state.grounded !== stairs.index; n++) advance(1);
    assert.equal(game.state.grounded, stairs.index);
    press('KeyW', false);
  }
  walkToFirstTread();
  advance(450);
  press('KeyW', true);
  advance(29);
  press('KeyW', false);
  press('KeyS', true);
  advance(24);
  press('KeyS', false);
  const lastTouch = game.state.surfaces.get(stairs.index).footfalls[0];
  assert.ok(lastTouch > 3.75);
  while (game.state.time < lastTouch + 5 - 1 / 120) advance(1);
  assert.equal(game.state.grounded, stairs.index);
  advance(2);
  assert.equal(game.state.grounded, null);
  advance(160);
  assert.equal(game.mode, 'recovering');
  game.retry();
  walkToFirstTread();
  press('KeyW', true);
  advance(270);
  press('KeyW', false);
  assert.equal(pads[game.state.grounded].kind, 'slide');
});

test('a winged gift needs a second tap, including two presses between rendered frames', () => {
  const { game, pads, place, advance, tap } = startGame();
  const gift = game.course.gifts.find((g) => g.aerial),
    pad = pads[gift.at];
  place(pad, pad.x + gift.dx, pad.z + gift.dz);
  tap();
  advance(110);
  assert.equal(game.state.grounded, pad.index);
  assert.equal(game.state.loot.opened, 0);
  tap();
  tap();
  advance(4);
  const launchTime = game.state.spinAt;
  assert.ok(launchTime > 0 && !game.state.airJumpReady);
  tap();
  advance(45);
  assert.equal(game.state.spinAt, launchTime);
  assert.equal(game.state.lastGift.aerial, true);
  assert.equal(game.state.loot.opened, 1);
  assert.ok(['wings:aurora', 'shoes:comet'].includes(game.state.lastGift.sku));
});

test('the first ordinary gift opened on each flower course awards its own item once', () => {
  const flowerRewards = {
    rose: 'head:rosecrown',
    meadow: 'shoes:cloverslippers',
    lagoon: 'item:lagoonlantern',
    tulip: 'wings:tulippetals',
  };
  for (const [id, reward] of Object.entries(flowerRewards)) {
    const { game, pads, place, advance, tap } = startGame(id);
    const aerial = game.course.gifts.find((gift) => gift.aerial);
    const [first, second] = game.course.gifts.filter((gift) => !gift.aerial);
    const placeAtGift = (gift) => {
      const pad = pads[gift.at];
      place(pad, pad.x + gift.dx, pad.z + gift.dz);
    };
    placeAtGift(aerial);
    tap();
    tap();
    advance(50);
    assert.equal(game.state.lastGift.aerial, true, id);
    assert.ok(['wings:aurora', 'shoes:comet'].includes(game.state.lastGift.sku), id);

    // Skipping the earliest box still awards the item at the first ordinary box opened.
    placeAtGift(second);
    advance(1);
    assert.equal(game.state.lastGift.sku, reward, id);
    assert.ok(game.state.loot.pendingItems.includes(reward), id);

    Object.assign(game.state, { grounded: null, y: -5 });
    advance(1);
    game.retry();
    placeAtGift(first);
    advance(1);
    assert.equal(game.state.loot.opened, 3, id);
    assert.ok(!Object.values(flowerRewards).includes(game.state.lastGift.sku), id);
  }
});

test('flower rewards persist on old profiles and stay locked on new profiles', () => {
  const key = 'fluff-profile:vanha';
  const records = new Map([
    [key, JSON.stringify({ name: 'Vanha', lastUsed: 1, stars: 20, unlocked: ['item:bee'] })],
  ]);
  const localStorage = {
    getItem: (name) => records.get(name) ?? null,
    setItem: (name, value) => records.set(name, value),
  };
  const { profiles, game, course, pads, place, advance } = startGame('rose', localStorage);
  const reward = 'head:rosecrown';
  const fitted = { head: 'rosecrown' };
  assert.throws(() => profiles.look('Vanha', fitted), /yllätyslaatikosta/);
  assert.throws(() => profiles.unlock('Vanha', reward), /ostettava/);
  profiles.grantExclusive('Vanha', reward);
  profiles.grantExclusive('Vanha', reward);
  profiles.look('Vanha', fitted);
  const reloaded = startGame('rose', localStorage).profiles.find('Vanha');
  assert.equal(reloaded.appearance.head, fitted.head);
  assert.equal(reloaded.stars, 20);
  assert.deepEqual(Array.from(reloaded.unlocked), ['item:bee', reward]);
  assert.equal(profiles.open('Uusi').appearance.head, 'none');
  assert.throws(() => profiles.look('Uusi', fitted), /yllätyslaatikosta/);

  game.start(course, null, reloaded.unlocked);
  const gift = game.course.gifts.find((gift) => !gift.aerial);
  const pad = pads[gift.at];
  place(pad, pad.x + gift.dx, pad.z + gift.dz);
  advance(1);
  assert.equal(game.state.loot.opened, 1);
  assert.notEqual(game.state.lastGift.sku, reward);
});

test('an unoccupied tread returns in the same run and catches a descending jump at its riser', () => {
  const { game, pads, place, advance, press } = startGame();
  const stairs = pads.find((p) => p.kind === 'stairs');
  const start = stairs.z - stairs.d / 2,
    treadDepth = stairs.d / 8;
  place(stairs, stairs.x, start + 0.7);
  advance(10);
  press('KeyW', true);
  advance(30);
  press('KeyW', false);
  // Stand elsewhere while both touched treads fall and regenerate.
  place(pads[stairs.index - 1]);
  advance(800);
  assert.equal(game.state.surfaces.get(stairs.index).footfalls[0], null);
  Object.assign(game.state, {
    x: stairs.x,
    z: start + treadDepth - 0.008,
    y: stairs.y + 0.13,
    grounded: null,
    vy: -1.5,
    vz: 2,
  });
  press('KeyW', true);
  advance(1);
  assert.equal(game.state.grounded, stairs.index);
  assert.ok(game.state.y > stairs.y + 0.4);
  assert.ok(Math.abs(game.state.surfaces.get(stairs.index).footfalls[1] - game.state.time) < 1e-6);
});

test('landing records the finish, but only the portal opening takes the plush onward', () => {
  const { game, pads, place, press, advance } = startGame();
  const last = pads.at(-1);
  place(last, last.x + 2, last.z - 1);
  Object.assign(game.state, { grounded: null, y: last.y + 0.004, vy: -1 });
  advance(2);
  const time = game.state.finishTime;
  assert.ok(time > 0);
  press('KeyW', true);
  advance(48);
  assert.equal(game.mode, 'running');
  press('KeyW', false);
  Object.assign(game.state, { grounded: null, y: -5 });
  advance(1);
  game.retry();
  assert.equal(game.state.grounded, last.index);
  assert.equal(game.state.finishTime, time);
  let arrival;
  game.hooks.end = (event, seconds) => {
    arrival = { event, seconds };
  };
  press('KeyW', true);
  advance(32);
  assert.deepEqual(arrival, { event: 'win', seconds: time });
  assert.equal(game.mode, 'transferring');
});

test('three lives cap badge milestones, life gifts and carried lives', () => {
  const { game, course, pads, place, advance } = startGame();
  function collectBadge() {
    game.course.stars.push({ at: 0, dx: 0, dz: 0 });
    place(pads[0]);
    advance(1);
  }
  function openLifeGift() {
    game.state.loot.deck = ['life'];
    game.course.gifts.push({ at: 0, dx: 0, dz: 0 });
    place(pads[0]);
    advance(1);
    return game.state.lastGift;
  }
  function loseLife() {
    Object.assign(game.state, { grounded: null, y: -5 });
    advance(1);
    game.retry();
  }

  assert.equal(game.state.lives, 3);
  game.start(course, { lives: 6, lifeProgress: 9 });
  assert.equal(game.state.lives, 3);
  collectBadge();
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.stars, 1);
  assert.equal(game.state.lastStar.bonusLife, false);
  assert.equal(game.state.lifeProgress, 0);

  const gift = openLifeGift();
  assert.equal(gift.kind, 'badges');
  assert.ok(gift.count > 0);
  assert.equal(game.state.stars, 1 + gift.count);
  assert.equal(game.state.lives, 3);
  loseLife();
  assert.equal(game.state.lives, 2);
  assert.equal(openLifeGift().kind, 'life');
  assert.equal(game.state.lives, 3);

  loseLife();
  for (let i = gift.count; i < 10; i++) collectBadge();
  assert.equal(game.state.lastStar.bonusLife, true);
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.stars, 11);

  game.start(course, { lives: 1, lifeProgress: 8 });
  collectBadge();
  assert.equal(game.state.lives, 1);
  collectBadge();
  assert.equal(game.state.lives, 2);
});

test('the finite gift deck contains one direct life and two outfit prizes per six draws', () => {
  const { game, course, pads, place, advance } = startGame();
  game.start(course, { lives: 1 });

  function drawDeck() {
    const kinds = [];
    for (let i = 0; i < 6; i++) {
      game.course.gifts.push({ at: 0, dx: 0, dz: 0 });
      place(pads[0]);
      advance(1);
      kinds.push(game.state.lastGift.kind);
    }
    return kinds.sort();
  }

  assert.deepEqual(drawDeck(), ['badges', 'badges', 'badges', 'item', 'item', 'life']);
  assert.equal(game.state.loot.pendingItems.length, 2);
  assert.notEqual(game.state.loot.pendingItems[0], game.state.loot.pendingItems[1]);

  game.start(course, { lives: 1 });
  game.state.loot.remainingItems.splice(1);
  assert.deepEqual(drawDeck(), ['badges', 'badges', 'badges', 'badges', 'item', 'life']);
  assert.equal(game.state.loot.pendingItems.length, 1);
});

test('Pilvivaellus increases each life goal, including goals passed with full lives', () => {
  const { game, pads, place, advance } = startGame('endless');
  const flag = pads[12];
  place(flag);
  Object.assign(game.state, { grounded: null, y: flag.y + 0.004, vy: -1 });
  advance(1);
  assert.equal(game.state.checkpoint, flag.index);

  function collectBadges(count) {
    for (let i = 0; i < count; i++) {
      game.course.stars.push({ at: flag.index, dx: 0, dz: 0 });
      place(flag);
      advance(1);
    }
  }
  function retryAfterFall() {
    Object.assign(game.state, { grounded: null, y: -5 });
    advance(1);
    assert.equal(game.mode, 'recovering');
    game.retry();
    assert.equal(game.state.grounded, flag.index);
  }

  collectBadges(19);
  assert.equal(game.state.lifeGoal, 20);
  assert.equal(game.state.lifeProgress, 19);
  retryAfterFall();
  assert.equal(game.state.lives, 2);
  const starsAtRetry = game.state.stars;
  advance(1);
  assert.equal(game.state.stars, starsAtRetry);
  assert.equal(game.state.lifeProgress, 19);
  collectBadges(1);
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.lifeGoal, 30);
  assert.equal(game.state.lifeProgress, 0);

  collectBadges(30);
  assert.equal(game.state.lastStar.bonusLife, false);
  assert.equal(game.state.lifeGoal, 40);
  assert.equal(game.state.lifeProgress, 0);
  retryAfterFall();
  assert.equal(game.state.lifeGoal, 40);
  collectBadges(39);
  assert.equal(game.state.lives, 2);
  collectBadges(1);
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.lifeGoal, 50);
});

test('Pilvivaellus gifts still grant badge and outfit rewards once per run', () => {
  const { game, course, place, advance } = startGame('endless');
  game.start(course, { lives: 2, lifeProgress: 9 });
  const start = game.draw()[0];
  const gifts = [];
  for (let i = 0; i < 3; i++) {
    game.course.gifts.push({ at: start.index, dx: 0, dz: 0 });
    place(start);
    advance(1);
    gifts.push(game.state.lastGift);
  }
  assert.deepEqual(gifts.map(({ kind }) => kind).sort(), ['badges', 'badges', 'item']);
  const bonusBadges = gifts.reduce((total, gift) => total + (gift.count ?? 0), 0);
  assert.ok(bonusBadges >= 6);
  assert.equal(game.state.stars, bonusBadges);
  assert.equal(game.state.loot.pendingItems.length, 1);
  assert.equal(game.state.lives, 2);
  assert.equal(game.state.lifeProgress, 9);

  Object.assign(game.state, { grounded: null, y: -5 });
  advance(1);
  game.retry();
  place(start);
  advance(1);
  assert.equal(game.state.loot.opened, 3);
  assert.equal(game.state.loot.pendingItems.length, 1);
  assert.equal(game.state.stars, bonusBadges);
  assert.equal(game.state.lifeProgress, 9);
});

test('the lobby and portals follow the same rising difficulty order', () => {
  const { courses, endless } = startGame();
  const order = ['Helppo', 'Keskitaso', 'Vaikea', 'Loputon'];
  const route = [...courses.all, endless.course];
  for (let i = 1; i < route.length; i++) {
    assert.ok(order.indexOf(route[i - 1].difficulty) <= order.indexOf(route[i].difficulty));
    assert.equal(courses.nextCourse(route[i - 1]), route[i]);
  }
  assert.equal(courses.nextCourse(endless.course), null);
});

test('the last finite portal carries lives and badge progress to the first Pilvivaellus goal', () => {
  const { game, courses, place, press, advance } = startGame();
  const lastCourse = courses.all.at(-1);
  assert.equal(lastCourse.id, 'tulip');
  game.start(lastCourse, { lives: 2, lifeProgress: 9 });
  const finish = game.draw().at(-1);
  const nextCourse = courses.nextCourse(lastCourse);
  game.hooks.end = (event) => {
    assert.equal(event, 'win');
    game.start(nextCourse, game.state, [], true);
  };
  const portal = courses.finishPortal(finish);
  place(finish, portal.x, portal.z - 0.8);
  press('KeyW', true);
  advance(32);
  press('KeyW', false);
  assert.equal(game.course.id, 'endless');
  assert.equal(game.mode, 'transferring');
  press('Space', true);
  game.loop(game.previous + 500);
  assert.equal(game.state.time, 0);
  assert.equal(game.state.grounded, 0);
  game.resume();
  advance(1);
  assert.equal(game.mode, 'running');
  assert.equal(game.state.grounded, 0);
  assert.equal(game.state.lives, 2);
  assert.equal(game.state.lifeProgress, 9);
  assert.equal(game.state.lifeGoal, 20);
  assert.equal(game.state.stars, 0);

  const start = game.draw()[0];
  for (let i = 0; i < 11; i++) {
    assert.equal(game.state.lives, 2);
    game.course.stars.push({ at: start.index, dx: 0, dz: 0 });
    place(start);
    advance(1);
  }
  assert.equal(game.state.lives, 3);
  assert.equal(game.state.lifeGoal, 30);
});

test('Pilvivaellus keeps its rising movement speed across rebases and respawns', () => {
  function moveOneTick({ game, advance, press }) {
    const { x, z } = game.state;
    const origin = game.course.originZ ?? 0;
    press('KeyW', true);
    advance(1);
    press('KeyW', false);
    return Math.hypot(game.state.x - x, (game.course.originZ ?? 0) - origin + game.state.z - z);
  }
  const endless = startGame('endless');
  const { game, place, advance } = endless;
  const initialStep = moveOneTick(endless);
  const standard = startGame();
  assert.ok(Math.abs(moveOneTick(standard) - initialStep) < 1e-10);
  standard.game.state.furthest = standard.pads.at(-1).index;
  assert.ok(Math.abs(moveOneTick(standard) - initialStep) < 1e-10);

  function reachFlag(index) {
    const pad = game.draw().find((p) => p.index === index);
    const furthest = game.state.furthest;
    place(pad);
    Object.assign(game.state, { grounded: null, y: pad.y + 0.004, vy: -1, furthest });
    advance(1);
    assert.equal(game.state.checkpoint, index);
    assert.equal(game.state.furthest, index);
    return moveOneTick(endless);
  }
  const firstFlag = reachFlag(12);
  const secondFlag = reachFlag(24);
  assert.ok(firstFlag > initialStep && secondFlag > firstFlag);
  assert.equal(game.course.firstIndex, 12);

  const nextPad = game.draw().find((p) => p.index === 25);
  // A fall beyond the flag retries there while retaining the fastest pace reached.
  game.state.furthest = nextPad.index;
  const beyondFlag = moveOneTick(endless);
  assert.ok(beyondFlag > secondFlag);
  Object.assign(game.state, { grounded: null, y: -5 });
  advance(1);
  game.retry();
  assert.equal(game.state.grounded, 24);
  assert.equal(game.state.furthest, 25);
  assert.ok(Math.abs(moveOneTick(endless) - beyondFlag) < 1e-10);

  for (const index of [36, 48, 60]) assert.ok(reachFlag(index) > beyondFlag);
  const topSpeed = reachFlag(72);
  assert.ok(Math.abs(topSpeed / initialStep - 1.25) < 1e-10);
  assert.ok(Math.abs(reachFlag(84) - topSpeed) < 1e-10);
});

test('a gust pushes across its cushion, with time and steering to counter it', () => {
  const { game, pads, place, advance, press, gust } = startGame('candy');
  const pad = pads.find((p) => p.kind === 'gust');
  const times = Array.from({ length: 84 }, (_, i) => i / 20);
  const peak = times.find((time) => Math.abs(gust.wind(pad, time)) > 3);
  const calm = times.find((time) => gust.wind(pad, time) === 0 && gust.wind(pad, time + 0.4) === 0);
  const side = Math.sign(gust.wind(pad, peak));
  assert.ok(Number.isFinite(peak) && Number.isFinite(calm));

  place(pad);
  game.state.time = peak;
  advance(24);
  assert.ok(side * (game.state.x - pad.x) > 0.5);
  assert.equal(game.state.grounded, pad.index);

  place(pad);
  game.state.time = peak;
  const againstWind = side > 0 ? 'KeyA' : 'KeyD';
  press(againstWind, true);
  advance(24);
  press(againstWind, false);
  assert.ok(side * (game.state.x - pad.x) < -0.35);
  assert.equal(game.state.grounded, pad.index);

  place(pad);
  game.state.time = calm;
  advance(36);
  assert.equal(game.state.x, pad.x);

  place(pad, pad.x + side * (pad.w / 2 - 0.12));
  game.state.time = peak;
  advance(16);
  assert.equal(game.state.grounded, null);
  assert.equal(game.state.lives, 3);

  const next = pads[pad.index + 1];
  place(next);
  game.state.time = peak;
  advance(24);
  assert.equal(game.state.x, next.x);
  assert.equal(game.state.grounded, next.index);
});

function startObstacle(type) {
  const controls = startGame();
  const { game, courses, obstacles, place } = controls;
  Object.assign(game.course, {
    difficulty: 'Vaikea',
    path: [[0, 0, 0, 5.5, 4], [0.7, 8, 0.5, 4.2, 8.8], [0, 16.2, 0.5, 5.5, 4]],
    hazards: [{ at: 1, type }],
    stars: [],
    gifts: [],
    checkpoints: [],
  });
  const pads = courses.platforms(game.course, 0);
  const pad = pads[1];
  const pose = (time) => courses.hazards(game.course, pads, time);
  const readyAt = (x, z, time) => {
    game.state.time = time;
    place(pad, pad.x + x, pad.z + z);
  };
  const drawing = (hazard, time) => {
    const calls = [];
    obstacles.draw({ draw: (...args) => calls.push(args) }, hazard, pad, time);
    return calls;
  };
  return { ...controls, pad, pose, readyAt, drawing };
}

test('nearby animals sound in their visible movement phase and pan toward the source', () => {
  const activity = {
    bun: (pose) => pose.wave > 0.42 || Math.abs(pose.stride) > 0.54,
    bee: (pose) => pose.lift < 0.62,
    moth: (pose) => pose.lift < 0.42,
    hedgehog: (pose) => pose.curl > 0.45,
  };
  for (const [type, moving] of Object.entries(activity)) {
    function listen(yaw, z) {
      const run = startObstacle(type);
      run.game.course.path[0] = [0, z, 0, 5.5, 4];
      run.game.course.path[1][0] = 2.7;
      const pads = run.game.draw();
      run.place(pads[0]);
      run.game.state.yaw = yaw;
      run.advance(720);
      for (const cue of run.effects) {
        const [animal] = run.courses.hazards(run.game.course, pads, cue.time);
        assert.equal(cue.cue, type);
        assert.ok(moving(animal));
        assert.ok(cue.gain > 0 && cue.gain <= 1);
      }
      return run.effects;
    }
    const near = listen(0, 3);
    const turned = listen(Math.PI, 3);
    assert.ok(near.length > 0, type);
    assert.ok(near[0].pan > 0 && turned[0].pan < 0, type);
    assert.ok(Math.abs(near[0].pan + turned[0].pan) < 1e-9, type);
    assert.equal(listen(0, -10).length, 0, type);
  }
});

test('combined obstacles sound for their own poses without doubling the moving gate', () => {
  for (const [type, paired] of [['ropeGate', 'jumpRope'], ['gatePress', 'pillowPress']]) {
    const run = startObstacle(type);
    run.game.course.path[0][1] = 3.7;
    run.place(run.game.draw()[0]);
    run.advance(980);
    assert.ok(run.effects.some((cue) => cue.cue === 'zipperGate'), type);
    assert.ok(run.effects.some((cue) => cue.cue === paired), type);
    for (const [i, cue] of run.effects.entries()) {
      if (i > 0 && cue.cue !== 'pillowPress')
        assert.ok(cue.time - run.effects[i - 1].time >= 0.31 - 1e-9);
      if (cue.cue === 'zipperGate') {
        const gate = run.pose(cue.time).find((pose) => pose.type === 'zipperGate');
        const last = run.pose(cue.time - 1 / 120).find((pose) => pose.type === 'zipperGate');
        assert.ok((gate.gapX - run.pad.x) * (last.gapX - run.pad.x) <= 0);
      } else if (cue.cue === 'pillowPress') {
        const press = run.pose(cue.time).find((pose) => pose.type === paired);
        const previous = run.pose(cue.time - 1 / 120).find((pose) => pose.type === paired);
        assert.equal(press.minY, run.pad.y);
        assert.ok(previous.minY > press.minY);
      } else {
        const rope = run.pose(cue.time).find((pose) => pose.type === paired);
        const last = run.pose(cue.time - 1 / 120).find((pose) => pose.type === paired);
        assert.ok((rope.z - rope.trackZ) * (last.z - last.trackZ) <= 0);
      }
    }
    const history = run.effects.length;
    run.game.pause();
    const gameTime = run.game.state.time;
    run.game.draw();
    run.game.loop(run.game.previous + 5000);
    assert.equal(run.game.state.time, gameTime);
    assert.equal(run.effects.length, history);
    run.game.resume();
    assert.equal(run.effects.length, history);
  }
});

test('each nearby closing mechanism sounds on every bottom contact, even after another effect', () => {
  for (const type of ['pillowPress', 'gatePress', 'shutter']) {
    const run = startObstacle(type);
    const cue = type === 'shutter' ? 'shutter' : 'pillowPress';
    const bottom = (time) => run.pose(time).find((h) => h.type === cue).minY;
    const floor = bottom(0);
    let strikes = 0;
    for (let i = 0; i < 1700; i++) {
      const before = run.game.state.time;
      const count = run.effects.filter((event) => event.cue === cue).length;
      // Simulate a rope or an animal sounding just before each impact.
      run.game.state.encounterAudio.lastPlayed = before;
      run.advance(1);
      const now = run.game.state.time;
      const hit = bottom(now) === floor && bottom(before) > floor;
      if (hit) strikes++;
      assert.equal(run.effects.filter((event) => event.cue === cue).length - count, Number(hit), type);
    }
    assert.ok(strikes >= 3);
    const far = startObstacle(type);
    far.game.course.path[0][1] = -24;
    far.place(far.game.draw()[0]);
    far.advance(1100);
    assert.ok(far.effects.every((event) => event.cue !== cue));
  }
});

test('a descending stamp thuds once on the plush when the collision stops the clock', () => {
  const run = startObstacle('pillowPress');
  const open = Array.from({ length: 600 }, (_, i) => i / 120).find(t => run.pose(t)[0].signal === 'clear');
  run.readyAt(0, 0, open);
  run.advance(600);
  assert.equal(run.game.mode, 'recovering');
  const press = run.pose(run.game.state.time)[0];
  assert.ok(press.descending && press.minY > run.pad.y);
  assert.deepEqual(run.effects.map(e => [e.cue, e.time]), [['pillowPress', run.game.state.time]]);
});

test('ordinary pads, checkpoints and special surfaces stay quiet underfoot and when they drop', () => {
  for (const type of [null, 'crumble', 'tilt', 'stairs', 'slide', 'gust']) {
    const run = startGame('candy');
    const { game, place, advance, effects, sounds } = run;
    const pad = game.draw().find((candidate) => candidate.kind === type && candidate.index > 0);
    game.course.hazards = [];
    game.course.checkpoints = type === 'tilt' ? [pad.index] : [];
    place(pad);
    Object.assign(game.state, { grounded: null, y: game.state.y + 0.014, vy: -3 });
    advance(2);
    assert.equal(game.state.grounded, pad.index, type);
    assert.equal(game.state.checkpoint, type === 'tilt' ? pad.index : 0);
    assert.deepEqual(effects, []);
    assert.deepEqual(sounds, []);
    if (type === 'crumble' || type === 'stairs') {
      for (let i = 0; i < 610 && game.state.grounded === pad.index; i++) advance(1);
      assert.equal(game.state.grounded, null);
      assert.deepEqual(effects, []);
      assert.deepEqual(sounds, []);
    }
  }
});

test('the gust cue follows the same gust that pushes the player', () => {
  const { game, place, advance, effects, gust } = startGame('candy');
  const pads = game.draw();
  const pad = pads.find((candidate) => candidate.kind === 'gust');
  game.course.hazards = [];
  const step = 1 / 120;
  const onset = Array.from({ length: 510 }, (_, i) => (i + 1) * step).find((time) =>
    Math.abs(gust.wind(pad, time)) >= 1.05 && Math.abs(gust.wind(pad, time - step)) < 1.05,
  );
  game.state.time = onset - step;
  place(pad);
  advance(1);
  assert.equal(effects.length, 1);
  assert.equal(effects[0].cue, 'gust');
  assert.ok(Math.abs(effects[0].time - onset) < 1e-9);
  assert.ok((game.state.x - pad.x) * gust.wind(pad, onset) > 0);
});

test('Pilvivaellus rebasing preserves a nearby rope’s audio phase and position', () => {
  function listen(rebase) {
    const { game, place, advance, effects } = startGame('endless');
    const z = game.course.path[20][1];
    game.course.path[20] = [0, z, 0, 4, 4];
    game.course.path[21] = [1.1, z + 4.3, 0, 4.4, 5];
    game.course.hazards = [{ at: 21, type: 'jumpRope' }];
    place(game.draw()[20]);
    advance(72);
    if (rebase) game.state.furthest = 24;
    advance(600);
    assert.equal(game.course.firstIndex, rebase ? 12 : 0);
    return effects.filter((effect) => effect.cue === 'jumpRope');
  }
  const ordinary = listen(false);
  const shifted = listen(true);
  assert.ok(ordinary.length >= 3);
  assert.deepEqual(shifted.map((cue) => cue.time), ordinary.map((cue) => cue.time));
  for (const [i, cue] of ordinary.entries()) {
    assert.ok(Math.abs(shifted[i].gain - cue.gain) < 1e-9);
    assert.ok(Math.abs(shifted[i].pan - cue.pan) < 1e-9);
  }
});

test('the rope and moving gate can be cleared in one jump, at different points in their cycle', () => {
  for (const time of [0.1, 0.55, 1.1, 1.9, 2.65]) {
    const run = startObstacle('ropeGate');
    const [rope, gate] = run.pose(time);
    const startZ = rope.z - 1.04;
    const arrival = time + (gate.z - startZ) / 5.75;
    const targetX = run.pose(arrival)[1].gapX;
    run.readyAt(targetX - run.pad.x, startZ - run.pad.z, time);
    run.press('KeyW', true);
    run.tap();
    for (let i = 0; i < 100 && run.game.state.z < gate.z; i++) run.advance(1);
    assert.equal(run.game.mode, 'running');
    assert.ok(run.game.state.z >= gate.z);
    assert.equal(run.game.state.grounded, null);
    run.advance(40);
    assert.equal(run.game.state.grounded, run.pad.index);
    assert.ok(run.game.state.z > gate.z + gate.depth / 2);
    assert.equal(run.game.state.lives, 3);
  }
  const missed = startObstacle('ropeGate');
  missed.readyAt(-1.7, missed.pose(0)[0].z - missed.pad.z - 1.04, 0);
  missed.press('KeyW', true);
  missed.tap();
  missed.advance(95);
  assert.equal(missed.game.state.lastHazard, 'zipperGate');
});

test('the gap between the moving gate and the stamp is safe through a full press cycle', () => {
  const run = startObstacle('gatePress');
  const gate = run.pose(0)[0];
  const startZ = gate.z - 1.1;
  const arrival = (gate.z - startZ) / 5.75;
  run.readyAt(run.pose(arrival)[0].gapX - run.pad.x, startZ - run.pad.z, 0);
  run.press('KeyW', true);
  run.advance(51);
  run.press('KeyW', false);
  const spot = run.game.state.z;
  const press = run.pose(0)[2];
  assert.ok(spot > gate.z + gate.depth / 2 + 0.18 && spot < press.z - press.depth / 2 - 0.18);
  run.advance(540);
  assert.equal(run.game.state.z, spot);
  for (let i = 0; i < 480 && run.pose(run.game.state.time)[2].signal !== 'clear'; i++) run.advance(1);
  assert.equal(run.pose(run.game.state.time)[2].signal, 'clear');
  run.press('KeyW', true);
  run.advance(70);
  assert.equal(run.game.mode, 'running');
  assert.ok(run.game.state.z > press.z + press.depth / 2 + 0.18);
});

test('paired obstacles use stable landings on hard courses and recur late in Pilvivaellus', () => {
  const { courses, endless, obstacles } = startGame();
  for (const course of courses.all) {
    const pairs = course.hazards.filter((h) => obstacles.combinations.includes(h.type));
    if (course.difficulty === 'Vaikea') {
      assert.deepEqual([...new Set(pairs.map(h => h.type))].sort(), ['gatePress', 'ropeGate']);
      for (const { at } of pairs) {
        const row = course.path[at];
        assert.ok(row[4] >= 9 && !row[5] && !row[6] && !course.checkpoints.includes(at));
      }
    } else assert.equal(pairs.length, 0);
  }
  for (const seed of [0, 11, 672, 2591]) {
    const run = endless.create(seed);
    const pairs = new Map();
    for (let step = 0; step < 175; step++) {
      endless.advance(run, step);
      for (const { at, type } of run.hazards.filter((h) => obstacles.combinations.includes(h.type))) {
        const pad = run.path[at - run.firstIndex];
        assert.ok(at > 48 && !run.checkpoints.includes(at) && !pad[5] && !pad[6]);
        assert.ok(pad[4] >= 9 && !run.gifts.some(g => g.at === at));
        pairs.set(at, type);
      }
    }
    const sequence = [...pairs];
    assert.ok(sequence.length >= 8 && sequence[0][0] < 60);
    sequence.forEach(([at, type], i) => {
      assert.equal(type, i % 2 ? 'gatePress' : 'ropeGate');
      if (i) assert.ok(at - sequence[i - 1][0] >= 8);
    });
  }
});

test('the moving jump rope crosses the whole landing and a timed jump clears it', () => {
  const blocked = startObstacle('jumpRope');
  const { pad, pose, drawing } = blocked;
  let time = 0;
  while (time < 5) {
    const [rope] = pose(time);
    if (rope.z < pad.z - 1.57 && pose(time + 1 / 120)[0].z < rope.z) break;
    time += 1 / 120;
  }
  assert.ok(time < 5);
  const [rope] = pose(time);
  assert.ok(rope.halfSpan + rope.r > pad.w / 2);
  assert.ok(Math.max(...Array.from({ length: 420 }, (_, i) => pose(i / 120)[0].z)) > pad.z + 1.9);
  const caps = drawing(rope, time).filter(([shape, p]) => shape === 'ball' && p[1] === rope.y);
  assert.equal(caps[0][1][0], rope.x - rope.halfSpan);
  assert.equal(caps.at(-1)[1][0], rope.x + rope.halfSpan);
  assert.ok(caps.every(([, p, size]) => p[2] === rope.z && size[2] === 2 * rope.r));

  const startZ = rope.z - pad.z - 0.92;
  blocked.readyAt(0, startZ, time);
  blocked.press('KeyW', true);
  blocked.advance(25);
  assert.equal(blocked.game.state.lastHazard, 'jumpRope');

  const clear = startObstacle('jumpRope');
  clear.readyAt(0, startZ, time);
  clear.press('KeyW', true);
  clear.tap();
  clear.advance(94);
  assert.equal(clear.game.mode, 'running');
  assert.equal(clear.game.state.grounded, pad.index);
  assert.ok(clear.game.state.z > clear.pose(clear.game.state.time)[0].z);
});

test('the zipper gate shifts a walkable opening between two tall wall sections', () => {
  const blocked = startObstacle('zipperGate');
  const { pad, pose, drawing } = blocked;
  const time = (Math.PI / 2 - pad.index) / 2.4 - 0.12;
  const [left, right] = pose(time);
  assert.ok(left.gapX > pad.x + 0.8);
  assert.ok(pose(time + Math.PI / 2.4)[0].gapX < pad.x - 0.8);
  assert.ok(Math.abs(right.x - right.width / 2 - (left.x + left.width / 2) - left.opening) < 1e-10);
  for (const wall of [left, right]) {
    const [shape, p, size] = drawing(wall, time)[0];
    assert.equal(shape, 'box');
    assert.deepEqual([...p], [wall.x, wall.y, wall.z]);
    assert.deepEqual([...size], [wall.width, wall.maxY - wall.minY, wall.depth]);
  }

  blocked.readyAt(0, -0.81, time);
  blocked.press('KeyW', true);
  blocked.tap();
  blocked.advance(33);
  assert.equal(blocked.game.state.lastHazard, 'zipperGate');

  const clear = startObstacle('zipperGate');
  clear.readyAt(left.gapX - pad.x, -0.81, time);
  clear.press('KeyW', true);
  clear.advance(41);
  assert.equal(clear.game.mode, 'running');
  assert.equal(clear.game.state.grounded, pad.index);
  assert.ok(clear.game.state.z > pad.z + 1);
});

test('the pillow press warns before it drops and leaves time to run beneath it', () => {
  const blocked = startObstacle('pillowPress');
  const { pad, pose, drawing } = blocked;
  const warningStart = Array.from({ length: 480 }, (_, i) => i / 120)
    .find((time) => pose(time)[0].signal === 'warning');
  const [warning] = pose(warningStart);
  assert.equal(pose(warningStart + 0.54)[0].minY, warning.minY);
  assert.ok(pose(warningStart + 0.85)[0].minY < warning.minY - 0.7);
  const pressBody = drawing(warning, warningStart).find(([, , , color]) => color === '#c35f84');
  assert.deepEqual([...pressBody[1]], [warning.x, warning.y, warning.z]);
  assert.deepEqual([...pressBody[2]], [warning.width, warning.maxY - warning.minY, warning.depth]);
  assert.ok(drawing(warning, warningStart).some(([, , , color]) => color === '#ffcc58'));

  blocked.readyAt(0, -2.13, 0);
  blocked.press('KeyW', true);
  blocked.advance(21);
  assert.equal(blocked.game.state.lastHazard, 'pillowPress');

  const clear = startObstacle('pillowPress');
  clear.readyAt(0, -2.13, 0);
  for (let i = 0; i < 480 && clear.pose(clear.game.state.time)[0].signal !== 'clear'; i++) clear.advance(1);
  assert.equal(clear.pose(clear.game.state.time)[0].signal, 'clear');
  clear.press('KeyW', true);
  clear.advance(82);
  assert.equal(clear.game.mode, 'running');
  assert.equal(clear.game.state.grounded, pad.index);
  assert.ok(clear.game.state.z > pad.z + warning.depth / 2 + 0.18);
});
