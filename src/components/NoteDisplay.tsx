import type { DetectedNote } from '../store/useAppStore';
import { displayNote } from '../theory/notes';

interface NoteDisplayProps {
  note: DetectedNote | null;
}

export function NoteDisplay({ note }: NoteDisplayProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="text-center w-[100px]">
        <div
          className="text-5xl font-bold tracking-tight h-[56px] flex items-center justify-center"
          style={{ color: note ? '#34d399' : 'var(--c-inactive)' }}
        >
          {note ? displayNote(note.note) : '—'}
        </div>
        <div className="text-sm text-[var(--c-text-muted)] mt-1 h-[20px]">
          {note ? (
            <>{note.octave} &middot; {Math.round(note.frequency)} Hz</>
          ) : (
            <span className="invisible">0 · 000 Hz</span>
          )}
        </div>
      </div>
    </div>
  );
}
