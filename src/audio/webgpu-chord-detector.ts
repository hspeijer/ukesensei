/**
 * WebGPU-accelerated chord detection using a compute shader.
 * Runs template matching across 12 root notes x 9 chord qualities = 108 combinations
 * in parallel on the GPU.
 *
 * Falls back to WASM chord detection if WebGPU is unavailable.
 */

const WGSL_SHADER = /* wgsl */`
struct ChordTemplate {
  intervals: array<u32, 4>,
  interval_count: u32,
  priority: f32,
  _pad: vec2<f32>,
}

struct ChordResult {
  root: u32,
  quality: u32,
  score: f32,
  _pad: f32,
}

@group(0) @binding(0) var<storage, read> chroma: array<f32, 12>;
@group(0) @binding(1) var<storage, read> templates: array<ChordTemplate, 9>;
@group(0) @binding(2) var<storage, read_write> results: array<ChordResult, 108>;

@compute @workgroup_size(9, 1, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let root = gid.y;
  let qi = gid.x;
  let idx = root * 9u + qi;

  let tmpl = templates[qi];
  let max_chroma = max(
    max(max(chroma[0], chroma[1]), max(chroma[2], chroma[3])),
    max(max(chroma[4], chroma[5]), max(chroma[6], chroma[7]))
  );
  let max_all = max(max_chroma, max(max(chroma[8], chroma[9]), max(chroma[10], chroma[11])));

  if (max_all < 0.01) {
    results[idx] = ChordResult(255u, 255u, -1.0, 0.0);
    return;
  }

  var norm: array<f32, 12>;
  for (var i = 0u; i < 12u; i++) {
    norm[i] = chroma[i] / max_all;
  }

  var template_energy = 0.0;
  var total_weight = 0.0;
  for (var i = 0u; i < tmpl.interval_count; i++) {
    let bin = (root + tmpl.intervals[i]) % 12u;
    let weight = select(1.0, 1.5, tmpl.intervals[i] == 0u);
    template_energy += norm[bin] * weight;
    total_weight += weight;
  }
  let match_ratio = template_energy / total_weight;

  var noise = 0.0;
  var noise_bins = 0u;
  for (var i = 0u; i < 12u; i++) {
    var is_template = false;
    for (var j = 0u; j < tmpl.interval_count; j++) {
      if ((root + tmpl.intervals[j]) % 12u == i) {
        is_template = true;
      }
    }
    if (!is_template && norm[i] > 0.1) {
      noise += norm[i];
      noise_bins += 1u;
    }
  }
  let noise_penalty = select(0.0, noise / f32(noise_bins + tmpl.interval_count), noise_bins > 0u);

  let root_bonus = select(0.0, 0.1, norm[root] > 0.5);
  let score = (match_ratio - noise_penalty * 0.5 + root_bonus) * tmpl.priority;

  results[idx] = ChordResult(root, qi, score, 0.0);
}
`;

const TEMPLATES = [
  { intervals: [0, 4, 7, 0],    count: 3, priority: 1.0  },  // major
  { intervals: [0, 3, 7, 0],    count: 3, priority: 0.95 },  // minor
  { intervals: [0, 4, 7, 10],   count: 4, priority: 0.85 },  // dom7
  { intervals: [0, 4, 7, 11],   count: 4, priority: 0.80 },  // maj7
  { intervals: [0, 3, 7, 10],   count: 4, priority: 0.80 },  // min7
  { intervals: [0, 3, 6, 0],    count: 3, priority: 0.60 },  // dim
  { intervals: [0, 4, 8, 0],    count: 3, priority: 0.60 },  // aug
  { intervals: [0, 2, 7, 0],    count: 3, priority: 0.70 },  // sus2
  { intervals: [0, 5, 7, 0],    count: 3, priority: 0.70 },  // sus4
];

const QUALITY_NAMES = [
  'major', 'minor', 'dom7', 'maj7', 'min7', 'dim', 'aug', 'sus2', 'sus4',
];

const QUALITY_SUFFIXES: Record<string, string> = {
  major: '', minor: 'm', dom7: '7', maj7: 'maj7', min7: 'm7',
  dim: 'dim', aug: 'aug', sus2: 'sus2', sus4: 'sus4',
};

