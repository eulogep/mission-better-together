// Procedural Calming Soundscape Engine (100% Web Audio API — zero external audio dependencies)
// Inspired by open-source projects Moodist & Vibe30 Soundscape

export type SoundChannel = 'rain' | 'ocean' | 'breeze' | 'harmony';

export interface SoundLevels {
  rain: number;
  ocean: number;
  breeze: number;
  harmony: number;
}

class SerenitySoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private channelGains: Partial<Record<SoundChannel, GainNode>> = {};
  private initialized = false;
  private levels: SoundLevels = { rain: 0, ocean: 0, breeze: 0, harmony: 0 };
  private masterVolume = 0.7;
  private muted = false;

  private masterTarget() {
    return this.muted ? 0 : this.masterVolume * 0.93;
  }

  /** Volume général (0 à 1) et coupure du son, appliqués à toutes les ambiances et carillons. */
  public setMaster(volume: number, muted: boolean) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterTarget(), this.ctx.currentTime, 0.08);
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterTarget();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.initialized && this.ctx && this.masterGain) {
      this.buildChannels(this.ctx, this.masterGain);
      this.initialized = true;
    }
    return this.ctx;
  }

  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 6): AudioBuffer {
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  private createBrownNoiseBuffer(ctx: AudioContext, seconds = 8): AudioBuffer {
    const length = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let lastOut = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 2.2;
      }
    }
    return buffer;
  }

  private buildChannels(ctx: AudioContext, master: GainNode) {
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 6);
    const brownBuffer = this.createBrownNoiseBuffer(ctx, 8);

    // 1. Pluie douce (Filtered Pink Noise with gentle warmth)
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = pinkBuffer;
    rainSource.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 950;
    rainFilter.Q.value = 0.45;
    const rainLow = ctx.createBiquadFilter();
    rainLow.type = 'lowpass';
    rainLow.frequency.value = 2600;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainSource.connect(rainFilter);
    rainFilter.connect(rainLow);
    rainLow.connect(rainGain);
    rainGain.connect(master);
    rainSource.start();
    this.channelGains.rain = rainGain;

    // 2. Océan calme (Brown noise + slow 0.11Hz wave swell LFO)
    const oceanSource = ctx.createBufferSource();
    oceanSource.buffer = brownBuffer;
    oceanSource.loop = true;
    const oceanFilter = ctx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.value = 340;
    const oceanSwell = ctx.createGain();
    oceanSwell.gain.value = 0.65;
    const waveLfo = ctx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.value = 0.11; // ~9 second calm wave rhythm
    const waveDepth = ctx.createGain();
    waveDepth.gain.value = 0.35;
    waveLfo.connect(waveDepth);
    waveDepth.connect(oceanSwell.gain);
    const oceanGain = ctx.createGain();
    oceanGain.gain.value = 0;
    oceanSource.connect(oceanFilter);
    oceanFilter.connect(oceanSwell);
    oceanSwell.connect(oceanGain);
    oceanGain.connect(master);
    oceanSource.start();
    waveLfo.start();
    this.channelGains.ocean = oceanGain;

    // 3. Brise de forêt (Soft resonant airy wind)
    const breezeSource = ctx.createBufferSource();
    breezeSource.buffer = pinkBuffer;
    breezeSource.loop = true;
    const breezeFilter = ctx.createBiquadFilter();
    breezeFilter.type = 'bandpass';
    breezeFilter.frequency.value = 460;
    breezeFilter.Q.value = 2.4;
    const breezeLfo = ctx.createOscillator();
    breezeLfo.frequency.value = 0.07;
    const breezeDepth = ctx.createGain();
    breezeDepth.gain.value = 180;
    breezeLfo.connect(breezeDepth);
    breezeDepth.connect(breezeFilter.frequency);
    const breezeGain = ctx.createGain();
    breezeGain.gain.value = 0;
    breezeSource.connect(breezeFilter);
    breezeFilter.connect(breezeGain);
    breezeGain.connect(master);
    breezeSource.start();
    breezeLfo.start();
    this.channelGains.breeze = breezeGain;

    // 4. Harmonie 432 Hz (Warm serene harmonic singing-bowl pad)
    const harmonyGain = ctx.createGain();
    harmonyGain.gain.value = 0;
    const freqs = [216, 324, 432, 540]; // Warm 432Hz harmonic fifth/octave chord
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f + (idx % 2 === 0 ? 0.35 : -0.25); // Gentle organic shimmer
      const partialGain = ctx.createGain();
      partialGain.gain.value = idx === 0 ? 0.14 : idx === 2 ? 0.1 : 0.055;
      osc.connect(partialGain);
      partialGain.connect(harmonyGain);
      osc.start();
    });
    harmonyGain.connect(master);
    this.channelGains.harmony = harmonyGain;
  }

  public setLevel(channel: SoundChannel, value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    this.levels[channel] = clamped;
    if (clamped > 0 || this.initialized) {
      const ctx = this.ensureContext();
      const gainNode = this.channelGains[channel];
      if (ctx && gainNode) {
        gainNode.gain.setTargetAtTime(clamped * 0.55, ctx.currentTime, 0.25);
      }
    }
  }

  public getLevels(): SoundLevels {
    return { ...this.levels };
  }

  public isAnyPlaying(): boolean {
    return Object.values(this.levels).some((v) => v > 0.01);
  }

  public stopAll() {
    (['rain', 'ocean', 'breeze', 'harmony'] as SoundChannel[]).forEach((ch) =>
      this.setLevel(ch, 0)
    );
  }

  // Play a gentle pentatonic water-drop chime (used by the Zen Pebble & Breathing transitions)
  public playChime(noteIndex?: number, soft = false) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    // C major pentatonic in warm 432Hz tuning
    const scale = [256.87, 288.33, 323.63, 384.87, 432.0, 513.74, 576.65, 647.27];
    const idx =
      noteIndex !== undefined
        ? Math.abs(noteIndex) % scale.length
        : Math.floor(Math.random() * scale.length);
    const freq = scale[idx];

    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const peak = soft ? 0.07 : 0.13;
    env.gain.setValueAtTime(0.0001, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.04);
    env.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

    osc.connect(env);
    env.connect(this.masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2.3);
  }
}

export const soundEngine = new SerenitySoundEngine();
