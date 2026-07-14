import { getSupabase } from '../lib/supabase';
import {
  deleteCloudSession,
  getCloudAudioUrl,
  getCloudSession,
  isCloudSessionId,
  listCloudSessions,
  saveCloudSession,
} from '../storage/cloudSessionStore';
import {
  deleteLocalSession,
  getLocalAudioBlob,
  getLocalSession,
  isLocalSessionId,
  listLocalSessions,
  saveLocalSession,
} from '../storage/localSessionStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export interface SessionSummary {
  id: string;
  createdAt: string;
  scaleKey: string;
  root: string;
  bpm: number;
  tuningKey: string;
  durationSec: number;
  pitchAccuracy: number;
  timingOnTimePercent: number;
  overallScore: number;
  analysisStatus: string;
  hasAudio: boolean;
}

export interface SessionDetail extends SessionSummary {
  notes: SessionNoteData[];
  startedAt: number;
  endedAt: number;
}

export interface SessionNoteData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
  timestamp: number;
  beatOffset: number;
  expectedNote: string | null;
  wasCorrect: boolean;
}

export interface StringAnalysisFrame {
  time: number;
  strings: [number, number, number, number];
  rms: number;
}

export interface AnalysisResult {
  sessionId: string;
  sampleRate: number;
  hopSize: number;
  frameCount: number;
  durationSec: number;
  tuningKey: string;
  frames: StringAnalysisFrame[];
}

export interface DashboardStats {
  totalSessions: number;
  totalPracticeTimeSec: number;
  currentStreak: number;
  avgPitchAccuracy: number;
  avgTimingAccuracy: number;
  avgOverallScore: number;
  sessionsPerDay: { date: string; count: number }[];
  accuracyOverTime: { date: string; pitch: number; timing: number }[];
}

export interface UploadMetadata {
  scaleKey: string;
  root: string;
  bpm: number;
  tuningKey: string;
  startedAt: number;
  endedAt: number;
  pitchAccuracy: number;
  timingOnTimePercent: number;
  overallScore: number;
  notes: SessionNoteData[];
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function legacyApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/sessions?limit=1`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadSession(
  audioBlob: Blob | null,
  metadata: UploadMetadata,
): Promise<{ id: string; local: boolean }> {
  const userId = await getCurrentUserId();
  if (userId) {
    const id = await saveCloudSession(userId, metadata, audioBlob);
    return { id, local: false };
  }

  if (await legacyApiAvailable()) {
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    if (audioBlob && audioBlob.size > 0) {
      form.append('audio', audioBlob, 'recording.webm');
    }

    const res = await fetch(`${API_BASE}/sessions`, { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      return { id: data.id, local: false };
    }
  }

  const id = await saveLocalSession(metadata, audioBlob);
  return { id, local: true };
}

export async function getSessions(limit = 50, offset = 0): Promise<{ sessions: SessionSummary[] }> {
  const userId = await getCurrentUserId();
  const local = userId ? [] : await listLocalSessions();

  if (userId) {
    const cloud = await listCloudSessions(userId);
    return { sessions: cloud.slice(offset, offset + limit) };
  }

  try {
    const res = await fetch(`${API_BASE}/sessions?limit=${limit}&offset=${offset}`);
    if (res.ok) {
      const data = await res.json();
      const remoteIds = new Set(data.sessions.map((s: SessionSummary) => s.id));
      const merged = [
        ...local.filter((s) => !remoteIds.has(s.id)),
        ...data.sessions,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { sessions: merged.slice(0, limit) };
    }
  } catch { /* fall through */ }

  return { sessions: local.slice(offset, offset + limit) };
}

export async function getSession(id: string): Promise<SessionDetail> {
  if (isLocalSessionId(id)) {
    const local = await getLocalSession(id);
    if (!local) throw new Error('Session not found');
    return local;
  }

  if (isCloudSessionId(id)) {
    const cloud = await getCloudSession(id);
    if (!cloud) throw new Error('Session not found');
    return cloud;
  }

  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (!res.ok) throw new Error(`Failed to get session: ${res.status}`);
  return res.json();
}

const localAudioUrls = new Map<string, string>();

export function getAudioUrl(id: string): string {
  if (isLocalSessionId(id)) {
    return localAudioUrls.get(id) ?? '';
  }
  if (isCloudSessionId(id)) {
    return localAudioUrls.get(id) ?? '';
  }
  return `${API_BASE}/sessions/${id}/audio`;
}

export async function resolveAudioUrl(id: string): Promise<string | null> {
  const cached = localAudioUrls.get(id);
  if (cached) return cached;

  if (isCloudSessionId(id)) {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    const url = await getCloudAudioUrl(userId, id);
    if (url) localAudioUrls.set(id, url);
    return url;
  }

  if (isLocalSessionId(id)) {
    const blob = await getLocalAudioBlob(id);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    localAudioUrls.set(id, url);
    return url;
  }

  return getAudioUrl(id);
}

export async function triggerAnalysis(id: string): Promise<void> {
  if (isLocalSessionId(id) || isCloudSessionId(id)) return;
  const res = await fetch(`${API_BASE}/sessions/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  if (isLocalSessionId(id) || isCloudSessionId(id)) {
    throw new Error('No server analysis for this session');
  }
  const res = await fetch(`${API_BASE}/sessions/${id}/analysis`);
  if (!res.ok) throw new Error(`Failed to get analysis: ${res.status}`);
  return res.json();
}

export async function getStats(): Promise<DashboardStats> {
  const { sessions } = await getSessions(200);

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalPracticeTimeSec: 0,
      currentStreak: 0,
      avgPitchAccuracy: 0,
      avgTimingAccuracy: 0,
      avgOverallScore: 0,
      sessionsPerDay: [],
      accuracyOverTime: [],
    };
  }

  const totalPracticeTimeSec = sessions.reduce((s, x) => s + x.durationSec, 0);
  const avg = (fn: (s: SessionSummary) => number) =>
    sessions.reduce((sum, s) => sum + fn(s), 0) / sessions.length;

  return {
    totalSessions: sessions.length,
    totalPracticeTimeSec,
    currentStreak: 0,
    avgPitchAccuracy: Math.round(avg((s) => s.pitchAccuracy)),
    avgTimingAccuracy: Math.round(avg((s) => s.timingOnTimePercent)),
    avgOverallScore: Math.round(avg((s) => s.overallScore)),
    sessionsPerDay: [],
    accuracyOverTime: [],
  };
}

export async function deleteSession(id: string): Promise<void> {
  const url = localAudioUrls.get(id);
  if (url && isLocalSessionId(id)) URL.revokeObjectURL(url);
  localAudioUrls.delete(id);

  if (isLocalSessionId(id)) {
    await deleteLocalSession(id);
    return;
  }

  if (isCloudSessionId(id)) {
    const userId = await getCurrentUserId();
    if (userId) await deleteCloudSession(userId, id);
    return;
  }

  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.status}`);
}
