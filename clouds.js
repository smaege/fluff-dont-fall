(() => {
  'use strict';

  // Four small density fields occupy one WebGL 1 texture. Each voxel also stores
  // the light that reaches it from the sun, so shadows don't need a second ray march.
  const width = 48,
    height = 32,
    depth = 32,
    variants = 4;
  let atlas;
  function cloudVolume() {
    if (atlas) return atlas;
    const pixels = new Uint8Array(width * height * depth * variants * 2);
    for (let variant = 0; variant < variants; variant++) {
      let seed = 33707 + variant * 13001;
      const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      const field = new Float32Array(width * height * depth);
      const knots = [];
      function lobe(x, y, z, rx, ry, rz) {
        knots.push([x, y, z, 1 / rx, 1 / ry, 1 / rz, Math.min(rx, ry, rz)]);
      }
      lobe(0, -0.27, 0, 0.83, 0.26, 0.66);
      for (let j = 0; j < 8; j++) {
        const x = -0.66 + (1.32 * j) / 7,
          crest = 1 - Math.abs(x + 0.1 * variant - 0.13);
        const y = -0.18 + crest * 0.28 + random() * 0.11,
          z = (random() - 0.5) * 0.47;
        const r = 0.2 + random() * 0.11 + crest * 0.12;
        lobe(x, y, z, r, r * (1.0 + 0.35 * random()), r * 1.4);
        for (let k = 0; k < 3; k++) {
          const angle = random() * Math.PI * 2;
          lobe(
            x + Math.cos(angle) * r * 0.55,
            y + (random() - 0.26) * r * 0.95,
            z + Math.sin(angle) * r * 0.86,
            r * 0.61,
            r * 0.72,
            r * 0.76,
          );
        }
      }
      const noise = new Float32Array(32 ** 3);
      for (let i = 0; i < noise.length; i++) noise[i] = random() - 0.5;
      const at = (x, y, z) => noise[(x & 31) + ((y & 31) << 5) + ((z & 31) << 10)];
      const mix = (a, b, t) => a + (b - a) * t;
      function smoothNoise(x, y, z) {
        const ix = Math.floor(x),
          iy = Math.floor(y),
          iz = Math.floor(z);
        let u = x - ix,
          v = y - iy,
          w = z - iz;
        u *= u * (3 - 2 * u);
        v *= v * (3 - 2 * v);
        w *= w * (3 - 2 * w);
        return mix(
          mix(
            mix(at(ix, iy, iz), at(ix + 1, iy, iz), u),
            mix(at(ix, iy + 1, iz), at(ix + 1, iy + 1, iz), u),
            v,
          ),
          mix(
            mix(at(ix, iy, iz + 1), at(ix + 1, iy, iz + 1), u),
            mix(at(ix, iy + 1, iz + 1), at(ix + 1, iy + 1, iz + 1), u),
            v,
          ),
          w,
        );
      }
      for (let iz = 1; iz < depth - 1; iz++)
        for (let iy = 1; iy < height - 1; iy++)
          for (let ix = 1; ix < width - 1; ix++) {
            const x = (2 * ix) / (width - 1) - 1,
              y = (2 * iy) / (height - 1) - 1,
              z = (2 * iz) / (depth - 1) - 1;
            const px = x + 0.12 * smoothNoise(x * 3 + 2, y * 2, z * 2),
              py = y + 0.14 * smoothNoise(x * 3, y * 3 + 3, z * 3);
            let distance = 1;
            for (const [cx, cy, cz, rx, ry, rz, r] of knots) {
              const dx = (px - cx) * rx,
                dy = (py - cy) * ry,
                dz = (z - cz) * rz;
              const d = (Math.sqrt(dx * dx + dy * dy + dz * dz) - 1) * r;
              const blend = Math.max(0, 0.086 - Math.abs(d - distance));
              distance = Math.min(distance, d) - (blend * blend) / 0.344;
            }
            if (distance > 0.2) continue;
            const turbulence =
              0.52 * smoothNoise(px * 4, py * 3, z * 3) +
              0.26 * smoothNoise(x * 9 + 5, y * 7, z * 8) +
              0.13 * smoothNoise(x * 19, y * 13, z * 14);
            const fade = Math.min(1, (1 - Math.abs(x)) * 12, (1 - Math.abs(z)) * 9);
            field[ix + width * (iy + height * iz)] =
              Math.max(0, Math.min(1, 0.35 - distance * 4.6 + turbulence)) * fade;
          }
      for (let iz = 0; iz < depth; iz++)
        for (let iy = 0; iy < height; iy++)
          for (let ix = 0; ix < width; ix++) {
            const density = field[ix + width * (iy + height * iz)];
            if (density === 0) continue;
            let opticalDepth = 0;
            for (let t = 1; t < 22; t++) {
              const x = ix - Math.round(t * 0.75),
                y = iy + t,
                z = iz - Math.round(t * 0.45);
              if (x < 0 || y >= height || z < 0) break;
              opticalDepth += field[x + width * (y + height * z)];
            }
            const light = 0.21 + 0.79 * Math.exp(-opticalDepth * 0.38);
            const tx = (iz % 8) * width + ix,
              ty = (variant * 4 + (iz >> 3)) * height + iy;
            const i = 2 * (ty * (width * 8) + tx);
            pixels[i] = density * 255;
            pixels[i + 1] = light * 255;
          }
    }
    atlas = pixels;
    return atlas;
  }

  const vertex = `
    attribute vec3 corner;
    uniform vec3 center,extent,eye,rightDir,upDir,forwardDir;
    uniform vec2 lens;
    varying vec3 local;
    void main(){
      local=corner+.5;
      vec3 d=center+corner*extent-eye;
      float z=dot(d,forwardDir);
      gl_Position=vec4(dot(d,rightDir)*lens.x,dot(d,upDir)*lens.y,1.001*z-.12,z);
    }`;
  const fragment = `
    precision highp float;
    uniform sampler2D volume;
    uniform vec3 localEye,lit,shade,air;
    uniform float variant,haze;
    varying vec3 local;
    vec2 readSlice(vec2 xy,float z) {
      vec2 tile=vec2(mod(z,8.),floor(z/8.)+variant*4.);
      vec2 uv=(tile*vec2(48.,32.)+.5+xy*vec2(47.,31.))/vec2(384.,512.);
      return texture2D(volume,uv).ra;
    }
    void main(){
      vec3 ray=normalize(local-localEye);
      vec3 direction=sign(ray+vec3(.000001))*max(abs(ray),vec3(.00001));
      vec3 start=clamp(local,0.,1.);
      vec3 exits=(step(vec3(0.),ray)-start)/direction;
      float lengthInside=max(0.,min(min(exits.x,exits.y),exits.z));
      float stride=lengthInside/24.;
      vec3 p=start+ray*stride*.5;
      vec3 sum=vec3(0.);float transmission=1.;
      for(int j=0;j<24;j++){
        float slice=clamp(p.z,0.,1.)*31.;
        vec2 medium=mix(readSlice(clamp(p.xy,0.,1.),floor(slice)),readSlice(clamp(p.xy,0.,1.),min(31.,floor(slice)+1.)),fract(slice));
        float opacity=1.-exp(-medium.x*stride*12.);
        vec3 scattered=mix(shade,lit,clamp(medium.y+.08*(p.y-.45),0.,1.));
        sum+=transmission*opacity*mix(scattered,air,haze);
        transmission*=1.-opacity;
        if(transmission<.014)break;
        p+=ray*stride;
      }
      if(transmission>.995)discard;
      gl_FragColor=vec4(sum,1.-transmission);
    }`;
  function cube() {
    const out = [];
    for (let axis = 0; axis < 3; axis++)
      for (const sign of [-1, 1]) {
        const corner = (u, v) => {
          const p = [0, 0, 0];
          p[axis] = sign * 0.5;
          p[(axis + 1) % 3] = u * 0.5;
          p[(axis + 2) % 3] = v * 0.5;
          return p;
        };
        const a = corner(-1, -1),
          b = corner(1, -1),
          c = corner(1, 1),
          d = corner(-1, 1);
        out.push(...a, ...(sign > 0 ? b : d), ...c, ...a, ...c, ...(sign > 0 ? d : b));
      }
    return new Float32Array(out);
  }

  class CloudRenderer {
    constructor(gl) {
      this.gl = gl;
      const program = gl.createProgram();
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertex],
        [gl.FRAGMENT_SHADER, fragment],
      ]) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
        gl.attachShader(program, shader);
        gl.deleteShader(shader);
      }
      gl.bindAttribLocation(program, 0, 'corner');
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
      this.program = program;
      this.u = {};
      for (const name of [
        'center',
        'extent',
        'eye',
        'rightDir',
        'upDir',
        'forwardDir',
        'lens',
        'localEye',
        'lit',
        'shade',
        'air',
        'volume',
        'variant',
        'haze',
      ])
        this.u[name] = gl.getUniformLocation(program, name);
      this.box = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.box);
      gl.bufferData(gl.ARRAY_BUFFER, cube(), gl.STATIC_DRAW);
      this.texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.LUMINANCE_ALPHA,
        384,
        512,
        0,
        gl.LUMINANCE_ALPHA,
        gl.UNSIGNED_BYTE,
        cloudVolume(),
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.activeTexture(gl.TEXTURE0);
    }
    draw(world, list, camera, right, up, forward, aspect) {
      if (!list.length) return;
      const gl = this.gl,
        u = this.u;
      gl.useProgram(this.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.box);
      gl.disableVertexAttribArray(world.normal);
      gl.disableVertexAttribArray(world.pos);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.uniform1i(u.volume, 1);
      gl.uniform3fv(u.eye, camera);
      gl.uniform3fv(u.rightDir, right);
      gl.uniform3fv(u.upDir, up);
      gl.uniform3fv(u.forwardDir, forward);
      gl.uniform2f(u.lens, 1.39 / aspect, 1.39);
      gl.uniform3fv(u.air, world.colors.get(world.course.fog));
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      // This camera projects along +Z, reversing the usual WebGL screen winding.
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
      list.sort((a, b) => b.depth - a.depth);
      for (const cloud of list) {
        const { p, s, color, variant } = cloud;
        gl.uniform3fv(u.center, p);
        gl.uniform3fv(u.extent, s);
        gl.uniform3fv(
          u.localEye,
          camera.map((v, i) => (v - p[i]) / s[i] + 0.5),
        );
        gl.uniform1f(u.variant, variant);
        gl.uniform1f(u.haze, Math.min(0.82, Math.max(0, cloud.depth - 12) * 0.008));
        gl.uniform3fv(u.lit, color);
        gl.uniform3fv(u.shade, world.cloudShade);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
      }
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.disableVertexAttribArray(0);
      gl.enableVertexAttribArray(world.pos);
      gl.enableVertexAttribArray(world.normal);
      gl.useProgram(world.program);
      world.lastMesh = null;
    }
  }
  window.FluffClouds = CloudRenderer;
})();
