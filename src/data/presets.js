/**
 * Préréglages de confort (6.6 et 6.15). Ce sont des POINTS DE DÉPART à ajuster
 * pour chaque enfant, pas des réglages optimaux prouvés ni des étiquettes médicales.
 */

export const PRESET_IDS = ['general', 'dyslexie', 'tdah', 'dyslexie_tdah', 'comprehension'];

const BASE = {
  preset: 'general',
  display: {
    font: 'lexend',          // lexend | verdana | system  (OpenDyslexic : préférence possible, licence à vérifier)
    fontSize: 22,            // px
    letterSpacing: 0,        // em — forcé à 0 en arabe (sinon les lettres se déconnectent)
    wordSpacing: 0,          // em
    lineHeight: 1.5,
    lineLength: 65,          // caractères (ch)
    background: 'creme',     // creme | peche | menthe | gris
    ruler: false,            // règle de lecture
  },
  text: { simplified: false },
  audio: {
    narration: false,        // mode Écouter activé par défaut à l'ouverture d'un livre
    highlight: 'none',       // none | word | sentence
    rate: 1,
    volume: 0.7,
    silent: false,
    visualEquivalents: true, // équivalents visuels des sons
    captions: false,         // sous-titres toujours affichés (troubles de l'audition)
    voiceURI: null,
  },
  scene: {
    renderMode: '3d',        // 3d | illustration
    focusMode: false,
    singleMotion: false,     // un seul élément animé à la fois
    reducedMotion: false,
    palette: 'standard',     // standard | protanopie | deuteranopie | tritanopie | achromatopsie
    shapes: false,           // formes en plus de la couleur
    split: 0.5,              // part du texte à l'écran
  },
  pauses: { enabled: false, everyScenes: 3 },
  a11y: { bigTargets: false }, // difficultés de parole ou de motricité : tout au toucher, cibles agrandies
  needs: {},                   // ce que le parent a remarqué à l'inscription (jamais un diagnostic)
};

const clone = (o) => JSON.parse(JSON.stringify(o));

export function presetProfile(id = 'general') {
  const p = clone(BASE);
  p.preset = id;
  if (id === 'dyslexie' || id === 'dyslexie_tdah') {
    Object.assign(p.display, { letterSpacing: 0.12, wordSpacing: 0.35, lineHeight: 1.8, lineLength: 50, fontSize: 24 });
    Object.assign(p.audio, { narration: true, highlight: 'sentence', rate: 0.9 });
  }
  if (id === 'comprehension') {
    // Retard de compréhension (6.6) : texte simplifié par défaut, aide mise en avant, questions courtes
    Object.assign(p.text, { simplified: true });
    Object.assign(p.audio, { narration: true, highlight: 'sentence', rate: 0.9 });
    Object.assign(p.display, { lineLength: 55, fontSize: 23 });
  }
  if (id === 'tdah' || id === 'dyslexie_tdah') {
    Object.assign(p.display, { lineLength: 50 });
    if (id === 'tdah') p.display.letterSpacing = 0.05;
    Object.assign(p.scene, { focusMode: true, singleMotion: true });
    Object.assign(p.pauses, { enabled: true, everyScenes: 2 });
  }
  return p;
}

export function defaultRules() {
  return {
    sessionMaxMin: 15,
    dayMaxMin: 30,
    window: { enabled: false, start: '16:00', end: '19:30', days: [1, 2, 3, 4, 5, 6, 7] },
    weeklyGoalScenes: 10,
    rewards: [
      { id: 'r1', stars: 10, label: { fr: 'Choisir la prochaine histoire', ar: 'اختيار الحكاية القادمة' } },
      { id: 'r2', stars: 25, label: { fr: 'Une activité en famille', ar: 'نشاط مع العائلة' } },
    ],
    importAllowed: false,
    promptAllowed: false,
  };
}

/** Fusion profonde simple (objets seulement), utilisée pour appliquer une suggestion validée. */
export function deepMerge(target, patch) {
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof out[k] === 'object' && out[k] !== null) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export const AVATARS = [
  { id: 'renard', emoji: '🦊', label: { fr: 'Renard', ar: 'ثعلب' } },
  { id: 'tortue', emoji: '🐢', label: { fr: 'Tortue', ar: 'سلحفاة' } },
  { id: 'hibou', emoji: '🦉', label: { fr: 'Hibou', ar: 'بومة' } },
  { id: 'lapin', emoji: '🐰', label: { fr: 'Lapin', ar: 'أرنب' } },
  { id: 'ours', emoji: '🐻', label: { fr: 'Ours', ar: 'دب' } },
  { id: 'lion', emoji: '🦁', label: { fr: 'Lion', ar: 'أسد' } },
];

export const CODE_IMAGES = [
  { id: 'soleil', emoji: '☀️', label: { fr: 'Soleil', ar: 'شمس' } },
  { id: 'lune', emoji: '🌙', label: { fr: 'Lune', ar: 'قمر' } },
  { id: 'etoile', emoji: '⭐', label: { fr: 'Étoile', ar: 'نجمة' } },
  { id: 'poisson', emoji: '🐟', label: { fr: 'Poisson', ar: 'سمكة' } },
  { id: 'fleur', emoji: '🌸', label: { fr: 'Fleur', ar: 'زهرة' } },
  { id: 'pomme', emoji: '🍎', label: { fr: 'Pomme', ar: 'تفاحة' } },
];

export const AGE_RANGES = ['5-7', '8-10', '11-13'];
