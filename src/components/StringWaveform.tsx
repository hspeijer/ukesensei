import { useMemo } from 'react';
import type { StringAnalysisFrame } from '../api/sessionApi';

interface StringWaveformProps {
  frames: StringAnalysisFrame[];
  durationSec: number;
  currentTime: number;
  width: number;
  height: number;
  stringNames?: string[];
}

const STRING_COLORS = ['#34d399', '#38bdf8', '#fbbf24', '#f472b6'];
const DEFAULT_STRING_NAMES = ['G', 'C', 'E', 'A'];
const LANE_PADDING = 4;

export function StringWaveform({
  frames,
  durationSec,
  currentTime,
  width,
  height,
  stringNames = DEFAULT_STRING_NAMES,
}: StringWaveformProps) {
  const laneHeight = (height - LANE_PADDING * 3) / 4;

  const paths = useMemo(() => {
    if (frames.length === 0) return [];

    const step = Math.max(1, Math.floor(frames.length / width));
    const pxPerFrame = width / frames.length;

    return stringNames.map((_, si) => {
      let d = '';
      for (let i = 0; i < frames.length; i += step) {
        const x = i * pxPerFrame;
        const energy = frames[i].strings[si];
        const laneTop = si * (laneHeight + LANE_PADDING);
        const y = laneTop + laneHeight - energy * laneHeight;
        d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      }
      // Close the path to fill
      const laneBottom = si * (laneHeight + LANE_PADDING) + laneHeight;
      const lastX = (frames.length - 1) * pxPerFrame;
      d += ` L ${lastX} ${laneBottom} L 0 ${laneBottom} Z`;
      return d;
    });
  }, [frames, width, laneHeight, stringNames]);

  const cursorX = durationSec > 0 ? (currentTime / durationSec) * width : 0;

  return (
    <svg width={width} height={height} className="block">
      {/* Lane backgrounds */}
      {stringNames.map((name, si) => {
        const y = si * (laneHeight + LANE_PADDING);
        return (
          <g key={si}>
            <rect
              x={0}
              y={y}
              width={width}
              height={laneHeight}
              fill="var(--c-bg)"
              rx={4}
            />
            <text
              x={6}
              y={y + 14}
              fill={STRING_COLORS[si]}
              fontSize={11}
              fontWeight={600}
              fontFamily="monospace"
            >
              {name}
            </text>
          </g>
        );
      })}

      {/* Waveform paths */}
      {paths.map((d, si) => (
        <path
          key={si}
          d={d}
          fill={STRING_COLORS[si]}
          fillOpacity={0.35}
          stroke={STRING_COLORS[si]}
          strokeWidth={1}
          strokeOpacity={0.8}
        />
      ))}

      {/* Playback cursor */}
      {currentTime > 0 && (
        <line
          x1={cursorX}
          y1={0}
          x2={cursorX}
          y2={height}
          stroke="var(--c-accent)"
          strokeWidth={2}
          opacity={0.9}
        />
      )}
    </svg>
  );
}
