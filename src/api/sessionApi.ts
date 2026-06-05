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

export async function uploadSession(
  audioBlob: Blob | null,
  metadata: UploadMetadata,
): Promise<{ id: string }> {
  const form = new FormData();
  form.append('metadata', JSON.stringify(metadata));
  if (audioBlob && audioBlob.size > 0) {
    form.append('audio', audioBlob, 'recording.webm');
  }

  const res = await fetch(`${API_BASE}/sessions`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function getSessions(limit = 50, offset = 0): Promise<{ sessions: SessionSummary[] }> {
  const res = await fetch(`${API_BASE}/sessions?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to list sessions: ${res.status}`);
  return res.json();
}

export async function getSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${API_BASE}/sessions/${id}`);
  if (!res.ok) throw new Error(`Failed to get session: ${res.status}`);
  return res.json();
}

export function getAudioUrl(id: string): string {
  return `${API_BASE}/sessions/${id}/audio`;
}

export async function triggerAnalysis(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${id}/analyze`, { method: 'POST' });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
}

export async function getAnalysis(id: string): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/sessions/${id}/analysis`);
  if (!res.ok) throw new Error(`Failed to get analysis: ${res.status}`);
  return res.json();
}

export async function getStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error(`Failed to get stats: ${res.status}`);
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sessions/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete session: ${res.status}`);
}
