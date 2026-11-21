(() => {
  'use strict';
  function cloudTower() {
    const tower = { z: 20, roof: 22.85, radius: 7.05 };
    const orbit = 11.4, segments = 15;
    const visitors = ['bee', 'bun', 'moth', 'hedgehog'];
    const path = [[0, 0, 0, 7.2, 6.2], [0, 4.7, 0.32, 4.8, 4.2]];
    const checkpoints = [], hazards = [], gifts = [], stars = [];
    for (let i = 0; i <= 2 * segments; i++) {
      const angle = (i / segments - 0.25) * 2 * Math.PI;
      const at = path.length;
      const balcony = i % 5 === 0;
      const kind = balcony ? null : i % 5 === 2 ? 'crumble' : i % 5 === 4 ? 'tilt' : null;
      path.push([
        orbit * Math.cos(angle), tower.z + orbit * Math.sin(angle), 0.9 + i * 0.685,
        balcony ? 5.15 : 4.0, balcony ? 5.15 : 4.0, 0, kind,
      ]);
      if (balcony) {
        checkpoints.push(at);
        if (i % 10 === 5) gifts.push({ at, dx: 0, dz: 0 });
      } else if (i % 5 === 3) {
        hazards.push({ at, type: visitors[Math.floor(i / 5) % visitors.length] });
      } else if (i % 5 === 1 || i % 5 === 4) {
        stars.push({ at, dx: 0, dz: 0 });
      }
    }
    // The two turns end above the original entrance. The bridge leads through the south gate.
    path.push([0, 12.55, 22.12, 5.5, 4.5], [0, tower.z, tower.roof, 13.4, 13.4, 0, 'tower-roof']);
    checkpoints.push(path.length - 1);
    const start = tower.z + 5.86, length = 56, base = 0.65;
    const descent = { drop: tower.roof - base + 0.028, curve: 0.52, through: true };
    path.push(
      [0, start + length / 2, base, 5.6, length, 0, 'slide', descent],
      [0, start + length + 3.3, base + 0.018, 8.6, 7.2],
    );
    return {
      id: 'tower',
      title: 'Pilvilinnan torni',
      difficulty: 'Keskitaso',
      raceVersion: '-v7',
      caption: 'Kiipeä katolle ja laske sateenkaarta maaliin.',
      description:
        'Kierrä tornin ympäri kahdesti ja hyppää kattotasanteelle. Katolta lähtee 56 metrin sateenkaariliuku, jonka juurella odottaa maaliportaali.',
      sky: ['#937dbb', '#d5bdde', '#ffdac5'],
      fog: '#e4cedf',
      fabric: ['#a3dacf', '#ffd5ae', '#c7a7e2', '#edadba'],
      side: '#a281b3',
      tower: { ...tower, descent },
      path, checkpoints, hazards, stars, gifts,
    };
  }
  const courses = [
    {
      id: 'cloud',
      petalTheme: 'blue',
      title: 'Pilvipolku',
      difficulty: 'Helppo',
      caption: 'Pumpulipilviä ja pehmeitä esteitä.',
      description:
        'Tervehdi pilvikylän asukkaita ja kiipeä valopisteillä kirjottuja portaita. Huipulta pääset laskemaan sateenkaarta pitkin.',
      sky: ['#8cd9e9', '#e0f6eb', '#d5c1e8'],
      fog: '#d7ebec',
      fabric: ['#96d6ae', '#ffe5af', '#a6deda', '#f6d8c2'],
      side: '#9c7fba',
      path: [
        [0, 0, 0, 5.5, 6],
        [0, 6.15, 0.05, 4.3, 4],
        [-1.3, 11.4, 0.19, 4.1, 3.9],
        [-2.4, 19.9, 0.34, 4.6, 10.2],
        [-0.6, 28.15, 0.27, 4, 3.8],
        [1.5, 33.55, 0.48, 4, 4, 0, 'crumble'],
        [2.4, 42.05, 0.58, 4.8, 10.2],
        [1.7, 50.65, 0.44, 3.9, 3.7, 0.5],
        [0.2, 56.15, 0.5, 5.2, 4.8],
        [-1.8, 61.8, 0.63, 4.1, 3.7],
        [-2.1, 70.35, 0.77, 4.6, 10.2],
        [-0.2, 78.95, 0.62, 3.8, 3.9, 0.55],
        [1.8, 84.1, 0.7, 4.1, 3.8, 0, 'tilt'],
        [2.2, 92.65, 0.94, 4.6, 10.2],
        [0.1, 101.05, 0.85, 3.9, 3.7],
        [-1.7, 106.5, 0.98, 4, 3.9, 0.45],
        [-1.1, 114.8, 1.12, 4.7, 9.7],
        [0, 123.75, 1.05, 5.5, 5],
      ],
      checkpoints: [8],
      gifts: [
        { at: 2, dx: 0, dz: 0 },
        { at: 8, dx: -0.4, dz: 0.5 },
        { at: 15, dx: 0, dz: 0 },
      ],
      stars: [
        { at: 1, dx: 0, dz: 0 },
        { at: 7, dx: 0.25, dz: 0.3 },
        { at: 4, dx: -0.35, dz: 0.25 },
        { at: 9, dx: 0.3, dz: 0 },
        { at: 14, dx: 0.2, dz: -0.3 },
        { at: 16, dx: -0.25, dz: 3.25 },
        { at: 3, dx: 0.2, dz: 3.1 },
        { at: 6, dx: -0.32, dz: 3.1 },
        { at: 10, dx: 0.3, dz: 3.1 },
        { at: 13, dx: -0.18, dz: 3.1 },
      ],
      hazards: [
        { at: 3, type: 'bun' },
        { at: 6, type: 'hurdle', amplitude: 0, rate: 1.15 },
        { at: 10, type: 'bee' },
        { at: 13, type: 'hoops' },
        { at: 16, type: 'jumpRope' },
      ],
    },
    {
      id: 'candy',
      petalTheme: 'pink',
      title: 'Herkkulaakso',
      difficulty: 'Keskitaso',
      caption: 'Keinuvia tyynyjä ja karkkihyppyjä.',
      description:
        'Seuraa pörriäisen lentoa ja etsi liikkuva aukko karkkipuomista. Viimeisellä suoralla verho nousee juuri sen verran, että ehdit juosta ali.',
      sky: ['#eba7cb', '#ffe4d4', '#efc3dc'],
      fog: '#f6d9de',
      fabric: ['#f9acbb', '#ffe0a7', '#e89ac6', '#ffceda'],
      side: '#c383a5',
      path: [
        [0, 0, 0, 5.4, 5.5],
        [0.8, 5.9, 0.1, 3.8, 3.7],
        [2.4, 11.15, 0.32, 3.6, 3.8, 0.65],
        [1.2, 19.7, 0.25, 4.5, 9.9],
        [-0.9, 27.95, 0.45, 3.5, 3.5, 0, 'crumble'],
        [-2.5, 33.3, 0.55, 3.7, 3.8],
        [-1.3, 41.75, 0.41, 4.7, 9.9],
        [0.8, 50.35, 0.65, 3.5, 3.7, 0, 'tilt'],
        [2, 56, 0.56, 5.2, 4.8],
        [1.1, 64.9, 0.72, 4.6, 9.9],
        [-1, 73.45, 0.94, 3.6, 3.8, 0, 'gust'],
        [-2.4, 79.05, 0.77, 3.7, 3.6],
        [-0.5, 87.3, 0.98, 4.5, 9.9],
        [1.6, 95.85, 1.23, 3.5, 3.7, 0.75],
        [2.4, 101.5, 1.08, 3.7, 3.8, 0, 'crumble'],
        [0.3, 110.05, 1.2, 4.6, 9.9],
        [-1.1, 118.9, 1.16, 5.2, 4.8],
        [-2.3, 124.85, 1.44, 3.6, 3.7, 0, 'tilt'],
        [-0.7, 133.35, 1.59, 4.7, 9.7],
        [1.5, 144.75, 1.37, 4.6, 9.9],
        [2.3, 153.4, 1.64, 3.6, 3.7, 0.7],
        [0.2, 159.1, 1.78, 3.8, 3.9],
        [-0.6, 165.1, 1.69, 5.4, 5],
      ],
      checkpoints: [8, 16],
      gifts: [
        { at: 2, dx: 0, dz: 0 },
        { at: 8, dx: 0.45, dz: 0.3 },
        { at: 20, dx: -0.25, dz: 0 },
      ],
      stars: [
        { at: 1, dx: 0, dz: 0 },
        { at: 5, dx: -0.4, dz: -0.15 },
        { at: 10, dx: 0.35, dz: -0.25 },
        { at: 11, dx: -0.35, dz: 0.35 },
        { at: 18, dx: 0.5, dz: 3.25 },
        { at: 21, dx: -0.35, dz: 0.35 },
        { at: 3, dx: -0.25, dz: 3.1 },
        { at: 9, dx: 0.35, dz: 3.1 },
        { at: 15, dx: -0.3, dz: 3.1 },
        { at: 19, dx: 0.2, dz: 3.1 },
      ],
      hazards: [
        { at: 3, type: 'bee' },
        { at: 6, type: 'jumpRope' },
        { at: 9, type: 'hoops' },
        { at: 12, type: 'hedgehog' },
        { at: 15, type: 'sweeper', rate: 1.32 },
        { at: 18, type: 'zipperGate' },
        { at: 19, type: 'shutter' },
      ],
    },
    {
      id: 'night',
      petalTheme: 'lilac',
      title: 'Tähtiyö',
      difficulty: 'Vaikea',
      caption: 'Tarkkoja loikkia kuunvalossa.',
      description:
        'Odota tähtiverhon nousua ja seuraa kuukoin kaarrosta. Radan jälkipuolella hyppynaru pyyhkäisee liikkuvan tilkkuportin edessä.',
      sky: ['#343469', '#786fa7', '#c1a8d7'],
      fog: '#9e95bf',
      fabric: ['#b09ee4', '#96abe5', '#dcc5ec', '#c6acea'],
      side: '#7767aa',
      path: [
        [0, 0, 0, 5, 5.5],
        [0.6, 6.1, 0.15, 3.5, 3.6],
        [-1.6, 11.35, 0.4, 3.3, 3.4, 0.55],
        [-2.8, 19.7, 0.55, 4.5, 9.6],
        [-0.6, 27.95, 0.42, 3.4, 3.5, 0, 'crumble'],
        [1.6, 33.4, 0.7, 3.2, 3.5],
        [2.3, 41.7, 1.01, 4.7, 9.7],
        [0.2, 50.15, 0.77, 3.4, 3.5, 0, 'tilt'],
        [-1.9, 58.6, 0.96, 4.5, 9.6],
        [-2.1, 67.25, 1.05, 5.2, 4.8],
        [0.2, 73.35, 1.32, 3.3, 3.5, 0.75],
        [2.5, 78.9, 1.6, 3.3, 3.5, 0, 'gust'],
        [1.2, 87.25, 1.36, 4.6, 9.6],
        [-1, 95.8, 1.62, 3.3, 3.6, 0, 'crumble'],
        [-2.4, 101.45, 1.85, 3.3, 3.4, 0, 'tilt'],
        [-0.5, 109.6, 1.59, 4.6, 9.6],
        [1.8, 118.15, 1.88, 3.2, 3.5, 0.75],
        [2.3, 126.55, 2.17, 4.5, 9.6],
        [0.2, 135.3, 2.04, 5.2, 4.8],
        [-2, 141.45, 2.32, 3.3, 3.6],
        [-3, 147.2, 2.57, 3.3, 3.4, 0, 'crumble'],
        [-0.7, 155.55, 2.3, 4.7, 9.7],
        [1.6, 164.1, 2.58, 3.3, 3.5, 0, 'tilt'],
        [2.4, 169.7, 2.94, 3.2, 3.4, 0, 'crumble'],
        [0.1, 178, 2.68, 4.6, 9.6],
        [-2.2, 186.6, 2.96, 3.3, 3.5, 0.8],
        [-1.5, 195.3, 3.2, 4.7, 9.7],
        [0.6, 204.55, 3.13, 5.4, 5],
      ],
      checkpoints: [9, 18],
      gifts: [
        { at: 2, dx: -0.2, dz: 0 },
        { at: 9, dx: 0.4, dz: 0.3 },
        { at: 25, dx: 0, dz: 0 },
      ],
      stars: [
        { at: 1, dx: 0, dz: 0 },
        { at: 5, dx: -0.5, dz: 0.2 },
        { at: 11, dx: 0.5, dz: 0.25 },
        { at: 19, dx: -0.45, dz: -0.2 },
        { at: 26, dx: 0.4, dz: 3.25 },
        { at: 3, dx: -0.35, dz: 3.1 },
        { at: 8, dx: 0.25, dz: 3.1 },
        { at: 12, dx: -0.3, dz: 3.1 },
        { at: 17, dx: 0.25, dz: 3.1 },
        { at: 24, dx: -0.15, dz: 3.1 },
      ],
      hazards: [
        { at: 3, type: 'shutter' },
        { at: 6, type: 'jumpRope' },
        { at: 8, type: 'moth' },
        { at: 12, type: 'pendulum', amplitude: 1.27, rate: 1.55 },
        { at: 15, type: 'hedgehog' },
        { at: 17, type: 'ropeGate' },
        { at: 21, type: 'pillowPress' },
        { at: 24, type: 'sweeper', rate: 1.78 },
        { at: 26, type: 'gatePress' },
      ],
    },
    {
      id: 'grove',
      petalTheme: 'green',
      title: 'Sammallehto',
      difficulty: 'Keskitaso',
      caption: 'Tyynyportaita puiden latvoihin.',
      description:
        'Mutkittele saniaisten lomasta latvoihin. Jatka keinuvien tuppojen yli ja ota vauhtia ennen loikkaa sammalharjanteelle.',
      sky: ['#70aa8f', '#cae5b1', '#efe3a7'],
      fog: '#c4dcad',
      fabric: ['#a5c675', '#e5ce86', '#8fc39d', '#d4de97'],
      side: '#5b846a',
      path: [
        // The root crossing bends east before the climb.
        [0, 0, 0, 6.8, 6.4],
        [1.7, 5.95, 0.2, 4.2, 4.2],
        [4.35, 11.2, 0.55, 4.8, 4.8],
        [5.8, 18.8, 0.8, 4.9, 8.6],
        [3.5, 26.1, 1.13, 4.1, 3.8, 0, 'tilt'],
        [0.8, 31.05, 1.65, 3.9, 3.85, 0, 'gust'],
        [-1.85, 38.75, 2.15, 4.7, 9.7],
        [-4.55, 46.9, 2.55, 5.2, 4.9],
        [-6.2, 53.2, 2.9, 6.2, 5.55],
        // Crossing the clearing reverses the climb along the canopy.
        [-4.8, 61.5, 3.28, 4.7, 8.8],
        [-2.2, 68.55, 3.68, 3.8, 3.65, 0.55],
        [0.45, 73.6, 4.16, 4.1, 3.85, 0, 'crumble'],
        [3.1, 78.5, 4.63, 4.25, 4.05],
        [5.35, 86.4, 4.96, 5.1, 8.9],
        [7.2, 94.05, 5.22, 5.6, 5.15],
        [6.9, 100.85, 5.6, 7.15, 6.2],
        // The last ridge turns west and drops into a fern hollow.
        [4.2, 107.6, 5.87, 5, 5.5, 0, 'ledge'],
        [1.55, 112.8, 6.3, 4.2, 4.1, 0, 'tilt'],
        [-0.7, 120.75, 6.55, 4.8, 8.8],
        [-3.6, 128, 6.19, 4.05, 3.95, 0.5],
        [-6.15, 133.3, 5.9, 4.2, 3.9, 0, 'crumble'],
        [-7, 138.7, 5.5, 5, 4.5],
        [-5.8, 147.2, 5.1, 5.2, 9.7],
        [-3, 155.55, 4.6, 4.7, 4.35],
        [-0.5, 161.7, 4.35, 6.6, 5.55],
      ],
      checkpoints: [8, 15],
      gifts: [
        { at: 2, dx: 0.55, dz: -0.1 },
        { at: 8, dx: -0.95, dz: 0.65 },
        { at: 21, dx: 0.6, dz: -0.3 },
        { at: 15, dx: 1.95, dz: -0.65, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: -0.2, dz: 0.45 },
        { at: 3, dx: 0.2, dz: 2.85 },
        { at: 5, dx: 0.35, dz: -0.15 },
        { at: 7, dx: -0.3, dz: 0.3 },
        { at: 9, dx: 0.45, dz: 2.6 },
        { at: 10, dx: -0.28, dz: -0.25 },
        { at: 12, dx: -0.1, dz: 0.32 },
        { at: 13, dx: 0.24, dz: 2.83 },
        { at: 16, dx: -0.5, dz: 0.42 },
        { at: 18, dx: 0.3, dz: 3 },
        { at: 19, dx: 0.26, dz: -0.22 },
        { at: 22, dx: 0.34, dz: 3.25 },
        { at: 23, dx: -0.2, dz: 0.3 },
      ],
      hazards: [
        { at: 3, type: 'bun' },
        { at: 6, type: 'jumpRope' },
        { at: 9, type: 'hurdle', amplitude: 0.45, rate: 1.35 },
        { at: 13, type: 'bee' },
        { at: 18, type: 'hedgehog' },
        { at: 22, type: 'zipperGate' },
      ],
    },
    {
      id: 'reef',
      petalTheme: 'blue',
      title: 'Koralliriutta',
      difficulty: 'Vaikea',
      caption: 'Pitkiä loikkia korallien yli.',
      description:
        'Laskeudu korallitasanteille ja tähtää narun yli tilkkuporttiin. Ulkoriutalla portin takana odottaa pehmoleimasin.',
      sky: ['#219ab3', '#81d8d3', '#d5f2cf'],
      fog: '#90d2cf',
      fabric: ['#f4afac', '#7ed2bc', '#f4c47e', '#a4b9e0'],
      side: '#4a91a5',
      path: [
        // The shallows lead across broad coral shelves.
        [0, 0, 0, 7.4, 6],
        [-2.05, 5.95, 0.22, 4.6, 4.15],
        [-4.7, 11.7, 0.55, 4.25, 4],
        [-6, 20.1, 0.82, 5.6, 9.15],
        [-3.05, 28, 0.51, 4.05, 4.15, 0.75],
        [0.15, 33.4, 0.05, 4.35, 4],
        [2.95, 41.875, -0.27, 5.35, 9.7],
        [4.3, 51.15, -0.42, 7, 5.75],
        // Descend into the channel, then cross its current in the opposite direction.
        [3.6, 60.4, -0.72, 5.2, 9.5],
        [0.5, 68.1, -1.17, 3.95, 4.25, 0, 'tilt'],
        [-2.3, 73.55, -1.48, 4, 4.1, 0, 'crumble'],
        [-4.7, 81.6, -1.67, 5.7, 9.7],
        [-6.35, 89.6, -1.22, 4.2, 4.05, 0.7],
        [-4, 95, -0.77, 4.15, 3.9, 0, 'gust'],
        [-1.7, 101.15, -0.41, 6.1, 5.3],
        [0.85, 108.45, -0.05, 8, 6.5],
        // Climb the outer reef through two staggered sets of small platforms.
        [3.75, 115.2, 0.51, 3.85, 4.2, 0, 'crumble'],
        [6.15, 120.15, 1.06, 3.95, 3.75, 0.45],
        [7.5, 128.25, 1.28, 5.2, 9.2],
        [4.65, 136.15, 1.79, 4, 4.1, 0, 'tilt'],
        [1.9, 141.2, 2.31, 3.9, 3.95],
        [-0.9, 146.55, 2.74, 4.55, 4.2, 0, 'crumble'],
        [-3.5, 152.75, 2.51, 6.3, 5.6],
        [-5.35, 162.025, 2.39, 5.5, 9.7],
        [-3.45, 170.05, 2.84, 4.1, 4.05, 0.6],
        [-0.65, 175.4, 3.25, 4.2, 4.15],
        [1.95, 180.6, 3.78, 4.15, 3.85, 0, 'tilt'],
        [3.5, 188.9, 3.72, 5.45, 9.4],
        [2.25, 197.3, 4.05, 7.4, 5.9],
      ],
      checkpoints: [7, 15, 22],
      gifts: [
        { at: 2, dx: -0.6, dz: 0.2 },
        { at: 14, dx: -0.8, dz: -0.4 },
        { at: 25, dx: 0.4, dz: 0.15 },
        { at: 15, dx: -2.4, dz: 0.65, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: 0.2, dz: -0.1 },
        { at: 3, dx: -0.25, dz: 3.15 },
        { at: 5, dx: 0.55, dz: -0.4 },
        { at: 6, dx: -0.3, dz: 3.25 },
        { at: 8, dx: 0.3, dz: 3.1 },
        { at: 10, dx: -0.12, dz: 0.22 },
        { at: 11, dx: 0.3, dz: 3.25 },
        { at: 13, dx: 0.4, dz: -0.15 },
        { at: 17, dx: -0.25, dz: 0.22 },
        { at: 18, dx: -0.3, dz: 3.15 },
        { at: 20, dx: -0.4, dz: 0 },
        { at: 23, dx: -0.45, dz: 3.25 },
        { at: 24, dx: 0.25, dz: -0.15 },
        { at: 27, dx: -0.35, dz: 2.95 },
      ],
      hazards: [
        { at: 3, type: 'hoops' },
        { at: 6, type: 'jumpRope' },
        { at: 8, type: 'sweeper', rate: 1.3 },
        { at: 11, type: 'ropeGate' },
        { at: 18, type: 'shutter' },
        { at: 23, type: 'gatePress' },
        { at: 27, type: 'sweeper', rate: 1.75 },
      ],
    },
    {
      id: 'orchard',
      petalTheme: 'pink',
      title: 'Omenatarha',
      difficulty: 'Keskitaso',
      caption: 'Pujotteluloikkia omenapuiden välissä.',
      description:
        'Pujottele omenapuurivien välissä ja loikkaa keinuvien oksien yli. Sadonkorjuun tasanteilla ehdit levätä ennen seuraavaa kaarretta.',
      sky: ['#e4b57f', '#ffe3ad', '#ecbc9c'],
      fog: '#f0d4ac',
      fabric: ['#e99489', '#b5cc87', '#f6cb91', '#f2b7ad'],
      side: '#a66c61',
      path: [
        // Low, wide turns weave through three rows of trees.
        [0, 0, 0, 7, 6.4],
        [-1.4, 5.95, 0.14, 4.7, 4.5],
        [-3.65, 11.5, 0.42, 4.7, 4.35],
        [-5.2, 16.8, 0.64, 4.2, 4.15, 0, 'tilt'],
        [-5.65, 24.7, 0.58, 5.5, 9.15],
        [-3.85, 32.45, 0.45, 4.35, 4.15, 0.47],
        [-1.4, 37.7, 0.5, 4.65, 4.1],
        [1.25, 43.15, 0.72, 4.75, 4.3, 0, 'gust'],
        [3.8, 49.1, 0.9, 6.2, 5.4],
        [6.15, 57.75, 1.1, 5.5, 9.4],
        [6.7, 65.5, 0.96, 5.2, 4.45],
        [5.6, 71, 0.78, 4.25, 4.35, 0, 'tilt'],
        [3.05, 79.175, 0.57, 4.7, 9.7],
        [0.15, 87.4, 0.62, 4.45, 4.3, 0.44],
        [-2.55, 95.475, 0.8, 5.6, 9.7],
        [-5.15, 103.4, 0.96, 4.6, 4.3, 0, 'crumble'],
        [-6.85, 109.05, 1.2, 5.4, 4.8],
        [-7.15, 115.85, 1.35, 7, 6.4],
        // Cross the last row and straighten out on the gate approach.
        [-5.6, 124.95, 1.45, 5.3, 9.3],
        [-2.9, 132.9, 1.62, 4.5, 4.3, 0, 'tilt'],
        [0.2, 138.35, 1.44, 4.55, 4.25],
        [3.15, 143.85, 1.29, 4.8, 4.4, 0.38],
        [5.4, 149.85, 1.18, 5.8, 5.35],
        [5.5, 158.55, 1.26, 5.4, 9.25],
        [3.2, 166.4, 1.46, 4.75, 4.55],
        [0.95, 173.1, 1.5, 7.2, 6.25],
      ],
      checkpoints: [8, 17],
      gifts: [
        { at: 2, dx: 0.2, dz: 0.3 },
        { at: 10, dx: -0.55, dz: 0.15 },
        { at: 22, dx: 0.45, dz: 0.15 },
        { at: 17, dx: -1.6, dz: 0.2, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: -0.15, dz: 0.2 },
        { at: 3, dx: -0.25, dz: 0.25 },
        { at: 4, dx: 0.2, dz: 2.8 },
        { at: 6, dx: 0.3, dz: 0.05 },
        { at: 7, dx: 0.28, dz: 0.15 },
        { at: 9, dx: 0.2, dz: 3 },
        { at: 12, dx: -0.3, dz: 3.25 },
        { at: 14, dx: -0.3, dz: 3.25 },
        { at: 16, dx: -0.2, dz: 0.2 },
        { at: 18, dx: 0.25, dz: 3.05 },
        { at: 20, dx: 0.4, dz: 0.15 },
        { at: 21, dx: 0.25, dz: 0.2 },
        { at: 23, dx: -0.25, dz: 3 },
        { at: 24, dx: -0.35, dz: 0.25 },
      ],
      hazards: [
        { at: 4, type: 'pendulum', amplitude: 1.06, rate: 1.28 },
        { at: 9, type: 'bee' },
        { at: 12, type: 'jumpRope' },
        { at: 14, type: 'pillowPress' },
        { at: 18, type: 'hedgehog' },
        { at: 23, type: 'sweeper', rate: 1.3 },
      ],
    },
    {
      id: 'frost',
      petalTheme: 'blue',
      title: 'Revontulijäätikkö',
      difficulty: 'Vaikea',
      caption: 'Jääharjanteita ja pitkä liuku revontulten alla.',
      description:
        'Rytmitä nousu lohkareelta toiselle ja ylitä jääportaat ennen kuin askelmat putoavat. Liu’un jälkeen edessä on vielä kaksi kaarretta kohti maaliporttia.',
      sky: ['#242758', '#435f8d', '#a6c9d7'],
      fog: '#88a8c3',
      fabric: ['#8fcee4', '#b2e7db', '#a4aeee', '#d5c0eb'],
      side: '#5975a6',
      path: [
        // Climb the moraine in two changing directions.
        [0, 0, 0, 7.3, 6.2],
        [1.7, 5.85, 0.46, 4.2, 4.05],
        [3.95, 10.95, 1.04, 3.95, 3.9],
        [6.15, 16.15, 1.67, 4.05, 4.1, 0, 'tilt'],
        [7.3, 22.45, 2.1, 5.8, 5.55],
        [5.7, 30.9, 2.58, 5.15, 9.2],
        [2.95, 38.3, 3.13, 4.05, 3.95, 0.46],
        [-0.1, 46.325, 3.73, 4.7, 9.7],
        [-3, 54.4, 4.29, 4.3, 4.1, 0, 'crumble'],
        [-5.45, 60.4, 4.78, 6.5, 5.6],
        [-7.45, 68.8, 5.3, 5.2, 9.25],
        [-5.2, 76.1, 5.93, 4, 3.95, 0, 'tilt'],
        [-2.15, 81.3, 6.53, 4.15, 4],
        [1.1, 86.4, 7.13, 4.15, 4.05, 0, 'crumble'],
        [3.65, 92.4, 7.62, 7, 5.7],
        // Switch back around the headwall to the summit stairway and slide.
        [5.75, 101.1, 8.08, 5.4, 9.25],
        [8.25, 108.4, 8.59, 4.15, 4.05, 0.52],
        [6.45, 113.65, 9.12, 4.3, 4.1, 0, 'tilt'],
        [3.75, 121.5, 9.69, 4.7, 9.7],
        [2.1, 130.55, 10.1, 6.7, 6.1],
        // The first landing after the slide is aligned with its central run-out.
        [2.1, 137.2, 10.04, 5.6, 5.7],
        [-0.5, 143.25, 9.77, 4.3, 4.35, 0, 'crumble'],
        [-3.65, 148.75, 9.4, 4.2, 4.15, 0, 'gust'],
        [-5.7, 156.8, 9.21, 5.4, 9.45],
        [-3.5, 165.6, 9, 6.4, 5.75],
        [-0.65, 171.7, 8.68, 4.25, 4.15, 0.42],
        [2.45, 177.1, 8.41, 4.13, 4.05, 0, 'tilt'],
        [4.85, 185.25, 8.05, 5.25, 9.7],
        [3.2, 193.5, 7.86, 4.6, 4.55],
        [0.75, 200.25, 7.7, 7.6, 6.45],
      ],
      checkpoints: [9, 14, 19, 24],
      gifts: [
        { at: 4, dx: 0.4, dz: 0.1 },
        { at: 12, dx: 0.25, dz: 0.2 },
        { at: 24, dx: -0.5, dz: 0.3 },
        { at: 19, dx: 1.2, dz: 0.15, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 2, dx: 0.2, dz: 0.25 },
        { at: 3, dx: 0.18, dz: 0.25 },
        { at: 5, dx: -0.25, dz: 2.95 },
        { at: 7, dx: -0.28, dz: 3.25 },
        { at: 8, dx: -0.25, dz: 0.15 },
        { at: 10, dx: 0.25, dz: 3 },
        { at: 11, dx: 0.3, dz: 0.2 },
        { at: 13, dx: 0.25, dz: 0.1 },
        { at: 15, dx: 0.25, dz: 3.05 },
        { at: 16, dx: -0.15, dz: 0.28 },
        { at: 18, dx: -0.28, dz: 3.25 },
        { at: 20, dx: 0, dz: 0.25 },
        { at: 22, dx: -0.25, dz: 0.2 },
        { at: 23, dx: 0.3, dz: 3 },
        { at: 26, dx: 0.22, dz: 0.2 },
        { at: 27, dx: -0.3, dz: 3.25 },
        { at: 28, dx: -0.35, dz: 0.25 },
      ],
      hazards: [
        { at: 5, type: 'hurdle', amplitude: 0.36, rate: 1.46 },
        { at: 7, type: 'zipperGate' },
        { at: 10, type: 'moth' },
        { at: 15, type: 'shutter' },
        { at: 18, type: 'ropeGate' },
        { at: 23, type: 'hoops' },
        { at: 27, type: 'gatePress' },
      ],
    },
    {
      id: 'rose',
      title: 'Ruusutarha',
      difficulty: 'Helppo',
      petalTheme: 'pink',
      caption: 'Pehmeitä polkuja ruusupenkkien lomassa.',
      description:
        'Seuraa ruusupolun leveitä kaarteita ja loikkaa matalien puomien yli. Välilipuilla voit pysähtyä katsomaan tarhaa.',
      sky: ['#eb96b6', '#ffd7e0', '#fae8d5'],
      fog: '#f9d9e2',
      fabric: ['#f2a5bd', '#ffd1dc', '#f3b5cb', '#ffdfb7'],
      side: '#bc718f',
      path: [
        [0, 0, 0, 7.4, 6.6],
        [1.3, 5.9, 0.08, 5.4, 4.7],
        [3.65, 11.55, 0.15, 5.25, 4.45],
        [6.4, 19.2, 0.24, 5.6, 8.65],
        [8.45, 27.2, 0.34, 6.55, 5.55],
        [9.05, 33.6, 0.43, 5.6, 5, 0, 'gust'],
        [7.5, 39.6, 0.39, 5.05, 4.7, 0, 'tilt'],
        [4.8, 46.3, 0.29, 7.5, 6.2],
        [1.75, 52.95, 0.23, 5.5, 4.9],
        [-1.3, 58.75, 0.16, 5.3, 4.9, 0.38],
        [-4.05, 66.8, 0.27, 6, 8.9],
        [-6.15, 75.2, 0.39, 6.25, 5.85],
        [-6.85, 84.075, 0.48, 5.25, 9.7],
        [-5.4, 92.45, 0.56, 5.1, 4.8, 0, 'crumble'],
        [-2.65, 99.15, 0.63, 7.2, 6.1],
        [0.25, 105.8, 0.53, 5.45, 4.9],
        [2.85, 114, 0.48, 5.9, 9.1],
        [4.25, 122.15, 0.53, 6.8, 5.6],
        [3.25, 128.7, 0.61, 5.1, 4.9],
        [0.8, 135.45, 0.65, 7.4, 6.5],
      ],
      checkpoints: [7, 14],
      gifts: [
        { at: 2, dx: 0.2, dz: 0.15 },
        { at: 7, dx: 0.65, dz: 0.25 },
        { at: 17, dx: -0.45, dz: 0.3 },
        { at: 14, dx: -1.45, dz: 0.2, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: 0.15, dz: 0.1 },
        { at: 3, dx: 0.25, dz: 2.65 },
        { at: 5, dx: -0.26, dz: 0.2 },
        { at: 6, dx: -0.25, dz: 0.16 },
        { at: 8, dx: 0.25, dz: 0.12 },
        { at: 9, dx: 0.2, dz: 0.18 },
        { at: 10, dx: -0.3, dz: 2.75 },
        { at: 12, dx: -0.13, dz: 3.25 },
        { at: 13, dx: 0.17, dz: 0.15 },
        { at: 15, dx: 0.25, dz: 0.3 },
        { at: 16, dx: -0.23, dz: 2.8 },
        { at: 18, dx: -0.25, dz: 0.22 },
      ],
      hazards: [
        { at: 3, type: 'bun' },
        { at: 10, type: 'hurdle', amplitude: 0, rate: 1.1 },
        { at: 12, type: 'jumpRope' },
        { at: 16, type: 'bee' },
      ],
    },
    {
      id: 'meadow',
      title: 'Smaragdiniitty',
      difficulty: 'Keskitaso',
      petalTheme: 'green',
      caption: 'Keinuvia tyynyjä ja avaria kumpuja.',
      description:
        'Ylitä keikkuvat tyynyt kumpu kerrallaan. Harjanteilla on tilaa ottaa vauhtia ja katsella, milloin niityn asukkaat väistävät.',
      sky: ['#62ba8d', '#c7edba', '#f4e5b3'],
      fog: '#cee6bf',
      fabric: ['#82c59a', '#bdd875', '#a6e0b1', '#f5de90'],
      side: '#4d9070',
      path: [
        [0, 0, 0, 7.2, 6.4],
        [-1.3, 5.55, 0.48, 4.4, 4, 0, 'tilt'],
        [-2.35, 10.25, 1.05, 4.5, 4.1, 0, 'tilt'],
        [-2.65, 18.55, 1.4, 7.35, 10.5],
        [-2.2, 26.95, 1.05, 4.2, 4.05, 0.52],
        [-0.85, 31.75, 0.5, 4.15, 4.2, 0, 'tilt'],
        [0.1, 36.75, 0.1, 4.4, 4.5, 0, 'crumble'],
        [0.65, 43.65, -0.12, 7.7, 6.55],
        [1.5, 49.85, 0.25, 4.45, 4.05, 0, 'tilt'],
        [2.8, 54.6, 0.77, 4.25, 4.1, 0, 'gust'],
        [3.55, 62.65, 1.19, 6.1, 9.7],
        [4.05, 72.05, 1.45, 7.4, 6.15],
        [4, 78, 1.11, 4.4, 4.5, 0, 'tilt'],
        [3.05, 85.85, 0.59, 4.7, 9.7],
        [1.4, 93.45, 0.21, 4.45, 4.05, 0, 'tilt'],
        [0.15, 101.6, 0, 7, 10.15],
        [-1.5, 109.7, 0.37, 4.25, 4.2, 0, 'tilt'],
        [-2.7, 114.7, 0.95, 4.3, 4.25, 0, 'crumble'],
        [-3.35, 120, 1.38, 5.4, 4.85],
        [-3.1, 127.1, 1.71, 7.75, 6.9],
        [-1.8, 136.65, 1.46, 6.25, 9.7],
        [-0.4, 144.6, 1.02, 4.65, 4.35, 0, 'tilt'],
        [0.1, 151.15, 0.78, 7.7, 6.2],
      ],
      checkpoints: [7, 11, 19],
      gifts: [
        { at: 4, dx: 0.25, dz: 0.02 },
        { at: 11, dx: -0.6, dz: 0.25 },
        { at: 18, dx: 0.45, dz: 0.25 },
        { at: 19, dx: -1.55, dz: 0.25, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: 0.16, dz: 0.15 },
        { at: 2, dx: -0.15, dz: 0.15 },
        { at: 3, dx: 0.3, dz: 3.15 },
        { at: 5, dx: 0.2, dz: 0.18 },
        { at: 7, dx: 0.25, dz: 0.2 },
        { at: 9, dx: 0.15, dz: 0.1 },
        { at: 10, dx: 0.15, dz: 3.25 },
        { at: 12, dx: -0.15, dz: 0.22 },
        { at: 14, dx: 0.16, dz: 0.22 },
        { at: 15, dx: -0.3, dz: 3.1 },
        { at: 17, dx: -0.15, dz: 0.18 },
        { at: 20, dx: 0.3, dz: 3.25 },
        { at: 21, dx: 0.2, dz: 0.3 },
      ],
      hazards: [
        { at: 3, type: 'hedgehog' },
        { at: 10, type: 'jumpRope' },
        { at: 13, type: 'pillowPress' },
        { at: 15, type: 'bee' },
        { at: 20, type: 'zipperGate' },
      ],
    },
    {
      id: 'lagoon',
      title: 'Siniruusujen laguuni',
      difficulty: 'Keskitaso',
      petalTheme: 'blue',
      caption: 'Sivuttaisloikkia saarilta sateenkaariliukuun.',
      description:
        'Loikkaa vinosti sinisten saarten välissä. Kipua keskisaarelta portaita sateenkaariliukuun ja jatka vastarannan saaria pitkin maaliin.',
      sky: ['#5fa7e4', '#b7e8f8', '#d5e2fa'],
      fog: '#b5daf2',
      fabric: ['#87b9ee', '#a8d9f4', '#9ab1ed', '#99d9dc'],
      side: '#577ebc',
      path: [
        [0, 0, 0, 7.15, 6.2],
        [-3.55, 5.1, 0.1, 4.75, 4.25],
        [-7.35, 9.4, 0.23, 4.95, 4.3, 0.43],
        [-9.4, 15.85, 0.35, 6.45, 7.05],
        [-5.85, 24.9, 0.18, 4.7, 9.7],
        [-1.15, 31.75, 0.31, 4.55, 4.05, 0, 'tilt'],
        [3.55, 36, 0.45, 4.9, 4.2],
        [7.55, 41.45, 0.63, 7.25, 5.7],
        [10.35, 49.7, 0.79, 6, 9.15],
        [6.9, 56.75, 1.06, 4.65, 4.35, 0, 'crumble'],
        [2.35, 61.05, 1.18, 4.8, 4.25, 0, 'gust'],
        [-1.15, 66.95, 1.32, 7.1, 6.2],
        // Keeps the first landing centered on the slide run-out.
        [-1.15, 73.7, 1.25, 5.8, 5.9],
        [3, 80.825, 1.13, 6.6, 9.7],
        [7.35, 87.8, 0.95, 5, 4.1, 0.48],
        [10.8, 94.6, 0.82, 5.7, 8.85],
        [7, 101.55, 0.69, 4.95, 4.35, 0, 'tilt'],
        [2.45, 106.6, 0.55, 7.25, 5.65],
        [-2.4, 114.325, 0.49, 4.75, 9.7],
        [-6.8, 121.45, 0.34, 4.55, 4.3, 0, 'crumble'],
        [-3.7, 126.85, 0.43, 5.25, 4.65],
        [0.5, 133, 0.57, 7, 6.2],
      ],
      checkpoints: [7, 11, 17],
      gifts: [
        { at: 3, dx: -0.45, dz: 0.15 },
        { at: 7, dx: 0.7, dz: 0.3 },
        { at: 20, dx: -0.45, dz: 0.1 },
        { at: 17, dx: 1.65, dz: -0.25, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: 0.2, dz: 0.2 },
        { at: 2, dx: -0.25, dz: 0.2 },
        { at: 4, dx: -0.2, dz: 3.25 },
        { at: 6, dx: 0.25, dz: 0.35 },
        { at: 8, dx: 0.28, dz: 2.8 },
        { at: 9, dx: -0.2, dz: 0.2 },
        { at: 10, dx: -0.23, dz: 0.15 },
        { at: 12, dx: -0.1, dz: 0.35 },
        { at: 14, dx: 0.23, dz: 0.15 },
        { at: 15, dx: -0.3, dz: 2.7 },
        { at: 16, dx: 0.1, dz: 0.18 },
        { at: 18, dx: -0.25, dz: 3.25 },
        { at: 19, dx: 0.3, dz: 0.22 },
      ],
      hazards: [
        { at: 4, type: 'jumpRope' },
        { at: 8, type: 'hoops' },
        { at: 13, type: 'zipperGate' },
        { at: 15, type: 'pendulum', amplitude: 1.07, rate: 1.32 },
        { at: 18, type: 'pillowPress' },
      ],
    },
    {
      id: 'tulip',
      title: 'Tulppaanitorni',
      difficulty: 'Vaikea',
      petalTheme: 'lilac',
      caption: 'Putoavia portaita kohti tornin huippua.',
      description:
        'Nouse portaita kahdelle terassille ja loikkaa kapeiden tyynyjen yli. Huipulla viimeinen tähtiverho vartioi maaliporttia.',
      sky: ['#8c70bf', '#bea9e6', '#eed3ef'],
      fog: '#d3bdeb',
      fabric: ['#b899de', '#d7b6e9', '#9e9bdc', '#e4c1e1'],
      side: '#8b68af',
      path: [
        [0, 0, 0, 7.1, 6.45],
        [1.45, 5.6, 0.53, 4.05, 3.9],
        [3.65, 10.5, 1.15, 3.95, 3.9, 0, 'tilt'],
        [5.95, 15.35, 1.83, 4.15, 3.95, 0, 'crumble'],
        [7.65, 21.05, 2.41, 6.5, 5.5],
        [7.65, 28.92, 2.41, 4.4, 11.2, 0, 'stairs'],
        [7.65, 40.275, 5.7, 5.35, 9.7],
        [5.15, 48.1, 6.3, 4.1, 4.1, 0.5],
        [2.5, 54.1, 6.78, 6.55, 5.6],
        [0.1, 59.9, 7.45, 4.1, 3.9, 0, 'gust'],
        [-2.75, 64.85, 8.13, 4.05, 3.9, 0, 'crumble'],
        [-5.2, 72.55, 8.51, 5.75, 9.2],
        [-7.45, 80.95, 9.04, 7.25, 5.7],
        [-9.4, 89.4, 9.66, 6.45, 9.7],
        [-9.4, 99.37, 9.66, 4.4, 11.2, 0, 'stairs'],
        [-9.4, 108.35, 12.95, 5.65, 4.9],
        [-6.95, 114.45, 13.49, 7.1, 5.45],
        [-4.2, 120.3, 14.16, 4.15, 4.05, 0, 'crumble'],
        [-1.35, 125.2, 14.76, 4.25, 3.85, 0, 'tilt'],
        [1.2, 133.025, 15.18, 5.75, 9.7],
        [3.85, 142, 15.8, 7.3, 5.85],
        [6.1, 147.9, 16.47, 4.1, 3.95, 0.46],
        [6.95, 152.7, 17.17, 4.05, 4.05, 0, 'crumble'],
        [5.45, 160.45, 17.65, 5.8, 9.2],
        [2.85, 167.85, 18.18, 4.55, 4.25, 0, 'ledge'],
        [0.4, 174.05, 18.65, 7.25, 6.1],
      ],
      checkpoints: [4, 8, 12, 16, 20],
      gifts: [
        { at: 6, dx: 0.38, dz: 3.25 },
        { at: 15, dx: -0.3, dz: 0.25 },
        { at: 24, dx: 0.35, dz: 0.22 },
        { at: 20, dx: 1.4, dz: -0.15, loft: 2.75, aerial: true },
      ],
      stars: [
        { at: 1, dx: 0.17, dz: 0.2 },
        { at: 2, dx: 0.25, dz: 0.26 },
        { at: 3, dx: -0.1, dz: 0.16 },
        { at: 7, dx: -0.25, dz: 0.2 },
        { at: 9, dx: -0.15, dz: 0.2 },
        { at: 11, dx: 0.2, dz: 2.85 },
        { at: 13, dx: -0.25, dz: 3.25 },
        { at: 17, dx: 0.15, dz: 0.2 },
        { at: 18, dx: 0.25, dz: 0.2 },
        { at: 19, dx: -0.25, dz: 3.25 },
        { at: 21, dx: 0.12, dz: 0.18 },
        { at: 22, dx: -0.2, dz: 0.15 },
        { at: 23, dx: 0.25, dz: 3.05 },
      ],
      hazards: [
        { at: 6, type: 'zipperGate' },
        { at: 11, type: 'moth' },
        { at: 13, type: 'gatePress' },
        { at: 19, type: 'ropeGate' },
        { at: 23, type: 'shutter' },
      ],
    },
    cloudTower(),
  ];
  // Insert each stairway and slide as a pair, keeping the original jump gaps and all attached pickups.
  function addRides(course, stops) {
    const path = [],
      indices = [];
    let shift = 0;
    for (const [i, row] of course.path.entries()) {
      const pad = [...row];
      pad[1] += shift;
      indices[i] = path.length;
      path.push(pad);
      if (stops.has(i)) {
        const pair = window.FluffSkyRides.rowsAfter(pad, stops.get(i));
        path.push(...pair);
        const exit = pair[1];
        shift += exit[1] + exit[4] / 2 - (pad[1] + pad[4] / 2);
      }
    }
    course.path = path;
    course.checkpoints = course.checkpoints.map((i) => indices[i]);
    for (const list of [course.stars, course.gifts, course.hazards])
      for (const entry of list) entry.at = indices[entry.at];
    return indices;
  }
  const rideStops = { cloud: [4], candy: [5], night: [5, 18], frost: [19], lagoon: [11] };
  const extraRides = {
    grove: [8, 22],
    reef: [7, 26],
    orchard: [8, 27],
    rose: [7, 22],
    meadow: [11, 25],
    tulip: [20, 30],
  };
  const rideGifts = { cloud: 4, candy: 11, night: 19 };
  const terrain = {
    Helppo: { rank: 0, amplitude: 0.15, step: 0.38 },
    Keskitaso: { rank: 1, amplitude: 0.32, step: 0.65 },
    Vaikea: { rank: 2, amplitude: 0.49, step: 0.87 },
  };
  const heightPattern = [0, 0.25, 0.82, 0.48, -0.54, -0.9, 0.44, 0.74, -0.36];
  function varyHeights(course) {
    const { path } = course;
    const { amplitude, step } = terrain[course.difficulty];
    const heights = path.map((row) => row[2]);
    const ride = (row) => row[6] === 'stairs' || row[6] === 'slide';
    for (let i = 1; i < path.length - 1; i++) {
      if (ride(path[i - 1]) || ride(path[i]) || ride(path[i + 1])) continue;
      const base = heights[i];
      // Keep neighbouring jumps within the difficulty's height limit without tightening
      // an existing authored jump. Use the next pad's original height for fixed ride joins.
      const previous = path[i - 1][2], next = heights[i + 1];
      const fromPrevious = Math.max(step, Math.abs(base - heights[i - 1]));
      const toNext = Math.max(step, Math.abs(base - next));
      const low = Math.max(previous - fromPrevious, next - toNext);
      const high = Math.min(previous + fromPrevious, next + toNext);
      path[i][2] = Math.min(high, Math.max(low, base + amplitude * heightPattern[i % heightPattern.length]));
    }
  }
  for (const course of courses) {
    if (rideStops[course.id]) {
      const at = rideGifts[course.id];
      if (at !== undefined) course.gifts.push({ at, dx: 0.95, dz: -0.35, loft: 2.75, aerial: true });
      addRides(course, new Map(rideStops[course.id].map((at) => [at, undefined])));
    }
    if (extraRides[course.id]) {
      const [at, length] = extraRides[course.id];
      course.previousPadIndices = addRides(course, new Map([[at, length]]));
      course.raceVersion = '-v7';
      course.description += ' Välilipun jälkeen pääset ' + length + ' metrin sateenkaariliukuun.';
    }
    if (!course.tower) {
      varyHeights(course);
      course.previousRaceVersion = course.raceVersion ?? (course.difficulty === 'Vaikea' ? '-v6' : '-v5');
      course.raceVersion = '-v8';
    }
  }
  courses.sort((a, b) => terrain[a.difficulty].rank - terrain[b.difficulty].rank);
  function challenge(course, index = 0) {
    if (course.endless) return Math.max(0, Math.min(1, index / 100));
    return (terrain[course.difficulty]?.rank ?? 0) / 2;
  }
  function surfaceHeight(pad, x, z) {
    if (pad.kind === 'stairs' || pad.kind === 'slide') return window.FluffSkyRides.height(pad, x, z);
    return pad.y + (x - pad.x) * (pad.slopeX || 0) + (z - pad.z) * (pad.slopeZ || 0);
  }
  function platforms(course, time) {
    const offset = course.firstIndex || 0;
    return course.path.map(([x, z, y, w, d, travel = 0, kind = null, slide], i) => ({
      x: x + travel * Math.sin(time * 1.1 + offset + i),
      z,
      y,
      w,
      d,
      kind,
      slide,
      style: window.FluffPadStyles.style(course, offset + i, kind),
      index: offset + i,
    }));
  }
  function hazards(course, pads, time) {
    return (course.hazards || []).flatMap(({ at, type, amplitude = 0, rate }) => {
      const pad = pads[at - (course.firstIndex || 0)];
      if (!pad || pad.gone) return [];
      if (window.FluffObstacles.types.includes(type))
        return window.FluffObstacles.pose(type, pad, time, challenge(course, at));
      if (window.FluffCritters.types.includes(type)) {
        const yaw = course.tower ? Math.atan2(pad.x, pad.z - course.tower.z) : 0;
        return window.FluffCritters.pose(type, pad, time, challenge(course, at), yaw);
      }
      if (type === 'shutter' || type === 'hoops')
        return window.FluffFairground.pose(type, pad, time, challenge(course, at));
      const phase = time * rate + at;
      const sweep = Math.sin(phase);
      const maxAngle = type === 'sweeper' ? 0.32 + 0.18 * challenge(course, at) : 0;
      const hazard = {
        at,
        type,
        x: pad.x,
        y: pad.y + 0.35,
        z: pad.z,
        r: 0.35,
        halfSpan: 0,
        angle: 0,
      };
      if (type === 'hurdle') {
        hazard.z += amplitude * sweep;
        hazard.y = pad.y + 0.27;
        hazard.r = 0.2;
      } else if (type === 'pendulum') {
        hazard.rope = 1.45;
        hazard.pivotY = pad.y + hazard.rope + 0.32;
        hazard.angle = sweep * amplitude * 0.53;
        hazard.z += hazard.rope * Math.sin(hazard.angle);
        hazard.y = hazard.pivotY - hazard.rope * Math.cos(hazard.angle);
        hazard.r = 0.24;
      } else if (type === 'sweeper') {
        hazard.y = pad.y + 0.29;
        hazard.r = 0.22;
        hazard.angle = sweep * maxAngle;
      } else {
        hazard.z += amplitude * sweep;
      }
      // A rigid beam still covers both edges in its most oblique pose.
      const reach = pad.w / 2 + 0.04 - hazard.r;
      hazard.halfSpan = reach / Math.cos(maxAngle);
      return hazard;
    });
  }
  function giftPosition(gift, pad, time) {
    const x = pad.x + gift.dx,
      z = pad.z + gift.dz;
    return {
      x,
      z,
      y: surfaceHeight(pad, x, z) + 0.66 + (gift.loft || 0) + 0.07 * Math.sin(time * 2.2 + gift.at),
      aerial: gift.aerial === true,
    };
  }
  function nextCourse(course) {
    const index = courses.findIndex((entry) => entry.id === course.id);
    return index < 0 ? null : (courses[index + 1] ?? window.FluffEndless.course);
  }
  function finishPortal(pad) {
    return {
      x: pad.x,
      y: pad.y + 1.36,
      z: pad.z + pad.d * 0.17,
      radiusX: Math.min(1.52, pad.w * 0.3),
      radiusY: 1.52,
    };
  }
  window.FluffCourses = {
    all: courses,
    platforms,
    hazards,
    challenge,
    surfaceHeight,
    giftPosition,
    nextCourse,
    finishPortal,
  };
})();
