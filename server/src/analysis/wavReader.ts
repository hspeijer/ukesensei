export interface WavData {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  samples: Float32Array;
}

export function readWav(buffer: Buffer): WavData {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (riff !== 'RIFF') throw new Error('Not a WAV file: missing RIFF header');

  const wave = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if (wave !== 'WAVE') throw new Error('Not a WAV file: missing WAVE format');

  let offset = 12;
  let channels = 1;
  let sampleRate = 44100;
  let bitDepth = 16;
  let dataStart = 0;
  let dataSize = 0;

  while (offset < view.byteLength - 8) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset), view.getUint8(offset + 1),
      view.getUint8(offset + 2), view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === 'fmt ') {
      channels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitDepth = view.getUint16(offset + 22, true);
    } else if (chunkId === 'data') {
      dataStart = offset + 8;
      dataSize = chunkSize;
      break;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }

  if (dataStart === 0) throw new Error('No data chunk found in WAV');

  const bytesPerSample = bitDepth / 8;
  const totalSamples = Math.floor(dataSize / bytesPerSample);
  const monoSamples = Math.floor(totalSamples / channels);
  const samples = new Float32Array(monoSamples);

  for (let i = 0; i < monoSamples; i++) {
    let sum = 0;
    for (let ch = 0; ch < channels; ch++) {
      const byteOffset = dataStart + (i * channels + ch) * bytesPerSample;
      if (byteOffset + bytesPerSample > view.byteLength) break;

      if (bitDepth === 16) {
        sum += view.getInt16(byteOffset, true) / 32768;
      } else if (bitDepth === 32) {
        sum += view.getFloat32(byteOffset, true);
      } else if (bitDepth === 24) {
        const b0 = view.getUint8(byteOffset);
        const b1 = view.getUint8(byteOffset + 1);
        const b2 = view.getUint8(byteOffset + 2);
        let val = (b2 << 16) | (b1 << 8) | b0;
        if (val >= 0x800000) val -= 0x1000000;
        sum += val / 8388608;
      }
    }
    samples[i] = sum / channels;
  }

  return { sampleRate, channels, bitDepth, samples };
}
