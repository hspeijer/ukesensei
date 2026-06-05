interface AudioStatusProps {
  isListening: boolean;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
}

export function AudioStatus({ isListening, error, onStart, onStop }: AudioStatusProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isListening ? onStop : onStart}
        className={`
          px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
          ${isListening
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
          }
        `}
      >
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </button>

      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isListening ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
          }`}
        />
        <span className="text-xs text-[var(--c-text-muted)]">
          {isListening ? 'Listening...' : 'Mic off'}
        </span>
      </div>

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
}
