import { CHROMATIC_NOTES, type NoteName, noteToSemitone, semitoneToNote } from './notes';

export interface ScaleDefinition {
  name: string;
  intervals: number[];
  description: string;
}

export const SCALE_DEFINITIONS: Record<string, ScaleDefinition> = {
  ionian: {
    name: 'Major (Ionian)',
    intervals: [2, 2, 1, 2, 2, 2, 1],
    description: 'The standard major scale -- bright and happy.',
  },
  dorian: {
    name: 'Dorian',
    intervals: [2, 1, 2, 2, 2, 1, 2],
    description: 'Minor scale with a raised 6th -- jazzy and soulful.',
  },
  phrygian: {
    name: 'Phrygian',
    intervals: [1, 2, 2, 2, 1, 2, 2],
    description: 'Minor scale with a flat 2nd -- Spanish and exotic.',
  },
  lydian: {
    name: 'Lydian',
    intervals: [2, 2, 2, 1, 2, 2, 1],
    description: 'Major scale with a raised 4th -- dreamy and floating.',
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [2, 2, 1, 2, 2, 1, 2],
    description: 'Major scale with a flat 7th -- bluesy and dominant.',
  },
  aeolian: {
    name: 'Natural Minor (Aeolian)',
    intervals: [2, 1, 2, 2, 1, 2, 2],
    description: 'The standard minor scale -- sad and moody.',
  },
  locrian: {
    name: 'Locrian',
    intervals: [1, 2, 2, 1, 2, 2, 2],
    description: 'Diminished scale -- dark and unstable.',
  },
  pentatonic_major: {
    name: 'Major Pentatonic',
    intervals: [2, 2, 3, 2, 3],
    description: 'Five-note major scale -- versatile and easy to play.',
  },
  pentatonic_minor: {
    name: 'Minor Pentatonic',
    intervals: [3, 2, 2, 3, 2],
    description: 'Five-note minor scale -- great for blues and rock.',
  },
  blues: {
    name: 'Blues',
    intervals: [3, 2, 1, 1, 3, 2],
    description: 'Minor pentatonic with a blue note -- soulful and expressive.',
  },
};

export const SCALE_KEYS = Object.keys(SCALE_DEFINITIONS);

export function getScaleNotes(root: NoteName, scaleKey: string): NoteName[] {
  const def = SCALE_DEFINITIONS[scaleKey];
  if (!def) throw new Error(`Unknown scale: ${scaleKey}`);

  const notes: NoteName[] = [root];
  let current = noteToSemitone(root);

  for (const interval of def.intervals.slice(0, -1)) {
    current += interval;
    notes.push(semitoneToNote(current));
  }

  return notes;
}

export function isNoteInScale(note: NoteName, root: NoteName, scaleKey: string): boolean {
  const scaleNotes = getScaleNotes(root, scaleKey);
  return scaleNotes.includes(note);
}

export function getScaleDegree(note: NoteName, root: NoteName, scaleKey: string): number | null {
  const scaleNotes = getScaleNotes(root, scaleKey);
  const idx = scaleNotes.indexOf(note);
  return idx === -1 ? null : idx + 1;
}

export function getAllRoots(): NoteName[] {
  return [...CHROMATIC_NOTES];
}
