import { useMemo } from 'react';
import {
  generateFretboard,
  getScalePositions,
  getPositionId,
  NUM_FRETS,
  type FretPosition,
  type InstrumentTuning,
} from '../../theory/fretboard';
import { getScaleNotes } from '../../theory/scales';
import type { NoteName } from '../../theory/notes';
import { FretboardNote } from './FretboardNote';
import { FretMarkers } from './FretMarkers';

interface FretboardProps {
  tuning: InstrumentTuning;
  root: NoteName;
  scaleKey: string;
  showScale: boolean;
  inverted?: boolean;
  detectedNote?: { note: NoteName; octave: number } | null;
  targetPosition?: FretPosition | null;
  playedPositionIds?: Set<string>;
  chordPositionIds?: Set<string>;
  onNoteClick?: (note: NoteName, octave: number) => void;
  /**
   * Cello (and any other fretless instrument reusing this board) has no
   * frets to show — pitch comes purely from finger placement by ear. When
   * true, this hides fret wires/numbers/inlay dots and renders a smooth,
   * unmarked fingerboard instead, with only a faint octave guide.
   */
  fretless?: boolean;
}

const PADDING = { top: 40, bottom: 30, left: 55, right: 20 };
const STRING_SPACING = 36;
const MIN_FRET_WIDTH = 50;

export function Fretboard({
  tuning,
  root,
  scaleKey,
  showScale,
  inverted = false,
  detectedNote,
  targetPosition,
  playedPositionIds,
  chordPositionIds,
  onNoteClick,
  fretless = false,
}: FretboardProps) {
  const fretboard = useMemo(() => generateFretboard(tuning), [tuning]);
  const scaleNotes = useMemo(() => getScaleNotes(root, scaleKey), [root, scaleKey]);
  const scalePositions = useMemo(
    () => (showScale ? getScalePositions(fretboard, scaleNotes) : []),
    [fretboard, scaleNotes, showScale],
  );
  const scalePositionIds = useMemo(
    () => new Set(scalePositions.map(getPositionId)),
    [scalePositions],
  );

  const stringLabels = useMemo(() => tuning.strings.map((s) => s.note), [tuning]);
  const numStrings = tuning.strings.length;
  const boardHeight = PADDING.top + (numStrings - 1) * STRING_SPACING + PADDING.bottom;

  const fretWidths = useMemo(() => {
    const widths: number[] = [];
    for (let f = 1; f <= NUM_FRETS; f++) {
      // Real frets get closer together at higher positions; a fretless
      // fingerboard has no such physical constraint, so space positions
      // evenly to avoid implying discrete, unevenly-sized frets.
      widths.push(fretless ? MIN_FRET_WIDTH : Math.max(MIN_FRET_WIDTH, 80 - f * 1.5));
    }
    return widths;
  }, [fretless]);

  const totalFretWidth = fretWidths.reduce((a, b) => a + b, 0);
  const boardWidth = PADDING.left + totalFretWidth + PADDING.right;

  const fretXPositions = useMemo(() => {
    const positions: number[] = [PADDING.left];
    let x = PADDING.left;
    for (const w of fretWidths) {
      x += w;
      positions.push(x);
    }
    return positions;
  }, [fretWidths]);

  const fretX = (fret: number) => fretXPositions[fret];
  const displayString = (s: number) => inverted ? (numStrings - 1 - s) : s;
  const stringY = (s: number) => PADDING.top + displayString(s) * STRING_SPACING;

  const detectedPositionIds = useMemo(() => {
    if (!detectedNote) return new Set<string>();
    const ids = new Set<string>();
    for (const pos of fretboard) {
      if (pos.note === detectedNote.note && pos.octave === detectedNote.octave) {
        ids.add(getPositionId(pos));
      }
    }
    return ids;
  }, [detectedNote, fretboard]);

  const targetId = targetPosition ? getPositionId(targetPosition) : null;

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        className="w-full h-auto max-h-[160px] sm:max-h-[220px] lg:max-h-[260px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect
          x={PADDING.left}
          y={PADDING.top - 16}
          width={totalFretWidth}
          height={(numStrings - 1) * STRING_SPACING + 32}
          rx={6}
          fill="var(--c-fb-bg)"
        />

        {/* Fret markers (dots) -- a fretless board only gets a faint octave guide */}
        <FretMarkers fretX={fretX} stringY={stringY} numStrings={numStrings} fretless={fretless} />

        {/* Nut */}
        <line
          x1={PADDING.left}
          y1={PADDING.top - 16}
          x2={PADDING.left}
          y2={PADDING.top + (numStrings - 1) * STRING_SPACING + 16}
          stroke="var(--c-fb-nut)"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Fret wires -- omitted on a fretless board, which has a smooth, unmarked neck */}
        {!fretless && fretXPositions.slice(1).map((x, i) => (
          <line
            key={i}
            x1={x}
            y1={PADDING.top - 14}
            x2={x}
            y2={PADDING.top + (numStrings - 1) * STRING_SPACING + 14}
            stroke="var(--c-fb-fret)"
            strokeWidth={1.5}
          />
        ))}

        {/* Strings */}
        {Array.from({ length: numStrings }, (_, s) => {
          const y = stringY(s);
          return (
            <line
              key={s}
              x1={PADDING.left}
              y1={y}
              x2={PADDING.left + totalFretWidth}
              y2={y}
              stroke="var(--c-fb-string)"
              strokeWidth={s === 0 ? 1 : 1 + s * 0.3}
            />
          );
        })}

        {/* String labels */}
        {stringLabels.map((label, s) => (
          <text
            key={`${label}-${s}`}
            x={PADDING.left - 20}
            y={stringY(s)}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--c-fb-label)"
            fontSize={13}
            fontWeight={600}
          >
            {label}
          </text>
        ))}

        {/* Fret numbers -- meaningless on a fretless board, so omitted */}
        {!fretless && Array.from({ length: NUM_FRETS }, (_, f) => {
          const cx = (fretX(f) + fretX(f + 1)) / 2;
          return (
            <text
              key={f}
              x={cx}
              y={PADDING.top - 26}
              textAnchor="middle"
              fill="var(--c-fb-number)"
              fontSize={10}
            >
              {f + 1}
            </text>
          );
        })}

        {/* Notes */}
        {fretboard.map((pos) => {
          const id = getPositionId(pos);
          const isScaleTone = scalePositionIds.has(id);
          const isDetected = detectedPositionIds.has(id);
          const isRoot = pos.note === root && isScaleTone;
          const isTarget = id === targetId;
          const isPlayed = playedPositionIds?.has(id) ?? false;
          const isChordTone = chordPositionIds?.has(id) ?? false;

          if (!isScaleTone && !isDetected && !isTarget && !isChordTone) return null;

          const cx =
            pos.fret === 0
              ? PADDING.left - 8
              : (fretX(pos.fret - 1) + fretX(pos.fret)) / 2;
          const cy = stringY(pos.string);

          return (
            <FretboardNote
              key={id}
              cx={cx}
              cy={cy}
              note={pos.note}
              isRoot={isRoot}
              isDetected={isDetected}
              isTarget={isTarget}
              isScaleTone={isScaleTone}
              isPlayed={isPlayed}
              isChordTone={isChordTone}
              onClick={onNoteClick ? () => onNoteClick(pos.note, pos.octave) : undefined}
            />
          );
        })}
      </svg>
    </div>
  );
}
