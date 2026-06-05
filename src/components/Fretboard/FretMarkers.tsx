import { FRET_MARKERS, DOUBLE_FRET_MARKERS } from '../../theory/fretboard';

interface FretMarkersProps {
  fretX: (fret: number) => number;
  stringY: (string: number) => number;
  numStrings: number;
}

export function FretMarkers({ fretX, stringY, numStrings }: FretMarkersProps) {
  const midY = (stringY(0) + stringY(numStrings - 1)) / 2;

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
