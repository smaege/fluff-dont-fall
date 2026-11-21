(() => {
  'use strict';

  const reach = 38;
  const deadZone = 5;
  const tapSlop = 12;
  const tapDuration = 450;
  const lookSensitivity = 0.0055;

  class TouchControls {
    constructor(canvas, running, look, jump) {
      this.stick = document.getElementById('touch-stick');
      this.jumpButton = document.getElementById('touch-jump');
      this.steering = null;
      this.looking = null;
      this.forward = 0;
      this.side = 0;

      function contact(event) {
        return {
          id: event.pointerId,
          target: event.currentTarget,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
        };
      }
      for (const target of [canvas, this.jumpButton]) {
        target.addEventListener('pointerdown', (event) => {
          if (event.pointerType !== 'touch' || !running()) return;
          event.preventDefault();
          const bounds = canvas.getBoundingClientRect();
          const onLeft = target === canvas && event.clientX < bounds.left + bounds.width / 2;
          const hand = onLeft ? 'steering' : 'looking';
          if (this[hand]) return;
          this[hand] = contact(event);
          target.setPointerCapture(event.pointerId);
          (onLeft ? this.stick : this.jumpButton).setAttribute('data-held', '');
          if (target === this.jumpButton) jump();
        });
        target.addEventListener('pointermove', (event) => {
          if (!running()) return;
          const steer = this.steering;
          if (steer?.id === event.pointerId) {
            this.steer(event.clientX - steer.x, event.clientY - steer.y);
          } else if (target === canvas && this.looking?.id === event.pointerId) {
            const aim = this.looking;
            const dx = event.clientX - aim.x, dy = event.clientY - aim.y;
            if (!aim.dragged && Math.hypot(dx, dy) <= tapSlop) return;
            aim.dragged = true;
            this.jumpButton.removeAttribute('data-held');
            look(dx, dy, lookSensitivity);
            aim.x = event.clientX;
            aim.y = event.clientY;
          }
        });
        target.addEventListener('pointerup', (event) => {
          const aim = this.looking;
          const tap = target === canvas && aim?.id === event.pointerId && !aim.dragged &&
            Math.hypot(event.clientX - aim.x, event.clientY - aim.y) <= tapSlop &&
            event.timeStamp - aim.time <= tapDuration;
          this.release(event.pointerId);
          if (tap && running()) jump();
        });
        for (const event of ['pointercancel', 'lostpointercapture']) {
          target.addEventListener(event, (e) => this.release(e.pointerId));
        }
      }
      this.jumpButton.addEventListener('click', (event) => {
        // Pointer events handle touch. Keep activation by keyboard or mouse.
        if (running() && (event.detail === 0 || event.pointerType === 'mouse')) jump();
      });
      window.addEventListener('orientationchange', () => this.clear());
    }

    steer(dx, dy) {
      const distance = Math.hypot(dx, dy);
      const travel = Math.min(1, Math.max(0, (distance - deadZone) / (reach - deadZone)));
      // The centre has extra room for small corrections; a full tilt keeps running speed.
      const scale = travel ** 1.35 / (distance || 1);
      this.side = travel ? dx * scale : 0;
      this.forward = travel ? -dy * scale : 0;
      this.stick.style.setProperty('--stick-x', this.side);
      this.stick.style.setProperty('--stick-y', -this.forward);
    }

    release(id) {
      if (this.steering?.id === id) {
        this.steering = null;
        this.stick.removeAttribute('data-held');
        this.steer(0, 0);
      }
      if (this.looking?.id === id) {
        this.looking = null;
        this.jumpButton.removeAttribute('data-held');
      }
    }

    clear() {
      for (const pointer of [this.steering, this.looking]) {
        if (!pointer) continue;
        this.release(pointer.id);
        if (pointer.target.hasPointerCapture(pointer.id)) pointer.target.releasePointerCapture(pointer.id);
      }
    }
  }

  window.FluffTouchControls = TouchControls;
})();
