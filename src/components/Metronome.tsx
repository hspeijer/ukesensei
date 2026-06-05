interface MetronomeProps {
  bpm: number;
  beatsPerMeasure: number;
  isPlaying: boolean;
  currentBeat: number;
  onBpmChange: (bpm: number) => void;
  onBeatsChange: (beats: number) => void;
  onStart: () => void;
  onStop: () => void;
  onTap: () => void;
  compact?: boolean;
}

const TIME_SIGNATURES = [
  { label: '4/4', beats: 4 },
  { label: '3/4', beats: 3 },
  { label: '6/8', beats: 6 },
  { label: '2/4', beats: 2 },
];

export function Metronome({
  bpm,
  beatsPerMeasure,
  isPlaying,
  currentBeat,
  onBpmChange,
  onBeatsChange,
  onStart,
  onStop,
  onTap,
  compact = false,
}: MetronomeProps) {
  return (
    <div className={`flex items-center gap-3 ${compact ? 'gap-2' : 'gap-3'}`}>
      {/* Play/Stop */}
      <button
        onClick={isPlaying ? onStop : onStart}
        className={`
          w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0
          ${isPlaying
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-teal-500/20 text-teal-400 hover:bg-teal-500/30'
          }
        `}
        title={isPlaying ? 'Stop metronome' : 'Start metronome'}
      >
        {isPlaying ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="4" height="10" rx="1" />
            <rect x="7" y="1" width="4" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <polygon points="2,0 12,6 2,12" />
          </svg>
        )}
      </button>

      {/* Beat dots */}
      <div className="flex items-center gap-1">
        {Array.from({ length: beatsPerMeasure }, (_, i) => (
          <div
            key={i}
            className={`
              rounded-full transition-all duration-75
              ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}
              ${isPlaying && currentBeat === i
                ? i === 0
                  ? 'bg-amber-400 scale-125'
                  : 'bg-teal-400 scale-110'
                : 'bg-[var(--c-border)]'
              }
            `}
          />
        ))}
      </div>

      {/* BPM display + slider */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono font-bold text-[var(--c-text)] w-[44px] text-right">
          {bpm}
        </span>
        <span className="text-[10px] text-[var(--c-text-muted)]">BPM</span>
        {!compact && (
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => onBpmChange(parseInt(e.target.value))}
            className="w-20 h-1.5 accent-teal-500"
            aria-label="Tempo"
          />
        )}
      </div>

      {/* Tap tempo */}
      <button
        onClick={onTap}
        className="text-[10px] px-2 py-1 rounded bg-[var(--c-surface)] border border-[var(--c-border)]
          text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition uppercase tracking-wider font-medium"
        title="Tap to set tempo"
      >
        Tap
      </button>

      {/* Time signature (not in compact) */}
      {!compact && (
        <select
          value={beatsPerMeasure}
          onChange={(e) => onBeatsChange(parseInt(e.target.value))}
          aria-label="Time signature"
          className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded px-1.5 py-0.5 text-xs"
        >
          {TIME_SIGNATURES.map((ts) => (
            <option key={ts.beats} value={ts.beats}>{ts.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
