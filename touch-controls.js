(() => {
  'use strict';

  const reach = 46;
  const deadZone = 8;
  const axisDeadZone = Math.PI / 30;
  const rightAngle = Math.PI / 2;
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
          if (onLeft) {
            this.stick.style.setProperty('--stick-origin-x', (event.clientX - bounds.left) + 'px');
            this.stick.style.setProperty('--stick-origin-y', (event.clientY - bounds.top) + 'px');
          }
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
      const speed = travel ** 1.85;
      const angle = Math.atan2(-dy, dx);
      const axis = Math.round(angle / rightAngle) * rightAngle;
      const offset = angle - axis;
      // Give the four cardinal directions a small flat zone and blend into diagonals.
      const diagonal = rightAngle / 2;
      const blend = Math.max(0, Math.abs(offset) - axisDeadZone) / (diagonal - axisDeadZone);
      const direction = axis + Math.sign(offset) * diagonal * blend;
      this.side = Math.cos(direction) * speed;
      this.forward = Math.sin(direction) * speed;
      // The knob tracks the thumb independently of the movement curve.
      const visualReach = Math.max(distance, reach);
      this.stick.style.setProperty('--stick-x', dx / visualReach);
      this.stick.style.setProperty('--stick-y', dy / visualReach);
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
