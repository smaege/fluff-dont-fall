(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const turnArrow =
    '<path opacity=".52" d="M3.4 12.1c0-2.9 3.8-5.1 8.6-5.1s8.6 2.2 8.6 5.1"/>' +
    '<circle cx="12" cy="11.8" r="1.3" fill="currentColor" stroke="none"/>' +
    '<path d="M20.6 12.1c0 2.9-3.8 5.1-8.6 5.1H7m3.1-3.1L7 17.2l3.1 3.1"/>';
  const drawings = {
    paw: '<g fill="currentColor" stroke="none"><path d="M4.2 17.1c0-2.1 2.1-3.3 3.4-5.4 2-3.2 6.4-3.2 8.5 0 1.3 2.1 3.8 3.3 3.8 5.6 0 3.1-3 4.2-6 3-1.4-.5-2.4-.5-3.8 0-3.2 1.2-5.9-.1-5.9-3.2Z"/><ellipse cx="3.9" cy="9.3" rx="2.2" ry="3" transform="rotate(-28 3.9 9.3)"/><ellipse cx="9" cy="5.7" rx="2.3" ry="3.3" transform="rotate(-12 9 5.7)"/><ellipse cx="15.3" cy="5.6" rx="2.3" ry="3.3" transform="rotate(14 15.3 5.6)"/><ellipse cx="20.2" cy="9.4" rx="2.2" ry="3" transform="rotate(28 20.2 9.4)"/></g>',
    gamepad:
      '<path d="M7 6.5h10c2 0 3.3 1.6 3.8 3.6l1 5c.8 3.8-2.2 5-4.3 2.6L15.5 16h-7l-1.9 1.7c-2.5 2.4-5 1.2-4.2-2.5l.9-5.1C3.8 8 5 6.5 7 6.5Z"/><path d="M7.5 9v4m-2-2h4"/><circle cx="15.4" cy="11.8" r=".8" fill="currentColor"/><circle cx="18.2" cy="9.7" r=".8" fill="currentColor"/>',
    bear: '<path d="M5.7 8.2a3.1 3.1 0 1 1 4.2-4 11 11 0 0 1 4.2 0 3.1 3.1 0 1 1 4.2 4c1.5 1.7 2.3 3.5 2.3 5.7 0 4.4-3.7 7-8.6 7s-8.6-2.6-8.6-7c0-2.2.8-4 2.3-5.7Z"/><path d="M8.3 12.5h.1m7.2 0h.1m-4.6 3.2q.9 1.3 1.8 0"/>',
    play: '<path fill="currentColor" stroke="currentColor" stroke-linejoin="round" d="m6.5 3.8 13.1 8.1-13.1 8.3Z"/>',
    jump: '<path d="M12 16V4m-5 5 5-5 5 5M6 20h12"/>',
    book: '<path d="M12 6.2C8.8 3.8 5.4 4 2.5 4.8v13.8c3.8-1 6.3-.8 9.5 1.3 3.2-2.1 5.7-2.3 9.5-1.3V4.8c-3.6-.9-6.5-.8-9.5 1.4ZM12 6v13.4"/>',
    camera: '<path d="M3 7h4l1.5-2.5h7L17 7h4v12H3Z"/><circle cx="12" cy="12.6" r="3.3"/>',
    petal:
      '<path d="M6.1 16.8c-1.8-3.9-.5-8 3.2-9.3 1.1-.4 2.1-.2 2.9.4 1.1-2.7 3.2-4.1 6.3-4.4.8 3.4.4 7.7-2 10.6-2.2 2.7-6.2 4.6-10.4 2.7ZM4 20c3.3-1.9 6.2-4.6 8.5-8.2"/>',
    chat: '<path d="M20 13.5a2 2 0 0 1-2 2h-5l-4.5 4v-4H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2zM8 10.5h8"/>',
    music:
      '<path d="M9 17V6l10-2v11M9 9l10-2"/><ellipse cx="6.5" cy="17.5" rx="2.6" ry="1.9"/><ellipse cx="16.5" cy="15.5" rx="2.6" ry="1.9"/>',
    infinity:
      '<path d="M12 12c-2-3-3.4-4.4-5.7-4.4a4.4 4.4 0 1 0 0 8.8c2.3 0 3.8-1.8 5.7-4.4s3.4-4.4 5.7-4.4a4.4 4.4 0 1 1 0 8.8c-2.3 0-3.8-1.8-5.7-4.4Z"/>',
    volume:
      '<path d="m3 9 4.3-.1L12 5v14l-4.7-3.8H3Z"/><path d="M15.6 8.3a5.5 5.5 0 0 1 0 7.4m2.7-10a9 9 0 0 1 0 12.5"/>',
    mute: '<path d="m3 9 4-.1L12 5v14l-5-3.8H3Z"/><path d="m16 9 5.5 6m0-6-5.5 6"/>',
    flag: '<path d="M5 21V4m.3 1c4-3.4 8.6 2.6 14-.2v9c-5.4 2.7-9.9-3.3-14 0Z"/><path d="M9.5 5.4v4l4.5.8V6m-9 3.2 4.5.2v4l4.5.8v-4l5.1-.6"/>',
    save: '<path d="M4 3.5h12.5l4 4V20H4Z"/><path d="M8 3.5v6h8v-6M8 20v-7h8v7"/>',
    clock: '<circle cx="12" cy="12" r="8.8"/><path d="M12 6.9v5.5l3.3 2"/>',
    pause: '<path d="M8 5.5v13M16 5.5v13" stroke-width="3.5"/>',
    x: '<path d="m6 6 12 12m0-12L6 18"/>',
    check: '<path d="m4.5 12 4.6 4.8L20 6.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    turnLeft: turnArrow,
    turnRight: '<g transform="translate(24 0) scale(-1 1)">' + turnArrow + '</g>',
    gift: '<path fill="#ffdcad" d="M4 10h16v11H4z"/><path fill="#ffeccc" d="M2.5 7.5h19v4h-19z"/><path d="M12 7.5v13M12 7.5C8 8 5 6.4 5.7 4.2S10.7 2.9 12 7.5Zm0 0c4 .5 7-1.1 6.3-3.3S13.3 2.9 12 7.5Z"/>',
    star: '<path d="m12 2.8 2.8 5.9 6.5.9-4.7 4.6 1.2 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9Z"/>',
    badge:
      '<circle class="badge-face" cx="12" cy="12" r="10.5" stroke-width="1.2"/><circle class="badge-stitch" cx="12" cy="12" r="8.3" fill="none" stroke-width="1" stroke-dasharray=".9 1.4"/><g class="badge-paw" stroke="none"><path d="M8 15.7c0-1.1 1-1.5 1.7-2.6a2.7 2.7 0 0 1 4.6 0c.7 1.1 1.7 1.5 1.7 2.6 0 1.6-1.6 2.1-3 1.6a2.6 2.6 0 0 0-2 0c-1.4.5-3 0-3-1.6Z"/><ellipse cx="7.7" cy="11.3" rx="1.25" ry="1.6" transform="rotate(-27 7.7 11.3)"/><ellipse cx="10.6" cy="8.9" rx="1.25" ry="1.65"/><ellipse cx="13.4" cy="8.9" rx="1.25" ry="1.65"/><ellipse cx="16.3" cy="11.3" rx="1.25" ry="1.6" transform="rotate(27 16.3 11.3)"/></g>',
  };
  const icon = (k) =>
    '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    drawings[k] +
    '</svg>';
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.dataset.icon);
  });
  const escape = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  const courses = window.FluffCourses.all,
    allCourses = [...courses, window.FluffEndless.course],
    store = window.FluffProfiles,
    sound = window.FluffSound;
  const modal = $('modal'),
    body = $('modal-body');
  const villageTalk = $('village-talk'),
    villageHello = $('village-hello'),
    villageGreeting = $('village-greeting');
  const { choices, prices } = window.FluffLooks;
  const plush = window.FluffPlush;
  let profile = null,
    selected = null,
    game = null,
    modalCancel = null,
    toastTimer;
  let nearbyVillager = null,
    villagerToTalk = null,
    stopFramingSpeaker = null;
  const greetedVillagers = new Set();
  function time(seconds) {
    const tenths = Math.floor(seconds * 10);
    return (
      Math.floor(tenths / 600) +
      ':' +
      String(Math.floor(tenths / 10) % 60).padStart(2, '0') +
      ',' +
      (tenths % 10)
    );
  }
  function toast(message) {
    $('toast').textContent = message;
    $('toast').classList.add('shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('toast').classList.remove('shown'), 3600);
  }
  function close() {
    modalCancel = null;
    if (modal.open) modal.close();
    modal.classList.remove('wide', 'village-dialog');
    stopFramingSpeaker?.();
  }
  function dismiss() {
    const callback = modalCancel;
    close();
    callback?.();
  }
  $('close-modal').onclick = dismiss;
  modal.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    dismiss();
  });
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal) {
      const r = modal.getBoundingClientRect();
      if (ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom)
        dismiss();
    }
  });
  function show(content, { wide = false, cancel = null } = {}) {
    modalCancel = cancel;
    stopFramingSpeaker?.();
    modal.classList.toggle(
      'village-dialog',
      content instanceof Element && content.classList.contains('village-chat'),
    );
    if (typeof content === 'string') body.innerHTML = content;
    else body.replaceChildren(content);
    modal.classList.toggle('wide', wide);
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    const focus = body.querySelector('[autofocus]') || body.querySelector('h2');
    if (focus) {
      if (focus.tagName === 'H2') focus.tabIndex = -1;
      focus.focus({ preventScroll: true });
    }
  }
  function error(message) {
    window.FluffPortalTravel.cancel();
    window.FluffSkyFriends.hide();
    show(
      '<div class="dialog-mark">' +
        icon('bear') +
        '</div><h2 id="modal-title">Peli keskeytyi</h2><p>' +
        escape(message) +
        '</p><button class="secondary" id="error-ok">Takaisin aulaan</button>',
      { cancel: lobby },
    );
    $('error-ok').onclick = lobby;
  }
  const levelBadge = (c) =>
    c.endless
      ? '<span class="difficulty endless">' + icon('infinity') + 'Loputon</span>'
      : '<span class="difficulty ' +
        c.id +
        '"><span class="bars" aria-hidden="true"><b></b><b></b><b></b></span>' +
        c.difficulty +
        '</span>';
  function avatar(a) {
    try {
      return (
        '<img class="avatar" src="' +
        plush.portrait(a) +
        '" alt="' +
        escape(plush.description(a)) +
        '">'
      );
    } catch {
      return '<span class="avatar fallback-avatar" aria-label="Pehmo">' + icon('bear') + '</span>';
    }
  }
  function jumps(n) {
    return n + ' ' + (n === 1 ? 'hyppy' : 'hyppyä');
  }
  function badges(n) {
    return n + ' ' + (n === 1 ? 'tassumerkki' : 'tassumerkkiä');
  }
  const { maxLives, starsPerLife, endlessFirstLife, endlessLifeStep } = window.FluffGame;
  const lifeRule =
    'Saat lisäelämän aina ' + starsPerLife + ' tassumerkistä, jos elämiä on alle kolme.';
  const endlessLifeRule =
    'Poimi radalta ' + endlessFirstLife + ' tassumerkkiä ensimmäistä lisäelämää varten. ' +
    'Seuraavaan tarvitset ' + (endlessFirstLife + endlessLifeStep) + ' uutta merkkiä, sitä seuraavaan ' +
    (endlessFirstLife + 2 * endlessLifeStep) + ' ja niin edelleen. Raja nousee myös täysillä elämillä.';
  function purse(n) {
    return '<span class="star-purse">' + icon('badge') + badges(n) + '</span>';
  }
  function raceKey(course) {
    return course.id + (course.raceVersion ?? (course.difficulty === 'Vaikea' ? '-v6' : '-v5'));
  }
  const previousRaces = [
    ['-v7', 'Edellisen rataversion ennätys'],
    ['-v6', 'Ennätys ennen uusia liukuja'],
    ['-v5', 'Ennätys ennen yhdistelmäesteitä'],
    ['-v4', 'Edellisen rataversion ennätys'],
    ['-v3', 'Yllätyslaatikkoradan ennätys'],
    ['-v2', 'Aiemman esteradan ennätys'],
  ];
  function previousResults(p, course) {
    if (!p) return [];
    return previousRaces
      .filter(([version]) => {
        const key = course.id + version;
        return key !== raceKey(course) && p.completed[key] !== undefined;
      })
      .map(([version, label]) => {
        if (version === course.previousRaceVersion) label = 'Ennätys ennen korkeuseroja';
        else if (version === '-v5' && (course.tower || (course.previousPadIndices && course.difficulty !== 'Vaikea')))
          label = 'Ennätys ennen uusia liukuja';
        return { label, seconds: p.completed[course.id + version] };
      });
  }
  function completedCount(p) {
    return courses.filter(
      (c) =>
        Object.hasOwn(p.completed, raceKey(c)) ||
        previousResults(p, c).length > 0 ||
        Object.hasOwn(p.completed, c.id),
    ).length;
  }
  function renderLobby() {
    const savedProfiles = profile ? [] : store.list();
    $('course-count').textContent = allCourses.length + ' rataa';
    $('name-form').hidden = !!profile || savedProfiles.length > 0;
    $('lobby-profile-picker').hidden = savedProfiles.length === 0;
    if (savedProfiles.length) renderProfileList($('lobby-profile-list'), savedProfiles);
    $('active-profile').hidden = !profile;
    if (profile) {
      $('active-profile').innerHTML =
        '<div class="selected-profile">' +
        avatar(profile.appearance) +
        '<div><strong>' +
        escape(profile.name) +
        '</strong><small>' +
        completedCount(profile) +
        ' / ' +
        courses.length +
        ' maalirataa läpi · ' +
        badges(profile.stars) +
        '</small></div><button id="edit-active">Muokkaa</button></div>';
      $('edit-active').onclick = () => {
        selected = null;
        editor();
      };
    }
    const grid = $('course-grid');
    for (const c of allCourses) {
      let card = grid.querySelector('[data-course="' + c.id + '"]');
      if (!card) {
        card = document.createElement('button');
        card.className = 'course-card';
        card.dataset.course = c.id;
        card.setAttribute('aria-label', c.title + ', ' + c.difficulty);
        card.onclick = () => {
          selected = c;
          if (profile) ready();
          else {
            const list = store.list();
            if (list.length) library(list);
            else nameDialog();
          }
        };
        grid.append(card);
      }
      const best = profile?.completed[raceKey(c)];
      const shortBest = profile?.completed[c.id];
      const previous = previousResults(profile, c)[0]?.seconds;
      let caption = c.caption;
      if (c.endless && profile?.endlessBest) caption = 'Ennätys ' + jumps(profile.endlessBest);
      else if (best !== undefined) caption = 'Ennätys ' + time(best);
      else if (previous !== undefined) caption = 'Aiempi ennätys ' + time(previous);
      else if (shortBest !== undefined) caption = 'Lyhyt rata läpäisty';
      card.innerHTML =
        '<span class="level-picture"><img loading="lazy" decoding="async" src="assets/' +
        c.id +
        '.webp" alt="">' +
        levelBadge(c) +
        '</span><span class="course-caption"><span><strong>' +
        c.title +
        '</strong><small>' +
        caption +
        '</small></span><i class="card-play">' +
        icon(
          best !== undefined || previous !== undefined || shortBest !== undefined
            ? 'check'
            : 'play',
        ) +
        '</i></span>';
    }
  }
  function startProfile(name) {
    if (!name.trim()) throw new Error('Anna pehmollesi nimi.');
    const exists = store.find(name);
    profile = store.open(name);
    if (exists) continueWithProfile();
    else {
      renderLobby();
      editor();
    }
  }
  function continueWithProfile() {
    if (selected) {
      renderLobby();
      ready();
    } else chooseCourse();
  }
  function bindName(form, input) {
    input.addEventListener('input', () => input.setCustomValidity(''));
    input.oninvalid = () => {
      if (!input.value.trim()) input.setCustomValidity('Anna pehmollesi nimi.');
    };
    form.onsubmit = (ev) => {
      ev.preventDefault();
      try {
        startProfile(input.value);
      } catch (err) {
        input.setCustomValidity(err.message);
        input.reportValidity();
      }
    };
  }
  bindName($('name-form'), $('name'));
  $('lobby-new-profile').onclick = nameDialog;
  function nameDialog() {
    show(
      '<div class="dialog-mark">' +
        icon('paw') +
        '</div><h2 id="modal-title">Pehmosi nimi</h2><p>Uusi nimi luo uuden pehmon. Tutulla nimellä jatkat omaa peliäsi.</p><form id="dialog-form"><div class="name-input">' +
        icon('paw') +
        '<input id="dialog-name" aria-label="Pehmosi nimi" placeholder="Kirjoita nimi…" required maxlength="24" autocomplete="off" autofocus></div><div class="dialog-actions"><button class="primary" type="submit">Jatka</button></div></form>',
      {
        cancel: () => {
          selected = null;
        },
      },
    );
    bindName($('dialog-form'), $('dialog-name'));
  }
  function chooseCourse() {
    close();
    renderLobby();
    $('radat').scrollIntoView({ block: 'nearest' });
    $('course-grid').querySelector('button')?.focus({ preventScroll: true });
    toast('Valitse rata pehmollesi.');
  }
  function editor(initialSection = 'body') {
    profile = store.find(profile.name) ?? profile;
    const { exclusives, aerialExclusives, flowerGifts, dyeSlots, dyes, originalDyes } =
      window.FluffLooks;
    const flowerGiftCourses = new Map(
      Object.entries(flowerGifts).map(([id, sku]) => [
        sku,
        courses.find((course) => course.id === id).title,
      ]),
    );
    const draft = { ...profile.appearance };
    const gifts = profile.unlocked.filter(store.isGift);
    let section = initialSection,
      gearGroup = 'hat',
      preview = null,
      turnFrame = 0,
      drag = null;
    const sections = {
      body: 'Pehmo',
      face: 'Ilme',
      wardrobe: 'Pukimo',
      gear: 'Varusteet',
      item: 'Tavarat',
    };
    if (gifts.length) sections.gifts = 'Lahjat';
    const gearGroups = { hat: 'Hatut', shoes: 'Kengät', wings: 'Siivet' };
    // Camera yaw and elevation in radians. Zero yaw looks straight at the belly.
    const views = {
      body: [0.1, 0.1],
      gifts: [0.22, 0.1],
      face: [0, 0.08],
      patch: [0, 0.05],
      outfit: [0.22, 0.1],
      scarf: [-0.48, 0.13],
      cape: [Math.PI - 0.28, 0.14],
      head: [-0.32, 0.26],
      crown: [0.1, 0.28],
      hat: [-0.18, 0.29],
      shoes: [0.36, 0.09],
      wings: [Math.PI - 0.12, 0.12],
      item: [0.42, 0.12],
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function sectionPart() {
      if (section === 'wardrobe') return 'outfit';
      return section === 'gear' ? gearGroup : section;
    }
    function fittedValue(key) {
      return preview && preview.key === key ? preview.value : (preview?.colors[key] ?? draft[key]);
    }
    function viewFor(key, value = fittedValue(key)) {
      if (key === 'eyeColor') return views.face;
      if (dyeSlots[key]) return viewFor(dyeSlots[key]);
      if (key === 'outfit' && (value === 'scarf' || value === 'cape')) return views[value];
      if (key === 'head' && (value === 'crown' || value === 'rosecrown')) return views.crown;
      return views[key];
    }
    let [yaw, tilt] = viewFor(sectionPart());
    show(
      '<div class="studio-heading"><span class="flag-chip">' +
        icon('bear') +
        '</span><h2 id="modal-title">Pehmopaja</h2><span id="studio-balance"></span></div>' +
        '<div class="atelier"><div class="preview-box"><div class="studio-stage" id="studio-stage" tabindex="0" aria-label="Pehmon 3D-malli. Pyöritä vetämällä tai nuolinäppäimillä."></div>' +
        '<div class="turntable"><button type="button" class="turn" id="turn-left" aria-label="Pyöritä vasemmalle">' +
        icon('turnLeft') +
        '</button><strong>' +
        escape(profile.name) +
        '</strong><button type="button" class="turn" id="turn-right" aria-label="Pyöritä oikealle">' +
        icon('turnRight') +
        '</button></div></div>' +
        '<div class="studio-controls"><div class="studio-tabs" role="group" aria-label="Muokattava ominaisuus">' +
        Object.entries(sections)
          .map(
            ([id, label]) =>
              '<button class="studio-tab" style="flex-basis:auto" data-section="' +
              id +
              '">' +
              label +
              '</button>',
          )
          .join('') +
        '</div>' +
        '<div id="choices" role="region" aria-label="Pehmon valinnat" tabindex="0"></div></div></div><div class="studio-footer"><div class="dialog-actions"><button class="primary" id="save-look">' +
        icon('check') +
        'Tallenna ja jatka</button></div><div id="edit-error" role="alert"></div></div>',
      {
        wide: true,
        cancel: () => {
          stopTurn();
          selected = null;
        },
      },
    );
    const stage = $('studio-stage');
    const choiceList = $('choices');
    function draw() {
      try {
        const size = Math.min(
          720,
          Math.max(270, Math.round(stage.clientWidth * (window.devicePixelRatio || 1))),
        );
        const look = preview ? { ...draft, [preview.key]: preview.value, ...preview.colors } : draft;
        const canvas = plush.render(look, yaw, size, tilt);
        if (canvas.parentNode !== stage) stage.replaceChildren(canvas);
      } catch (err) {
        stage.textContent = err.message;
      }
    }
    function stopTurn() {
      cancelAnimationFrame(turnFrame);
      turnFrame = 0;
    }
    function turnTo([targetYaw, targetTilt]) {
      stopTurn();
      const fromYaw = yaw,
        fromTilt = tilt;
      const delta = Math.atan2(Math.sin(targetYaw - yaw), Math.cos(targetYaw - yaw));
      const distance = Math.max(Math.abs(delta), Math.abs(targetTilt - tilt));
      if (distance < 0.01 || reducedMotion.matches) {
        yaw = targetYaw;
        tilt = targetTilt;
        draw();
        return;
      }
      draw();
      const duration = 180 + 105 * distance;
      const start = performance.now();
      function step(now) {
        turnFrame = 0;
        if (!modal.open || !stage.isConnected) return;
        const t = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (now - start) / duration));
        const eased = t * t * (3 - 2 * t);
        yaw = fromYaw + delta * eased;
        tilt = fromTilt + (targetTilt - fromTilt) * eased;
        draw();
        if (t < 1) turnFrame = requestAnimationFrame(step);
      }
      turnFrame = requestAnimationFrame(step);
    }
    function rotate(modelAngle) {
      stopTurn();
      // Moving the front of the toy to the right orbits the camera to the left.
      yaw -= modelAngle;
      draw();
    }
    $('turn-left').onclick = () => rotate(-Math.PI / 8);
    $('turn-right').onclick = () => rotate(Math.PI / 8);
    stage.onpointerdown = (e) => {
      stopTurn();
      stage.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    stage.onpointermove = (e) => {
      if (drag?.id !== e.pointerId) return;
      yaw -= (e.clientX - drag.x) * 0.012;
      tilt = Math.max(-0.12, Math.min(0.45, tilt + (e.clientY - drag.y) * 0.007));
      drag.x = e.clientX;
      drag.y = e.clientY;
      draw();
    };
    stage.onlostpointercapture = () => {
      drag = null;
    };
    stage.onkeydown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        rotate(e.key === 'ArrowLeft' ? -0.2 : 0.2);
      }
    };
    function giftSource(sku) {
      const course = flowerGiftCourses.get(sku);
      if (course)
        return {
          label: course + ' · yllätyslaatikko',
          hint:
            'Löydät tämän varusteen ensimmäisestä tavallisesta yllätyslaatikosta, jonka avaat radalla ' +
            course +
            '.',
        };
      if (aerialExclusives.includes(sku))
        return {
          label: 'Korkealta siipipaketista',
          hint: 'Löydät tämän varusteen korkealta siipipaketista.',
        };
      if (exclusives.includes(sku))
        return { label: 'Yllätyslaatikosta', hint: 'Löydät tämän varusteen yllätyslaatikosta.' };
      return null;
    }
    function group(key, title, mode = 'text', showLegend = true) {
      const selectedValue = fittedValue(key);
      const colorLabel = mode === 'swatches' && key !== 'color' ? choices[key][selectedValue] : null;
      const legend = colorLabel
        ? title +
          ' <span class="dye-name">· ' +
          escape(Array.isArray(colorLabel) ? colorLabel[0] : colorLabel) +
          '</span>'
        : title;
      return (
        (showLegend
          ? '<fieldset><legend>' + legend + '</legend>'
          : '<fieldset aria-label="' + title + '">') +
        '<div class="choices ' +
        mode +
        '">' +
        Object.entries(choices[key])
          .map(([id, value]) => {
            const label = Array.isArray(value) ? value[0] : value;
            const sku = key + ':' + id;
            const source = giftSource(sku);
            const isLocked = store.isLocked(sku, profile.unlocked);
            const swatch = Array.isArray(value)
              ? value[1]
              : (dyes[id] ??
                (key === 'dye' ? originalDyes[fittedValue('outfit')] : 'var(--original-swatch)'));
            let content = escape(label);
            if (mode === 'swatches') content = selectedValue === id ? icon('check') : '';
            if (mode === 'models' || (mode === 'ornaments' && source))
              content = avatar({ ...draft, [key]: id }) + '<span>' + escape(label) + '</span>';
            if (mode === 'ornaments' && id !== 'none' && !source)
              content =
                '<img alt="" src="assets/details/' +
                (key === 'patch' ? 'belly' : 'head') +
                '-' +
                id +
                '.svg"><span>' +
                escape(label) +
                '</span>';
            if (isLocked)
              content += source
                ? '<small class="box-source">Sovita · ' + escape(source.label) + '</small>'
                : '<small class="star-price">' + icon('badge') + prices[sku] + '</small>';
            return (
              '<button type="button" class="choice ' +
              (mode === 'swatches' ? 'swatch' : '') +
              '" data-group="' +
              key +
              '" data-value="' +
              id +
              '" aria-pressed="' +
              (selectedValue === id) +
              '" aria-label="' +
              escape(label) +
              (isLocked ? ', ' + (source ? 'Sovita · ' + escape(source.label) : badges(prices[sku])) : '') +
              '" title="' +
              escape(label) +
              '"' +
              (mode === 'swatches' ? ' style="--swatch:' + swatch + '"' : '') +
              '>' +
              content +
              '</button>'
            );
          })
          .join('') +
        '</div></fieldset>'
      );
    }
    function dyeRow(field, title) {
      return fittedValue(dyeSlots[field]) === 'none' ? '' : group(field, title, 'swatches');
    }
    function giftChoices() {
      return (
        '<div class="choices models">' +
        gifts
          .map((sku) => {
            const [key, value] = sku.split(':');
            const label = escape(choices[key][value]);
            const equipped = draft[key] === value;
            const action = equipped ? 'Riisu' : 'Pue';
            return (
              '<button type="button" class="choice" data-group="' + key +
              '" data-value="' + value +
              '" aria-pressed="' + equipped +
              '" aria-label="' + action + ' ' + label + '">' +
              avatar({ ...draft, [key]: value }) + '<span>' + label + '</span>' +
              '<small class="gift-action">' + action + '</small></button>'
            );
          })
          .join('') +
        '</div>'
      );
    }
    function update(viewKey, viewValue) {
      for (const tab of body.querySelectorAll('[data-section]'))
        tab.setAttribute('aria-pressed', String(tab.dataset.section === section));
      const offerSlot = (key) => (preview?.key === key ? '<div id="fit-offer"></div>' : '');
      let html;
      if (section === 'body')
        html =
          group('ears', 'Eläin') +
          group('color', 'Turkin väri', 'swatches') +
          '<fieldset class="shape-control"><label for="roundness">Pyöreys <output id="round-result" for="roundness">' +
          draft.roundness +
          ' %</output></label><input id="roundness" type="range" min="0" max="100" value="' +
          draft.roundness +
          '"><div><span>Solakka</span><span>Pallero</span></div></fieldset>';
      else if (section === 'face')
        html = group('face', 'Ilme', 'models') + group('eyeColor', 'Silmien väri', 'swatches');
      else if (section === 'wardrobe')
        html =
          group('outfit', 'Asu') +
          offerSlot('outfit') +
          dyeRow('dye', 'Asun sävy') +
          group('head', 'Pääkoriste', 'ornaments') +
          offerSlot('head') +
          dyeRow('headDye', 'Pääkoristeen väri') +
          group('patch', 'Vatsamerkki', 'ornaments') +
          dyeRow('patchDye', 'Vatsamerkin väri');
      else if (section === 'gear')
        html =
          '<div class="studio-tabs" role="group" aria-label="Varustetyyppi">' +
          Object.entries(gearGroups)
            .map(
              ([id, label]) =>
                '<button type="button" class="studio-tab" data-gear-group="' +
                id +
                '" aria-pressed="' +
                (gearGroup === id) +
                '">' +
                label +
                '</button>',
            )
            .join('') +
          '</div>' +
          group(gearGroup, gearGroups[gearGroup], 'models', false) +
          offerSlot(gearGroup) +
          dyeRow(
            gearGroup + 'Dye',
            { hat: 'Hatun väri', shoes: 'Kenkien väri', wings: 'Siipien väri' }[gearGroup],
          );
      else if (section === 'gifts')
        html = giftChoices();
      else
        html =
          group('item', 'Tassuun', 'models') + offerSlot('item') + dyeRow('itemDye', 'Tavaran väri');
      const scrollTop = choiceList.scrollTop;
      choiceList.innerHTML = html;
      const balanceLabel = badges(profile.stars);
      $('studio-balance').innerHTML =
        '<span class="star-purse" role="img" aria-label="' +
        balanceLabel +
        '" title="' +
        balanceLabel +
        '">' +
        icon('badge') +
        profile.stars +
        '</span>';
      $('save-look').disabled = Boolean(preview);
      if (preview) {
        const offer = $('fit-offer');
        const { key, value } = preview,
          sku = key + ':' + value,
          price = prices[sku];
        const source = giftSource(sku);
        const shortfall = source ? 0 : price - profile.stars;
        offer.innerHTML =
          '<div class="offer-box"><strong>' +
          escape(choices[key][value]) +
          '</strong>' +
          '<p>' +
          (source
            ? escape(source.hint)
            : shortfall > 0
              ? 'Kerää radoilta vielä ' + badges(shortfall) + '.'
              : 'Voit avata tämän pysyvästi pehmollesi.') +
          '</p>' +
          '<div>' +
          (source
            ? ''
            : '<button class="unlock-button" id="unlock" ' +
              (shortfall > 0 ? 'disabled' : '') +
              '>Avaa · ' +
              badges(price) +
              '</button>') +
          '<button class="cancel-fit" id="cancel-fit">Lopeta sovitus</button></div></div>';
        if (!source)
          $('unlock').onclick = () => {
            try {
              profile = store.unlock(profile.name, sku);
              draft[key] = value;
              Object.assign(draft, preview.colors);
              preview = null;
              $('edit-error').textContent = '';
              update();
              $('save-look').focus({ preventScroll: true });
              toast(choices[key][value] + ' avattu!');
            } catch (err) {
              $('edit-error').textContent = err.message;
            }
          };
        $('cancel-fit').onclick = () => {
          preview = null;
          update(key);
          choiceList
            .querySelector('[data-group="' + key + '"][data-value="' + value + '"]')
            ?.focus();
        };
      }

      choiceList.scrollTop = scrollTop;
      if ($('roundness'))
        $('roundness').oninput = (e) => {
          draft.roundness = e.target.valueAsNumber;
          $('round-result').textContent = draft.roundness + ' %';
          draw();
        };
      const view = viewFor(viewKey, viewValue);
      if (view) turnTo(view);
      else draw();
    }
    for (const tab of body.querySelectorAll('[data-section]'))
      tab.onclick = () => {
        preview = null;
        section = tab.dataset.section;
        choiceList.scrollTop = 0;
        $('edit-error').textContent = '';
        update(sectionPart());
      };
    choiceList.onclick = (e) => {
      const gear = e.target.closest('[data-gear-group]');
      if (gear) {
        gearGroup = gear.dataset.gearGroup;
        preview = null;
        choiceList.scrollTop = 0;
        $('edit-error').textContent = '';
        update(gearGroup);
        choiceList
          .querySelector('[data-gear-group="' + gearGroup + '"]')
          .focus();
        return;
      }
      const option = e.target.closest('[data-group]');
      if (!option) return;
      const { group: key, value } = option.dataset;
      const sku = key + ':' + value;
      const previousValue = fittedValue(key);
      if (key === 'ears' && value !== previousValue) sound.effect(value, 0.7);
      if (section === 'gifts') {
        draft[key] = draft[key] === value ? 'none' : value;
      } else if (preview && dyeSlots[key] === preview.key) {
        preview.colors[key] = value;
      } else {
        preview = store.isLocked(sku, profile.unlocked) ? { key, value, colors: {} } : null;
        if (!preview) draft[key] = value;
      }
      $('edit-error').textContent = '';
      update(key, value === 'none' ? previousValue : value);
      choiceList
        .querySelector('[data-group="' + key + '"][data-value="' + value + '"]')
        .focus();
      if (preview) $('fit-offer').scrollIntoView({ block: 'nearest' });
    };
    update();
    $('save-look').onclick = () => {
      try {
        profile = store.look(profile.name, draft);
        stopTurn();
        continueWithProfile();
      } catch (err) {
        $('edit-error').textContent = err.message;
      }
    };
  }
  function renderProfileList(container, list) {
    container.innerHTML = list
      .map(
        (p) =>
          '<button type="button" class="profile-row">' +
          avatar(p.appearance) +
          '<span><strong>' +
          escape(p.name) +
          '</strong><small>' +
          completedCount(p) +
          ' / ' +
          courses.length +
          ' maalirataa läpi</small></span><i>' +
          icon('play') +
          '</i></button>',
      )
      .join('');
    Array.from(container.children).forEach((row, i) => {
      row.onclick = () => {
        try {
          startProfile(list[i].name);
        } catch (err) {
          error(err.message);
        }
      };
    });
  }
  function library(list) {
    const title = selected ? 'Valitse pehmo' : 'Omat pehmot';
    const caption =
      selected?.title ??
      (list.length
        ? 'Valitse pehmo jatkaaksesi sen peliä.'
        : 'Ensimmäinen pehmosi odottaa nimeä ja omia korvia.');
    show(
      '<div class="dialog-mark">' +
        icon('bear') +
        '</div><h2 id="modal-title">' +
        title +
        '</h2><p>' +
        escape(caption) +
        '</p><div class="profile-picker-list" id="profile-list"></div>' +
        '<div class="dialog-actions"><button class="primary" id="new-profile">' +
        icon('plus') +
        'Uusi pehmo</button></div>',
      {
        cancel: () => {
          selected = null;
        },
      },
    );
    renderProfileList($('profile-list'), list);
    $('new-profile').onclick = nameDialog;
  }
  function syncSound() {
    const on = sound.enabled(),
      label = on ? 'Mykistä äänitehosteet' : 'Laita äänitehosteet päälle';
    for (const button of [$('sound'), $('pause-sound')]) {
      if (!button) continue;
      button.innerHTML = icon(on ? 'volume' : 'mute') +
        (button.id === 'pause-sound' ? (on ? 'Tehosteet päällä' : 'Tehosteet pois') : '');
      button.title = label;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(on));
    }
  }
  function toggleSound() {
    sound.toggle();
    syncSound();
    sound.play('click');
  }
  $('sound').onclick = toggleSound;
  let thirdPerson = matchMedia('(pointer: coarse)').matches;
  try {
    const savedCamera = localStorage.getItem('fluff-camera');
    if (savedCamera) thirdPerson = savedCamera === 'follow';
  } catch {}
  function syncControls() {
    const music = sound.musicEnabled();
    const musicLabel = music ? 'Mykistä musiikki' : 'Laita musiikki päälle';
    for (const id of ['music', 'pause-music']) {
      const button = $(id);
      if (!button) continue;
      button.innerHTML =
        icon('music') + (id === 'pause-music' ? (music ? 'Musiikki päällä' : 'Musiikki pois') : '');
      button.setAttribute('aria-label', musicLabel);
      button.setAttribute('aria-pressed', String(music));
      button.title = musicLabel + ' (M)';
    }
    for (const id of ['camera', 'pause-camera']) {
      const button = $(id);
      if (!button) continue;
      const label = thirdPerson ? 'Vaihda pehmon silmiin' : 'Vaihda pehmon taakse';
      button.innerHTML =
        icon('camera') +
        (id === 'pause-camera' ? (thirdPerson ? 'Pehmon takaa' : 'Pehmon silmin') : '');
      button.setAttribute('aria-label', label);
      button.title = label + ' (V)';
      button.setAttribute('aria-pressed', String(thirdPerson));
    }
    $('play-screen').classList.toggle('follow-view', thirdPerson);
    const petals = $('pause-petals');
    if (petals) {
      const on = window.FluffPetalRain.enabled();
      petals.innerHTML = icon('petal') + (on ? 'Terälehtisade päällä' : 'Terälehtisade pois');
      petals.setAttribute('aria-label', 'Terälehtisade');
      petals.setAttribute('aria-pressed', String(on));
    }
  }
  function toggleMusic() {
    sound.toggleMusic();
    syncControls();
  }
  function toggleCamera() {
    thirdPerson = !thirdPerson;
    if (game) {
      game.world.thirdPerson = thirdPerson;
      game.world.resetCamera();
    }
    try {
      localStorage.setItem('fluff-camera', thirdPerson ? 'follow' : 'eyes');
    } catch {}
    syncControls();
  }
  $('music').onclick = toggleMusic;
  $('camera').onclick = toggleCamera;
  $('plush-nav').onclick = () => {
    selected = null;
    library(store.list());
  };
  $('home-nav').onclick = () => {
    selected = null;
    close();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  $('help').onclick = () => {
    show(
      '<div class="dialog-mark">' +
        icon('book') +
        '</div><h2 id="modal-title">Peliohjeet</h2><p>Aloitat uuden pelin kolmella elämällä. Putoaminen tai törmäys vie yhden elämän. Voit jatkaa viimeiseltä välilipulta niin kauan kuin elämiä riittää.</p>' +
        '<p>Kosketa leijuvia tassumerkkejä. Tavallisilla radoilla saat merkkejä myös paketeista. ' +
        lifeRule +
        ' Kun astut maalista portaaliin, elämät ja seuraavaa lisäelämää varten kertyneet merkit siirtyvät mukanasi. Kaikki tassumerkit kertyvät pehmosi kukkaroon. Voit avata niillä varusteita Pehmopajassa.</p>' +
        '<p>Kosketa rusettipakettia avataksesi sen. Sisältä voi löytyä tassumerkkejä tai uusi varuste. Tavallisilla radoilla lisäelämä on harvinainen pakettipalkinto. Täysillä elämillä saat elämäpalkinnosta tassumerkkejä. Pue löydetyt varusteet Pehmopajan Lahjat-välilehdeltä.</p>' +
        '<p>Pilvivaelluksella pehmon vauhti kasvaa matkan varrella. ' + endlessLifeRule +
        ' Paketeista saadut merkit menevät suoraan kukkaroon.</p>' +
        '<p>Anna pupun tassutella sivuun tai hyppää sen yli. Kun pörriäinen nousee korkealle, voit juosta sen alta. Kulje verhon ali vihreällä valolla ja tähtää karkkipuomin liikkuvaan aukkoon.</p>' +
        '<p>Putoava laatta heilahtaa, kun laskeudut sille. Hyppää pois ennen kuin laatta putoaa. Laskeudu keikkuvan laudan keskelle ja ohjaa takaisin keskelle, jos alat liukua. Ajoita hyppysi esteiden yli.</p>' +
        '<p>Voit kävellä suoraan portaille. Jokainen askelma kantaa viisi sekuntia. Saat uudet viisi sekuntia, kun astut sille uudelleen. Pudonnut askelma palaa pian paikalleen. Huipulta pääset sateenkaariliukuun. Jos liu’un jälkeen on väli, hyppää reunalta seuraavalle tyynylle.</p>' +
        '<p>Välilyönnin tai Hyppää-painikkeen näpäytys riittää hyppyyn. Pehmo jatkaa ilmassa ponnistussuuntaan, ja voit ohjata sitä kohti laskeutumispaikkaa. Toinen näpäytys ilmassa tekee pyörähdyshypyn. Sillä yllät siipipakettiin, josta saat varusteen tai molemmat varusteet löydettyäsi kuusi tassumerkkiä.</p>' +
        '<p>Kamera seuraa rataa myös sivuttain liikkuessa. Kun lopetat ympärille katselun, kamera palaa reitille.</p>' +
        '<div class="control-list"><div><strong>Liiku</strong><span><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></span></div><div><strong>Katso ympärillesi</strong><span>Pidä hiiren vasen painike pohjassa tai käytä <kbd>←</kbd> <kbd>→</kbd></span></div><div><strong>Hyppää</strong><kbd>Välilyönti</kbd></div><div><strong>Vaihda kuvakulmaa</strong><kbd>V</kbd></div><div><strong>Juttele kyläläiselle</strong><kbd>T</kbd></div><div><strong>Musiikki päälle / pois</strong><kbd>M</kbd></div><div><strong>Tauko</strong><span><kbd>Esc</kbd> / <kbd>P</kbd></span></div></div>' +
        '<p class="note touch-help">Pienellä vedolla hiivit ja pidemmällä juokset. Katsele ympärillesi vetämällä sormea näytön oikealla puolella. Napauta hypätäksesi. Toinen napautus ilmassa tekee pyörähdyshypyn.</p>' +
        '<p class="note">Napauta kyläläisen puhekuplaa, kun haluat jutella. Samalla nimellä löydät pehmosi ja sen parhaat rata-ajat tästä selaimesta.</p><div class="dialog-actions"><button class="primary" id="help-ok">Selvä!</button></div>',
    );
    $('help-ok').onclick = close;
  };
  function ready() {
    const c = selected,
      best = profile.completed[raceKey(c)],
      shortBest = profile.completed[c.id];
    show(
      '<img class="dialog-banner" src="assets/' +
        c.id +
        '.webp" alt="">' +
        levelBadge(c) +
        '<h2 id="modal-title">' +
        c.title +
        '</h2><p>' +
        c.description +
        '</p><p class="note">' +
        'Aloitat kolmella elämällä. ' +
        (c.endless
          ? endlessLifeRule + ' Pakettien merkit menevät kukkaroon. Vauhti kasvaa radan edetessä.'
          : lifeRule + ' Maalilaatan portaalista pääset seuraavalle radalle.') +
        '</p><div class="stat-line"><span>Pehmo</span><strong>' +
        escape(profile.name) +
        '</strong></div>' +
        (c.endless
          ? '<div class="stat-line"><span>Oma ennätys</span><strong>' +
            jumps(profile.endlessBest) +
            '</strong></div>'
          : '<div class="stat-line"><span>Tyynyjä</span><strong>' + c.path.length + '</strong></div>') +
        (best !== undefined
          ? '<div class="stat-line"><span>Oma ennätys</span><strong>' + time(best) + '</strong></div>'
          : '') +
        previousResults(profile, c)
          .map(
            ({ seconds, label }) =>
              '<div class="stat-line"><span>' +
              label +
              '</span><strong>' +
              time(seconds) +
              '</strong></div>',
          )
          .join('') +
        (shortBest !== undefined
          ? '<div class="stat-line"><span>Lyhyen radan ennätys</span><strong>' +
            time(shortBest) +
            '</strong></div>'
          : '') +
        '<p class="note"><kbd>WASD</kbd> liiku · <kbd>Välilyönti</kbd> hyppää · <kbd>V</kbd> kuvakulma</p><div class="dialog-actions"><button id="launch" class="primary">' +
        icon('play') +
        'Radalle</button></div>',
      {
        cancel: () => {
          selected = null;
        },
      },
    );
    $('launch').onclick = startGame;
  }
  function lobby() {
    if (game?.state && game.mode !== 'idle' && hasUnsavedProgress(game.state)) {
      try {
        saveProgress();
      } catch (err) {
        overlay(
          'Edistymisen tallennus keskeytyi',
          escape(err.message),
          [
            ['Yritä uudelleen', lobby],
            ['Poistu tallentamatta', leaveCourse],
          ],
          'badge',
          lobby,
        );
        return;
      }
    }
    leaveCourse();
  }
  function leaveCourse() {
    window.FluffPortalTravel.cancel();
    game?.stop();
    close();
    resetVillageChat();
    $('play-screen').hidden = true;
    document.body.style.overflow = '';
    selected = null;
    renderLobby();
    $('home-nav').focus({ preventScroll: true });
  }
  function overlay(title, copy, buttons, mark, actionOnClose) {
    show(
      '<div class="dialog-mark">' +
        icon(mark) +
        '</div><h2 id="modal-title">' +
        title +
        '</h2><p>' +
        copy +
        '</p><div class="dialog-actions">' +
        buttons
          .map(
            (b, i) =>
              '<button id="action-' +
              i +
              '" class="' +
              (i ? 'secondary' : 'primary') +
              '">' +
              b[0] +
              '</button>',
          )
          .join('') +
        '</div>',
      { cancel: actionOnClose },
    );
    buttons.forEach((b, i) => ($('action-' + i).onclick = b[1]));
  }
  function resume() {
    close();
    game.resume();
  }
  function resetVillageChat() {
    window.FluffSkyFriends.hide();
    nearbyVillager = null;
    villageTalk.hidden = true;
    villageGreeting.textContent = '';
    greetedVillagers.clear();
    window.FluffVillageChat.reset();
  }
  function updateVillagePrompt(state, pads) {
    const world = game.world;
    const { width, height } = world.view;
    const villager = window.FluffVillage.nearby(game.course, pads, state, world);
    const point = villager?.point;
    const changed = villager?.id !== nearbyVillager?.id;
    nearbyVillager = villager;
    if (!point) {
      villageTalk.hidden = true;
      if (villageGreeting.textContent) villageGreeting.textContent = '';
      return;
    }
    const entering = changed || villageTalk.hidden;
    if (entering) {
      $('village-name').textContent = villager.name;
      villageHello.textContent = 'Hei, ' + profile.name + '!';
      villageTalk.setAttribute('aria-label', 'Avaa keskustelu – ' + villager.name);
    }
    villageTalk.hidden = false;
    const gap = 12 + 0.38 * villager.scale * point.scale;
    const w = villageTalk.offsetWidth,
      h = villageTalk.offsetHeight;
    let right = entering ? point.x < width / 2 : villageTalk.dataset.tail === 'left';
    const room = right ? width - point.x : point.x;
    if (room < w + gap + 5 && width - room > room + 12) right = !right;
    const left = Math.max(5, Math.min(width - w - 5, right ? point.x + gap : point.x - gap - w));
    const top = Math.max(5, Math.min(height - h - 5, point.y - h / 2));
    const tail = right ? 'left' : 'right';
    if (villageTalk.dataset.tail !== tail) villageTalk.dataset.tail = tail;
    villageTalk.style.transform = 'translate(' + left.toFixed(1) + 'px,' + top.toFixed(1) + 'px)';
    villageTalk.style.setProperty('--tail-y', Math.max(13, Math.min(h - 13, point.y - top)) + 'px');
    if (!greetedVillagers.has(villager.id)) {
      greetedVillagers.add(villager.id);
      villageGreeting.textContent = villageHello.textContent + ' Täällä ' + villager.name + '.';
    }
  }
  function frameSpeaker(chat, speaker) {
    const stage = chat.querySelector('.village-chat-stage');
    const speech = chat.querySelector('.village-speech');
    const draw = () => {
      if (!modal.open || !chat.isConnected || game.mode !== 'paused') return;
      const area = stage.getBoundingClientRect(),
        bubble = speech.getBoundingClientRect();
      const canvas = game.canvas.getBoundingClientRect();
      if (area.height < 1 || bubble.width < 1 || !canvas.height) return;
      const available = bubble.left - area.left;
      const scale = Math.max(
        1,
        Math.min(
          170,
          (available - 24) / (1.65 * speaker.scale),
          (area.height - 20) / (1.85 * speaker.scale),
        ),
      );
      game.draw({
        speaker,
        scale,
        x: bubble.left - canvas.left - 14 - scale * speaker.scale * 0.5,
        y: bubble.top + bubble.height / 2 - canvas.top,
      });
    };
    const layout = new ResizeObserver(draw);
    for (const node of [stage, speech, game.canvas]) layout.observe(node);
    modal.addEventListener('scroll', draw, { passive: true });
    stopFramingSpeaker = () => {
      layout.disconnect();
      modal.removeEventListener('scroll', draw);
      stopFramingSpeaker = null;
    };
    draw();
  }
  function talkToVillager() {
    if (!nearbyVillager || game?.mode !== 'running') return false;
    villagerToTalk = nearbyVillager;
    game.pause();
    return true;
  }
  function paused() {
    window.FluffSkyFriends.hide();
    villageTalk.hidden = true;
    if (villagerToTalk) {
      const villager = villagerToTalk;
      villagerToTalk = null;
      const chat = window.FluffVillageChat.open(villager, profile.name, selected.title);
      show(chat, { cancel: resume });
      frameSpeaker(chat, villager);
      chat.querySelector('.village-chat-close').onclick = dismiss;
      return;
    }
    overlay(
      'Hengähdystauko',
      escape(profile.name) +
        ' odottaa radalla ' +
        selected.title +
        '. ' +
        lifeHint(game.state),
      [
        ['Jatka peliä', resume],
        ['Peliaulaan', lobby],
      ],
      'pause',
      resume,
    );
    const toggles = document.createElement('div');
    toggles.className = 'pause-settings';
    toggles.innerHTML =
      '<button id="pause-camera" type="button"></button><button id="pause-music" type="button"></button>' +
      '<button id="pause-sound" type="button"></button><button id="pause-petals" type="button"></button>';
    body.querySelector('.dialog-actions').before(toggles);
    $('pause-camera').onclick = toggleCamera;
    $('pause-music').onclick = toggleMusic;
    $('pause-sound').onclick = toggleSound;
    $('pause-petals').onclick = () => {
      window.FluffPetalRain.toggle();
      syncControls();
      game.draw();
      window.FluffSkyFriends.hide();
    };
    syncSound();
    syncControls();
  }
  let creditedStars = 0,
    displayedStars = -1,
    displayedLives = -1,
    retryRewardsAt = 0,
    shownGifts = 0;
  function lifeHint(state) {
    const remaining = badges(state.lifeGoal - state.lifeProgress);
    if (state.lives === maxLives)
      return 'Kaikki kolme elämää ovat tallella. Seuraavaan rajaan tarvitaan vielä ' + remaining + '.';
    return 'Lisäelämään tarvitaan vielä ' + remaining + '.';
  }
  function lives(n) {
    return n + (n === 1 ? ' elämä' : ' elämää');
  }
  function newFinishTime(s) {
    return s.finishTime !== null && s.finishTime < (profile.completed[raceKey(selected)] ?? Infinity);
  }
  function hasUnsavedProgress(s) {
    return s.stars > creditedStars || s.loot.pendingItems.length > 0 || newFinishTime(s);
  }
  function saveProgress() {
    const pending = game.state.loot.pendingItems;
    while (pending.length) {
      profile = store.grantExclusive(profile.name, pending[0]);
      pending.shift();
    }
    while (creditedStars < game.state.stars) {
      profile = store.collectStar(profile.name);
      creditedStars++;
    }
    if (newFinishTime(game.state))
      profile = store.finish(profile.name, raceKey(selected), game.state.finishTime);
  }
  let bestAtStart = 0,
    recordWarning = false;
  function saveDistance(count) {
    if (count > profile.endlessBest) profile = store.recordEndless(profile.name, count);
  }
  function finishEndless(outcome) {
    const score = game.state.furthest;
    function save() {
      try {
        saveProgress();
        saveDistance(score);
      } catch (err) {
        overlay(
          'Tallennus keskeytyi',
          escape(err.message),
          [
            ['Yritä tallentaa', save],
            ['Peliaulaan', lobby],
          ],
          'save',
          lobby,
        );
        return;
      }
      const reason = outcome === 'bump' ? 'Pehmo osui esteeseen.' : 'Pehmo putosi pilviltä.';
      const result =
        reason +
        ' Viimeinen elämä kului. Tulos <strong>' +
        jumps(score) +
        '</strong> · Oma ennätys <strong>' +
        jumps(profile.endlessBest) +
        '</strong>.</p><p>Keräsit <strong>' +
        badges(game.state.stars) +
        '</strong>. Pehmollasi on nyt ' +
        badges(profile.stars) +
        '.';
      overlay(
        score > bestAtStart ? 'Peli päättyi – uusi hyppyennätys!' : 'Peli päättyi',
        result,
        [
          ['Uusi vaellus', startGame],
          [
            'Pehmopajaan',
            () => {
              leaveCourse();
              editor('wardrobe');
            },
          ],
          ['Peliaulaan', lobby],
        ],
        'infinity',
        lobby,
      );
    }
    save();
  }
  const encounterTips = {
    ball: 'Hyppää pallorivin yli, kun se vierii kohti.',
    hurdle: 'Ponnista juuri ennen matalaa poikkipuomia.',
    pendulum: 'Hyppää keinuvan poikkitangon yli, kun se on alhaalla.',
    sweeper: 'Katso, miten pitkä pehmopuomi liikkuu, ja ajoita hyppy sen yli.',
    bee: 'Pörriäinen käy välillä korkealla. Odota alustan alkupäässä ja juokse sen alta.',
    bun: 'Odota, että pupu tassuttelee sivuun, tai ponnista sen yli.',
    moth: 'Seuraa kuukoin kaarrosta. Juokse sen alta, kun siivet nousevat.',
    hedgehog: 'Siili käpertyy ennen kierähdystä. Hyppää yli tai odota, että se menee ohi.',
    shutter: 'Pysähdy verhon eteen. Kun valo on vihreä ja verho ylhäällä, juokse ali.',
    hoops: 'Tähtää liikkuvaan aukkoon tai hyppää matalan karkkipuomin yli.',
    jumpRope: 'Hyppää narun yli, kun se pyyhkäisee sinua kohti.',
    zipperGate: 'Seuraa tilkkuseinän aukkoa ja pujota pehmo siitä läpi.',
    pillowPress: 'Juokse leimasimen ali vihreällä. Keltainen valo varoittaa painalluksesta.',
    ropeGate: 'Tähtää liikkuvaan aukkoon jo ponnistaessa. Hyppää narun yli portista läpi!',
    gatePress: 'Pujahda aukosta. Portin ja leimasimen välissä voit odottaa vihreää valoa.',
  };
  const introducedHazards = new Set();
  function finished(outcome, seconds) {
    window.FluffSkyFriends.hide();
    villageTalk.hidden = true;
    if (outcome !== 'win') {
      const s = game.state;
      sound.play('fall');
      if (s.lives > 0) {
        const from =
          s.finishTime !== null ? 'maalilaatalta' : s.checkpoint ? 'välilipulta' : 'lähtötyynyltä';
        const advice =
          outcome === 'bump' ? encounterTips[s.lastHazard] : 'Voit ponnistaa uudelleen ' + from + '.';
        overlay(
          outcome === 'bump' ? 'Pehmo törmäsi!' : 'Pehmo putosi!',
          'Jäljellä on <strong>' + lives(s.lives) + '</strong>. ' + advice,
          [
            [
              'Jatka ' + from,
              () => {
                close();
                game.retry();
              },
            ],
            ['Peliaulaan', lobby],
          ],
          'paw',
          lobby,
        );
      } else if (selected.endless) {
        finishEndless(outcome);
      } else {
        function restart() {
          try {
            saveProgress();
          } catch (err) {
            toast(err.message);
            return;
          }
          startGame();
        }
        overlay(
          'Peli päättyi',
          'Viimeinen elämä kului radalla ' + selected.title + '. Keräsit ' + badges(s.stars) + '.',
          [
            ['Uusi yritys', restart],
            ['Peliaulaan', lobby],
          ],
          'flag',
          lobby,
        );
      }
      return;
    }
    function save() {
      try {
        saveProgress();
      } catch (err) {
        game.release();
        overlay(
          'Tallennus keskeytyi',
          escape(err.message),
          [
            ['Yritä tallentaa', save],
            ['Peliaulaan', lobby],
          ],
          'save',
          lobby,
        );
        return;
      }
      const result =
        selected.title +
        ' maalissa · ' +
        time(seconds) +
        ' · Oma ennätys ' +
        time(profile.completed[raceKey(selected)]) +
        ' · Yllätyslaatikoita ' +
        game.state.loot.opened +
        '/' +
        selected.gifts.length;
      const destination = window.FluffCourses.nextCourse(selected);
      const carry = { lives: game.state.lives, lifeProgress: game.state.lifeProgress };
      const pads = window.FluffCourses.platforms(game.course, game.state.time);
      const portal = window.FluffCourses.finishPortal(pads.at(-1));
      const point = game.world.project([portal.x, portal.y, portal.z]);
      const { width, height } = game.world.view;
      const origin = {
        x: point ? Math.max(0.15, Math.min(0.85, point.x / width)) : 0.5,
        y: point ? Math.max(0.15, Math.min(0.85, point.y / height)) : 0.5,
      };
      close();
      sound.effect('portal');
      window.FluffPortalTravel.play(selected, destination, origin, () => {
        selected = destination;
        launchCourse(carry, true);
      }, () => {
        if (game.mode !== 'transferring') return;
        game.resume();
        if (document.hidden || !document.hasFocus()) game.pause();
        toast(selected.endless ? result + ' · ' + lifeHint(game.state) : result);
      });
    }
    save();
  }
  let oldTime = '',
    meterPad = -1,
    oldStep = -1;
  function frame(s, pads) {
    const footing = s.grounded === null ? null : pads[s.grounded - (game.course.firstIndex || 0)];
    const rideStatus = $('ride-status');
    const rideMessage =
      s.finishTime !== null
        ? 'Astu portaaliin → ' + game.world.destination.title
        : footing?.kind === 'stairs'
          ? 'Askelma putoaa · ' + window.FluffSkyRides.secondsLeft(footing, s.z, s.time) + ' s'
          : footing?.kind === 'slide'
            ? footing.slide?.through || footing.z + footing.d / 2 - s.z > 5
              ? 'Sateenkaariliuku'
              : 'Hyppää seuraavalle tyynylle'
            : footing?.kind === 'tower-roof'
              ? 'Sateenkaariliuku katon toisella laidalla'
              : footing && game.course.gifts.some((gift) => gift.aerial && gift.at === footing.index)
                ? 'Siipipaketti · hyppää kahdesti'
                : '';
    if (rideStatus.textContent !== rideMessage) {
      rideStatus.textContent = rideMessage;
      rideStatus.hidden = !rideMessage;
    }
    updateVillagePrompt(s, pads);
    window.FluffSkyFriends.voice(s);
    const openedGift = s.loot.opened > shownGifts;
    if (openedGift) {
      const reward = s.lastGift;
      const banner = $('gift-reveal');
      if (reward.kind === 'item') {
        const [group, id] = reward.sku.split(':');
        $('gift-name').textContent = choices[group][id];
        $('gift-detail').textContent = 'Pue Pehmopajan Lahjat-välilehdellä';
      } else if (reward.kind === 'life') {
        $('gift-name').textContent = 'Lisäelämä!';
        $('gift-detail').textContent = 'Pehmollasi on nyt ' + lives(s.lives);
      } else {
        $('gift-name').textContent = '+' + badges(reward.count);
        $('gift-detail').textContent = reward.bonusLife
          ? 'Kymmenen täynnä – sait myös lisäelämän!'
          : 'Merkit lisättiin kukkaroon';
      }
      sound.play('gift');
      banner.hidden = false;
      shownGifts = s.loot.opened;
    } else if (!$('gift-reveal').hidden && (!s.lastGift || s.time - s.lastGift.time > 4)) {
      $('gift-reveal').hidden = true;
    }
    const seconds = Math.floor(s.finishTime ?? s.time),
      t = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
    if (t !== oldTime) {
      $('hud-time').textContent = t;
      oldTime = t;
    }
    const livesChanged = s.lives !== displayedLives;
    const starsChanged = s.stars !== displayedStars;
    if (livesChanged) {
      $('hud-life-count').textContent = s.lives + '/' + maxLives;
      $('hud-lives').setAttribute('aria-label', 'Elämiä jäljellä ' + s.lives + '/' + maxLives);
      displayedLives = s.lives;
    }
    if (starsChanged || livesChanged) {
      const hint = lifeHint(s);
      $('hud-stars').setAttribute('aria-label', 'Kerätty ' + badges(s.stars) + '. ' + hint);
      $('hud-stars').title = hint;
    }
    if (starsChanged) {
      $('hud-star-count').textContent = s.stars;
      if (displayedStars >= 0 && !openedGift) {
        const extra = s.lastStar?.bonusLife;
        sound.play(extra ? 'life' : 'star');
        if (extra) toast('Lisäelämä! Nyt sinulla on ' + lives(s.lives) + '.');
      }
      displayedStars = s.stars;
    }
    if (hasUnsavedProgress(s) && performance.now() >= retryRewardsAt) {
      try {
        saveProgress();
      } catch (err) {
        toast(err.message);
        retryRewardsAt = performance.now() + 2500;
      }
    }
    if (s.furthest !== oldStep) {
      if (selected.endless) {
        try {
          saveDistance(s.furthest);
        } catch (err) {
          if (!recordWarning) {
            toast(err.message);
            recordWarning = true;
          }
        }
        $('hud-step').textContent = jumps(s.furthest);
        const pace = Math.round(100 * window.FluffGame.speedMultiplier(game.course, s.furthest));
        $('hud-best').textContent = 'Ennätys ' + jumps(profile.endlessBest) + ' · Vauhti ' + pace + ' %';
      } else {
        const count = selected.path.length;
        $('hud-step').textContent =
          s.finishTime === null
            ? 'Tyyny ' + (s.furthest + 1) + ' / ' + count
            : 'Maalissa · ' + time(s.finishTime);
        $('hud-fill').style.width = ((s.furthest + 1) / count) * 100 + '%';
      }
      const next = game.course.hazards.find((h) => h.at === s.furthest + 1);
      const nextPad = pads[s.furthest + 1 - (game.course.firstIndex || 0)];
      if (
        game.course.gifts.some((g) => g.aerial && g.at === s.furthest) &&
        !introducedHazards.has('aerial')
      ) {
        introducedHazards.add('aerial');
        toast('Siipipaketti! Hyppää sen alle ja paina hyppyä uudelleen ilmassa.');
      } else if (
        next && !introducedHazards.has(next.type) &&
        (s.checkpoint !== s.furthest || window.FluffObstacles.combinations.includes(next.type))
      ) {
        introducedHazards.add(next.type);
        toast(encounterTips[next.type]);
      } else if (nextPad?.kind === 'gust' && !introducedHazards.has('gust')) {
        introducedHazards.add('gust');
        toast('Puhurilaatta! Katso tuulipussia ja ohjaa pehmoa puuskaa vastaan.');
      }
      oldStep = s.furthest;
    }
    if (selected.endless && s.grounded !== null && meterPad !== s.grounded) {
      const nextFlag = game.course.checkpoints.find((i) => i > s.checkpoint);
      const progress = nextFlag
        ? Math.max(0, s.grounded - s.checkpoint) / (nextFlag - s.checkpoint)
        : 0;
      $('hud-fill').style.width = Math.min(100, progress * 100) + '%';
      meterPad = s.grounded;
    }
  }
  function startGame() {
    launchCourse(null);
  }
  function launchCourse(carry, waitForArrival = false) {
    clearTimeout(toastTimer);
    $('toast').classList.remove('shown');
    close();
    resetVillageChat();
    $('play-screen').hidden = false;
    document.body.style.overflow = 'hidden';
    oldTime = '';
    oldStep = -1;
    meterPad = -1;
    creditedStars = 0;
    displayedStars = -1;
    displayedLives = -1;
    shownGifts = 0;
    $('gift-reveal').hidden = true;
    retryRewardsAt = 0;
    bestAtStart = profile.endlessBest;
    recordWarning = false;
    $('hud-best').hidden = !selected.endless;
    $('hud-bar').title = selected.endless ? 'Matka seuraavalle välilipulle' : 'Matka maaliin';
    $('hud-title').textContent = selected.title;
    $('hud-player').textContent = profile.name;
    try {
      if (!game)
        game = new window.FluffGame($('world'), {
          camera: toggleCamera,
          music: toggleMusic,
          pause: paused,
          end: finished,
          frame,
          error,
          checkpoint: () => toast('Välilippu saavutettu!'),
        });
      game.world.thirdPerson = thirdPerson;
      game.world.look = profile.appearance;
      game.start(selected, carry, profile.unlocked, waitForArrival);
    } catch (err) {
      lobby();
      error(err.message);
    }
  }
  $('pause').onclick = () => game?.pause();
  $('play-screen').addEventListener('contextmenu', (event) => event.preventDefault());
  $('play-screen').addEventListener('dragstart', (event) => event.preventDefault());
  villageTalk.onclick = talkToVillager;
  $('world').addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || document.pointerLockElement !== game?.canvas || villageTalk.hidden)
      return;
    const bubble = villageTalk.getBoundingClientRect();
    const canvas = game.canvas.getBoundingClientRect();
    const x = canvas.left + canvas.width / 2,
      y = canvas.top + canvas.height / 2;
    if (
      x >= bubble.left &&
      x <= bubble.right &&
      y >= bubble.top &&
      y <= bubble.bottom &&
      talkToVillager()
    )
      event.preventDefault();
  });
  window.addEventListener('keydown', (event) => {
    if (
      event.code !== 'KeyT' ||
      event.repeat ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (talkToVillager()) event.preventDefault();
  });
  document.addEventListener('click', (ev) => {
    const button = ev.target.closest('button');
    if (button && !button.matches('#sound, #pause-sound, #touch-jump, [data-group="ears"]')) sound.play('click');
  });
  renderLobby();
  syncSound();
  syncControls();
})();
