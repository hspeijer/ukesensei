import { useCallback, useEffect, useRef, useState } from 'react';

interface TimedEvent {
  startMs: number;
  durationMs: number;
}

/**
 * Drives a virtual playback clock (independent of any `<audio>` element) that
 * fires `onNote` for each event at its scheduled time. This lets sheet music
 * be played back audibly through an instrument synth, which is the only way
 * to hear a melody when there's no recorded audio, and an alternative to it
 * when there is.
 *
 * Generic over any timed event (e.g. `MelodyNote` or `TimedMelodyEvent`) so
 * callers can drive playback either from raw captured timing or from the
 * quantized rhythm actually notated on the sheet music.
 *
 * Uses `requestAnimationFrame` against a `performance.now()` reference point
 * (rather than accumulating per-tick deltas) so drift can't build up, mirroring
 * `useAudioClock`'s approach for the real `<audio>` element.
 */
export function useMelodyPlayback<T extends TimedEvent>(events: T[], onNote: (event: T) => void) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const animFrameRef = useRef<number>(0);
  const startPerfRef = useRef(0);
  const nextIndexRef = useRef(0);
  const eventsRef = useRef(events);
  const onNoteRef = useRef(onNote);
  eventsRef.current = events;
  onNoteRef.current = onNote;

  const duration = events.length > 0
    ? Math.max(...events.map((e) => e.startMs + e.durationMs)) / 1000
    : 0;

  const findNextIndex = useCallback((timeMs: number) => {
    const list = eventsRef.current;
    const idx = list.findIndex((e) => e.startMs >= timeMs);
    return idx === -1 ? list.length : idx;
  }, []);

  const stopTick = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const tick = useCallback(() => {
    const elapsedMs = performance.now() - startPerfRef.current;
    const list = eventsRef.current;

    while (nextIndexRef.current < list.length && list[nextIndexRef.current].startMs <= elapsedMs) {
      onNoteRef.current(list[nextIndexRef.current]);
      nextIndexRef.current++;
    }

    if (elapsedMs >= duration * 1000) {
      setCurrentTime(duration);
      setIsPlaying(false);
      return;
    }

    setCurrentTime(elapsedMs / 1000);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [duration]);

  const play = useCallback(() => {
    if (eventsRef.current.length === 0) return;
    setCurrentTime((time) => {
      const startMs = time >= duration ? 0 : time * 1000;
      startPerfRef.current = performance.now() - startMs;
      nextIndexRef.current = findNextIndex(startMs);
      return startMs / 1000;
    });
    setIsPlaying(true);
    animFrameRef.current = requestAnimationFrame(tick);
  }, [duration, findNextIndex, tick]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopTick();
  }, [stopTick]);

  const toggle = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const clamped = Math.max(0, Math.min(duration, time));
    setCurrentTime(clamped);
    nextIndexRef.current = findNextIndex(clamped * 1000);
    if (isPlaying) startPerfRef.current = performance.now() - clamped * 1000;
  }, [duration, isPlaying, findNextIndex]);

  const reset = useCallback(() => {
    stopTick();
    setCurrentTime(0);
    setIsPlaying(false);
    nextIndexRef.current = 0;
  }, [stopTick]);

  // Stop cleanly (rather than firing stray notes) if the melody itself
  // changes out from under an in-progress playback, e.g. a new recording.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  useEffect(() => stopTick, [stopTick]);

  return { currentTime, duration, isPlaying, play, pause, toggle, seek, reset };
}
