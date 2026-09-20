/**
 * Real-Time Audio DSP Degradation Engine for Acoustic Ear
 * Processes pristine human speech buffers through a configurable Web Audio API graph:
 * - Narrowband High-pass & Low-pass Biquad filters (Telephone/Intercom/Walkie-Talkie profiles)
 * - Non-linear WaveShaper harmonic saturation / mic overdrive clipping
 * - SNR Noise Synthesizer (Pink, White, Radio Hum, Subway Rumble) mixed at calibrated dB levels
 * - Packet Loss / Staccato Chopper (random 30ms-90ms dropouts with micro-crossfades)
 * - Convolver synthetic impulse response for acoustic PA reverberation
 * - Instant A/B Clean Audio Bypass for neurobiological auditory retraining
 * - AnalyserNode for real-time spectral & waveform visualization
 */

import { AcousticConfig } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;
  private currentNoiseSource: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private impulseBuffer: AudioBuffer | null = null;

  private isPlayingAudio = false;
  private isCleanBypass = false;
  private onEndedCallback: (() => void) | null = null;
  private realAudioUrls = new Set<string>();

  // Cached noise buffers
  private noiseBuffers: Map<string, AudioBuffer> = new Map();

  /**
   * Lazily initialize AudioContext to comply with browser autoplay policies.
   */
  public async initContext(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
    if (!this.analyserNode) {
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;
    }
    if (!this.impulseBuffer) {
      this.impulseBuffer = this.generateImpulseResponse(this.ctx, 1.6, 2.2);
    }
    return this.ctx;
  }

  /**
   * Fetch and cache raw audio into an AudioBuffer.
   */
  public async loadAudio(url: string, fallbackWord?: string): Promise<AudioBuffer> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }
    const ctx = await this.initContext();
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fetch failed with status ${response.status}`);
      }
      const arrayBuf = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      this.realAudioUrls.add(url);
      this.bufferCache.set(url, decoded);
      return decoded;
    } catch (err) {
      console.warn(`Audio file unavailable at ${url}, using synthetic speech fallback`, err);
      const fallback = this.generateSyntheticSpeechBuffer(ctx, fallbackWord || 'word');
      this.bufferCache.set(url, fallback);
      return fallback;
    }
  }

  /**
   * Generates a synthetic voice buffer fallback when an audio file cannot be loaded.
   */
  private generateSyntheticSpeechBuffer(ctx: AudioContext, text: string): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const duration = Math.max(0.7, Math.min(2.0, text.length * 0.1 + 0.4));
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const f0 = 140;
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, i / (sampleRate * 0.05));
      const release = Math.min(1, (length - i) / (sampleRate * 0.08));
      const env = attack * release;

      const voice =
        0.4 * Math.sin(2 * Math.PI * f0 * t) +
        0.3 * Math.sin(2 * Math.PI * 700 * t) +
        0.2 * Math.sin(2 * Math.PI * 1700 * t) +
        0.1 * Math.sin(2 * Math.PI * 2800 * t);
      data[i] = voice * env * 0.35;
    }
    return buffer;
  }

  /**
   * Preload a list of audio URLs.
   */
  public async preload(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map((u) => this.loadAudio(u)));
  }

  /**
   * Generates a soft-clipping sigmoid curve for the WaveShaperNode.
   */
  private makeDistortionCurve(drive: number): Float32Array {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    const k = Math.max(0, drive);
    if (k <= 0) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1;
      }
      return curve;
    }
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Sigmoid soft-saturation formula
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  /**
   * Synthesizes an acoustic impulse response for PA / Hall reverberation.
   */
  private generateImpulseResponse(ctx: AudioContext, durationSeconds = 1.4, decay = 2.0): AudioBuffer {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * durationSeconds);
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / length;
      const exp = Math.pow(1 - t, decay);
      // Diffuse reflections with stereo spread
      left[i] = (Math.random() * 2 - 1) * exp;
      right[i] = (Math.random() * 2 - 1) * exp;
    }
    return impulse;
  }

  /**
   * Synthesizes looping noise buffers: pink, white, radio hum, subway rumble.
   */
  private getNoiseBuffer(ctx: AudioContext, type: string): AudioBuffer {
    if (this.noiseBuffers.has(type)) {
      return this.noiseBuffers.get(type)!;
    }
    const sampleRate = ctx.sampleRate;
    const duration = 5; // 5 seconds seamless loop
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
    } else if (type === 'pink') {
      // Paul Kellet filter method for pink noise (-3dB/octave)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }
    } else if (type === 'radio_hum') {
      // 60Hz and 120Hz line hum mixed with high-frequency hiss
      const f1 = 60;
      const f2 = 120;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const hum = 0.4 * Math.sin(2 * Math.PI * f1 * t) + 0.2 * Math.sin(2 * Math.PI * f2 * t);
        const hiss = (Math.random() * 2 - 1) * 0.3;
        data[i] = (hum + hiss) * 0.35;
      }
    } else if (type === 'subway_rumble') {
      // Low frequency rumble (30Hz-120Hz)
      let lastVal = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        // Simple low-pass filter accumulator
        lastVal = lastVal * 0.96 + white * 0.04;
        data[i] = lastVal * 2.5;
      }
    }

    this.noiseBuffers.set(type, buffer);
    return buffer;
  }

  /**
   * Plays the audio with real-time DSP degradation or pristine clean bypass.
   */
  public async play(
    audioUrl: string,
    config: AcousticConfig,
    options: { clean?: boolean; playbackRate?: number; onEnded?: () => void; fallbackWord?: string } = {}
  ): Promise<void> {
    this.stop();
    const ctx = await this.initContext();
    const buffer = await this.loadAudio(audioUrl, options.fallbackWord);

    this.isPlayingAudio = true;
    this.isCleanBypass = !!options.clean;
    this.onEndedCallback = options.onEnded || null;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    if (options.playbackRate && options.playbackRate > 0) {
      source.playbackRate.value = options.playbackRate;
    }
    this.currentSource = source;

    // Master volume gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(this.analyserNode!);
    this.analyserNode!.connect(ctx.destination);
    this.currentGainNode = masterGain;

    if (this.isCleanBypass) {
      // -------------------------------------------------------------
      // CLEAN BYPASS GRAPH:
      // Direct pristine path for auditory realignment
      // -------------------------------------------------------------
      source.connect(masterGain);
    } else {
      // -------------------------------------------------------------
      // DEGRADED DSP GRAPH:
      // Source -> Packet Loss Chopper -> HighPass -> LowPass -> WaveShaper -> Reverb Summer -> Master
      // + Noise Generator -> Noise Filter -> Noise Gain -> Master
      // -------------------------------------------------------------

      // 1. Packet Loss / Staccato Chopper (GainNode with scheduled dropouts)
      const chopperGain = ctx.createGain();
      chopperGain.gain.value = 1.0;
      source.connect(chopperGain);

      const packetLossPercent = Math.min(80, Math.max(0, config.packetLossRate));
      if (packetLossPercent > 0) {
        const duration = buffer.duration;
        const now = ctx.currentTime;
        // Schedule random 30ms to 90ms drops based on probability
        let cursor = 0.08; // Skip immediate attack
        while (cursor < duration - 0.1) {
          if (Math.random() * 100 < packetLossPercent * 1.5) {
            const dropDuration = 0.03 + Math.random() * 0.06; // 30ms to 90ms
            const dropStart = now + cursor;
            // 2ms micro-fade to avoid harsh digital clicks
            chopperGain.gain.setValueAtTime(1.0, dropStart);
            chopperGain.gain.linearRampToValueAtTime(0.001, dropStart + 0.003);
            chopperGain.gain.setValueAtTime(0.001, dropStart + dropDuration - 0.003);
            chopperGain.gain.linearRampToValueAtTime(1.0, dropStart + dropDuration);
            cursor += dropDuration + 0.08 + Math.random() * 0.12;
          } else {
            cursor += 0.06 + Math.random() * 0.08;
          }
        }
      }

      // 2. High-Pass Filter (cuts chest resonance, e.g. 300Hz or 500Hz)
      const highPass = ctx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = config.highPassHz;
      highPass.Q.value = 1.0;

      // 3. Low-Pass Filter (cuts sibilant consonants, e.g. 3400Hz or 2500Hz)
      const lowPass = ctx.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = config.lowPassHz;
      lowPass.Q.value = 1.0;

      // 4. WaveShaper Distortion (Microphone Overdrive / Diaphragm Saturation)
      const waveShaper = ctx.createWaveShaper();
      waveShaper.curve = this.makeDistortionCurve(config.distortionDrive) as any;
      waveShaper.oversample = '4x';

      // Chain speech processing
      chopperGain.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(waveShaper);

      // 5. Acoustic Reverberation (PA System Convolver)
      if (config.reverbWet > 0.02 && this.impulseBuffer) {
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        dryGain.gain.value = Math.max(0.2, 1.0 - config.reverbWet * 0.6);
        wetGain.gain.value = Math.min(1.2, config.reverbWet * 1.5);

        const convolver = ctx.createConvolver();
        convolver.buffer = this.impulseBuffer;

        waveShaper.connect(dryGain);
        waveShaper.connect(convolver);
        convolver.connect(wetGain);

        dryGain.connect(masterGain);
        wetGain.connect(masterGain);
      } else {
        waveShaper.connect(masterGain);
      }

      // 6. Signal-to-Noise Ratio (SNR) Mixer
      if (config.noiseType !== 'off' && config.snrDb < 30) {
        const noiseBuffer = this.getNoiseBuffer(ctx, config.noiseType);
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;
        this.currentNoiseSource = noiseSource;

        // Band-limit the noise to match the speaker profile
        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = (config.highPassHz + config.lowPassHz) / 2;
        noiseFilter.Q.value = 0.5;

        // Calculate noise gain relative to calibrated speech level
        // Standard speech RMS ~ 0.25 (-12 dBFS)
        // SNR = 20 * log10(signal / noise) => noise = signal * 10^(-snr / 20)
        const speechRefLevel = 0.35;
        const noiseGainValue = Math.max(0.005, speechRefLevel * Math.pow(10, -config.snrDb / 20));

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(noiseGainValue, ctx.currentTime);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noiseSource.start();
      }
    }

    source.onended = () => {
      this.isPlayingAudio = false;
      this.stopNoise();
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    source.start();
  }

  /**
   * Stop any active voice playback and ambient noise.
   */
  public stop(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.stopNoise();
    this.isPlayingAudio = false;
  }

  private stopNoise(): void {
    if (this.currentNoiseSource) {
      try {
        this.currentNoiseSource.stop();
        this.currentNoiseSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentNoiseSource = null;
    }
  }

  public get isPlaying(): boolean {
    return this.isPlayingAudio;
  }

  public get isClean(): boolean {
    return this.isCleanBypass;
  }

  /**
   * Retrieve FFT frequency data for visualizer (0 - 255 values).
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode && this.isPlayingAudio) {
      this.analyserNode.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  /**
   * Retrieve time-domain oscilloscope data (0 - 255 values).
   */
  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyserNode && this.isPlayingAudio) {
      this.analyserNode.getByteTimeDomainData(array as any);
    } else {
      array.fill(128);
    }
  }

  /**
   * Get frequency bin count for visualizer allocation.
   */
  public get frequencyBinCount(): number {
    return this.analyserNode ? this.analyserNode.frequencyBinCount : 256;
  }
}

export const audioEngine = new AudioEngine();
