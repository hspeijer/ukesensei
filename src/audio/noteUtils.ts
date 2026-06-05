import { type NoteName, frequencyToNote } from '../theory/notes';
import {
  generateFretboard,
  findNotePositions,
  TUNINGS,
  type FretPosition,
  type UkuleleTuning,
} from '../theory/fretboard';

const fretboards = {
  standard: generateFretboard(TUNINGS.standard),
  low_g: generateFretboard(TUNINGS.low_g),
};

export interface NoteInfo {
  note: NoteName;
  octave: number;
  cents: number;
  frequency: number;
  positions: FretPosition[];
}

// G3 is ~196 Hz, so the floor must be below that for low G support
const MIN_FREQUENCY = 175;
const MAX_FREQUENCY = 1200;
const MIN_CLARITY = 0.85;

export function analyzeFrequency(
  frequency: number,
  clarity: number,
  tuningKey: 'standard' | 'low_g' = 'low_g',
): NoteInfo | null {
  if (clarity < MIN_CLARITY || frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY) return null;

  const { note, octave, cents } = frequencyToNote(frequency);
  const fretboard = fretboards[tuningKey];
  const positions = findNotePositions(fretboard, note, octave);

  return { note, octave, cents, frequency, positions };
}

/**
 * Detect tuning from a played note.
 * If we hear G3 (~196 Hz), the user has a low G string.
 * If we hear G4 (~392 Hz) on what would be the open G string, they have high G.
 */
export function detectTuningFromNote(
  note: NoteName,
  octave: number,
  frequency: number,
): 'standard' | 'low_g' | null {
  if (note !== 'G') return null;

  // G3 range: ~185-207 Hz (with some cents tolerance)
  if (octave === 3 && frequency >= 185 && frequency <= 210) return 'low_g';
  // G4 range: ~370-415 Hz
  if (octave === 4 && frequency >= 370 && frequency <= 415) return 'standard';

  return null;
}
