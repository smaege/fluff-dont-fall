(() => {
  'use strict';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const animals = new Set(['bun', 'bee', 'hedgehog', 'moth']);

  function motion(hazard, pad) {
    if (hazard.gapX !== undefined) return hazard.gapX - pad.x;
    if (hazard.type === 'sweeper') return hazard.angle;
    // Relative coordinates keep the measured speed intact when Endless rebases the track.
    return hazard.z - (hazard.trackZ ?? pad.z);
  }

  function activePhase(hazard, previous, pose) {
    switch (hazard.type) {
      case 'bun':
        return hazard.wave > 0.42 || Math.abs(hazard.stride) > 0.54;
      case 'bee':
        return hazard.lift < 0.62;
      case 'moth':
        return hazard.lift < 0.42;
      case 'hedgehog':
        return hazard.curl > 0.45;
      case 'hoops':
      case 'zipperGate':
      case 'sweeper':
      case 'hurdle':
      case 'ball':
      case 'pendulum':
      case 'jumpRope':
        // In the middle of a swing the mechanism is moving at full speed.
        return (previous < 0 && pose >= 0) || (previous > 0 && pose <= 0);
      default:
        return false;
    }
  }

  function hazardSource(hazard, listener) {
    const { x, y, z } = hazard;
    const sourceY = clamp(listener.y + 0.65, hazard.minY ?? y, hazard.maxY ?? y);
    if (hazard.gapX !== undefined) return { x: hazard.gapX, y: sourceY, z };
    if (hazard.halfSpan > 0) {
      const angle = hazard.type === 'sweeper' ? hazard.angle : 0;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      const along = clamp((listener.x - x) * cos + (listener.z - z) * sin, -hazard.halfSpan, hazard.halfSpan);
      return { x: x + along * cos, y: sourceY, z: z + along * sin };
    }
    const halfWidth = (hazard.width || 0) / 2;
    return { x: clamp(listener.x, x - halfWidth, x + halfWidth), y: sourceY, z };
  }

  function spatial(listener, source, range) {
    const dx = source.x - listener.x, dz = source.z - listener.z;
    const dy = source.y - (listener.y + 0.65);
    const distance = Math.hypot(dx, dz, dy * 1.15);
    return {
      gain: Math.max(0, 1 - distance / range) ** 1.6,
      pan: 0.52 * clamp((dx * Math.cos(listener.yaw) - dz * Math.sin(listener.yaw)) / 5, -1, 1),
    };
  }

  class EncounterAudio {
    constructor() {
      this.hazards = new Map();
      this.lastPlayed = -Infinity;
    }

    tick(listener, pads, hazards, before, collision) {
      const { time } = listener;
      const dt = time - before;
      const offset = pads[0].index;
      let best = null;
      const consider = (cue, { gain, pan }, level, priority, sample = null) => {
        if (gain < 0.085) return;
        const volume = gain * level;
        const score = volume + priority * 0.55;
        if (!best || score > best.score) best = { cue, volume, pan, sample, score };
      };

      for (const hazard of hazards) {
        // Both halves of a gate share one cue. The second obstacle on a combined pad has its own phase.
        if (hazard.side === 1) continue;
        const pad = pads[hazard.at - offset];
        if (hazard.impactAt !== undefined) {
          // The same cycle drives the visible bottom of the press and its sound.
          // Walking up to a press that is already down must stay silent.
          const hitFloor = before < hazard.impactAt && hazard.impactAt <= time;
          if (hitFloor || (hazard === collision && hazard.descending)) {
            const source = hazardSource(hazard, listener);
            source.y = hazard.minY;
            const { gain, pan } = spatial(listener, source, 16);
            if (gain >= 0.04) {
              window.FluffSound.effect(hazard.type, gain, pan);
              this.lastPlayed = time;
            }
          }
          continue;
        }
        if (collision) continue;
        if (Math.abs(pad.z - listener.z) > pad.d / 2 + 8 || Math.abs(pad.x - listener.x) > pad.w / 2 + 8) continue;
        const key = `${hazard.at}:${hazard.type}`;
        const pose = motion(hazard, pad);
        const sample = this.hazards.get(key) ?? { pose, lastPlayed: -Infinity, pendingUntil: -Infinity };
        const active = activePhase(hazard, sample.pose, pose);
        sample.pose = pose;
        sample.seenAt = time;
        this.hazards.set(key, sample);

        const animal = animals.has(hazard.type);
        const range = animal ? 6.8 : 8.3;
        const source = hazardSource(hazard, listener);
        const position = spatial(listener, source, range);
        const nearby = position.gain >= 0.085;
        if (active && nearby && !sample.audible) sample.pendingUntil = time + 0.10;
        sample.audible = active && nearby;
        if (!sample.audible) sample.pendingUntil = -Infinity;

        if (time <= sample.pendingUntil && time - sample.lastPlayed >= (animal ? 1.4 : 0.85)) {
          consider(hazard.type, position, animal ? 0.72 : 0.82, animal ? 0 : 1, sample);
        }
      }
      for (const [key, sample] of this.hazards) if (time - sample.seenAt > dt * 1.01) this.hazards.delete(key);

      for (const pad of pads) {
        if (pad.kind !== 'gust' || Math.abs(listener.z - pad.z) > pad.d / 2 + 7) continue;
        const wind = window.FluffGust.wind(pad, time);
        if (Math.abs(wind) >= 1.05 && Math.abs(window.FluffGust.wind(pad, before)) < 1.05) {
          const source = { x: pad.x - Math.sign(wind) * pad.w * 0.38, y: pad.y + 1.78, z: pad.z + pad.d * 0.21 };
          consider('gust', spatial(listener, source, 7), 0.72, 1);
        }
      }

      if (best && !collision && time - this.lastPlayed >= 0.31) {
        this.lastPlayed = time;
        if (best.sample) {
          best.sample.lastPlayed = time;
          best.sample.pendingUntil = -Infinity;
        }
        window.FluffSound.effect(best.cue, best.volume, best.pan);
      }
    }
  }

  window.FluffEncounterAudio = EncounterAudio;
})();
