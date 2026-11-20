(() => {
  'use strict';

  const canvas = document.getElementById('portal-passage');
  const tau = Math.PI * 2;
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smooth = (n) => {
    const t = clamp(n);
    return t * t * (3 - 2 * t);
  };
  let flight = null;

  function cancel() {
    if (flight) cancelAnimationFrame(flight.frame);
    flight = null;
    canvas.hidden = true;
  }

  function paint(ctx, from, to, origin, progress, reduced) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(1.25, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(w * scale) || canvas.height !== Math.round(h * scale)) {
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const ease = smooth(progress);
    const x = (origin.x + (0.5 - origin.x) * ease) * w;
    const y = (origin.y + (0.5 - origin.y) * ease) * h;
    const span = Math.hypot(w, h) * 0.78;
    const veil = smooth(progress / 0.49) * smooth((1 - progress) / 0.48);
    const sky = ctx.createRadialGradient(x, y, 0, x, y, span);
    sky.addColorStop(0, to.sky[1]);
    sky.addColorStop(0.38, to.fabric[0]);
    sky.addColorStop(0.76, from.side);
    sky.addColorStop(1, to.side);
    ctx.globalAlpha = veil;
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (reduced) return;

    // Seams curve towards a shared vanishing point. Successive stitches stretch
    // apart as they pass the camera, keeping the centre of the opening legible.
    const strength = smooth(progress / 0.22) * smooth((1 - progress) / 0.32);
    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    // The three ribbons continue the thread spiral woven into the 3D gate.
    const radius = (t) => span * (0.027 + t * t * (0.95 + progress * 0.67));
    for (let ribbon = 0; ribbon < 3; ribbon++) {
      const ink = ctx.createRadialGradient(0, 0, span * 0.028, 0, 0, span);
      ink.addColorStop(0, to.fabric[1]);
      ink.addColorStop(0.42, ribbon === 1 ? from.side : to.side);
      ink.addColorStop(1, ribbon === 1 ? '#fff1c7' : to.fabric[2]);
      ctx.strokeStyle = ink;
      const angle = ribbon * tau / 3 - progress * 0.8;
      for (let segment = 0; segment < 32; segment++) {
        const a = segment / 32, b = (segment + 1) / 32;
        ctx.globalAlpha = strength * (0.15 + a * 0.32);
        ctx.lineWidth = 0.8 + h * 0.025 * b * b;
        ctx.beginPath();
        ctx.moveTo(radius(a) * Math.cos(angle + 3.4 * a), radius(a) * Math.sin(angle + 3.4 * a));
        ctx.lineTo(radius(b) * Math.cos(angle + 3.4 * b), radius(b) * Math.sin(angle + 3.4 * b));
        ctx.stroke();
      }
    }
    for (let lane = 0; lane < 18; lane++) {
      const angle = lane * tau / 18 + 0.09 * Math.sin(lane * 2.1);
      for (let stitch = 0; stitch < 8; stitch++) {
        const depth = (stitch + ((progress * 4.1 + lane * 0.618) % 1)) / 8;
        const tail = depth + 0.035 + 0.016 * depth;
        const r = span * depth * depth;
        const end = span * tail * tail;
        const a = angle + 0.83 * depth + 0.18 * progress;
        const b = a + 0.83 * (tail - depth);
        ctx.globalAlpha = strength * depth * (lane % 3 === 0 ? 0.8 : 0.5);
        ctx.strokeStyle = lane % 3 === 0 ? '#fff4cf' : to.fabric[lane % to.fabric.length];
        ctx.lineWidth = (0.8 + depth * depth * 5) * Math.min(1.3, h / 680);
        ctx.beginPath();
        ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
        ctx.quadraticCurveTo(
          (r + end) / 2 * Math.cos(a), (r + end) / 2 * Math.sin(a),
          end * Math.cos(b), end * Math.sin(b),
        );
        ctx.stroke();
      }
    }
    // A few pinpricks of light catch the silk between the stitched seams.
    ctx.fillStyle = '#fff7d9';
    for (let i = 0; i < 19; i++) {
      const depth = (i * 0.38197 + ease * 0.54) % 1;
      const a = i * 2.4 + 0.78 * depth;
      const r = span * depth * depth;
      const size = Math.min(8, h * 0.009) * depth + 1;
      ctx.save();
      ctx.translate(r * Math.cos(a), r * Math.sin(a));
      ctx.rotate(a / 3);
      ctx.globalAlpha = strength * Math.sin(Math.PI * depth) * 0.82;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size * 0.72, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size * 0.72, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function play(from, to, origin, swap, arrive) {
    cancel();
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      swap();
      arrive();
      return;
    }
    canvas.hidden = false;
    const trip = { frame: 0 };
    flight = trip;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const half = reduced ? 145 : 530;
    let started, swapped = false;
    function frame(now) {
      if (flight !== trip) return;
      started ??= now;
      const part = clamp((now - started) / half);
      paint(ctx, from, to, origin, (Number(swapped) + part) / 2, reduced);
      if (part === 1) {
        if (swapped) {
          cancel();
          arrive();
          return;
        }
        swap();
        if (flight !== trip) return;
        swapped = true;
        // Rendering a newly loaded course may take a frame. Start the reveal
        // from its first painted frame, independently of the setup duration.
        started = undefined;
      }
      trip.frame = requestAnimationFrame(frame);
    }
    frame(performance.now());
  }

  window.FluffPortalTravel = { play, cancel };
})();
