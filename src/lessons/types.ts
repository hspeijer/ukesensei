import type { NoteName } from '../theory/notes';

export type LessonCategory = 'theory' | 'technique' | 'practice';

export type LessonContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'list'; items: string[] };

/**
 * A checkpoint is the gating exercise for a lesson. Positions are expressed as
 * [string, fret] tuples (string 0 = G, 1 = C, 2 = E, 3 = A) and resolved to
 * full FretPositions at runtime. The player must play them in order, plucking
 * one string at a time (monophonic), which is exactly how fingerpicking works.
 */
export interface CheckpointDef {
  title: string;
  instructions: string;
  /** Root + scaleKey drive the fretboard scale overlay shown during the checkpoint. */
  root: NoteName;
  scaleKey: string;
  positions: [number, number][];
  /** Fraction of notes (0-1) that must be correct to pass and unlock the next lesson. */
  requiredAccuracy: number;
  /** Optional tempo. null = no metronome (free, untimed). */
  bpm: number | null;
}

/**
 * A practice drill: a freely-playable exercise that is NOT gated. Lets the
 * player warm up and build toward the lesson's checkpoint.
 */
export interface PracticeExercise {
  id: string;
  title: string;
  instructions: string;
  root: NoteName;
  scaleKey: string;
  positions: [number, number][];
  bpm: number | null;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  category: LessonCategory;
  summary: string;
  content: LessonContentBlock[];
  /** Freely-playable warm-up drills for this lesson. */
  practice: PracticeExercise[];
  /** The gating exercise that must be passed to unlock the next lesson. */
  checkpoint: CheckpointDef;
}

export interface LessonModule {
  id: string;
  title: string;
  description: string;
}
