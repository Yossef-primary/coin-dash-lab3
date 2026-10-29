// Looping chiptune background music, generated procedurally with the Web Audio API.
// 8 bars in A minor (Am F C G): square lead, triangle bass, triangle kick and noise hi-hat.
// Notes are scheduled ahead on AudioContext.currentTime (lookahead scheduler), so timer jitter
// never drifts the beat. Music feeds CoinSound's master gain, so M mutes it too.
// It hooks CoinSound.start / hit / timeUp / tick, so game.js needs no changes.
(function () {
  const CoinSound = window.CoinSound;
  if (!CoinSound || !CoinSound._audio) return;
  const cfg = (window.COIN_DASH && window.COIN_DASH.sound) || {};
  const MUSIC_VOLUME = typeof cfg.musicVolume === 'number' ? cfg.musicVolume : 0.3;
  const BPM = 140;
  const FAST_BPM = 165;      // last 5 seconds of a round
  const LOOKAHEAD = 0.15;    // seconds of audio scheduled ahead
  const TIMER_MS = 25;       // how often the scheduler wakes up

  // Melody: 8 bars x 8 eighth notes (MIDI numbers, null = rest).
  const LEAD = [
    69, 72, 76, 81, 79, 76, 72, 76,
    72, 74, 76, 74, 72, 71, 69, null,
    65, 69, 72, 77, 76, 72, 69, 72,
    74, 72, 69, 72, 74, 76, 77, null,
    72, 76, 79, 84, 83, 79, 76, 79,
    81, 79, 76, 79, 81, 83, 84, null,
    79, 83, 86, 83, 81, 79, 77, 74,
    71, 74, 79, null, 76, null, 71, null
  ];
  const BASS_ROOTS = [45, 45, 41, 41, 48, 48, 43, 43]; // A2 A2 F2 F2 C3 C3 G2 G2
  const STEPS = LEAD.length;                          // eighth-note steps per loop

  let bus = null;          // music gain -> CoinSound master
  let noise = null;        // shared white-noise buffer for the hat
  let timer = null;        // scheduler interval id (null = stopped)
  let step = 0;
  let nextTime = 0;
  let fast = false;
  let wanted = true;       // false between game over and the next round start

  const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function audio() {
    const a = CoinSound._audio();
    return a.ctx && a.master && a.ctx.state !== 'closed' ? a : null;
  }

  function tone(ctx, type, freq, t, dur, vol, slideTo) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function hat(ctx, t, vol) {
    const src = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = noise;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(hp);
    hp.connect(g);
    g.connect(bus);
    src.start(t);
    src.stop(t + 0.05);
  }

  function playStep(ctx, s, t, eighth) {
    const bar = Math.floor(s / 8);
    const beat = s % 8;
    const lead = LEAD[s];
    if (lead !== null) tone(ctx, 'square', midiHz(lead), t, eighth * 0.85, 0.3);
    const root = BASS_ROOTS[bar] + (beat % 2 ? 12 : 0); // octave-bounce bass
    tone(ctx, 'triangle', midiHz(root), t, eighth * 0.9, 0.55);
    if (beat % 4 === 0) tone(ctx, 'triangle', 150, t, 0.12, 0.7, 40); // kick on beats 1 and 3
    hat(ctx, t + eighth / 2, 0.18);                                      // off-beat hat
  }

  function schedule() {
    const a = audio();
    if (!a) return;
    const ctx = a.ctx;
    // After a throttled background tab, skip ahead instead of firing a burst of late notes.
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const eighth = 30 / (fast ? FAST_BPM : BPM);
      try { playStep(ctx, step, nextTime, eighth); } catch (e) { /* ignore */ }
      nextTime += eighth;
      step = (step + 1) % STEPS;
    }
  }

  function musicStart() {
    wanted = true;
    if (timer !== null) return; // already playing: never stack a second loop
    const a = audio();
    if (!a) return;             // not unlocked yet: the first keydown starts it
    const ctx = a.ctx;
    try {
      if (!bus) {
        bus = ctx.createGain();
        bus.connect(a.master);
        noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setValueAtTime(MUSIC_VOLUME, ctx.currentTime);
    } catch (e) { return; }
    step = 0;
    nextTime = ctx.currentTime + 0.05;
    timer = setInterval(schedule, TIMER_MS);
    schedule();
  }

  function musicStop() {
    wanted = false;
    if (timer === null) return;
    clearInterval(timer);
    timer = null;
    const a = audio();
    if (!a || !bus) return;
    try { // quick fade so already-scheduled notes don't ring out
      const t = a.ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + 0.25);
    } catch (e) { /* ignore */ }
  }

  // Hook the existing sound events instead of adding calls to game.js.
  const orig = { start: CoinSound.start, hit: CoinSound.hit, timeUp: CoinSound.timeUp, tick: CoinSound.tick };
  CoinSound.start = function () { fast = false; orig.start.apply(this, arguments); musicStart(); };
  CoinSound.hit = function () { musicStop(); return orig.hit.apply(this, arguments); };
  CoinSound.timeUp = function () { musicStop(); return orig.timeUp.apply(this, arguments); };
  CoinSound.tick = function (seconds) { fast = seconds > 0 && seconds <= 5; return orig.tick.apply(this, arguments); };
  CoinSound.musicStart = musicStart;
  CoinSound.musicStop = musicStop;
  CoinSound.musicPlaying = () => timer !== null;

  // Runs after sound.js's keydown listener has created/resumed the AudioContext.
  window.addEventListener('keydown', () => { if (wanted) musicStart(); });
})();
