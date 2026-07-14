import { useCallback, useState } from 'react';
import type { DetectedNote, Instrument, TuningKey } from '../store/useAppStore';
import type { MelodyNote } from '../theory/staff';
import { useMelodyRecorder } from '../audio/useMelodyRecorder';
import { useAudioRecorder } from '../audio/useAudioRecorder';
import { transcribeAudioBlob } from '../audio/transcribeAudio';
import { SheetMusicScore } from './SheetMusicScore';
import { uploadSession } from '../api/sessionApi';

interface SongRecorderProps {
  detectedNote: DetectedNote | null;
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
  detectedNote,
  isListening,
  onEnsureListening,
  getStream,
  tuningKey,
  instrument,
}: SongRecorderProps) {
  const audio = useAudioRecorder();
  const [recording, setRecording] = useState(false);
  const [finishedNotes, setFinishedNotes] = useState<MelodyNote[] | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionSource, setTranscriptionSource] = useState<'live' | 'offline' | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [sessionTimes, setSessionTimes] = useState<{ start: number; end: number } | null>(null);

  const melody = useMelodyRecorder(detectedNote, recording);

  const handleStart = useCallback(async () => {
    setFinishedNotes(null);
    setTranscriptionSource(null);
    setSaveMessage(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    audio.clearRecording();

    if (!isListening) await onEnsureListening();

    const stream = getStream();
    if (!stream) return;

    const startedAt = Date.now();
    setSessionTimes({ start: startedAt, end: startedAt });
    melody.start();
    audio.startRecording(stream);
    setRecording(true);
  }, [audio, audioUrl, getStream, isListening, melody, onEnsureListening]);

  const handleStop = useCallback(async () => {
    setRecording(false);
    const liveNotes = melody.stop();
    const blob = await audio.stopRecording();
    const endedAt = Date.now();
    setSessionTimes((prev) => prev ? { ...prev, end: endedAt } : null);

    if (blob.size > 0) {
      setRecordedBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    }

    setTranscribing(true);
    let finalNotes = liveNotes;
    let source: 'live' | 'offline' = liveNotes.length > 0 ? 'live' : 'offline';

    if (blob.size > 0) {
      try {
        const offlineNotes = await transcribeAudioBlob(blob, instrument, tuningKey);
        if (offlineNotes.length > liveNotes.length) {
          finalNotes = offlineNotes;
          source = 'offline';
        } else if (liveNotes.length === 0 && offlineNotes.length > 0) {
          finalNotes = offlineNotes;
          source = 'offline';
        }
      } catch {
        // Keep live notes if offline transcription fails
      }
    }

    setFinishedNotes(finalNotes);
    setTranscriptionSource(source);
    setTranscribing(false);
  }, [audio, instrument, melody, tuningKey]);

  const handleDiscard = useCallback(() => {
    setRecording(false);
    melody.reset();
    audio.clearRecording();
    setFinishedNotes(null);
    setTranscriptionSource(null);
    setRecordedBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSaveMessage(null);
    setSessionTimes(null);
  }, [audio, audioUrl, melody]);

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

  const displayNotes = recording ? melody.notes : finishedNotes;

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
              Recording {formatDuration(melody.elapsedMs)}
            </span>
            <span className="text-xs text-[var(--c-text-muted)]">
              {melody.noteCount} notes captured live
            </span>
          </>
        )}

        {transcribing && (
          <span className="text-sm text-[var(--c-text-muted)]">
            Transcribing recording…
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
            {transcriptionSource && (
              <span className="text-xs text-[var(--c-text-muted)]">
                {transcriptionSource === 'offline'
                  ? `${finishedNotes.length} notes from audio analysis`
                  : `${finishedNotes.length} notes from live capture`}
              </span>
            )}
          </>
        )}
      </div>

      {saveMessage && (
        <p className="text-xs text-[var(--c-text-muted)]">{saveMessage}</p>
      )}

      {audioUrl && !recording && (
        <audio controls src={audioUrl} className="w-full max-w-md" />
      )}

      {(recording || finishedNotes || transcribing) && (
        <SheetMusicScore
          notes={displayNotes ?? []}
          title={
            transcribing
              ? 'Transcribing…'
              : recording
                ? 'Live transcription'
                : 'Sheet music'
          }
        />
      )}
    </div>
  );
}
