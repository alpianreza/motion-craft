// Isomorphic deterministic procedural SFX synthesizer (Browser WebAudio + Node WAV)

export const SAMPLE_RATE = 44100;

export const SFX_TYPES = [
  'pop',
  'whoosh',
  'scribble',
  'stamp',
  'ding',
  'boing',
  'click',
  'riser',
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Generates deterministic Float32Array mono audio samples in [-1, 1] for an SFX type.
 */
export function synthesizeCueSamples(type, sampleRate = SAMPLE_RATE) {
  const safeType = SFX_TYPES.includes(type) ? type : 'pop';
  const rand = mulberry32(hashSeed(`sfx:${safeType}`));

  if (safeType === 'pop') {
    const dur = 0.095;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const u = t / dur;
      const freq = 520 * Math.pow(160 / 520, Math.pow(u, 0.7));
      phase += (2 * Math.PI * freq) / sampleRate;
      const attack = Math.min(1, t / 0.004);
      const decay = Math.exp(-32 * t);
      out[i] = Math.sin(phase) * attack * decay * 0.85;
    }
    return out;
  }

  if (safeType === 'whoosh') {
    const dur = 0.29;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    // State-variable bandpass filter swept 250Hz -> 1400Hz -> 300Hz
    let low = 0;
    let band = 0;
    const q = 2.6;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const u = t / dur;
      const noise = rand() * 2 - 1;
      const center =
        u < 0.45
          ? 250 + (1400 - 250) * (u / 0.45)
          : 1400 - (1400 - 300) * ((u - 0.45) / 0.55);
      const f = 2 * Math.sin((Math.PI * Math.min(center, sampleRate * 0.4)) / sampleRate);
      low += f * band;
      const high = noise - low - band / q;
      band += f * high;
      const env = Math.sin(Math.PI * u) * Math.pow(1 - u, 0.35);
      out[i] = Math.tanh(band * 2.2) * env * 0.72;
    }
    return out;
  }

  if (safeType === 'scribble') {
    const dur = 0.34;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    // 5 rapid filtered friction grains simulating marker/chalk strokes
    const grainStarts = [0.0, 0.062, 0.125, 0.195, 0.255];
    const grainDur = 0.048;
    let low = 0;
    let band = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      let grainEnv = 0;
      let grainIdx = 0;
      for (let g = 0; g < grainStarts.length; g++) {
        const dt = t - grainStarts[g];
        if (dt >= 0 && dt <= grainDur) {
          const gu = dt / grainDur;
          grainEnv += Math.sin(Math.PI * gu);
          grainIdx = g;
        }
      }
      const noise = rand() * 2 - 1;
      const fc = 1550 + (grainIdx % 3) * 420;
      const f = 2 * Math.sin((Math.PI * fc) / sampleRate);
      low += f * band;
      const high = noise - low - band / 3.2;
      band += f * high;
      const tonal = Math.sin(2 * Math.PI * (750 + grainIdx * 90) * t) * 0.12;
      out[i] = (band * 1.45 + tonal) * grainEnv * 0.48;
    }
    return out;
  }

  if (safeType === 'stamp') {
    const dur = 0.24;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    let phase = 0;
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const freq = 42 + (130 - 42) * Math.exp(-38 * t);
      phase += (2 * Math.PI * freq) / sampleRate;
      const thump = Math.sin(phase) * Math.exp(-16 * t) * 0.85;
      // Crisp paper slap transient
      const n = rand() * 2 - 1;
      lp += 0.35 * (n - lp);
      const slap = (n - lp * 0.5) * Math.exp(-65 * t) * 0.55;
      out[i] = Math.tanh(thump + slap) * 0.9;
    }
    return out;
  }

  if (safeType === 'ding') {
    const dur = 0.58;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.005);
      const s1 = Math.sin(2 * Math.PI * 880 * t) * Math.exp(-7.5 * t);
      const s2 = Math.sin(2 * Math.PI * 1760 * t) * Math.exp(-10.5 * t) * 0.4;
      const s3 = Math.sin(2 * Math.PI * 2648 * t) * Math.exp(-14 * t) * 0.2;
      out[i] = (s1 + s2 + s3) * attack * 0.55;
    }
    return out;
  }

  if (safeType === 'boing') {
    const dur = 0.4;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    let phase = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const freq = 220 + 140 * Math.sin(38 * t) * Math.exp(-7 * t);
      phase += (2 * Math.PI * freq) / sampleRate;
      const attack = Math.min(1, t / 0.006);
      const env = Math.exp(-6.2 * t);
      const body = Math.sin(phase) + 0.25 * Math.sin(phase * 2);
      out[i] = body * attack * env * 0.62;
    }
    return out;
  }

  if (safeType === 'click') {
    const dur = 0.038;
    const len = Math.floor(dur * sampleRate);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const tone = Math.sin(2 * Math.PI * 1450 * t) * Math.exp(-140 * t);
      const tick = (rand() * 2 - 1) * Math.exp(-180 * t) * 0.45;
      out[i] = (tone * 0.75 + tick) * 0.75;
    }
    return out;
  }

  // 'riser'
  const dur = 0.66;
  const len = Math.floor(dur * sampleRate);
  const out = new Float32Array(len);
  let phase1 = 0;
  let phase2 = 0;
  let low = 0;
  let band = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sampleRate;
    const u = t / dur;
    const f1 = 220 * Math.pow(4.2, u * u);
    const f2 = f1 * 1.5;
    phase1 += (2 * Math.PI * f1) / sampleRate;
    phase2 += (2 * Math.PI * f2) / sampleRate;
    const noise = rand() * 2 - 1;
    const f = 2 * Math.sin((Math.PI * Math.min(400 + u * 2600, sampleRate * 0.4)) / sampleRate);
    low += f * band;
    band += f * (noise - low - band / 3.0);
    const env = Math.pow(u, 1.35) * Math.min(1, (1 - u) / 0.08);
    out[i] = Math.tanh((Math.sin(phase1) * 0.45 + Math.sin(phase2) * 0.25 + band * 0.6) * env) * 0.55;
  }
  return out;
}

