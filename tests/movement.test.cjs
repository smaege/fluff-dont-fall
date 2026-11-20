const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Drive the game's normal start, keyboard, fixed-step loop and retry paths without a graphics device.
function startGame(courseId = 'cloud', localStorage) {
  const noOp = () => {};
  const context = vm.createContext({
    document: {},
    localStorage,
    performance: { now: () => 0 },
    matchMedia: () => ({ matches: false }),
    cancelAnimationFrame: noOp,
    requestAnimationFrame: noOp,
  });
  context.window = context;
  context.FluffSound = { play: noOp, setPlaying: noOp, setCourse: noOp };
  for (const name of [
    'plush-options',
    'profiles',
    'sky-rides',
    'pad-styles',
    'critters',
    'fairground',
    'obstacles',
    'courses',
    'endless',
    'game',
  ]) {
    const file = path.join(__dirname, '..', name + '.js');
    vm.runInContext(readFileSync(file, 'utf8'), context, { filename: file });
  }
  const game = Object.assign(Object.create(context.FluffGame.prototype), {
    canvas: { focus: noOp },
    world: { setup: noOp, render: noOp },
    keys: new Set(),
    hooks: { frame: noOp, end: noOp, checkpoint: noOp },
  });
  const course = context.FluffCourses.all.find((candidate) => candidate.id === courseId);
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
  return { game, course, pads, place, advance, press, tap, profiles: context.FluffProfiles };
}

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
