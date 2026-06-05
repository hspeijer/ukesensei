import { useRef, useCallback, useState, useEffect } from 'react';

interface MicrophoneState {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  gainNode: GainNode | null;
  stream: MediaStream | null;
}

export function useMicrophone() {
  const stateRef = useRef<MicrophoneState>({
    audioContext: null,
    analyser: null,
    gainNode: null,
    stream: null,
  });
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGainState] = useState(1.0);

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
      const source = audioContext.createMediaStreamSource(stream);

      const gainNode = audioContext.createGain();
      gainNode.gain.value = gain;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(gainNode);
      gainNode.connect(analyser);

      stateRef.current = { audioContext, analyser, gainNode, stream };
      setIsActive(true);
    } catch (err) {
      setError(
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow access in your browser settings.'
          : 'Could not access microphone.',
      );
    }
  }, [gain]);

  const stop = useCallback(() => {
    const { audioContext, stream } = stateRef.current;
    stream?.getTracks().forEach((t) => t.stop());
    audioContext?.close();
    stateRef.current = { audioContext: null, analyser: null, gainNode: null, stream: null };
    setIsActive(false);
  }, []);

  const setGain = useCallback((value: number) => {
    setGainState(value);
    const { gainNode } = stateRef.current;
    if (gainNode) {
      gainNode.gain.value = value;
    }
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    error,
    gain,
    setGain,
    start,
    stop,
    getAnalyser: () => stateRef.current.analyser,
    getSampleRate: () => stateRef.current.audioContext?.sampleRate ?? 44100,
    getStream: () => stateRef.current.stream,
  };
}
