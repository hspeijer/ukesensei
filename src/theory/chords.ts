import { type NoteName, ENHARMONIC_MAP } from './notes';

export interface ChordVoicing {
  name: string;
  suffix: string;
  frets: [number, number, number, number]; // G, C, E, A strings
  fingers: [number, number, number, number]; // 0 = open/mute, 1-4 = finger
  barres?: number[];
}

export const CHORD_QUALITIES: Record<string, { intervals: number[]; suffix: string; priority: number }> = {
  major:      { intervals: [0, 4, 7],     suffix: '',     priority: 10 },
  minor:      { intervals: [0, 3, 7],     suffix: 'm',    priority: 9 },
  dom7:       { intervals: [0, 4, 7, 10], suffix: '7',    priority: 7 },
  maj7:       { intervals: [0, 4, 7, 11], suffix: 'maj7', priority: 6 },
  min7:       { intervals: [0, 3, 7, 10], suffix: 'm7',   priority: 6 },
  dim:        { intervals: [0, 3, 6],     suffix: 'dim',  priority: 4 },
  aug:        { intervals: [0, 4, 8],     suffix: 'aug',  priority: 4 },
  sus2:       { intervals: [0, 2, 7],     suffix: 'sus2', priority: 5 },
  sus4:       { intervals: [0, 5, 7],     suffix: 'sus4', priority: 5 },
  add9:       { intervals: [0, 4, 7, 14], suffix: 'add9', priority: 3 },
  min6:       { intervals: [0, 3, 7, 9],  suffix: 'm6',   priority: 3 },
  dom6:       { intervals: [0, 4, 7, 9],  suffix: '6',    priority: 3 },
};

