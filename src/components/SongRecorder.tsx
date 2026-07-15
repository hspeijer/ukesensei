import { useCallback, useEffect, useRef, useState } from 'react';
import type { Instrument, TuningKey } from '../store/useAppStore';
import type { MelodyNote } from '../theory/staff';
import { useAudioRecorder } from '../audio/useAudioRecorder';
import { transcribeAudioBlob } from '../audio/transcribeAudio';
import { SheetMusicScore } from './SheetMusicScore';
import { uploadSession } from '../api/sessionApi';

interface SongRecorderProps {
  isListening: boolean;
  onEnsureListening: () => Promise<void>;
  getStream: () => MediaStream | null;
  tuningKey: TuningKey;
  instrument: Instrument;
}

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}:${rem.toString().padStart(2, '0')}`;
}

function melodyToSessionNotes(
  notes: MelodyNote[],
  sessionStart: number,
): Array<{
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  timestamp: number;
  beatOffset: number;
  expectedNote: null;
  wasCorrect: true;
}> {
  return notes.map((n) => ({
    note: n.note,
    octave: n.octave,
    cents: n.cents,
    frequency: 0,
    timestamp: sessionStart + n.startMs,
    beatOffset: 0,
    expectedNote: null,
    wasCorrect: true as const,
  }));
}

export function SongRecorder({
  isListening,
  onEnsureListening,
  getStream,
  tuningKey,
  instrument,
}: SongRecorderProps) {
  const audio = useAudioRecorder();
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finishedNotes, setFinishedNotes] = useState<MelodyNote[] | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sessionTimes, setSessionTimes] = useState<{ start: number; end: number } | null>(null);
  const startedAtRef = useRef<number | null>(null);

  // Recording always captures the full take first; pitch/note detection only
  // ever runs afterward on the finished audio, so a slow or missed live
  // detection can never cause part of the performance to go unrecorded.
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    return () => clearInterval(id);
  }, [recording]);

  const handleStart = useCallback(async () => {
    setFinishedNotes(null);
    setSaveMessage(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audio.clearRecording();
    setElapsedMs(0);

    if (!isListening) await onEnsureListening();

    const stream = getStream();
    if (!stream) return;

    const startedAt = Date.now();
    startedAtRef.current = startedAt;
    setSessionTimes({ start: startedAt, end: startedAt });
    audio.startRecording(stream);
    setRecording(true);
  }, [audio, audioUrl, getStream, isListening, onEnsureListening]);

  const handleStop = useCallback(async () => {
    setRecording(false);
    startedAtRef.current = null;
    const blob = await audio.stopRecording();
    const endedAt = Date.now();
    setSessionTimes((prev) => (prev ? { ...prev, end: endedAt } : null));

    if (blob.size === 0) {
      setFinishedNotes([]);
      return;
    }

    setRecordedBlob(blob);
    setAudioUrl(URL.createObjectURL(blob));

    setTranscribing(true);
    let notes: MelodyNote[] = [];
    try {
      notes = await transcribeAudioBlob(blob, instrument, tuningKey);
    } catch {
      // The recording itself is still saved/playable even if detection fails.
    }
    setFinishedNotes(notes);
    setTranscribing(false);
  }, [audio, instrument, tuningKey]);

  const handleDiscard = useCallback(() => {
    setRecording(false);
    audio.clearRecording();
    setFinishedNotes(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSaveMessage(null);
    setSessionTimes(null);
  }, [audio, audioUrl]);

  const handleSave = useCallback(async () => {
    if (!sessionTimes) return;
    const notes = finishedNotes ?? [];
    setSaving(true);
    setSaveMessage(null);

    try {
      const { local } = await uploadSession(recordedBlob, {
        scaleKey: 'melody',
        root: notes[0]?.note ?? 'C',
        bpm: 0,
        tuningKey,
        startedAt: sessionTimes.start,
        endedAt: sessionTimes.end,
        pitchAccuracy: 1,
        timingOnTimePercent: 1,
        overallScore: 1,
        notes: melodyToSessionNotes(notes, sessionTimes.start),
      });
      setSaveMessage(local ? 'Saved to library (on this device)' : 'Saved to your library');
    } catch {
      setSaveMessage('Save failed');
    } finally {
      setSaving(false);
    }
  }, [finishedNotes, recordedBlob, sessionTimes, tuningKey]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {!recording && !finishedNotes && !transcribing && (
          <button
            onClick={handleStart}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
          >
            Record Song
          </button>
        )}

        {recording && (
          <>
            <button
              onClick={handleStop}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--c-surface)] text-[var(--c-text)] border border-[var(--c-border)] hover:bg-[var(--c-surface-hover)] transition"
            >
              Stop
            </button>
            <span className="flex items-center gap-2 text-sm text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Recording {formatDuration(elapsedMs)}
            </span>
          </>
        )}

        {transcribing && (
          <span className="text-sm text-[var(--c-text-muted)]">
            Detecting notes…
          </span>
        )}

        {finishedNotes && !recording && !transcribing && (
          <>
            <button
              onClick={handleStart}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition"
            >
              Record Again
            </button>
            <button
              onClick={handleDiscard}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save to Library'}
            </button>
            <span className="text-xs text-[var(--c-text-muted)]">
              {finishedNotes.length} notes detected
            </span>
          </>
        )}
      </div>

      {saveMessage && (
        <p className="text-xs text-[var(--c-text-muted)]">{saveMessage}</p>
      )}

      {audioUrl && !recording && (
        <audio controls src={audioUrl} className="w-full max-w-md" />
      )}

      {!recording && (finishedNotes || transcribing) && (
        <SheetMusicScore
          notes={finishedNotes ?? []}
          title={transcribing ? 'Detecting notes…' : 'Sheet music'}
        />
      )}
    </div>
  );
}
