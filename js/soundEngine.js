/* ==========================================================================
   WEB AUDIO API HANGSZINTETIZÁTOR (100% OFFLINE)
   Forráskódból központilag tiltható (systemAllowed = false alapértelmezéssel)
   ========================================================================== */

class SoundEngine {
  constructor() {
    /** @type {AudioContext | null} */
    this.ctx = null;
    this.systemAllowed = false;
    this.enabled = false;
  }

  /**
   * Központi engedélyezés vagy tiltás a KIOSK_CONFIG.enableAudio alapján.
   * Ha allowed === false, egyetlen hang sem szólal meg és AudioContext sem jön létre.
   * @param {boolean} allowed
   */
  setSystemAudioAllowed(allowed) {
    this.systemAllowed = Boolean(allowed);
    this.enabled = Boolean(allowed);
  }

  isSystemAllowed() {
    return this.systemAllowed;
  }

  init() {
    if (!this.systemAllowed) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window['webkitAudioContext'];
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    if (!this.systemAllowed) {
      this.enabled = false;
      return false;
    }
    this.enabled = !this.enabled;
    return this.enabled;
  }

  canPlay() {
    return this.systemAllowed && this.enabled;
  }

  /** Vidám, rövid gombkattintás / koppintás hang */
  playClick() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Puha visszajelző hang, ha a gyerek mellékoppint keresés közben */
  playSoftBoop() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /** Károly, a kaméleon megtalálásakor megszólaló vidám csilingelés */
  playChameleonFound() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = this.ctx.currentTime + idx * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.17);
    });
  }

  /** Rövid, vidám sikeres részfeladat-csilingelés (pl. helyes csillagszámoláskor) */
  playSuccess() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const notes = [587.33, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const start = this.ctx.currentTime + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  /** Célpont eltalálásakor megszólaló arkád pukkanás/csengés */
  playTargetHit(comboIndex = 0) {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const base = scale[comboIndex % scale.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 1.45, now + 0.09);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Rácsteszt színezés közbeni xilofon-hanglépcső */
  playGridTone(filledCount, totalCount) {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
    const ratio = Math.min(1, Math.max(0, filledCount / Math.max(1, totalCount)));
    const idx = Math.min(pentatonic.length - 1, Math.floor(ratio * pentatonic.length));
    const freq = pentatonic[idx] * (1 + (filledCount % 3) * 0.03);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  /** Tűzijáték hanghatás: többszólamú csillag-akkord + lágy szikra-robbanás */
  playFirework(fingerCount = 1) {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chordScale = [261.63, 329.63, 392.0, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
    const clamped = Math.max(1, Math.min(10, fingerCount));
    const mainFreq = chordScale[clamped - 1];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = clamped >= 5 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(mainFreq * 0.75, now);
    osc.frequency.exponentialRampToValueAtTime(mainFreq * 1.25, now + 0.22);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.27);

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200 + clamped * 180, now);
    filter.Q.setValueAtTime(1.4, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.09, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.14);
  }

  /** Visszaszámláló óra utolsó másodperceinek csipogása */
  playCountdownTick() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(740, now);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.055);
  }

  /** Ünnepi győzelmi fanfár */
  playFanfare() {
    if (!this.canPlay()) return;
    this.init();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.11, delay: 0.0 },
      { f: 659.25, d: 0.11, delay: 0.12 },
      { f: 783.99, d: 0.12, delay: 0.24 },
      { f: 1046.5, d: 0.36, delay: 0.38 },
      { f: 783.99, d: 0.1, delay: 0.56 },
      { f: 1046.5, d: 0.45, delay: 0.68 }
    ];

    melody.forEach((n) => {
      if (!this.ctx) return;
      const start = this.ctx.currentTime + n.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, start);

      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + n.d + 0.02);
    });
  }
}

export const sound = new SoundEngine();
