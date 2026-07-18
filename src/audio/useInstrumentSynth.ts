import type { Instrument } from '../theory/fretboard';
import { useUkeSynth } from './useUkeSynth';
import { useBassSynth } from './useBassSynth';
import { useGuitarSynth } from './useGuitarSynth';
import { useClarinetSynth } from './useClarinetSynth';
import { useVoiceSynth } from './useVoiceSynth';
import { useHandpanSynth } from './useHandpanSynth';
import { useCajonSynth } from './useCajonSynth';
import { useHarmonicaSynth } from './useHarmonicaSynth';
import { useCelloSynth } from './useCelloSynth';

/**
 * Type guard to narrow synth to a pitched instrument (with playNote).
 * Cajon is the only rhythm instrument and returns { playHit } instead.
 */
export function isPitchedSynth(
  synth: ReturnType<typeof useInstrumentSynth>,
): synth is ReturnType<typeof useUkeSynth> {
  return 'playNote' in synth;
}

/**
 * Factory hook that returns the appropriate synth hook for a given instrument.
 * Each instrument has its own synthesis method (plucked strings, bowed strings,
 * pitched percussion, etc.), so this dispatches to the right one.
 *
 * Returns a synth object with either `playNote` (pitched instruments) or
 * `playHit` (rhythm instruments like cajon).
 *
 * IMPORTANT: every instrument's synth hook is called unconditionally, on every
 * render, regardless of which instrument is currently selected. Hooks must run
 * in the same order and count on every render (Rules of Hooks) -- individual
 * synth hooks don't all call the same number of underlying hooks internally
 * (e.g. clarinet/harmonica keep an extra `useRef` for a cached waveform), so
 * calling only the "active" one via a switch would change the total hook
 * count on the caller's fiber whenever the user switches instruments, which
 * corrupts React's hook bookkeeping for everything rendered after this call.
 */
export function useInstrumentSynth(instrument: Instrument = 'ukulele') {
  const ukulele = useUkeSynth();
  const bass = useBassSynth();
  const guitar = useGuitarSynth();
  const cello = useCelloSynth();
  const clarinet = useClarinetSynth();
  const voice = useVoiceSynth();
  const handpan = useHandpanSynth();
  const cajon = useCajonSynth();
  const harmonica = useHarmonicaSynth();

  switch (instrument) {
    case 'ukulele':
      return ukulele;
    case 'bass':
      return bass;
    case 'guitar':
      return guitar;
    case 'cello':
      return cello;
    case 'clarinet':
      return clarinet;
    case 'voice':
      return voice;
    case 'handpan':
      return handpan;
    case 'cajon':
      return cajon;
    case 'harmonica':
      return harmonica;
    default:
      // TypeScript exhaustiveness check
      const _exhaustive: never = instrument;
      throw new Error(`Unknown instrument: ${_exhaustive}`);
  }
}
