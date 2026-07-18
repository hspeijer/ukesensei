import { type NoteName, ENHARMONIC_MAP } from './notes';

/** Instruments that have a chord voicing database. */
export type ChordInstrument = 'ukulele' | 'guitar';

/**
 * Open-string notes in chord-chart order (low to high as drawn left-to-right
 * on a chord diagram). Note this differs from the fretboard component's
 * top-to-bottom drawing order for guitar.
 */
export const CHORD_CHART_STRINGS: Record<ChordInstrument, NoteName[]> = {
  ukulele: ['G', 'C', 'E', 'A'],
  guitar: ['E', 'A', 'D', 'G', 'B', 'E'],
};

export interface ChordVoicing {
  name: string;
  suffix: string;
  /** One entry per string in chord-chart order; 0 = open, -1 = muted. */
  frets: number[];
  /** 0 = open/muted, 1-4 = finger. */
  fingers: number[];
  barres?: number[];
}

export const CHORD_QUALITIES: Record<string, { intervals: number[]; suffix: string; priority: number }> = {
  major:      { intervals: [0, 4, 7],     suffix: '',     priority: 10 },
  minor:      { intervals: [0, 3, 7],     suffix: 'm',    priority: 9 },
  dom7:       { intervals: [0, 4, 7, 10], suffix: '7',    priority: 7 },
  maj7:       { intervals: [0, 4, 7, 11], suffix: 'maj7', priority: 6 },
  min7:       { intervals: [0, 3, 7, 10], suffix: 'm7',   priority: 6 },
  dim:        { intervals: [0, 3, 6],     suffix: 'dim',  priority: 4 },
  dim7:       { intervals: [0, 3, 6, 9],  suffix: 'dim7', priority: 4 },
  halfdim:    { intervals: [0, 3, 6, 10], suffix: 'm7b5', priority: 4 },
  aug:        { intervals: [0, 4, 8],     suffix: 'aug',  priority: 4 },
  sus2:       { intervals: [0, 2, 7],     suffix: 'sus2', priority: 5 },
  sus4:       { intervals: [0, 5, 7],     suffix: 'sus4', priority: 5 },
  dom9:       { intervals: [0, 4, 7, 10, 14], suffix: '9', priority: 3 },
  add9:       { intervals: [0, 4, 7, 14], suffix: 'add9', priority: 3 },
  min6:       { intervals: [0, 3, 7, 9],  suffix: 'm6',   priority: 3 },
  dom6:       { intervals: [0, 4, 7, 9],  suffix: '6',    priority: 3 },
};

