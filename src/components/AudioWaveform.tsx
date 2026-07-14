import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  width: number;
  height: number;
  onSeek?: (time: number) => void;
}

export function AudioWaveform({
  audioUrl,
  currentTime,
  duration,
  width,
  height,
  onSeek,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const samplesRef = useRef<Float32Array | null>(null);
  const fetchedUrlRef = useRef('');

  useEffect(() => {
    if (!audioUrl || fetchedUrlRef.current === audioUrl) return;
    fetchedUrlRef.current = audioUrl;

    (async () => {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        samplesRef.current = audioBuffer.getChannelData(0);
        ctx.close();
        drawWaveform();
      } catch (err) {
        console.warn('Failed to decode audio for waveform:', err);
      }
    })();
  }, [audioUrl]);

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const samples = samplesRef.current;
    if (!canvas || !samples || samples.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--c-bg').trim() || '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 6);
    ctx.fill();

    const samplesPerPixel = Math.floor(samples.length / width);
    const mid = height / 2;

    // Draw waveform
    ctx.fillStyle = '#2dd4bf';
    ctx.globalAlpha = 0.5;

    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, samples.length);

      let min = 0;
      let max = 0;
      for (let i = start; i < end; i++) {
        if (samples[i] < min) min = samples[i];
        if (samples[i] > max) max = samples[i];
      }

      const top = mid - max * mid;
      const bottom = mid - min * mid;
      const barHeight = Math.max(1, bottom - top);
      ctx.fillRect(x, top, 1, barHeight);
    }

    ctx.globalAlpha = 1.0;

    // Center line
    ctx.strokeStyle = '#2dd4bf';
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(width, mid);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  };

  // Redraw when width changes
  useEffect(() => {
    drawWaveform();
  }, [width]);

  // Draw cursor on top
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawWaveform();

    if (duration > 0 && currentTime > 0) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);

      const cursorX = (currentTime / duration) * width;
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
    }
  }, [currentTime, duration, width]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block cursor-pointer rounded-md"
      style={{ width, height }}
      onClick={handleClick}
    />
  );
}
