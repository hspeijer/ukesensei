import { useCallback, useRef, useState } from 'react';
import type { EqBand, EqBands } from '../audio/useWasmAudio';

interface EqualizerProps {
  eq: EqBands;
  onChange: (band: EqBand, patch: { freq?: number; gain?: number }) => void;
  getFrequencyResponse: (frequencies: Float32Array<ArrayBuffer>) => Float32Array<ArrayBuffer> | null;
}

const VIEW_W = 320;
const VIEW_H = 150;
const PADDING = { top: 10, right: 10, bottom: 20, left: 28 };
const PLOT_W = VIEW_W - PADDING.left - PADDING.right;
const PLOT_H = VIEW_H - PADDING.top - PADDING.bottom;

const MIN_FREQ = 20;
const MAX_FREQ = 20000;
const MIN_DB = -12;
const MAX_DB = 12;
const LOG_MIN = Math.log10(MIN_FREQ);
const LOG_MAX = Math.log10(MAX_FREQ);

// Per-band draggable frequency range, so each handle stays in its role
// (low shelf stays low, high shelf stays high, etc).
const FREQ_RANGE: Record<EqBand, [number, number]> = {
  low: [30, 600],
  mid: [150, 6000],
  high: [1200, 16000],
};

const BAND_COLOR: Record<EqBand, string> = {
  low: '#f59e0b',
  mid: '#14b8a6',
  high: '#38bdf8',
};

const BAND_LABEL: Record<EqBand, string> = { low: 'Low', mid: 'Mid', high: 'High' };

const GRID_FREQS = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
const LABELED_FREQS = new Set([100, 1000, 10000]);
const GRID_DB = [-12, -6, 0, 6, 12];

function freqToX(freq: number): number {
  const logF = Math.log10(Math.min(Math.max(freq, MIN_FREQ), MAX_FREQ));
  return PADDING.left + ((logF - LOG_MIN) / (LOG_MAX - LOG_MIN)) * PLOT_W;
}

function xToFreq(x: number): number {
  const t = Math.min(Math.max((x - PADDING.left) / PLOT_W, 0), 1);
  return Math.pow(10, LOG_MIN + t * (LOG_MAX - LOG_MIN));
}

function dbToY(db: number): number {
  const t = (Math.min(Math.max(db, MIN_DB), MAX_DB) - MIN_DB) / (MAX_DB - MIN_DB);
  return PADDING.top + (1 - t) * PLOT_H;
}

function yToDb(y: number): number {
  const t = Math.min(Math.max((y - PADDING.top) / PLOT_H, 0), 1);
  return MIN_DB + (1 - t) * (MAX_DB - MIN_DB);
}

const SAMPLE_COUNT = 96;
const SAMPLE_FREQS = new Float32Array(SAMPLE_COUNT);
for (let i = 0; i < SAMPLE_COUNT; i++) {
  const t = i / (SAMPLE_COUNT - 1);
  SAMPLE_FREQS[i] = Math.pow(10, LOG_MIN + t * (LOG_MAX - LOG_MIN));
}

