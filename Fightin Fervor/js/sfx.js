// =========================================================
// FIGHTIN' FERVOR — sfx.js
// Procedural sound effects via Web Audio API.
// No external files — every sound is synthesised in-browser.
// Usage: SFX.punch() / SFX.heavyHit() / SFX.block() / SFX.guardBreak() / SFX.whoosh()
// =========================================================

const SFX = (() => {
  let ctx = null;
  let masterGain = null;

  // Lazy-init on first call (browsers block AudioContext before user gesture)
  function _ctx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.45;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Helpers ─────────────────────────────────────────────

  // White-noise burst — basis for thud / punch sounds
  function _noiseBurst(duration = 0.08, vol = 0.6) {
    const ac = _ctx();
    const bufSize = Math.ceil(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);

    src.connect(gain);
    gain.connect(masterGain);
    src.start();
    src.stop(ac.currentTime + duration + 0.01);
  }

  // Single oscillator with attack-decay envelope
  function _tone(freq, type, attackT, decayT, vol = 0.5) {
    const ac = _ctx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.3, ac.currentTime + decayT);

    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ac.currentTime + attackT);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + attackT + decayT);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    osc.stop(ac.currentTime + attackT + decayT + 0.01);
  }

  // Low-pass filtered noise — punchy thud character
  function _filteredNoise(cutoff, q, duration, vol = 0.5) {
    const ac = _ctx();
    const bufSize = Math.ceil(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.1, ac.currentTime + duration);
    filter.Q.value = q;

    const gain = ac.createGain();
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration * 0.9);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start();
    src.stop(ac.currentTime + duration + 0.01);
  }

  // ── Public Sound API ────────────────────────────────────

  // Light punch — quick slap/snap sound
  function punch() {
    _filteredNoise(2200, 3, 0.06, 0.55);
    _tone(180, 'sine', 0.003, 0.07, 0.18);
  }

  // Heavy hit — deep thud + low boom
  function heavyHit() {
    _filteredNoise(900, 5, 0.14, 0.75);
    _tone(65, 'sine', 0.002, 0.18, 0.55);
    _tone(120, 'triangle', 0.005, 0.12, 0.25);
    // high crack accent
    setTimeout(() => _filteredNoise(3500, 2, 0.04, 0.3), 8);
  }

  // Block — metallic clang / short ring
  function block() {
    _tone(680, 'triangle', 0.002, 0.09, 0.35);
    _tone(920, 'sine', 0.001, 0.06, 0.2);
    _filteredNoise(5000, 8, 0.05, 0.25);
  }

  // Guard break — sharp crunch + low hit
  function guardBreak() {
    _filteredNoise(1400, 6, 0.1, 0.65);
    _tone(90, 'sawtooth', 0.003, 0.15, 0.5);
    _tone(200, 'sine', 0.002, 0.1, 0.3);
  }

  // Whoosh — attack startup air-swipe
  function whoosh(heavy = false) {
    const ac = _ctx();
    const bufSize = Math.ceil(ac.sampleRate * 0.12);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ac.createBufferSource();
    src.buffer = buf;

    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(heavy ? 800 : 1600, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(heavy ? 200 : 400, ac.currentTime + 0.12);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(heavy ? 0.25 : 0.12, ac.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.12);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    src.start();
    src.stop(ac.currentTime + 0.14);
  }

  // Stagger / guard-broken reel
  function stagger() {
    _tone(110, 'sawtooth', 0.005, 0.22, 0.4);
    _filteredNoise(600, 4, 0.18, 0.3);
  }

  // KO — dramatic low hit + tone drop
  function ko() {
    _filteredNoise(600, 6, 0.25, 0.9);
    _tone(55, 'sine', 0.01, 0.35, 0.7);
    setTimeout(() => _tone(42, 'sine', 0.01, 0.5, 0.5), 60);
  }

  return { punch, heavyHit, block, guardBreak, whoosh, stagger, ko };
})();
