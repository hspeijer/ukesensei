import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * A bowed string, unlike the plucked uke/bass/guitar synths -- the bow keeps
 * feeding energy into the string for as long as the note sounds, so instead
 * of a Karplus-Strong pluck we use a sawtooth oscillator (rich in harmonics,
 * like a driven string) shaped by a slow "bow catching the string" attack
 * and a sustained body, plus a short burst of filtered noise at the onset
 * standing in for bow scratch/rosin grit.
 */
const NOTE_DURATION = 1.8;

interface ActiveVoice {
  osc: OscillatorNode;
  vibrato: OscillatorNode;
  scratch: AudioBufferSourceNode;
}

function createScratchBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * durationSec));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function useCelloSynth() {
  const activeRef = useRef<ActiveVoice[]>([]);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Bowed strings waver more than plucked ones since the bow is
    // continuously re-exciting the string; a fuller vibrato than the uke synths.
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 4.5;
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.value = freq * 0.006;
    vibrato.connect(vibratoGain).connect(osc.frequency);

    // Body resonance around the cello's characteristic low-mid "wolf" register
    // gives the warm, woody thickness a bowed cello has versus a bass guitar.
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 110;
    body.Q.value = 0.9;
    body.gain.value = 7;

    // Rolls off the sawtooth's buzzier upper harmonics so it reads as bowed
    // wood, not a synth lead.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 4.5, 3200);
    lp.Q.value = 0.5;

    // Slow, swelling attack -- a bow needs a moment to grip and set the
    // string in motion, unlike a plucked string's near-instant onset.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.09);
    env.gain.setValueAtTime(0.48, now + NOTE_DURATION * 0.65);
    env.gain.exponentialRampToValueAtTime(0.001, now + NOTE_DURATION);

    osc.connect(body).connect(lp).connect(env).connect(ctx.destination);
    osc.start(now);
    vibrato.start(now);
    osc.stop(now + NOTE_DURATION);
    vibrato.stop(now + NOTE_DURATION);

    // Brief bandpassed noise burst under the attack, standing in for bow
    // rosin/scratch catching the string at the start of the stroke.
    const scratch = ctx.createBufferSource();
    scratch.buffer = createScratchBuffer(ctx, 0.05);
    const scratchFilter = ctx.createBiquadFilter();
    scratchFilter.type = 'bandpass';
    scratchFilter.frequency.value = Math.min(freq * 2, 1200);
    scratchFilter.Q.value = 0.8;
    const scratchEnv = ctx.createGain();
    scratchEnv.gain.setValueAtTime(0.1, now);
    scratchEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    scratch.connect(scratchFilter).connect(scratchEnv).connect(ctx.destination);
    scratch.start(now);
    scratch.stop(now + 0.06);

    const active = activeRef.current;
    const voice: ActiveVoice = { osc, vibrato, scratch };
    active.push(voice);
    osc.onended = () => {
      const i = active.indexOf(voice);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 6) {
      const old = active.shift()!;
      old.osc.stop();
      old.vibrato.stop();
      old.scratch.stop();
    }
  }, []);

  return { playNote };
}
