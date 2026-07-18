import { getDb } from './schema.js';
import type {
  SessionRow,
  SessionSummary,
  SessionDetail,
  SessionMetadata,
  DashboardStats,
} from '../types.js';

function rowToSummary(row: SessionRow): SessionSummary {
  return {
    id: row.id,
    createdAt: row.created_at,
    scaleKey: row.scale_key,
    root: row.root,
    bpm: row.bpm,
    tuningKey: row.tuning_key,
    durationSec: row.duration_sec,
    pitchAccuracy: row.pitch_accuracy,
    timingOnTimePercent: row.timing_on_time_percent,
    overallScore: row.overall_score,
    analysisStatus: row.analysis_status,
    hasAudio: !!row.has_audio,
  };
}

function rowToDetail(row: SessionRow): SessionDetail {
  return {
    ...rowToSummary(row),
    notes: JSON.parse(row.notes_json),
    chords: row.chords_json ? JSON.parse(row.chords_json) : null,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

export function createSession(
  id: string,
  meta: SessionMetadata,
  hasAudio: boolean,
) {
  const db = getDb();
  const durationSec = (meta.endedAt - meta.startedAt) / 1000;

  db.prepare(`
    INSERT INTO sessions (id, scale_key, root, bpm, tuning_key, started_at, ended_at,
      duration_sec, pitch_accuracy, timing_on_time_percent, overall_score, notes_json, chords_json, has_audio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    meta.scaleKey,
    meta.root,
    meta.bpm,
    meta.tuningKey,
    meta.startedAt,
    meta.endedAt,
    durationSec,
    meta.pitchAccuracy,
    meta.timingOnTimePercent,
    meta.overallScore,
    JSON.stringify(meta.notes),
    meta.chords ? JSON.stringify(meta.chords) : null,
    hasAudio ? 1 : 0,
  );
}

export function listSessions(limit = 50, offset = 0): SessionSummary[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM sessions ORDER BY created_at DESC LIMIT ? OFFSET ?')
    .all(limit, offset) as SessionRow[];
  return rows.map(rowToSummary);
}

export function getSession(id: string): SessionDetail | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(id) as SessionRow | undefined;
  return row ? rowToDetail(row) : null;
}

export function updateAnalysisStatus(id: string, status: string) {
  const db = getDb();
  db.prepare('UPDATE sessions SET analysis_status = ? WHERE id = ?').run(status, id);
}

export function deleteSession(id: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getStats(): DashboardStats {
  const db = getDb();

  const totals = db.prepare(`
    SELECT
      COUNT(*) as total,
      COALESCE(SUM(duration_sec), 0) as totalTime,
      COALESCE(AVG(pitch_accuracy), 0) as avgPitch,
      COALESCE(AVG(timing_on_time_percent), 0) as avgTiming,
      COALESCE(AVG(overall_score), 0) as avgScore
    FROM sessions
  `).get() as { total: number; totalTime: number; avgPitch: number; avgTiming: number; avgScore: number };

  // Current streak: consecutive days with at least one session
  const days = db.prepare(`
    SELECT DISTINCT date(created_at) as day
    FROM sessions
    ORDER BY day DESC
  `).all() as { day: string }[];

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < days.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().split('T')[0];
    if (days[i].day === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  // Sessions per day (last 30 days)
  const sessionsPerDay = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM sessions
    WHERE created_at >= datetime('now', '-30 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all() as { date: string; count: number }[];

  // Accuracy over time (last 30 sessions)
  const accuracyRows = db.prepare(`
    SELECT date(created_at) as date,
      AVG(pitch_accuracy) as pitch,
      AVG(timing_on_time_percent) as timing
    FROM sessions
    GROUP BY date(created_at)
    ORDER BY date ASC
    LIMIT 30
  `).all() as { date: string; pitch: number; timing: number }[];

  return {
    totalSessions: totals.total,
    totalPracticeTimeSec: Math.round(totals.totalTime),
    currentStreak: streak,
    avgPitchAccuracy: Math.round(totals.avgPitch),
    avgTimingAccuracy: Math.round(totals.avgTiming),
    avgOverallScore: Math.round(totals.avgScore),
    sessionsPerDay,
    accuracyOverTime: accuracyRows,
  };
}
