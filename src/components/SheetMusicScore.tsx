import { useEffect, useId, useMemo, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { chunkScoreLines, melodyToEasyScoreTokens } from '../theory/staff';

interface SheetMusicScoreProps {
  notes: MelodyNote[];
  title?: string;
  className?: string;
}

const LINE_HEIGHT = 110;
const PADDING = 24;

export function SheetMusicScore({ notes, title, className = '' }: SheetMusicScoreProps) {
  const elementId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  const scoreLines = useMemo(
    () => chunkScoreLines(melodyToEasyScoreTokens(notes)),
    [notes],
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

          const voiceNotes = score.notes(line, { stem: 'auto' });
          const voice = score.voice(voiceNotes, { time: '4/4' });
          voice.setMode(Voice.Mode.SOFT);

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
        <h3 className="text-sm font-semibold text-[var(--c-text-muted)] mb-2">{title}</h3>
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