/**
 * Renders timeline sfxCues into a valid 16-bit PCM Stereo RIFF WAVE byte array.
 */
export function renderTimelineTrackWav(sfxCues = [], durationSec = 10, sampleRate = SAMPLE_RATE) {
  const safeDur = Math.max(0.5, Number(durationSec) || 10);
  const totalSamples = Math.ceil(safeDur * sampleRate);
  const mixL = new Float32Array(totalSamples);
  const mixR = new Float32Array(totalSamples);

  const cache = new Map();
  for (let idx = 0; idx < sfxCues.length; idx++) {
    const cue = sfxCues[idx];
    if (!cue || typeof cue.time !== 'number' || cue.time < 0 || cue.time >= safeDur) continue;
    const type = SFX_TYPES.includes(cue.type) ? cue.type : 'pop';
    if (!cache.has(type)) {
      cache.set(type, synthesizeCueSamples(type, sampleRate));
    }
    const samples = cache.get(type);
    const vol = typeof cue.volume === 'number' ? Math.max(0, Math.min(1.5, cue.volume)) : 0.78;
    const startIdx = Math.floor(cue.time * sampleRate);
    // Subtle deterministic stereo spread (-0.18 to +0.18)
    const pan = ((idx % 5) - 2) * 0.09;
    const gainL = vol * (1 - Math.max(0, pan) * 0.4);
    const gainR = vol * (1 + Math.min(0, pan) * 0.4);

    for (let i = 0; i < samples.length; i++) {
      const dst = startIdx + i;
      if (dst >= totalSamples) break;
      const s = samples[i];
      mixL[dst] += s * gainL;
      mixR[dst] += s * gainR;
    }
  }

  const numChannels = 2;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const byteRate = sampleRate * blockAlign;
  const dataBytes = totalSamples * blockAlign;
  const headerBytes = 44;
  const wav = new Uint8Array(headerBytes + dataBytes);
  const view = new DataView(wav.buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      wav[offset + i] = str.charCodeAt(i);
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const l = Math.tanh(mixL[i]);
    const r = Math.tanh(mixR[i]);
    view.setInt16(offset, Math.max(-32768, Math.min(32767, Math.round(l * 32767))), true);
    view.setInt16(offset + 2, Math.max(-32768, Math.min(32767, Math.round(r * 32767))), true);
    offset += 4;
  }

  return wav;
}

/**
 * Browser WebAudio player for zero-latency live preview SFX.
 */
export function createWebAudioSfxPlayer() {
  let ctx = null;
  let buffers = null;
  let muted = false;
  let lastTriggeredIdx = new Set();

  function ensureContext() {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ sampleRate: SAMPLE_RATE });
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!buffers && ctx) {
      buffers = new Map();
      for (const type of SFX_TYPES) {
        const mono = synthesizeCueSamples(type, ctx.sampleRate);
        const buf = ctx.createBuffer(1, mono.length, ctx.sampleRate);
        buf.copyToChannel(mono, 0);
        buffers.set(type, buf);
      }
    }
    return ctx;
  }

  function unlock() {
    ensureContext();
  }

  function play(type, volume = 0.75) {
    if (muted) return;
    const ac = ensureContext();
    if (!ac || !buffers) return;
    const buf = buffers.get(SFX_TYPES.includes(type) ? type : 'pop');
    if (!buf) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const gain = ac.createGain();
    gain.gain.value = Math.max(0, Math.min(1.5, volume)) * 0.55;
    src.connect(gain);
    gain.connect(ac.destination);
    src.start();
  }

  function triggerCrossing(prevTime, currTime, cues = []) {
    if (muted || currTime < prevTime) return;
    // Detect loop wrap or scrub jump > 0.45s without blasting SFX
    if (currTime - prevTime > 0.45) {
      reset();
      return;
    }
    for (let i = 0; i < cues.length; i++) {
      const c = cues[i];
      if (!c) continue;
      if (c.time >= prevTime && c.time <= currTime && !lastTriggeredIdx.has(i)) {
        lastTriggeredIdx.add(i);
        play(c.type, c.volume ?? 0.78);
      }
    }
  }

  function reset() {
    lastTriggeredIdx.clear();
  }

  function setMuted(next) {
    muted = Boolean(next);
  }

  function isMuted() {
    return muted;
  }

  return {
    unlock,
    play,
    triggerCrossing,
    reset,
    setMuted,
    isMuted,
  };
}
