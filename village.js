(() => {
  'use strict';

  const origin = [0, 0, 0];
  const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const cream = '#fff0c9';
  const amber = '#ffd471';
  const green = '#75a482';
  const conversationRadius = 7.7;
  const types = ['bun', 'bee', 'hedgehog', 'moth'];
  const keepsakes = {
    carrot:
      'Tämä porkkana on omasta kasvimaastani. Isoimmatkin porkkanat alkavat ihan pienestä siemenestä!',
    dipper: 'Kieritän hunajalusikkaa tassuissani, jotta hunaja pysyy sen urissa kotimatkan ajan.',
    scope: 'Katson kaukoputkellani, kuka seuraavaksi ilmestyy tyynyjen takaa. Näin sinutkin jo kaukaa!',
    moonlantern:
      'Kuulyhtyni kulkee aina mukanani. Sen valossa löydän kotiin vielä viimeisenkin hypyn jälkeen.',
    balloon: 'Pilvi-ilmapalloni naru näyttää, mihin suuntaan tuuli puhaltaa.',
    pop: 'Tämän tikkarin värit kiertävät kehää, ihan niin kuin pehmo pyörähdyshypyssä!',
    wand: 'Ompelin sauvani tähden itse. Heilautan sitä, kun joku onnistuu hienossa hypyssä.',
    lantern: 'Kannoin lyhdyn ulos, jotta tänne löytää kylään myös illalla.',
  };
  const routes = {
    cloud: { anchors: [0, 2, 6, 11, 15], offset: 0 },
    candy: { anchors: [0, 2, 8, 13, 18, 21], offset: 1 },
    night: { anchors: [0, 2, 9, 14, 18, 23, 26], offset: 3 },
    grove: { anchors: [0, 6, 8, 14, 15, 21], offset: 2 },
    reef: { anchors: [0, 6, 7, 14, 15, 22, 28], offset: 1 },
    orchard: {
      anchors: [0, 8, 10, 16, 17, 22, 25],
      offset: 1,
      stories: {
        dipper: 'Tällä lusikalla valutan omenankukista kerättyä hunajaa uuniomenien päälle.',
        scope:
          'Kaukoputkella näen, missä latvassa omenat ovat jo punaisia. Suurin piilottelee lehtien takana.',
        moonlantern:
          'Kannan kuulyhtyä, kun etsin pudonneita omenia iltahämärässä. Ne pyörivät yllättävän kauas!',
        balloon:
          'Sidoin ilmapallon omenakorini kahvaan. Nyt löydän korin, vaikka ruohikko kätkisi sen.',
        pop: 'Tämä tikkari maistuu paahdetulta omenalta. Siinä on aavistus kaneliakin.',
        carrot:
          'Toin tarhaan evääksi porkkanan. Rouskuttelen sitä sillä aikaa, kun omenat kypsyvät oksilla.',
        wand: 'Sauvan tähti toimii tahtipuikkona. Heilutan sitä, kun pidämme sadonkorjuutanssit.',
      },
    },
    frost: {
      anchors: [0, 4, 9, 14, 19, 26, 31],
      offset: 2,
      stories: {
        scope:
          'Katselen kaukoputkella kaukaisia jäähuippuja. Kun kerran suuntasin sen alas jäähän, näin oman nenäni.',
        moonlantern:
          'Kuulyhty piirtää lumeen pyöreän valoläikän. Etsin sen avulla illalla omat tassunjälkeni kotiin.',
        balloon:
          'Ilmapalloni naru värisee jo ennen kuin viima tuntuu poskissa. Siitä tiedän sulkea oven.',
        pop: 'Tikkarissani on sama vihreä raita kuin revontulissa. Maku on ihan tavallinen minttu.',
        carrot: 'Käärin porkkanan huiviini, ettei se jäätyisi. Nyt minulla on eväs ja lämmin kaula.',
        wand: 'Piirsin sauvalla revontulten kaaret lumeen. Aamulla niiden päälle oli satanut uusi kerros.',
      },
    },
    rose: {
      anchors: [0, 4, 7, 11, 14, 17, 19],
      offset: 0,
      stories: {
        carrot: 'Kasvatin tämän porkkanan ruusupenkin reunalla. Se tuoksuu mullalta ja maistuu aamupalalta.',
        dipper: 'Pyöräytän lusikallisen ruusuhunajaa lämpimään maitoon. Sitten koko mökki tuoksuu kukilta.',
        scope: 'Kaukoputkella näen, onko kauimmaiseen ruusuun jo auennut ensimmäinen terälehti.',
        moonlantern: 'Kun ruusut sulkeutuvat yöksi, sytytän kuulyhdyn käytävän mutkaan.',
        balloon: 'Värjäsin ilmapallon vanhoilla terälehdillä. Yksi lehti jätti siihen pienen sydämen.',
        pop: 'Tikkarissa maistuvat mansikka ja ruusu. Toinen maku tulee vasta, kun pyöräytät sitä.',
      },
    },
    meadow: {
      anchors: [0, 3, 7, 11, 15, 19, 22],
      offset: 1,
      stories: {
        dipper: 'Keräsin hunajan niityn apiloista. Syön sitä lusikanpäästä, kun istahdan lepäämään heinikkoon.',
        scope: 'Kaukoputkessa pienikin heinänkorsi näyttää puulta. Kerran luulin leppäkerttua kiipeilijäksi.',
        moonlantern: 'Sytytän kuulyhdyn niityn reunalle, kun viimeiset kimalaiset lentävät kotiin.',
        balloon: 'Kiedoin ilmapallon naruun heinänkorren. Se kutittaa tassua aina tuulen puhaltaessa.',
        pop: 'Tässä tikkarissa on omenaa ja minttua. Otan pienen maistiaisen jokaisen niittykierroksen jälkeen.',
        carrot: 'Tätä porkkanaa piti etsiä kauan. Vain lehtien kärjet pilkistivät apiloiden seasta.',
        wand: 'Pidän sauvalla tahtia, kun heinät heiluvat. Kovassa tuulessa minullakin menevät tahdit sekaisin.',
      },
    },
    lagoon: {
      anchors: [0, 3, 7, 11, 15, 19, 23],
      offset: 2,
      stories: {
        scope: 'Kaukoputkellani näen, kuinka siniruusun kuvajainen hajoaa pieniksi sinisiksi paloiksi aallossa.',
        moonlantern: 'Pidän kuulyhtyä veden yllä. Laguunissa näyttää silloin kelluvan kaksi kuuta.',
        balloon: 'Sidoin sinisen ilmapallon laiturinkaiteeseen. Ilman narua se näyttäisi vedestä karanneelta kuplalta.',
        pop: 'Tikkari on mustikanmakuinen. Jos sen upottaisi laguuniin, se voisi näyttää siniseltä kiveltä.',
        carrot: 'Huuhtelin porkkanan laguunin vedessä. Se oli niin kylmää, että porkkana maistuu melkein jäätelöltä.',
        wand: 'Sauvan tähti piirtää varjon veden pintaan. Heilutan sitä aina, kun joku laskee liukua alas.',
      },
    },
    tulip: {
      anchors: [0, 4, 8, 12, 16, 20, 25],
      offset: 3,
      stories: {
        moonlantern: 'Kuulyhtyni valaisee tulppaanien varret. Niitä pitkin silmä löytää tiensä tornin huipulle asti.',
        balloon: 'Lähetän ilmapallon ensin katsomaan, kuinka tuulista ylhäällä on. Onneksi sen naru yltää tänne asti.',
        pop: 'Rouskutan tikkaria vasta tasanteella. Portaissa tarvitsen molemmat tassut tasapainoiluun.',
        carrot: 'Otin porkkanan mukaan huipulle asti, mutta nälkä yllätti jo ensimmäisellä tasanteella.',
        wand: 'Heilutan sauvalla tervehdyksen jokaiselle, joka löytää tiensä tornin ylimmälle tasanteelle.',
      },
    },
  };
  const residents = {
    bun: {
      names: ['Pihla', 'Tupsu', 'Aava'],
      items: ['carrot', 'balloon', 'pop'],
      home: 'Porkkanamökki',
      scale: 1.7,
      color: '#eeaf85',
      draw: cottage,
    },
    bee: {
      names: ['Hilla', 'Nuppu', 'Mesi'],
      items: ['dipper', 'pop', 'wand'],
      home: 'Hunajapesä',
      scale: 0.63,
      color: '#e6b455',
      draw: hive,
    },
    hedgehog: {
      names: ['Muru', 'Noki', 'Kaneli'],
      items: ['scope', 'carrot', 'lantern'],
      home: 'Sienitupa',
      scale: 1.24,
      color: '#e5848e',
      draw: mushroom,
    },
    moth: {
      names: ['Luna', 'Usva', 'Kide'],
      items: ['moonlantern', 'wand', 'balloon'],
      home: 'Kuukoti',
      scale: 0.94,
      color: '#a0addb',
      draw: observatory,
    },
  };

  function endlessSlot(at) {
    if (at === 0) return 0;
    return at % 5 === 2 ? 1 + Math.floor(at / 5) : -1;
  }

  function* homes(course, pads) {
    const start = course.firstIndex || 0;
    const first = pads?.[0]?.index ?? start;
    const last = pads?.at(-1)?.index ?? start + course.path.length - 1;
    const route = routes[course.id];
    const anchors = course.previousPadIndices
      ? route?.anchors.map((index) => course.previousPadIndices[index])
      : route?.anchors;
    for (let at = first; at <= last; at++) {
      const slot = course.endless ? endlessSlot(at) : (anchors?.indexOf(at) ?? -1);
      if (slot < 0) continue;
      // The houses sit on their own islands, even beside a moving cushion.
      const [padX, padZ, padY, width] = course.path[at - start];
      const sequence = slot + (route?.offset ?? 0);
      const type = types[sequence % types.length];
      const resident = residents[type];
      const side = slot % 2 ? 1 : -1;
      const yaw = side * 0.77;
      const variant = Math.floor(sequence / types.length) % resident.names.length;
      const item = resident.items[variant];
      yield {
        id: `${course.id}-${at}-${type}`,
        at,
        type,
        name: resident.names[variant],
        item,
        itemStory: route?.stories?.[item] ?? keepsakes[item],
        home: resident.home,
        scale: resident.scale,
        houseX: padX + side * (width * 0.5 + 2.95),
        houseY: padY - 0.21,
        houseZ: padZ + (at === 0 ? 5.85 : 2.4),
        yaw,
        side,
      };
    }
  }

  function residentPose(home, time) {
    const phase = time * 2.1 + home.at * 0.91;
    const sway = Math.sin(phase);
    const joy = (1 + Math.cos(phase * 0.57)) * 0.5;
    const localX = home.side * 0.41 + sway * 0.29;
    const localZ = -1.65 + 0.12 * Math.cos(phase);
    const c = Math.cos(home.yaw),
      s = Math.sin(home.yaw);
    const flying = home.type === 'bee' || home.type === 'moth';
    const height = flying
      ? (home.type === 'bee' ? 0.99 : 1.12) + sway * 0.16
      : 0.48 * home.scale + 0.13 * joy ** 3;
    return {
      ...home,
      x: home.houseX + c * localX + s * localZ,
      y: home.houseY + height,
      z: home.houseZ - s * localX + c * localZ,
      yaw: home.yaw + 0.15 * sway,
      bank: sway * (flying ? 0.16 : 0.06),
      stride: sway * 0.29,
      wave: joy ** 3,
      lift: flying ? 0.55 + 0.18 * sway : undefined,
      curl: home.type === 'hedgehog' ? 0.18 * joy : 0,
      sniff: Math.sin(phase * 4.4) * joy,
    };
  }

  function speechPoint(world, home, face) {
    const point = world.project(face),
      view = world.view;
    if (!point || point.x <= 0 || point.x >= view.width || point.y <= 0 || point.y >= view.height)
      return null;
    // Looking back from behind the house, its front wall can hide the resident on the porch.
    const c = Math.cos(home.yaw),
      s = Math.sin(home.yaw);
    const localZ = (p) => (p[0] - home.houseX) * s + (p[2] - home.houseZ) * c;
    const eye = view.camera,
      faceZ = localZ(face),
      eyeZ = localZ(eye);
    if (eyeZ > -0.5 && faceZ < -0.5) {
      const t = (-0.5 - faceZ) / (eyeZ - faceZ);
      const dx = face[0] + (eye[0] - face[0]) * t - home.houseX;
      const dz = face[2] + (eye[2] - face[2]) * t - home.houseZ;
      const y = face[1] + (eye[1] - face[1]) * t - home.houseY;
      if (Math.abs(dx * c - dz * s) < 0.92 && y >= 0 && y < 1.7) return null;
    }
    return point;
  }
  function nearby(course, pads, state, world) {
    if (!course?.path || !state) return null;
    let closest = null,
      visible = null;
    let range = conversationRadius,
      visibleRange = conversationRadius;
    for (const home of homes(course, pads)) {
      if (
        Math.abs(home.houseZ - state.z) > conversationRadius + 2 ||
        Math.abs(home.houseY - state.y) > 2.4
      )
        continue;
      const distance = Math.hypot(
        home.houseX - home.side * 0.85 - state.x,
        home.houseZ - 1.35 - state.z,
      );
      if (distance >= visibleRange && distance >= range) continue;
      const pose = residentPose(home, state.time ?? 0);
      const { id, name, type, home: label, x, y, z, at, scale, yaw } = pose;
      const face = [
        x - Math.sin(yaw) * 0.33 * scale,
        y + (type === 'bun' ? 0.2 : 0.06) * scale,
        z - Math.cos(yaw) * 0.33 * scale,
      ];
      const point = world ? speechPoint(world, home, face) : null;
      const resident = {
        id,
        name,
        type,
        home: label,
        x,
        y,
        z,
        at,
        scale,
        yaw,
        face,
        point,
        itemStory: pose.itemStory,
      };
      if (distance < range) {
        range = distance;
        closest = resident;
      }
      if (point && distance < visibleRange) {
        visibleRange = distance;
        visible = resident;
      }
    }
    return visible || closest;
  }

  function roundDoor(world, z, width, height, trim, panel, detail) {
    world.draw('egg', [0, height * 0.42, z], [width, height * 1.15, 0.24], trim);
    world.draw('egg', [0, height * 0.42, z - 0.11], [width * 0.78, height * 0.98, 0.13], panel);
    if (detail)
      world.draw('ball', [width * 0.21, height * 0.37, z - 0.18], [0.105, 0.105, 0.09], amber);
  }

  function roundWindow(world, x, y, z, size, trim, glass, detail) {
    world.draw('ball', [x, y, z], [size, size, 0.23], trim);
    world.draw('ball', [x, y, z - 0.1], [size * 0.76, size * 0.76, 0.1], glass);
    if (!detail) return;
    world.draw('box', [x, y, z - 0.16], [0.045, size * 0.72, 0.035], trim);
    world.draw('box', [x, y, z - 0.16], [size * 0.72, 0.045, 0.035], trim);
  }

  function cottage(world, detail) {
    world.draw('box', [0, 0.83, 0.28], [2.48, 1.66, 1.88], '#f6c898');
    world.draw('box', [0, 0.12, 0.3], [2.52, 0.27, 1.91], '#d49272');
    for (const side of [-1, 1])
      world.draw('box', [side * 0.66, 1.92, 0.25], [1.92, 0.3, 2.23], '#cf708d', -side * 0.54, 1);
    world.draw('ball', [0, 2.34, 0.25], [0.3, 0.26, 2.25], '#e795ab');
    world.draw('ball', [0, 1.68, -0.78], [1.1, 0.75, 0.2], '#f6c898');
    roundDoor(world, -0.67, 1.01, 1.13, cream, '#956385', detail);
    if (!detail) return;
    for (const side of [-1, 1])
      roundWindow(world, side * 0.81, 0.9, -0.65, 0.46, cream, '#81b1bb', true);
    world.draw('box', [0.79, 2.16, 0.5], [0.42, 0.85, 0.45], '#ba787b');
    world.draw('box', [0.79, 2.57, 0.5], [0.54, 0.16, 0.55], '#f4c0a0');
    world.draw('egg', [0, 1.67, -0.89], [0.18, 0.4, 0.1], '#ec9658', -0.59);
    world.draw('ear', [-0.13, 1.83, -0.9], [0.13, 0.19, 0.08], green, -0.4);
  }

  function hive(world, detail) {
    world.draw('egg', [0, 1.04, 0.29], [2.4, 2.22, 1.92], '#dd9550');
    for (const [y, width, depth] of [
      [0.48, 2.07, 1.73],
      [0.88, 2.49, 2.04],
      [1.29, 2.36, 1.85],
      [1.67, 1.93, 1.51],
      [1.99, 1.33, 1.02],
    ])
      world.draw('ball', [0, y, 0.28], [width, 0.53, depth], amber);
    roundDoor(world, -0.73, 0.88, 0.98, cream, '#936844', detail);
    if (!detail) return;
    for (const side of [-1, 1])
      roundWindow(world, side * 0.68, 1.05, -0.53, 0.43, '#d18145', '#fff2a0', false);
    world.draw('ball', [0, 2.22, 0.28], [0.61, 0.32, 0.52], '#f7bc52');
    world.draw('star', [0, 1.34, -0.7], [0.41, 0.43, 0.21], cream, 0.16);
  }

  function mushroom(world, detail) {
    world.draw('egg', [0, 0.8, 0.28], [1.9, 1.91, 1.84], '#f0caa0');
    world.draw('ball', [0, 1.63, 0.32], [2.72, 0.48, 2.18], '#ac6072');
    world.draw('egg', [0, 1.88, 0.31], [2.83, 1.27, 2.22], '#e47789');
    world.draw('ball', [0, 2.2, 0.28], [0.54, 0.53, 0.45], '#eb8796');
    roundDoor(world, -0.62, 0.89, 1.12, cream, '#8c625d', detail);
    if (!detail) return;
    for (const [x, y, z, size] of [
      [-0.86, 1.94, -0.48, 0.43],
      [-0.34, 2.26, -0.45, 0.35],
      [0.32, 1.98, -0.76, 0.46],
      [0.85, 2.15, -0.44, 0.38],
      [0.65, 2.41, 0.05, 0.33],
    ])
      world.draw('ball', [x, y, z], [size, size * 0.81, 0.13], cream, x * 0.4);
    roundWindow(world, -0.64, 0.96, -0.43, 0.45, '#d18b75', '#eebd77', true);
    roundWindow(world, 0.62, 0.96, -0.43, 0.41, '#d18b75', '#eebd77', true);
  }

  function observatory(world, detail) {
    world.draw('box', [0, 0.17, 0.27], [2.13, 0.34, 1.73], '#766b9a');
    world.draw('box', [0, 0.88, 0.31], [1.86, 1.7, 1.61], '#8b9ad1');
    world.draw('ball', [0, 1.61, 0.27], [2.12, 0.35, 1.95], '#7883b3');
    world.draw('ball', [0, 1.92, 0.27], [1.9, 1.16, 1.75], '#bacdf0');
    world.draw('ball', [0, 2.31, 0.27], [1.03, 0.48, 0.95], '#cddff4');
    world.draw('star', [0, 2.64, 0.25], [0.59, 0.64, 0.26], amber, 0.12);
    roundDoor(world, -0.5, 0.89, 1, '#e3e2f8', '#645b89', detail);
    if (!detail) return;
    roundWindow(world, 0, 1.85, -0.54, 0.65, cream, '#9fa6d3', true);
    for (const side of [-1, 1])
      roundWindow(world, side * 0.64, 0.89, -0.49, 0.37, '#dfdbf8', amber, false);
  }

  function drawHome(world, home, detail) {
    const { gl, u } = world;
    const c = Math.cos(home.yaw),
      s = Math.sin(home.yaw);
    const design = residents[home.type];
    gl.uniform3fv(u.modelBase, [home.houseX, home.houseY, home.houseZ]);
    gl.uniformMatrix3fv(u.modelBasis, false, [c, 0, -s, 0, 1, 0, s, 0, c]);
    try {
      world.draw('ball', [0, -0.62, -0.17], [4.66, 1.13, 4.45], '#ada1c5');
      world.draw('box', [0, -0.27, -0.19], [4.23, 0.63, 4.15], '#d7b9d0');
      world.draw('box', [0, -0.09, -0.2], [4.34, 0.29, 4.25], '#9cc5a3', 0, 1);
      design.draw(world, detail);
      if (detail) {
        for (const [x, z, size] of [
          [-0.26, -0.97, 0.47],
          [0.05, -1.35, 0.39],
          [0.38, -1.76, 0.3],
        ])
          world.draw('ball', [x, 0.065, z], [size, 0.063, size * 0.68], cream);
        for (const side of [-1, 1]) {
          world.draw('ball', [side * 1.42, 0.11, -1.03], [0.63, 0.29, 0.66], green);
          world.draw('star', [side * 1.45, 0.32, -1.12], [0.24, 0.25, 0.14], design.color, side * 0.21);
        }
      }
    } finally {
      gl.uniform3fv(u.modelBase, origin);
      gl.uniformMatrix3fv(u.modelBasis, false, identity);
    }
  }

  function draw(world, pads, state) {
    const { camera, forward, right, up, lensX, lensY } = world.view;
    for (const home of homes(world.course, pads)) {
      const dx = home.houseX - camera[0],
        dy = home.houseY + 0.95 - camera[1],
        dz = home.houseZ - camera[2];
      const depth = dx * forward[0] + dy * forward[1] + dz * forward[2];
      if (depth < -3.5 || depth > 71) continue;
      const horizontal = dx * right[0] + dz * right[2];
      const vertical = dx * up[0] + dy * up[1] + dz * up[2];
      const view = Math.max(0, depth);
      if (Math.abs(horizontal) > view / lensX + 4 || Math.abs(vertical) > view / lensY + 4) continue;
      const distance = Math.hypot(dx, dy, dz);
      drawHome(world, home, distance < 28);
      if (distance < 31) {
        const pose = residentPose(home, state.time);
        window.FluffCritters.draw(world, pose, { y: home.houseY + 0.048 }, state.time);
      }
    }
  }

  window.FluffVillage = { nearby, draw };
})();
