import { useState } from 'react';
import { CHROMATIC_NOTES, type NoteName, displayNote } from '../theory/notes';
import { SCALE_DEFINITIONS, SCALE_KEYS } from '../theory/scales';

interface ExerciseSelectorProps {
  selectedRoot: NoteName;
  selectedScale: string;
  onRootChange: (root: NoteName) => void;
  onScaleChange: (scale: string) => void;
  onStart: (bpm: number | null, loops: number) => void;
  showScale: boolean;
  onToggleScale: (show: boolean) => void;
}

export function ExerciseSelector({
  selectedRoot,
  selectedScale,
  onRootChange,
  onScaleChange,
  onStart,
  showScale,
  onToggleScale,
}: ExerciseSelectorProps) {
  const [useMetronome, setUseMetronome] = useState(true);
  const [bpm, setBpm] = useState(80);
  const [loops, setLoops] = useState(3);

  return (
    <div className="flex flex-col gap-4">
      {/* Key selector */}
      <div>
        <label className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2 block">
          Key
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CHROMATIC_NOTES.map((note) => (
            <button
              key={note}
              onClick={() => onRootChange(note)}
              className={`
                px-3 py-1.5 rounded text-sm font-medium transition-all
                ${selectedRoot === note
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface)] text-[var(--c-text-muted)] hover:bg-[var(--c-surface-hover)] hover:text-[var(--c-text-subtle)]'
                }
              `}
            >
              {displayNote(note)}
            </button>
          ))}
        </div>
      </div>

      {/* Scale/mode selector */}
      <div>
        <label className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2 block">
          Scale / Mode
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SCALE_KEYS.map((key) => {
            const def = SCALE_DEFINITIONS[key];
            return (
              <button
                key={key}
                onClick={() => onScaleChange(key)}
                className={`
                  px-3 py-2 rounded text-left transition-all
                  ${selectedScale === key
                    ? 'bg-teal-600/20 text-[var(--c-accent)] border border-teal-500/40'
                    : 'bg-[var(--c-surface)] text-[var(--c-text-muted)] hover:bg-[var(--c-surface-hover)] hover:text-[var(--c-text-subtle)] border border-transparent'
                  }
                `}
              >
                <div className="text-sm font-medium">{def.name}</div>
                <div className="text-xs opacity-60 mt-0.5">{def.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metronome / BPM config */}
      <div className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)]">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--c-text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={useMetronome}
              onChange={(e) => setUseMetronome(e.target.checked)}
              className="accent-teal-500"
            />
            Metronome &amp; timing evaluation
          </label>
        </div>
        {useMetronome && (
          <div className="flex items-center gap-3 mt-3">
            <span className="text-sm text-[var(--c-text-muted)]">Tempo</span>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-1.5 accent-teal-500"
              aria-label="Exercise tempo"
            />
            <span className="text-sm font-mono font-bold text-[var(--c-text)] w-[56px] text-right">
              {bpm} BPM
            </span>
          </div>
        )}
      </div>

      {/* Loops */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-[var(--c-text-muted)]">Loops</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setLoops(n)}
              className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                loops === n
                  ? 'bg-teal-600 text-white'
                  : 'bg-[var(--c-surface)] text-[var(--c-text-muted)] hover:text-[var(--c-text-subtle)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--c-text-muted)]">
          {loops === 1 ? 'up & down once' : `${loops} times up & down`}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <label className="flex items-center gap-2 text-sm text-[var(--c-text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={showScale}
            onChange={(e) => onToggleScale(e.target.checked)}
            className="accent-teal-500"
          />
          Show scale on fretboard
        </label>
      </div>

      <button
        onClick={() => onStart(useMetronome ? bpm : null, loops)}
        className="mt-2 px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg
          font-semibold text-sm transition-all shadow-lg shadow-teal-500/20"
      >
        Start Exercise
      </button>
    </div>
  );
}
