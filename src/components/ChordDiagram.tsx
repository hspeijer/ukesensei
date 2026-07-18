import { memo } from 'react';
import { CHORD_CHART_STRINGS, type ChordInstrument, type ChordVoicing } from '../theory/chords';

interface ChordDiagramProps {
  voicing: ChordVoicing;
  label: string;
  size?: number;
  instrument?: ChordInstrument;
}

const NUM_FRETS_SHOWN = 4;

function ChordDiagramInner({ voicing, label, size = 160, instrument = 'ukulele' }: ChordDiagramProps) {
  const { frets, fingers, barres } = voicing;
  const stringLabels = CHORD_CHART_STRINGS[instrument];
  const numStrings = stringLabels.length;

  const frettedFrets = frets.filter((f) => f > 0);
  const minFret = frettedFrets.length > 0 ? Math.min(...frettedFrets) : 1;
  const maxFret = Math.max(...frets);
  // If all frets fit within first 4, show from fret 1; otherwise offset
  const startFret = maxFret <= NUM_FRETS_SHOWN ? 1 : minFret;

  const hPad = Math.min(24, Math.max(14, size * 0.18));
  const padding = { top: 40, bottom: 20, left: hPad, right: hPad };
  const stringSpacing = (size - padding.left - padding.right) / (numStrings - 1);
  const fretSpacing = 28;
  const dotRadius = Math.min(8, stringSpacing * 0.42);
  const svgHeight = padding.top + NUM_FRETS_SHOWN * fretSpacing + padding.bottom;
  const svgWidth = size;

  const stringX = (s: number) => padding.left + s * stringSpacing;
  const fretY = (f: number) => padding.top + f * fretSpacing;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width={size} height={svgHeight}>
      {/* Chord name */}
      <text
        x={svgWidth / 2}
        y={14}
        textAnchor="middle"
        className="fill-current"
        fontSize={14}
        fontWeight={700}
      >
        {label}
      </text>

      {/* Nut or fret number */}
      {startFret === 1 ? (
        <line
          x1={padding.left - 2}
          y1={fretY(0)}
          x2={padding.left + (numStrings - 1) * stringSpacing + 2}
          y2={fretY(0)}
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
        />
      ) : (
        <text
          x={padding.left - 14}
          y={fretY(0.5) + 4}
          textAnchor="middle"
          fontSize={10}
          className="fill-current opacity-60"
        >
          {startFret}
        </text>
      )}

      {/* Fret lines */}
      {Array.from({ length: NUM_FRETS_SHOWN + 1 }, (_, f) => (
        <line
          key={f}
          x1={padding.left}
          y1={fretY(f)}
          x2={padding.left + (numStrings - 1) * stringSpacing}
          y2={fretY(f)}
          stroke="currentColor"
          strokeWidth={f === 0 && startFret === 1 ? 0 : 1}
          opacity={0.3}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: numStrings }, (_, s) => (
        <line
          key={s}
          x1={stringX(s)}
          y1={fretY(0)}
          x2={stringX(s)}
          y2={fretY(NUM_FRETS_SHOWN)}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.4}
        />
      ))}

      {/* Barre indicators */}
      {barres?.map((barreFret) => {
        const displayFret = barreFret - startFret + 1;
        if (displayFret < 1 || displayFret > NUM_FRETS_SHOWN) return null;
        const barreStrings = frets
          .map((f, i) => (f === barreFret ? i : -1))
          .filter((i) => i >= 0);
        if (barreStrings.length < 2) return null;
        const minS = Math.min(...barreStrings);
        const maxS = Math.max(...barreStrings);
        return (
          <rect
            key={barreFret}
            x={stringX(minS) - 4}
            y={fretY(displayFret) - fretSpacing / 2 - 5}
            width={stringX(maxS) - stringX(minS) + 8}
            height={10}
            rx={5}
            fill="currentColor"
            opacity={0.8}
          />
        );
      })}

      {/* Finger dots and open/muted indicators */}
      {frets.map((fret, s) => {
        if (fret === 0) {
          // Open string indicator
          return (
            <circle
              key={s}
              cx={stringX(s)}
              cy={fretY(0) - 10}
              r={Math.min(5, stringSpacing * 0.3)}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              opacity={0.6}
            />
          );
        }
        if (fret === -1) {
          // Muted string
          return (
            <text
              key={s}
              x={stringX(s)}
              y={fretY(0) - 6}
              textAnchor="middle"
              fontSize={10}
              className="fill-current opacity-60"
            >
              ×
            </text>
          );
        }

        const displayFret = fret - startFret + 1;
        if (displayFret < 1 || displayFret > NUM_FRETS_SHOWN) return null;

        const cy = fretY(displayFret) - fretSpacing / 2;

        // Skip rendering individual dots for barre strings (barre handles it)
        const isBarreNote = barres?.includes(fret) &&
          frets.filter((f) => f === fret).length >= 2;

        return (
          <g key={s}>
            {!isBarreNote && (
              <circle
                cx={stringX(s)}
                cy={cy}
                r={dotRadius}
                fill="currentColor"
                opacity={0.9}
              />
            )}
            {fingers[s] > 0 && !isBarreNote && (
              <text
                x={stringX(s)}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={dotRadius + 1}
                fontWeight={700}
                fill="var(--color-surface, #1e1b2e)"
              >
                {fingers[s]}
              </text>
            )}
          </g>
        );
      })}

      {/* String labels */}
      {stringLabels.map((lbl, s) => (
        <text
          key={s}
          x={stringX(s)}
          y={fretY(NUM_FRETS_SHOWN) + 14}
          textAnchor="middle"
          fontSize={9}
          className="fill-current opacity-50"
        >
          {lbl}
        </text>
      ))}
    </svg>
  );
}

export const ChordDiagram = memo(ChordDiagramInner);
