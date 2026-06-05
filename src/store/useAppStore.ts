import { create } from 'zustand';
import type { NoteName } from '../theory/notes';
import type { FretPosition, UkuleleTuning } from '../theory/fretboard';
import { TUNINGS } from '../theory/fretboard';

export type AppView = 'freeplay' | 'exercises' | 'library' | 'playback';
export type TuningKey = 'standard' | 'low_g';
export type Theme = 'dark' | 'light';

export interface DetectedNote {
  note: NoteName;
  octave: number;
  frequency: number;
  clarity: number;
  cents: number;
  timestamp: number;
}

export interface ExerciseNotePlayed {
  correct: boolean;
  cents: number;
  timestamp: number;
  beatOffset: number | null;
}

export interface ExerciseState {
  scaleKey: string;
  root: NoteName;
  currentNoteIndex: number;
  targetPositions: FretPosition[];
  notesPlayed: ExerciseNotePlayed[];
  isComplete: boolean;
  startedAt: number | null;
  bpm: number | null;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('uke-sensei-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const el = document.documentElement;
  if (theme === 'dark') {
    el.classList.add('dark');
  } else {
    el.classList.remove('dark');
  }
}

interface AppState {
  view: AppView;
  setView: (view: AppView) => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Tuning
  tuningKey: TuningKey;
  tuning: UkuleleTuning;
  setTuning: (key: TuningKey) => void;
  tuningAutoDetected: boolean;
  setTuningAutoDetected: (v: boolean) => void;

  // Audio
  isListening: boolean;
  setListening: (listening: boolean) => void;
  detectedNote: DetectedNote | null;
  setDetectedNote: (note: DetectedNote | null) => void;
  audioLevel: number;
  setAudioLevel: (level: number) => void;

  // Fretboard
  fretboardInverted: boolean;
  setFretboardInverted: (v: boolean) => void;

  // Scale selection
  selectedRoot: NoteName;
  setSelectedRoot: (root: NoteName) => void;
  selectedScale: string;
  setSelectedScale: (scale: string) => void;
  showScale: boolean;
  setShowScale: (show: boolean) => void;

  // Exercise
  exercise: ExerciseState | null;
  startExercise: (exercise: ExerciseState) => void;
  advanceExercise: (correct: boolean, cents: number, beatOffset?: number | null) => void;
  skipToIndex: (index: number, skippedCount: number) => void;
  completeExercise: () => void;
  clearExercise: () => void;

  // Session playback
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
}

const initialTheme = getInitialTheme();
applyThemeClass(initialTheme);

export const useAppStore = create<AppState>((set) => ({
  view: 'freeplay',
  setView: (view) => set({ view }),

  theme: initialTheme,
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('uke-sensei-theme', next);
      applyThemeClass(next);
      return { theme: next };
    }),

  tuningKey: 'low_g',
  tuning: TUNINGS.low_g,
  setTuning: (key) => set({ tuningKey: key, tuning: TUNINGS[key] }),
  tuningAutoDetected: false,
  setTuningAutoDetected: (tuningAutoDetected) => set({ tuningAutoDetected }),

  isListening: false,
  setListening: (isListening) => set({ isListening }),
  detectedNote: null,
  setDetectedNote: (detectedNote) => set({ detectedNote }),
  audioLevel: 0,
  setAudioLevel: (audioLevel) => set({ audioLevel }),

  fretboardInverted: false,
  setFretboardInverted: (fretboardInverted) => set({ fretboardInverted }),

  selectedRoot: 'C',
  setSelectedRoot: (selectedRoot) => set({ selectedRoot }),
  selectedScale: 'ionian',
  setSelectedScale: (selectedScale) => set({ selectedScale }),
  showScale: true,
  setShowScale: (showScale) => set({ showScale }),

  exercise: null,
  startExercise: (exercise) => set({ exercise }),
  advanceExercise: (correct, cents, beatOffset = null) =>
    set((state) => {
      if (!state.exercise || state.exercise.isComplete) return state;
      const notesPlayed: ExerciseNotePlayed[] = [
        ...state.exercise.notesPlayed,
        { correct, cents, timestamp: Date.now(), beatOffset },
      ];
      const nextIndex = state.exercise.currentNoteIndex + (correct ? 1 : 0);
      const isComplete = nextIndex >= state.exercise.targetPositions.length;
      return {
        exercise: {
          ...state.exercise,
          notesPlayed,
          currentNoteIndex: nextIndex,
          isComplete,
        },
      };
    }),
  skipToIndex: (index, skippedCount) =>
    set((state) => {
      if (!state.exercise || state.exercise.isComplete) return state;
      const skippedNotes: ExerciseNotePlayed[] = [];
      for (let i = 0; i < skippedCount; i++) {
        skippedNotes.push({ correct: false, cents: 0, timestamp: Date.now(), beatOffset: null });
      }
      return {
        exercise: {
          ...state.exercise,
          notesPlayed: [...state.exercise.notesPlayed, ...skippedNotes],
          currentNoteIndex: index,
        },
      };
    }),
  completeExercise: () =>
    set((state) => {
      if (!state.exercise) return state;
      return { exercise: { ...state.exercise, isComplete: true } };
    }),
  clearExercise: () => set({ exercise: null, view: 'exercises' }),

  selectedSessionId: null,
  setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),
}));
