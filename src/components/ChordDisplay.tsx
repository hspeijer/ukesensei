import type { DetectedChord } from '../audio/useChordDetection';
import { ChordDiagram } from './ChordDiagram';

interface ChordDisplayProps {
  chord: DetectedChord | null;
}

export function ChordDisplay({ chord }: ChordDisplayProps) {
  return (
    <div className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] p-4 w-[200px] h-[240px] flex flex-col items-center justify-center text-[var(--c-text)]">
      {chord ? (
        <>
          {chord.voicing ? (
            <ChordDiagram
              voicing={chord.voicing}
              label={chord.display}
              size={170}
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
