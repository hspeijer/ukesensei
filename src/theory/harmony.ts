import { CHROMATIC_NOTES, type NoteName, noteToSemitone, semitoneToNote } from './notes';
import { getScaleNotes } from './scales';
import { CHORD_QUALITIES } from './chords';
import type { MelodyNote, MeasureToken } from './staff';

/** The three diatonic triad qualities that occur in a major/minor key, keyed into CHORD_QUALITIES. */
type DiatonicQuality = 'major' | 'minor' | 'dim';

export interface ChordLabel {
  root: NoteName;
  quality: DiatonicQuality;
  /** Display text for the chord symbol, e.g. "C", "Dm", "Bdim". */
  display: string;
}

// Fixed triad-quality pattern for each scale degree (I..VII) of the two key
// types a recorded melody is harmonized against. These are music-theory
// constants (the diatonic triads of major/natural-minor), not derived data.
const DIATONIC_QUALITIES: Record<'ionian' | 'aeolian', DiatonicQuality[]> = {
  ionian: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'],
  aeolian: ['minor', 'dim', 'major', 'minor', 'minor', 'major', 'major'],
};

function makeChordLabel(root: NoteName, quality: DiatonicQuality): ChordLabel {
  return { root, quality, display: `${root}${CHORD_QUALITIES[quality].suffix}` };
}

function chordTones(chord: ChordLabel): Set<NoteName> {
  const rootSemitone = noteToSemitone(chord.root);
  return new Set(CHORD_QUALITIES[chord.quality].intervals.map((iv) => semitoneToNote(rootSemitone + iv)));
}

/**
 * The 7 diatonic triads (I..VII) for a major (ionian) or natural-minor
 * (aeolian) key, e.g. C major -> [C, Dm, Em, F, G, Am, Bdim].
 */
export function getDiatonicChords(root: NoteName, scaleKey: 'ionian' | 'aeolian'): ChordLabel[] {
  const scaleNotes = getScaleNotes(root, scaleKey);
  const qualities = DIATONIC_QUALITIES[scaleKey];
  return scaleNotes.map((degreeRoot, i) => makeChordLabel(degreeRoot, qualities[i]));
}

/**
 * Estimate the key a captured melody is in by scoring every major/natural-minor
 * key on how much of the melody's (duration-weighted) pitch content fits its
 * scale, with a small bonus for keys whose tonic matches the melody's first
 * or last note (a common cadential cue for monophonic recordings).
 */
export function detectSongKey(notes: MelodyNote[]): { root: NoteName; scaleKey: 'ionian' | 'aeolian' } {
  if (notes.length === 0) return { root: 'C', scaleKey: 'ionian' };

  let totalWeight = 0;
  const weightByNote = new Map<NoteName, number>();
  for (const n of notes) {
    totalWeight += n.durationMs;
    weightByNote.set(n.note, (weightByNote.get(n.note) ?? 0) + n.durationMs);
  }

  let best: { root: NoteName; scaleKey: 'ionian' | 'aeolian'; score: number } | null = null;
  for (const root of CHROMATIC_NOTES) {
    for (const scaleKey of ['ionian', 'aeolian'] as const) {
      const scaleNotes = new Set(getScaleNotes(root, scaleKey));
      let fitWeight = 0;
      for (const [note, weight] of weightByNote) {
        if (scaleNotes.has(note)) fitWeight += weight;
      }

      let score = totalWeight > 0 ? fitWeight / totalWeight : 0;
      if (notes[notes.length - 1].note === root) score += 0.05;
      if (notes[0].note === root) score += 0.02;

      if (!best || score > best.score) best = { root, scaleKey, score };
    }
  }

  return { root: best!.root, scaleKey: best!.scaleKey };
}

/**
 * Assigns one diatonic chord to each measure by scoring how well the notes
 * actually played in that measure (weighted by duration) fit each of the
 * key's 7 diatonic triads, with a small bonus for matching the chord's own
 * root (the strongest harmonic cue). Rest-only measures hold the previous
 * measure's chord instead of leaving a gap.
 */
export function inferChordsForMeasures(
  measures: MeasureToken[][],
  notes: MelodyNote[],
  key: { root: NoteName; scaleKey: 'ionian' | 'aeolian' },
): (ChordLabel | null)[] {
  const diatonicChords = getDiatonicChords(key.root, key.scaleKey);
  let lastChord: ChordLabel | null = null;

  return measures.map((measure) => {
    const weightByNote = new Map<NoteName, number>();
    let totalWeight = 0;
    for (const token of measure) {
      if (token.noteIndex === null) continue;
      const note = notes[token.noteIndex];
      if (!note) continue;
      weightByNote.set(note.note, (weightByNote.get(note.note) ?? 0) + note.durationMs);
      totalWeight += note.durationMs;
    }

    if (totalWeight === 0) return lastChord;

    let best: { chord: ChordLabel; score: number } | null = null;
    for (const chord of diatonicChords) {
      const tones = chordTones(chord);
      let score = 0;
      for (const [note, weight] of weightByNote) {
        if (tones.has(note)) score += weight;
      }
      score += (weightByNote.get(chord.root) ?? 0) * 0.25;

      if (!best || score > best.score) best = { chord, score };
    }

    lastChord = best!.chord;
    return best!.chord;
  });
}

/**
 * Top-level entry point: detects the melody's key, then assigns one
 * diatonic chord per measure. `measures` should come from
 * `quantizeMelody(notes).measures` so chord indices line up with the
 * rendered staves.
 */
export function inferSongChords(notes: MelodyNote[], measures: MeasureToken[][]): (ChordLabel | null)[] {
  return inferChordsForMeasures(measures, notes, detectSongKey(notes));
}
