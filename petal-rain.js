(() => {
  'use strict';
  const themes = {
    pink: ['rose', '#cb536d'],
    lilac: ['tulip', '#a47ac8'],
    blue: ['rose', '#628fce'],
    green: ['tulip', '#6ba064'],
  };
  const periodZ = 44;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const meshes = new Map();
  const settingKey = 'fluff-petal-rain';
  let preference;
  try {
    preference = window.localStorage.getItem(settingKey);
  } catch {}
  function enabled() {
    return preference === 'on' || (preference !== 'off' && !reducedMotion?.matches);
  }
  function toggle() {
    preference = enabled() ? 'off' : 'on';
    try {
      window.localStorage.setItem(settingKey, preference);
    } catch {}
  }

  // Trace the curled lip of a rose and the longer, swept tip of a tulip.
  const outlines = {
    rose: [
      [-0.04, -0.53],
      [-0.19, -0.45, -0.61, -0.13, -0.55, 0.23],
      [-0.53, 0.48, -0.29, 0.68, -0.06, 0.48],
      [0.01, 0.4, 0.04, 0.4, 0.12, 0.46],
      [0.37, 0.64, 0.58, 0.44, 0.54, 0.14],
      [0.51, -0.15, 0.16, -0.41, -0.04, -0.53],
    ],
    tulip: [
      [-0.07, -0.58],
      [-0.19, -0.5, -0.41, -0.22, -0.34, 0.04],
      [-0.3, 0.31, -0.06, 0.43, 0.14, 0.68],
      [0.14, 0.53, 0.37, 0.3, 0.33, 0.06],
      [0.32, -0.24, 0.06, -0.5, -0.07, -0.58],
    ],
  };
  function petalMesh(kind) {
    const [start, ...curves] = outlines[kind];
    const rim = [];
    let [x, y] = start;
    for (const [ax, ay, bx, by, endX, endY] of curves) {
      for (let i = 0; i < 5; i++) {
        const t = i / 5,
          s = 1 - t;
        rim.push([
          s ** 3 * x + 3 * s * s * t * ax + 3 * s * t * t * bx + t ** 3 * endX,
          s ** 3 * y + 3 * s * s * t * ay + 3 * s * t * t * by + t ** 3 * endY,
          1,
        ]);
      }
      x = endX;
      y = endY;
    }
    // The third coordinate encodes the distance to the hem. The shader cups the surface.
    const inner = rim.map(([px, py]) => [px * 0.62, py * 0.62, 0.62]);
    const surface = [];
    for (let i = 0; i < rim.length; i++) {
      const next = (i + 1) % rim.length;
      surface.push(
        [0, 0, 0],
        inner[i],
        inner[next],
        inner[i],
        rim[i],
        rim[next],
        inner[i],
        rim[next],
        inner[next],
      );
    }
    // Reuse the world's interleaved vertex layout. Every vertex of one petal
    // carries the same three placement seeds in the normal attribute.
    const count = 120;
    const vertices = new Float32Array(count * surface.length * 6);
    let cursor = 0,
      state = 88391;
    const random = () => (state = (Math.imul(1664525, state) + 1013904223) >>> 0) / 4294967296;
    for (let n = 0; n < count; n++) {
      const seed = [random(), random(), random()];
      for (const p of surface) {
        vertices.set(p, cursor);
        vertices.set(seed, cursor + 3);
        cursor += 6;
      }
    }
    return vertices;
  }

  // The repeating volume uses world coordinates so walking and turning give real parallax.
  // Fade to clear sky along the line of a jump and in front of the player's face.
  const vertex = `
    if(material == -20.){
      const vec3 span=vec3(36.,19.,${periodZ.toFixed(1)});
      vec3 seed=normal;
      float t=sceneTime*size.x;
      float phase=6.28318*seed.x+t*(.47+.27*seed.y);
      vec3 drift=vec3(.13*t+.66*sin(phase)+.19*cos(phase*.51+seed.z*5.),
                      -t*(.47+.29*seed.z)+.12*sin(phase*1.37),
                      .38*cos(phase*.77+seed.y*6.));
      vec3 offset=mod(seed*span+drift-loc-camera+span*.5,span)-span*.5;
      vec3 edge=span*.5-abs(offset);
      float depth=dot(offset,forwardDir);
      vec2 screen=lens*vec2(dot(offset,rightDir),dot(offset,upDir))/max(.1,depth);
      float sky=smoothstep(.13,.56,screen.y);
      float sides=smoothstep(.33,.81,abs(screen.x))*smoothstep(-.68,-.08,screen.y);
      float distanceToEye=length(offset);
      float fade=max(sky,sides)*smoothstep(0.,2.2,min(min(edge.x,edge.z),edge.y));
      fade*=smoothstep(3.5,6.5,distanceToEye)*(1.-smoothstep(16.,23.,distanceToEye));
      fade*=smoothstep(-1.8,.45,offset.y);
      if(fade < .005 || depth < .1){ gl_Position=vec4(2.,2.,2.,1.); return; }
      float scale=.36+.26*seed.y;
      // Show the broad face through the flutter, including when looking back along the course.
      float yaw=atan(offset.x,offset.z+.0001)+(seed.z-.5)*1.48+.31*sin(phase*.78);
      float pitch=.16+.39*sin(phase*.68+seed.y*4.);
      float roll=(seed.x-.5)*1.45+.34*sin(phase+seed.z);
      vec3 axisX=vec3(cos(yaw),0.,-sin(yaw));
      vec3 axisY=vec3(sin(yaw)*sin(pitch),cos(pitch),cos(yaw)*sin(pitch));
      mat3 basis=mat3(axisX*cos(roll)+axisY*sin(roll),axisY*cos(roll)-axisX*sin(roll),cross(axisX,axisY));
      vec2 p=position.xy;
      float cup=.64*p.x*p.x+.30*p.y*p.y+.23*p.x*p.y;
      vec3 delta=offset+basis*vec3(p,cup)*scale;
      vNormal=basis*normalize(vec3(-1.28*p.x-.23*p.y,-.60*p.y-.23*p.x,1.));
      vLocal=position; vFabric=vec3(fade,seed.y,size.y); vDepth=dot(delta,forwardDir);
      gl_Position=vec4(dot(delta,rightDir)*lens.x,dot(delta,upDir)*lens.y,1.001*vDepth-.12,vDepth);
      return;
    }`;
  const fragment = `
    if(material == -20.){
      vec3 n=normalize(vNormal);
      float light=.92+.08*dot(n,normalize(vec3(-.45,.7,-.55)));
      float t=smoothstep(-.52,.59,vLocal.y);
      float bend=mix(.05,.14,vFabric.z)*t*t;
      float vein=1.-smoothstep(.012,.049,abs(vLocal.x-bend));
      float sideVeins=1.-smoothstep(.008,.037,abs(abs(vLocal.x-bend)-(.045+.20*t)));
      float hem=smoothstep(.78,.99,vLocal.z);
      vec3 silk=color*light*mix(.86,1.04,t);
      silk=mix(silk,vec3(1.,.93,.88),.23*hem+.17*vein*(1.-.48*t)+.09*sideVeins*t);
      silk=mix(silk,fog,.13*smoothstep(9.,21.,vDepth));
      float alpha=vFabric.x*(.74+.12*vFabric.y);
      gl_FragColor=vec4(silk*alpha,alpha);
      return;
    }`;
  function draw(world) {
    const theme = themes[world.course.petalTheme];
    if (!theme || !enabled()) return;
    const [kind, color] = theme;
    if (!meshes.has(kind)) meshes.set(kind, petalMesh(kind));
    const origin = (world.course.originZ || 0) % periodZ;
    const gl = world.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    world.drawDetail(meshes.get(kind), [0, 0, origin], color, -20, [
      reducedMotion?.matches ? 0.45 : 1,
      kind === 'tulip' ? 1 : 0,
      1,
    ]);
    gl.depthMask(true);
    gl.disable(gl.BLEND);
  }
  window.FluffPetalRain = { vertex, fragment, draw, enabled, toggle };
})();
