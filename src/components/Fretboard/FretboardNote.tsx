import { memo } from 'react';

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
}: FretboardNoteProps) {
  if (!isScaleTone && !isDetected && !isChordTone) return null;

  let fill = 'var(--c-fb-note-bg)';
  let stroke = 'none';
  let textFill = 'var(--c-fb-note-text)';
  let radius = 13;
  let className = '';

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
    className = '';
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
    className = '';
  }

  return (
    <g className={className}>
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fill}
        stroke={stroke}
        strokeWidth={stroke !== 'none' ? 2 : 0}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textFill}
        fontSize={11}
        fontWeight={isRoot || isDetected || isTarget || isChordTone ? 700 : 500}
      >
        {note}
      </text>
    </g>
  );
}

export const FretboardNote = memo(FretboardNoteInner);
