(() => {
  'use strict';

  const reach = 44;
  const deadZone = 6;
  const tapSlop = 12;
  const tapDuration = 450;
  const lookSensitivity = 0.0065;

  function axis(delta) {
    if (Math.abs(delta) <= deadZone) return 0;
    const amount = Math.min(1, (Math.abs(delta) - deadZone) / (reach - deadZone));
    return amount * Math.sign(delta);
  }

  class TouchControls {
    constructor(canvas, running, look, jump) {
      this.stick = document.getElementById('touch-stick');
      this.jumpButton = document.getElementById('touch-jump');
      this.steering = null;
      this.looking = null;
      this.forward = 0;
      this.turn = 0;

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
        });
        target.addEventListener('pointermove', (event) => {
          if (!running()) return;
          const steer = this.steering;
          if (steer?.id === event.pointerId) {
            this.steer(event.clientX - steer.x, event.clientY - steer.y);
          } else if (this.looking?.id === event.pointerId) {
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
          const tap = aim?.id === event.pointerId && !aim.dragged &&
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
        // Touch uses pointerup to distinguish taps from camera drags.
        if (running() && (event.detail === 0 || event.pointerType === 'mouse')) jump();
      });
      window.addEventListener('orientationchange', () => this.clear());
    }

    steer(dx, dy) {
      this.turn = axis(dx);
      this.forward = axis(-dy);
      const scale = Math.max(1, Math.hypot(this.turn, this.forward));
      this.stick.style.setProperty('--stick-x', this.turn / scale);
      this.stick.style.setProperty('--stick-y', -this.forward / scale);
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
