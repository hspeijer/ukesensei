export const CHROMATIC_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export type NoteName = (typeof CHROMATIC_NOTES)[number];

export const ENHARMONIC_MAP: Record<string, NoteName> = {
  'Db': 'C#',
  'Eb': 'D#',
  'Fb': 'E',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'Cb': 'B',
  'E#': 'F',
  'B#': 'C',
};

const FLAT_NAMES: Record<NoteName, string> = {
  'C': 'C', 'C#': 'Db', 'D': 'D', 'D#': 'Eb', 'E': 'E', 'F': 'F',
  'F#': 'Gb', 'G': 'G', 'G#': 'Ab', 'A': 'A', 'A#': 'Bb', 'B': 'B',
};

export function noteToSemitone(note: string): number {
  const canonical = ENHARMONIC_MAP[note] ?? note;
  const idx = CHROMATIC_NOTES.indexOf(canonical as NoteName);
  if (idx === -1) throw new Error(`Unknown note: ${note}`);
  return idx;
}

export function semitoneToNote(semitone: number): NoteName {
  return CHROMATIC_NOTES[((semitone % 12) + 12) % 12];
}

export function displayNote(note: NoteName, preferFlats: boolean = false): string {
  return preferFlats ? FLAT_NAMES[note] : note;
}

export function frequencyToNote(frequency: number, a4 = 440): { note: NoteName; octave: number; cents: number } {
  const semitonesFromA4 = 12 * Math.log2(frequency / a4);
  const roundedSemitones = Math.round(semitonesFromA4);
  const cents = Math.round((semitonesFromA4 - roundedSemitones) * 100);

  const midiNote = 69 + roundedSemitones;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteIndex = ((midiNote % 12) + 12) % 12;

  return {
    note: CHROMATIC_NOTES[noteIndex],
    octave,
    cents,
  };
}

export function noteToFrequency(note: NoteName, octave: number, a4 = 440): number {
  const semitone = noteToSemitone(note);
  const midiNote = (octave + 1) * 12 + semitone;
  return a4 * Math.pow(2, (midiNote - 69) / 12);
}
