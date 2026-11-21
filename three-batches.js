(() => {
  'use strict';
  const vertex = `
    precision highp float;
    in vec3 position,normal,instanceColor;
    in mat4 instanceMatrix;
    in vec4 instanceFabric;
    uniform vec3 camera,rightDir,upDir,forwardDir;
    uniform vec2 lens;
    out vec3 vNormal,vPos,vLocal,vFabric,vGrainNormal;
    out float vDepth;
    flat out vec3 batchColor;
    flat out float batchMaterial;
    void main(){
      vec3 x=instanceMatrix[0].xyz,y=instanceMatrix[1].xyz,z=instanceMatrix[2].xyz;
      vec3 world=(instanceMatrix*vec4(position,1.)).xyz;
      vNormal=normalize(cross(y,z)*normal.x+cross(z,x)*normal.y+cross(x,y)*normal.z);
      vGrainNormal=normalize(normal/instanceFabric.xyz);
      vLocal=position;vPos=world;vFabric=position*instanceFabric.xyz;
      batchColor=instanceColor;batchMaterial=instanceFabric.w;
      vec3 d=world-camera;vDepth=dot(d,forwardDir);
      gl_Position=vec4(dot(d,rightDir)*lens.x,dot(d,upDir)*lens.y,1.001*vDepth-.12,vDepth);
    }`;

  class ThreeBatches {
    constructor(canvas, gl, fragment, tiles) {
      const three = window.FluffThree;
      this.renderer = new three.WebGLRenderer({ canvas, context: gl, alpha: true });
      this.renderer.autoClear = false;
      this.renderer.sortObjects = false;
      this.scene = new three.Scene();
      this.camera = new three.Camera();
      this.matrix = new three.Matrix4();
      this.groups = new Map();
      this.uniforms = {
        camera: { value: new three.Vector3() },
        rightDir: { value: new three.Vector3() },
        upDir: { value: new three.Vector3() },
        forwardDir: { value: new three.Vector3() },
        lens: { value: new three.Vector2() },
        fog: { value: new three.Vector3() },
        sceneTime: { value: 0 },
        slideSparkleTime: { value: 0 },
      };
      for (const [name, tile] of Object.entries(tiles)) {
        const texture = new three.CanvasTexture(tile);
        texture.flipY = false;
        texture.wrapS = texture.wrapT = three.RepeatWrapping;
        this.uniforms[name] = { value: texture };
      }
      this.material = new three.RawShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        glslVersion: three.GLSL3,
        defines: { FLUFF_INSTANCED: 1 },
        uniforms: this.uniforms,
        side: three.DoubleSide,
        depthFunc: three.LessDepth,
      });
    }

    resize(width, height) {
      this.renderer.setSize(width, height, false);
    }

    begin() {
      for (const group of this.groups.values()) group.items.length = 0;
    }

    add(name, vertices, position, size, color, angle, material, plane) {
      let group = this.groups.get(name);
      if (!group) {
        group = { items: [], vertices, capacity: 0, mesh: null };
        this.groups.set(name, group);
      }
      group.items.push({ position, size, color, angle, material, plane });
    }

    reserve(group) {
      const three = window.FluffThree;
      if (group.mesh) {
        this.scene.remove(group.mesh);
        group.mesh.geometry.dispose();
        group.mesh.dispose();
      }
      group.capacity = Math.max(8, 2 ** Math.ceil(Math.log2(group.items.length)));
      const geometry = new three.BufferGeometry();
      const vertices = new three.InterleavedBuffer(group.vertices, 6);
      geometry.setAttribute('position', new three.InterleavedBufferAttribute(vertices, 3, 0));
      geometry.setAttribute('normal', new three.InterleavedBufferAttribute(vertices, 3, 3));
      geometry.setAttribute('instanceFabric',
        new three.InstancedBufferAttribute(new Float32Array(group.capacity * 4), 4).setUsage(three.DynamicDrawUsage));
      const mesh = new three.InstancedMesh(geometry, this.material, group.capacity);
      mesh.instanceMatrix.setUsage(three.DynamicDrawUsage);
      mesh.instanceColor = new three.InstancedBufferAttribute(new Float32Array(group.capacity * 3), 3)
        .setUsage(three.DynamicDrawUsage);
      // The shader uses the game's projection, and gameplay already filters the draw list.
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      group.mesh = mesh;
    }

    render(view, fog, time, slideSparkleTime) {
      let count = 0;
      for (const group of this.groups.values()) {
        const length = group.items.length;
        if (!length) {
          if (group.mesh) group.mesh.count = 0;
          continue;
        }
        if (length > group.capacity) this.reserve(group);
        const mesh = group.mesh;
        const fabric = mesh.geometry.getAttribute('instanceFabric');
        for (let i = 0; i < length; i++) {
          const { position: [x, y, z], size: [width, height, depth], color, angle, material, plane } = group.items[i];
          const [sx, sz, base] = plane;
          const c = Math.cos(angle), s = Math.sin(angle);
          this.matrix.set(
            c * width, -s * height, 0, x,
            (s + sx * c) * width, (c - sx * s) * height, sz * depth, y + sx * x + sz * z + base,
            0, 0, depth, z,
            0, 0, 0, 1,
          );
          mesh.setMatrixAt(i, this.matrix);
          mesh.instanceColor.setXYZ(i, ...color);
          fabric.setXYZW(i, width, height, depth, material);
        }
        mesh.count = length;
        mesh.instanceMatrix.needsUpdate = mesh.instanceColor.needsUpdate = fabric.needsUpdate = true;
        count += length;
      }
      if (!count) return false;
      const u = this.uniforms;
      u.camera.value.fromArray(view.camera);
      u.rightDir.value.fromArray(view.right);
      u.upDir.value.fromArray(view.up);
      u.forwardDir.value.fromArray(view.forward);
      u.lens.value.set(view.lensX, view.lensY);
      u.fog.value.fromArray(fog);
      u.sceneTime.value = time;
      u.slideSparkleTime.value = slideSparkleTime;
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      return true;
    }
  }

  window.FluffThreeBatches = ThreeBatches;
})();