export const UKULELE_VOICINGS: ChordVoicing[] = [
  // Major chords
  { name: 'C',  suffix: '',     frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  { name: 'D',  suffix: '',     frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0], barres: [2] },
  { name: 'E',  suffix: '',     frets: [1, 4, 0, 2], fingers: [1, 4, 0, 2] },
  { name: 'F',  suffix: '',     frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  { name: 'G',  suffix: '',     frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  { name: 'A',  suffix: '',     frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  { name: 'B',  suffix: '',     frets: [4, 3, 2, 2], fingers: [4, 3, 1, 1], barres: [2] },
  { name: 'Bb', suffix: '',     frets: [3, 2, 1, 1], fingers: [4, 3, 1, 1], barres: [1] },
  { name: 'Eb', suffix: '',     frets: [0, 3, 3, 1], fingers: [0, 2, 3, 1] },
  { name: 'Ab', suffix: '',     frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1], barres: [3] },
  { name: 'Db', suffix: '',     frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4], barres: [1] },
  { name: 'Gb', suffix: '',     frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1], barres: [1] },

  // Minor chords
  { name: 'C',  suffix: 'm',    frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
  { name: 'C#', suffix: 'm',    frets: [1, 1, 0, 4], fingers: [1, 1, 0, 2], barres: [1] },
  { name: 'D',  suffix: 'm',    frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  { name: 'D#', suffix: 'm',    frets: [3, 3, 2, 1], fingers: [3, 4, 2, 1] },
  { name: 'E',  suffix: 'm',    frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  { name: 'F',  suffix: 'm',    frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
  { name: 'F#', suffix: 'm',    frets: [2, 1, 2, 0], fingers: [2, 1, 3, 0] },
  { name: 'G',  suffix: 'm',    frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },
  { name: 'G#', suffix: 'm',    frets: [4, 3, 4, 2], fingers: [3, 2, 4, 1] },
  { name: 'A',  suffix: 'm',    frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] },
  { name: 'B',  suffix: 'm',    frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1], barres: [2] },
  { name: 'Bb', suffix: 'm',    frets: [3, 1, 1, 1], fingers: [4, 1, 1, 1], barres: [1] },

  // 7th chords
  { name: 'C',  suffix: '7',    frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  { name: 'C#', suffix: '7',    frets: [1, 1, 1, 2], fingers: [1, 1, 1, 2], barres: [1] },
  { name: 'D',  suffix: '7',    frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2], barres: [2] },
  { name: 'D#', suffix: '7',    frets: [3, 3, 3, 4], fingers: [1, 1, 1, 2], barres: [3] },
  { name: 'E',  suffix: '7',    frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
  { name: 'F',  suffix: '7',    frets: [2, 3, 1, 0], fingers: [2, 3, 1, 0] },
  { name: 'F#', suffix: '7',    frets: [3, 4, 2, 4], fingers: [2, 3, 1, 4] },
  { name: 'G',  suffix: '7',    frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },
  { name: 'G#', suffix: '7',    frets: [1, 3, 2, 3], fingers: [1, 3, 2, 4] },
  { name: 'A',  suffix: '7',    frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
  { name: 'B',  suffix: '7',    frets: [2, 3, 2, 2], fingers: [1, 2, 1, 1], barres: [2] },
  { name: 'Bb', suffix: '7',    frets: [1, 2, 1, 1], fingers: [1, 2, 1, 1], barres: [1] },

  // Minor 7th chords
  { name: 'C',  suffix: 'm7',   frets: [3, 3, 3, 3], fingers: [1, 1, 1, 1], barres: [3] },
  { name: 'C#', suffix: 'm7',   frets: [1, 1, 0, 2], fingers: [1, 1, 0, 2], barres: [1] },
  { name: 'D',  suffix: 'm7',   frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  { name: 'D#', suffix: 'm7',   frets: [3, 3, 2, 4], fingers: [2, 3, 1, 4] },
  { name: 'E',  suffix: 'm7',   frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  { name: 'F',  suffix: 'm7',   frets: [1, 3, 1, 3], fingers: [1, 3, 2, 4] },
  { name: 'F#', suffix: 'm7',   frets: [2, 4, 2, 4], fingers: [1, 3, 2, 4] },
  { name: 'G',  suffix: 'm7',   frets: [0, 2, 1, 1], fingers: [0, 3, 1, 2] },
  { name: 'G#', suffix: 'm7',   frets: [1, 3, 2, 2], fingers: [1, 4, 2, 3] },
  { name: 'A',  suffix: 'm7',   frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  { name: 'A#', suffix: 'm7',   frets: [1, 1, 1, 1], fingers: [1, 1, 1, 1], barres: [1] },
  { name: 'B',  suffix: 'm7',   frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1], barres: [2] },

  // Maj7 chords
  { name: 'C',  suffix: 'maj7', frets: [0, 0, 0, 2], fingers: [0, 0, 0, 1] },
  { name: 'C#', suffix: 'maj7', frets: [1, 1, 1, 3], fingers: [1, 1, 1, 2], barres: [1] },
  { name: 'D',  suffix: 'maj7', frets: [2, 2, 2, 4], fingers: [1, 1, 1, 2], barres: [2] },
  { name: 'D#', suffix: 'maj7', frets: [3, 3, 3, 5], fingers: [1, 1, 1, 3], barres: [3] },
  { name: 'E',  suffix: 'maj7', frets: [1, 3, 0, 2], fingers: [1, 3, 0, 2] },
  { name: 'F',  suffix: 'maj7', frets: [2, 4, 1, 0], fingers: [2, 4, 1, 0] },
  { name: 'F#', suffix: 'maj7', frets: [3, 5, 2, 4], fingers: [2, 4, 1, 3] },
  { name: 'G',  suffix: 'maj7', frets: [0, 2, 2, 2], fingers: [0, 1, 2, 3] },
  { name: 'G#', suffix: 'maj7', frets: [0, 3, 4, 3], fingers: [0, 1, 3, 2] },
  { name: 'A',  suffix: 'maj7', frets: [1, 1, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'A#', suffix: 'maj7', frets: [3, 2, 1, 0], fingers: [3, 2, 1, 0] },
  { name: 'B',  suffix: 'maj7', frets: [3, 3, 2, 2], fingers: [2, 3, 1, 1], barres: [2] },

  // Dim chords (pure diminished triads)
  { name: 'C',  suffix: 'dim',  frets: [5, 3, 2, 3], fingers: [4, 2, 1, 3] },
  { name: 'C#', suffix: 'dim',  frets: [0, 4, 0, 4], fingers: [0, 1, 0, 2] },
  { name: 'D',  suffix: 'dim',  frets: [7, 5, 4, 5], fingers: [4, 2, 1, 3] },
  { name: 'D#', suffix: 'dim',  frets: [2, 3, 2, 0], fingers: [1, 3, 2, 0] },
  { name: 'E',  suffix: 'dim',  frets: [0, 4, 0, 1], fingers: [0, 2, 0, 1] },
  { name: 'F',  suffix: 'dim',  frets: [4, 5, 4, 2], fingers: [2, 4, 3, 1] },
  { name: 'F#', suffix: 'dim',  frets: [2, 0, 2, 0], fingers: [1, 0, 2, 0] },
  { name: 'G',  suffix: 'dim',  frets: [0, 1, 3, 1], fingers: [0, 1, 3, 2] },
  { name: 'G#', suffix: 'dim',  frets: [1, 2, 4, 2], fingers: [1, 2, 4, 3] },
  { name: 'A',  suffix: 'dim',  frets: [5, 3, 5, 0], fingers: [2, 1, 3, 0] },
  { name: 'A#', suffix: 'dim',  frets: [3, 1, 0, 1], fingers: [3, 1, 0, 2] },
  { name: 'B',  suffix: 'dim',  frets: [4, 2, 1, 2], fingers: [4, 2, 1, 3] },

  // Dim7 chords (symmetric: the same shape repeats every 3 frets)
  { name: 'C',  suffix: 'dim7', frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  { name: 'C#', suffix: 'dim7', frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  { name: 'D',  suffix: 'dim7', frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  { name: 'D#', suffix: 'dim7', frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  { name: 'E',  suffix: 'dim7', frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  { name: 'F',  suffix: 'dim7', frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  { name: 'F#', suffix: 'dim7', frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  { name: 'G',  suffix: 'dim7', frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  { name: 'G#', suffix: 'dim7', frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },
  { name: 'A',  suffix: 'dim7', frets: [2, 3, 2, 3], fingers: [1, 3, 2, 4] },
  { name: 'A#', suffix: 'dim7', frets: [0, 1, 0, 1], fingers: [0, 1, 0, 2] },
  { name: 'B',  suffix: 'dim7', frets: [1, 2, 1, 2], fingers: [1, 3, 2, 4] },

  // Half-diminished (m7b5) chords
  { name: 'C',  suffix: 'm7b5', frets: [3, 3, 2, 3], fingers: [2, 3, 1, 4] },
  { name: 'C#', suffix: 'm7b5', frets: [0, 1, 0, 2], fingers: [0, 1, 0, 2] },
  { name: 'D',  suffix: 'm7b5', frets: [1, 2, 1, 3], fingers: [1, 3, 2, 4] },
  { name: 'D#', suffix: 'm7b5', frets: [2, 3, 2, 4], fingers: [1, 3, 2, 4] },
  { name: 'E',  suffix: 'm7b5', frets: [0, 2, 0, 1], fingers: [0, 2, 0, 1] },
  { name: 'F',  suffix: 'm7b5', frets: [1, 3, 1, 2], fingers: [1, 4, 2, 3] },
  { name: 'F#', suffix: 'm7b5', frets: [5, 6, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'G',  suffix: 'm7b5', frets: [0, 1, 1, 1], fingers: [0, 1, 1, 1], barres: [1] },
  { name: 'G#', suffix: 'm7b5', frets: [1, 2, 2, 2], fingers: [1, 2, 3, 4] },
  { name: 'A',  suffix: 'm7b5', frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  { name: 'A#', suffix: 'm7b5', frets: [1, 1, 0, 1], fingers: [1, 2, 0, 3] },
  { name: 'B',  suffix: 'm7b5', frets: [2, 2, 1, 2], fingers: [2, 3, 1, 4] },

  // Augmented chords (symmetric: the same shape repeats every 4 frets)
  { name: 'C',  suffix: 'aug',  frets: [1, 0, 0, 3], fingers: [1, 0, 0, 2] },
  { name: 'C#', suffix: 'aug',  frets: [2, 1, 1, 0], fingers: [2, 1, 1, 0], barres: [1] },
  { name: 'D',  suffix: 'aug',  frets: [3, 2, 2, 1], fingers: [4, 2, 3, 1] },
  { name: 'D#', suffix: 'aug',  frets: [0, 3, 3, 2], fingers: [0, 2, 3, 1] },
  { name: 'E',  suffix: 'aug',  frets: [1, 0, 0, 3], fingers: [1, 0, 0, 2] },
  { name: 'F',  suffix: 'aug',  frets: [2, 1, 1, 0], fingers: [2, 1, 1, 0], barres: [1] },
  { name: 'F#', suffix: 'aug',  frets: [3, 2, 2, 1], fingers: [4, 2, 3, 1] },
  { name: 'G',  suffix: 'aug',  frets: [0, 3, 3, 2], fingers: [0, 2, 3, 1] },
  { name: 'G#', suffix: 'aug',  frets: [1, 0, 0, 3], fingers: [1, 0, 0, 2] },
  { name: 'A',  suffix: 'aug',  frets: [2, 1, 1, 0], fingers: [2, 1, 1, 0], barres: [1] },
  { name: 'A#', suffix: 'aug',  frets: [3, 2, 2, 1], fingers: [4, 2, 3, 1] },
  { name: 'B',  suffix: 'aug',  frets: [0, 3, 3, 2], fingers: [0, 2, 3, 1] },

  // Sus2 chords
  { name: 'C',  suffix: 'sus2', frets: [0, 2, 3, 3], fingers: [0, 1, 2, 3] },
  { name: 'C#', suffix: 'sus2', frets: [1, 3, 4, 4], fingers: [1, 2, 3, 4] },
  { name: 'D',  suffix: 'sus2', frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'D#', suffix: 'sus2', frets: [3, 3, 1, 1], fingers: [2, 3, 1, 1], barres: [1] },
  { name: 'E',  suffix: 'sus2', frets: [4, 4, 2, 2], fingers: [2, 3, 1, 1], barres: [2] },
  { name: 'F',  suffix: 'sus2', frets: [0, 0, 1, 3], fingers: [0, 0, 1, 2] },
  { name: 'F#', suffix: 'sus2', frets: [1, 1, 2, 4], fingers: [1, 1, 2, 3], barres: [1] },
  { name: 'G',  suffix: 'sus2', frets: [0, 2, 3, 0], fingers: [0, 1, 2, 0] },
  { name: 'G#', suffix: 'sus2', frets: [1, 3, 4, 1], fingers: [1, 3, 4, 2] },
  { name: 'A',  suffix: 'sus2', frets: [4, 4, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'A#', suffix: 'sus2', frets: [3, 0, 1, 1], fingers: [2, 0, 1, 1], barres: [1] },
  { name: 'B',  suffix: 'sus2', frets: [4, 1, 2, 2], fingers: [4, 1, 2, 3] },

  // Sus4 chords
  { name: 'C',  suffix: 'sus4', frets: [0, 0, 1, 3], fingers: [0, 0, 1, 2] },
  { name: 'C#', suffix: 'sus4', frets: [1, 1, 2, 4], fingers: [1, 1, 2, 3], barres: [1] },
  { name: 'D',  suffix: 'sus4', frets: [0, 2, 3, 0], fingers: [0, 1, 2, 0] },
  { name: 'D#', suffix: 'sus4', frets: [1, 3, 4, 1], fingers: [1, 3, 4, 2] },
  { name: 'E',  suffix: 'sus4', frets: [4, 4, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'F',  suffix: 'sus4', frets: [3, 0, 1, 1], fingers: [2, 0, 1, 1], barres: [1] },
  { name: 'F#', suffix: 'sus4', frets: [4, 1, 2, 2], fingers: [4, 1, 2, 3] },
  { name: 'G',  suffix: 'sus4', frets: [0, 2, 3, 3], fingers: [0, 1, 2, 3] },
  { name: 'G#', suffix: 'sus4', frets: [1, 3, 4, 4], fingers: [1, 2, 3, 4] },
  { name: 'A',  suffix: 'sus4', frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'A#', suffix: 'sus4', frets: [3, 3, 1, 1], fingers: [2, 3, 1, 1], barres: [1] },
  { name: 'B',  suffix: 'sus4', frets: [4, 4, 2, 2], fingers: [2, 3, 1, 1], barres: [2] },

  // Dominant 9th chords (5th omitted where needed on 4 strings)
  { name: 'C',  suffix: '9',    frets: [3, 2, 0, 3], fingers: [2, 1, 0, 3] },
  { name: 'C#', suffix: '9',    frets: [4, 3, 1, 4], fingers: [3, 2, 1, 4] },
  { name: 'D',  suffix: '9',    frets: [5, 6, 0, 5], fingers: [1, 3, 0, 2] },
  { name: 'D#', suffix: '9',    frets: [0, 3, 1, 4], fingers: [0, 2, 1, 3] },
  { name: 'E',  suffix: '9',    frets: [7, 6, 4, 7], fingers: [3, 2, 1, 4] },
  { name: 'F',  suffix: '9',    frets: [0, 3, 1, 0], fingers: [0, 2, 1, 0] },
  { name: 'F#', suffix: '9',    frets: [1, 4, 2, 1], fingers: [1, 4, 3, 2] },
  { name: 'G',  suffix: '9',    frets: [4, 5, 3, 0], fingers: [2, 3, 1, 0] },
  { name: 'G#', suffix: '9',    frets: [1, 0, 2, 1], fingers: [1, 0, 3, 2] },
  { name: 'A',  suffix: '9',    frets: [2, 1, 3, 2], fingers: [2, 1, 4, 3] },
  { name: 'A#', suffix: '9',    frets: [3, 2, 4, 3], fingers: [2, 1, 4, 3] },
  { name: 'B',  suffix: '9',    frets: [4, 3, 5, 4], fingers: [2, 1, 4, 3] },

  // Add9 chords
  { name: 'C',  suffix: 'add9', frets: [0, 2, 0, 3], fingers: [0, 1, 0, 2] },
  { name: 'C#', suffix: 'add9', frets: [1, 3, 1, 4], fingers: [1, 3, 2, 4] },
  { name: 'D',  suffix: 'add9', frets: [7, 6, 0, 0], fingers: [2, 1, 0, 0] },
  { name: 'D#', suffix: 'add9', frets: [0, 3, 1, 1], fingers: [0, 2, 1, 1], barres: [1] },
  { name: 'E',  suffix: 'add9', frets: [1, 4, 2, 2], fingers: [1, 4, 2, 3] },
  { name: 'F',  suffix: 'add9', frets: [0, 0, 1, 0], fingers: [0, 0, 1, 0] },
  { name: 'F#', suffix: 'add9', frets: [1, 1, 2, 1], fingers: [1, 1, 2, 1], barres: [1] },
  { name: 'G',  suffix: 'add9', frets: [2, 2, 3, 2], fingers: [1, 1, 2, 1], barres: [2] },
  { name: 'G#', suffix: 'add9', frets: [3, 0, 4, 3], fingers: [1, 0, 3, 2] },
  { name: 'A',  suffix: 'add9', frets: [2, 1, 0, 2], fingers: [2, 1, 0, 3] },
  { name: 'A#', suffix: 'add9', frets: [3, 2, 1, 3], fingers: [3, 2, 1, 4] },
  { name: 'B',  suffix: 'add9', frets: [4, 3, 2, 4], fingers: [3, 2, 1, 4] },

  // Minor 6th chords
  { name: 'C',  suffix: 'm6',   frets: [2, 3, 3, 3], fingers: [1, 2, 3, 4] },
  { name: 'C#', suffix: 'm6',   frets: [1, 1, 0, 1], fingers: [1, 2, 0, 3] },
  { name: 'D',  suffix: 'm6',   frets: [2, 2, 1, 2], fingers: [2, 3, 1, 4] },
  { name: 'D#', suffix: 'm6',   frets: [3, 3, 2, 3], fingers: [2, 3, 1, 4] },
  { name: 'E',  suffix: 'm6',   frets: [0, 1, 0, 2], fingers: [0, 1, 0, 2] },
  { name: 'F',  suffix: 'm6',   frets: [1, 2, 1, 3], fingers: [1, 3, 2, 4] },
  { name: 'F#', suffix: 'm6',   frets: [2, 3, 2, 0], fingers: [1, 3, 2, 0] },
  { name: 'G',  suffix: 'm6',   frets: [0, 2, 0, 1], fingers: [0, 2, 0, 1] },
  { name: 'G#', suffix: 'm6',   frets: [1, 3, 1, 2], fingers: [1, 4, 2, 3] },
  { name: 'A',  suffix: 'm6',   frets: [2, 0, 2, 0], fingers: [1, 0, 2, 0] },
  { name: 'A#', suffix: 'm6',   frets: [0, 1, 1, 1], fingers: [0, 1, 1, 1], barres: [1] },
  { name: 'B',  suffix: 'm6',   frets: [1, 2, 2, 2], fingers: [1, 2, 3, 4] },

  // Major 6th chords
  { name: 'C',  suffix: '6',    frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  { name: 'C#', suffix: '6',    frets: [1, 1, 1, 1], fingers: [1, 1, 1, 1], barres: [1] },
  { name: 'D',  suffix: '6',    frets: [2, 2, 2, 2], fingers: [1, 1, 1, 1], barres: [2] },
  { name: 'D#', suffix: '6',    frets: [0, 3, 3, 3], fingers: [0, 1, 1, 1], barres: [3] },
  { name: 'E',  suffix: '6',    frets: [1, 1, 0, 2], fingers: [1, 1, 0, 2], barres: [1] },
  { name: 'F',  suffix: '6',    frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  { name: 'F#', suffix: '6',    frets: [3, 3, 2, 1], fingers: [3, 4, 2, 1] },
  { name: 'G',  suffix: '6',    frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  { name: 'G#', suffix: '6',    frets: [1, 0, 1, 3], fingers: [1, 0, 2, 3] },
  { name: 'A',  suffix: '6',    frets: [2, 1, 2, 0], fingers: [2, 1, 3, 0] },
  { name: 'A#', suffix: '6',    frets: [0, 2, 1, 1], fingers: [0, 2, 1, 1], barres: [1] },
  { name: 'B',  suffix: '6',    frets: [1, 3, 2, 2], fingers: [1, 4, 2, 3] },
];

/**
 * Guitar chord voicings for standard tuning, strings in chord-chart order
 * (low E to high E). Open-position shapes where they exist, otherwise the
 * standard E-shape/A-shape barre forms; -1 = muted string.
 */
export const GUITAR_VOICINGS: ChordVoicing[] = [
  // Major chords
  { name: 'C',  suffix: '',     frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  { name: 'C#', suffix: '',     frets: [-1, 4, 3, 1, 2, 1], fingers: [0, 4, 3, 1, 2, 1], barres: [1] },
  { name: 'D',  suffix: '',     frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  { name: 'D#', suffix: '',     frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  { name: 'E',  suffix: '',     frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  { name: 'F',  suffix: '',     frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [1] },
  { name: 'F#', suffix: '',     frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barres: [2] },
  { name: 'G',  suffix: '',     frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  { name: 'G#', suffix: '',     frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], barres: [4] },
  { name: 'A',  suffix: '',     frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { name: 'A#', suffix: '',     frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], barres: [1, 3] },
  { name: 'B',  suffix: '',     frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], barres: [2, 4] },

  // Minor chords
  { name: 'C',  suffix: 'm',    frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barres: [3] },
  { name: 'C#', suffix: 'm',    frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], barres: [4] },
  { name: 'D',  suffix: 'm',    frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  { name: 'D#', suffix: 'm',    frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },
  { name: 'E',  suffix: 'm',    frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  { name: 'F',  suffix: 'm',    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barres: [1] },
  { name: 'F#', suffix: 'm',    frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barres: [2] },
  { name: 'G',  suffix: 'm',    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barres: [3] },
  { name: 'G#', suffix: 'm',    frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], barres: [4] },
  { name: 'A',  suffix: 'm',    frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  { name: 'A#', suffix: 'm',    frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barres: [1] },
  { name: 'B',  suffix: 'm',    frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barres: [2] },

  // 7th chords
  { name: 'C',  suffix: '7',    frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  { name: 'C#', suffix: '7',    frets: [-1, 4, 6, 4, 6, 4], fingers: [0, 1, 3, 1, 4, 1], barres: [4] },
  { name: 'D',  suffix: '7',    frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  { name: 'D#', suffix: '7',    frets: [-1, -1, 1, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'E',  suffix: '7',    frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  { name: 'F',  suffix: '7',    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barres: [1] },
  { name: 'F#', suffix: '7',    frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], barres: [2] },
  { name: 'G',  suffix: '7',    frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  { name: 'G#', suffix: '7',    frets: [4, 6, 4, 5, 4, 4], fingers: [1, 3, 1, 2, 1, 1], barres: [4] },
  { name: 'A',  suffix: '7',    frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  { name: 'A#', suffix: '7',    frets: [-1, 1, 3, 1, 3, 1], fingers: [0, 1, 3, 1, 4, 1], barres: [1] },
  { name: 'B',  suffix: '7',    frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

  // Minor 7th chords
  { name: 'C',  suffix: 'm7',   frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], barres: [3] },
  { name: 'C#', suffix: 'm7',   frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], barres: [4] },
  { name: 'D',  suffix: 'm7',   frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barres: [1] },
  { name: 'D#', suffix: 'm7',   frets: [-1, -1, 1, 3, 2, 2], fingers: [0, 0, 1, 4, 2, 3] },
  { name: 'E',  suffix: 'm7',   frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
  { name: 'F',  suffix: 'm7',   frets: [1, 3, 1, 1, 1, 1], fingers: [1, 3, 1, 1, 1, 1], barres: [1] },
  { name: 'F#', suffix: 'm7',   frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], barres: [2] },
  { name: 'G',  suffix: 'm7',   frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], barres: [3] },
  { name: 'G#', suffix: 'm7',   frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], barres: [4] },
  { name: 'A',  suffix: 'm7',   frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  { name: 'A#', suffix: 'm7',   frets: [-1, 1, 3, 1, 2, 1], fingers: [0, 1, 3, 1, 2, 1], barres: [1] },
  { name: 'B',  suffix: 'm7',   frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], barres: [2] },

  // Maj7 chords
  { name: 'C',  suffix: 'maj7', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  { name: 'C#', suffix: 'maj7', frets: [-1, 4, 3, 1, 1, 1], fingers: [0, 4, 3, 1, 1, 1], barres: [1] },
  { name: 'D',  suffix: 'maj7', frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  { name: 'D#', suffix: 'maj7', frets: [-1, -1, 1, 3, 3, 3], fingers: [0, 0, 1, 2, 3, 4] },
  { name: 'E',  suffix: 'maj7', frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  { name: 'F',  suffix: 'maj7', frets: [-1, 3, 3, 2, 1, 0], fingers: [0, 3, 4, 2, 1, 0] },
  { name: 'F#', suffix: 'maj7', frets: [2, 4, 3, 3, 2, 2], fingers: [1, 4, 2, 3, 1, 1], barres: [2] },
  { name: 'G',  suffix: 'maj7', frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },
  { name: 'G#', suffix: 'maj7', frets: [4, 6, 5, 5, 4, 4], fingers: [1, 4, 2, 3, 1, 1], barres: [4] },
  { name: 'A',  suffix: 'maj7', frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  { name: 'A#', suffix: 'maj7', frets: [-1, 1, 3, 2, 3, 1], fingers: [0, 1, 3, 2, 4, 1], barres: [1] },
  { name: 'B',  suffix: 'maj7', frets: [-1, 2, 4, 3, 4, 2], fingers: [0, 1, 3, 2, 4, 1], barres: [2] },

  // Dim7 chords (symmetric: the same shape repeats every 3 frets)
  { name: 'C',  suffix: 'dim7', frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'C#', suffix: 'dim7', frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'D',  suffix: 'dim7', frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  { name: 'D#', suffix: 'dim7', frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'E',  suffix: 'dim7', frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'F',  suffix: 'dim7', frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  { name: 'F#', suffix: 'dim7', frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'G',  suffix: 'dim7', frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'G#', suffix: 'dim7', frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },
  { name: 'A',  suffix: 'dim7', frets: [-1, -1, 1, 2, 1, 2], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'A#', suffix: 'dim7', frets: [-1, -1, 2, 3, 2, 3], fingers: [0, 0, 1, 3, 2, 4] },
  { name: 'B',  suffix: 'dim7', frets: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2] },

  // Dim chords (pure diminished triads)
  { name: 'C',  suffix: 'dim',  frets: [-1, 3, 4, 5, 4, -1], fingers: [0, 1, 2, 4, 3, 0] },
  { name: 'C#', suffix: 'dim',  frets: [-1, 4, 2, 0, 2, 0], fingers: [0, 3, 1, 0, 2, 0] },
  { name: 'D',  suffix: 'dim',  frets: [-1, -1, 0, 1, 3, 1], fingers: [0, 0, 0, 1, 3, 2] },
  { name: 'D#', suffix: 'dim',  frets: [-1, -1, 1, 2, 4, 2], fingers: [0, 0, 1, 2, 4, 3] },
  { name: 'E',  suffix: 'dim',  frets: [0, 1, 2, 0, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
  { name: 'F',  suffix: 'dim',  frets: [1, 2, 3, 1, 0, -1], fingers: [1, 3, 4, 2, 0, 0] },
  { name: 'F#', suffix: 'dim',  frets: [2, 0, 4, 2, 1, -1], fingers: [2, 0, 4, 3, 1, 0] },
  { name: 'G',  suffix: 'dim',  frets: [3, 4, 5, 3, -1, -1], fingers: [1, 2, 3, 1, 0, 0], barres: [3] },
  { name: 'G#', suffix: 'dim',  frets: [4, 2, 0, 1, 0, 4], fingers: [3, 2, 0, 1, 0, 4] },
  { name: 'A',  suffix: 'dim',  frets: [-1, 0, 1, 2, 1, -1], fingers: [0, 0, 1, 3, 2, 0] },
  { name: 'A#', suffix: 'dim',  frets: [-1, 1, 2, 3, 2, 0], fingers: [0, 1, 2, 4, 3, 0] },
  { name: 'B',  suffix: 'dim',  frets: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0] },

  // Half-diminished (m7b5) chords
  { name: 'C',  suffix: 'm7b5', frets: [-1, 3, 4, 3, 4, -1], fingers: [0, 1, 3, 2, 4, 0] },
  { name: 'C#', suffix: 'm7b5', frets: [-1, 4, 5, 4, 5, -1], fingers: [0, 1, 3, 2, 4, 0] },
  { name: 'D',  suffix: 'm7b5', frets: [-1, -1, 0, 1, 1, 1], fingers: [0, 0, 0, 1, 1, 1], barres: [1] },
  { name: 'D#', suffix: 'm7b5', frets: [-1, -1, 1, 2, 2, 2], fingers: [0, 0, 1, 2, 3, 4] },
  { name: 'E',  suffix: 'm7b5', frets: [-1, -1, 2, 3, 3, 3], fingers: [0, 0, 1, 2, 3, 4] },
  { name: 'F',  suffix: 'm7b5', frets: [-1, -1, 3, 4, 4, 4], fingers: [0, 0, 1, 2, 3, 4] },
  { name: 'F#', suffix: 'm7b5', frets: [2, -1, 2, 2, 1, -1], fingers: [2, 0, 3, 4, 1, 0] },
  { name: 'G',  suffix: 'm7b5', frets: [3, -1, 3, 3, 2, -1], fingers: [2, 0, 3, 4, 1, 0] },
  { name: 'G#', suffix: 'm7b5', frets: [4, -1, 4, 4, 3, -1], fingers: [2, 0, 3, 4, 1, 0] },
  { name: 'A',  suffix: 'm7b5', frets: [-1, 0, 1, 0, 1, -1], fingers: [0, 0, 1, 0, 2, 0] },
  { name: 'A#', suffix: 'm7b5', frets: [-1, 1, 2, 1, 2, -1], fingers: [0, 1, 3, 2, 4, 0] },
  { name: 'B',  suffix: 'm7b5', frets: [-1, 2, 3, 2, 3, -1], fingers: [0, 1, 3, 2, 4, 0] },

  // Augmented chords
  { name: 'C',  suffix: 'aug',  frets: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  { name: 'C#', suffix: 'aug',  frets: [-1, 4, 3, 2, 2, -1], fingers: [0, 4, 3, 1, 2, 0] },
  { name: 'D',  suffix: 'aug',  frets: [-1, -1, 0, 3, 3, 2], fingers: [0, 0, 0, 2, 3, 1] },
  { name: 'D#', suffix: 'aug',  frets: [-1, -1, 1, 0, 0, 3], fingers: [0, 0, 1, 0, 0, 3] },
  { name: 'E',  suffix: 'aug',  frets: [0, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0] },
  { name: 'F',  suffix: 'aug',  frets: [1, 0, 3, 2, 2, -1], fingers: [1, 0, 4, 2, 3, 0] },
  { name: 'F#', suffix: 'aug',  frets: [2, 1, 0, 3, 3, -1], fingers: [2, 1, 0, 3, 4, 0] },
  { name: 'G',  suffix: 'aug',  frets: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4] },
  { name: 'G#', suffix: 'aug',  frets: [4, 3, 2, 1, 1, -1], fingers: [4, 3, 2, 1, 1, 0], barres: [1] },
  { name: 'A',  suffix: 'aug',  frets: [-1, 0, 3, 2, 2, 1], fingers: [0, 0, 4, 2, 3, 1] },
  { name: 'A#', suffix: 'aug',  frets: [-1, 1, 0, 3, 3, 2], fingers: [0, 1, 0, 3, 4, 2] },
  { name: 'B',  suffix: 'aug',  frets: [-1, 2, 1, 0, 0, -1], fingers: [0, 2, 1, 0, 0, 0] },

  // Sus2 chords
  { name: 'C',  suffix: 'sus2', frets: [-1, 3, 0, 0, 3, 3], fingers: [0, 2, 0, 0, 3, 4] },
  { name: 'C#', suffix: 'sus2', frets: [-1, 4, 6, 6, 4, 4], fingers: [0, 1, 3, 4, 1, 1], barres: [4] },
  { name: 'D',  suffix: 'sus2', frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
  { name: 'D#', suffix: 'sus2', frets: [-1, -1, 1, 3, 4, 1], fingers: [0, 0, 1, 3, 4, 1], barres: [1] },
  { name: 'E',  suffix: 'sus2', frets: [0, 2, 4, 4, 0, 0], fingers: [0, 1, 3, 4, 0, 0] },
  { name: 'F',  suffix: 'sus2', frets: [1, 3, 3, 0, 1, -1], fingers: [1, 3, 4, 0, 2, 0] },
  { name: 'F#', suffix: 'sus2', frets: [-1, -1, 4, 1, 2, 2], fingers: [0, 0, 4, 1, 2, 3] },
  { name: 'G',  suffix: 'sus2', frets: [3, 0, 0, 2, 3, 3], fingers: [2, 0, 0, 1, 3, 4] },
  { name: 'G#', suffix: 'sus2', frets: [-1, -1, 6, 3, 4, 4], fingers: [0, 0, 4, 1, 2, 3] },
  { name: 'A',  suffix: 'sus2', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  { name: 'A#', suffix: 'sus2', frets: [-1, 1, 3, 3, 1, 1], fingers: [0, 1, 3, 4, 1, 1], barres: [1] },
  { name: 'B',  suffix: 'sus2', frets: [-1, 2, 4, 4, 2, 2], fingers: [0, 1, 3, 4, 1, 1], barres: [2] },

  // Sus4 chords
  { name: 'C',  suffix: 'sus4', frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], barres: [1] },
  { name: 'C#', suffix: 'sus4', frets: [-1, 4, 6, 6, 7, 4], fingers: [0, 1, 2, 3, 4, 1], barres: [4] },
  { name: 'D',  suffix: 'sus4', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
  { name: 'D#', suffix: 'sus4', frets: [-1, -1, 1, 3, 4, 4], fingers: [0, 0, 1, 2, 3, 4] },
  { name: 'E',  suffix: 'sus4', frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  { name: 'F',  suffix: 'sus4', frets: [1, 3, 3, 3, 1, 1], fingers: [1, 2, 3, 4, 1, 1], barres: [1] },
  { name: 'F#', suffix: 'sus4', frets: [2, 4, 4, 4, 2, 2], fingers: [1, 2, 3, 4, 1, 1], barres: [2] },
  { name: 'G',  suffix: 'sus4', frets: [3, 5, 5, 5, 3, 3], fingers: [1, 2, 3, 4, 1, 1], barres: [3] },
  { name: 'G#', suffix: 'sus4', frets: [4, 6, 6, 6, 4, 4], fingers: [1, 2, 3, 4, 1, 1], barres: [4] },
  { name: 'A',  suffix: 'sus4', frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  { name: 'A#', suffix: 'sus4', frets: [-1, 1, 3, 3, 4, 1], fingers: [0, 1, 2, 3, 4, 1], barres: [1] },
  { name: 'B',  suffix: 'sus4', frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], barres: [2] },

  // Dominant 9th chords
  { name: 'C',  suffix: '9',    frets: [-1, 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 3], barres: [3] },
  { name: 'C#', suffix: '9',    frets: [-1, 4, 3, 4, 4, 4], fingers: [0, 2, 1, 3, 3, 3], barres: [4] },
  { name: 'D',  suffix: '9',    frets: [-1, 5, 4, 5, 5, 5], fingers: [0, 2, 1, 3, 3, 3], barres: [5] },
  { name: 'D#', suffix: '9',    frets: [-1, 6, 5, 6, 6, 6], fingers: [0, 2, 1, 3, 3, 3], barres: [6] },
  { name: 'E',  suffix: '9',    frets: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },
  { name: 'F',  suffix: '9',    frets: [1, 3, 1, 2, 1, 3], fingers: [1, 3, 1, 2, 1, 4], barres: [1] },
  { name: 'F#', suffix: '9',    frets: [2, 4, 2, 3, 2, 4], fingers: [1, 3, 1, 2, 1, 4], barres: [2] },
  { name: 'G',  suffix: '9',    frets: [3, 0, 0, 2, 0, 1], fingers: [2, 0, 0, 3, 0, 1] },
  { name: 'G#', suffix: '9',    frets: [4, 6, 4, 5, 4, 6], fingers: [1, 3, 1, 2, 1, 4], barres: [4] },
  { name: 'A',  suffix: '9',    frets: [-1, 0, 2, 4, 2, 3], fingers: [0, 0, 1, 4, 2, 3] },
  { name: 'A#', suffix: '9',    frets: [-1, 1, 0, 1, 1, 1], fingers: [0, 2, 0, 1, 1, 1], barres: [1] },
  { name: 'B',  suffix: '9',    frets: [-1, 2, 1, 2, 2, 2], fingers: [0, 2, 1, 3, 3, 3], barres: [2] },

  // Add9 chords
  { name: 'C',  suffix: 'add9', frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  { name: 'C#', suffix: 'add9', frets: [-1, 4, 1, 1, 2, 1], fingers: [0, 3, 1, 1, 2, 1], barres: [1] },
  { name: 'D',  suffix: 'add9', frets: [-1, -1, 0, 7, 7, 0], fingers: [0, 0, 0, 1, 2, 0] },
  { name: 'D#', suffix: 'add9', frets: [-1, -1, 1, 0, 4, 1], fingers: [0, 0, 1, 0, 3, 2] },
  { name: 'E',  suffix: 'add9', frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
  { name: 'F',  suffix: 'add9', frets: [1, 0, 3, 0, 1, 1], fingers: [1, 0, 4, 0, 2, 3] },
  { name: 'F#', suffix: 'add9', frets: [2, 1, 4, 1, 2, -1], fingers: [2, 1, 4, 1, 3, 0], barres: [1] },
  { name: 'G',  suffix: 'add9', frets: [3, 2, 0, 2, 0, 3], fingers: [2, 1, 0, 3, 0, 4] },
  { name: 'G#', suffix: 'add9', frets: [4, 1, 1, 1, 1, 4], fingers: [2, 1, 1, 1, 1, 3], barres: [1] },
  { name: 'A',  suffix: 'add9', frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0] },
  { name: 'A#', suffix: 'add9', frets: [-1, 1, 0, 3, 1, 1], fingers: [0, 1, 0, 4, 2, 3] },
  { name: 'B',  suffix: 'add9', frets: [-1, 2, 1, 4, 2, -1], fingers: [0, 2, 1, 4, 3, 0] },

  // Minor 6th chords
  { name: 'C',  suffix: 'm6',   frets: [-1, 3, 1, 2, 1, 3], fingers: [0, 3, 1, 2, 1, 4], barres: [1] },
  { name: 'C#', suffix: 'm6',   frets: [-1, 4, 2, 3, 2, 0], fingers: [0, 4, 1, 3, 2, 0] },
  { name: 'D',  suffix: 'm6',   frets: [-1, -1, 0, 2, 0, 1], fingers: [0, 0, 0, 2, 0, 1] },
  { name: 'D#', suffix: 'm6',   frets: [-1, -1, 1, 3, 1, 2], fingers: [0, 0, 1, 3, 1, 2], barres: [1] },
  { name: 'E',  suffix: 'm6',   frets: [0, 2, 2, 0, 2, 0], fingers: [0, 1, 2, 0, 3, 0] },
  { name: 'F',  suffix: 'm6',   frets: [1, 3, 0, 1, 1, -1], fingers: [1, 4, 0, 2, 3, 0] },
  { name: 'F#', suffix: 'm6',   frets: [2, 0, 1, 2, 2, -1], fingers: [2, 0, 1, 3, 4, 0] },
  { name: 'G',  suffix: 'm6',   frets: [3, 1, 0, 0, 3, 0], fingers: [2, 1, 0, 0, 3, 0] },
  { name: 'G#', suffix: 'm6',   frets: [4, 2, 1, 1, 4, 1], fingers: [3, 2, 1, 1, 4, 1], barres: [1] },
  { name: 'A',  suffix: 'm6',   frets: [-1, 0, 2, 2, 1, 2], fingers: [0, 0, 2, 3, 1, 4] },
  { name: 'A#', suffix: 'm6',   frets: [-1, 1, 3, 0, 2, 1], fingers: [0, 1, 4, 0, 3, 2] },
  { name: 'B',  suffix: 'm6',   frets: [-1, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3] },

  // Major 6th chords
  { name: 'C',  suffix: '6',    frets: [-1, 3, 2, 2, 1, 0], fingers: [0, 4, 2, 3, 1, 0] },
  { name: 'C#', suffix: '6',    frets: [-1, 4, 3, 3, 2, -1], fingers: [0, 4, 2, 3, 1, 0] },
  { name: 'D',  suffix: '6',    frets: [-1, -1, 0, 2, 0, 2], fingers: [0, 0, 0, 1, 0, 2] },
  { name: 'D#', suffix: '6',    frets: [-1, -1, 1, 0, 1, 3], fingers: [0, 0, 1, 0, 2, 3] },
  { name: 'E',  suffix: '6',    frets: [0, 2, 2, 1, 2, 0], fingers: [0, 2, 3, 1, 4, 0] },
  { name: 'F',  suffix: '6',    frets: [-1, -1, 3, 2, 3, 1], fingers: [0, 0, 3, 2, 4, 1] },
  { name: 'F#', suffix: '6',    frets: [2, 1, 1, 3, 2, -1], fingers: [2, 1, 1, 4, 3, 0], barres: [1] },
  { name: 'G',  suffix: '6',    frets: [3, 2, 0, 0, 0, 0], fingers: [2, 1, 0, 0, 0, 0] },
  { name: 'G#', suffix: '6',    frets: [4, 3, 1, 1, 1, 1], fingers: [3, 2, 1, 1, 1, 1], barres: [1] },
  { name: 'A',  suffix: '6',    frets: [-1, 0, 2, 2, 2, 2], fingers: [0, 0, 1, 1, 1, 1], barres: [2] },
  { name: 'A#', suffix: '6',    frets: [-1, 1, 0, 0, 3, 1], fingers: [0, 1, 0, 0, 3, 2] },
  { name: 'B',  suffix: '6',    frets: [-1, 2, 1, 1, 0, 2], fingers: [0, 3, 1, 2, 0, 4] },
];

export const VOICINGS_BY_INSTRUMENT: Record<ChordInstrument, ChordVoicing[]> = {
  ukulele: UKULELE_VOICINGS,
  guitar: GUITAR_VOICINGS,
};

function getVoicingNotes(voicing: ChordVoicing, instrument: ChordInstrument): NoteName[] {
  const openNotes = CHORD_CHART_STRINGS[instrument];
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const notes: NoteName[] = [];
  for (let s = 0; s < openNotes.length; s++) {
    const fret = voicing.frets[s];
    if (fret < 0) continue;
    const openIdx = chromatic.indexOf(openNotes[s] as any);
    const noteIdx = (openIdx + fret) % 12;
    notes.push(chromatic[noteIdx]);
  }
  return notes;
}

interface VoicingMatch {
  voicing: ChordVoicing;
  notes: NoteName[];
  root: NoteName;
  suffix: string;
}

const _voicingCache: Partial<Record<ChordInstrument, VoicingMatch[]>> = {};

function getVoicingMatches(instrument: ChordInstrument): VoicingMatch[] {
  const cached = _voicingCache[instrument];
  if (cached) return cached;
  const matches = VOICINGS_BY_INSTRUMENT[instrument].map((v) => ({
    voicing: v,
    notes: getVoicingNotes(v, instrument),
    root: v.name as NoteName,
    suffix: v.suffix,
  }));
  _voicingCache[instrument] = matches;
  return matches;
}

/**
 * Match detected pitch classes against the known ukulele voicing database.
 * Returns the best-matching chord or null if nothing fits.
 */
export function detectChord(
  notes: NoteName[],
  noteCounts?: Map<NoteName, number>,
  instrument: ChordInstrument = 'ukulele',
): { root: NoteName; quality: string; display: string } | null {
  if (notes.length < 2) return null;

  const uniqueNotes = [...new Set(notes)];
  const detectedSet = new Set(uniqueNotes);

  const voicings = getVoicingMatches(instrument);
  let best: { root: string; suffix: string; score: number } | null = null;

  for (const vm of voicings) {
    const voicingUniqueNotes = new Set(vm.notes);

    let detectedInVoicing = 0;
    for (const n of uniqueNotes) {
      if (voicingUniqueNotes.has(n)) detectedInVoicing++;
    }
    let voicingCovered = 0;
    for (const n of voicingUniqueNotes) {
      if (detectedSet.has(n)) voicingCovered++;
    }

    if (detectedInVoicing < 2) continue;

    const fitScore = detectedInVoicing / uniqueNotes.length;
    const coverScore = voicingCovered / voicingUniqueNotes.size;

    const exactBonus = (fitScore === 1.0 && coverScore === 1.0) ? 0.25 : 0;

    // Normalize flat root names (Bb→A#, …) so lookup works against
    // detected notes which always use sharps
    let rootBoost = 0;
    if (noteCounts) {
      const canonicalRoot = (ENHARMONIC_MAP[vm.root] ?? vm.root) as NoteName;
      const rootCount = noteCounts.get(canonicalRoot) ?? 0;
      const totalCount = Array.from(noteCounts.values()).reduce((a, b) => a + b, 0);
      if (totalCount > 0) rootBoost = (rootCount / totalCount) * 0.2;
    }

    const qualityKey = suffixToQuality(vm.suffix);
    const qualityDef = CHORD_QUALITIES[qualityKey];
    const priorityBonus = qualityDef ? (qualityDef.priority / 10) * 0.08 : 0;

    const score = fitScore * 0.5 + coverScore * 0.35 + exactBonus + rootBoost + priorityBonus;

    if (!best || score > best.score) {
      best = { root: vm.root, suffix: vm.suffix, score };
    }
  }

  if (!best) return null;

  const quality = suffixToQuality(best.suffix);
  return {
    root: best.root as NoteName,
    quality,
    display: `${best.root}${best.suffix}`,
  };
}

function suffixToQuality(suffix: string): string {
  for (const [quality, def] of Object.entries(CHORD_QUALITIES)) {
    if (def.suffix === suffix) return quality;
  }
  return 'major';
}

export function findVoicing(
  root: string,
  suffix: string,
  instrument: ChordInstrument = 'ukulele',
): ChordVoicing | null {
  return VOICINGS_BY_INSTRUMENT[instrument].find(
    (v) => v.name === root && v.suffix === suffix,
  ) ?? null;
}

/**
 * Get the fret positions for a chord voicing, with string indices in the
 * fretboard component's top-to-bottom drawing order (thinnest string first).
 * Chord charts store guitar strings low-to-high, so those are reversed here;
 * ukulele chart order (G-C-E-A) already matches its drawing order.
 */
export function getVoicingFretPositions(
  voicing: ChordVoicing,
  instrument: ChordInstrument = 'ukulele',
): { string: number; fret: number }[] {
  const numStrings = voicing.frets.length;
  const positions: { string: number; fret: number }[] = [];
  for (let s = 0; s < numStrings; s++) {
    if (voicing.frets[s] >= 0) {
      positions.push({
        string: instrument === 'guitar' ? numStrings - 1 - s : s,
        fret: voicing.frets[s],
      });
    }
  }
  return positions;
}
