// Retro 8-bit sound effects, generated procedurally with the Web Audio API.
// No audio files: every sound is built from square/triangle oscillators and gain envelopes.
(function () {
  const cfg = (window.COIN_DASH && window.COIN_DASH.sound) || {};
  const MASTER_VOLUME = typeof cfg.volume === 'number' ? cfg.volume : 0.2;
  let ctx = null;
  let master = null;
  let muted = false;
  let lastTick = -1;      // last whole second that played a tick
  let roundOver = false;  // only one end-of-round sound per round

  function unlock() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : MASTER_VOLUME;
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* audio unavailable: stay silent */ }
  }

  function ready() { return !!ctx && !muted && ctx.state !== 'closed'; }

  // One chiptune note: oscillator -> gain envelope -> master. Optional pitch slide to `slideTo`.
  function note(type, freq, start, dur, vol, slideTo) {
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Wrap every public sound so it is a no-op before unlock / when muted, and never throws.
  function safe(fn) {
    return function () {
      if (!ready()) return;
      try { fn.apply(null, arguments); } catch (e) { /* ignore */ }
    };
  }

  const CoinSound = {
    unlock,
    // Coin: quick rising square blip (B5 -> E6 -> B6).
    coin: safe(() => {
      note('square', 988, 0, 0.06, 0.5);
      note('square', 1319, 0.05, 0.06, 0.5);
      note('square', 1976, 0.1, 0.09, 0.4);
    }),
    // Hit / game over: harsh descending square buzz with a detuned second voice.
    hit: safe(() => {
      if (roundOver) return;
      roundOver = true;
      note('square', 440, 0, 0.35, 0.6, 55);
      note('square', 466, 0, 0.35, 0.4, 58);
      note('triangle', 110, 0.3, 0.3, 0.7, 40);
    }),
    // Time up: descending minor arpeggio ending on a low held note.
    timeUp: safe(() => {
      if (roundOver) return;
      roundOver = true;
      [784, 659, 523, 392, 330].forEach((f, i) => note('square', f, i * 0.09, 0.09, 0.45));
      note('triangle', 196, 0.45, 0.4, 0.8);
    }),
    // Round start: rising C-major arpeggio (C5 E5 G5 C6). Also resets per-round state.
    start() {
      lastTick = -1;
      roundOver = false;
      if (!ready()) return;
      try {
        [523, 659, 784, 1047].forEach((f, i) => note('square', f, i * 0.07, 0.08, 0.4));
      } catch (e) { /* ignore */ }
    },
    // Tick: very short high triangle click, once per whole second when 1..5 seconds remain.
    tick(seconds) {
      if (!(seconds > 0 && seconds <= 5) || seconds === lastTick) return;
      lastTick = seconds;
      if (!ready()) return;
      try { note('triangle', 1760, 0, 0.03, 0.6); } catch (e) { /* ignore */ }
    },
    toggleMute() {
      muted = !muted;
      try { if (master) master.gain.value = muted ? 0 : MASTER_VOLUME; } catch (e) { /* ignore */ }
      return muted;
    },
    isMuted() { return muted; }
  };

  // Registered once at page load (not per scene), so scene restarts cannot duplicate it.
  window.addEventListener('keydown', (e) => {
    unlock();
    if ((e.key === 'm' || e.key === 'M') && !e.repeat) CoinSound.toggleMute();
  });

  window.CoinSound = CoinSound;
})();
