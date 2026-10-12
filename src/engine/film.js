/**
 * Moteur du film 3D (mode Regarder).
 *
 * L'histoire entière devient UN film continu : chaque scène possède une piste
 * d'images clés (caméra, personnages, actions, sons) exprimée en temps NORMALISÉ
 * (0 = début de la scène, 1 = fin). La durée réelle de chaque scène vient de la
 * narration (une phrase = un segment), ce qui garde l'image, la voix et les
 * sous-titres synchronisés quelle que soit la vitesse de lecture ou la langue.
 *
 * Tout est pur (pas de React, pas de Three.js) : testé dans tests/engines.test.js.
 */
import { buildPage, estimateTimeline } from './text.js';

export const INTRO_S = 3.2;      // carton « Kan ya makan… » + titre
export const OUTRO_S = 3.5;      // carton « Fin »
export const SCENE_LEAD_S = 1.4; // l'image s'installe avant la première phrase
export const SCENE_TAIL_S = 1.6; // l'action se termine après la dernière phrase
export const SENTENCE_GAP_S = 0.45;
export const FADE_S = 0.55;

/* ----------------------------------------------------------------------- */
/* Texte d'une scène                                                       */
/* ----------------------------------------------------------------------- */

/** Langue du texte : la langue demandée si la scène l'a, sinon la langue du livre. */
export function textLang(book, lang) {
  const first = book.scenes[0] || {};
  if (first[lang]) return lang;
  return book.lang || (first.fr ? 'fr' : 'ar');
}

export function sceneSentences(book, sceneIdx, lang, simplified = false) {
  const scene = book.scenes[sceneIdx];
  const data = scene[textLang(book, lang)];
  return data.sentences.map((s) => (simplified && s.simple ? s.simple : s.t));
}

/* ----------------------------------------------------------------------- */
/* Timeline                                                                */
/* ----------------------------------------------------------------------- */

export function sentenceSeconds(text, rate = 1) {
  const { total } = estimateTimeline(buildPage([text]), rate);
  return total / 1000 + SENTENCE_GAP_S;
}

/**
 * @returns {{
 *   total:number, introEnd:number, outroStart:number,
 *   scenes:{index:number,start:number,dur:number,end:number}[],
 *   segments:{scene:number,sentence:number,text:string,start:number,dur:number}[]
 * }}
 */
export function buildTimeline(book, { lang = 'fr', simplified = false, rate = 1, from = 0, to, intro = true, outro = true } = {}) {
  const last = to ?? book.scenes.length - 1;
  let t = intro ? INTRO_S : 0;
  const introEnd = t;
  const scenes = [];
  const segments = [];
  for (let i = from; i <= last; i++) {
    const start = t;
    t += SCENE_LEAD_S;
    sceneSentences(book, i, lang, simplified).forEach((text, j) => {
      const dur = sentenceSeconds(text, rate);
      segments.push({ scene: i, sentence: j, text, start: t, dur });
      t += dur;
    });
    t += SCENE_TAIL_S;
    const minDur = book.scenes[i].duree_film_s || 0;
    if (t - start < minDur) t = start + minDur;
    scenes.push({ index: i, start, dur: t - start, end: t });
  }
  const outroStart = t;
  if (outro) t += OUTRO_S;
  return { total: t, introEnd, outroStart, scenes, segments };
}

export function sceneAt(timeline, t) {
  const { scenes } = timeline;
  if (!scenes.length) return null;
  if (t < scenes[0].start) return scenes[0];
  for (const s of scenes) if (t < s.end) return s;
  return scenes[scenes.length - 1];
}

export function segmentAt(timeline, t) {
  let found = null;
  for (const s of timeline.segments) {
    if (t >= s.start && t < s.start + s.dur) return s;
    if (s.start <= t) found = s;
  }
  return found && t < found.start + found.dur ? found : null;
}

export function segmentIndexAt(timeline, t) {
  const seg = segmentAt(timeline, t);
  return seg ? timeline.segments.indexOf(seg) : -1;
}

/** Progression normalisée (0..1) dans la scène courante. */
export function sceneProgress(timeline, t) {
  const s = sceneAt(timeline, t);
  if (!s) return 0;
  return clamp01((t - s.start) / s.dur);
}

/** Opacité du fondu au noir entre deux scènes (0 = image nette). */
export function fadeAt(timeline, t) {
  if (t < timeline.introEnd) return 0;
  let a = 0;
  for (const s of timeline.scenes) {
    const dIn = t - s.start;
    const dOut = s.end - t;
    if (dIn >= 0 && dIn < FADE_S && s.index !== timeline.scenes[0].index) a = Math.max(a, 1 - dIn / FADE_S);
    if (dOut >= 0 && dOut < FADE_S && s !== timeline.scenes[timeline.scenes.length - 1]) a = Math.max(a, 1 - dOut / FADE_S);
  }
  return a;
}

