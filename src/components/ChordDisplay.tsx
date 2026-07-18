import type { DetectedChord } from '../audio/useChordDetection';
import type { ChordInstrument } from '../theory/chords';
import { ChordDiagram } from './ChordDiagram';

interface ChordDisplayProps {
  chord: DetectedChord | null;
  compact?: boolean;
  instrument?: ChordInstrument;
}

export function ChordDisplay({ chord, compact = false, instrument = 'ukulele' }: ChordDisplayProps) {
  if (compact) {
    return (
      <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 flex items-center gap-3 text-[var(--c-text)]">
        {chord?.voicing ? (
          <ChordDiagram
            voicing={chord.voicing}
            label={chord.display}
            size={72}
            instrument={instrument}
          />
        ) : (
          <div className="text-2xl text-[var(--c-border)] shrink-0">&#9835;</div>
        )}
        <div className="min-w-0">
          {chord ? (
            <>
              <div className="text-lg font-bold text-[var(--c-accent)] truncate">
                {chord.display}
              </div>
              <div className="text-xs text-[var(--c-text-muted)]">
                {chord.voicing ? 'Detected chord' : 'No diagram available'}
              </div>
            </>
          ) : (
            <div className="text-xs text-[var(--c-text-muted)]">
              Strum a chord...
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-3 sm:p-4 w-full sm:w-[180px] lg:w-[200px] h-auto sm:h-[220px] lg:h-[240px] flex flex-col items-center justify-center text-[var(--c-text)]">
      {chord ? (
        <>
          {chord.voicing ? (
            <ChordDiagram
              voicing={chord.voicing}
              label={chord.display}
              size={170}
              instrument={instrument}
            />
          ) : (
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--c-accent)]">
                {chord.display}
              </div>
              <div className="text-xs text-[var(--c-text-muted)] mt-2">
                No diagram available
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center">
          <div className="text-2xl text-[var(--c-border)] mb-2">&#9835;</div>
          <div className="text-xs text-[var(--c-text-muted)]">
            Strum a chord...
          </div>
        </div>
      )}
    </div>
  );
}
