import type { NoteName } from '../theory/notes';
import type { FretPosition } from '../theory/fretboard';

export type ExerciseDirection = 'ascending' | 'descending' | 'both';

export interface ScaleExerciseConfig {
  root: NoteName;
  scaleKey: string;
  direction: ExerciseDirection;
  positions: FretPosition[];
}

export interface ExerciseResult {
  config: ScaleExerciseConfig;
  notesPlayed: { correct: boolean; cents: number; timestamp: number; beatOffset: number | null }[];
  accuracy: number;
  averageCents: number;
  totalTime: number;
  completedAt: number;
}
