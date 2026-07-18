export interface SessionMetadata {
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
  chords?: (ChordLabelData | null)[] | null;
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

export interface ChordLabelData {
  root: string;
  quality: string;
  display: string;
}

export interface SessionRow {
  id: string;
  created_at: string;
  scale_key: string;
  root: string;
  bpm: number;
  tuning_key: string;
  started_at: number;
  ended_at: number;
  duration_sec: number;
  pitch_accuracy: number;
  timing_on_time_percent: number;
  overall_score: number;
  notes_json: string;
  chords_json: string | null;
  analysis_status: 'pending' | 'processing' | 'complete' | 'error';
  has_audio: number;
}

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
  chords?: (ChordLabelData | null)[] | null;
  startedAt: number;
  endedAt: number;
}

export interface StringAnalysisFrame {
  time: number;
  strings: [number, number, number, number]; // G, C, E, A
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
