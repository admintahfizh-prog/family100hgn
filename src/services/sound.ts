/**
 * Web Audio API Sound Synthesizer for Family 100 HGN
 * Works 100% offline without external audio files.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound 1: Correct Answer Chime (Major Chord Arpeggio)
   */
  public playCorrect(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

      gain.gain.setValueAtTime(0, startTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, startTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.08);
      osc.stop(startTime + idx * 0.08 + 0.4);
    });
  }

  /**
   * Sound 2: Wrong Buzzer (Dissonant Sawtooth Wave)
   */
  public playWrong(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const freqs = [146.83, 155.56]; // Low D3 and D#3 clash

    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.setValueAtTime(0.4, startTime + 0.35);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  /**
   * Sound 3: Card Reveal Flip (Swish + Plink)
   */
  public playReveal(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.15);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.28);
  }

  /**
   * Sound 4: Point Tally Sound (Coin sparkle)
   */
  public playPoints(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.06);

      gain.gain.setValueAtTime(0, startTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, startTime + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.06);
      osc.stop(startTime + idx * 0.06 + 0.25);
    });
  }

  /**
   * Sound 5: Bell
   */
  public playBell(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, startTime); // A6

    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 1.25);
  }

  /**
   * Sound 6: Drum Roll + Crash Cymbal
   */
  public playDrumRoll(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const duration = 1.6;

    // Buffer noise for drum snare rattle
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Rapid fluttering pulses
      const pulse = Math.sin(i / 120);
      data[i] = (Math.random() * 2 - 1) * (0.3 + 0.7 * Math.abs(pulse));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, startTime);
    filter.frequency.linearRampToValueAtTime(1400, startTime + duration);
    filter.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.linearRampToValueAtTime(0.35, startTime + duration - 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);

    // Final Cymbal Crash at end of roll
    const cymbalTime = startTime + duration;
    const cymbalOsc = ctx.createOscillator();
    const cymbalGain = ctx.createGain();

    cymbalOsc.type = 'triangle';
    cymbalOsc.frequency.setValueAtTime(180, cymbalTime);

    cymbalGain.gain.setValueAtTime(0.4, cymbalTime);
    cymbalGain.gain.exponentialRampToValueAtTime(0.001, cymbalTime + 0.8);

    cymbalOsc.connect(cymbalGain);
    cymbalGain.connect(ctx.destination);

    cymbalOsc.start(cymbalTime);
    cymbalOsc.stop(cymbalTime + 0.85);
  }

  /**
   * Sound 7: Audience Applause
   */
  public playApplause(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const duration = 2.4;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Clapping clusters
      const t = i / ctx.sampleRate;
      const claps = Math.sin(t * 30) * Math.sin(t * 19);
      data[i] = (Math.random() * 2 - 1) * Math.max(0.1, Math.abs(claps));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.4);
    gain.gain.setValueAtTime(0.35, startTime + 1.8);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  /**
   * Sound 8: Fanfare / Victory Celebration
   */
  public playFanfare(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    // Triumphant fanfare notes: G4, C5, E5, G5 (held), E5, G5
    const fanfareNotes = [
      { freq: 392.00, time: 0, dur: 0.16 },
      { freq: 523.25, time: 0.16, dur: 0.16 },
      { freq: 659.25, time: 0.32, dur: 0.16 },
      { freq: 783.99, time: 0.48, dur: 0.5 },
      { freq: 659.25, time: 1.05, dur: 0.16 },
      { freq: 783.99, time: 1.25, dur: 0.9 },
    ];

    fanfareNotes.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.freq, startTime + n.time);

      gain.gain.setValueAtTime(0, startTime + n.time);
      gain.gain.linearRampToValueAtTime(0.25, startTime + n.time + 0.03);
      gain.gain.setValueAtTime(0.22, startTime + n.time + n.dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + n.time + n.dur);

      // Lowpass filter for warm brass sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, startTime + n.time);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + n.time);
      osc.stop(startTime + n.time + n.dur + 0.05);
    });
  }

  /**
   * Sound 9: Countdown Tick (10s Challenge)
   */
  public playCountdownTick(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, startTime);
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.04);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.06);
  }

  /**
   * Sound 10: Times Up Alert
   */
  public playTimesUp(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, startTime + i * 0.15);

      gain.gain.setValueAtTime(0.2, startTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.15 + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + i * 0.15);
      osc.stop(startTime + i * 0.15 + 0.12);
    }
  }
}

export const soundFx = new SoundEffectsService();
