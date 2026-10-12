/**
 * Effets sonores doux générés par Web Audio (aucun fichier à licencier).
 * Règles : jamais de lecture automatique, montée progressive du volume,
 * aucun son soudain. Chaque son a un équivalent visuel dans la scène.
 */

let ctx = null;
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function envelope(gain, t0, peak, attack, hold, release) {
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + attack);
  gain.gain.setValueAtTime(Math.max(peak, 0.0002), t0 + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + hold + release);
}

function wind(c, volume) {
  const len = c.sampleRate * 3;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // bruit brun
    data[i] = last * 3;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;
  filter.Q.value = 0.6;
  const g = c.createGain();
  envelope(g, c.currentTime, 0.35 * volume, 0.8, 1.2, 0.9);
  src.connect(filter).connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + 3);
}

function chirps(c, volume) {
  const notes = [2200, 2600, 2400, 2900];
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.28;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.12);
    const g = c.createGain();
    envelope(g, t, 0.08 * volume, 0.03, 0.06, 0.12);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.3);
  });
}

function chimes(c, volume) {
  // « Rires » représentés par un arpège joyeux et doux
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
  notes.forEach((f, i) => {
    const t = c.currentTime + i * 0.16;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    const g = c.createGain();
    envelope(g, t, 0.12 * volume, 0.04, 0.05, 0.35);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + 0.5);
  });
}

export function playSound(type, { volume = 0.7, silent = false } = {}) {
  if (silent || volume <= 0) return false;
  const c = audioCtx();
  if (!c) return false;
  if (type === 'vent') wind(c, volume);
  else if (type === 'chant') chirps(c, volume);
  else if (type === 'rires') chimes(c, volume);
  else return false;
  return true;
}