export interface GpuChordResult {
  root: number;       // 0-11 (C=0, C#=1, ...)
  quality: string;    // e.g. 'major', 'minor'
  suffix: string;     // e.g. '', 'm', '7'
  confidence: number;
}

export class WebGpuChordDetector {
  private device: GPUDevice | null = null;
  private pipeline: GPUComputePipeline | null = null;
  private chromaBuffer: GPUBuffer | null = null;
  private templateBuffer: GPUBuffer | null = null;
  private resultBuffer: GPUBuffer | null = null;
  private readBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private _ready = false;

  get ready() { return this._ready; }

  async init(): Promise<boolean> {
    if (!navigator.gpu) return false;

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return false;

      this.device = await adapter.requestDevice();

      const module = this.device.createShaderModule({ code: WGSL_SHADER });

      this.pipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: { module, entryPoint: 'main' },
      });

      // Chroma input: 12 x f32
      this.chromaBuffer = this.device.createBuffer({
        size: 12 * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });

      // Templates: 9 structs, each 32 bytes (4 u32 intervals + 1 u32 count + 1 f32 priority + 2 f32 pad)
      const templateData = new ArrayBuffer(9 * 32);
      const tdv = new DataView(templateData);
      for (let i = 0; i < 9; i++) {
        const offset = i * 32;
        for (let j = 0; j < 4; j++) {
          tdv.setUint32(offset + j * 4, TEMPLATES[i].intervals[j], true);
        }
        tdv.setUint32(offset + 16, TEMPLATES[i].count, true);
        tdv.setFloat32(offset + 20, TEMPLATES[i].priority, true);
        tdv.setFloat32(offset + 24, 0, true); // pad
        tdv.setFloat32(offset + 28, 0, true); // pad
      }

      this.templateBuffer = this.device.createBuffer({
        size: templateData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.device.queue.writeBuffer(this.templateBuffer, 0, templateData);

      // Results: 108 structs, each 16 bytes (u32 root + u32 quality + f32 score + f32 pad)
      this.resultBuffer = this.device.createBuffer({
        size: 108 * 16,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });

      this.readBuffer = this.device.createBuffer({
        size: 108 * 16,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      });

      this.bindGroup = this.device.createBindGroup({
        layout: this.pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: this.chromaBuffer } },
          { binding: 1, resource: { buffer: this.templateBuffer } },
          { binding: 2, resource: { buffer: this.resultBuffer } },
        ],
      });

      this._ready = true;
      return true;
    } catch {
      return false;
    }
  }

  async detect(chroma: Float32Array): Promise<GpuChordResult | null> {
    if (!this._ready || !this.device || !this.pipeline || !this.chromaBuffer ||
        !this.resultBuffer || !this.readBuffer || !this.bindGroup) {
      return null;
    }

    this.device.queue.writeBuffer(this.chromaBuffer, 0, chroma);

    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.dispatchWorkgroups(1, 12, 1); // 9 threads per workgroup, 12 workgroups
    pass.end();

    encoder.copyBufferToBuffer(this.resultBuffer, 0, this.readBuffer, 0, 108 * 16);
    this.device.queue.submit([encoder.finish()]);

    await this.readBuffer.mapAsync(GPUMapMode.READ);
    const data = new DataView(this.readBuffer.getMappedRange().slice(0));
    this.readBuffer.unmap();

    let bestRoot = 255;
    let bestQuality = 255;
    let bestScore = -1;

    for (let i = 0; i < 108; i++) {
      const offset = i * 16;
      const score = data.getFloat32(offset + 8, true);
      if (score > bestScore) {
        bestScore = score;
        bestRoot = data.getUint32(offset, true);
        bestQuality = data.getUint32(offset + 4, true);
      }
    }

    if (bestScore < 0.3 || bestRoot > 11 || bestQuality > 8) {
      return null;
    }

    const qualityName = QUALITY_NAMES[bestQuality];
    return {
      root: bestRoot,
      quality: qualityName,
      suffix: QUALITY_SUFFIXES[qualityName] ?? '',
      confidence: bestScore,
    };
  }

  destroy() {
    this.chromaBuffer?.destroy();
    this.templateBuffer?.destroy();
    this.resultBuffer?.destroy();
    this.readBuffer?.destroy();
    this.device?.destroy();
    this._ready = false;
  }
}
