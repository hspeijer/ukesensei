import { useRef, useCallback, useState, useEffect } from 'react';

export interface MetronomeState {
  bpm: number;
  beatsPerMeasure: number;
  isPlaying: boolean;
  currentBeat: number;
  countingIn: boolean;
  countInBeat: number;
}

const SCHEDULE_AHEAD_S = 0.1;
const LOOK_AHEAD_MS = 25;

export function useMetronome() {
  const [bpm, setBpmState] = useState(80);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [countingIn, setCountingIn] = useState(false);
  const [countInBeat, setCountInBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextBeatTimeRef = useRef(0);
  const currentBeatRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsRef = useRef(beatsPerMeasure);
  const beatTimestampsRef = useRef<number[]>([]);

  const countInRemainingRef = useRef(0);
  const onCountInDoneRef = useRef<(() => void) | null>(null);

  bpmRef.current = bpm;
  beatsRef.current = beatsPerMeasure;

  const playClick = useCallback((time: number, isAccent: boolean, isCountIn = false) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Count-in clicks use a higher, more distinct tone
    if (isCountIn) {
      osc.frequency.value = isAccent ? 1200 : 900;
    } else {
      osc.frequency.value = isAccent ? 880 : 660;
    }
    osc.type = 'sine';

    gain.gain.setValueAtTime(isAccent ? 0.6 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.start(time);
    osc.stop(time + 0.06);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    while (nextBeatTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_S) {
      // Count-in phase
      if (countInRemainingRef.current > 0) {
        const countBeat = beatsRef.current - countInRemainingRef.current;
        const isAccent = countBeat === 0;
        playClick(nextBeatTimeRef.current, isAccent, true);
        setCountInBeat(countBeat);

        countInRemainingRef.current--;
        const secondsPerBeat = 60.0 / bpmRef.current;
        nextBeatTimeRef.current += secondsPerBeat;

        if (countInRemainingRef.current === 0) {
          setCountingIn(false);
          setCountInBeat(0);
          beatTimestampsRef.current = [];
          currentBeatRef.current = 0;
          onCountInDoneRef.current?.();
          onCountInDoneRef.current = null;
        }
        continue;
      }

      const beat = currentBeatRef.current;
      const isAccent = beat === 0;
      playClick(nextBeatTimeRef.current, isAccent);

      beatTimestampsRef.current.push(nextBeatTimeRef.current * 1000);
      if (beatTimestampsRef.current.length > 64) {
        beatTimestampsRef.current = beatTimestampsRef.current.slice(-64);
      }

      setCurrentBeat(beat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextBeatTimeRef.current += secondsPerBeat;
      currentBeatRef.current = (beat + 1) % beatsRef.current;
    }
  }, [playClick]);

  const start = useCallback((countIn = false, onReady?: () => void) => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }

    const ctx = audioCtxRef.current;
    currentBeatRef.current = 0;
    nextBeatTimeRef.current = ctx.currentTime + 0.05;
    beatTimestampsRef.current = [];
    setCurrentBeat(0);
    setIsPlaying(true);

    if (countIn) {
      countInRemainingRef.current = beatsRef.current;
      onCountInDoneRef.current = onReady ?? null;
      setCountingIn(true);
      setCountInBeat(0);
    } else {
      countInRemainingRef.current = 0;
      onCountInDoneRef.current = null;
      setCountingIn(false);
    }

    timerRef.current = window.setInterval(scheduler, LOOK_AHEAD_MS);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    currentBeatRef.current = 0;
  }, []);

  const setBpm = useCallback((v: number) => {
    setBpmState(Math.max(40, Math.min(240, v)));
  }, []);

  const tapTimestampsRef = useRef<number[]>([]);

  const tap = useCallback(() => {
    const now = Date.now();
    const taps = tapTimestampsRef.current;
    taps.push(now);

    // Keep last 6 taps within a 4-second window
    while (taps.length > 6) taps.shift();
    while (taps.length > 1 && now - taps[0] > 4000) taps.shift();

    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const tapBpm = Math.round(60000 / avgMs);
      setBpm(tapBpm);
    }
  }, [setBpm]);

  const getBeatTimestamps = useCallback(() => {
    return [...beatTimestampsRef.current];
  }, []);

  const getNearestBeatOffset = useCallback((timestampMs: number): number => {
    const stamps = beatTimestampsRef.current;
    if (stamps.length === 0) return 0;

    let minOffset = Infinity;
    for (const beatMs of stamps) {
      const offset = timestampMs - beatMs;
      if (Math.abs(offset) < Math.abs(minOffset)) {
        minOffset = offset;
      }
    }
    return Math.round(minOffset);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    bpm,
    beatsPerMeasure,
    isPlaying,
    currentBeat,
    countingIn,
    countInBeat,
    setBpm,
    setBeatsPerMeasure,
    start,
    stop,
    tap,
    getBeatTimestamps,
    getNearestBeatOffset,
  };
}
