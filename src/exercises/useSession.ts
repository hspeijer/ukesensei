import { useRef, useCallback, useEffect, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';

export interface SessionNote {
  note: NoteName;
  octave: number;
  cents: number;
  frequency: number;
  timestamp: number;
  beatOffset: number;
  expectedNote: NoteName | null;
  wasCorrect: boolean;
}

export interface SessionResult {
  notes: SessionNote[];
  bpm: number;
  startedAt: number;
  endedAt: number;
  scaleKey: string;
  root: NoteName;
  audioBlob?: Blob | null;
}

interface UseSessionOptions {
  bpm: number;
  root: NoteName;
  scaleKey: string;
  getNearestBeatOffset: (timestamp: number) => number;
  isActive: boolean;
}

export function useSession({
  bpm,
  root,
  scaleKey,
  getNearestBeatOffset,
  isActive,
}: UseSessionOptions) {
  const notesRef = useRef<SessionNote[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const [result, setResult] = useState<SessionResult | null>(null);

  useEffect(() => {
    if (isActive && !startedAtRef.current) {
      notesRef.current = [];
      startedAtRef.current = Date.now();
      setResult(null);
    }
  }, [isActive]);

  const recordNote = useCallback(
    (
      detectedNote: DetectedNote,
      expectedNote: NoteName | null,
      wasCorrect: boolean,
    ) => {
      if (!isActive) return;

      const beatOffset = getNearestBeatOffset(detectedNote.timestamp);

      notesRef.current.push({
        note: detectedNote.note,
        octave: detectedNote.octave,
        cents: detectedNote.cents,
        frequency: detectedNote.frequency,
        timestamp: detectedNote.timestamp,
        beatOffset,
        expectedNote,
        wasCorrect,
      });
    },
    [isActive, getNearestBeatOffset],
  );

  const endSession = useCallback((): SessionResult | null => {
    if (!startedAtRef.current) return null;

    const sessionResult: SessionResult = {
      notes: [...notesRef.current],
      bpm,
      startedAt: startedAtRef.current,
      endedAt: Date.now(),
      scaleKey,
      root,
    };

    setResult(sessionResult);
    startedAtRef.current = null;
    notesRef.current = [];

    return sessionResult;
  }, [bpm, scaleKey, root]);

  const clearSession = useCallback(() => {
    notesRef.current = [];
    startedAtRef.current = null;
    setResult(null);
  }, []);

  return {
    recordNote,
    endSession,
    clearSession,
    result,
    noteCount: notesRef.current.length,
  };
}
