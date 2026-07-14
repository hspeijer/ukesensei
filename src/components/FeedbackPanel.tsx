import type { ExerciseState } from '../store/useAppStore';
import { displayNote } from '../theory/notes';
import { SCALE_DEFINITIONS, SCALE_KEYS } from '../theory/scales';
import { SessionReport } from './SessionReport';
import type { SessionResult } from '../exercises/useSession';

export interface CheckpointGate {
  passed: boolean;
  accuracy: number;
  requiredAccuracy: number;
  isLastLesson: boolean;
  onContinue: () => void;
  onRetry: () => void;
  onExit: () => void;
}

interface FeedbackPanelProps {
  exercise: ExerciseState;
  onPlayAgain: () => void;
  onNextExercise: () => void;
  onBackToExercises: () => void;
  sessionResult?: SessionResult | null;
  checkpoint?: CheckpointGate | null;
  /** True when the exercise belongs to a lesson (practice drill). Hides the
   * "next scale" action and routes "back" to the lesson. */
  lessonContext?: boolean;
}

export function FeedbackPanel({
  exercise,
  onPlayAgain,
  onNextExercise,
  onBackToExercises,
  sessionResult,
  checkpoint,
  lessonContext,
}: FeedbackPanelProps) {
  // Lesson checkpoint gate takes precedence: this is the "you can't pass until
  // you complete the exercise" screen.
  if (checkpoint) {
    return <CheckpointPanel exercise={exercise} gate={checkpoint} />;
  }
  if (sessionResult && sessionResult.notes.length > 0) {
    return (
      <SessionReport
        session={sessionResult}
        onPlayAgain={onPlayAgain}
        onNextExercise={onNextExercise}
        onBackToExercises={onBackToExercises}
        lessonContext={lessonContext}
      />
    );
  }
  const scaleDef = SCALE_DEFINITIONS[exercise.scaleKey];
  const totalNotes = exercise.targetPositions.length;
  const correctCount = exercise.notesPlayed.filter((n) => n.correct).length;
  const accuracy = totalNotes > 0 ? Math.round((correctCount / totalNotes) * 100) : 0;

  const avgCents =
    exercise.notesPlayed.length > 0
      ? Math.round(
          exercise.notesPlayed.reduce((sum, n) => sum + Math.abs(n.cents), 0) /
            exercise.notesPlayed.length,
        )
      : 0;

  const totalTimeMs = exercise.startedAt
    ? Date.now() - exercise.startedAt
    : 0;
  const totalTimeSec = Math.round(totalTimeMs / 1000);

  const rating = getPerformanceRating(accuracy, avgCents);
  const suggestion = getSuggestion(accuracy, avgCents, exercise.scaleKey);

  return (
    <div className="bg-[var(--c-surface)] rounded-xl p-6 border border-[var(--c-border)] max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">{rating.emoji}</div>
        <h2 className="text-xl font-bold text-[var(--c-text-strong)]">{rating.title}</h2>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">
          {exercise.title ?? `${displayNote(exercise.root)} ${scaleDef?.name ?? ''}`}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Accuracy" value={`${accuracy}%`} color={accuracy >= 80 ? '#34d399' : accuracy >= 50 ? '#fbbf24' : '#f87171'} />
        <StatCard label="Avg Cents" value={`${avgCents}¢`} color={avgCents <= 10 ? '#34d399' : avgCents <= 25 ? '#fbbf24' : '#f87171'} />
        <StatCard label="Time" value={`${totalTimeSec}s`} color="var(--c-accent)" />
      </div>

      {/* Suggestion */}
      <div className="bg-[var(--c-bg)] rounded-lg p-3 mb-6">
        <div className="text-xs text-[var(--c-accent)] font-semibold uppercase tracking-wider mb-1">
          Suggestion
        </div>
        <p className="text-sm text-[var(--c-text-subtle)]">{suggestion}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={onPlayAgain}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
        >
          {lessonContext ? 'Practice Again' : 'Play Again'}
        </button>
        {!lessonContext && (
          <button
            onClick={onNextExercise}
            className="px-4 py-2.5 bg-[var(--c-bg)] hover:bg-[var(--c-surface-hover)] text-[var(--c-accent)] rounded-lg font-medium text-sm transition-all border border-[var(--c-border)]"
          >
            Next Scale
          </button>
        )}
        <button
          onClick={onBackToExercises}
          className="px-4 py-2 text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] text-sm transition-all"
        >
          {lessonContext ? 'Back to lesson' : 'Back to exercises'}
        </button>
      </div>
    </div>
  );
}

