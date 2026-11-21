// Run with node --test tests/studio.browser.cjs and a locally installed Playwright browser.
// Set FLUFF_TEST_URL to exercise the same flows against a served production build.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require('playwright');

const index = new URL(process.env.FLUFF_TEST_URL ?? pathToFileURL(path.join(__dirname, '..', 'index.html')));

async function openGame(t, contextOptions = {}) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-networking'],
  });
  t.after(() => browser.close());
  const page = await browser.newPage({
    viewport: { width: 1160, height: 820 },
    reducedMotion: 'reduce',
    ...contextOptions,
  });
  await page.route(/^https?:/, (route) =>
    new URL(route.request().url()).origin === index.origin ? route.continue() : route.abort(),
  );
  await page.goto(index.href);
  return page;
}

function choice(page, key, value) {
  return page.locator(`[data-group="${key}"][data-value="${value}"]`);
}

test('two thumbs can steer, look and jump in both phone orientations', async (t) => {
  const page = await openGame(t, {
    viewport: { width: 390, height: 750 },
    hasTouch: true,
    isMobile: true,
  });
  await page.evaluate(() => FluffProfiles.open('Tassu'));
  await page.reload();
  await page.evaluate(() => {
    const Game = window.FluffGame;
    window.FluffGame = class extends Game {
      constructor(...args) {
        super(...args);
        window.testGame = this;
      }
    };
  });
  await page.locator('#lobby-profile-list button').tap();
  await page.locator('[data-course="cloud"]').tap();
  await page.locator('#launch').tap();
  const graphics = await page.evaluate(() => {
    const { gl, batches } = window.testGame.world;
    return {
      error: gl.getError(),
      webgl2: gl.getParameter(gl.VERSION).startsWith('WebGL 2'),
      groupsDrawn: batches?.renderer.info.render.calls ?? 0,
    };
  });
  assert.equal(graphics.error, 0);
  if (graphics.webgl2) assert.ok(graphics.groupsDrawn >= 4);
  const gesture = await page.context().newCDPSession(page);
  const point = (id, x, y) => ({ id, x, y });
  const send = (type, ...touchPoints) => gesture.send('Input.dispatchTouchEvent', { type, touchPoints });
  const step = (ms) => page.evaluate(ms => {
    window.testGame.loop(window.testGame.previous + ms);
    cancelAnimationFrame(window.testGame.frame);
  }, ms);
  const state = () => page.evaluate(() => {
    const { state: s, world } = window.testGame;
    return { x: s.x, yaw: s.yaw, pitch: s.pitch, z: s.z, vy: s.vy, spin: s.spinAt, lens: world.view.lensY };
  });
  await page.evaluate(() => cancelAnimationFrame(window.testGame.frame));
  for (const { width, height } of [{ width: 390, height: 750 }, { width: 750, height: 390 }]) {
    await page.setViewportSize({ width, height });
    const { x, y, w, h } = await page.locator('#world').evaluate((canvas) => {
      const rect = canvas.getBoundingClientRect();
      return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    });
    const left = point(1, x + w * 0.25, y + h * 0.74);
    const steer = point(1, left.x + 25, left.y - 42);
    const right = point(2, x + w * 0.67, y + h * 0.69);
    const swipe = point(2, right.x + 53, right.y + 27);
    const before = await state();
    await send('touchStart', left);
    await send('touchMove', steer);
    await step(90);
    const moved = await state();
    assert.ok(moved.x > before.x && moved.z > before.z);
    assert.equal(moved.yaw, before.yaw);
    assert.equal(moved.lens < 1.39, width < height);
    await send('touchStart', steer, right);
    await send('touchMove', steer, swipe);
    await send('touchEnd', swipe);
    await step(25);
    const aimed = await state();
    assert.ok(aimed.pitch < moved.pitch && aimed.yaw > moved.yaw && aimed.z > moved.z);
    assert.equal(aimed.vy, 0);
    await send('touchStart', steer, right);
    await send('touchEnd', right);
    await step(25);
    assert.ok((await state()).vy > 0);
    const jumpButton = await page.locator('#touch-jump').boundingBox();
    const jump = point(2, jumpButton.x + jumpButton.width / 2, jumpButton.y + jumpButton.height / 2);
    await send('touchStart', steer, jump);
    await step(25);
    assert.ok((await state()).spin > 0);
    await send('touchEnd', jump);
    await send('touchEnd');
    assert.equal(await page.locator('#touch-stick').getAttribute('data-held'), null);

    const selection = await page.evaluate(() => {
      const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
      document.querySelector('#touch-jump span').dispatchEvent(menu);
      return {
        userSelect: getComputedStyle(document.querySelector('#play-screen')).userSelect,
        menuBlocked: menu.defaultPrevented,
        selected: getSelection().toString(),
      };
    });
    assert.deepEqual(selection, { userSelect: 'none', menuBlocked: true, selected: '' });
    await page.evaluate(() => {
      const game = window.testGame;
      game.start(game.course);
      cancelAnimationFrame(game.frame);
    });
  }

  await page.setViewportSize({ width: 390, height: 750 });
  const left = point(1, 77, 560), run = point(1, 77, 510);
  await send('touchStart', left);
  await send('touchMove', run);
  for (let i = 0; i < 5; i++) await step(115);
  const button = await page.locator('#touch-jump').boundingBox();
  const jump = point(2, button.x + button.width / 2, button.y + button.height / 2);
  await send('touchStart', run, jump);
  await send('touchEnd', jump);
  for (let i = 0; i < 7; i++) await step(115);
  await send('touchEnd');
  assert.equal(await page.evaluate(() => window.testGame.state.grounded), 1);
});

