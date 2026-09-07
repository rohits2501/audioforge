import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SFX_DIR } from "../server/lib/paths";

const RATE = 24000;

function wav(samples: Float32Array): Buffer {
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
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

function noise(n: number, amp = 0.2): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = (Math.random() * 2 - 1) * amp;
  return out;
}

function env(samples: Float32Array, attack: number, release: number): Float32Array {
  const n = samples.length;
  const a = Math.floor(n * attack);
  const r = Math.floor(n * release);
  for (let i = 0; i < n; i += 1) {
    let g = 1;
    if (i < a) g = i / Math.max(1, a);
    if (i > n - r) g = (n - i) / Math.max(1, r);
    samples[i] = (samples[i] ?? 0) * g;
  }
  return samples;
}

function sine(n: number, freq: number, amp = 0.4): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i += 1) out[i] = Math.sin((2 * Math.PI * freq * i) / RATE) * amp;
  return out;
}

function mix(...parts: Float32Array[]): Float32Array {
  const n = Math.max(...parts.map((p) => p.length));
  const out = new Float32Array(n);
  for (const p of parts) {
    for (let i = 0; i < p.length; i += 1) out[i] = (out[i] ?? 0) + (p[i] ?? 0);
  }
  return out;
}

function seconds(s: number): number {
  return Math.round(s * RATE);
}

const clips: Record<string, () => Float32Array> = {
  "door.wav": () => env(mix(sine(seconds(0.35), 80, 0.5), noise(seconds(0.35), 0.15)), 0.02, 0.5),
  "footsteps.wav": () => {
    const out = new Float32Array(seconds(1.2));
    for (const at of [0.05, 0.45, 0.85]) {
      const start = seconds(at);
      const thud = env(mix(sine(seconds(0.12), 90, 0.35), noise(seconds(0.12), 0.1)), 0.05, 0.6);
      out.set(thud, start);
    }
    return out;
  },
  "rain.wav": () => env(noise(seconds(4), 0.18), 0.1, 0.1),
  "thunder.wav": () => env(mix(sine(seconds(1.8), 55, 0.45), noise(seconds(1.8), 0.25)), 0.01, 0.7),
  "phone.wav": () => {
    const out = new Float32Array(seconds(1.6));
    const ring = mix(sine(seconds(0.35), 480, 0.2), sine(seconds(0.35), 440, 0.2));
    out.set(ring, 0);
    out.set(ring, seconds(0.7));
    return out;
  },
  "knock.wav": () => {
    const out = new Float32Array(seconds(1.1));
    for (const at of [0.05, 0.28, 0.5]) {
      out.set(env(mix(sine(seconds(0.1), 140, 0.4), noise(seconds(0.1), 0.08)), 0.02, 0.7), seconds(at));
    }
    return out;
  },
  "crowd.wav": () => env(noise(seconds(3), 0.14), 0.15, 0.15),
  "car.wav": () => env(mix(sine(seconds(2), 70, 0.3), noise(seconds(2), 0.12)), 0.2, 0.3),
  "glass.wav": () => env(mix(sine(seconds(0.6), 1800, 0.25), sine(seconds(0.6), 2400, 0.12)), 0.01, 0.85),
  "gunshot.wav": () => env(mix(sine(seconds(0.25), 90, 0.6), noise(seconds(0.25), 0.4)), 0.005, 0.8),
  "heartbeat.wav": () => {
    const out = new Float32Array(seconds(1.4));
    out.set(env(sine(seconds(0.12), 60, 0.5), 0.05, 0.6), seconds(0.1));
    out.set(env(sine(seconds(0.1), 70, 0.35), 0.05, 0.6), seconds(0.32));
    out.set(env(sine(seconds(0.12), 60, 0.5), 0.05, 0.6), seconds(0.9));
    return out;
  },
  "wind.wav": () => env(noise(seconds(4), 0.12), 0.2, 0.2),
};

function main() {
  mkdirSync(SFX_DIR, { recursive: true });
  for (const [name, build] of Object.entries(clips)) {
    writeFileSync(join(SFX_DIR, name), wav(build()));
    console.log(`wrote sfx/${name}`);
  }
}

main();
