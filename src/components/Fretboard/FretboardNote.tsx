import { memo, useState, useCallback } from 'react';

interface FretboardNoteProps {
  cx: number;
  cy: number;
  note: string;
  isRoot: boolean;
  isDetected: boolean;
  isTarget: boolean;
  isScaleTone: boolean;
  isPlayed: boolean;
  isChordTone: boolean;
  onClick?: () => void;
}

function FretboardNoteInner({
  cx,
  cy,
  note,
  isRoot,
  isDetected,
  isTarget,
  isScaleTone,
  isPlayed,
  isChordTone,
  onClick,
}: FretboardNoteProps) {
  // Hooks must run unconditionally on every render (Rules of Hooks) --
  // declare them before the early return below, even though they're only
  // meaningful when this note actually renders.
  const [hovered, setHovered] = useState(false);
  const handlePointerEnter = useCallback(() => setHovered(true), []);
  const handlePointerLeave = useCallback(() => setHovered(false), []);

  // Note: intentionally omits `isTarget` -- Fretboard.tsx's own filter (which
  // decides whether to render this component at all) includes isTarget, so
  // this check only matters for defense-in-depth and should stay a superset.
  if (!isScaleTone && !isDetected && !isTarget && !isChordTone) return null;

  let fill = 'var(--c-fb-note-bg)';
  let stroke = 'none';
  let textFill = 'var(--c-fb-note-text)';
  let radius = 13;

  if (isRoot) {
    fill = 'var(--color-primary)';
    textFill = '#fff';
  } else if (isScaleTone) {
    fill = 'var(--c-fb-scale-bg)';
    textFill = 'var(--c-fb-scale-text)';
  }

  if (isChordTone) {
    fill = '#06b6d4';
    textFill = '#fff';
    stroke = '#22d3ee';
    radius = 14;
  }

  if (isTarget) {
    fill = '#fbbf24';
    textFill = '#1e1b2e';
    stroke = '#fde68a';
    radius = 15;
  }

  if (isDetected) {
    fill = '#34d399';
    textFill = '#1e1b2e';
    stroke = '#6ee7b7';
    radius = 15;
  }

  if (isPlayed) {
    fill = '#34d399';
    textFill = '#1e1b2e';
    radius = 13;
  }

  const clickable = !!onClick;
  const displayRadius = hovered && clickable ? radius + 2 : radius;

  return (
    <g
      onClick={onClick}
      onPointerEnter={clickable ? handlePointerEnter : undefined}
      onPointerLeave={clickable ? handlePointerLeave : undefined}
      style={clickable ? { cursor: 'pointer' } : undefined}
    >
      {/* Larger invisible hit area for easier tapping */}
      {clickable && (
        <circle cx={cx} cy={cy} r={radius + 6} fill="transparent" />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={displayRadius}
        fill={fill}
        stroke={hovered && clickable ? '#fff' : stroke}
        strokeWidth={hovered && clickable ? 2.5 : stroke !== 'none' ? 2 : 0}
        style={hovered && clickable ? { filter: 'brightness(1.2)' } : undefined}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textFill}
        fontSize={11}
        fontWeight={isRoot || isDetected || isTarget || isChordTone ? 700 : 500}
        style={{ pointerEvents: 'none' }}
      >
        {note}
      </text>
    </g>
  );
}

export const FretboardNote = memo(FretboardNoteInner);
