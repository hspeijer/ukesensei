import type { SessionNote, SessionResult } from './useSession';
import type { NoteName } from '../theory/notes';

export interface TimingAnalysis {
  avgBeatOffsetMs: number;
  absAvgBeatOffsetMs: number;
  onTimePercent: number;
  timingConsistency: number;
  tempoTrend: 'steady' | 'speeding_up' | 'slowing_down';
}

export interface NoteBreakdown {
  note: NoteName;
  count: number;
  avgCents: number;
  avgBeatOffset: number;
  correctPercent: number;
}

export interface SessionAnalysisResult {
  pitchAccuracy: number;
  avgCents: number;
  timing: TimingAnalysis;
  noteBreakdowns: NoteBreakdown[];
  overallScore: number;
  rating: { emoji: string; title: string };
  suggestions: string[];
  totalNotes: number;
  correctNotes: number;
  durationSec: number;
}

const ON_TIME_THRESHOLD_MS = 80;

export function analyzeSession(session: SessionResult): SessionAnalysisResult {
  const notes = session.notes;
  const totalNotes = notes.length;
  const correctNotes = notes.filter((n) => n.wasCorrect).length;
  const pitchAccuracy = totalNotes > 0 ? correctNotes / totalNotes : 0;

  const avgCents =
    totalNotes > 0
      ? notes.reduce((s, n) => s + Math.abs(n.cents), 0) / totalNotes
      : 0;

  const timing = analyzeTimings(notes);
  const noteBreakdowns = buildNoteBreakdowns(notes);

  const pitchScore = pitchAccuracy * 50;
  const timingScore = timing.onTimePercent * 0.3 + (1 - Math.min(timing.absAvgBeatOffsetMs / 200, 1)) * 20;
  const overallScore = Math.round(pitchScore + timingScore);

  const rating = getRating(overallScore, pitchAccuracy, timing);
  const suggestions = buildSuggestions(pitchAccuracy, avgCents, timing, noteBreakdowns);

  const durationSec = (session.endedAt - session.startedAt) / 1000;

  return {
    pitchAccuracy: Math.round(pitchAccuracy * 100),
    avgCents: Math.round(avgCents),
    timing,
    noteBreakdowns,
    overallScore,
    rating,
    suggestions,
    totalNotes,
    correctNotes,
    durationSec: Math.round(durationSec),
  };
}

function analyzeTimings(notes: SessionNote[]): TimingAnalysis {
  if (notes.length === 0) {
    return {
      avgBeatOffsetMs: 0,
      absAvgBeatOffsetMs: 0,
      onTimePercent: 0,
      timingConsistency: 0,
      tempoTrend: 'steady',
    };
  }

  const offsets = notes.map((n) => n.beatOffset);
  const avgOffset = offsets.reduce((s, o) => s + o, 0) / offsets.length;
  const absAvg = offsets.reduce((s, o) => s + Math.abs(o), 0) / offsets.length;
  const onTime = offsets.filter((o) => Math.abs(o) <= ON_TIME_THRESHOLD_MS).length;
  const onTimePercent = Math.round((onTime / offsets.length) * 100);

  // Standard deviation as consistency metric
  const variance = offsets.reduce((s, o) => s + (o - avgOffset) ** 2, 0) / offsets.length;
  const stdDev = Math.sqrt(variance);
  const timingConsistency = Math.max(0, Math.round(100 - stdDev));

  // Tempo trend: compare first half offsets to second half
  let tempoTrend: 'steady' | 'speeding_up' | 'slowing_down' = 'steady';
  if (offsets.length >= 4) {
    const mid = Math.floor(offsets.length / 2);
    const firstHalf = offsets.slice(0, mid).reduce((s, o) => s + o, 0) / mid;
    const secondHalf = offsets.slice(mid).reduce((s, o) => s + o, 0) / (offsets.length - mid);
    const diff = secondHalf - firstHalf;
    if (diff < -30) tempoTrend = 'speeding_up';
    else if (diff > 30) tempoTrend = 'slowing_down';
  }

  return {
    avgBeatOffsetMs: Math.round(avgOffset),
    absAvgBeatOffsetMs: Math.round(absAvg),
    onTimePercent,
    timingConsistency,
    tempoTrend,
  };
}

function buildNoteBreakdowns(notes: SessionNote[]): NoteBreakdown[] {
  const groups = new Map<NoteName, SessionNote[]>();
  for (const n of notes) {
    if (!groups.has(n.note)) groups.set(n.note, []);
    groups.get(n.note)!.push(n);
  }

  const breakdowns: NoteBreakdown[] = [];
  for (const [note, group] of groups) {
    const count = group.length;
    const avgCents = Math.round(group.reduce((s, n) => s + n.cents, 0) / count);
    const avgBeatOffset = Math.round(group.reduce((s, n) => s + n.beatOffset, 0) / count);
    const correctPercent = Math.round((group.filter((n) => n.wasCorrect).length / count) * 100);
    breakdowns.push({ note, count, avgCents, avgBeatOffset, correctPercent });
  }

  return breakdowns.sort((a, b) => a.correctPercent - b.correctPercent);
}

function getRating(
  score: number,
  pitchAccuracy: number,
  timing: TimingAnalysis,
): { emoji: string; title: string } {
  if (score >= 80 && pitchAccuracy >= 0.9 && timing.onTimePercent >= 80)
    return { emoji: '🌟', title: 'Outstanding!' };
  if (score >= 60 && pitchAccuracy >= 0.8)
    return { emoji: '🎉', title: 'Great Job!' };
  if (score >= 40)
    return { emoji: '👍', title: 'Solid Progress' };
  return { emoji: '💪', title: 'Keep Practicing' };
}

function buildSuggestions(
  pitchAccuracy: number,
  avgCents: number,
  timing: TimingAnalysis,
  breakdowns: NoteBreakdown[],
): string[] {
  const suggestions: string[] = [];

  if (pitchAccuracy < 0.7) {
    suggestions.push('Focus on hitting the right notes first. Try the scale slowly without the metronome until the notes feel natural.');
  } else if (avgCents > 20) {
    suggestions.push('Your note choices are good but your intonation needs work. Try playing each note and holding it until the tuning meter shows green.');
  }

  if (timing.onTimePercent < 50) {
    suggestions.push('Your timing needs attention. Try a slower tempo and focus on playing exactly on the beat clicks.');
  } else if (timing.onTimePercent < 75) {
    suggestions.push('Timing is improving. Try counting along with the metronome ("1-2-3-4") while you play.');
  }

  if (timing.tempoTrend === 'speeding_up') {
    suggestions.push('You tend to rush as the exercise goes on. Focus on keeping a steady pace, especially in the second half.');
  } else if (timing.tempoTrend === 'slowing_down') {
    suggestions.push('You tend to slow down toward the end. Keep the energy consistent by feeling the pulse internally.');
  }

  const worstNote = breakdowns.find((b) => b.correctPercent < 60);
  if (worstNote) {
    suggestions.push(`The note ${worstNote.note} gave you the most trouble. Practice the part of the scale around that note in isolation.`);
  }

  if (suggestions.length === 0) {
    suggestions.push('Excellent session! Try increasing the tempo by 5-10 BPM to push yourself further.');
  }

  return suggestions;
}
