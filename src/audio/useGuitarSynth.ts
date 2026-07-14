import { useCallback, useRef } from 'react';
import type { NoteName } from '../theory/notes';
import { noteToFrequency } from '../theory/notes';
import { getSharedAudioContext } from './sharedAudioContext';

/**
 * Karplus-Strong–style plucked steel string, rendered offline into a buffer
 * (same technique as useUkeSynth/useBassSynth) but tuned brighter and with
 * longer sustain than the uke synth -- a steel-string guitar rings out
 * longer and has more high-end shimmer than nylon uke strings.
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
  // A single light smoothing pass -- steel strings have a crisper attack
  // than nylon, so we soften the noise seed less than the uke synth does.
  for (let i = 1; i < period; i++) {
    line[i] = line[i] * 0.5 + line[i - 1] * 0.5;
  }

  // Steel strings ring out noticeably longer than nylon uke strings.
  const decay = 0.9975;
  // Brighter than the uke/bass synths for that metallic steel-string shimmer.
  const brightness = 0.55;

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

const PLUCK_DURATION = 2.2;

export function useGuitarSynth() {
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
    env.gain.linearRampToValueAtTime(0.6, now + 0.004);
    env.gain.setValueAtTime(0.6, now + PLUCK_DURATION * 0.6);
    env.gain.exponentialRampToValueAtTime(0.001, now + PLUCK_DURATION);

    // Body resonance around 200 Hz gives a steel-string acoustic-guitar-like warmth.
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 200;
    body.Q.value = 1.0;
    body.gain.value = 5;

    // Higher cutoff than the uke synth so the steel-string shimmer comes through.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = Math.min(freq * 9, 7500);
    lp.Q.value = 0.5;

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
