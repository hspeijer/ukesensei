import type { Instrument } from '../theory/fretboard';
import type { Curriculum } from './curriculum';
import { bluesCurriculum } from './bluesCurriculum';
import { bassTechniqueCurriculum } from './bassTechniqueCurriculum';

/** Maps each instrument to its lesson curriculum, if it has one. Guitar has none yet. */
export const CURRICULA: Partial<Record<Instrument, Curriculum>> = {
  ukulele: bluesCurriculum,
  bass: bassTechniqueCurriculum,
};

export function getCurriculumForInstrument(instrument: Instrument): Curriculum | null {
  return CURRICULA[instrument] ?? null;
}

export function hasCurriculum(instrument: Instrument): boolean {
  return CURRICULA[instrument] != null;
}
