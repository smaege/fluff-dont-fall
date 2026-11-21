(() => {
  'use strict';

  const placementStep = 5;
  const neighborStep = 7;
  const renderDistance = 36;
  const talkDistance = 21;
  const lens = 1.39;
  const edge = 8;
  const cycleLength = 15;
  const turnLength = 3.05;
  const names = {
    bee: ['Pihka', 'Mesi', 'Hippu', 'Siru'],
    moth: ['Säde', 'Lumo', 'Hohde', 'Nuttu'],
  };
  const routeLines = {
    cloud: [
      'Näetkö tuon pupun muotoisen pilven?',
      'Näen. Sen korvalla taitaa sataa.',
      'Aivastiko se juuri?',
      'Minusta se heilutti häntää.',
    ],
    candy: [
      'Maistuuko vaaleanpunainen tuuli mansikalta?',
      'Vähän. Minun tuntosarvissani se kutittaa.',
      'Maistan vielä ihan pienen puuskan.',
      'Säästä minulle se mansikkaisin.',
    ],
    night: [
      'Nimesin tuon pienen tähden Napiksi.',
      'Sopiikin. Taivas tarvitsee napit.',
      'Pysyvätkö pilvetkin niillä kiinni?',
      'Vain ne, joilla on taskut.',
    ],
    grove: [
      'Kuulitko? Tuo lehti vihelsi meille.',
      'Se opettelee samaa laulua kuin minä.',
      'Miten kertosäe menikään?',
      'Huuu, ja sitten ihan hiljaa.',
    ],
    reef: [
      'Pistin korvan simpukkaan. Se hyräili!',
      'Simpukat muistavat meren laulut.',
      'Voisikohan se opettaa yhden minulle?',
      'Aloita meren helpoimmasta sanasta. Suuuh.',
    ],
    orchard: [
      'Laskin koriin seitsemän omenaa.',
      'Minä näen siellä vain kuusi.',
      'Seitsemäs oli minun evääni.',
      'Säästäthän sitten kuudennen minulle?',
    ],
    frost: [
      'Katsopa, revontulet vaihtoivat väriä!',
      'Vihreä kaari sai violetin helman.',
      'Voisikohan sen ommella huivin reunaan?',
      'Ensin pitäisi saada siitä langanpää kiinni.',
    ],
    rose: [
      'Yksi ruusu tuoksuu mansikkahillolta.',
      'Ehkä se söi sitä aamupalaksi.',
      'Millähän ruusu levittää hillon leivälleen?',
      'Yhdellä terälehdellä. Sillä pienimmällä.',
    ],
    meadow: [
      'Kuulitko, kuinka niitty rapisee?',
      'Heinät harjoittelevat tanssia tuulessa.',
      'Ovatko apilatkin mukana?',
      'Ovat. Ne kumartavat aina tahdin lopussa.',
    ],
    lagoon: [
      'Sininen ruusu näkyy vedessä ihan nurinpäin.',
      'Kummallahan puolella on makeampaa mettä?',
      'Kokeilin veden puolta. Tuntosarveni kastuivat.',
      'Nouse tänne. Kuivataan ne tuulessa.',
    ],
    tulip: [
      'Kuinka korkealle tulppaani voi kasvaa?',
      'Tuo liila yltää melkein pilven reunalle.',
      'Näkeeköhän sen kukasta koko tarhan?',
      'Katsotaan yhdessä. Minä lennän vierelläsi.',
    ],
    endless: [
      'Montako pilveä olemme jo ohittaneet?',
      'Neljätoista. Aloitan aina isosta.',
      'Tuolla tulee vielä isompi!',
      'Siinä tapauksessa yksi.',
    ],
  };
  const sharedLines = [
    [
      'Minä leivoin hunajapikkuleipiä.',
      'Montako mahtui eväspussiin?',
      'Kaksi. Loput mahtuivat minuun.',
      'Taidat olla mainio eväspussi.',
    ],
    [
      'Harjoittelin uutta siipitemppua!',
      'Sitä, missä unohdit mihin olit menossa?',
      'Niin! Olen siinä jo tosi hyvä.',
      'Siinä tapauksessa opetat sen minullekin.',
    ],
    [
      'Tuulelle pitäisi neuloa kaulahuivi.',
      'Kuinka pitkäksi neuloisit sen?',
      'Täältä seuraavan pilven taakse.',
      'Minä pidän kerää, ettei se karkaa.',
    ],
    [
      'Kumpi lentää hiljempaa, sinä vai minä?',
      'Kokeillaan. Aloita kuiskaamalla.',
      'Prr. Noin! Nyt oli ihan pieni pörinä.',
      'Kuulin sen. Lupaan pöristä takaisin.',
    ],
  ];

  let bubble;
  let encounter;

  function padNumber(course, at) {
    let value = course.seed ?? 0;
    for (const letter of course.id) value = Math.imul(value ^ letter.charCodeAt(0), 0x1000193);
    return (Math.imul(value ^ at, 0x9e3779b1) >>> 0) / 4294967296;
  }

  function makePair(row, at, course) {
    const [x, z, y, width, , travel = 0] = row;
    const variation = padNumber(course, at);
    const slot = Math.floor(at / placementStep);
    const opening = slot === 0;
    let side = slot % 2 ? -1 : 1;
    if (Math.abs(x) > (opening ? 0 : 1.05)) side = -Math.sign(x);
    if (opening && course.endless && Math.abs(x) < 0.55) side = -1;
    const lead = opening && course.endless ? Math.max(0, 2.55 - Math.abs(x) * 1.35) : 0;
    return {
      at,
      kind: 'animal',
      x: x + side * (width / 2 + travel + (opening ? 2.15 : 2.85)),
      y: y + 1.86 + variation * 0.38,
      z: z - 0.56 + lead,
      side,
      slot,
      variation,
    };
  }

  function hover(pair, which, time, talking) {
    const { at, x, y, z, slot, variation, side } = pair;
    const isBee = which === 0;
    const type = isBee ? 'bee' : 'moth';
    const phase = time * (isBee ? 2.68 : 1.72) + variation * 6.28 + which;
    const spread = (slot % 2 ? 1 : -1) * side;
    const separation = slot === 0 ? 0.85 : 1.05;
    const drift = Math.sin(time * 0.85 + variation * 6.28);
    const nod = talking ? Math.sin(time * 7.2) * 0.044 : 0;
    return {
      at,
      type,
      name: names[type][(slot + Math.floor(variation * 3)) % names[type].length],
      scale: isBee ? 0.86 + variation * 0.27 : 1.13 + variation * 0.34,
      x: x + (isBee ? -spread : spread) * separation + Math.sin(phase) * 0.15 + drift * 0.2,
      y: y + (isBee ? 0.12 : 0) + Math.cos(phase) * (isBee ? 0.22 : 0.16) + nod,
      z: z + (isBee ? 0.39 : -0.39) + Math.sin(phase + 0.55) * 0.16,
      bank: Math.sin(phase + 0.4) * 0.11 + nod,
      lift: 0.65,
    };
  }

  function turnToFriend(pose, friend) {
    // The model looks along local -Z. Turn a little toward the approach to show both faces.
    pose.yaw = Math.atan2(pose.x - friend.x, pose.z - friend.z + 0.94);
  }

  function visible(pair, camera, forward, right, up, aspect) {
    const x = pair.x - camera[0],
      y = pair.y - camera[1],
      z = pair.z - camera[2];
    const depth = x * forward[0] + y * forward[1] + z * forward[2];
    const reach = 2.8;
    if (depth < -reach || depth > renderDistance || x * x + y * y + z * z > renderDistance ** 2)
      return false;
    const view = Math.max(0, depth) / lens;
    const across = x * right[0] + y * right[1] + z * right[2];
    const above = x * up[0] + y * up[1] + z * up[2];
    return Math.abs(across) < view * aspect + reach && Math.abs(above) < view + reach;
  }

  function talkPoint(world, pose) {
    const { x, y, z, scale, yaw } = pose;
    return world.project([x - 0.15 * Math.sin(yaw), y + 0.65 * scale, z - 0.15 * Math.cos(yaw)]);
  }

  function inView(point, view) {
    return (
      point &&
      point.x > edge &&
      point.x < view.width - edge &&
      point.y > edge &&
      point.y < view.height - edge
    );
  }

  function lineAt(encounter, time) {
    const elapsed = time - encounter.start - 0.35;
    if (elapsed < 0) return null;
    const round = Math.floor(elapsed / cycleLength);
    const phase = elapsed % cycleLength;
    const turn = Math.floor(phase / turnLength);
    const turnTime = phase % turnLength;
    const spokenLength = turnLength - 0.42;
    if (turn >= 4 || turnTime > spokenLength) return null;
    const { course, slot, variation, kind } = encounter;
    if (kind === 'human') {
      const emphasis = Math.min(1, turnTime / 0.38, (spokenLength - turnTime) / 0.34);
      return { who: turn % 2, words: window.FluffSkyNeighbors.dialogue(slot, round)[turn], emphasis };
    }
    const topic = (slot + round) % 3;
    const lines =
      topic === 0 && routeLines[course.id]
        ? routeLines[course.id]
        : sharedLines[(Math.floor(variation * sharedLines.length) + slot + round) % sharedLines.length];
    return { who: turn % 2, words: lines[turn] };
  }

  function makeBubble() {
    const screen = document.getElementById('play-screen');
    if (!screen) return null;
    const body = document.createElement('div');
    const name = document.createElement('strong');
    const words = document.createElement('span');
    body.id = 'sky-friend-talk';
    body.hidden = true;
    body.append(name, words);
    const hud = screen.querySelector('.hud');
    screen.insertBefore(body, hud);
    const overlays = [
      ...screen.querySelectorAll('#village-talk, #gift-reveal, .key-hint, .touch-steering, .touch-jump'),
    ];
    return { screen, body, name, words, hud, overlays };
  }

  function hide() {
    if (bubble && !bubble.body.hidden) bubble.body.hidden = true;
  }

  function fitBubble(point, view, width, height, human) {
    const middle = view.width / 2;
    const clear = Math.min(40, 0.055 * view.width);
    const onRight = point.x > middle;
    const minX = onRight ? middle + clear : edge;
    const maxX = (onRight ? view.width - edge : middle - clear) - width;
    const minY = bubble.hud ? bubble.hud.offsetTop + bubble.hud.offsetHeight + edge : edge;
    const maxY = view.height - height - edge;
    if (maxY < minY) return null;
    const blocked = bubble.overlays
      .filter((overlay) => !overlay.hidden && overlay.offsetWidth > 0)
      .map((overlay) => overlay.getBoundingClientRect());
    const free = (left, top) =>
      top >= minY &&
      top <= maxY &&
      blocked.every(
        (rect) =>
          left + width + 4 < rect.left ||
          left - 4 > rect.right ||
          top + height + 4 < rect.top ||
          top - 4 > rect.bottom,
      );
    const limit = (value, min, max) => Math.max(min, Math.min(max, value));
    const top = point.y - height - edge;
    // Above the center of the view the bubble has room even when looking straight at a friend.
    const clearHeight = view.height * 0.43;
    const high = top + height < clearHeight;
    const aboveMinX = high ? edge : minX;
    const aboveMaxX = high ? view.width - edge - width : maxX;
    if (aboveMaxX >= aboveMinX) {
      const left = limit(point.x - width / 2, aboveMinX, aboveMaxX);
      if (free(left, top) && point.x > left + 5 && point.x < left + width - 5)
        return { left, top, tail: limit(point.x - left, 11, width - 11), direction: 'bottom' };
    }

    const gap = human ? 14 : edge;
    const sideTop = limit(point.y - height / 2, minY, maxY);
    function beside(toRight) {
      const left = toRight ? point.x + gap : point.x - gap - width;
      const highSide = sideTop + height < clearHeight;
      const sideMinX = highSide ? edge : minX;
      const sideMaxX = highSide ? view.width - edge - width : maxX;
      const inset = human ? -16 : 5;
      if (left < sideMinX || left > sideMaxX || !free(left, sideTop)) return null;
      if (point.y <= sideTop + inset || point.y >= sideTop + height - inset) return null;
      return {
        left,
        top: sideTop,
        tail: limit(point.y - sideTop, 11, height - 11),
        direction: toRight ? 'left' : 'right',
      };
    }
    const side = beside(onRight);
    if (side || human) return side || beside(!onRight);
    return null;
  }

  function showLine(view, point, speaker, words) {
    bubble ??= makeBubble();
    if (!bubble || bubble.screen.hidden) return;
    const { body, name, words: copy } = bubble;
    if (name.textContent !== speaker.name) name.textContent = speaker.name;
    if (copy.textContent !== words) copy.textContent = words;
    if (body.dataset.friend !== speaker.type) body.dataset.friend = speaker.type;
    body.hidden = false;
    const fit = fitBubble(
      point,
      view,
      body.offsetWidth,
      body.offsetHeight,
      speaker.type.startsWith('human-'),
    );
    if (!fit) {
      hide();
      return;
    }
    if (body.dataset.tail !== fit.direction) body.dataset.tail = fit.direction;
    body.style.setProperty('--tail', `${fit.tail.toFixed(1)}px`);
    body.style.transform = `translate3d(${fit.left.toFixed(1)}px, ${fit.top.toFixed(1)}px, 0)`;
  }

  function draw(world, pads, state, camera, forward, right, up, aspect) {
    const { course, view } = world;
    if (!course?.path || !view?.width || !view.height || !pads?.length) {
      hide();
      return;
    }
    const { time } = state;
    if (encounter?.course !== course || encounter?.state !== state) encounter = null;
    const start = course.firstIndex || 0;
    const first = pads[0].index;
    const last = pads.at(-1).index;
    const firstAnchor = (index, step) => first + ((index - (first % step) + step) % step);
    const active = (pair) => encounter?.at === pair.at && encounter.kind === pair.kind;
    let closest;
    let retained;
    function offer(pair, speakers, points) {
      const distance = Math.hypot(pair.x - state.x, pair.y - state.y, pair.z - state.z);
      if (distance > talkDistance + (pair.kind === 'human' ? 5 : 0)) return;
      if (!points.some((point) => inView(point, view))) return;
      const priority = distance - (pair.kind === 'human' && pair.slot === 0 ? 12 : 0);
      const candidate = { ...pair, priority, points, speakers };
      if (active(pair)) retained = candidate;
      else if (!closest || priority < closest.priority) closest = candidate;
    }
    for (let at = firstAnchor(2, placementStep); at <= last; at += placementStep) {
      const row = course.path[at - start];
      if (!row || Math.abs(row[1] - camera[2]) > renderDistance + 1) continue;
      const pair = makePair(row, at, course);
      if (!visible(pair, camera, forward, right, up, aspect)) continue;
      const talking = active(pair) ? lineAt(encounter, time)?.who : undefined;
      const bee = hover(pair, 0, time, talking === 0);
      const moth = hover(pair, 1, time, talking === 1);
      turnToFriend(bee, moth);
      turnToFriend(moth, bee);
      window.FluffCritters.draw(world, bee, null, time);
      window.FluffCritters.draw(world, moth, null, time);

      offer(pair, [bee, moth], [talkPoint(world, bee), talkPoint(world, moth)]);
    }
    const neighbors = window.FluffSkyNeighbors;
    for (let at = firstAnchor(3, neighborStep); at <= last; at += neighborStep) {
      const row = course.path[at - start];
      if (!row || Math.abs(row[1] - camera[2]) > renderDistance + 2.2) continue;
      const pair = neighbors.pair(row, at, course);
      if (!visible(pair, camera, forward, right, up, aspect)) continue;
      const line = active(pair) ? lineAt(encounter, time) : null;
      const speakers = [
        neighbors.draw(world, pair, 0, time, line),
        neighbors.draw(world, pair, 1, time, line),
      ];
      offer(
        pair,
        speakers,
        speakers.map((speaker) => world.project(speaker.head)),
      );
    }

    if (retained && closest && time - encounter.start > cycleLength + 0.35) retained = null;

    const candidate = retained ?? closest;
    if (!candidate) {
      hide();
      if (encounter && time - encounter.seen > 1.25) encounter = null;
      return;
    }
    if (!retained) {
      const { at, slot, variation, kind } = candidate;
      encounter = { at, slot, variation, kind, course, state, start: time, seen: time };
    } else encounter.seen = time;

    const line = lineAt(encounter, time);
    const point = line && candidate.points[line.who];
    if (inView(point, view)) {
      encounter.speaker = candidate.speakers[line.who];
      showLine(view, point, encounter.speaker, line.words);
    } else hide();
  }

  function voice(state) {
    if (encounter?.state !== state || encounter.kind !== 'animal' || !bubble || bubble.body.hidden)
      return;
    const words = bubble.words.textContent;
    if (encounter.heard === words) return;
    const speaker = encounter.speaker;
    const dx = speaker.x - state.x, dz = speaker.z - state.z;
    const distance = Math.hypot(dx, speaker.y - state.y - 0.65, dz);
    if (distance >= 10) return;
    encounter.heard = words;
    const pan = (dx * Math.cos(state.yaw) - dz * Math.sin(state.yaw)) / Math.max(1, distance);
    window.FluffSound.effect(speaker.type, 0.37 * (1 - distance / 12), pan * 0.6);
  }

  window.FluffSkyFriends = { draw, hide, voice };
})();
