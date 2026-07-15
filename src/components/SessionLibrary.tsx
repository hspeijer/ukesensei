import { useEffect, useState, useCallback } from 'react';
import {
  getSessions,
  getStats,
  deleteSession as apiDeleteSession,
  downloadSessionAudio,
  type SessionSummary,
  type DashboardStats,
} from '../api/sessionApi';
import { SCALE_DEFINITIONS } from '../theory/scales';

interface SessionLibraryProps {
  onSelectSession: (id: string) => void;
}

export function SessionLibrary({ onSelectSession }: SessionLibraryProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [sessResult, statsResult] = await Promise.all([
        getSessions(),
        getStats(),
      ]);
      setSessions(sessResult.sessions);
      setStats(statsResult);
    } catch (err) {
      setError('Could not connect to server. Make sure the backend is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiDeleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-[var(--c-text-muted)]">
        Loading sessions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-amber-400 mb-3">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-[var(--c-surface)] rounded-lg text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition border border-[var(--c-border)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats dashboard */}
      {stats && <StatsDashboard stats={stats} />}

      {/* Session list */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--c-text-muted)] uppercase tracking-wider mb-3">
          Practice Sessions
        </h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-[var(--c-text-muted)] bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)]">
            <p className="text-lg mb-1">No sessions yet</p>
            <p className="text-sm">Complete an exercise or record a song in Free Play.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onClick={() => onSelectSession(s.id)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsDashboard({ stats }: { stats: DashboardStats }) {
  const practiceMin = Math.round(stats.totalPracticeTimeSec / 60);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat label="Sessions" value={String(stats.totalSessions)} />
        <MiniStat label="Practice Time" value={practiceMin > 60 ? `${Math.round(practiceMin / 60)}h` : `${practiceMin}m`} />
        <MiniStat label="Streak" value={`${stats.currentStreak}d`} />
        <MiniStat label="Avg Score" value={`${stats.avgOverallScore}%`} />
      </div>

      {/* Charts */}
      {stats.accuracyOverTime.length > 1 && (
        <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)]">
          <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-3">
            Accuracy Over Time
          </div>
          <AccuracyChart data={stats.accuracyOverTime} />
        </div>
      )}

      {stats.sessionsPerDay.length > 1 && (
        <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)]">
          <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-3">
            Practice Frequency
          </div>
          <FrequencyChart data={stats.sessionsPerDay} />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--c-surface)] rounded-lg p-3 text-center border border-[var(--c-border)]">
      <div className="text-lg font-bold text-[var(--c-text-strong)]">{value}</div>
      <div className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function AccuracyChart({ data }: { data: { date: string; pitch: number; timing: number }[] }) {
  const w = 480;
  const h = 100;
  const maxVal = 100;

  const toPath = (values: number[], color: string) => {
    const step = w / Math.max(values.length - 1, 1);
    const d = values.map((v, i) => {
      const x = i * step;
      const y = h - (v / maxVal) * h;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(' ');
    return <path d={d} fill="none" stroke={color} strokeWidth={2} opacity={0.8} />;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[100px]">
      {toPath(data.map((d) => d.pitch), '#34d399')}
      {toPath(data.map((d) => d.timing), '#38bdf8')}
      <text x={w - 60} y={14} fontSize={10} fill="#34d399">Pitch</text>
      <text x={w - 60} y={26} fontSize={10} fill="#38bdf8">Timing</text>
    </svg>
  );
}

function FrequencyChart({ data }: { data: { date: string; count: number }[] }) {
  const w = 480;
  const h = 60;
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barWidth = Math.max(4, Math.min(20, w / data.length - 2));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]">
      {data.map((d, i) => {
        const barH = (d.count / maxCount) * (h - 4);
        const x = (i / data.length) * w;
        return (
          <rect
            key={d.date}
            x={x}
            y={h - barH}
            width={barWidth}
            height={barH}
            fill="var(--c-accent)"
            opacity={0.6}
            rx={2}
          />
        );
      })}
    </svg>
  );
}

function SessionCard({
  session,
  onClick,
  onDelete,
}: {
  session: SessionSummary;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const scaleDef = SCALE_DEFINITIONS[session.scaleKey];
  const date = new Date(session.createdAt);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadSessionAudio(session);
    } catch {
      /* silently ignore — recording may no longer be available */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="bg-[var(--c-surface)] rounded-lg p-3 border border-[var(--c-border)] flex items-center gap-3 cursor-pointer
        hover:border-teal-500/40 transition group"
      onClick={onClick}
    >
      {/* Score circle */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{
          backgroundColor: session.overallScore >= 60 ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
          color: session.overallScore >= 60 ? '#34d399' : '#fbbf24',
        }}
      >
        {session.overallScore}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--c-text-strong)] truncate">
          {session.scaleKey === 'melody' ? 'Song recording' : `${session.root} ${scaleDef?.name ?? session.scaleKey}`}
        </div>
        <div className="text-xs text-[var(--c-text-muted)]">
          {dateStr} {timeStr} &middot; {session.bpm} BPM &middot; {Math.round(session.durationSec)}s
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-[var(--c-text-muted)]">
        <span title="Pitch accuracy">
          <span className="text-emerald-400">{session.pitchAccuracy}%</span> pitch
        </span>
        <span title="Timing accuracy">
          <span className="text-sky-400">{session.timingOnTimePercent}%</span> timing
        </span>
        {session.hasAudio && (
          <span className="text-teal-400" title="Has audio recording">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </span>
        )}
      </div>

      {/* Download */}
      {session.hasAudio && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="opacity-0 group-hover:opacity-100 text-[var(--c-text-muted)] hover:text-teal-400 transition p-1 disabled:opacity-50"
          title="Download recording"
        >
          {downloading ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
              <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
          )}
        </button>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-[var(--c-text-muted)] hover:text-red-400 transition p-1"
        title="Delete session"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}
