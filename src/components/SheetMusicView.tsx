import { useMemo, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { quantizeMelody } from '../theory/staff';
import { inferSongChords } from '../theory/harmony';
import { findTuningByKey, isStringInstrument, type Instrument } from '../theory/fretboard';
import { SheetMusicScore } from './SheetMusicScore';
import { TabScore } from './TabScore';
import { ChordRow, type ChordRowChord } from './ChordRow';

type ViewMode = 'staff' | 'tab';

interface SheetMusicViewProps {
  notes: MelodyNote[];
  instrument: Instrument;
  tuningKey: string;
  title?: string;
  className?: string;
  activeNoteIndex?: number;
  /** One chord label per measure, or null for a measure with no assigned chord. If omitted, chords are inferred automatically from the melody's detected key. */
  chords?: Array<ChordRowChord | null>;
  onNoteClick?: (index: number) => void;
  /** Play/pause control for hearing the melody through the instrument synth, shown next to the title. Omit to hide it (e.g. read-only rhythm-only views). */
  synthPlayback?: { isPlaying: boolean; onToggle: () => void };
}

/**
 * The single "sheet music" block used everywhere a recorded melody is shown
 * (recording preview, library playback, shared links). Wraps the treble
 * staff and tab renderers behind a Staff/Tab toggle (string instruments
 * only) and, for ukulele, a row of chord diagrams above the score — one per
 * chord change, since that's the only instrument with a voicing database.
 */
export function SheetMusicView({
  notes,
  instrument,
  tuningKey,
  title,
  className = '',
  activeNoteIndex,
  chords,
  onNoteClick,
  synthPlayback,
}: SheetMusicViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('staff');

  const { bpm, measures } = useMemo(() => quantizeMelody(notes), [notes]);
  const inferredChords = useMemo(() => inferSongChords(notes, measures), [notes, measures]);
  const chordLabels = chords ?? inferredChords;

  const tuning = isStringInstrument(instrument) ? findTuningByKey(tuningKey) : null;
  const showToggle = tuning !== null;
  const showChordRow = instrument === 'ukulele';
  const mode: ViewMode = showToggle ? viewMode : 'staff';

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {synthPlayback && notes.length > 0 && (
            <button
              onClick={synthPlayback.onToggle}
              title={synthPlayback.isPlaying ? 'Pause synth playback' : 'Play melody on synth'}
              className="w-6 h-6 rounded-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white transition shrink-0"
            >
              {synthPlayback.isPlaying ? (
                <svg width="8" height="8" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="1" width="3.5" height="12" rx="1" />
                  <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 14 14" fill="currentColor">
                  <polygon points="3,0 14,7 3,14" />
                </svg>
              )}
            </button>
          )}
          {title && (
            <h3 className="text-sm font-semibold text-[var(--c-text-muted)] truncate">
              {title}{' '}
              {notes.length > 0 && (
                <span className="font-normal text-[var(--c-text-muted)]/70">(~{bpm} BPM, quantized)</span>
              )}
            </h3>
          )}
        </div>
        {showToggle && (
          <div className="flex rounded-lg border border-[var(--c-border)] overflow-hidden text-xs font-medium shrink-0 ml-auto">
            <button
              onClick={() => setViewMode('staff')}
              className={`px-3 py-1 transition ${mode === 'staff' ? 'bg-teal-600 text-white' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'}`}
            >
              Staff
            </button>
            <button
              onClick={() => setViewMode('tab')}
              className={`px-3 py-1 transition ${mode === 'tab' ? 'bg-teal-600 text-white' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'}`}
            >
              Tab
            </button>
          </div>
        )}
      </div>

      {showChordRow && <ChordRow chords={chordLabels} className="mb-2" />}

      {mode === 'tab' && tuning ? (
        <TabScore
          notes={notes}
          tuning={tuning}
          activeNoteIndex={activeNoteIndex}
          chords={chordLabels}
          onNoteClick={onNoteClick}
        />
      ) : (
        <SheetMusicScore
          notes={notes}
          activeNoteIndex={activeNoteIndex}
          chords={chordLabels}
          onNoteClick={onNoteClick}
        />
      )}
    </div>
  );
}
