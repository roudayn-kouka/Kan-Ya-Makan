/**
 * Moteur d'adaptation (6 bis F) : transforme le profil de l'enfant en réglages
 * appliqués AU MOMENT DE L'AFFICHAGE. Le script de scène n'est jamais regénéré.
 */

export const BACKGROUNDS = {
  creme: '#fbf6ec',
  peche: '#fbeee2',
  menthe: '#eef6ef',
  gris: '#f1f1ee',
};

const FONTS = {
  lexend: { fr: "'Lexend', system-ui, sans-serif", ar: "'Noto Kufi Arabic', Tahoma, sans-serif" },
  verdana: { fr: 'Verdana, Tahoma, sans-serif', ar: 'Tahoma, sans-serif' },
  system: { fr: 'system-ui, sans-serif', ar: 'system-ui, sans-serif' },
};

/**
 * Variables CSS de la zone de lecture.
 * Arabe : l'espacement des lettres casse la liaison des lettres (écriture cursive),
 * il est donc converti en espacement des mots supplémentaire.
 */
export function readingVars(profile, lang) {
  const d = profile.display;
  const font = (FONTS[d.font] || FONTS.lexend)[lang === 'ar' ? 'ar' : 'fr'];
  const letter = lang === 'ar' ? 0 : d.letterSpacing;
  const word = lang === 'ar' ? d.wordSpacing + d.letterSpacing * 1.5 : d.wordSpacing;
  return {
    '--read-font': font,
    '--read-size': `${d.fontSize}px`,
    '--read-letter': `${letter}em`,
    '--read-word': `${word}em`,
    '--read-line': String(lang === 'ar' ? Math.max(d.lineHeight, 1.8) : d.lineHeight),
    '--read-measure': `${d.lineLength}ch`,
    '--read-bg': BACKGROUNDS[d.background] || BACKGROUNDS.creme,
  };
}

/**
 * Palettes des scènes 3D par jetons. Les palettes « daltonisme » s'appuient sur
 * la palette Okabe-Ito et gardent des contrastes de luminosité forts entre
 * personnages et décor. Les formes (▲ ● ■ ◆) complètent toujours la couleur.
 */
export const PALETTES = {
  standard: {
    sky: '#cfe8f5', skyEvening: '#f6c9a6', ground: '#9cc07a', rock: '#8a8175', snow: '#f7f5ef', skyNight: '#2c3a66', sea: '#3f8fc0', sand: '#ecd9a8',
    dragon: '#f4a62a', dragonBelly: '#ffe3a3', bird: '#3b82c4', yasmine: '#c8283c', adam: '#6c5ce7', heart: '#d9776f', bloodPoor: '#3b6fd6', bloodRich: '#d7263d', lung: '#f2b8c6',
    house: '#fbfaf5', door: '#2f6fb5', tree: '#2e7d4f', trunk: '#7a5230', path: '#dcc59c', skin: '#e0ac7d',
  },
  protanopie: {
    sky: '#d6e6f2', skyEvening: '#efd9b8', ground: '#c9c3a2', rock: '#6d6a66', snow: '#f7f5ef', skyNight: '#2b3553', sea: '#0072b2', sand: '#efe3c4',
    dragon: '#e69f00', dragonBelly: '#fbe2a0', bird: '#0072b2', yasmine: '#56b4e9', adam: '#1a1a1a', heart: '#c9a38f', bloodPoor: '#0072b2', bloodRich: '#e69f00', lung: '#e8dcc0',
    house: '#fbfaf5', door: '#0072b2', tree: '#5f6b5a', trunk: '#4a3f35', path: '#e8dcc0', skin: '#d9b48f',
  },
  deuteranopie: {
    sky: '#d6e6f2', skyEvening: '#efd9b8', ground: '#cfc7a0', rock: '#6d6a66', snow: '#f7f5ef', skyNight: '#2b3553', sea: '#0072b2', sand: '#efe3c4',
    dragon: '#e69f00', dragonBelly: '#fbe2a0', bird: '#0072b2', yasmine: '#cc79a7', adam: '#1a1a1a', heart: '#c9a38f', bloodPoor: '#0072b2', bloodRich: '#e69f00', lung: '#e8dcc0',
    house: '#fbfaf5', door: '#0072b2', tree: '#58645a', trunk: '#4a3f35', path: '#e8dcc0', skin: '#d9b48f',
  },
  achromatopsie: {
    // vision sans couleurs : tout repose sur des écarts de clarté très nets (+ formes)
    sky: '#e6e6e6', skyEvening: '#d0d0d0', ground: '#9a9a9a', rock: '#5a5a5a', snow: '#ffffff', skyNight: '#2a2a2a', sea: '#6e6e6e', sand: '#dcdcdc',
    dragon: '#f0f0f0', dragonBelly: '#ffffff', bird: '#1a1a1a', yasmine: '#4a4a4a', adam: '#111111', heart: '#b0b0b0', bloodPoor: '#1a1a1a', bloodRich: '#ffffff', lung: '#d8d8d8',
    house: '#ffffff', door: '#222222', tree: '#3a3a3a', trunk: '#222222', path: '#cfcfcf', skin: '#bdbdbd',
  },
  tritanopie: {
    sky: '#e3e3e3', skyEvening: '#f0d6d6', ground: '#b9c9a8', rock: '#6d6a66', snow: '#f7f5ef', skyNight: '#333333', sea: '#009e73', sand: '#efe3c4',
    dragon: '#d55e00', dragonBelly: '#f6c1a0', bird: '#009e73', yasmine: '#cc79a7', adam: '#1a1a1a', heart: '#c98f8f', bloodPoor: '#009e73', bloodRich: '#d55e00', lung: '#f0d6d6',
    house: '#fbfaf5', door: '#d55e00', tree: '#3d6b4f', trunk: '#4a3f35', path: '#e8dcc0', skin: '#d9b48f',
  },
};

export function paletteFor(profile) {
  return PALETTES[profile.scene.palette] || PALETTES.standard;
}

/** Réduction des animations : réglage de l'enfant OU réglage système. */
export function prefersReducedMotion(profile) {
  const sys = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const device = typeof document !== 'undefined' && document.documentElement?.dataset?.motion === 'reduce';
  return Boolean(profile.scene.reducedMotion || sys || device);
}

export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
