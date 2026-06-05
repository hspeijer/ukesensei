import { type NoteName, semitoneToNote, noteToSemitone } from './notes';

export interface FretPosition {
  string: number;   // 0-3 (G=0, C=1, E=2, A=3)
  fret: number;     // 0 = open, 1-15
  note: NoteName;
  octave: number;
}

export interface UkuleleTuning {
  name: string;
  strings: { note: NoteName; octave: number }[];
}

export const TUNINGS: Record<string, UkuleleTuning> = {
  standard: {
    name: 'Standard (High G)',
    strings: [
      { note: 'G', octave: 4 },
      { note: 'C', octave: 4 },
      { note: 'E', octave: 4 },
      { note: 'A', octave: 4 },
    ],
  },
  low_g: {
    name: 'Low G',
    strings: [
      { note: 'G', octave: 3 },
      { note: 'C', octave: 4 },
      { note: 'E', octave: 4 },
      { note: 'A', octave: 4 },
    ],
  },
};

export const STRING_LABELS = ['G', 'C', 'E', 'A'];
export const NUM_FRETS = 15;
export const FRET_MARKERS = [5, 7, 10, 12];
export const DOUBLE_FRET_MARKERS = [12];

export function generateFretboard(tuning: UkuleleTuning = TUNINGS.standard): FretPosition[] {
  const positions: FretPosition[] = [];

  for (let s = 0; s < tuning.strings.length; s++) {
    const openSemitone = noteToSemitone(tuning.strings[s].note);
    const openOctave = tuning.strings[s].octave;

    for (let f = 0; f <= NUM_FRETS; f++) {
      const totalSemitones = openSemitone + f;
      const note = semitoneToNote(totalSemitones);
      const octaveOffset = Math.floor((openSemitone + f) / 12) - Math.floor(openSemitone / 12);

      positions.push({
        string: s,
        fret: f,
        note,
        octave: openOctave + octaveOffset,
      });
    }
  }

  return positions;
}

export function getScalePositions(
  fretboard: FretPosition[],
  scaleNotes: NoteName[],
): FretPosition[] {
  return fretboard.filter(pos => scaleNotes.includes(pos.note));
}

export function findNotePositions(
  fretboard: FretPosition[],
  note: NoteName,
  octave?: number,
): FretPosition[] {
  return fretboard.filter(pos =>
    pos.note === note && (octave === undefined || pos.octave === octave)
  );
}

export function getPositionId(pos: FretPosition): string {
  return `s${pos.string}f${pos.fret}`;
}
