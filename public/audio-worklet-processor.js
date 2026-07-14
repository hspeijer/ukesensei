/**
 * AudioWorklet processor that uses the WASM audio engine for pitch detection.
 * Runs in a separate thread for low-latency real-time analysis.
 */

const DEFAULT_ANALYSIS_SIZE = 2048;

class WasmPitchProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.wasm = null;
    this.samplePtr = null;
    this.analysisSize = DEFAULT_ANALYSIS_SIZE;
    this.ringBuffer = new Float32Array(this.analysisSize);
    this.writePos = 0;
    this.sampleRate = sampleRate; // global in worklet scope
    this.frameCount = 0;
    this.analyzeEveryN = 4; // analyze every Nth render quantum (~5.8ms * 4 ≈ 23ms)
    this.gain = 1.0;

    this.port.onmessage = (e) => {
      if (e.data.type === 'wasm-binary') {
        this._initWasm(e.data.binary, e.data.analysisSize);
      } else if (e.data.type === 'set-gain') {
        this.gain = e.data.gain;
      }
    };
  }

  async _initWasm(binary, analysisSize) {
    try {
      this.analysisSize = analysisSize || DEFAULT_ANALYSIS_SIZE;
      this.ringBuffer = new Float32Array(this.analysisSize);
      this.writePos = 0;

      const module = await WebAssembly.compile(binary);
      const instance = await WebAssembly.instantiate(module);
      this.wasm = instance.exports;
      this.wasm.init(this.sampleRate, this.analysisSize);
      this.samplePtr = this.wasm.alloc(this.analysisSize);
      this.port.postMessage({ type: 'ready' });
    } catch (err) {
      this.port.postMessage({ type: 'error', message: String(err) });
    }
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    const size = this.analysisSize;

    for (let i = 0; i < channelData.length; i++) {
      this.ringBuffer[this.writePos] = channelData[i] * this.gain;
      this.writePos = (this.writePos + 1) % size;
    }

    this.frameCount++;
    if (this.frameCount < this.analyzeEveryN) return true;
    this.frameCount = 0;

    if (!this.wasm || !this.samplePtr) return true;

    const mem = new Float32Array(
      this.wasm.memory.buffer,
      this.samplePtr,
      size,
    );

    // Unroll ring buffer into contiguous memory
    const readStart = this.writePos;
    for (let i = 0; i < size; i++) {
      mem[i] = this.ringBuffer[(readStart + i) % size];
    }

    const resultPtr = this.wasm.analyze_pitch();
    // PitchResult: { f32 frequency, f32 clarity, u8 midi_note, f32 cents, f32 rms }
    // Layout: [freq:4][clarity:4][midi_note:1][pad:3][cents:4][rms:4] = 20 bytes
    const view = new DataView(this.wasm.memory.buffer, resultPtr, 20);
    const frequency = view.getFloat32(0, true);
    const clarity = view.getFloat32(4, true);
    const midiNote = view.getUint8(8);
    const cents = view.getFloat32(12, true);
    const rms = view.getFloat32(16, true);

    this.port.postMessage({
      type: 'pitch',
      frequency,
      clarity,
      midiNote,
      cents,
      rms,
    });

    return true;
  }
}

registerProcessor('wasm-pitch-processor', WasmPitchProcessor);