/* ----------------------------------------------------------------------- */
/* Images clés                                                             */
/* ----------------------------------------------------------------------- */

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (u) => u * u * (3 - 2 * u);
const lerp = (a, b, u) => a + (b - a) * u;
const lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
function lerpAngle(a, b, u) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * u;
}

/** Trouve les deux clés qui encadrent p et le facteur adouci entre elles. */
export function bracket(keys, p) {
  if (!keys.length) return null;
  if (p <= keys[0][0]) return { a: keys[0], b: keys[0], u: 0 };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (p <= b[0]) return { a, b, u: smooth(clamp01((p - a[0]) / Math.max(1e-6, b[0] - a[0]))) };
  }
  const k = keys[keys.length - 1];
  return { a: k, b: k, u: 0 };
}

/**
 * Piste par défaut quand une scène n'a pas de film écrit (livres importés) :
 * lent travelling vers les personnages déclarés, sans rien inventer.
 */
export function defaultTrack(scene) {
  const actors = {};
  (scene.characters || []).forEach((c, i) => {
    const flying = c.id === 'oiseau';
    const y = flying ? 1.75 : 0;
    const pos = [c.position[0], y, c.position[1]];
    const action = c.animation || 'respirer';
    const delay = 0.04 * i;
    if (c.enter === 'fly') {
      // arrive du ciel, puis se pose (ou reste en vol au-dessus du sol)
      actors[c.id] = [[0, [pos[0] + 5, 5, pos[2] - 4], -1.2, 'voler'], [0.3 + delay, pos, -0.4, 'voler'], [1, pos, 0, 'voler']];
    } else if (c.enter === 'walk') {
      // entre par le côté le plus proche, en marchant
      const side = pos[0] >= 0 ? 1 : -1;
      const rot = -side * Math.PI / 2;
      actors[c.id] = [[0, [pos[0] + side * 5, y, pos[2] + 1.5], rot, 'marcher'], [0.35 + delay, pos, 0, 'marcher'], [0.45 + delay, pos, 0, action], [1, pos, 0, action]];
    } else {
      actors[c.id] = [[0, pos, 0, 'respirer'], [0.25, pos, 0, action], [1, pos, 0, action]];
    }
  });
  return {
    // plan large qui se resserre doucement sur les personnages
    camera: [
      [0, [0, 3.8, 10.5], [0, 1, -1]],
      [1, [0.9, 2.6, 6.8], [0, 1.1, 0]],
    ],
    actors,
    sounds: scene.sound ? [[0.08, scene.sound.type]] : [],
  };
}

export function trackOf(scene) {
  return scene.film || defaultTrack(scene);
}

/**
 * Échantillonne une piste à la progression p.
 * reduced=true (« réduire les animations ») : caméra fixe sur le dernier plan,
 * personnages déplacés par petits paliers au lieu d'un mouvement continu.
 */
export function sampleTrack(track, p, { reduced = false } = {}) {
  const pp = reduced ? Math.round(clamp01(p) * 3) / 3 : clamp01(p);
  const camKeys = track.camera || [];
  let camera = null;
  if (camKeys.length) {
    if (reduced) {
      const k = camKeys[camKeys.length - 1];
      camera = { pos: k[1], look: k[2] };
    } else {
      const { a, b, u } = bracket(camKeys, pp);
      camera = { pos: lerp3(a[1], b[1], u), look: lerp3(a[2], b[2], u) };
    }
  }
  const actors = {};
  for (const [id, keys] of Object.entries(track.actors || {})) {
    const { a, b, u } = bracket(keys, pp);
    const moving = a !== b && dist(a[1], b[1]) > 0.05 && u > 0 && u < 1;
    actors[id] = {
      pos: lerp3(a[1], b[1], u),
      rotY: lerpAngle(a[2] || 0, b[2] || 0, u),
      // l'action d'une clé dure jusqu'à la clé suivante
      action: u >= 0.999 ? b[3] || a[3] : a[3],
      moving,
    };
  }
  return { camera, actors };
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Sons dont l'instant est franchi entre p0 (exclu) et p1 (inclus). */
export function soundsBetween(track, p0, p1) {
  return (track.sounds || []).filter(([t]) => t > p0 && t <= p1).map(([, type]) => type);
}

/* ----------------------------------------------------------------------- */
/* Livres avec une vraie vidéo : chaque scène a son extrait `clip: [début, fin]` */
/* ----------------------------------------------------------------------- */
export function sceneIndexAt(book, t) {
  const i = book.scenes.findIndex((s) => t >= s.clip[0] && t < s.clip[1]);
  if (i >= 0) return i;
  return t >= book.scenes[book.scenes.length - 1].clip[1] - 0.2 ? book.scenes.length - 1 : 0;
}
