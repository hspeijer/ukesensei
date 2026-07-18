import { FRET_MARKERS, DOUBLE_FRET_MARKERS, OCTAVE_FRET } from '../../theory/fretboard';

interface FretMarkersProps {
  fretX: (fret: number) => number;
  stringY: (string: number) => number;
  numStrings: number;
  /** Fretless boards only get a single faint guide at the octave, not a full set of inlay dots. */
  fretless?: boolean;
}

export function FretMarkers({ fretX, stringY, numStrings, fretless = false }: FretMarkersProps) {
  const midY = (stringY(0) + stringY(numStrings - 1)) / 2;

  if (fretless) {
    const cx = (fretX(OCTAVE_FRET - 1) + fretX(OCTAVE_FRET)) / 2;
    return (
      <circle cx={cx} cy={midY} r={4} fill="var(--c-fb-marker)" opacity={0.35} />
    );
  }

  return (
    <g>
      {FRET_MARKERS.map((fret) => {
        const cx = (fretX(fret - 1) + fretX(fret)) / 2;
        const isDouble = DOUBLE_FRET_MARKERS.includes(fret);

        if (isDouble) {
          const offset = (stringY(1) - stringY(0)) * 0.5;
          return (
            <g key={fret}>
              <circle cx={cx} cy={midY - offset} r={5} fill="var(--c-fb-marker)" />
              <circle cx={cx} cy={midY + offset} r={5} fill="var(--c-fb-marker)" />
            </g>
          );
        }

        return (
          <circle key={fret} cx={cx} cy={midY} r={5} fill="var(--c-fb-marker)" />
        );
      })}
    </g>
  );
}
