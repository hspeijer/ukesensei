import { useRef, useEffect, useCallback, useState } from 'react';

interface PlaybackFftVisualizerProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  height?: number;
}

const NOTE_FREQUENCIES: { note: string; freq: number }[] = [
  { note: 'C2', freq: 65.41 },
  { note: 'G2', freq: 98.0 },
  { note: 'C3', freq: 130.81 },
  { note: 'G3', freq: 196.0 },
  { note: 'C4', freq: 261.63 },
  { note: 'E4', freq: 329.63 },
  { note: 'A4', freq: 440.0 },
  { note: 'C5', freq: 523.25 },
  { note: 'E5', freq: 659.25 },
  { note: 'A5', freq: 880.0 },
  { note: 'C6', freq: 1046.5 },
];

const FFT_SIZE = 4096;

// Radix-2 Cooley-Tukey in-place FFT — O(n log n) instead of O(n²)
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);
    for (let i = 0; i < n; i += len) {
      let cRe = 1, cIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tRe = cRe * re[b] - cIm * im[b];
        const tIm = cRe * im[b] + cIm * re[b];
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const nRe = cRe * wRe - cIm * wIm;
        cIm = cRe * wIm + cIm * wRe;
        cRe = nRe;
      }
    }
  }
}

export function PlaybackFftVisualizer({
  audioUrl,
  currentTime,
  height = 120,
}: PlaybackFftVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const fetchedRef = useRef('');

  useEffect(() => {
    if (!audioUrl || fetchedRef.current === audioUrl) return;
    fetchedRef.current = audioUrl;
    setLoaded(false);

    (async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = new OfflineAudioContext(1, 1, 44100);
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decoded;
        setLoaded(true);
      } catch (err) {
        console.warn('Failed to decode audio for FFT:', err);
      }
    })();
  }, [audioUrl]);

  const computeAndDraw = useCallback(() => {
    const canvas = canvasRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const samples = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const startSample = Math.floor(currentTime * sampleRate);
    const fftSize = FFT_SIZE;

    if (startSample + fftSize > samples.length) return;

    // Hann window → real part; imaginary starts at zero
    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
      re[i] = (samples[startSample + i] ?? 0) * win;
    }

    fftInPlace(re, im);

    // Compute magnitudes for the bins we care about
    const minFreq = 60;
    const maxFreq = 1200;
    const binHz = sampleRate / fftSize;
    const minBin = Math.floor(minFreq / binHz);
    const maxBin = Math.min(Math.ceil(maxFreq / binHz), fftSize / 2 - 1);

    const magnitudes = new Float32Array(fftSize / 2);
    let maxMag = 0;
    for (let k = minBin; k <= maxBin; k++) {
      magnitudes[k] = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / fftSize;
      if (magnitudes[k] > maxMag) maxMag = magnitudes[k];
    }
    if (maxMag < 0.0001) maxMag = 1;

    // Draw
    const logMin = Math.log2(minFreq);
    const logMax = Math.log2(maxFreq);
    const freqToX = (f: number) => {
      const logF = Math.log2(Math.max(f, minFreq));
      return ((logF - logMin) / (logMax - logMin)) * w;
    };

    const style = getComputedStyle(canvas);
    const accentColor = style.getPropertyValue('--c-accent').trim() || '#14b8a6';
    const mutedColor = style.getPropertyValue('--c-text-muted').trim() || '#666';
    const borderColor = style.getPropertyValue('--c-border').trim() || '#333';

    // Grid lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    ctx.font = '9px system-ui, sans-serif';
    ctx.fillStyle = mutedColor;
    ctx.textAlign = 'center';

    for (const { note, freq } of NOTE_FREQUENCIES) {
      if (freq < minFreq || freq > maxFreq) continue;
      const x = freqToX(freq);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h - 14);
      ctx.stroke();
      ctx.fillText(note, x, h - 3);
    }

    // Spectrum bars
    const barWidth = Math.max(1.5, w / 180);
    const gradient = ctx.createLinearGradient(0, h - 14, 0, 0);
    gradient.addColorStop(0, accentColor + '40');
    gradient.addColorStop(0.5, accentColor + 'b0');
    gradient.addColorStop(1, accentColor);
    ctx.fillStyle = gradient;

    for (let k = minBin; k <= maxBin; k++) {
      const freq = k * binHz;
      const x = freqToX(freq);
      const val = magnitudes[k] / maxMag;
      const barH = val * (h - 16);
      if (barH > 0.5) {
        ctx.fillRect(x - barWidth / 2, h - 14 - barH, barWidth, barH);
      }
    }

    // Peak indicator
    let peakBin = minBin;
    let peakVal = 0;
    for (let k = minBin; k <= maxBin; k++) {
      if (magnitudes[k] > peakVal) {
        peakVal = magnitudes[k];
        peakBin = k;
      }
    }

    if (peakVal / maxMag > 0.1) {
      const peakFreq = peakBin * binHz;
      const px = freqToX(peakFreq);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h - 14);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = accentColor;
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(peakFreq)} Hz`, px, 10);
    }
  }, [currentTime]);

  useEffect(() => {
    if (loaded) computeAndDraw();
  }, [loaded, currentTime, computeAndDraw]);

  if (!loaded) {
    return (
      <div style={{ height }} className="rounded-md bg-[var(--c-bg)] flex items-center justify-center">
        <span className="text-[10px] text-[var(--c-text-muted)]">Loading audio…</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height }}
      className="block rounded-md"
    />
  );
}