test('old and newly collected gifts can be equipped and saved by their owner', async (t) => {
  const page = await openGame(t);
  await page.evaluate(() => {
    localStorage.setItem('fluff-profile:lumipallo', JSON.stringify({
      name: 'Lumipallo',
      lastUsed: 1,
      stars: 20,
      unlocked: ['item:bee'],
    }));
    FluffProfiles.open('Nuppu');
  });
  await page.reload();
  await page.evaluate(() => {
    const Game = window.FluffGame;
    window.FluffGame = class extends Game {
      constructor(...args) {
        super(...args);
        window.testGame = this;
      }
    };
  });
  const pickProfile = (name) => page.locator('#lobby-profile-list button').filter({ hasText: name }).click();
  const edit = () => page.locator('#edit-active').click();
  const giftsTab = page.getByRole('button', { name: 'Lahjat', exact: true });
  const save = page.locator('#save-look');
  await pickProfile('Lumipallo');
  await edit();
  await giftsTab.click();
  await choice(page, 'item', 'bee').click();
  assert.ok(await save.isEnabled());
  await page.locator('#close-modal').click();
  assert.equal(await page.evaluate(() => FluffProfiles.find('Lumipallo').appearance.item), 'none');

  await edit();
  await page.getByRole('button', { name: 'Pukimo', exact: true }).click();
  await choice(page, 'head', 'rosecrown').click();
  assert.ok(await page.locator('#fit-offer').isVisible());
  assert.ok(await save.isDisabled());
  await page.locator('#cancel-fit').click();
  await save.click();

  const rewards = [
    ['cloud', 'head:butterfly', false],
    ['cloud', 'item:moonlantern', false],
    ['cloud', 'shoes:comet', true],
    ['cloud', 'wings:aurora', true],
    ['rose', 'head:rosecrown', false],
    ['meadow', 'shoes:cloverslippers', false],
    ['lagoon', 'item:lagoonlantern', false],
    ['tulip', 'wings:tulippetals', false],
  ];
  for (const [course, sku, aerial] of rewards) {
    await page.locator(`[data-course="${course}"]`).click();
    await page.locator('#launch').click();
    const collected = await page.evaluate((aerial) => {
      const game = window.testGame;
      cancelAnimationFrame(game.frame);
      const gift = game.course.gifts.find((gift) => Boolean(gift.aerial) === aerial);
      const pad = FluffCourses.platforms(game.course, game.state.time)[gift.at];
      const position = FluffCourses.giftPosition(gift, pad, game.state.time);
      Object.assign(game.state, {
        x: position.x,
        y: FluffCourses.surfaceHeight(pad, position.x, position.z),
        z: position.z,
        vy: 0,
        grounded: pad.index,
        furthest: pad.index,
      });
      const tapJump = () => {
        const event = { code: 'Space', repeat: false, preventDefault() {} };
        game.key(event, true);
        game.key(event, false);
      };
      // Pick the last available item while exercising the live game's collision, loot and save paths.
      const random = Math.random;
      Math.random = () => 0.99;
      try {
        if (aerial) {
          tapJump();
          tapJump();
        }
        const steps = aerial ? 7 : 1;
        for (let step = 0; step < steps && !game.state.lastGift; step++) {
          game.loop(game.previous + 60);
          cancelAnimationFrame(game.frame);
        }
      } finally {
        Math.random = random;
      }
      return game.state.lastGift?.sku;
    }, aerial);
    assert.equal(collected, sku);
    assert.match(await page.locator('#gift-detail').textContent(), /Lahjat-välilehdellä/);
    assert.ok(await page.evaluate((sku) => FluffProfiles.find('Lumipallo').unlocked.includes(sku), sku));
    await page.keyboard.press('p');
    await page.getByRole('button', { name: 'Peliaulaan' }).click();
  }

  await edit();
  await giftsTab.click();
  assert.equal(await page.locator('#choices .choice').count(), rewards.length + 1);
  const expected = {};
  for (const sku of ['item:bee', ...rewards.map(([, sku]) => sku)]) {
    const [key, value] = sku.split(':');
    const button = choice(page, key, value);
    assert.match(await button.getAttribute('aria-label'), /^Pue /);
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.ok(await save.isEnabled());
    expected[key] = value;
  }
  await save.click();
  await page.reload();
  const { owner, other } = await page.evaluate(() => ({
    owner: FluffProfiles.find('Lumipallo'),
    other: FluffProfiles.find('Nuppu'),
  }));
  for (const [key, value] of Object.entries(expected)) assert.equal(owner.appearance[key], value);
  assert.equal(owner.stars, 20);
  assert.deepEqual(other.unlocked, []);
  await pickProfile('Nuppu');
  await edit();
  assert.equal(await giftsTab.count(), 0);
});

