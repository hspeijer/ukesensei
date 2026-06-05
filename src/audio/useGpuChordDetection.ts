import { useRef, useEffect, useState, useCallback } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';
import { CHROMATIC_NOTES, noteToSemitone } from '../theory/notes';
import { findVoicing, type ChordVoicing } from '../theory/chords';
import { WebGpuChordDetector, type GpuChordResult } from './webgpu-chord-detector';

const CHORD_WINDOW_MS = 800;
const CHORD_MIN_UNIQUE_NOTES = 3;
const CHORD_UPDATE_INTERVAL_MS = 150;
const DOMINANT_NOTE_THRESHOLD = 0.75;

export interface DetectedChord {
  root: NoteName;
  quality: string;
  display: string;
  voicing: ChordVoicing | null;
  timestamp: number;
}

type ChordBackend = 'webgpu' | 'cpu';

export function useGpuChordDetection(detectedNote: DetectedNote | null): {
  chord: DetectedChord | null;
  backend: ChordBackend;
} {
  const noteHistoryRef = useRef<{ note: NoteName; timestamp: number }[]>([]);
  const lastUpdateRef = useRef(0);
  const [chord, setChord] = useState<DetectedChord | null>(null);
  const [backend, setBackend] = useState<ChordBackend>('cpu');
  const gpuRef = useRef<WebGpuChordDetector | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const detector = new WebGpuChordDetector();
    detector.init().then((ok) => {
      if (ok) {
        gpuRef.current = detector;
        setBackend('webgpu');
      }
    });

    return () => {
      detector.destroy();
    };
  }, []);

  const buildChroma = useCallback((notes: { note: NoteName; timestamp: number }[]): Float32Array => {
    const chroma = new Float32Array(12);
    const now = Date.now();
    for (const entry of notes) {
      const idx = noteToSemitone(entry.note);
      const age = (now - entry.timestamp) / CHORD_WINDOW_MS;
      const weight = 1 - age * 0.5; // recent notes weigh more
      chroma[idx] += Math.max(0.1, weight);
    }
    return chroma;
  }, []);

  const processWithGpu = useCallback(async (chroma: Float32Array): Promise<GpuChordResult | null> => {
    const gpu = gpuRef.current;
    if (!gpu || !gpu.ready) return null;
    return gpu.detect(chroma);
  }, []);

  const processWithCpu = useCallback((notes: NoteName[], chroma: Float32Array): GpuChordResult | null => {
    const TEMPLATES = [
      { intervals: [0, 4, 7],     priority: 1.0  },
      { intervals: [0, 3, 7],     priority: 0.95 },
      { intervals: [0, 4, 7, 10], priority: 0.85 },
      { intervals: [0, 4, 7, 11], priority: 0.80 },
      { intervals: [0, 3, 7, 10], priority: 0.80 },
      { intervals: [0, 3, 6],     priority: 0.60 },
      { intervals: [0, 4, 8],     priority: 0.60 },
      { intervals: [0, 2, 7],     priority: 0.70 },
      { intervals: [0, 5, 7],     priority: 0.70 },
    ];
    const QUALITY_NAMES = [
      'major', 'minor', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4',
    ];
    const QUALITY_SUFFIXES: Record<string, string> = {
      major: '', minor: 'm', dom7: '7', maj7: 'maj7', min7: 'm7',
      dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
    };

    const maxVal = Math.max(...chroma);
    if (maxVal < 0.01) return null;
    const norm = chroma.map(v => v / maxVal);

    let bestRoot = 255;
    let bestQi = 255;
    let bestScore = -1;

    for (let root = 0; root < 12; root++) {
      for (let qi = 0; qi < TEMPLATES.length; qi++) {
        const tmpl = TEMPLATES[qi];
        let templateEnergy = 0;
        let totalWeight = 0;
        for (const interval of tmpl.intervals) {
          const bin = (root + interval) % 12;
          const weight = interval === 0 ? 1.5 : 1.0;
          templateEnergy += norm[bin] * weight;
          totalWeight += weight;
        }
        const matchRatio = templateEnergy / totalWeight;

        let noise = 0;
        let noiseBins = 0;
        const templateBins = new Set(tmpl.intervals.map(i => (root + i) % 12));
        for (let i = 0; i < 12; i++) {
          if (!templateBins.has(i) && norm[i] > 0.1) {
            noise += norm[i];
            noiseBins++;
          }
        }
        const noisePenalty = noiseBins > 0 ? noise / (noiseBins + tmpl.intervals.length) : 0;
        const rootBonus = norm[root] > 0.5 ? 0.1 : 0;
        const score = (matchRatio - noisePenalty * 0.5 + rootBonus) * tmpl.priority;

        if (score > bestScore) {
          bestScore = score;
          bestRoot = root;
          bestQi = qi;
        }
      }
    }

    if (bestScore < 0.3 || bestRoot > 11 || bestQi > 8) return null;

    const qualityName = QUALITY_NAMES[bestQi];
    return {
      root: bestRoot,
      quality: qualityName,
      suffix: QUALITY_SUFFIXES[qualityName] ?? '',
      confidence: bestScore,
    };
  }, []);

  useEffect(() => {
    if (!detectedNote) return;

    const now = Date.now();
    noteHistoryRef.current.push({ note: detectedNote.note, timestamp: now });
    noteHistoryRef.current = noteHistoryRef.current.filter(
      (n) => now - n.timestamp < CHORD_WINDOW_MS,
    );

    if (now - lastUpdateRef.current < CHORD_UPDATE_INTERVAL_MS) return;
    lastUpdateRef.current = now;

    const recentNotes = noteHistoryRef.current;
    const uniqueNotes = [...new Set(recentNotes.map((n) => n.note))];
    if (uniqueNotes.length < CHORD_MIN_UNIQUE_NOTES) return;

    const noteCounts = new Map<NoteName, number>();
    for (const entry of recentNotes) {
      noteCounts.set(entry.note, (noteCounts.get(entry.note) ?? 0) + 1);
    }
    const totalDetections = recentNotes.length;
    const maxCount = Math.max(...noteCounts.values());
    if (maxCount / totalDetections >= DOMINANT_NOTE_THRESHOLD) return;

    const chroma = buildChroma(recentNotes);

    const applyResult = (result: GpuChordResult | null) => {
      if (!result) return;
      const noteName = CHROMATIC_NOTES[result.root] as NoteName;
      const voicing = findVoicing(noteName, result.suffix);
      setChord({
        root: noteName,
        quality: result.quality,
        display: `${noteName}${result.suffix}`,
        voicing,
        timestamp: now,
      });
    };

    if (gpuRef.current?.ready) {
      processWithGpu(chroma).then(applyResult);
    } else {
      applyResult(processWithCpu(uniqueNotes, chroma));
    }
  }, [detectedNote, buildChroma, processWithGpu, processWithCpu]);

  return { chord, backend };
}
