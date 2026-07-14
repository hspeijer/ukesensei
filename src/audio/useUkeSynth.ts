import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * Attempt a Karplus-Strong–style plucked nylon string.
 *
 * The approach: fill a delay-line buffer with filtered noise, then feed it back
 * through a one-pole lowpass (the "string") so the high harmonics die away
 * faster than the fundamental — exactly how a real plucked string behaves.
 *
 * Because the Web Audio API does not expose per-sample feedback easily, we
 * build the full output offline in a single AudioBuffer and play it back.
 * This keeps things simple and avoids clicks.
 */
function renderPluck(ctx: AudioContext, freq: number, duration: number): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * duration);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);

  // Delay-line length = one period of the fundamental
  const period = Math.round(sr / freq);
  const line = new Float32Array(period);

  // Seed the delay line with band-limited noise shaped toward the note
  for (let i = 0; i < period; i++) {
    line[i] = Math.random() * 2 - 1;
  }
  // Pre-smooth the noise once to soften the attack (nylon has a mellow pluck)
  for (let i = 1; i < period; i++) {
    line[i] = line[i] * 0.5 + line[i - 1] * 0.5;
  }

  // Decay factor – controls how long the note rings.
  // Ukulele strings are short and nylon, so decay is moderate.
  const decay = 0.996;
  // Brightness: lower = warmer (more nylon-like)
  const brightness = 0.42;

  let prev = 0;
  let idx = 0;

  for (let i = 0; i < len; i++) {
    const sample = line[idx];
    // One-pole lowpass averages current + previous sample, weighted by brightness
    const filtered = brightness * sample + (1 - brightness) * prev;
    prev = filtered;
    line[idx] = filtered * decay;
    out[i] = filtered;
    idx = (idx + 1) % period;
  }

  return buf;
}

const PLUCK_DURATION = 1.8;

export function useUkeSynth() {
  // Keep a small pool of active sources so rapid clicks don't pile up
  const activeRef = useRef<AudioBufferSourceNode[]>([]);

  const playNote = useCallback((note: NoteName, octave: number) => {
    const ctx = getSharedAudioContext();
    const freq = noteToFrequency(note, octave);

    const buffer = renderPluck(ctx, freq, PLUCK_DURATION);
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    // Shape the overall envelope
    const env = ctx.createGain();
    const now = ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.55, now + 0.003);
    env.gain.setValueAtTime(0.55, now + PLUCK_DURATION * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, now + PLUCK_DURATION);

    // Body resonance: a gentle peak around 400-500 Hz mimics the uke body
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 450;
    body.Q.value = 1.2;
    body.gain.value = 4;

    // Roll off harsh highs
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 8, 6000);
    lp.Q.value = 0.5;

    src.connect(env).connect(body).connect(lp).connect(ctx.destination);
    src.start(now);
    src.stop(now + PLUCK_DURATION);

    // House-keep finished sources
    const active = activeRef.current;
    active.push(src);
    src.onended = () => {
      const i = active.indexOf(src);
      if (i !== -1) active.splice(i, 1);
    };
    // If too many are stacked, fade out the oldest
    while (active.length > 6) {
      const old = active.shift()!;
      old.stop();
    }
  }, []);

  return { playNote };
}