test('pressing an equipped gift again clears its slot and keeps ownership', async (t) => {
  const page = await openGame(t);
  const equipped = await page.evaluate(() => {
    for (const sku of ['item:bee', 'item:moonlantern', 'head:butterfly', 'wings:aurora']) {
      FluffProfiles.grantExclusive('Nuppu', sku);
    }
    return FluffProfiles.look('Nuppu', {
      item: 'bee', itemDye: 'honey', head: 'butterfly', headDye: 'blue',
      wings: 'aurora', wingsDye: 'lavender', color: 'rose', eyeColor: 'ocean',
    });
  });
  await page.reload();
  await page.evaluate(() => {
    const render = FluffPlush.render;
    FluffPlush.render = (look, ...view) => {
      window.studioLook = { ...look };
      return render(look, ...view);
    };
  });

  const pickProfile = () => page.locator('#lobby-profile-list button').filter({ hasText: 'Nuppu' }).click();
  const edit = () => page.locator('#edit-active').click();
  const giftsTab = page.getByRole('button', { name: 'Lahjat', exact: true });
  const bee = choice(page, 'item', 'bee');
  await pickProfile();
  await edit();
  await page.getByRole('button', { name: 'Tavarat', exact: true }).click();
  await bee.click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'true');

  await giftsTab.click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'true');
  assert.match(await bee.getAttribute('aria-label'), /^Riisu /);
  assert.equal(await bee.locator('.gift-action').textContent(), 'Riisu');
  await choice(page, 'item', 'moonlantern').click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'false');
  await bee.click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('Space');
  assert.equal(await bee.getAttribute('aria-pressed'), 'false');
  assert.match(await bee.getAttribute('aria-label'), /^Pue /);
  assert.equal(await bee.locator('.gift-action').textContent(), 'Pue');
  assert.ok(await bee.evaluate((button) => button === document.activeElement));
  assert.equal(await choice(page, 'item', 'moonlantern').getAttribute('aria-pressed'), 'false');
  assert.equal(await choice(page, 'head', 'butterfly').getAttribute('aria-pressed'), 'true');
  const unequippedLook = { ...equipped.appearance, item: 'none' };
  assert.deepEqual(await page.evaluate(() => window.studioLook), unequippedLook);

  await page.locator('#save-look').click();
  await page.reload();
  const saved = await page.evaluate(() => FluffProfiles.find('Nuppu'));
  assert.deepEqual(saved.appearance, unequippedLook);
  assert.deepEqual(saved.unlocked, equipped.unlocked);
  await pickProfile();
  await edit();
  await giftsTab.click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'false');
  await bee.click();
  assert.equal(await bee.getAttribute('aria-pressed'), 'true');
});

