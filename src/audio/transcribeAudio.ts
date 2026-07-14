import { PitchDetector } from 'pitchy';
import { analyzeFrequency } from './noteUtils';
import type { Instrument } from '../theory/fretboard';
import type { MelodyNote } from '../theory/staff';
import type { NoteName } from '../theory/notes';
import { notesEqual } from '../theory/staff';

const BUFFER_SIZE = 2048;
const HOP = 1024;
const MIN_SEGMENT_MS = 80;
const GAP_MS = 220;

interface OpenSegment {
  note: NoteName;
  octave: number;
  cents: number;
  startMs: number;
  lastMs: number;
}

function closeSegment(open: OpenSegment, segments: MelodyNote[]) {
  const durationMs = open.lastMs - open.startMs;
  if (durationMs >= MIN_SEGMENT_MS) {
    segments.push({
      note: open.note,
      octave: open.octave,
      cents: open.cents,
      startMs: open.startMs,
      durationMs,
    });
  }
}

/** Transcribe a recorded audio blob into melody notes (post-recording). */
export async function transcribeAudioBlob(
  blob: Blob,
  instrument: Instrument,
  tuningKey?: string,
): Promise<MelodyNote[]> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContext();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioCtx.close();
  }

  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const detector = PitchDetector.forFloat32Array(BUFFER_SIZE);
  const buffer = new Float32Array(BUFFER_SIZE);

  const segments: MelodyNote[] = [];
  let open: OpenSegment | null = null;

  for (let offset = 0; offset + BUFFER_SIZE <= channel.length; offset += HOP) {
    buffer.set(channel.subarray(offset, offset + BUFFER_SIZE));
    const timeMs = (offset / sampleRate) * 1000;
    const [frequency, clarity] = detector.findPitch(buffer, sampleRate);
    const noteInfo = analyzeFrequency(frequency, clarity, instrument, tuningKey);

    if (noteInfo) {
      const pitch = { note: noteInfo.note, octave: noteInfo.octave };
      if (!open || !notesEqual(open, pitch)) {
        if (open) closeSegment(open, segments);
        open = {
          note: noteInfo.note,
          octave: noteInfo.octave,
          cents: noteInfo.cents,
          startMs: timeMs,
          lastMs: timeMs,
        };
      } else {
        open.lastMs = timeMs;
        open.cents = noteInfo.cents;
      }
      continue;
    }

    if (open && timeMs - open.lastMs > GAP_MS) {
      closeSegment(open, segments);
      open = null;
    }
  }

  if (open) closeSegment(open, segments);
  return segments;
}
