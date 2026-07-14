import { useMemo } from 'react';
import type { DetectedNote } from '../store/useAppStore';
import { useDisplayedNote } from '../hooks/useDisplayedNote';
import { ledgerLineYs, staffAccidental, trebleStaffY } from '../theory/staff';

interface LiveStaffProps {
  note: DetectedNote | null;
}

const WIDTH = 148;
const HEIGHT = 96;
const STAFF_LEFT = 52;
const STAFF_RIGHT = 138;
const STAFF_TOP = 28;
const LINE_SPACING = 8;
const STAFF_BOTTOM = STAFF_TOP + LINE_SPACING * 4;

export function LiveStaff({ note }: LiveStaffProps) {
  const displayed = useDisplayedNote(note);

  const layout = useMemo(() => {
    if (!displayed) return null;

    const { note: stable } = displayed;
    const noteY = trebleStaffY(stable.note, stable.octave, STAFF_TOP, LINE_SPACING);
    const accidental = staffAccidental(stable.note);
    const stemUp = noteY > STAFF_TOP + LINE_SPACING * 2;
    const stemX = STAFF_RIGHT - 28;
    const stemEnd = stemUp ? noteY - 22 : noteY + 22;
    const ledgers = ledgerLineYs(noteY, STAFF_TOP, STAFF_BOTTOM, LINE_SPACING);

    return { noteY, accidental, stemUp, stemX, stemEnd, ledgers, opacity: displayed.opacity };
  }, [displayed]);

  return (
    <div
      className="bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)] shrink-0"
      style={{ width: WIDTH, height: HEIGHT }}
      aria-label={displayed ? `Treble staff showing ${displayed.note.note}${displayed.note.octave}` : 'Treble staff'}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
        {/* Treble clef */}
        <text
          x={8}
          y={STAFF_BOTTOM + 2}
          fontSize={42}
          fill="var(--c-text)"
          fontFamily="'Bravura', 'Noto Music', serif"
        >
          𝄞
        </text>

        {/* Staff lines */}
        {Array.from({ length: 5 }, (_, i) => {
          const y = STAFF_TOP + i * LINE_SPACING;
          return (
            <line
              key={i}
              x1={STAFF_LEFT}
              y1={y}
              x2={STAFF_RIGHT}
              y2={y}
              stroke="var(--c-text-muted)"
              strokeWidth={1}
            />
          );
        })}

        {layout && (
          <g opacity={layout.opacity}>
            {layout.ledgers.map((y, i) => (
              <line
                key={`ledger-${i}`}
                x1={layout.stemX - 10}
                y1={y}
                x2={layout.stemX + 10}
                y2={y}
                stroke="var(--c-text-muted)"
                strokeWidth={1}
              />
            ))}

            {layout.accidental && (
              <text
                x={layout.stemX - 16}
                y={layout.noteY + 4}
                fontSize={14}
                fill="var(--c-text)"
                fontFamily="'Bravura', 'Noto Music', serif"
              >
                {layout.accidental === 'sharp' ? '♯' : '♭'}
              </text>
            )}

            <ellipse
              cx={layout.stemX}
              cy={layout.noteY}
              rx={5.5}
              ry={4}
              fill="#34d399"
              transform={layout.stemUp ? undefined : `rotate(-20 ${layout.stemX} ${layout.noteY})`}
            />

            <line
              x1={layout.stemX + (layout.stemUp ? 5 : -5)}
              y1={layout.noteY}
              x2={layout.stemX + (layout.stemUp ? 5 : -5)}
              y2={layout.stemEnd}
              stroke="var(--c-text)"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
