import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * Karplus-Strong–style plucked bass string, rendered offline into a buffer
 * (same technique as useUkeSynth) but tuned for a longer, warmer, thumpier tone:
 * darker filtering, a lower body resonance, and a longer sustain.
 */
function renderPluck(ctx: AudioContext, freq: number, duration: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);

  const period = Math.round(sr / freq);
  const line = new Float32Array(period);

  for (let i = 0; i < period; i++) {
    line[i] = Math.random() * 2 - 1;
  }
  // Extra smoothing pass softens the attack more than the uke synth --
  // a plucked bass string has a rounder, less percussive onset.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < period; i++) {
      line[i] = line[i] * 0.5 + line[i - 1] * 0.5;
    }
  }

  // Bass strings are thick and low-tension, so they ring out much longer.
  const decay = 0.9986;
  // Lower brightness than the uke synth for a rounder, thumpier fundamental.
  const brightness = 0.22;

  let prev = 0;
  let idx = 0;

  for (let i = 0; i < len; i++) {
    const sample = line[idx];
    const filtered = brightness * sample + (1 - brightness) * prev;
    prev = filtered;
    line[idx] = filtered * decay;
    out[i] = filtered;
    idx = (idx + 1) % period;
  }

  return buf;
}

const PLUCK_DURATION = 2.6;

export function useBassSynth() {
  const activeRef = useRef<AudioBufferSourceNode[]>([]);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);

    const buffer = renderPluck(ctx, freq, PLUCK_DURATION);
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const env = ctx.createGain();
    const now = ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.7, now + 0.006);
    env.gain.setValueAtTime(0.7, now + PLUCK_DURATION * 0.5);
    env.gain.exponentialRampToValueAtTime(0.001, now + PLUCK_DURATION);

    // Body resonance around 100 Hz gives a bass-guitar-like low-end thump.
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 100;
    body.Q.value = 1.0;
    body.gain.value = 6;

    // Roll off highs much lower than the uke synth for a mellow, rounded tone.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 5, 1400);
    lp.Q.value = 0.6;

    src.connect(env).connect(body).connect(lp).connect(ctx.destination);
    src.start(now);
    src.stop(now + PLUCK_DURATION);

    const active = activeRef.current;
    active.push(src);
    src.onended = () => {
      const i = active.indexOf(src);
      if (i !== -1) active.splice(i, 1);
    };
    while (active.length > 6) {
      const old = active.shift()!;
      old.stop();
    }
  }, []);

  return { playNote };
}
