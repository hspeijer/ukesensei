import { useEffect, useState, useRef, useCallback } from 'react';
import {
  getSession,
  getAnalysis,
  triggerAnalysis,
  getAudioUrl,
  type SessionDetail,
  type AnalysisResult,
} from '../api/sessionApi';
import { AudioWaveform } from './AudioWaveform';
import { StringWaveform } from './StringWaveform';
import { SCALE_DEFINITIONS } from '../theory/scales';

interface SessionPlaybackProps {
  sessionId: string;
  onBack: () => void;
}

export function SessionPlayback({ sessionId, onBack }: SessionPlaybackProps) {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformWidth, setWaveformWidth] = useState(600);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const sess = await getSession(sessionId);
        if (cancelled) return;
        setSession(sess);

        if (sess.analysisStatus === 'complete') {
          try {
            const a = await getAnalysis(sessionId);
            if (!cancelled) setAnalysis(a);
          } catch { /* analysis cache may not exist yet */ }
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load session');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWaveformWidth(Math.floor(entry.contentRect.width));
      }
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleRunAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      await triggerAnalysis(sessionId);
      const a = await getAnalysis(sessionId);
      setAnalysis(a);
    } catch {
      setError('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [sessionId]);

  const updateTime = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      setCurrentTime(audio.currentTime);
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(updateTime);
    } else {
      audio.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    }
  }, [updateTime]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = fraction * duration;
    setCurrentTime(audio.currentTime);
  }, [duration]);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-[var(--c-text-muted)]">Loading session...</div>;
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-3">{error ?? 'Session not found'}</p>
        <button onClick={onBack} className="text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)]">
          Back to library
        </button>
      </div>
    );
  }

  const scaleDef = SCALE_DEFINITIONS[session.scaleKey];
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-[var(--c-text-muted)] hover:text-[var(--c-text-strong)] transition p-1"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-bold text-[var(--c-text-strong)]">
            {session.root} {scaleDef?.name ?? session.scaleKey}
          </h2>
          <p className="text-xs text-[var(--c-text-muted)]">
            {new Date(session.createdAt).toLocaleString()} &middot; {session.bpm} BPM &middot; {Math.round(session.durationSec)}s
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2">
        <SmallStat label="Pitch" value={`${session.pitchAccuracy}%`} color={session.pitchAccuracy >= 80 ? '#34d399' : '#fbbf24'} />
        <SmallStat label="Timing" value={`${session.timingOnTimePercent}%`} color={session.timingOnTimePercent >= 75 ? '#34d399' : '#fbbf24'} />
        <SmallStat label="Score" value={`${session.overallScore}`} color={session.overallScore >= 60 ? '#34d399' : '#fbbf24'} />
      </div>

      {/* Audio player */}
      {session.hasAudio && (
        <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)]">
          <audio
            ref={audioRef}
            src={getAudioUrl(sessionId)}
            preload="metadata"
            onLoadedMetadata={() => {
              if (audioRef.current) setDuration(audioRef.current.duration);
            }}
            onEnded={() => {
              setIsPlaying(false);
              cancelAnimationFrame(animFrameRef.current);
            }}
          />

          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={handlePlayPause}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-teal-600 hover:bg-teal-500 text-white transition shrink-0"
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="2" y="1" width="3.5" height="12" rx="1" />
                  <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <polygon points="3,0 14,7 3,14" />
                </svg>
              )}
            </button>

            <div className="flex-1 cursor-pointer" onClick={handleSeek}>
              <div className="h-2 bg-[var(--c-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-[width] duration-100"
                  style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <span className="text-xs font-mono text-[var(--c-text-muted)] w-[80px] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Audio waveform */}
          <div ref={containerRef} className="mt-3">
            <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2">
              Waveform
            </div>
            <AudioWaveform
              audioUrl={getAudioUrl(sessionId)}
              currentTime={currentTime}
              duration={duration}
              width={waveformWidth}
              height={80}
              onSeek={(t) => {
                if (audioRef.current) {
                  audioRef.current.currentTime = t;
                  setCurrentTime(t);
                }
              }}
            />
          </div>

          {/* Per-string waveform */}
          {analysis && (
            <div className="mt-3" onClick={handleSeek}>
              <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-2">
                Per-String Energy
              </div>
              <StringWaveform
                frames={analysis.frames}
                durationSec={analysis.durationSec}
                currentTime={currentTime}
                width={waveformWidth}
                height={200}
              />
            </div>
          )}

          {!analysis && session.analysisStatus !== 'complete' && (
            <div className="text-center py-4">
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg text-sm font-medium hover:bg-teal-600/30 transition disabled:opacity-50"
              >
                {analyzing ? 'Analyzing...' : 'Run String Analysis'}
              </button>
              <p className="text-xs text-[var(--c-text-muted)] mt-1">
                Separate audio into per-string waveforms using FFT
              </p>
            </div>
          )}
        </div>
      )}

      {!session.hasAudio && (
        <div className="bg-[var(--c-surface)] rounded-xl p-6 border border-[var(--c-border)] text-center">
          <p className="text-[var(--c-text-muted)]">No audio recording for this session</p>
        </div>
      )}

      {/* Note timeline */}
      {session.notes.length > 0 && (
        <div className="bg-[var(--c-surface)] rounded-xl p-4 border border-[var(--c-border)]">
          <div className="text-xs text-[var(--c-text-muted)] font-medium uppercase tracking-wider mb-3">
            Notes Played ({session.notes.length})
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {session.notes.map((n, i) => {
              const relTime = ((n.timestamp - session.startedAt) / 1000).toFixed(1);
              return (
                <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded bg-[var(--c-bg)]">
                  <span className="w-[40px] text-right font-mono text-[var(--c-text-muted)]">{relTime}s</span>
                  <span className={`font-bold w-[28px] ${n.wasCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {n.note}
                  </span>
                  <span className="text-[var(--c-text-muted)] w-[36px] text-right">
                    {n.cents > 0 ? '+' : ''}{n.cents}&#162;
                  </span>
                  <span className="text-[var(--c-text-muted)] w-[48px] text-right">
                    {n.beatOffset > 0 ? '+' : ''}{n.beatOffset}ms
                  </span>
                  {n.expectedNote && n.expectedNote !== n.note && (
                    <span className="text-red-400/60 text-[10px]">(expected {n.expectedNote})</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SmallStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--c-surface)] rounded-lg p-2.5 text-center border border-[var(--c-border)]">
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[var(--c-text-muted)] uppercase tracking-wider">{label}</div>
    </div>
  );
}