export function Equalizer({ eq, onChange, getFrequencyResponse }: EqualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragBand, setDragBand] = useState<EqBand | null>(null);

  const toLocalPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = useCallback((band: EqBand) => (e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragBand(band);
  }, []);

  const applyDrag = useCallback((band: EqBand, clientX: number, clientY: number) => {
    const { x, y } = toLocalPoint(clientX, clientY);
    const [minF, maxF] = FREQ_RANGE[band];
    const freq = Math.min(Math.max(xToFreq(x), minF), maxF);
    const gain = Math.round(yToDb(y) * 2) / 2;
    onChange(band, { freq: Math.round(freq), gain });
  }, [onChange, toLocalPoint]);

  const handlePointerMove = useCallback((band: EqBand) => (e: React.PointerEvent<SVGCircleElement>) => {
    if (dragBand !== band) return;
    applyDrag(band, e.clientX, e.clientY);
  }, [dragBand, applyDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragBand(null);
  }, []);

  // Recomputed on every render (cheap: 96 samples) so the curve tracks the
  // live filter nodes' response, which is mutated imperatively by onChange
  // rather than through a dependency React's memoization could observe.
  const computeCurvePath = () => {
    const mags = getFrequencyResponse(SAMPLE_FREQS);
    if (!mags) return null;
    let path = '';
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const db = 20 * Math.log10(Math.max(mags[i], 1e-6));
      const x = freqToX(SAMPLE_FREQS[i]);
      const y = dbToY(db);
      path += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return path;
  };
  const curvePath = computeCurvePath();

  const bands: EqBand[] = ['low', 'mid', 'high'];

  return (
    <div className="select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={VIEW_W}
        height={VIEW_H}
        className="block touch-none"
      >
        {/* dB gridlines */}
        {GRID_DB.map((db) => (
          <g key={`db-${db}`}>
            <line
              x1={PADDING.left}
              x2={VIEW_W - PADDING.right}
              y1={dbToY(db)}
              y2={dbToY(db)}
              stroke={db === 0 ? 'var(--c-border)' : 'var(--c-border-half)'}
              strokeWidth={db === 0 ? 1 : 0.5}
            />
            <text
              x={PADDING.left - 4}
              y={dbToY(db) + 3}
              textAnchor="end"
              fontSize={8}
              fill="var(--c-text-muted)"
            >
              {db > 0 ? `+${db}` : db}
            </text>
          </g>
        ))}

        {/* frequency gridlines */}
        {GRID_FREQS.map((f) => (
          <g key={`f-${f}`}>
            <line
              x1={freqToX(f)}
              x2={freqToX(f)}
              y1={PADDING.top}
              y2={VIEW_H - PADDING.bottom}
              stroke="var(--c-border-half)"
              strokeWidth={0.5}
            />
            {LABELED_FREQS.has(f) && (
              <text
                x={freqToX(f)}
                y={VIEW_H - 6}
                textAnchor="middle"
                fontSize={8}
                fill="var(--c-text-muted)"
              >
                {f >= 1000 ? `${f / 1000}k` : f}
              </text>
            )}
          </g>
        ))}

        {/* filled area under curve for visual weight */}
        {curvePath && (
          <path
            d={`${curvePath} L ${VIEW_W - PADDING.right} ${dbToY(0)} L ${PADDING.left} ${dbToY(0)} Z`}
            fill="var(--c-accent)"
            opacity={0.12}
          />
        )}

        {/* response curve */}
        {curvePath && (
          <path d={curvePath} fill="none" stroke="var(--c-accent)" strokeWidth={1.5} />
        )}

        {/* draggable band handles */}
        {bands.map((band) => {
          const cx = freqToX(eq[band].freq);
          const cy = dbToY(eq[band].gain);
          return (
            <g key={band}>
              <line x1={cx} x2={cx} y1={cy} y2={dbToY(0)} stroke={BAND_COLOR[band]} strokeWidth={0.5} opacity={0.5} />
              <circle
                cx={cx}
                cy={cy}
                r={6}
                fill={BAND_COLOR[band]}
                stroke="var(--c-surface)"
                strokeWidth={1.5}
                cursor="grab"
                onPointerDown={handlePointerDown(band)}
                onPointerMove={handlePointerMove(band)}
                onPointerUp={handlePointerUp}
              />
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-center gap-4 mt-1">
        {bands.map((band) => (
          <div key={band} className="flex items-center gap-1 text-[10px] text-[var(--c-text-muted)]">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: BAND_COLOR[band] }} />
            <span>{BAND_LABEL[band]}</span>
            <span className="font-mono">
              {eq[band].freq >= 1000 ? `${(eq[band].freq / 1000).toFixed(1)}k` : eq[band].freq}Hz
              {' '}
              {eq[band].gain > 0 ? '+' : ''}{eq[band].gain}dB
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
