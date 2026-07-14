import { useRef, useCallback, useEffect } from 'react';
import { PitchDetector } from 'pitchy';
import { useAppStore } from '../store/useAppStore';
import { analyzeFrequency, detectTuningFromNote } from './noteUtils';

const BUFFER_SIZE = 2048;
const LEVEL_SMOOTHING = 0.3;

function computeRMS(buffer: Float32Array<ArrayBuffer>): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

export function usePitchDetection(
  getAnalyser: () => AnalyserNode | null,
  getSampleRate: () => number,
  isActive: boolean,
) {
  const detectorRef = useRef<PitchDetector<Float32Array<ArrayBuffer>> | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedLevelRef = useRef(0);
  const setDetectedNote = useAppStore((s) => s.setDetectedNote);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const tuningKey = useAppStore((s) => s.tuningKey);
  const setTuning = useAppStore((s) => s.setTuning);
  const setTuningAutoDetected = useAppStore((s) => s.setTuningAutoDetected);
  const tuningAutoRef = useRef({ lowGCount: 0, highGCount: 0 });

  const instrument = useAppStore((s) => s.instrument);

  const detect = useCallback(() => {
    const analyser = getAnalyser();
    if (!analyser) return;

    if (!detectorRef.current) {
      detectorRef.current = PitchDetector.forFloat32Array(BUFFER_SIZE);
      bufferRef.current = new Float32Array(BUFFER_SIZE);
    }

    const buffer = bufferRef.current!;
    analyser.getFloatTimeDomainData(buffer);

    // Compute audio level (RMS -> dB, normalized to 0-1 range)
    const rms = computeRMS(buffer);
    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    // Map -60dB..0dB to 0..1
    const normalizedLevel = Math.max(0, Math.min(1, (dbFS + 60) / 60));
    smoothedLevelRef.current =
      smoothedLevelRef.current * LEVEL_SMOOTHING +
      normalizedLevel * (1 - LEVEL_SMOOTHING);
    setAudioLevel(smoothedLevelRef.current);

    const [frequency, clarity] = detectorRef.current.findPitch(
      buffer,
      getSampleRate(),
    );

    const noteInfo = analyzeFrequency(frequency, clarity, instrument, tuningKey);
    if (noteInfo) {
      setDetectedNote({
        note: noteInfo.note,
        octave: noteInfo.octave,
        frequency: noteInfo.frequency,
        clarity,
        cents: noteInfo.cents,
        timestamp: Date.now(),
      });

      const detected = instrument === 'ukulele'
        ? detectTuningFromNote(noteInfo.note, noteInfo.octave, noteInfo.frequency)
        : null;
      if (detected) {
        const counts = tuningAutoRef.current;
        if (detected === 'low_g') counts.lowGCount++;
        else counts.highGCount++;

        const threshold = 3;
        if (counts.lowGCount >= threshold && detected === 'low_g' && tuningKey !== 'low_g') {
          setTuning('low_g');
          setTuningAutoDetected(true);
          counts.lowGCount = 0;
          counts.highGCount = 0;
        } else if (counts.highGCount >= threshold && detected === 'standard' && tuningKey !== 'standard') {
          setTuning('standard');
          setTuningAutoDetected(true);
          counts.lowGCount = 0;
          counts.highGCount = 0;
        }
      }
    } else {
      setDetectedNote(null);
    }

    rafRef.current = requestAnimationFrame(detect);
  }, [getAnalyser, getSampleRate, setDetectedNote, setAudioLevel, tuningKey, setTuning, setTuningAutoDetected, instrument]);

  useEffect(() => {
    if (isActive) {
      smoothedLevelRef.current = 0;
      rafRef.current = requestAnimationFrame(detect);
    } else {
      setAudioLevel(0);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, detect, setAudioLevel]);
}
