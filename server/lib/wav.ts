import { readFileSync, writeFileSync } from "node:fs";

export interface PcmWav {
  sampleRate: number;
  channels: number;
  samples: Float32Array;
}

export function readWav(path: string): PcmWav {
  const buf = readFileSync(path);
  if (buf.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error(`${path} is not a WAV file`);
  }
  let offset = 12;
  let sampleRate = 24000;
  let channels = 1;
  let bits = 16;
  let data: Buffer = buf.subarray(44);

  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (id === "fmt ") {
      channels = buf.readUInt16LE(start + 2);
      sampleRate = buf.readUInt32LE(start + 4);
      bits = buf.readUInt16LE(start + 14);
    } else if (id === "data") {
      data = buf.subarray(start, start + size);
      break;
    }
    offset = start + size + (size % 2);
  }

  const bytes = bits / 8;
  const count = Math.floor(data.length / bytes);
  const samples = new Float32Array(count);
  if (bits === 16) {
    for (let i = 0; i < count; i += 1) samples[i] = data.readInt16LE(i * 2) / 32768;
  } else if (bits === 8) {
    for (let i = 0; i < count; i += 1) samples[i] = (data[i]! - 128) / 128;
  } else if (bits === 24) {
    for (let i = 0; i < count; i += 1) {
      const b0 = data[i * 3]!;
      const b1 = data[i * 3 + 1]!;
      const b2 = data[i * 3 + 2]!;
      let v = b0 | (b1 << 8) | (b2 << 16);
      if (v & 0x800000) v |= ~0xffffff;
      samples[i] = v / 8388608;
    }
  } else {
    throw new Error(`Unsupported WAV bit depth ${bits} in ${path}`);
  }

  if (channels > 1) {
    const mono = new Float32Array(Math.floor(samples.length / channels));
    for (let i = 0; i < mono.length; i += 1) {
      let sum = 0;
      for (let c = 0; c < channels; c += 1) sum += samples[i * channels + c] ?? 0;
      mono[i] = sum / channels;
    }
    return { sampleRate, channels: 1, samples: mono };
  }

  return { sampleRate, channels: 1, samples };
}

export function writeWav(path: string, samples: Float32Array, sampleRate = 24000): void {
  const pcm = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i] ?? 0));
    pcm.writeInt16LE(Math.round(s * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  writeFileSync(path, Buffer.concat([header, pcm]));
}

export function durationMsFromWav(path: string): number {
  try {
    const wav = readWav(path);
    return Math.round((wav.samples.length / wav.sampleRate) * 1000);
  } catch {
    return 0;
  }
}

export function meanDbFromWav(path: string): number | null {
  try {
    const { samples } = readWav(path);
    if (samples.length === 0) return -100;
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) sum += (samples[i] ?? 0) ** 2;
    const rms = Math.sqrt(sum / samples.length);
    if (rms < 1e-9) return -100;
    return 20 * Math.log10(rms);
  } catch {
    return null;
  }
}

export function resample(samples: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return samples;
  const ratio = to / from;
  const out = new Float32Array(Math.max(1, Math.round(samples.length * ratio)));
  for (let i = 0; i < out.length; i += 1) {
    const src = i / ratio;
    const i0 = Math.floor(src);
    const i1 = Math.min(samples.length - 1, i0 + 1);
    const t = src - i0;
    out[i] = (samples[i0] ?? 0) * (1 - t) + (samples[i1] ?? 0) * t;
  }
  return out;
}

export function concatWithGaps(parts: Float32Array[], gapSamples: number): Float32Array {
  const gap = new Float32Array(gapSamples);
  let total = 0;
  parts.forEach((p, i) => {
    total += p.length;
    if (i < parts.length - 1) total += gap.length;
  });
  const out = new Float32Array(total);
  let cursor = 0;
  parts.forEach((p, i) => {
    out.set(p, cursor);
    cursor += p.length;
    if (i < parts.length - 1) cursor += gap.length;
  });
  return out;
}

export function overlayAt(
  dest: Float32Array,
  src: Float32Array,
  atSample: number,
  gain = 0.55,
): void {
  for (let i = 0; i < src.length; i += 1) {
    const idx = atSample + i;
    if (idx < 0 || idx >= dest.length) continue;
    dest[idx] = (dest[idx] ?? 0) + (src[i] ?? 0) * gain;
  }
}

export function loopOverlay(dest: Float32Array, src: Float32Array, gain = 0.18): void {
  if (src.length === 0) return;
  for (let i = 0; i < dest.length; i += 1) {
    dest[i] = (dest[i] ?? 0) + (src[i % src.length] ?? 0) * gain;
  }
}

export function fade(samples: Float32Array, fadeSamples: number): Float32Array {
  const n = samples.length;
  const f = Math.min(fadeSamples, Math.floor(n / 2));
  for (let i = 0; i < f; i += 1) {
    const g = i / f;
    samples[i] = (samples[i] ?? 0) * g;
    samples[n - 1 - i] = (samples[n - 1 - i] ?? 0) * g;
  }
  return samples;
}

export function peakNormalize(samples: Float32Array, peak = 0.16): Float32Array {
  let max = 0;
  for (let i = 0; i < samples.length; i += 1) max = Math.max(max, Math.abs(samples[i] ?? 0));
  if (max < 1e-6) return samples;
  const g = peak / max;
  for (let i = 0; i < samples.length; i += 1) samples[i] = (samples[i] ?? 0) * g;
  return samples;
}

export function silence(samples: number): Float32Array {
  return new Float32Array(samples);
}