test('the workshop scrolls only the choices on desktop and compact screens', async (t) => {
  const page = await openGame(t);
  await page.locator('#name').fill('Pehmo');
  await page.locator('#name-form button[type="submit"]').click();
  const metrics = () => page.evaluate(() => {
    const modal = document.querySelector('#modal');
    const choices = document.querySelector('#choices');
    const preview = document.querySelector('.preview-box').getBoundingClientRect();
    const save = document.querySelector('#save-look').getBoundingClientRect();
    const frame = modal.getBoundingClientRect();
    return {
      height: frame.height,
      modalTop: modal.scrollTop,
      scrollTop: choices.scrollTop,
      scrollWidth: choices.scrollWidth,
      width: choices.clientWidth,
      clientHeight: choices.clientHeight,
      scrollHeight: choices.scrollHeight,
      previewBottom: preview.bottom,
      saveBottom: save.bottom,
      frameBottom: frame.bottom,
    };
  });
  for (const [width, height] of [[1160, 820], [1024, 520], [740, 360], [390, 740], [320, 480]]) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Pehmo', exact: true }).click();
    const body = await metrics();
    await page.getByRole('button', { name: 'Pukimo', exact: true }).click();
    await choice(page, 'outfit', 'denim').click();
    await choice(page, 'head', 'flower').click();
    await choice(page, 'patch', 'heart').click();
    const wardrobe = await metrics();
    assert.equal(wardrobe.height, body.height);
    assert.equal(wardrobe.modalTop, 0);
    assert.ok(wardrobe.clientHeight > 0 && wardrobe.scrollHeight > wardrobe.clientHeight);
    assert.equal(wardrobe.scrollWidth, wardrobe.width);
    assert.ok(wardrobe.previewBottom < wardrobe.saveBottom);
    assert.ok(wardrobe.saveBottom < wardrobe.frameBottom);

    const choices = page.locator('#choices');
    await choices.evaluate((list) => { list.scrollTop = 0; });
    await choices.hover();
    await page.mouse.wheel(0, 350);
    await page.waitForFunction(() => document.querySelector('#choices').scrollTop > 0);
    assert.equal((await metrics()).modalTop, 0);
    await page.getByRole('button', { name: 'Tavarat', exact: true }).click();
    assert.equal((await metrics()).scrollTop, 0);
  }
  await page.locator('#save-look').click();
  assert.equal(await page.evaluate(() => FluffProfiles.find('Pehmo').appearance.patch), 'heart');
});
