import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wraps an `<audio>` element with play/pause/seek controls and a
 * `requestAnimationFrame`-driven `currentTime`, so playback UIs (transport
 * bars, waveforms, sheet-music cursors, fretboard highlights) can all read
 * the same clock without each re-implementing the rAF loop.
 */
export function useAudioClock() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play();
    setIsPlaying(true);

    const tick = () => {
      const a = audioRef.current;
      if (a && !a.paused) {
        setCurrentTime(a.currentTime);
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) play(); else pause();
  }, [play, pause]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const d = audio.duration;
    setDuration(isFinite(d) ? d : 0);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // For callers that reuse the same hook instance across multiple audio
  // sources (e.g. re-recording), so stale time/duration don't linger once
  // the underlying <audio> element's src changes.
  const reset = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, []);

  return {
    audioRef,
    currentTime,
    duration,
    isPlaying,
    play,
    pause,
    toggle,
    seek,
    reset,
    handleLoadedMetadata,
    handleEnded,
  };
}
