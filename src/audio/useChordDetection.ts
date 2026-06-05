import { useRef, useEffect, useState } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import type { NoteName } from '../theory/notes';
import { detectChord, findVoicing, type ChordVoicing } from '../theory/chords';

const CHORD_WINDOW_MS = 800;
const CHORD_MIN_UNIQUE_NOTES = 3;
const CHORD_UPDATE_INTERVAL_MS = 150;
// If one note makes up this fraction or more of detections, it's a single string
const DOMINANT_NOTE_THRESHOLD = 0.75;

export interface DetectedChord {
  root: NoteName;
  quality: string;
  display: string;
  voicing: ChordVoicing | null;
  timestamp: number;
}

export function useChordDetection(detectedNote: DetectedNote | null): DetectedChord | null {
  const noteHistoryRef = useRef<{ note: NoteName; timestamp: number }[]>([]);
  const lastUpdateRef = useRef(0);
  const [chord, setChord] = useState<DetectedChord | null>(null);

  useEffect(() => {
    if (!detectedNote) return;

    const now = Date.now();

    noteHistoryRef.current.push({
      note: detectedNote.note,
      timestamp: now,
    });

    noteHistoryRef.current = noteHistoryRef.current.filter(
      (n) => now - n.timestamp < CHORD_WINDOW_MS,
    );

    if (now - lastUpdateRef.current < CHORD_UPDATE_INTERVAL_MS) return;
    lastUpdateRef.current = now;

    const recentNotes = noteHistoryRef.current;
    const uniqueNotes = [...new Set(recentNotes.map((n) => n.note))];

    if (uniqueNotes.length < CHORD_MIN_UNIQUE_NOTES) return;

    // Build note frequency counts for weighting
    const noteCounts = new Map<NoteName, number>();
    for (const entry of recentNotes) {
      noteCounts.set(entry.note, (noteCounts.get(entry.note) ?? 0) + 1);
    }

    // If one note dominates the window, it's a single string ringing -- not a chord
    const totalDetections = recentNotes.length;
    const maxCount = Math.max(...noteCounts.values());
    if (maxCount / totalDetections >= DOMINANT_NOTE_THRESHOLD) return;

    const detected = detectChord(uniqueNotes, noteCounts);
    if (detected) {
      const qualitySuffix = getQualitySuffix(detected.quality);
      const voicing = findVoicing(detected.root, qualitySuffix);
      setChord({
        root: detected.root,
        quality: detected.quality,
        display: detected.display,
        voicing,
        timestamp: now,
      });
    }
  }, [detectedNote]);

  return chord;
}

function getQualitySuffix(quality: string): string {
  const map: Record<string, string> = {
    major: '',
    minor: 'm',
    dom7: '7',
    maj7: 'maj7',
    min7: 'm7',
    dim: 'dim',
    aug: 'aug',
    sus2: 'sus2',
    sus4: 'sus4',
    add9: 'add9',
    min6: 'm6',
    dom6: '6',
  };
  return map[quality] ?? '';
}
