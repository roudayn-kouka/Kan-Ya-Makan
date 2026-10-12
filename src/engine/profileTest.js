/**
 * Test de profil (6.8) : ~2 minutes, questions de CONFORT, jamais de diagnostic.
 * Transforme les réponses en préréglage de départ, que le parent peut ensuite ajuster.
 */
import { presetProfile } from '../data/presets.js';

/**
 * @param {{letters?:'often'|'sometimes'|'never', spacing?:'standard'|'large', focus?:'often'|'sometimes'|'never',
 *          colorsRG?:'yes'|'no', colorsBY?:'yes'|'no', loud?:'yes'|'no'}} a
 */
export function profileFromAnswers(a) {
  const dys = (a.letters && a.letters !== 'never') || a.spacing === 'large';
  const tdah = a.focus === 'often';
  const preset = dys && tdah ? 'dyslexie_tdah' : dys ? 'dyslexie' : tdah ? 'tdah' : 'general';
  const p = presetProfile(preset);

  if (a.spacing === 'large' && p.display.letterSpacing < 0.12) {
    p.display.letterSpacing = 0.12;
    p.display.wordSpacing = 0.35;
  }
  if (a.colorsRG === 'no') {
    p.scene.palette = 'deuteranopie';
    p.scene.shapes = true;
  } else if (a.colorsBY === 'no') {
    p.scene.palette = 'tritanopie';
    p.scene.shapes = true;
  }
  if (a.loud === 'yes') {
    p.audio.volume = 0.4;
    p.audio.visualEquivalents = true;
  }
  return p;
}

/** Qui remplit le test selon la tranche d'âge. */
export function whoFills(ageRange) {
  if (ageRange === '5-7') return 'parent_with_child';
  if (ageRange === '8-10') return 'child_with_adult';
  return 'child_alone';
}

/**
 * Besoins déclarés par le parent à l'inscription → réglages de départ.
 * needs = { reading, attention, comprehension, colors: 'none'|'rg'|'by'|'achro'|'unknown', hearing, speech }
 * Ce sont des observations de confort, pas un diagnostic : tout reste réglable.
 */
export const COLOR_TO_PALETTE = { rg: 'deuteranopie', protan: 'protanopie', deutan: 'deuteranopie', by: 'tritanopie', tritan: 'tritanopie', achro: 'achromatopsie', unknown: 'deuteranopie' };
export const PALETTE_TO_CVD = { protanopie: 'protan', deuteranopie: 'deutan', tritanopie: 'tritan', achromatopsie: 'achro' };

export function presetFromNeeds(needs = {}) {
  if (needs.reading && needs.attention) return 'dyslexie_tdah';
  if (needs.reading) return 'dyslexie';
  if (needs.attention) return 'tdah';
  if (needs.comprehension) return 'comprehension';
  return 'general';
}

export function profileFromNeeds(needs = {}) {
  const p = presetProfile(presetFromNeeds(needs));
  p.needs = { ...needs };
  if (needs.comprehension && p.preset !== 'comprehension') p.text.simplified = true;
  if (needs.colors && needs.colors !== 'none') {
    p.scene.palette = COLOR_TO_PALETTE[needs.colors] || 'deuteranopie';
    p.scene.shapes = true;
  }
  if (needs.hearing) {
    Object.assign(p.audio, { captions: true, visualEquivalents: true, highlight: p.audio.highlight === 'none' ? 'sentence' : p.audio.highlight });
  }
  if (needs.speech) p.a11y.bigTargets = true;
  return p;
}