export const UKULELE_VOICINGS: ChordVoicing[] = [
  // Major chords
  { name: 'C',  suffix: '',     frets: [0, 0, 0, 3], fingers: [0, 0, 0, 3] },
  { name: 'D',  suffix: '',     frets: [2, 2, 2, 0], fingers: [1, 1, 1, 0], barres: [2] },
  { name: 'E',  suffix: '',     frets: [1, 4, 0, 2], fingers: [1, 4, 0, 2] },
  { name: 'F',  suffix: '',     frets: [2, 0, 1, 0], fingers: [2, 0, 1, 0] },
  { name: 'G',  suffix: '',     frets: [0, 2, 3, 2], fingers: [0, 1, 3, 2] },
  { name: 'A',  suffix: '',     frets: [2, 1, 0, 0], fingers: [2, 1, 0, 0] },
  { name: 'B',  suffix: '',     frets: [4, 3, 2, 2], fingers: [4, 3, 1, 1], barres: [2] },
  { name: 'Bb', suffix: '',     frets: [3, 2, 1, 1], fingers: [4, 3, 1, 1], barres: [1] },
  { name: 'Eb', suffix: '',     frets: [0, 3, 3, 1], fingers: [0, 2, 3, 1] },
  { name: 'Ab', suffix: '',     frets: [5, 3, 4, 3], fingers: [3, 1, 2, 1], barres: [3] },
  { name: 'Db', suffix: '',     frets: [1, 1, 1, 4], fingers: [1, 1, 1, 4], barres: [1] },
  { name: 'Gb', suffix: '',     frets: [3, 1, 2, 1], fingers: [3, 1, 2, 1], barres: [1] },

  // Minor chords
  { name: 'C',  suffix: 'm',    frets: [0, 3, 3, 3], fingers: [0, 1, 2, 3] },
  { name: 'D',  suffix: 'm',    frets: [2, 2, 1, 0], fingers: [2, 3, 1, 0] },
  { name: 'E',  suffix: 'm',    frets: [0, 4, 3, 2], fingers: [0, 3, 2, 1] },
  { name: 'F',  suffix: 'm',    frets: [1, 0, 1, 3], fingers: [1, 0, 2, 4] },
  { name: 'G',  suffix: 'm',    frets: [0, 2, 3, 1], fingers: [0, 2, 3, 1] },
  { name: 'A',  suffix: 'm',    frets: [2, 0, 0, 0], fingers: [1, 0, 0, 0] },
  { name: 'B',  suffix: 'm',    frets: [4, 2, 2, 2], fingers: [4, 1, 1, 1], barres: [2] },
  { name: 'Bb', suffix: 'm',    frets: [3, 1, 1, 1], fingers: [4, 1, 1, 1], barres: [1] },

  // 7th chords
  { name: 'C',  suffix: '7',    frets: [0, 0, 0, 1], fingers: [0, 0, 0, 1] },
  { name: 'D',  suffix: '7',    frets: [2, 2, 2, 3], fingers: [1, 1, 1, 2], barres: [2] },
  { name: 'E',  suffix: '7',    frets: [1, 2, 0, 2], fingers: [1, 2, 0, 3] },
  { name: 'F',  suffix: '7',    frets: [2, 3, 1, 0], fingers: [2, 3, 1, 0] },
  { name: 'G',  suffix: '7',    frets: [0, 2, 1, 2], fingers: [0, 2, 1, 3] },
  { name: 'A',  suffix: '7',    frets: [0, 1, 0, 0], fingers: [0, 1, 0, 0] },
  { name: 'B',  suffix: '7',    frets: [2, 3, 2, 2], fingers: [1, 2, 1, 1], barres: [2] },
  { name: 'Bb', suffix: '7',    frets: [1, 2, 1, 1], fingers: [1, 2, 1, 1], barres: [1] },

  // Minor 7th chords
  { name: 'A',  suffix: 'm7',   frets: [0, 0, 0, 0], fingers: [0, 0, 0, 0] },
  { name: 'D',  suffix: 'm7',   frets: [2, 2, 1, 3], fingers: [2, 3, 1, 4] },
  { name: 'E',  suffix: 'm7',   frets: [0, 2, 0, 2], fingers: [0, 1, 0, 2] },
  { name: 'G',  suffix: 'm7',   frets: [0, 2, 1, 1], fingers: [0, 3, 1, 2] },

  // Maj7 chords
  { name: 'C',  suffix: 'maj7', frets: [0, 0, 0, 2], fingers: [0, 0, 0, 1] },
  { name: 'F',  suffix: 'maj7', frets: [2, 4, 1, 0], fingers: [2, 4, 1, 0] },
  { name: 'G',  suffix: 'maj7', frets: [0, 2, 2, 2], fingers: [0, 1, 2, 3] },
  { name: 'A',  suffix: 'maj7', frets: [1, 1, 0, 0], fingers: [1, 2, 0, 0] },

  // Dim chords
  { name: 'B',  suffix: 'dim',  frets: [4, 2, 0, 1], fingers: [4, 2, 0, 1] },
  { name: 'C',  suffix: 'dim',  frets: [5, 3, 2, 3], fingers: [4, 2, 1, 3] },

  // Sus chords
  { name: 'A',  suffix: 'sus4', frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
  { name: 'D',  suffix: 'sus4', frets: [0, 2, 3, 0], fingers: [0, 1, 2, 0] },
  { name: 'D',  suffix: 'sus2', frets: [2, 2, 0, 0], fingers: [1, 2, 0, 0] },
];

// Pre-compute the note set for each voicing so we can match against detected notes
const OPEN_STRINGS: Record<string, NoteName[]> = {
  standard: ['G', 'C', 'E', 'A'],
  low_g: ['G', 'C', 'E', 'A'],
};

function getVoicingNotes(voicing: ChordVoicing, tuningKey: string = 'low_g'): NoteName[] {
  const openNotes = OPEN_STRINGS[tuningKey] ?? OPEN_STRINGS.low_g;
  const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
  const notes: NoteName[] = [];
  for (let s = 0; s < 4; s++) {
    const fret = voicing.frets[s];
    if (fret < 0) continue;
    const openIdx = chromatic.indexOf(openNotes[s] as any);
    const noteIdx = (openIdx + fret) % 12;
    notes.push(chromatic[noteIdx]);
  }
  return notes;
}

interface VoicingMatch {
  voicing: ChordVoicing;
  notes: NoteName[];
  root: NoteName;
  suffix: string;
}

let _voicingCache: VoicingMatch[] | null = null;

function getVoicingMatches(): VoicingMatch[] {
  if (_voicingCache) return _voicingCache;
  _voicingCache = UKULELE_VOICINGS.map((v) => ({
    voicing: v,
    notes: getVoicingNotes(v),
    root: v.name as NoteName,
    suffix: v.suffix,
  }));
  return _voicingCache;
}

/**
 * Match detected pitch classes against the known ukulele voicing database.
 * Returns the best-matching chord or null if nothing fits.
 */
export function detectChord(
  notes: NoteName[],
  noteCounts?: Map<NoteName, number>,
): { root: NoteName; quality: string; display: string } | null {
  if (notes.length < 2) return null;

  const uniqueNotes = [...new Set(notes)];
  const detectedSet = new Set(uniqueNotes);

  const voicings = getVoicingMatches();
  let best: { root: string; suffix: string; score: number } | null = null;

  for (const vm of voicings) {
    const voicingUniqueNotes = new Set(vm.notes);

    let detectedInVoicing = 0;
    for (const n of uniqueNotes) {
      if (voicingUniqueNotes.has(n)) detectedInVoicing++;
    }
    let voicingCovered = 0;
    for (const n of voicingUniqueNotes) {
      if (detectedSet.has(n)) voicingCovered++;
    }

    if (detectedInVoicing < 2) continue;

    const fitScore = detectedInVoicing / uniqueNotes.length;
    const coverScore = voicingCovered / voicingUniqueNotes.size;

    const exactBonus = (fitScore === 1.0 && coverScore === 1.0) ? 0.25 : 0;

    // Normalize flat root names (Bb→A#, …) so lookup works against
    // detected notes which always use sharps
    let rootBoost = 0;
    if (noteCounts) {
      const canonicalRoot = (ENHARMONIC_MAP[vm.root] ?? vm.root) as NoteName;
      const rootCount = noteCounts.get(canonicalRoot) ?? 0;
      const totalCount = Array.from(noteCounts.values()).reduce((a, b) => a + b, 0);
      if (totalCount > 0) rootBoost = (rootCount / totalCount) * 0.2;
    }

    const qualityKey = suffixToQuality(vm.suffix);
    const qualityDef = CHORD_QUALITIES[qualityKey];
    const priorityBonus = qualityDef ? (qualityDef.priority / 10) * 0.08 : 0;

    const score = fitScore * 0.5 + coverScore * 0.35 + exactBonus + rootBoost + priorityBonus;

    if (!best || score > best.score) {
      best = { root: vm.root, suffix: vm.suffix, score };
    }
  }

  if (!best) return null;

  const quality = suffixToQuality(best.suffix);
  return {
    root: best.root as NoteName,
    quality,
    display: `${best.root}${best.suffix}`,
  };
}

function suffixToQuality(suffix: string): string {
  for (const [quality, def] of Object.entries(CHORD_QUALITIES)) {
    if (def.suffix === suffix) return quality;
  }
  return 'major';
}

export function findVoicing(root: string, suffix: string): ChordVoicing | null {
  return UKULELE_VOICINGS.find(
    (v) => v.name === root && v.suffix === suffix,
  ) ?? null;
}

/**
 * Get the fret positions (string, fret) for a chord voicing.
 */
export function getVoicingFretPositions(voicing: ChordVoicing): { string: number; fret: number }[] {
  const positions: { string: number; fret: number }[] = [];
  for (let s = 0; s < 4; s++) {
    if (voicing.frets[s] >= 0) {
      positions.push({ string: s, fret: voicing.frets[s] });
    }
  }
  return positions;
}
