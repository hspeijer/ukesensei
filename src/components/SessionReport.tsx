import { useMemo } from 'react';
import type { SessionResult } from '../exercises/useSession';
import { analyzeSession, type SessionAnalysisResult } from '../exercises/sessionAnalysis';
import { displayNote } from '../theory/notes';
import { SCALE_DEFINITIONS } from '../theory/scales';

interface SessionReportProps {
  session: SessionResult;
  onPlayAgain: () => void;
  onNextExercise: () => void;
  onBackToExercises: () => void;
}

export function SessionReport({
  session,
  onPlayAgain,
  onNextExercise,
  onBackToExercises,
}: SessionReportProps) {
  const analysis = useMemo(() => analyzeSession(session), [session]);
  const scaleDef = SCALE_DEFINITIONS[session.scaleKey];

  return (
    <div className="bg-[var(--c-surface)] rounded-xl p-6 border border-[var(--c-border)] max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{analysis.rating.emoji}</div>
        <h2 className="text-xl font-bold text-[var(--c-text-strong)]">{analysis.rating.title}</h2>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">
          {displayNote(session.root)} {scaleDef?.name} at {session.bpm} BPM
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <StatCard
          label="Pitch"
          value={`${analysis.pitchAccuracy}%`}
          color={analysis.pitchAccuracy >= 80 ? '#34d399' : analysis.pitchAccuracy >= 50 ? '#fbbf24' : '#f87171'}
        />
        <StatCard
          label="On Time"
          value={`${analysis.timing.onTimePercent}%`}
          color={analysis.timing.onTimePercent >= 75 ? '#34d399' : analysis.timing.onTimePercent >= 50 ? '#fbbf24' : '#f87171'}
        />
        <StatCard
          label="Avg Offset"
          value={`${analysis.timing.absAvgBeatOffsetMs}ms`}
          color={analysis.timing.absAvgBeatOffsetMs <= 50 ? '#34d399' : analysis.timing.absAvgBeatOffsetMs <= 100 ? '#fbbf24' : '#f87171'}
        />
        <StatCard
          label="Consistency"
          value={`${analysis.timing.timingConsistency}%`}
          color={analysis.timing.timingConsistency >= 70 ? '#34d399' : analysis.timing.timingConsistency >= 40 ? '#fbbf24' : '#f87171'}
        />
      </div>

      {/* Timing info bar */}
      <div className="flex items-center justify-between text-xs text-[var(--c-text-muted)] mb-4 px-1">
        <span>{analysis.correctNotes}/{analysis.totalNotes} notes correct</span>
        <span>{analysis.avgCents}&#162; avg deviation</span>
        <span>{analysis.durationSec}s total</span>
        <TempoTrendBadge trend={analysis.timing.tempoTrend} />
      </div>

      {/* Beat offset timeline */}
      {session.notes.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2">
            Timing Timeline
          </div>
          <TimingTimeline notes={session.notes.map((n) => ({ offset: n.beatOffset, correct: n.wasCorrect }))} />
        </div>
      )}

      {/* Note breakdown */}
      {analysis.noteBreakdowns.length > 0 && (
        <div className="mb-5">
          <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2">
            Per-Note Breakdown
          </div>
          <div className="grid grid-cols-1 gap-1">
            {analysis.noteBreakdowns.map((nb) => (
              <div
                key={nb.note}
                className="flex items-center gap-3 bg-[var(--c-bg)] rounded px-3 py-1.5 text-xs"
              >
                <span className="font-bold text-[var(--c-text)] w-[28px]">{displayNote(nb.note)}</span>
                <span className="text-[var(--c-text-muted)] w-[20px] text-right">{nb.count}x</span>
                <div className="flex-1 flex items-center gap-2">
                  <MiniBar value={nb.correctPercent} color={nb.correctPercent >= 80 ? '#34d399' : nb.correctPercent >= 50 ? '#fbbf24' : '#f87171'} />
                  <span className="text-[var(--c-text-muted)] w-[36px] text-right">{nb.correctPercent}%</span>
                </div>
                <span className="text-[var(--c-text-muted)] w-[48px] text-right">
                  {nb.avgBeatOffset > 0 ? '+' : ''}{nb.avgBeatOffset}ms
                </span>
                <span className="text-[var(--c-text-muted)] w-[36px] text-right">
                  {nb.avgCents > 0 ? '+' : ''}{nb.avgCents}&#162;
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div className="bg-[var(--c-bg)] rounded-lg p-3 mb-5">
        <div className="text-xs text-[var(--c-accent)] font-semibold uppercase tracking-wider mb-1">
          Suggestions
        </div>
        <ul className="space-y-1.5">
          {analysis.suggestions.map((s, i) => (
            <li key={i} className="text-sm text-[var(--c-text-subtle)]">{s}</li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onPlayAgain}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
        >
          Play Again
        </button>
        <button
          onClick={onNextExercise}
          className="px-4 py-2.5 bg-[var(--c-bg)] hover:bg-[var(--c-surface-hover)] text-[var(--c-accent)] rounded-lg font-medium text-sm transition-all border border-[var(--c-border)]"
        >
          Next Scale
        </button>
        <button
          onClick={onBackToExercises}
          className="px-4 py-2 text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] text-sm transition-all"
        >
          Back to exercises
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--c-bg)] rounded-lg p-2.5 text-center">
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TempoTrendBadge({ trend }: { trend: string }) {
  const labels: Record<string, string> = {
    steady: 'Steady tempo',
    speeding_up: 'Rushing',
    slowing_down: 'Dragging',
  };
  const colors: Record<string, string> = {
    steady: 'text-emerald-400',
    speeding_up: 'text-amber-400',
    slowing_down: 'text-amber-400',
  };
  return (
    <span className={`${colors[trend] ?? 'text-[var(--c-text-muted)]'}`}>
      {labels[trend] ?? trend}
    </span>
  );
}

function TimingTimeline({ notes }: { notes: { offset: number; correct: boolean }[] }) {
  const maxOffset = 150;

  return (
    <div className="flex items-end gap-[2px] h-[40px] bg-[var(--c-bg)] rounded-lg p-2 overflow-hidden">
      {/* Center line */}
      <div className="absolute left-0 right-0" style={{ top: '50%' }}>
        <div className="h-px bg-[var(--c-border)]" />
      </div>
      {notes.map((n, i) => {
        const clamped = Math.max(-maxOffset, Math.min(maxOffset, n.offset));
        const normalized = (clamped + maxOffset) / (2 * maxOffset);
        const height = Math.max(2, Math.abs(clamped) / maxOffset * 16);
        const isLate = clamped > 0;
        const color = n.correct
          ? Math.abs(clamped) <= 80 ? '#34d399' : '#fbbf24'
          : '#f87171';

        return (
          <div
            key={i}
            className="flex-1 flex flex-col justify-center items-center min-w-[2px] max-w-[6px]"
            style={{ height: '100%' }}
          >
            <div
              className="rounded-sm"
              style={{
                width: '100%',
                maxWidth: '4px',
                height: `${height}px`,
                backgroundColor: color,
                marginTop: isLate ? '0' : 'auto',
                marginBottom: isLate ? 'auto' : '0',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex-1 h-1.5 bg-[var(--c-border)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}
