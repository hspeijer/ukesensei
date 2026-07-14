import { useEffect, useRef, useState } from 'react';
import type { EqBand, EqBands } from '../audio/useWasmAudio';
import { Equalizer } from './Equalizer';

interface AudioStatusProps {
  isListening: boolean;
  error: string | null;
  audioLevel: number;
  gain: number;
  eq: EqBands;
  onStart: () => void;
  onStop: () => void;
  onGainChange: (value: number) => void;
  onEqChange: (band: EqBand, patch: { freq?: number; gain?: number }) => void;
  getEqFrequencyResponse: (frequencies: Float32Array<ArrayBuffer>) => Float32Array<ArrayBuffer> | null;
}

export function AudioStatus({
  isListening,
  error,
  audioLevel,
  gain,
  eq,
  onStart,
  onStop,
  onGainChange,
  onEqChange,
  getEqFrequencyResponse,
}: AudioStatusProps) {
  const [eqOpen, setEqOpen] = useState(false);
  const eqPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!eqOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (eqPanelRef.current && !eqPanelRef.current.contains(e.target as Node)) {
        setEqOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [eqOpen]);

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3">
      <button
        onClick={isListening ? onStop : onStart}
        className={`
          px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 shrink-0
          ${isListening
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
          }
        `}
      >
        <span className="sm:hidden">{isListening ? 'Stop' : 'Start'}</span>
        <span className="hidden sm:inline">{isListening ? 'Stop Listening' : 'Start Listening'}</span>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <div
          className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
            isListening ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
          }`}
        />
        <span className="text-xs text-[var(--c-text-muted)] hidden sm:inline">
          {isListening ? 'Listening...' : 'Mic off'}
        </span>
      </div>

      {isListening && (
        <>
          <div className="w-12 sm:w-16 h-1.5 rounded-full bg-[var(--c-border)] overflow-hidden shrink-0">
            <div
              className="h-full bg-emerald-400 transition-[width] duration-75"
              style={{ width: `${Math.round(audioLevel * 100)}%` }}
            />
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-xs text-[var(--c-text-muted)] hidden sm:inline">Gain</span>
            <input
              type="range"
              min={0}
              max={3}
              step={0.05}
              value={gain}
              onChange={(e) => onGainChange(Number(e.target.value))}
              className="w-12 sm:w-16 accent-emerald-400"
            />
          </div>

          <div className="relative pl-1.5 sm:pl-2 border-l border-[var(--c-border)]" ref={eqPanelRef}>
            <button
              onClick={() => setEqOpen((v) => !v)}
              className={`
                text-xs px-2 py-1 rounded-md font-medium transition-colors
                ${eqOpen
                  ? 'bg-[var(--c-accent)] text-[var(--c-surface)]'
                  : 'text-[var(--c-text-muted)] hover:bg-[var(--c-surface-hover)]'
                }
              `}
              title="Equalizer"
            >
              EQ
            </button>

            {eqOpen && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 p-2 sm:p-3 rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] shadow-lg z-20 max-w-[calc(100vw-2rem)]">
                <Equalizer
                  eq={eq}
                  onChange={onEqChange}
                  getFrequencyResponse={getEqFrequencyResponse}
                />
              </div>
            )}
          </div>
        </>
      )}

      {error && (
        <span className="text-xs text-red-400 w-full sm:w-auto text-center sm:text-left">{error}</span>
      )}
    </div>
  );
}
