import { type NoteName } from './notes';
import type { FretPosition } from './fretboard';

/**
 * Handpan has no strings or frets — pitch comes from striking one of a fixed
 * set of tone fields hammered into the shell. Different physical handpans
 * are built in different "scales" (a builder/community term, not strict
 * music theory), each with its own root key and its own number of tone
 * fields. This models several of the most common ones: a center "Ding" note
 * plus a ring of tone fields around it, each a fixed, unchangeable pitch.
 *
 * Unlike voice's continuous chromatic range, a handpan can only ever sound
 * its own fixed set of pitches, so scale/exercise generation naturally
 * produces shorter (sometimes very short) note sequences for scales that
 * share few notes with the selected layout -- that's expected, not a bug.
 */
export interface HandpanTone {
  note: NoteName;
  octave: number;
  /** The center note, struck with a different technique than the tone fields. */
  isDing: boolean;
  /** Prefer the flat spelling (e.g. "Bb" over "A#") when labeling this tone. */
  preferFlats: boolean;
}

function tone(note: NoteName, octave: number, opts: { isDing?: boolean; preferFlats?: boolean } = {}): HandpanTone {
  return { note, octave, isDing: !!opts.isDing, preferFlats: !!opts.preferFlats };
}

export interface HandpanLayout {
  name: string;
  /** Short description of the scale's character, shown as a hint in the UI. */
  description: string;
  /** tones[0] is always the Ding; the rest are the tone fields in ascending pitch order. */
  tones: HandpanTone[];
}

export const HANDPAN_LAYOUT_KEYS = [
  'd_kurd_9',
  'd_kurd_10',
  'd_amara',
  'd_integral',
  'd_pygmy',
  'c_kurd',
  'e_hijaz',
] as const;

export type HandpanLayoutKey = (typeof HANDPAN_LAYOUT_KEYS)[number];

export const HANDPAN_LAYOUTS: Record<HandpanLayoutKey, HandpanLayout> = {
  d_kurd_9: {
    name: 'D Kurd (9)',
    description: 'The classic full natural-minor scale — the most common beginner handpan.',
    tones: [
      tone('D', 3, { isDing: true }),
      tone('A', 3), tone('A#', 3, { preferFlats: true }), tone('C', 4), tone('D', 4),
      tone('E', 4), tone('F', 4), tone('G', 4), tone('A', 4),
    ],
  },
  d_kurd_10: {
    name: 'D Kurd (10)',
    description: 'D Kurd with an extra high C tone field for more range.',
    tones: [
      tone('D', 3, { isDing: true }),
      tone('A', 3), tone('A#', 3, { preferFlats: true }), tone('C', 4), tone('D', 4),
      tone('E', 4), tone('F', 4), tone('G', 4), tone('A', 4), tone('C', 5),
    ],
  },
  d_amara: {
    name: 'D Amara / Celtic Minor (9)',
    description: 'D Kurd with the Bb left out and a high C added — a peaceful, floating sound with no dissonant intervals.',
    tones: [
      tone('D', 3, { isDing: true }),
      tone('A', 3), tone('C', 4), tone('D', 4), tone('E', 4),
      tone('F', 4), tone('G', 4), tone('A', 4), tone('C', 5),
    ],
  },
  d_integral: {
    name: 'D Integral / Mystic (9)',
    description: 'D minor with the 4th (G) left out and a doubled high C — an early, open handpan sound.',
    tones: [
      tone('D', 3, { isDing: true }),
      tone('A', 3), tone('A#', 3, { preferFlats: true }), tone('C', 4), tone('D', 4),
      tone('E', 4), tone('F', 4), tone('A', 4), tone('C', 5),
    ],
  },
  d_pygmy: {
    name: 'D Pygmy (7)',
    description: 'A five-note pentatonic scale — nearly every combination of notes sounds good, great for improvising.',
    tones: [
      tone('D', 3, { isDing: true }),
      tone('A', 3), tone('A#', 3, { preferFlats: true }), tone('D', 4), tone('E', 4), tone('F', 4), tone('A', 4),
    ],
  },
  c_kurd: {
    name: 'C Kurd (9)',
    description: 'The full natural-minor Kurd scale a whole step below D Kurd.',
    tones: [
      tone('C', 3, { isDing: true }),
      tone('G', 3), tone('G#', 3, { preferFlats: true }), tone('A#', 3, { preferFlats: true }), tone('C', 4),
      tone('D', 4), tone('D#', 4, { preferFlats: true }), tone('F', 4), tone('G', 4),
    ],
  },
  e_hijaz: {
    name: 'E Hijaz (9)',
    description: 'A raised-7th minor scale with an exotic, Middle Eastern character.',
    tones: [
      tone('E', 3, { isDing: true }),
      tone('B', 3), tone('C', 4), tone('D#', 4), tone('E', 4),
      tone('F#', 4), tone('G', 4), tone('A', 4), tone('B', 4),
    ],
  },
};

export const DEFAULT_HANDPAN_LAYOUT_KEY: HandpanLayoutKey = 'd_kurd_9';

export function isHandpanLayoutKey(key: string): key is HandpanLayoutKey {
  return (HANDPAN_LAYOUT_KEYS as readonly string[]).includes(key);
}

function resolveLayout(layoutKey: HandpanLayoutKey): HandpanLayout {
  return HANDPAN_LAYOUTS[layoutKey] ?? HANDPAN_LAYOUTS[DEFAULT_HANDPAN_LAYOUT_KEY];
}

/**
 * A "fake fretboard" spanning the tones of the given layout, one per fret on
 * a single virtual string (string 0), ordered exactly as the layout's tones
 * (fret 0 = Ding). This lets handpan reuse the same scale-exercise and
 * lesson-position machinery built for fretted instruments, just like voice's
 * virtual board in voiceRange.ts.
 */
export function getHandpanBoard(layoutKey: HandpanLayoutKey = DEFAULT_HANDPAN_LAYOUT_KEY): FretPosition[] {
  return resolveLayout(layoutKey).tones.map((t, i) => ({ string: 0, fret: i, note: t.note, octave: t.octave }));
}

export function getHandpanTones(layoutKey: HandpanLayoutKey = DEFAULT_HANDPAN_LAYOUT_KEY): HandpanTone[] {
  return resolveLayout(layoutKey).tones;
}

export function findHandpanTone(
  note: NoteName,
  octave: number,
  layoutKey: HandpanLayoutKey = DEFAULT_HANDPAN_LAYOUT_KEY,
): HandpanTone | undefined {
  return resolveLayout(layoutKey).tones.find((t) => t.note === note && t.octave === octave);
}
