import type { DetectedNote } from '../store/useAppStore';
import { displayNote } from '../theory/notes';

interface NoteDisplayProps {
  note: DetectedNote | null;
}

export function NoteDisplay({ note }: NoteDisplayProps) {
  return (
    <div className="text-center min-w-[72px] sm:min-w-[100px]">
      <div
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight h-[44px] sm:h-[52px] lg:h-[56px] flex items-center justify-center"
        style={{ color: note ? '#34d399' : 'var(--c-inactive)' }}
      >
        {note ? displayNote(note.note) : '—'}
      </div>
      <div className="text-xs sm:text-sm text-[var(--c-text-muted)] mt-0.5 sm:mt-1 h-[16px] sm:h-[20px]">
        {note ? (
          <>{note.octave} &middot; {Math.round(note.frequency)} Hz</>
        ) : (
          <span className="invisible">0 · 000 Hz</span>
        )}
      </div>
    </div>
  );
}
