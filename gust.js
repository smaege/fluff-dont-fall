(() => {
  'use strict';
  const peakSpeed = 3.2;
  const burst = 2.2;
  const calm = 2;
  const direction = (pad) => (pad.index % 2 ? 1 : -1);

  function wind(pad, time) {
    const phase = (time + pad.index * 0.59) % (burst + calm);
    if (phase >= burst) return 0;
    return direction(pad) * peakSpeed * Math.sin((phase / burst) * Math.PI) ** 2;
  }

  function meshes() {
    const cloth = [], stripes = [];
    const edges = [0, 0.17, 0.36, 0.6, 0.81, 1];
    function point(t, segment) {
      const angle = (segment * Math.PI) / 8;
      const c = Math.cos(angle), s = Math.sin(angle);
      const radius = 0.32 - t * 0.22;
      return [1.5 * t, radius * c, radius * s, 0.147, c, s];
    }
    for (let band = 0; band < edges.length - 1; band++) {
      const vertices = band % 2 ? stripes : cloth;
      for (let i = 0; i < 16; i++) {
        const a = point(edges[band], i), b = point(edges[band], i + 1);
        const c = point(edges[band + 1], i + 1), d = point(edges[band + 1], i);
        vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
      }
    }
    return { 'gust-cloth': cloth, 'gust-stripes': stripes };
  }

  function draw(world, pad, time) {
    const side = direction(pad);
    const strength = Math.abs(wind(pad, time)) / peakSpeed;
    const x = pad.x - side * pad.w * 0.38;
    const y = pad.y + 1.78;
    const z = pad.z + pad.d * 0.21;
    const droop = 1.29 - 1.24 * strength + Math.sin(time * 10) * 0.07 * strength;
    const angle = side > 0 ? -droop : Math.PI + droop;
    world.draw('ball', [x, pad.y + 0.054, z], [0.52, 0.15, 0.53], '#4b888d');
    world.draw('box', [x, pad.y + 0.93, z], [0.085, 1.86, 0.085], '#396e79');
    world.draw('ball', [x, y + 0.18, z], [0.17, 0.17, 0.17], '#f8cf85');
    world.draw('box', [x + side * 0.1, y, z], [0.25, 0.072, 0.08], '#396e79');
    const sock = [x + side * 0.18, y, z];
    world.draw('gust-cloth', sock, [1, 1, 1], '#d95f59', angle, 2);
    world.draw('gust-stripes', sock, [1, 1, 1], '#ffefbb', angle, 2);

    if (strength < 0.035) return;
    for (let i = 0; i < 3; i++) {
      const travel = (time * 0.69 + i * 0.37) % 1;
      const ribbonX = pad.x + side * pad.w * (travel - 0.5) * 0.87;
      const ribbonY = pad.y + 0.42 + i * 0.25 + Math.sin(travel * 8 + i) * 0.08;
      const ribbonZ = pad.z + pad.d * (i * 0.185 - 0.21);
      const length = Math.max(0.01, (0.37 + 0.41 * strength) * Math.sin(Math.PI * travel));
      world.draw('ball', [ribbonX, ribbonY, ribbonZ], [length, 0.045, 0.085], '#f3fff4', Math.sin(travel * 8) * 0.19);
    }
  }

  window.FluffGust = { wind, meshes, draw };
})();
