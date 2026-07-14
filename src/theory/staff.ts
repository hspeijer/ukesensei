import type { NoteName } from './notes';
import { noteToSemitone } from './notes';

const LETTER_DIATONIC: Record<string, number> = {
  C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6,
};

/** Diatonic step counting from C0. */
export function noteDiatonicStep(note: NoteName, octave: number): number {
  const letter = note.replace('#', '').replace('b', '');
  return octave * 7 + (LETTER_DIATONIC[letter] ?? 0);
}

/** B4 sits on the middle line of the treble staff. */
const TREBLE_REF_STEP = noteDiatonicStep('B', 4);

export function trebleStaffY(
  note: NoteName,
  octave: number,
  staffTop: number,
  lineSpacing: number,
): number {
  const step = noteDiatonicStep(note, octave);
  const middleLineY = staffTop + lineSpacing * 2;
  return middleLineY + (TREBLE_REF_STEP - step) * (lineSpacing / 2);
}

export function staffAccidental(note: NoteName): 'sharp' | 'flat' | null {
  if (note.includes('#')) return 'sharp';
  if (note.includes('b')) return 'flat';
  return null;
}

/** VexFlow key format, e.g. "c/4", "f#/5". */
export function noteToVexKey(note: NoteName, octave: number): string {
  const letter = note[0].toLowerCase();
  const acc = note.includes('#') ? '#' : note.includes('b') ? 'b' : '';
  return `${letter}${acc}/${octave}`;
}

export function midiFromNote(note: NoteName, octave: number): number {
  return (octave + 1) * 12 + noteToSemitone(note);
}

export function notesEqual(
  a: { note: NoteName; octave: number } | null,
  b: { note: NoteName; octave: number } | null,
): boolean {
  if (!a || !b) return false;
  return a.note === b.note && a.octave === b.octave;
}

/** Ledger line Y positions for notes that extend above or below the staff. */
export function ledgerLineYs(
  noteY: number,
  staffTop: number,
  staffBottom: number,
  lineSpacing: number,
): number[] {
  const half = lineSpacing / 2;
  const lines: number[] = [];

  let y = staffBottom + half;
  while (noteY >= y - 0.5) {
    lines.push(y);
    y += half;
  }

  y = staffTop - half;
  while (noteY <= y + 0.5) {
    lines.push(y);
    y -= half;
  }

  return lines;
}

export interface MelodyNote {
  note: NoteName;
  octave: number;
  cents: number;
  startMs: number;
  durationMs: number;
}

/** Infer note duration from inter-onset gaps. */
export function gapToDurationType(gapMs: number): string {
  if (gapMs < 180) return '16';
  if (gapMs < 360) return '8';
  if (gapMs < 720) return 'q';
  if (gapMs < 1400) return 'h';
  return 'w';
}

const DURATION_BEATS: Record<string, number> = {
  w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25,
};

function tokenBeats(token: string): number {
  const slash = token.lastIndexOf('/');
  if (slash === -1) return 1;
  const dur = token.slice(slash + 1).replace(/[.,]/g, '');
  return DURATION_BEATS[dur] ?? 1;
}

function restToken(beats: number): string {
  if (beats >= 4) return 'B4/w';
  if (beats >= 2) return 'B4/h';
  if (beats >= 1) return 'B4/q';
  if (beats >= 0.5) return 'B4/8';
  return 'B4/16';
}

/** Build EasyScore note tokens from captured melody segments. */
export function melodyToEasyScoreTokens(notes: MelodyNote[]): string[] {
  if (notes.length === 0) return [];

  return notes.map((n, i) => {
    const gap = i < notes.length - 1
      ? notes[i + 1].startMs - n.startMs
      : Math.max(n.durationMs, 500);
    const dur = gapToDurationType(gap);
    const key = noteToVexKey(n.note, n.octave);
    return `${key}/${dur}`;
  });
}

/** Pad tokens so each 4/4 measure is complete (avoids VexFlow IncompleteVoice). */
export function padMeasures(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;

  const padded: string[] = [];
  let measureBeats = 0;

  for (const token of tokens) {
    const beats = tokenBeats(token);
    if (measureBeats > 0 && measureBeats + beats > 4) {
      padded.push(restToken(4 - measureBeats));
      measureBeats = 0;
    }
    padded.push(token);
    measureBeats += beats;
    if (measureBeats >= 4) measureBeats = 0;
  }

  if (measureBeats > 0) {
    padded.push(restToken(4 - measureBeats));
  }

  return padded;
}

/** Split padded tokens into score lines. */
export function chunkScoreLines(tokens: string[], notesPerLine = 12): string[] {
  const padded = padMeasures(tokens);
  const lines: string[] = [];
  for (let i = 0; i < padded.length; i += notesPerLine) {
    lines.push(padded.slice(i, i + notesPerLine).join(', '));
  }
  return lines;
}

/** Convert session note timestamps into melody segments with durations. */
export function sessionNotesToMelody(
  notes: Array<{
    note: string;
    octave: number;
    cents: number;
    timestamp: number;
  }>,
  sessionStart: number,
): MelodyNote[] {
  if (notes.length === 0) return [];

  const sorted = [...notes].sort((a, b) => a.timestamp - b.timestamp);

  return sorted.map((n, i) => {
    const startMs = n.timestamp - sessionStart;
    const nextTs = i < sorted.length - 1 ? sorted[i + 1].timestamp : n.timestamp + 500;
    return {
      note: n.note as NoteName,
      octave: n.octave,
      cents: n.cents,
      startMs: Math.max(0, startMs),
      durationMs: Math.max(80, nextTs - n.timestamp),
    };
  });
}
