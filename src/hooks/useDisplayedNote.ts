import { useEffect, useRef, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';

export interface DisplayedNote {
  note: DetectedNote;
  opacity: number;
}

const GAP_GRACE_MS = 120;
const HOLD_AFTER_MS = 1400;
const FADE_MS = 900;

function pitchKey(note: DetectedNote): string {
  return `${note.note}:${note.octave}`;
}

/** Keep the latest detected pitch visible, then fade out slowly after it stops. */
export function useDisplayedNote(live: DetectedNote | null): DisplayedNote | null {
  const [displayed, setDisplayed] = useState<DisplayedNote | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeStartRef = useRef<number | null>(null);
  const fadeRafRef = useRef<number | null>(null);
  const activePitchRef = useRef<string | null>(null);
  const liveRef = useRef<DetectedNote | null>(null);

  const clearFade = () => {
    if (fadeRafRef.current) {
      cancelAnimationFrame(fadeRafRef.current);
      fadeRafRef.current = null;
    }
    fadeStartRef.current = null;
  };

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const clearGap = () => {
    if (gapTimerRef.current) {
      clearTimeout(gapTimerRef.current);
      gapTimerRef.current = null;
    }
  };

  const clearAllTimers = () => {
    clearGap();
    clearHold();
    clearFade();
  };

  const startFade = () => {
    fadeStartRef.current = performance.now();

    const tick = (now: number) => {
      const start = fadeStartRef.current;
      if (start == null) return;

      const t = (now - start) / FADE_MS;
      if (t >= 1) {
        setDisplayed(null);
        fadeStartRef.current = null;
        fadeRafRef.current = null;
        return;
      }

      setDisplayed((prev) => (prev ? { ...prev, opacity: 1 - t } : null));
      fadeRafRef.current = requestAnimationFrame(tick);
    };

    fadeRafRef.current = requestAnimationFrame(tick);
  };

  const scheduleHoldAndFade = () => {
    clearHold();
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      startFade();
    }, HOLD_AFTER_MS);
  };

  const liveKey = live ? pitchKey(live) : null;
  liveRef.current = live;

  useEffect(() => {
    if (live && liveKey) {
      clearAllTimers();
      activePitchRef.current = liveKey;
      setDisplayed({ note: live, opacity: 1 });
      return;
    }

    if (!activePitchRef.current) return;

    clearGap();
    gapTimerRef.current = setTimeout(() => {
      gapTimerRef.current = null;
      if (liveRef.current) return;

      activePitchRef.current = null;
      clearHold();
      scheduleHoldAndFade();
    }, GAP_GRACE_MS);
  }, [liveKey]);

  useEffect(() => () => clearAllTimers(), []);

  return displayed;
}
