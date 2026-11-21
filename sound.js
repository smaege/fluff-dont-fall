(() => {
  'use strict';

  const soundPreferenceKey = 'fluff-sound';
  const musicPreferenceKey = 'fluff-music';
  const maxVoices = 4;
  const maxEffects = 4;
  const cues = {
    click: [[660, 0, 0.09, 0.09]],
    gift: [
      [260, 0, 0.115, 0.17, 65],
      [740, 0.045, 0.1, 0.08],
      [932, 0.105, 0.14, 0.09],
      [1245, 0.19, 0.26, 0.08],
    ],
    star: [
      [520, 0, 0.073, 0.12, 145],
      [880, 0.018, 0.11, 0.09],
      [1320, 0.075, 0.17, 0.075],
    ],
    life: [
      [520, 0, 0.073, 0.12, 145],
      [659, 0, 0.15, 0.09],
      [831, 0.09, 0.18, 0.09],
      [1047, 0.19, 0.3, 0.08],
    ],
    jump: [
      [440, 0, 0.12, 0.1],
      [660, 0.055, 0.15, 0.09],
    ],
    spin: [
      [587, 0, 0.1, 0.08],
      [784, 0.045, 0.13, 0.08],
      [988, 0.1, 0.17, 0.07],
    ],
    fall: [
      [494, 0, 0.17, 0.09],
      [392, 0.08, 0.17, 0.08],
      [294, 0.16, 0.24, 0.07],
    ],
    win: [
      [523, 0, 0.22, 0.09],
      [659, 0.09, 0.22, 0.09],
      [784, 0.18, 0.34, 0.1],
    ],
  };

  const instruments = {
    bell: {
      type: 'sine',
      attack: 0.009,
      decay: 0.07,
      sustain: 0.25,
      volume: 0.12,
      partial: [2.03, 0.24, 0.15],
    },
    toyPiano: {
      type: 'triangle',
      attack: 0.008,
      decay: 0.045,
      sustain: 0.27,
      volume: 0.104,
      partial: [3, 0.14, 0.09],
    },
    flute: {
      type: 'sine',
      attack: 0.07,
      decay: 0.18,
      sustain: 0.74,
      volume: 0.102,
      partial: [2, 0.13, 0.3],
    },
    marimba: {
      type: 'sine',
      attack: 0.007,
      decay: 0.035,
      sustain: 0.22,
      volume: 0.12,
      partial: [3.98, 0.28, 0.08],
    },
    wood: { type: 'triangle', attack: 0.014, decay: 0.09, sustain: 0.34, volume: 0.092 },
    glass: {
      type: 'sine',
      attack: 0.024,
      decay: 0.11,
      sustain: 0.51,
      volume: 0.104,
      partial: [2.72, 0.23, 0.24],
    },
    bass: { type: 'sine', attack: 0.014, decay: 0.09, sustain: 0.47, volume: 0.105 },
    pluck: { type: 'triangle', attack: 0.01, decay: 0.055, sustain: 0.32, volume: 0.085 },
    pad: { type: 'sine', attack: 0.22, decay: 0.3, sustain: 0.72, volume: 0.037 },
    harmony: { type: 'triangle', attack: 0.014, decay: 0.065, sustain: 0.26, volume: 0.035 },
  };

  // Each bar contains melody, bass and optional harmony parts.
  // Notes are [beat within the bar, MIDI pitch or chord, duration in beats].
  const scores = {
    cloud: {
      tempo: 104,
      beatsPerBar: 4,
      parts: ['bell', 'bass'],
      bars: [
        [
          [
            [0, 72, 0.45],
            [0.5, 76, 0.8],
            [1.5, 79, 0.8],
            [2.5, 76, 0.8],
            [3.5, 74, 0.45],
          ],
          [
            [0, 48, 1.5],
            [2, 55, 1.5],
          ],
        ],
        [
          [
            [0, 74, 0.8],
            [1, 71, 0.45],
            [1.5, 67, 0.8],
            [3, 71, 0.8],
          ],
          [
            [0, 47, 1.5],
            [2, 55, 1.5],
          ],
        ],
        [
          [
            [0, 72, 0.45],
            [0.5, 76, 0.8],
            [1.5, 81, 0.8],
            [2.5, 79, 0.8],
            [3.5, 76, 0.45],
          ],
          [
            [0, 45, 1.5],
            [2, 52, 1.5],
          ],
        ],
        [
          [
            [0, 77, 0.8],
            [1, 76, 0.45],
            [1.5, 74, 0.8],
            [3, 72, 0.8],
          ],
          [
            [0, 41, 1.5],
            [2, 48, 1.5],
          ],
        ],
        [
          [
            [0, 72, 0.45],
            [0.5, 76, 0.8],
            [1.5, 79, 0.8],
            [2.5, 84, 0.8],
            [3.5, 83, 0.45],
          ],
          [
            [0, 48, 1.5],
            [2, 55, 1.5],
          ],
        ],
        [
          [
            [0, 81, 0.8],
            [1, 77, 0.45],
            [1.5, 74, 0.8],
            [3, 76, 0.8],
          ],
          [
            [0, 50, 1.5],
            [2, 45, 1.5],
          ],
        ],
        [
          [
            [0, 74, 0.45],
            [0.5, 79, 0.8],
            [1.5, 77, 0.8],
            [2.5, 74, 0.8],
            [3.5, 71, 0.45],
          ],
          [
            [0, 43, 1.5],
            [2, 50, 1.5],
          ],
        ],
        [
          [
            [0, 72, 1.1],
            [1.5, 67, 0.8],
            [2.5, 64, 0.8],
            [3.5, 67, 0.45],
          ],
          [
            [0, 48, 1.5],
            [2, 55, 1.5],
          ],
        ],
      ],
    },
    candy: {
      // Bb major waltz with a toy piano and staccato chord answers.
      tempo: 138,
      level: 1.35,
      beatsPerBar: 3,
      parts: ['toyPiano', 'pluck', 'harmony'],
      bars: [
        [
          [
            [0, 77, 0.6],
            [1, 77, 0.4],
            [1.5, 79, 0.4],
            [2, 82, 0.7],
          ],
          [[0, 46, 0.75]],
          [
            [1, [62, 65], 0.43],
            [2, [62, 65], 0.43],
          ],
        ],
        [
          [
            [0, 81, 0.42],
            [0.5, 77, 0.42],
            [1, 74, 1.35],
          ],
          [[0, 50, 0.75]],
          [
            [1, [58, 65], 0.43],
            [2, [58, 65], 0.43],
          ],
        ],
        [
          [
            [0, 75, 0.55],
            [1, 79, 0.55],
            [2, 82, 0.43],
            [2.5, 84, 0.43],
          ],
          [[0, 51, 0.75]],
          [
            [1, [58, 67], 0.43],
            [2, [58, 67], 0.43],
          ],
        ],
        [
          [
            [0, 84, 0.55],
            [1, 81, 0.48],
            [2, 77, 0.65],
          ],
          [[0, 53, 0.75]],
          [
            [1, [57, 63], 0.43],
            [2, [57, 63], 0.43],
          ],
        ],
        [
          [
            [0, 82, 0.5],
            [1, 82, 0.4],
            [1.5, 81, 0.4],
            [2, 79, 0.7],
          ],
          [[0, 43, 0.75]],
          [
            [1, [62, 70], 0.43],
            [2, [62, 70], 0.43],
          ],
        ],
        [
          [
            [0, 79, 0.45],
            [0.5, 75, 0.4],
            [1, 72, 1.3],
          ],
          [[0, 48, 0.75]],
          [
            [1, [63, 67], 0.43],
            [2, [63, 67], 0.43],
          ],
        ],
        [
          [
            [0, 74, 0.5],
            [1, 77, 0.5],
            [2, 81, 0.75],
          ],
          [[0, 53, 0.75]],
          [
            [1, [60, 63], 0.42],
            [2, [60, 63], 0.42],
          ],
        ],
        [
          [
            [0, 82, 1.85],
            [2.5, 74, 0.37],
          ],
          [[0, 46, 0.75]],
          [
            [1, [62, 65], 0.43],
            [2, [62, 65], 0.43],
          ],
        ],
      ],
    },
    night: {
      // Slow E minor flute theme over softly sustained chords.
      tempo: 72,
      level: 0.78,
      beatsPerBar: 4,
      parts: ['flute', 'bass', 'pad'],
      bars: [
        [
          [
            [0.5, 71, 1.2],
            [2, 76, 1.75],
          ],
          [[0, 40, 3.8]],
          [[0, [55, 59, 66], 3.85]],
        ],
        [
          [
            [0, 74, 0.85],
            [1, 71, 1.5],
            [3, 67, 0.8],
          ],
          [[0, 48, 3.8]],
          [[0, [55, 59, 64], 3.85]],
        ],
        [
          [
            [0, 69, 1.5],
            [2.5, 71, 0.42],
            [3, 74, 0.87],
          ],
          [[0, 43, 3.8]],
          [[0, [55, 62, 66], 3.85]],
        ],
        [
          [
            [0, 76, 2.45],
            [3, 71, 0.8],
          ],
          [[0, 47, 3.8]],
          [[0, [57, 62, 66], 3.85]],
        ],
        [
          [
            [0.5, 67, 0.75],
            [1.5, 71, 0.78],
            [2.5, 76, 1.36],
          ],
          [[0, 40, 3.8]],
          [[0, [55, 59, 66], 3.85]],
        ],
        [
          [
            [0, 78, 1.44],
            [2, 76, 0.76],
            [3, 74, 0.78],
          ],
          [[0, 50, 3.8]],
          [[0, [57, 62, 66], 3.85]],
        ],
        [
          [
            [0, 72, 1.27],
            [1.5, 71, 0.85],
            [3, 67, 0.72],
          ],
          [[0, 48, 3.8]],
          [[0, [55, 59, 64], 3.85]],
        ],
        [
          [
            [0, 66, 0.82],
            [1, 64, 2.6],
          ],
          [[0, 40, 3.8]],
          [[0, [55, 59, 64], 3.85]],
        ],
      ],
    },
    endless: {
      // Syncopated G major marimba, with a bass line that keeps moving.
      tempo: 122,
      level: 1.2,
      beatsPerBar: 4,
      parts: ['marimba', 'pluck', 'harmony'],
      bars: [
        [
          [
            [0, 67, 0.35],
            [0.75, 71, 0.35],
            [1.5, 74, 0.65],
            [2.5, 79, 0.35],
            [3.25, 74, 0.55],
          ],
          [
            [0, 43, 0.6],
            [1.5, 50, 0.55],
            [2.5, 55, 0.55],
            [3.5, 50, 0.38],
          ],
          [
            [1, [59, 62], 0.38],
            [3, [59, 62], 0.38],
          ],
        ],
        [
          [
            [0.5, 76, 0.38],
            [1.25, 74, 0.4],
            [2, 71, 0.45],
            [2.75, 67, 0.46],
            [3.5, 69, 0.38],
          ],
          [
            [0, 40, 0.7],
            [1, 47, 0.58],
            [2.5, 52, 0.48],
            [3.5, 47, 0.38],
          ],
          [
            [1.75, [55, 59], 0.38],
            [3, [55, 59], 0.38],
          ],
        ],
        [
          [
            [0, 72, 0.35],
            [0.75, 76, 0.35],
            [1.5, 81, 0.65],
            [2.5, 79, 0.35],
            [3.25, 76, 0.55],
          ],
          [
            [0, 45, 0.6],
            [1.5, 52, 0.55],
            [2.5, 57, 0.55],
            [3.5, 52, 0.38],
          ],
          [
            [1, [60, 64], 0.38],
            [3, [60, 64], 0.38],
          ],
        ],
        [
          [
            [0.5, 74, 0.38],
            [1.25, 69, 0.4],
            [2, 72, 0.45],
            [2.75, 69, 0.45],
            [3.5, 66, 0.38],
          ],
          [
            [0, 50, 0.7],
            [1, 57, 0.55],
            [2.5, 48, 0.55],
            [3.5, 45, 0.38],
          ],
          [
            [1.75, [54, 60], 0.38],
            [3, [54, 60], 0.38],
          ],
        ],
        [
          [
            [0, 79, 0.35],
            [0.75, 81, 0.35],
            [1.5, 83, 0.6],
            [2.5, 79, 0.35],
            [3.25, 74, 0.55],
          ],
          [
            [0, 43, 0.58],
            [1.5, 50, 0.55],
            [2.5, 55, 0.55],
            [3.5, 50, 0.38],
          ],
          [
            [1, [59, 62], 0.38],
            [3, [59, 62], 0.38],
          ],
        ],
        [
          [
            [0.5, 72, 0.38],
            [1.25, 76, 0.38],
            [2, 79, 0.45],
            [2.75, 76, 0.45],
            [3.5, 72, 0.38],
          ],
          [
            [0, 48, 0.7],
            [1, 55, 0.55],
            [2.5, 60, 0.55],
            [3.5, 55, 0.38],
          ],
          [
            [1.75, [60, 64], 0.38],
            [3, [60, 64], 0.38],
          ],
        ],
        [
          [
            [0, 71, 0.55],
            [1, 67, 0.4],
            [1.75, 69, 0.4],
            [2.5, 72, 0.38],
            [3.25, 74, 0.55],
          ],
          [
            [0, 47, 0.58],
            [1.5, 43, 0.55],
            [2.5, 50, 0.55],
            [3.5, 48, 0.38],
          ],
          [
            [1, [55, 62], 0.38],
            [3, [54, 60], 0.38],
          ],
        ],
        [
          [
            [0, 79, 0.78],
            [1.5, 74, 0.42],
            [2.25, 71, 0.42],
            [3, 69, 0.6],
          ],
          [
            [0, 43, 0.75],
            [1.5, 50, 0.58],
            [2.5, 55, 0.55],
            [3.5, 42, 0.38],
          ],
          [
            [1, [59, 62], 0.38],
            [3, [55, 62], 0.38],
          ],
        ],
      ],
    },
    grove: {
      // A wooden F major melody in 5/4 (three steps, then two).
      tempo: 94,
      level: 1.2,
      beatsPerBar: 5,
      parts: ['wood', 'bass', 'harmony'],
      bars: [
        [
          [
            [0, 65, 0.92],
            [1, 69, 0.85],
            [2, 67, 0.64],
            [3, 65, 1.75],
          ],
          [
            [0, 41, 1.62],
            [3, 48, 1.25],
          ],
          [
            [1, 60, 0.55],
            [2, 64, 0.55],
            [4, 60, 0.55],
          ],
        ],
        [
          [
            [0, 62, 1.65],
            [2, 65, 0.65],
            [3, 69, 0.85],
            [4, 72, 0.85],
          ],
          [
            [0, 50, 1.62],
            [3, 45, 1.25],
          ],
          [
            [1, 57, 0.55],
            [2, 60, 0.55],
            [4, 57, 0.55],
          ],
        ],
        [
          [
            [0, 74, 1.68],
            [2, 72, 0.65],
            [3, 70, 1.6],
          ],
          [
            [0, 46, 1.62],
            [3, 53, 1.25],
          ],
          [
            [1, 57, 0.55],
            [2, 62, 0.55],
            [4, 57, 0.55],
          ],
        ],
        [
          [
            [0, 69, 0.85],
            [1, 67, 1.45],
            [3, 64, 0.8],
            [4, 67, 0.65],
          ],
          [
            [0, 48, 1.62],
            [3, 43, 1.25],
          ],
          [
            [1, 55, 0.55],
            [2, 58, 0.55],
            [4, 58, 0.55],
          ],
        ],
        [
          [
            [0, 72, 0.93],
            [1, 69, 0.85],
            [2, 65, 0.65],
            [3, 67, 1.65],
          ],
          [
            [0, 45, 1.62],
            [3, 53, 1.25],
          ],
          [
            [1, 60, 0.55],
            [2, 65, 0.55],
            [4, 60, 0.55],
          ],
        ],
        [
          [
            [0, 70, 1.5],
            [2, 69, 0.65],
            [3, 67, 1.55],
          ],
          [
            [0, 43, 1.62],
            [3, 50, 1.25],
          ],
          [
            [1, 58, 0.55],
            [2, 62, 0.55],
            [4, 58, 0.55],
          ],
        ],
        [
          [
            [0, 65, 0.85],
            [1, 67, 0.85],
            [2, 69, 0.65],
            [3, 70, 0.85],
            [4, 67, 0.65],
          ],
          [
            [0, 48, 1.65],
            [3, 55, 1.25],
          ],
          [
            [1, 60, 0.55],
            [2, 64, 0.55],
            [4, 58, 0.55],
          ],
        ],
        [
          [
            [0, 65, 2.55],
            [3, 60, 1.55],
          ],
          [
            [0, 41, 1.62],
            [3, 48, 1.25],
          ],
          [
            [1, 57, 0.55],
            [2, 60, 0.55],
            [4, 57, 0.55],
          ],
        ],
      ],
    },
    reef: {
      // D major in 6/8, grouped into two dotted-quarter beats per bar.
      tempo: 62,
      level: 0.72,
      beatsPerBar: 2,
      parts: ['glass', 'bass', 'pad'],
      bars: [
        [
          [
            [0, 81, 0.56],
            [2 / 3, 78, 0.27],
            [1, 76, 0.57],
            [5 / 3, 74, 0.29],
          ],
          [
            [0, 50, 0.85],
            [1, 57, 0.85],
          ],
          [[0, [57, 62, 66], 1.88]],
        ],
        [
          [
            [0, 76, 0.59],
            [2 / 3, 78, 0.29],
            [1, 81, 0.83],
          ],
          [
            [0, 49, 0.85],
            [1, 57, 0.85],
          ],
          [[0, [57, 61, 64], 1.88]],
        ],
        [
          [
            [0, 83, 0.87],
            [1, 78, 0.29],
            [4 / 3, 76, 0.29],
            [5 / 3, 74, 0.29],
          ],
          [
            [0, 47, 0.85],
            [1, 54, 0.85],
          ],
          [[0, [59, 62, 66], 1.88]],
        ],
        [
          [
            [0, 79, 0.88],
            [1, 78, 0.56],
            [5 / 3, 74, 0.29],
          ],
          [
            [0, 43, 0.85],
            [1, 50, 0.85],
          ],
          [[0, [59, 62, 66], 1.88]],
        ],
        [
          [
            [0, 81, 0.55],
            [2 / 3, 85, 0.29],
            [1, 86, 0.82],
          ],
          [
            [0, 54, 0.85],
            [1, 45, 0.85],
          ],
          [[0, [57, 62, 66], 1.88]],
        ],
        [
          [
            [0, 83, 0.56],
            [2 / 3, 81, 0.29],
            [1, 79, 0.57],
            [5 / 3, 76, 0.29],
          ],
          [
            [0, 52, 0.85],
            [1, 59, 0.85],
          ],
          [[0, [55, 59, 62], 1.88]],
        ],
        [
          [
            [0, 78, 0.29],
            [1 / 3, 79, 0.29],
            [2 / 3, 81, 0.29],
            [1, 76, 0.84],
          ],
          [
            [0, 45, 0.85],
            [1, 52, 0.85],
          ],
          [[0, [55, 61, 64], 1.88]],
        ],
        [
          [
            [0, 74, 1.49],
            [5 / 3, 78, 0.29],
          ],
          [
            [0, 50, 0.85],
            [1, 54, 0.85],
          ],
          [[0, [57, 62, 64], 1.88]],
        ],
      ],
    },
    orchard: {
      // Short plucked notes and offbeats give the F major melody a waltz pulse.
      tempo: 132,
      beatsPerBar: 3,
      parts: ['pluck', 'bass', 'harmony'],
      bars: [
        [
          [
            [0, 69, 0.35],
            [0.5, 72, 0.3],
            [1, 77, 0.57],
            [2, 76, 0.3],
            [2.5, 72, 0.3],
          ],
          [[0, 41, 0.75]],
          [
            [1, [57, 60], 0.31],
            [2, [57, 60], 0.28],
          ],
        ],
        [
          [
            [0, 67, 0.42],
            [0.75, 72, 0.3],
            [1.25, 74, 0.38],
            [2, 76, 0.54],
          ],
          [[0, 48, 0.72]],
          [
            [1, [55, 64], 0.31],
            [2, [55, 64], 0.28],
          ],
        ],
        [
          [
            [0, 77, 0.4],
            [0.5, 81, 0.35],
            [1.25, 77, 0.31],
            [1.75, 74, 0.42],
            [2.5, 72, 0.32],
          ],
          [[0, 50, 0.75]],
          [
            [1, [57, 65], 0.31],
            [2, [57, 65], 0.28],
          ],
        ],
        [
          [
            [0, 70, 0.41],
            [0.5, 77, 0.32],
            [1, 74, 0.75],
            [2.5, 72, 0.29],
          ],
          [[0, 46, 0.78]],
          [
            [1, [58, 65], 0.31],
            [2, [58, 65], 0.28],
          ],
        ],
        [
          [
            [0, 69, 0.35],
            [0.5, 72, 0.3],
            [1, 77, 0.38],
            [1.5, 81, 0.35],
            [2, 84, 0.65],
          ],
          [[0, 45, 0.75]],
          [
            [1, [60, 65], 0.31],
            [2, [60, 65], 0.28],
          ],
        ],
        [
          [
            [0, 82, 0.42],
            [0.75, 79, 0.3],
            [1.25, 74, 0.36],
            [2, 70, 0.57],
          ],
          [[0, 43, 0.72]],
          [
            [1, [58, 62], 0.31],
            [2, [58, 62], 0.28],
          ],
        ],
        [
          [
            [0, 76, 0.36],
            [0.5, 77, 0.31],
            [1, 79, 0.44],
            [1.75, 74, 0.35],
            [2.5, 76, 0.32],
          ],
          [[0, 48, 0.78]],
          [
            [1, [58, 64], 0.31],
            [2, [58, 64], 0.28],
          ],
        ],
        [
          [
            [0, 77, 1.02],
            [1.5, 72, 0.37],
            [2.25, 69, 0.47],
          ],
          [[0, 41, 0.9]],
          [
            [1, [57, 60], 0.31],
            [2, [57, 60], 0.28],
          ],
        ],
        [
          [
            [0.5, 74, 0.4],
            [1, 77, 0.4],
            [1.5, 81, 0.32],
            [2, 77, 0.6],
          ],
          [[0, 50, 0.75]],
          [
            [1, [57, 65], 0.31],
            [2, [57, 65], 0.28],
          ],
        ],
        [
          [
            [0, 74, 0.5],
            [0.75, 70, 0.3],
            [1.5, 74, 0.4],
            [2.25, 77, 0.44],
          ],
          [[0, 46, 0.75]],
          [
            [1, [58, 65], 0.31],
            [2, [58, 65], 0.28],
          ],
        ],
        [
          [
            [0, 79, 0.42],
            [0.5, 77, 0.32],
            [1, 74, 0.39],
            [1.75, 70, 0.36],
            [2.5, 74, 0.29],
          ],
          [[0, 43, 0.75]],
          [
            [1, [58, 62], 0.31],
            [2, [58, 62], 0.28],
          ],
        ],
        [
          [
            [0, 72, 0.92],
            [1.5, 76, 0.41],
            [2.5, 67, 0.32],
          ],
          [[0, 48, 0.78]],
          [
            [1, [58, 64], 0.31],
            [2, [58, 64], 0.28],
          ],
        ],
      ],
    },
    frost: {
      // Five-beat phrases leave room for glass echoes above sustained chords.
      tempo: 88,
      level: 0.78,
      beatsPerBar: 5,
      parts: ['flute', 'glass', 'pad'],
      bars: [
        [
          [
            [0.5, 78, 1.45],
            [2.25, 76, 0.7],
            [3, 73, 1.61],
          ],
          [
            [1.25, 85, 0.8],
            [4, 88, 0.75],
          ],
          [[0, [50, 57, 64, 66], 4.88]],
        ],
        [
          [
            [0, 80, 2.05],
            [2.5, 83, 0.87],
            [3.5, 76, 1.36],
          ],
          [
            [0.5, 92, 0.82],
            [2.25, 90, 0.71],
            [4.25, 83, 0.6],
          ],
          [[0, [52, 59, 66, 68], 4.88]],
        ],
        [
          [
            [0.25, 74, 1.49],
            [2, 78, 1.3],
            [3.75, 81, 0.99],
          ],
          [
            [1.75, 86, 0.9],
            [3.1, 90, 0.96],
          ],
          [[0, [47, 54, 57, 62], 4.88]],
        ],
        [
          [
            [0, 85, 1.9],
            [2.25, 81, 0.61],
            [3, 80, 0.7],
            [4, 78, 0.86],
          ],
          [
            [1, 88, 0.8],
            [2.75, 85, 0.85],
            [4.25, 81, 0.6],
          ],
          [[0, [54, 61, 64, 69], 4.88]],
        ],
        [
          [
            [0.5, 78, 1.41],
            [2.25, 80, 0.7],
            [3, 81, 1.7],
          ],
          [
            [0, 90, 0.93],
            [2.25, 85, 0.88],
            [4.1, 88, 0.77],
          ],
          [[0, [50, 57, 61, 66], 4.88]],
        ],
        [
          [
            [0, 83, 1.93],
            [2.25, 85, 0.72],
            [3, 88, 1.78],
          ],
          [
            [1.1, 92, 0.87],
            [3.7, 95, 1.04],
          ],
          [[0, [52, 59, 63, 68], 4.88]],
        ],
        [
          [
            [0, 85, 1.15],
            [1.5, 81, 1.05],
            [3.25, 80, 1.47],
          ],
          [
            [0.5, 88, 0.86],
            [2.6, 85, 0.82],
            [4.25, 81, 0.56],
          ],
          [[0, [45, 52, 56, 61], 4.88]],
        ],
        [
          [
            [0.25, 76, 1.5],
            [2, 73, 1.2],
            [3.5, 80, 1.15],
          ],
          [
            [1.4, 83, 0.79],
            [3.25, 88, 1.3],
          ],
          [[0, [52, 59, 66, 68], 4.88]],
        ],
      ],
    },
    rose: {
      // Two swaying groups of three eighth notes, with chimes over plucked strings.
      tempo: 154,
      beatsPerBar: 6,
      parts: ['bell', 'pluck', 'pad'],
      bars: [
        [
          [[0, 69, 1.65], [2, 72, 0.75], [3, 77, 1.55], [5, 76, 0.75]],
          [[0, 41, 1.75], [2, 60, 0.72], [3, 57, 1.28], [5, 60, 0.72]],
          [[0, [53, 57, 64], 5.6]],
        ],
        [
          [[0, 72, 2.55], [3, 67, 1.7], [5, 69, 0.76]],
          [[0, 40, 1.75], [2, 55, 0.72], [3, 52, 1.28], [5, 55, 0.72]],
          [[0, [52, 55, 60], 5.6]],
        ],
        [
          [[0, 69, 1.65], [2, 72, 0.75], [3, 74, 1.55], [5, 77, 0.75]],
          [[0, 38, 1.75], [2, 57, 0.72], [3, 53, 1.28], [5, 57, 0.72]],
          [[0, [50, 53, 60], 5.6]],
        ],
        [
          [[0, 76, 2.5], [3, 74, 1.6], [5, 72, 0.78]],
          [[0, 43, 1.75], [2, 62, 0.72], [3, 58, 1.28], [5, 62, 0.72]],
          [[0, [50, 58, 64], 5.6]],
        ],
        [
          [[0, 77, 2.6], [3, 81, 1.6], [5, 84, 0.7]],
          [[0, 46, 1.75], [2, 65, 0.72], [3, 62, 1.28], [5, 65, 0.72]],
          [[0, [53, 58, 62], 5.6]],
        ],
        [
          [[0, 83, 1.55], [2, 79, 0.73], [3, 76, 1.65], [5, 72, 0.75]],
          [[0, 48, 1.75], [2, 64, 0.72], [3, 55, 1.28], [5, 64, 0.72]],
          [[0, [55, 60, 64], 5.6]],
        ],
        [
          [[0, 74, 1.55], [2, 77, 0.74], [3, 72, 1.6], [5, 70, 0.74]],
          [[0, 46, 1.75], [2, 65, 0.72], [3, 60, 1.28], [5, 65, 0.72]],
          [[0, [53, 58, 62], 5.6]],
        ],
        [
          [[0, 69, 2.5], [3, 67, 1.4], [5, 65, 0.75]],
          [[0, 41, 1.75], [2, 60, 0.72], [3, 57, 1.28], [5, 60, 0.72]],
          [[0, [53, 57, 60], 5.6]],
        ],
      ],
    },
    meadow: {
      // A bouncy G-major melody with a walking bass and short offbeat chords.
      tempo: 116,
      level: 1.12,
      beatsPerBar: 4,
      parts: ['marimba', 'bass', 'harmony'],
      bars: [
        [
          [[0, 67, 0.33], [0.5, 71, 0.3], [1, 74, 0.63], [2.5, 71, 0.34], [3.5, 69, 0.39]],
          [[0, 43, 0.65], [1, 50, 0.55], [2, 47, 0.62], [3, 45, 0.65]],
          [[1.5, [59, 62], 0.34], [3, [59, 62], 0.31]],
        ],
        [
          [[0, 67, 0.33], [0.5, 69, 0.3], [1.5, 72, 0.59], [2.5, 76, 0.62]],
          [[0, 48, 0.65], [1, 52, 0.55], [2, 55, 0.62], [3, 54, 0.65]],
          [[0.75, [60, 64], 0.32], [3.25, [60, 64], 0.31]],
        ],
        [
          [[0, 76, 0.33], [0.5, 74, 0.3], [1, 71, 0.63], [2.5, 74, 0.34], [3.5, 71, 0.39]],
          [[0, 40, 0.65], [1, 47, 0.55], [2, 50, 0.62], [3, 52, 0.65]],
          [[1.5, [55, 59], 0.32], [3, [55, 59], 0.32]],
        ],
        [
          [[0, 69, 0.39], [1, 66, 0.6], [2.5, 69, 0.32], [3, 74, 0.69]],
          [[0, 50, 0.65], [1, 54, 0.55], [2, 57, 0.62], [3, 45, 0.65]],
          [[0.75, [57, 60], 0.32], [2.25, [54, 60], 0.31]],
        ],
        [
          [[0, 79, 0.33], [0.5, 78, 0.3], [1, 74, 0.63], [2.5, 71, 0.34], [3.5, 74, 0.39]],
          [[0, 47, 0.65], [1, 50, 0.55], [2, 55, 0.62], [3, 47, 0.65]],
          [[1.5, [59, 62], 0.34], [3, [59, 62], 0.31]],
        ],
        [
          [[0, 76, 0.42], [0.75, 72, 0.32], [1.5, 67, 0.51], [2.5, 69, 0.39], [3, 72, 0.62]],
          [[0, 48, 0.65], [1, 55, 0.55], [2, 52, 0.62], [3, 51, 0.65]],
          [[1.75, [55, 60], 0.32], [3.5, [60, 64], 0.31]],
        ],
        [
          [[0, 71, 0.35], [0.5, 72, 0.35], [1, 74, 0.67], [2.5, 69, 0.33], [3.5, 66, 0.35]],
          [[0, 52, 0.6], [1, 47, 0.55], [2, 50, 0.66], [3, 54, 0.65]],
          [[1.5, [55, 59], 0.35], [3, [57, 60], 0.33]],
        ],
        [
          [[0, 67, 0.83], [1.5, 74, 0.4], [2.5, 71, 0.33], [3, 67, 0.67]],
          [[0, 43, 0.75], [1, 50, 0.55], [2, 47, 0.62], [3, 43, 0.72]],
          [[1.25, [59, 62], 0.33], [3.5, [55, 59], 0.31]],
        ],
      ],
    },
    lagoon: {
      // Slow, low glass notes under a floating flute line in C Dorian.
      tempo: 72,
      level: 0.98,
      beatsPerBar: 4,
      parts: ['flute', 'glass', 'pad'],
      bars: [
        [
          [[0, 72, 1.55], [2, 75, 0.72], [3, 74, 0.9]],
          [[0.5, 55, 1.1], [2.75, 62, 1.18]],
          [[0, [48, 58, 63], 3.96]],
        ],
        [
          [[0.25, 69, 1.3], [2, 67, 1.82]],
          [[0, 53, 1.12], [2.75, 60, 1.18]],
          [[0, [53, 57, 63], 3.96]],
        ],
        [
          [[0, 72, 1.55], [2, 75, 0.72], [3, 77, 0.9]],
          [[0.5, 58, 1.15], [2.75, 65, 1.18]],
          [[0, [51, 58, 65], 3.96]],
        ],
        [
          [[0.25, 74, 1.45], [2.25, 72, 0.7], [3.25, 70, 0.66]],
          [[0, 58, 1.2], [2.75, 62, 1.18]],
          [[0, [46, 57, 62], 3.96]],
        ],
        [
          [[0, 69, 1.85], [2.5, 72, 1.38]],
          [[0.5, 57, 1.15], [2.75, 65, 1.18]],
          [[0, [53, 60, 63], 3.96]],
        ],
        [
          [[0, 79, 1.65], [2.5, 77, 0.6], [3.25, 75, 0.68]],
          [[0.5, 55, 1.15], [2.75, 67, 1.18]],
          [[0, [51, 58, 62], 3.96]],
        ],
        [
          [[0.25, 74, 1.5], [2.25, 70, 0.64], [3.25, 69, 0.65]],
          [[0, 55, 1.22], [2.75, 65, 1.18]],
          [[0, [55, 58, 62], 3.96]],
        ],
        [
          [[0, 67, 1.8], [2.25, 72, 1.65]],
          [[0.5, 55, 1.15], [2.75, 60, 1.18]],
          [[0, [48, 55, 63], 3.96]],
        ],
      ],
    },
    tower: {
      tempo: 128,
      level: 0.96,
      beatsPerBar: 3,
      parts: ['bell', 'bass', 'pluck'],
      bars: [
        [[[0, 72, .76], [1, 76, .37], [1.5, 79, .37], [2, 84, .74]],
         [[0, 48, .82], [2, 55, .67]], [[1, [60, 67], .55], [2, [64, 67], .56]]],
        [[[0, 81, .91], [1, 79, .74], [2, 76, .79]],
         [[0, 45, .82], [2, 52, .67]], [[1, [60, 64], .50], [2, [64, 69], .54]]],
        [[[0, 77, .74], [1, 81, .37], [1.5, 84, .37], [2, 86, .66]],
         [[0, 41, .82], [2, 48, .67]], [[1, [60, 65], .56], [2, [65, 69], .52]]],
        [[[0, 83, .82], [1, 79, .46], [1.5, 74, .38], [2, 76, .73]],
         [[0, 43, .82], [2, 50, .67]], [[1, [62, 67], .54], [2, [65, 71], .48]]],
        [[[0, 76, .58], [.75, 79, .55], [1.5, 84, .37], [2, 88, .70]],
         [[0, 48, .82], [2, 55, .67]], [[1, [60, 67], .52], [2, [64, 72], .55]]],
        [[[0, 86, .71], [1, 81, .76], [2, 77, .71]],
         [[0, 41, .82], [2, 48, .67]], [[1, [60, 65], .51], [2, [65, 69], .56]]],
        [[[0, 79, .58], [.75, 83, .45], [1.5, 86, .46], [2, 79, .66]],
         [[0, 43, .82], [2, 50, .67]], [[1, [62, 67], .50], [2, [65, 71], .55]]],
        [[[0, 84, 1.23], [1.5, 76, .46], [2, 72, .78]],
         [[0, 48, 1.21]], [[1, [60, 64, 67], 1.7]]],
      ],
    },
    tulip: {
      // A rising D-minor figure over a brisk 3+2 pulse.
      tempo: 144,
      level: 1.06,
      beatsPerBar: 5,
      parts: ['wood', 'bass', 'toyPiano'],
      bars: [
        [
          [[0, 62, 0.39], [0.5, 65, 0.39], [1, 69, 0.71], [2, 74, 0.69], [3.5, 72, 0.4], [4, 69, 0.75]],
          [[0, 38, 0.91], [1.5, 45, 0.48], [3, 38, 0.85], [4, 48, 0.63]],
          [[1.5, [65, 69], 0.35], [3, [65, 69], 0.36], [4.5, 77, 0.4]],
        ],
        [
          [[0, 65, 0.39], [0.5, 69, 0.39], [1, 72, 0.71], [2, 77, 0.69], [3.5, 76, 0.4], [4, 72, 0.75]],
          [[0, 41, 0.91], [1.5, 48, 0.48], [3, 41, 0.85], [4, 52, 0.63]],
          [[1.5, [69, 72], 0.35], [3, [69, 72], 0.36], [4.5, 81, 0.4]],
        ],
        [
          [[0, 67, 0.39], [0.5, 70, 0.39], [1, 74, 0.71], [2, 79, 0.69], [3.5, 77, 0.4], [4, 74, 0.75]],
          [[0, 43, 0.91], [1.5, 50, 0.48], [3, 43, 0.85], [4, 53, 0.63]],
          [[1.5, [70, 74], 0.35], [3, [70, 74], 0.36], [4.5, 82, 0.4]],
        ],
        [
          [[0, 69, 0.39], [0.5, 73, 0.39], [1, 76, 0.68], [2, 79, 0.59], [3, 76, 0.69], [4, 73, 0.75]],
          [[0, 45, 0.91], [1.5, 52, 0.48], [3, 45, 0.85], [4, 49, 0.63]],
          [[1.5, [73, 79], 0.35], [3, [73, 79], 0.36], [4.5, 81, 0.4]],
        ],
        [
          [[0, 74, 0.72], [1, 77, 0.73], [2, 81, 0.69], [3.5, 84, 0.39], [4, 81, 0.7]],
          [[0, 38, 0.91], [1.5, 45, 0.48], [3, 50, 0.85], [4, 45, 0.63]],
          [[0.5, [69, 77], 0.35], [2.5, [69, 77], 0.36], [4.5, 77, 0.4]],
        ],
        [
          [[0, 82, 0.72], [1, 77, 0.73], [2, 74, 0.69], [3.5, 77, 0.39], [4, 70, 0.7]],
          [[0, 46, 0.91], [1.5, 53, 0.48], [3, 46, 0.85], [4, 50, 0.63]],
          [[0.5, [70, 74], 0.35], [2.5, [70, 74], 0.36], [4.5, 82, 0.4]],
        ],
        [
          [[0, 79, 0.72], [1, 76, 0.73], [2, 73, 0.69], [3, 72, 0.46], [3.5, 70, 0.38], [4, 69, 0.67]],
          [[0, 45, 0.91], [1.5, 52, 0.48], [3, 45, 0.85], [4, 49, 0.63]],
          [[0.5, [73, 79], 0.35], [2.5, [73, 79], 0.36], [4.5, 76, 0.4]],
        ],
        [
          [[0, 74, 0.76], [1.5, 69, 0.45], [2, 65, 0.69], [3, 62, 1.36]],
          [[0, 38, 0.91], [1.5, 45, 0.48], [3, 38, 1.65]],
          [[1.5, [65, 69], 0.35], [3, [65, 74], 0.62]],
        ],
      ],
    },
  };

  function compileScore({ tempo, level = 1, beatsPerBar, parts, bars }) {
    const secondsPerBeat = 60 / tempo;
    const voices = parts.map((part) => {
      const instrument = instruments[part];
      return { ...instrument, volume: instrument.volume * level };
    });
    const notes = bars
      .flatMap((bar, index) =>
        bar.flatMap((part, partIndex) =>
          part.flatMap(([beat, pitches, length]) =>
            (Array.isArray(pitches) ? pitches : [pitches]).map((pitch) => ({
              offset: (index * beatsPerBar + beat) * secondsPerBeat,
              frequency: 440 * 2 ** ((pitch - 69) / 12),
              duration: length * secondsPerBeat,
              instrument: voices[partIndex],
            })),
          ),
        ),
      )
      .sort((a, b) => a.offset - b.offset);
    return { notes, duration: bars.length * beatsPerBar * secondsPerBeat };
  }

  const tracks = Object.fromEntries(
    Object.entries(scores).map(([id, score]) => [id, compileScore(score)]),
  );
  let track = tracks.cloud;

  let soundEnabled = true;
  let musicEnabled = true;
  let context;
  let output;
  let musicOutput;
  let resumePending = false;
  let hasGesture = false;
  let activeVoices = 0;
  let playing = false;
  let musicTimer;
  let loopStart;
  let nextNote = 0;
  const musicVoices = new Set();
  const activeEffects = new Set();

  try {
    soundEnabled = localStorage.getItem(soundPreferenceKey) !== 'off';
    const savedMusic = localStorage.getItem(musicPreferenceKey);
    musicEnabled = savedMusic === null ? soundEnabled : savedMusic !== 'off';
  } catch {
    // Preferences remain available for the current page.
    musicEnabled = soundEnabled;
  }

  function canActivateAudio() {
    const activation = navigator.userActivation;
    return activation ? activation.isActive : hasGesture;
  }

  function getContext() {
    if (context) return context;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || !canActivateAudio()) return;

    const audio = new AudioContext();
    output = audio.createGain();
    output.gain.value = soundEnabled ? 0.6 : 0;
    output.connect(audio.destination);
    musicOutput = audio.createGain();
    musicOutput.gain.value = 0.22;
    musicOutput.connect(audio.destination);
    audio.addEventListener('statechange', syncMusic);
    context = audio;
    return context;
  }

  function resumeAudio() {
    if (context.state === 'running' || resumePending || !canActivateAudio()) return;
    resumePending = true;
    context.resume().then(
      () => {
        resumePending = false;
        if (context.state === 'running') syncMusic();
      },
      () => {
        resumePending = false;
      },
    );
  }

  function shouldPlayMusic() {
    return playing && musicEnabled && !document.hidden;
  }

  function disconnectVoice(voice) {
    voice.envelope.disconnect();
    voice.partialGain?.disconnect();
    for (const oscillator of voice.oscillators) oscillator.disconnect();
    musicVoices.delete(voice);
  }

  function stopMusic() {
    clearTimeout(musicTimer);
    musicTimer = undefined;
    loopStart = undefined;
    nextNote = 0;
    for (const voice of musicVoices) {
      voice.oscillators[0].onended = null;
      for (const oscillator of voice.oscillators) oscillator.stop();
      disconnectVoice(voice);
    }
  }

  function scheduleNote({ frequency, duration, instrument }, start) {
    const { type, attack, decay, sustain, volume, partial } = instrument;
    const end = start + duration;
    const peak = start + Math.min(attack, duration * 0.24);
    const settle = Math.min(peak + decay, start + duration * 0.73);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, peak);
    envelope.gain.exponentialRampToValueAtTime(volume * sustain, settle);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(musicOutput);

    const fundamental = context.createOscillator();
    fundamental.type = type;
    fundamental.frequency.value = frequency;
    fundamental.connect(envelope);
    const voice = { envelope, oscillators: [fundamental] };
    if (partial) {
      const [ratio, amplitude, tail] = partial;
      const overtone = context.createOscillator();
      overtone.frequency.value = frequency * ratio;
      voice.partialGain = context.createGain();
      voice.partialGain.gain.setValueAtTime(amplitude, start);
      voice.partialGain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(tail, duration));
      overtone.connect(voice.partialGain);
      voice.partialGain.connect(envelope);
      voice.oscillators.push(overtone);
    }
    fundamental.onended = () => disconnectVoice(voice);
    musicVoices.add(voice);
    for (const oscillator of voice.oscillators) {
      oscillator.start(start);
      oscillator.stop(end);
    }
  }

  function scheduleMusic() {
    musicTimer = undefined;
    if (!shouldPlayMusic() || context.state !== 'running') {
      stopMusic();
      return;
    }

    try {
      const { notes, duration } = track;
      const now = context.currentTime;
      const earliestStart = now + 0.005;
      loopStart ??= now + 0.04;
      const missedLoops = Math.floor((earliestStart - loopStart) / duration);
      if (missedLoops > 0) {
        loopStart += missedLoops * duration;
        nextNote = 0;
      }
      let start = loopStart + notes[nextNote].offset;
      // Keep the musical position after a delayed timer and avoid playing missed notes in a burst.
      while (start < now + 0.16) {
        if (start >= earliestStart) scheduleNote(notes[nextNote], start);
        nextNote += 1;
        if (nextNote === notes.length) {
          nextNote = 0;
          loopStart += duration;
        }
        start = loopStart + notes[nextNote].offset;
      }
      musicTimer = setTimeout(scheduleMusic, 40);
    } catch {
      stopMusic();
    }
  }

  function syncMusic() {
    if (!shouldPlayMusic()) {
      stopMusic();
      return;
    }

    try {
      if (!getContext()) return;
      if (context.state !== 'running') {
        stopMusic();
        resumeAudio();
        return;
      }
      if (musicTimer === undefined) scheduleMusic();
    } catch {
      stopMusic();
    }
  }

  function rememberGesture(event) {
    if (!event.isTrusted) return;
    hasGesture = true;
    if (context && soundEnabled && context.state !== 'running') {
      resumeAudio();
    }
    if (shouldPlayMusic()) syncMusic();
  }

  for (const event of ['pointerdown', 'pointerup', 'keydown', 'click']) {
    window.addEventListener(event, rememberGesture, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', syncMusic);

  function prepareSound() {
    if (!getContext()) return false;
    if (context.state === 'running') return true;
    if (!canActivateAudio()) return false;
    resumeAudio();
    return true;
  }

  function disconnectEffect(voice) {
    voice.source.onended = null;
    voice.source.disconnect();
    voice.volume.disconnect();
    voice.panner?.disconnect();
    activeEffects.delete(voice);
  }

  function effect(cue, gain = 1, pan = 0) {
    if (!soundEnabled || !Number.isFinite(gain) || gain <= 0) return;

    let voice;
    try {
      if (!prepareSound()) return;
      if (activeEffects.size >= maxEffects) {
        if (cue !== 'pillowPress' && cue !== 'shutter') return;
        // A nearby impact must land on time even while other effects are ringing out.
        const oldest = activeEffects.values().next().value;
        oldest.source.stop();
        disconnectEffect(oldest);
      }
      const buffer = window.FluffSoundEffects?.bufferFor(context, cue);
      if (!buffer) return;

      const source = context.createBufferSource();
      const volume = context.createGain();
      voice = { source, volume };
      source.buffer = buffer;
      volume.gain.value = Math.min(1, gain);
      source.connect(volume);
      if (context.createStereoPanner && Number.isFinite(pan) && pan !== 0) {
        const panner = context.createStereoPanner();
        voice.panner = panner;
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        volume.connect(panner);
        panner.connect(output);
      } else {
        volume.connect(output);
      }
      source.onended = () => disconnectEffect(voice);
      source.start(context.currentTime + 0.005);
      activeEffects.add(voice);
    } catch {
      if (voice) disconnectEffect(voice);
    }
  }

  function play(cue) {
    if (!soundEnabled || !Object.hasOwn(cues, cue) || activeVoices >= maxVoices) return;

    try {
      if (!prepareSound()) return;
      const startTime = context.currentTime + 0.005;
      for (const [frequency, offset, duration, volume, endFrequency] of cues[cue]) {
        const note = context.createOscillator();
        const envelope = context.createGain();
        const start = startTime + offset;
        const end = start + duration;

        note.type = endFrequency ? 'triangle' : 'sine';
        note.frequency.setValueAtTime(frequency, start);
        if (endFrequency) note.frequency.exponentialRampToValueAtTime(endFrequency, end);
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + (endFrequency ? 0.004 : 0.015));
        envelope.gain.exponentialRampToValueAtTime(0.0001, end);
        note.connect(envelope);
        envelope.connect(output);
        note.onended = () => {
          activeVoices -= 1;
          note.disconnect();
          envelope.disconnect();
        };
        note.start(start);
        note.stop(end);
        activeVoices += 1;
        if (activeVoices >= maxVoices) break;
      }
    } catch {
      // Audio is optional on browsers or devices that cannot play it.
    }
  }

  window.FluffSound = {
    enabled: () => soundEnabled,
    toggle() {
      soundEnabled = !soundEnabled;
      try {
        localStorage.setItem(soundPreferenceKey, soundEnabled ? 'on' : 'off');
      } catch {
        // Keep the preference for the current page.
      }
      if (output) output.gain.value = soundEnabled ? 0.6 : 0;
      if (!soundEnabled) {
        for (const voice of activeEffects) {
          voice.source.stop();
          disconnectEffect(voice);
        }
      }
      return soundEnabled;
    },
    musicEnabled: () => musicEnabled,
    toggleMusic() {
      musicEnabled = !musicEnabled;
      try {
        localStorage.setItem(musicPreferenceKey, musicEnabled ? 'on' : 'off');
      } catch {
        // Keep the preference for the current page.
      }
      syncMusic();
      return musicEnabled;
    },
    setCourse(id) {
      const nextTrack = Object.hasOwn(tracks, id) ? tracks[id] : tracks.cloud;
      if (track === nextTrack) return;
      stopMusic();
      track = nextTrack;
      syncMusic();
    },
    setPlaying(value) {
      playing = Boolean(value);
      syncMusic();
    },
    play,
    effect,
  };
})();
