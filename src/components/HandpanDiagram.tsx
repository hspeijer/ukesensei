import { memo } from 'react';
import type { HandpanTone } from '../theory/handpanLayout';
import { displayNote, type NoteName } from '../theory/notes';

interface HandpanDiagramProps {
  /** tones[0] is the Ding; the rest are the tone fields, in ascending pitch order. */
  tones: HandpanTone[];
  active: { note: NoteName; octave: number } | null;
  /** Called when a tone field or the Ding is clicked/tapped, to hear & select it. */
  onToneClick?: (note: NoteName, octave: number) => void;
  size?: number;
  opacity?: number;
}

const SVG_SIZE = 160;
const CENTER = SVG_SIZE / 2;
const FIELD_RADIUS = 58;
const FIELD_R = 17;
const DING_R = 24;

function toneLabel(tone: HandpanTone): string {
  return `${displayNote(tone.note, tone.preferFlats)}${tone.octave}`;
}

function isActiveTone(tone: HandpanTone, active: { note: NoteName; octave: number } | null): boolean {
  return !!active && active.note === tone.note && active.octave === tone.octave;
}

/**
 * A circular diagram of a handpan: the center "Ding" note plus its tone
 * fields arranged evenly around it, standing in for a fingering/fretboard
 * diagram since a handpan has neither strings nor keys — just fixed struck
 * pitches. Fields and the Ding are clickable so players can hear & select
 * any tone directly on the diagram, not just from a separate control.
 */
function HandpanDiagramInner({ tones, active, onToneClick, size = 180, opacity = 1 }: HandpanDiagramProps) {
  const ding = tones[0];
  const fields = tones.slice(1);
  const dingActive = isActiveTone(ding, active);
  const activeTone = active ? tones.find((t) => t.note === active.note && t.octave === active.octave) : undefined;

  return (
    <div style={{ opacity }} className="flex flex-col items-center text-[var(--c-text)] select-none">
      {active && (
        <div className="text-lg font-bold text-[var(--c-accent)] mb-1">
          {displayNote(active.note, !!activeTone?.preferFlats)}
          <span className="text-xs font-normal opacity-60">{active.octave}</span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width={size}
        height={size}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <circle
          cx={CENTER}
          cy={CENTER}
          r={SVG_SIZE / 2 - 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.25}
        />

        {fields.map((tone, i) => {
          const angle = (360 / fields.length) * i;
          const rad = (angle * Math.PI) / 180;
          const x = CENTER + FIELD_RADIUS * Math.sin(rad);
          const y = CENTER - FIELD_RADIUS * Math.cos(rad);
          const isActive = isActiveTone(tone, active);
          const label = toneLabel(tone);
          return (
            <g
              key={i}
              onClick={onToneClick ? () => onToneClick(tone.note, tone.octave) : undefined}
              style={onToneClick ? { cursor: 'pointer' } : undefined}
              role={onToneClick ? 'button' : undefined}
              aria-label={onToneClick ? `Play ${label}` : undefined}
            >
              <circle
                cx={x}
                cy={y}
                r={FIELD_R}
                fill={isActive ? 'currentColor' : 'transparent'}
                stroke="currentColor"
                strokeWidth={1.5}
                opacity={isActive ? 0.95 : 0.6}
              />
              <text
                x={x}
                y={y + 0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight={600}
                fill={isActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
                opacity={isActive ? 1 : 0.9}
                style={{ pointerEvents: 'none' }}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Ding, center */}
        <g
          onClick={onToneClick ? () => onToneClick(ding.note, ding.octave) : undefined}
          style={onToneClick ? { cursor: 'pointer' } : undefined}
          role={onToneClick ? 'button' : undefined}
          aria-label={onToneClick ? 'Play Ding' : undefined}
        >
          <circle
            cx={CENTER}
            cy={CENTER}
            r={DING_R}
            fill={dingActive ? 'currentColor' : 'transparent'}
            stroke="currentColor"
            strokeWidth={1.5}
            opacity={dingActive ? 0.95 : 0.7}
          />
          <text
            x={CENTER}
            y={CENTER + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fontWeight={700}
            fill={dingActive ? 'var(--color-surface, #1e1b2e)' : 'currentColor'}
            opacity={dingActive ? 1 : 0.9}
            style={{ pointerEvents: 'none' }}
          >
            Ding
          </text>
        </g>
      </svg>
    </div>
  );
}

export const HandpanDiagram = memo(HandpanDiagramInner);
