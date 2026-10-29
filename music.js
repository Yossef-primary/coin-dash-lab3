// Looping chiptune background music, generated procedurally with the Web Audio API.
// Four 8-bar tracks (Chase, Heist, Neon, Chill) stored as data; CoinSound.setTrack picks one.
// Notes are scheduled ahead on AudioContext.currentTime (lookahead scheduler), so timer jitter
// never drifts the beat. Music feeds CoinSound's master gain, so M mutes it too.
// It hooks CoinSound.start / hit / timeUp / tick, so game.js needs no changes.
(function () {
  const CoinSound = window.CoinSound;
  if (!CoinSound || !CoinSound._audio) return;
  const cfg = (window.COIN_DASH && window.COIN_DASH.sound) || {};
  const MUSIC_VOLUME = typeof cfg.musicVolume === 'number' ? cfg.musicVolume : 0.3;
  const FAST_FACTOR = 1.18;  // tempo boost in the last 5 seconds of a round
  const LOOKAHEAD = 0.15;    // seconds of audio scheduled ahead
  const TIMER_MS = 25;       // how often the scheduler wakes up
  const STORE_KEY = 'coinDash.track';

  // Builds an 8-bar lead from one chord per bar: each pattern entry indexes the chord tones
  // (index >= tones.length climbs an octave), null = rest.
  function arp(chords, patterns) {
    return chords.flatMap(([root, tones], bar) => patterns[bar % patterns.length].map((i) =>
      i === null ? null : root + tones[i % tones.length] + 12 * Math.floor(i / tones.length)));
  }
  const MAJ = [0, 4, 7], MIN = [0, 3, 7], MAJ7 = [0, 4, 7, 11], MIN7 = [0, 3, 7, 10];

  // Each track is plain data: lead = 64 eighth notes (MIDI, null = rest), roots = bass root per bar,
  // bass = per-beat offset from the root (null = rest), kick / hat = beats (0-7) that get a drum hit.
  const TRACKS = [
    { // The original A minor chase (Am F C G).
      name: 'Chase', bpm: 140,
      lead: [
        69, 72, 76, 81, 79, 76, 72, 76,
        72, 74, 76, 74, 72, 71, 69, null,
        65, 69, 72, 77, 76, 72, 69, 72,
        74, 72, 69, 72, 74, 76, 77, null,
        72, 76, 79, 84, 83, 79, 76, 79,
        81, 79, 76, 79, 81, 83, 84, null,
        79, 83, 86, 83, 81, 79, 77, 74,
        71, 74, 79, null, 76, null, 71, null
      ],
      leadWave: 'square', leadVol: 0.3, leadLen: 0.85,
      roots: [45, 45, 41, 41, 48, 48, 43, 43],
      bass: [0, 12, 0, 12, 0, 12, 0, 12], bassWave: 'triangle', bassVol: 0.55, bassLen: 0.9,
      kick: [0, 4], kickVol: 0.7, hat: [0, 1, 2, 3, 4, 5, 6, 7], hatVol: 0.18
    },
    { // Sneaky D minor heist: sparse staccato lead, creeping bass.
      name: 'Heist', bpm: 104,
      lead: [
        62, null, 65, null, 64, null, 62, null,
        61, null, null, 62, null, null, 57, null,
        62, null, 65, null, 67, null, 68, 67,
        65, null, 64, null, 61, null, null, null,
        69, null, 68, null, 67, null, 65, null,
        64, null, null, 65, null, null, 61, null,
        62, null, 65, null, 69, null, 70, 69,
        68, null, 65, null, 61, null, 62, null
      ],
      leadWave: 'square', leadVol: 0.2, leadLen: 0.45,
      roots: [38, 38, 34, 33, 38, 38, 34, 33],
      bass: [0, null, 0, null, 3, null, 6, 7], bassWave: 'triangle', bassVol: 0.6, bassLen: 0.7,
      kick: [0], kickVol: 0.6, hat: [2, 6], hatVol: 0.12
    },
    { // Bright C major arpeggios at full speed (C G Am F).
      name: 'Neon', bpm: 172,
      lead: arp([[72, MAJ], [67, MAJ], [69, MIN], [65, MAJ], [72, MAJ], [67, MAJ], [69, MIN], [65, MAJ]],
        [[0, 1, 2, 3, 4, 3, 2, 1], [0, 1, 2, 3, 4, 3, 2, 1], [0, 1, 2, 3, 4, 3, 2, 1], [0, 1, 2, 3, 4, 3, 2, 1],
         [3, 2, 1, 0, 1, 2, 3, 4], [3, 2, 1, 0, 1, 2, 3, 4], [3, 2, 1, 0, 1, 2, 3, 4], [5, 4, 3, 2, 1, 2, 3, null]]),
      leadWave: 'square', leadVol: 0.22, leadLen: 0.7,
      roots: [36, 43, 45, 41, 36, 43, 45, 41],
      bass: [0, 0, 12, 0, 0, 0, 12, 0], bassWave: 'sawtooth', bassVol: 0.22, bassLen: 0.6,
      kick: [0, 2, 4, 6], kickVol: 0.7, hat: [0, 1, 2, 3, 4, 5, 6, 7], hatVol: 0.15
    },
    { // Slow, soft seventh chords on sine waves (Fmaj7 Em7 Dm7 Cmaj7).
      name: 'Chill', bpm: 84,
      lead: arp([[65, MAJ7], [64, MIN7], [62, MIN7], [60, MAJ7], [65, MAJ7], [64, MIN7], [62, MIN7], [60, MAJ7]],
        [[4, null, 2, null, 3, null, 1, null], [4, null, 6, null, 5, null, 3, null]]),
      leadWave: 'sine', leadVol: 0.35, leadLen: 1.8,
      roots: [41, 40, 38, 36, 41, 40, 38, 36],
      bass: [0, null, null, null, 7, null, null, null], bassWave: 'sine', bassVol: 0.6, bassLen: 3.5,
      kick: [0], kickVol: 0.35, hat: [2, 6], hatVol: 0.05
    }
  ];

  let current = 0;
  try {
    const saved = Number(localStorage.getItem(STORE_KEY));
    if (saved >= 0 && saved < TRACKS.length) current = Math.floor(saved);
  } catch (e) { /* storage blocked: keep track 0 */ }

  let bus = null;          // music gain -> CoinSound master (a fresh one per start)
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
    const tr = TRACKS[current];
    const bar = Math.floor(s / 8);
    const beat = s % 8;
    const lead = tr.lead[s];
    if (lead !== null) tone(ctx, tr.leadWave, midiHz(lead), t, eighth * tr.leadLen, tr.leadVol);
    const off = tr.bass[beat];
    if (off !== null) tone(ctx, tr.bassWave, midiHz(tr.roots[bar] + off), t, eighth * tr.bassLen, tr.bassVol);
    if (tr.kick.includes(beat)) tone(ctx, 'triangle', 150, t, 0.12, tr.kickVol, 40);
    if (tr.hat.includes(beat)) hat(ctx, t + eighth / 2, tr.hatVol); // off-beat hat
  }

  function schedule() {
    const a = audio();
    if (!a) return;
    const ctx = a.ctx;
    // After a throttled background tab, skip ahead instead of firing a burst of late notes.
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const eighth = 30 / (TRACKS[current].bpm * (fast ? FAST_FACTOR : 1));
      try { playStep(ctx, step, nextTime, eighth); } catch (e) { /* ignore */ }
      nextTime += eighth;
      step = (step + 1) % TRACKS[current].lead.length;
    }
  }

  function musicStart() {
    wanted = true;
    if (timer !== null) return; // already playing: never stack a second loop
    const a = audio();
    if (!a) return;             // not unlocked yet: the first keydown starts it
    const ctx = a.ctx;
    try {
      bus = ctx.createGain(); // new bus, so a fading old one never cuts the new track
      bus.connect(a.master);
      if (!noise) {
        noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
        const data = noise.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
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
    const old = bus;
    bus = null;
    if (!a || !old) return;
    try { // quick fade so already-scheduled notes don't ring out, then drop the old bus
      const t = a.ctx.currentTime;
      old.gain.cancelScheduledValues(t);
      old.gain.setValueAtTime(old.gain.value, t);
      old.gain.linearRampToValueAtTime(0, t + 0.25);
      setTimeout(() => { try { old.disconnect(); } catch (e) { /* ignore */ } }, 400);
    } catch (e) { /* ignore */ }
  }

  // Picks a track (saved for the next visit). If music is playing it restarts on the new track.
  function setTrack(i) {
    const n = TRACKS.length;
    current = ((Math.floor(i) % n) + n) % n;
    try { localStorage.setItem(STORE_KEY, String(current)); } catch (e) { /* ignore */ }
    if (timer !== null) { musicStop(); musicStart(); }
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
  CoinSound.setTrack = setTrack;
  CoinSound.currentTrack = () => current;
  CoinSound.trackNames = TRACKS.map((t) => t.name);

  // Runs after sound.js's keydown listener has created/resumed the AudioContext.
  window.addEventListener('keydown', () => { if (wanted) musicStart(); });
})();
