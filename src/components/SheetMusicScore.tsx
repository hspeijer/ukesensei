import { useEffect, useId, useMemo, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { chunkMeasuresIntoLines, quantizeMelody } from '../theory/staff';

interface SheetMusicScoreProps {
  notes: MelodyNote[];
  title?: string;
  className?: string;
}

const LINE_HEIGHT = 110;
const PADDING = 24;
const MEASURES_PER_LINE = 2;

export function SheetMusicScore({ notes, title, className = '' }: SheetMusicScoreProps) {
  const elementId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  // Snap the captured melody's timing onto a tempo grid before notating it,
  // so the rhythm reads cleanly instead of reflecting raw pitch-detection jitter.
  const { bpm, measures } = useMemo(() => quantizeMelody(notes), [notes]);
  const scoreLines = useMemo(
    () => chunkMeasuresIntoLines(measures, MEASURES_PER_LINE),
    [measures],
  );
  const height = useMemo(() => {
    const lines = Math.max(1, scoreLines.length);
    return lines * LINE_HEIGHT + PADDING * 2 + (title ? 20 : 0);
  }, [scoreLines.length, title]);

  useEffect(() => {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    setRenderError(null);

    if (notes.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const { Factory, Voice } = await import('vexflow');
        if (cancelled) return;

        const width = Math.max(320, container.clientWidth || 640);
        const vf = Factory.newFromElementId(elementId, width, height);

        scoreLines.forEach((line, index) => {
          const score = vf.EasyScore();
          const system = vf.System({
            x: 10,
            y: PADDING + (title ? 20 : 0) + index * LINE_HEIGHT,
            width: width - 20,
          });

          const voiceNotes = score.notes(line.tokens, { stem: 'auto' });
          // Build the voice manually (rather than via `score.voice`, which
          // adds tickables immediately in strict mode) so SOFT mode is set
          // *before* tickables are added. Otherwise a line with more than a
          // measure's worth of notes throws "Too many ticks" before we get a
          // chance to relax the mode. The line's own beat count (it may span
          // several quantized measures) becomes the voice's time signature,
          // so it's always exactly filled rather than under/overfull.
          const voice = vf.Voice({ time: { numBeats: line.beats, beatValue: 4 } })
            .setMode(Voice.Mode.SOFT)
            .addTickables(voiceNotes);

          if (voiceNotes.length > 1) {
            try {
              score.beam(voiceNotes);
            } catch {
              // Beaming is optional
            }
          }

          const stave = system.addStave({ voices: [voice] });
          if (index === 0) {
            stave.addClef('treble').addTimeSignature('4/4');
          }
        });

        vf.draw();
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Failed to render score');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [elementId, notes, height, title, scoreLines]);

  if (notes.length === 0) {
    return (
      <div className={`text-sm text-[var(--c-text-muted)] text-center py-6 ${className}`}>
        No notes captured yet. Play a melody while recording.
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] mb-2">
          {title} <span className="font-normal text-[var(--c-text-muted)]/70">(~{bpm} BPM, quantized)</span>
        </h3>
      )}
      {renderError && (
        <p className="text-xs text-red-400 mb-2">{renderError}</p>
      )}
      <div
        id={elementId}
        className="w-full overflow-x-auto bg-[var(--c-surface)] rounded-xl border border-[var(--c-border)]"
        style={{ minHeight: height }}
      />
    </div>
  );
}
