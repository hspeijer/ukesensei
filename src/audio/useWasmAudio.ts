import { useRef, useCallback, useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CHROMATIC_NOTES, type NoteName } from '../theory/notes';
import { findNotePositions, generateFretboard, TUNINGS } from '../theory/fretboard';
import { detectTuningFromNote } from './noteUtils';

const MIN_CLARITY = 0.85;
const MIN_FREQUENCY = 175;
const MAX_FREQUENCY = 1200;
const LEVEL_SMOOTHING = 0.3;

const CHORD_QUALITIES = [
  'major', 'minor', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4',
] as const;

const CHORD_SUFFIXES: Record<string, string> = {
  major: '', minor: 'm', dom7: '7', maj7: 'maj7', min7: 'm7',
  dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
};

const fretboards = {
  standard: generateFretboard(TUNINGS.standard),
  low_g: generateFretboard(TUNINGS.low_g),
};

interface WasmAudioState {
  audioContext: AudioContext | null;
  workletNode: AudioWorkletNode | null;
  stream: MediaStream | null;
  gainNode: GainNode | null;
  analyser: AnalyserNode | null;
  sourceNode: MediaStreamAudioSourceNode | null;
}

export function useWasmAudio() {
  const stateRef = useRef<WasmAudioState>({
    audioContext: null,
    workletNode: null,
    stream: null,
    gainNode: null,
    analyser: null,
    sourceNode: null,
  });

  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGainState] = useState(1.0);
  const [wasmReady, setWasmReady] = useState(false);
  const smoothedLevelRef = useRef(0);
  const tuningAutoRef = useRef({ lowGCount: 0, highGCount: 0 });

  const setDetectedNote = useAppStore((s) => s.setDetectedNote);
  const setAudioLevel = useAppStore((s) => s.setAudioLevel);
  const tuningKeyRef = useRef(useAppStore.getState().tuningKey);

  useEffect(() => {
    return useAppStore.subscribe((state) => {
      tuningKeyRef.current = state.tuningKey;
    });
  }, []);

  const setTuning = useAppStore((s) => s.setTuning);
  const setTuningAutoDetected = useAppStore((s) => s.setTuningAutoDetected);

  const handleWorkletMessage = useCallback((e: MessageEvent) => {
    const data = e.data;
    if (data.type === 'ready') {
      setWasmReady(true);
      return;
    }
    if (data.type === 'error') {
      setError(`WASM init failed: ${data.message}`);
      return;
    }
    if (data.type !== 'pitch') return;

    const { frequency, clarity, midiNote, cents, rms } = data;

    const dbFS = rms > 0 ? 20 * Math.log10(rms) : -100;
    const normalizedLevel = Math.max(0, Math.min(1, (dbFS + 60) / 60));
    smoothedLevelRef.current =
      smoothedLevelRef.current * LEVEL_SMOOTHING +
      normalizedLevel * (1 - LEVEL_SMOOTHING);
    setAudioLevel(smoothedLevelRef.current);

    if (frequency < MIN_FREQUENCY || frequency > MAX_FREQUENCY || clarity < MIN_CLARITY) {
      setDetectedNote(null);
      return;
    }

    const noteIndex = ((midiNote % 12) + 12) % 12;
    const note = CHROMATIC_NOTES[noteIndex] as NoteName;
    const octave = Math.floor(midiNote / 12) - 1;
    const tuningKey = tuningKeyRef.current;
    const fretboard = fretboards[tuningKey];
    const positions = findNotePositions(fretboard, note, octave);

    setDetectedNote({
      note,
      octave,
      frequency,
      clarity,
      cents,
      timestamp: Date.now(),
    });

    const detected = detectTuningFromNote(note, octave, frequency);
    if (detected) {
      const counts = tuningAutoRef.current;
      if (detected === 'low_g') counts.lowGCount++;
      else counts.highGCount++;

      const threshold = 3;
      if (counts.lowGCount >= threshold && detected === 'low_g' && tuningKey !== 'low_g') {
        setTuning('low_g');
        setTuningAutoDetected(true);
        counts.lowGCount = 0;
        counts.highGCount = 0;
      } else if (counts.highGCount >= threshold && detected === 'standard' && tuningKey !== 'standard') {
        setTuning('standard');
        setTuningAutoDetected(true);
        counts.lowGCount = 0;
        counts.highGCount = 0;
      }
    }
  }, [setDetectedNote, setAudioLevel, setTuning, setTuningAutoDetected]);

  const start = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioContext = new AudioContext();

      await audioContext.audioWorklet.addModule('/audio-worklet-processor.js');

      const wasmResponse = await fetch('/audio-engine.wasm');
      const wasmBinary = await wasmResponse.arrayBuffer();

      const workletNode = new AudioWorkletNode(audioContext, 'wasm-pitch-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: 1,
      });

      workletNode.port.onmessage = handleWorkletMessage;
      workletNode.port.postMessage({ type: 'wasm-binary', binary: wasmBinary }, [wasmBinary]);
      workletNode.port.postMessage({ type: 'set-gain', gain });

      const source = audioContext.createMediaStreamSource(stream);

      // Keep an AnalyserNode for the audio recorder and other consumers
      const gainNode = audioContext.createGain();
      gainNode.gain.value = gain;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(gainNode);
      gainNode.connect(workletNode);
      gainNode.connect(analyser);

      stateRef.current = {
        audioContext,
        workletNode,
        stream,
        gainNode,
        analyser,
        sourceNode: source,
      };
      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow access in your browser settings.'
          : `Could not initialize audio: ${err}`,
      );
    }
  }, [gain, handleWorkletMessage]);

  const stop = useCallback(() => {
    const { audioContext, stream, workletNode } = stateRef.current;
    if (workletNode) {
      workletNode.port.onmessage = null;
      workletNode.disconnect();
    }
    stream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    stateRef.current = {
      audioContext: null,
      workletNode: null,
      stream: null,
      gainNode: null,
      analyser: null,
      sourceNode: null,
    };
    setIsActive(false);
    setWasmReady(false);
    smoothedLevelRef.current = 0;
  }, []);

  const setGain = useCallback((value: number) => {
    setGainState(value);
    const { gainNode, workletNode } = stateRef.current;
    if (gainNode) gainNode.gain.value = value;
    if (workletNode) {
      workletNode.port.postMessage({ type: 'set-gain', gain: value });
    }
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return {
    isActive,
    error,
    gain,
    setGain,
    start,
    stop,
    wasmReady,
    getAnalyser: () => stateRef.current.analyser,
    getSampleRate: () => stateRef.current.audioContext?.sampleRate ?? 44100,
    getStream: () => stateRef.current.stream,
  };
}
