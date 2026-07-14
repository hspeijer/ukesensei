import FFT from 'fft.js';
import { readWav } from './wavReader.js';
import type { AnalysisResult, StringAnalysisFrame } from '../types.js';

const WINDOW_SIZE = 2048;
const HOP_SIZE = 512;
const BAND_WIDTH_HZ = 15;

interface TuningConfig {
  strings: { name: string; fundamental: number; harmonics: number[] }[];
}

const TUNINGS: Record<string, TuningConfig> = {
  low_g: {
    strings: [
      { name: 'G', fundamental: 196, harmonics: [392, 588, 784] },
      { name: 'C', fundamental: 262, harmonics: [524, 786, 1048] },
      { name: 'E', fundamental: 330, harmonics: [660, 990, 1320] },
      { name: 'A', fundamental: 440, harmonics: [880, 1320, 1760] },
    ],
  },
  standard: {
    strings: [
      { name: 'G', fundamental: 392, harmonics: [784, 1176, 1568] },
      { name: 'C', fundamental: 262, harmonics: [524, 786, 1048] },
      { name: 'E', fundamental: 330, harmonics: [660, 990, 1320] },
      { name: 'A', fundamental: 440, harmonics: [880, 1320, 1760] },
    ],
  },
  bass_standard: {
    strings: [
      { name: 'G', fundamental: 98, harmonics: [196, 294, 392] },
      { name: 'D', fundamental: 73.4, harmonics: [146.8, 220.2, 293.6] },
      { name: 'A', fundamental: 55, harmonics: [110, 165, 220] },
      { name: 'E', fundamental: 41.2, harmonics: [82.4, 123.6, 164.8] },
    ],
  },
};

function hannWindow(size: number): Float32Array {
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
}

function bandEnergy(
  magnitudes: Float32Array,
  freqResolution: number,
  centerFreq: number,
  bandwidth: number,
): number {
  const lowBin = Math.max(0, Math.floor((centerFreq - bandwidth) / freqResolution));
  const highBin = Math.min(magnitudes.length - 1, Math.ceil((centerFreq + bandwidth) / freqResolution));
  let energy = 0;
  for (let i = lowBin; i <= highBin; i++) {
    energy += magnitudes[i] * magnitudes[i];
  }
  return energy;
}

export function analyzeAudio(
  audioBuffer: Buffer,
  tuningKey: string = 'low_g',
): AnalysisResult {
  const wav = readWav(audioBuffer);
  const { samples, sampleRate } = wav;

  const tuning = TUNINGS[tuningKey] ?? TUNINGS.low_g;
  const fft = new FFT(WINDOW_SIZE);
  const window = hannWindow(WINDOW_SIZE);
  const freqResolution = sampleRate / WINDOW_SIZE;

  const frames: StringAnalysisFrame[] = [];
  const numFrames = Math.floor((samples.length - WINDOW_SIZE) / HOP_SIZE) + 1;

  let maxEnergies = [0, 0, 0, 0];

  for (let frameIdx = 0; frameIdx < numFrames; frameIdx++) {
    const start = frameIdx * HOP_SIZE;
    const time = start / sampleRate;

    const windowed = new Float32Array(WINDOW_SIZE);
    let rmsSum = 0;
    for (let i = 0; i < WINDOW_SIZE; i++) {
      const s = start + i < samples.length ? samples[start + i] : 0;
      windowed[i] = s * window[i];
      rmsSum += s * s;
    }
    const rms = Math.sqrt(rmsSum / WINDOW_SIZE);

    const input = fft.createComplexArray();
    const output = fft.createComplexArray();
    fft.toComplexArray(windowed as unknown as number[], input);
    fft.transform(output, input);

    const magnitudes = new Float32Array(WINDOW_SIZE / 2);
    for (let i = 0; i < WINDOW_SIZE / 2; i++) {
      const re = output[2 * i];
      const im = output[2 * i + 1];
      magnitudes[i] = Math.sqrt(re * re + im * im);
    }

    const stringEnergies: [number, number, number, number] = [0, 0, 0, 0];
    for (let si = 0; si < 4; si++) {
      const str = tuning.strings[si];
      let energy = bandEnergy(magnitudes, freqResolution, str.fundamental, BAND_WIDTH_HZ);
      for (const harmonic of str.harmonics) {
        energy += bandEnergy(magnitudes, freqResolution, harmonic, BAND_WIDTH_HZ) * 0.5;
      }
      stringEnergies[si] = energy;
      if (energy > maxEnergies[si]) maxEnergies[si] = energy;
    }

    frames.push({ time, strings: stringEnergies, rms });
  }

  // Normalize energies to 0-1
  for (const frame of frames) {
    for (let si = 0; si < 4; si++) {
      frame.strings[si] = maxEnergies[si] > 0
        ? frame.strings[si] / maxEnergies[si]
        : 0;
    }
  }

  // Normalize RMS
  const maxRms = Math.max(...frames.map((f) => f.rms), 0.001);
  for (const frame of frames) {
    frame.rms = frame.rms / maxRms;
  }

  return {
    sessionId: '',
    sampleRate,
    hopSize: HOP_SIZE,
    frameCount: frames.length,
    durationSec: samples.length / sampleRate,
    tuningKey,
    frames,
  };
}
