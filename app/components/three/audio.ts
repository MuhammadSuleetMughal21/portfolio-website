// Tiny synthesized ambient engine — no audio assets required.
// A soft detuned pad through a slowly-breathing lowpass filter.

class Ambient {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private running = false;

  start() {
    if (this.running) {
      this.setMuted(false);
      return;
    }
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      filter.Q.value = 0.8;
      filter.connect(master);

      // Slow breathing on the filter cutoff.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 140;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      const freqs = [55, 55.4, 110.2, 164.8];
      const types: OscillatorType[] = ["sine", "sine", "triangle", "sine"];
      const gains = [0.5, 0.5, 0.18, 0.08];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = types[i];
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = gains[i];
        osc.connect(g);
        g.connect(filter);
        osc.start();
      });

      // Fade the pad in gently.
      master.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5);

      this.ctx = ctx;
      this.master = master;
      this.running = true;
    } catch {
      /* audio is optional */
    }
  }

  setMuted(muted: boolean) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.linearRampToValueAtTime(muted ? 0 : 0.045, t + 0.4);
  }

  blip() {
    if (!this.ctx || !this.master || !this.running) return;
    try {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 740;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      /* ignore */
    }
  }
}

export const ambient = new Ambient();
