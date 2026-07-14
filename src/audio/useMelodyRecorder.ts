import { useCallback, useEffect, useRef, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import type { MelodyNote } from '../theory/staff';
import { notesEqual } from '../theory/staff';

const MIN_SEGMENT_MS = 100;
const GAP_CLOSE_MS = 250;

interface OpenSegment {
  note: DetectedNote;
  startMs: number;
  lastSeenMs: number;
}

export function useMelodyRecorder(
  detectedNote: DetectedNote | null,
  isRecording: boolean,
) {
  const [notes, setNotes] = useState<MelodyNote[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const openRef = useRef<OpenSegment | null>(null);
  const notesRef = useRef<MelodyNote[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const closeSegment = useCallback((endMs: number) => {
    const open = openRef.current;
    if (!open) return;

    const durationMs = endMs - open.startMs;
    if (durationMs >= MIN_SEGMENT_MS) {
      const segment: MelodyNote = {
        note: open.note.note,
        octave: open.note.octave,
        cents: open.note.cents,
        startMs: open.startMs,
        durationMs,
      };
      notesRef.current = [...notesRef.current, segment];
      setNotes(notesRef.current);
    }
    openRef.current = null;
  }, []);

  const reset = useCallback(() => {
    notesRef.current = [];
    openRef.current = null;
    startedAtRef.current = null;
    setNotes([]);
    setElapsedMs(0);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    reset();
    startedAtRef.current = Date.now();
    tickRef.current = setInterval(() => {
      if (startedAtRef.current) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 200);
  }, [reset]);

  const stop = useCallback((): MelodyNote[] => {
    const now = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
    closeSegment(now);
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    startedAtRef.current = null;
    return [...notesRef.current];
  }, [closeSegment]);

  useEffect(() => {
    if (!isRecording || !startedAtRef.current) return;

    const now = Date.now() - startedAtRef.current;

    if (!detectedNote) {
      if (openRef.current && now - openRef.current.lastSeenMs > GAP_CLOSE_MS) {
        closeSegment(openRef.current.lastSeenMs);
      }
      return;
    }

    const open = openRef.current;
    if (!open) {
      openRef.current = { note: detectedNote, startMs: now, lastSeenMs: now };
      return;
    }

    if (notesEqual(open.note, detectedNote)) {
      openRef.current = { ...open, lastSeenMs: now };
      return;
    }

    closeSegment(now);
    openRef.current = { note: detectedNote, startMs: now, lastSeenMs: now };
  }, [detectedNote, isRecording, closeSegment]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  return {
    notes,
    elapsedMs,
    start,
    stop,
    reset,
    noteCount: notes.length,
  };
}
