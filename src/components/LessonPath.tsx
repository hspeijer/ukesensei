import type { Curriculum } from '../lessons/curriculum';
import type { Lesson, LessonCategory } from '../lessons/types';

interface LessonPathProps {
  curriculum: Curriculum;
  completedLessons: string[];
  onSelectLesson: (id: string) => void;
  onReset: () => void;
}

const CATEGORY_LABELS: Record<LessonCategory, string> = {
  theory: 'Theory',
  technique: 'Technique',
  practice: 'Practice',
};

export function LessonPath({ curriculum, completedLessons, onSelectLesson, onReset }: LessonPathProps) {
  const { modules, lessons: allLessons, getLessonsForModule, getLessonIndex, isLessonUnlocked } = curriculum;
  const completedCount = completedLessons.filter((id) => getLessonIndex(id) >= 0).length;
  const total = allLessons.length;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-[var(--c-text-strong)]">{curriculum.title}</h1>
            <p className="text-sm text-[var(--c-text-muted)]">
              {curriculum.description}
            </p>
          </div>
          <span className="text-sm font-mono text-[var(--c-accent)] shrink-0">
            {completedCount}/{total}
          </span>
        </div>
        <div className="h-2 bg-[var(--c-surface)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      {modules.map((mod) => {
        const lessons = getLessonsForModule(mod.id);
        return (
          <div key={mod.id} className="space-y-2">
            <div>
              <h2 className="text-sm font-semibold text-[var(--c-text-strong)]">{mod.title}</h2>
              <p className="text-xs text-[var(--c-text-muted)]">{mod.description}</p>
            </div>
            <div className="space-y-1.5">
              {lessons.map((lesson) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  index={getLessonIndex(lesson.id)}
                  completed={completedLessons.includes(lesson.id)}
                  unlocked={isLessonUnlocked(lesson.id, completedLessons)}
                  onSelect={() => onSelectLesson(lesson.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Reset */}
      {completedCount > 0 && (
        <div className="pt-2 text-center">
          <button
            onClick={onReset}
            className="text-xs text-[var(--c-text-muted)] hover:text-red-400 transition"
          >
            Reset all progress
          </button>
        </div>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  index,
  completed,
  unlocked,
  onSelect,
}: {
  lesson: Lesson;
  index: number;
  completed: boolean;
  unlocked: boolean;
  onSelect: () => void;
}) {
  const idx = index;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
        unlocked
          ? 'bg-[var(--c-surface)] border-[var(--c-border)] hover:border-teal-500/50'
          : 'bg-[var(--c-surface)]/50 border-[var(--c-border-subtle)] opacity-70 hover:opacity-90 hover:border-[var(--c-border)]'
      }`}
    >
      {/* Status icon */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
          completed
            ? 'bg-emerald-500 text-white'
            : unlocked
              ? 'bg-teal-600/20 text-teal-400 border border-teal-500/40'
              : 'bg-[var(--c-bg)] text-[var(--c-text-muted)]'
        }`}
      >
        {completed ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : unlocked ? (
          idx + 1
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1a5 5 0 00-5 5v3H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V6a5 5 0 00-5-5zm3 8H9V6a3 3 0 016 0v3z" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--c-text-strong)] truncate">{lesson.title}</span>
          <span className="text-[9px] uppercase tracking-wider text-[var(--c-text-muted)] shrink-0">
            {CATEGORY_LABELS[lesson.category]}
          </span>
        </div>
        <p className="text-xs text-[var(--c-text-muted)] truncate">{lesson.summary}</p>
      </div>

      <svg className="shrink-0 text-[var(--c-text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