function CheckpointPanel({ exercise, gate }: { exercise: ExerciseState; gate: CheckpointGate }) {
  const { passed, accuracy, requiredAccuracy, isLastLesson, onContinue, onRetry, onExit } = gate;
  const pct = Math.round(accuracy * 100);
  const reqPct = Math.round(requiredAccuracy * 100);

  return (
    <div className="bg-[var(--c-surface)] rounded-xl p-6 border border-[var(--c-border)] max-w-md mx-auto">
      <div className="text-center mb-5">
        <div
          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-3 ${
            passed ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}
        >
          {passed ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-[var(--c-text-strong)]">
          {passed ? 'Checkpoint Passed!' : 'Not Quite Yet'}
        </h2>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">{exercise.title}</p>
      </div>

      {/* Accuracy vs requirement */}
      <div className="bg-[var(--c-bg)] rounded-lg p-4 mb-5">
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs text-[var(--c-text-muted)] uppercase tracking-wider">Your accuracy</span>
          <span className="text-2xl font-bold" style={{ color: passed ? '#34d399' : '#fbbf24' }}>
            {pct}%
          </span>
        </div>
        <div className="relative h-2 bg-[var(--c-surface)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: passed ? '#34d399' : '#fbbf24' }}
          />
          {/* Required threshold marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--c-text-strong)]"
            style={{ left: `${reqPct}%` }}
          />
        </div>
        <p className="text-xs text-[var(--c-text-muted)] mt-2">
          {passed
            ? `You beat the ${reqPct}% target. The next lesson is unlocked.`
            : `You need ${reqPct}% to pass. Keep practicing this one — you've got it.`}
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {passed ? (
          <button
            onClick={onContinue}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
          >
            {isLastLesson ? 'Finish Course' : 'Continue to Next Lesson'}
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium text-sm transition-all"
          >
            Try Again
          </button>
        )}
        <button
          onClick={onExit}
          className="px-4 py-2 text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] text-sm transition-all"
        >
          Back to lesson path
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--c-bg)] rounded-lg p-3 text-center">
      <div className="text-lg font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs text-[var(--c-text-muted)]">{label}</div>
    </div>
  );
}

function getPerformanceRating(accuracy: number, avgCents: number) {
  if (accuracy >= 90 && avgCents <= 10) return { emoji: '🌟', title: 'Outstanding!' };
  if (accuracy >= 80 && avgCents <= 20) return { emoji: '🎉', title: 'Great Job!' };
  if (accuracy >= 60) return { emoji: '👍', title: 'Good Progress' };
  return { emoji: '💪', title: 'Keep Practicing' };
}

function getSuggestion(accuracy: number, avgCents: number, scaleKey: string): string {
  if (accuracy >= 90 && avgCents <= 10) {
    const currentIdx = SCALE_KEYS.indexOf(scaleKey);
    const nextScale = SCALE_KEYS[(currentIdx + 1) % SCALE_KEYS.length];
    const nextDef = SCALE_DEFINITIONS[nextScale];
    return `Excellent work! Try the ${nextDef.name} scale next, or practice this one descending for a new challenge.`;
  }
  if (accuracy >= 80 && avgCents > 15) {
    return 'Your note accuracy is great! Focus on tuning -- try playing each note more slowly and listen for the center of the pitch.';
  }
  if (accuracy >= 60) {
    return 'You\'re getting the notes right. Practice slowly, making sure each note rings clearly before moving to the next.';
  }
  return 'Take it slow! Try playing just the first 4 notes of the scale until they feel natural, then add more.';
}
