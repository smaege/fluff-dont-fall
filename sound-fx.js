(() => {
  'use strict';

  const sampleRate = 24000;
  const tau = Math.PI * 2;
  const lerp = (from, to, progress) => from + (to - from) * progress;
  const ease = (progress) => progress * progress * (3 - 2 * progress);
  const pitchAt = (from, crest, to, progress) =>
    progress < 0.36
      ? lerp(from, crest, ease(progress / 0.36))
      : lerp(crest, to, ease((progress - 0.36) / 0.64));

  function layer(samples, at, duration, level, attack, decay, sample) {
    const start = Math.round(at * sampleRate);
    const length = Math.round(duration * sampleRate);
    for (let i = 0; i < length; i++) {
      const progress = i / length;
      const rise = Math.min(1, i / (attack * sampleRate));
      const fall = Math.min(1, (1 - progress) / (1 - attack / duration));
      samples[start + i] += level * ease(rise) * fall ** decay * sample(progress, i / sampleRate);
    }
  }

  function synthesize(samples) {
    function tone(at, duration, pitch, level, { color = 0, attack = 0.007, decay = 3, flutter = 0 } = {}) {
      const [from, crest = from, to = crest] = pitch;
      let phase = 0;
      layer(samples, at, duration, level, attack, decay, (progress, time) => {
        phase += tau * pitchAt(from, crest, to, progress) / sampleRate;
        const harmonic = Math.sin(phase * 2) * 0.65 + Math.sin(phase * 3) * 0.35;
        const tremolo = flutter ? 0.71 + 0.29 * Math.sin(tau * flutter * time) : 1;
        return (Math.sin(phase) + color * harmonic) * tremolo;
      });
    }

    // Moving vowel resonances give each stylized animal call a different mouth shape.
    function call(at, duration, pitch, level, formants, { attack = 0.013, decay = 1.7, wobble = 0.023 } = {}) {
      const [from, crest, to] = pitch;
      const [firstStart, firstEnd, secondStart, secondEnd] = formants;
      let phase = 0;
      layer(samples, at, duration, level, attack, decay, (progress, time) => {
        const frequency = pitchAt(from, crest, to, progress) * (1 + wobble * Math.sin(tau * 26 * time));
        const first = lerp(firstStart, firstEnd, progress);
        const second = lerp(secondStart, secondEnd, progress);
        phase += tau * frequency / sampleRate;
        let value = Math.sin(phase) * 0.54;
        for (let harmonic = 2; harmonic <= 10; harmonic++) {
          const partial = frequency * harmonic;
          const mouth = 1 / (1 + ((partial - first) / 270) ** 2);
          const nose = 1 / (1 + ((partial - second) / 390) ** 2);
          value += Math.sin(phase * harmonic) * (mouth + 0.46 * nose) / harmonic;
        }
        return value;
      });
    }

    function noise(at, duration, sweep, level, { attack = 0.004, decay = 3, resonance = 0.85, flutter = 0 } = {}) {
      const [from, crest = from, to = crest] = sweep.map((hz) => Math.tan(Math.PI * hz / sampleRate));
      let seed = 0x2b6ef45d + Math.round((at + duration) * sampleRate);
      let band = 0;
      let low = 0;
      layer(samples, at, duration, level, attack, decay, (progress, time) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const white = seed / 2147483648 - 1;
        const cutoff = pitchAt(from, crest, to, progress);
        // State-variable bandpass. The moving center follows the material's motion.
        const nextBand = (band + cutoff * (white - low)) / (1 + cutoff * (cutoff + resonance));
        const nextLow = low + cutoff * nextBand;
        band = 2 * nextBand - band;
        low = 2 * nextLow - low;
        const tremolo = flutter ? 0.54 + 0.46 * Math.sin(tau * flutter * time) : 1;
        return nextBand * tremolo;
      });
    }

    function tap(at, pitch, level) {
      tone(at, 0.085, [pitch, pitch * 0.94, pitch * 0.81], level, { attack: 0.002 });
      tone(at, 0.033, [pitch * 2.6], level * 0.36, { attack: 0.002 });
      noise(at, 0.034, [1100, 800, 330], level * 1.25);
    }

    function jingle(at, pitch, level, duration) {
      tone(at, duration, [pitch], level, { attack: 0.003, decay: 2 });
      tone(at, duration * 0.56, [pitch * 2.73], level * 0.34, { attack: 0.002, decay: 3.4 });
      tone(at, duration * 0.32, [pitch * 4.08], level * 0.14, { attack: 0.002, decay: 4 });
    }

    return { tone, call, noise, tap, jingle };
  }

  const bunny = [0.28, ({ tone, noise }) => {
    noise(0, 0.086, [1180, 1620, 790], 0.31, { attack: 0.012 });
    tone(0.027, 0.073, [690, 1010, 840], 0.13, { color: 0.3, attack: 0.012 });
    noise(0.102, 0.113, [1050, 1870, 740], 0.24, { attack: 0.015 });
    tone(0.122, 0.135, [730, 1250, 910], 0.1, { color: 0.24, attack: 0.016 });
  }];

  const recipes = {
    bun: bunny,
    bunny,
    bee: [0.4, ({ tone, noise }) => {
      tone(0, 0.365, [174, 227, 143], 0.145, { color: 0.76, attack: 0.052, decay: 1.45, flutter: 31 });
      tone(0.016, 0.351, [351, 458, 288], 0.067, { color: 0.78, attack: 0.055, decay: 1.8, flutter: 27 });
      noise(0.015, 0.37, [1270, 1980, 900], 0.155, { attack: 0.064, decay: 1.35, flutter: 38 });
    }],
    hedgehog: [0.34, ({ tone, noise }) => {
      for (const [at, frequency, level] of [[0, 820, 0.42], [0.066, 1210, 0.34], [0.166, 740, 0.33]]) {
        noise(at, 0.132, [frequency, frequency * 1.43, 320], level, { attack: 0.013, flutter: 42 });
      }
      tone(0.166, 0.16, [169, 209, 121], 0.105, { color: 0.5, flutter: 33 });
    }],
    moth: [0.36, ({ noise }) => {
      for (const [at, level] of [[0, 0.24], [0.078, 0.41], [0.149, 0.33], [0.228, 0.19]]) {
        noise(at, 0.116, [2840, 3970, 1370], level, { attack: 0.016, decay: 2.2 });
      }
    }],
    cat: [0.46, ({ call, noise }) => {
      call(0.01, 0.418, [437, 586, 272], 0.27, [960, 380, 2390, 1460], { attack: 0.038 });
      noise(0, 0.145, [880, 1340, 540], 0.105, { attack: 0.018 });
    }],
    dog: [0.37, ({ call, noise }) => {
      for (const [at, peak, level] of [[0, 402, 0.22], [0.155, 352, 0.2]]) {
        call(at, 0.182, [peak * 0.76, peak, 134], level, [1090, 550, 2240, 1270], { decay: 3, wobble: 0.065 });
        noise(at, 0.11, [860, 1260, 480], level * 1.35, { attack: 0.008 });
      }
    }],
    penguin: [0.4, ({ call, noise }) => {
      call(0, 0.145, [492, 609, 630], 0.21, [1180, 1010, 2220, 2110], { wobble: 0.056 });
      call(0.137, 0.242, [539, 719, 366], 0.225, [1340, 980, 2460, 1880], { wobble: 0.066 });
      noise(0.149, 0.164, [1860, 2620, 1010], 0.16, { attack: 0.022 });
    }],
    bear: [0.39, ({ call, noise }) => {
      call(0.012, 0.357, [112, 169, 96], 0.31, [540, 380, 1180, 680], { attack: 0.04, wobble: 0.17 });
      noise(0, 0.264, [420, 685, 270], 0.26, { attack: 0.029, flutter: 48 });
    }],
    fox: [0.37, ({ call, noise }) => {
      call(0, 0.234, [525, 952, 465], 0.205, [1300, 823, 2860, 2240], { wobble: 0.065 });
      call(0.172, 0.168, [470, 807, 395], 0.15, [1490, 810, 2640, 1960], { attack: 0.008 });
      noise(0, 0.141, [1470, 2410, 880], 0.19, { attack: 0.013 });
    }],
    frog: [0.39, ({ call, tone }) => {
      call(0, 0.172, [158, 228, 117], 0.24, [390, 710, 830, 1310], { wobble: 0.11 });
      tone(0.116, 0.236, [189, 147, 105], 0.127, { color: 0.75, flutter: 31, decay: 1.75 });
    }],
    axolotl: [0.31, ({ tone, noise }) => {
      // Bubbles are a character sound for the mostly silent axolotl.
      for (const [at, frequency] of [[0, 390], [0.052, 545], [0.117, 690]]) {
        tone(at, 0.112, [frequency, frequency * 1.47, frequency * 0.84], 0.13, { decay: 2.1 });
      }
      noise(0.104, 0.106, [700, 1800, 840], 0.15);
    }],
    deer: [0.34, ({ call, noise }) => {
      call(0, 0.309, [340, 516, 325], 0.24, [735, 830, 1520, 1680], { attack: 0.041, wobble: 0.014 });
      noise(0.04, 0.225, [1060, 1530, 730], 0.18, { attack: 0.05 });
    }],
    hurdle: [0.18, ({ noise, tap }) => {
      tap(0, 296, 0.155);
      tap(0.039, 430, 0.072);
      noise(0.04, 0.117, [1460, 1120, 360], 0.19);
    }],
    ball: [0.29, ({ tone, noise }) => {
      noise(0, 0.25, [260, 540, 210], 0.37, { attack: 0.026, flutter: 19, decay: 1.4 });
      tone(0.012, 0.148, [190, 154, 90], 0.12);
      tone(0.103, 0.128, [175, 143, 90], 0.102);
    }],
    pendulum: [0.39, ({ tone, noise, tap }) => {
      noise(0, 0.334, [410, 1540, 290], 0.36, { attack: 0.089, decay: 1.6, resonance: 0.64 });
      tone(0.061, 0.302, [156, 218, 103], 0.097, { color: 0.28, attack: 0.05, decay: 1.5 });
      tap(0.226, 226, 0.069);
    }],
    sweeper: [0.29, ({ tone, noise }) => {
      noise(0, 0.26, [670, 2560, 700], 0.36, { attack: 0.039, decay: 1.5, flutter: 35 });
      tone(0.03, 0.152, [230, 325, 178], 0.118, { color: 0.64, attack: 0.028, flutter: 34 });
    }],
    hoops: [0.27, ({ jingle, noise }) => {
      jingle(0, 615, 0.125, 0.164);
      jingle(0.058, 823, 0.108, 0.194);
      noise(0.025, 0.157, [1670, 1160, 2760], 0.25, { attack: 0.021, flutter: 24 });
    }],
    shutter: [0.32, ({ tap, jingle, noise }) => {
      noise(0, 0.18, [1230, 1610, 510], 0.35, { attack: 0.02, flutter: 48 });
      tap(0.11, 343, 0.13);
      tap(0.158, 182, 0.12);
      jingle(0.158, 608, 0.062, 0.136);
    }],
    jumpRope: [0.26, ({ tone, noise }) => {
      noise(0, 0.164, [1420, 4060, 950], 0.39, { attack: 0.03, decay: 1.5 });
      noise(0.111, 0.057, [3370, 2320, 740], 0.46, { attack: 0.003 });
      tone(0.104, 0.117, [318, 487, 204], 0.1, { color: 0.42, attack: 0.004 });
    }],
    zipperGate: [0.26, ({ noise, tap }) => {
      for (let tooth = 0; tooth < 9; tooth++) {
        noise(0.009 + 0.018 * tooth, 0.041, [2350 + 160 * tooth, 1830 + 160 * tooth, 1040], 0.36);
      }
      tap(0.164, 525, 0.104);
    }],
    pillowPress: [0.13, ({ tone, noise }) => {
      tone(0, 0.112, [177, 115, 77], 0.235, { color: 0.48, attack: 0.003, decay: 4.3 });
      noise(0, 0.053, [735, 520, 280], 0.43, { attack: 0.0015, decay: 3, resonance: 0.74 });
      noise(0, 0.127, [460, 345, 185], 0.22, { attack: 0.005, decay: 3.8 });
    }],
    gust: [0.44, ({ noise }) => {
      noise(0, 0.433, [280, 880, 330], 0.51, { attack: 0.079, decay: 1.65, resonance: 0.64 });
      noise(0.071, 0.313, [1390, 2060, 935], 0.27, { attack: 0.051, decay: 2.1, flutter: 17 });
    }],
    portal: [0.79, ({ tone, noise, jingle }) => {
      noise(0, 0.37, [420, 1750, 890], 0.276, { attack: 0.09, decay: 1.6 });
      tone(0.008, 0.55, [156, 221, 196], 0.117, { attack: 0.09, decay: 1.45 });
      tone(0.089, 0.6, [261.63], 0.093, { attack: 0.088, decay: 1.7 });
      jingle(0.114, 392, 0.073, 0.47);
      jingle(0.164, 523.25, 0.07, 0.51);
      jingle(0.23, 659.25, 0.079, 0.55);
    }],
  };

  const buffers = new Map();

  function bufferFor(context, cue) {
    if (!Object.hasOwn(recipes, cue)) return;
    const recipe = recipes[cue];
    if (buffers.has(recipe)) return buffers.get(recipe);

    const [duration, build] = recipe;
    const buffer = context.createBuffer(1, Math.ceil(duration * sampleRate), sampleRate);
    const samples = buffer.getChannelData(0);
    build(synthesize(samples));

    // Leave room for simultaneous effects, UI sounds and music on the same output.
    let peak = 0.22;
    for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
    const scale = 0.22 / peak;
    if (scale < 1) {
      for (let i = 0; i < samples.length; i++) samples[i] *= scale;
    }
    buffers.set(recipe, buffer);
    return buffer;
  }

  window.FluffSoundEffects = { bufferFor };
})();
