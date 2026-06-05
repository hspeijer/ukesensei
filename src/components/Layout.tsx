import type { ReactNode } from 'react';
import type { AppView, TuningKey, Theme } from '../store/useAppStore';
import { TUNINGS } from '../theory/fretboard';

interface LayoutProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  tuningKey: TuningKey;
  onTuningChange: (key: TuningKey) => void;
  tuningAutoDetected: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  children: ReactNode;
}

export function Layout({
  view,
  onViewChange,
  tuningKey,
  onTuningChange,
  tuningAutoDetected,
  theme,
  onToggleTheme,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--c-border-subtle)] px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎸</span>
            <h1 className="text-lg font-bold text-[var(--c-text-strong)] tracking-tight">
              Uke Sensei
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Tuning selector */}
            <div className="flex items-center gap-2">
              <select
                value={tuningKey}
                onChange={(e) => onTuningChange(e.target.value as TuningKey)}
                aria-label="Tuning"
                className="bg-[var(--c-surface)] text-[var(--c-text-on-input)] border border-[var(--c-border)] rounded-lg px-2.5 py-1 text-xs"
              >
                {Object.entries(TUNINGS).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
              {tuningAutoDetected && (
                <span className="text-[10px] text-emerald-400 font-medium">auto</span>
              )}
            </div>

            <nav className="flex gap-1 bg-[var(--c-surface)] rounded-lg p-1">
              <NavButton
                active={view === 'freeplay'}
                onClick={() => onViewChange('freeplay')}
              >
                Free Play
              </NavButton>
              <NavButton
                active={view === 'exercises'}
                onClick={() => onViewChange('exercises')}
              >
                Exercises
              </NavButton>
              <NavButton
                active={view === 'library' || view === 'playback'}
                onClick={() => onViewChange('library')}
              >
                Library
              </NavButton>
            </nav>

            {/* Theme toggle */}
            <button
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] hover:bg-[var(--c-surface)] transition-all"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.061l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.061 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06L5.404 4.344a.75.75 0 10-1.06 1.06l1.06 1.061z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-6">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-1.5 rounded-md text-sm font-medium transition-all
        ${active
          ? 'bg-teal-600 text-white shadow-sm'
          : 'text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)]'
        }
      `}
    >
      {children}
    </button>
  );
}
