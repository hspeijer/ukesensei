import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { MelodyNote } from '../theory/staff';
import { chunkMeasuresIntoLines, quantizeMelody } from '../theory/staff';
import { inferSongChords } from '../theory/harmony';
import type { StemmableNote, Beam as VexBeam } from 'vexflow';

interface SheetMusicScoreProps {
  notes: MelodyNote[];
  title?: string;
  className?: string;
  /** Index into `notes` of the note currently playing, for a moving highlight during playback. */
  activeNoteIndex?: number;
  /**
   * One chord label per measure (lead-sheet style, shown above the staff), or
   * null for a measure with no assigned chord. If omitted, chords are
   * inferred automatically from the melody's detected key.
   */
  chords?: Array<{ display: string } | null>;
}

const LINE_HEIGHT = 130;
const PADDING = 30;
const MEASURES_PER_LINE = 2;
const ACTIVE_NOTE_COLOR = '#2dd4bf';

export function SheetMusicScore({ notes, title, className = '', activeNoteIndex = -1, chords }: SheetMusicScoreProps) {
  const elementId = useId().replace(/:/g, '');
  const [renderError, setRenderError] = useState<string | null>(null);
  // Snap the captured melody's timing onto a tempo grid before notating it,
  // so the rhythm reads cleanly instead of reflecting raw pitch-detection jitter.
  const { bpm, measures } = useMemo(() => quantizeMelody(notes), [notes]);
  const scoreLines = useMemo(
    () => chunkMeasuresIntoLines(measures, MEASURES_PER_LINE),
    [measures],
  );
  const inferredChords = useMemo(() => inferSongChords(notes, measures), [notes, measures]);
  const chordLabels = chords ?? inferredChords;
  const height = useMemo(() => {
    const lines = Math.max(1, scoreLines.length);
    return lines * LINE_HEIGHT + PADDING * 2 + (title ? 20 : 0);
  }, [scoreLines.length, title]);

  // Maps an original note index to every VexFlow StaveNote rendered for it
  // (a single note can span more than one token if it was decomposed into
  // dotted/tied durations, or split across a measure boundary), so playback
  // can highlight the right notehead(s) without re-rendering the whole score.
  const noteElementsRef = useRef<Map<number, StemmableNote[]>>(new Map());
  const highlightedIndexRef = useRef<number>(-1);

  useEffect(() => {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    setRenderError(null);
    noteElementsRef.current = new Map();
    highlightedIndexRef.current = -1;

    if (notes.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const { Factory, Voice, Beam, Fraction, StaveModifierPosition } = await import('vexflow');
        if (cancelled) return;

        const width = Math.max(320, container.clientWidth || 640);
        const vf = Factory.newFromElementId(elementId, width, height);
        const noteElements = new Map<number, StemmableNote[]>();
        const beams: VexBeam[] = [];

        scoreLines.forEach((line, lineIndex) => {
          const system = vf.System({
            x: 10,
            y: PADDING + (title ? 20 : 0) + lineIndex * LINE_HEIGHT,
            width: width - 20,
          });

          line.measures.forEach((measure, measureIndex) => {
            const score = vf.EasyScore();
            const tokenStr = measure.map((m) => m.token).join(', ');
            const voiceNotes = score.notes(tokenStr, { stem: 'auto' });

            voiceNotes.forEach((vexNote, i) => {
              const noteIndex = measure[i]?.noteIndex;
              if (noteIndex === null || noteIndex === undefined) return;
              const list = noteElements.get(noteIndex) ?? [];
              list.push(vexNote);
              noteElements.set(noteIndex, list);
            });

            const voice = vf.Voice({ time: { numBeats: 4, beatValue: 4 } })
              .setMode(Voice.Mode.SOFT)
              .addTickables(voiceNotes);

            if (voiceNotes.length > 1) {
              try {
                // Beat-based groups (one quarter note each) instead of one
                // beam spanning the whole measure, so beams break at each
                // beat the way normal notation does.
                beams.push(...Beam.generateBeams(voiceNotes, { groups: [new Fraction(1, 4)] }));
              } catch {
                // Beaming is optional
              }
            }

            const stave = system.addStave({ voices: [voice] });
            if (lineIndex === 0 && measureIndex === 0) {
              stave.addClef('treble').addTimeSignature('4/4');
            }

            const flatMeasureIndex = lineIndex * MEASURES_PER_LINE + measureIndex;
            const chord = chordLabels[flatMeasureIndex];
            if (chord) {
              stave.setStaveText(chord.display, StaveModifierPosition.ABOVE);
            }
          });
        });

        vf.draw();
        // Beams are formatted/drawn manually (rather than via Factory.Beam,
        // which only supports one beam spanning *all* passed notes) so they
        // need the notes' final x/y positions from the system draw above.
        const ctx = vf.getContext();
        for (const beam of beams) {
          beam.setContext(ctx).draw();
        }
        noteElementsRef.current = noteElements;

        // Re-apply any highlight that was already active before this (re-)render.
        if (highlightedIndexRef.current >= 0) {
          for (const n of noteElements.get(highlightedIndexRef.current) ?? []) {
            n.setStyle({ fillStyle: ACTIVE_NOTE_COLOR, strokeStyle: ACTIVE_NOTE_COLOR });
            n.drawWithStyle();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(err instanceof Error ? err.message : 'Failed to render score');
        }
      }
    })();

    return () => { cancelled = true; };
  }, [elementId, notes, height, title, scoreLines, chordLabels]);

  // Toggle just the previous/next active note's style rather than
  // re-rendering the whole score, so this stays cheap enough to run on
  // every playback animation frame.
  useEffect(() => {
    if (highlightedIndexRef.current === activeNoteIndex) return;

    for (const n of noteElementsRef.current.get(highlightedIndexRef.current) ?? []) {
      n.setStyle({});
      n.drawWithStyle();
    }
    for (const n of noteElementsRef.current.get(activeNoteIndex) ?? []) {
      n.setStyle({ fillStyle: ACTIVE_NOTE_COLOR, strokeStyle: ACTIVE_NOTE_COLOR });
      n.drawWithStyle();
    }
    highlightedIndexRef.current = activeNoteIndex;
  }, [activeNoteIndex]);

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
