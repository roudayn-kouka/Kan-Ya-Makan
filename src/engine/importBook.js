/**
 * Chaîne d'import d'un livre (6 bis C), version prototype SANS IA :
 * extraction (fichier) → nettoyage → découpage en phrases → pages de 30 à 60 s
 * (jamais une phrase coupée) → niveau → script de scène par mots-clés → contrôle.
 *
 * Règle de fidélité : la scène ne montre que ce que le texte nomme. Un personnage
 * n'apparaît que si le texte le mentionne ; sans décor reconnu, on garde un décor neutre.
 * Le texte simplifié, les explications et les questions demandent le modèle de langage
 * de la version finale : ils sont absents (et signalés) pour un livre importé.
 */
import { buildPage, estimateTimeline } from './text.js';

/* ---------------- Nettoyage ---------------- */
export function cleanText(raw) {
  return String(raw || '')
    .replace(/\r\n?/g, '\n')
    .replace(/­/g, '')                                  // césures invisibles
    .split('\n')
    .filter((line) => !/^\s*(page\s*)?\d{1,4}\s*$/i.test(line)) // numéros de page seuls
    .filter((line) => !/^\s*[-–—_*=]{3,}\s*$/.test(line))       // lignes de séparation
    .join('\n')
    .replace(/([A-Za-zÀ-ÿ])-\n([a-zà-ÿ])/g, '$1$2')             // mot coupé en fin de ligne
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split(/\n\s*\n/)                                          // paragraphes
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

/* ---------------- Phrases ---------------- */
export function splitSentences(text) {
  const out = [];
  for (const para of text.split(/\n\n/)) {
    // coupe après . ! ? … ؟ (et guillemet fermant éventuel) suivi d'un espace
    const parts = para.match(/[^.!?…؟]+(?:[.!?…؟]+["»”']?|$)/g) || [];
    let buf = '';
    for (const p of parts) {
      const s = (buf ? buf + p.trimStart() : p).trim();
      // ne pas couper après une abréviation courte (M. Dr. etc.) ni sur un fragment vide
      if (/\b(M|Mme|Dr|St|etc)\.$/.test(s) || s.replace(/[\s"«»”'.!?…؟]/g, '').length < 2) { buf = `${s} `; continue; }
      out.push(s);
      buf = '';
    }
    if (buf.trim()) out.push(buf.trim());
  }
  return out.filter((s) => s.replace(/[\s"«»”'.!?…؟]/g, '').length > 0);
}

/* ---------------- Pages ---------------- */
/**
 * paragraphStarts (optionnel) : indices des phrases qui commencent un paragraphe.
 * Une nouvelle page commence à un paragraphe dès que la page a déjà 2 phrases
 * (frontière naturelle du texte), et jamais au-delà de 60 s.
 */
export function paginate(sentences, { target = 45, max = 60, rate = 1, paragraphStarts = null } = {}) {
  const pages = [];
  let cur = [];
  let curS = 0;
  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    const d = estimateTimeline(buildPage([s]), rate).total / 1000;
    const newPara = paragraphStarts?.has(i) && cur.length >= 2;
    if (cur.length && (curS + d > max || curS >= target || newPara)) {
      pages.push(cur);
      cur = [];
      curS = 0;
    }
    cur.push(s);
    curS += d;
  }
  if (cur.length) pages.push(cur);
  return pages;
}

/* ---------------- Niveau ---------------- */
export function estimateLevel(sentences) {
  const words = sentences.flatMap((s) => s.split(/\s+/).filter((w) => /[\p{L}]/u.test(w)));
  const avgWords = words.length / Math.max(1, sentences.length);
  const avgLetters = words.reduce((n, w) => n + w.replace(/[^\p{L}]/gu, '').length, 0) / Math.max(1, words.length);
  const score = avgWords * 0.6 + avgLetters * 2.2;
  const level = score < 17 ? 'facile' : score < 23 ? 'moyen' : 'difficile';
  return { level, avgWords: Math.round(avgWords * 10) / 10, avgLetters: Math.round(avgLetters * 10) / 10 };
}

/* ---------------- Script de scène par mots-clés ---------------- */
/** Mot-clé français entier (lettres accentuées comprises) OU racine arabe (préfixes ال، و… acceptés). */
const kw = (fr, ar) => new RegExp(`(?<![\\p{L}])(?:${fr})(?![\\p{L}])|${ar}`, 'iu');

const DECORS = [
  ['mer', kw('mers?|plages?|bateaux?|vagues?|océans?|poissons?|sable', 'بحر|شاطئ|قارب|موج|سمك')],
  ['montagne', kw('montagnes?|sommets?|collines?|rochers?', 'جبل|قمة')],
  ['foret', kw('forêts?|bois|arbres?|jardins?|chemins?|champs?', 'غابة|شجر|حديقة|طريق|حقل')],
  ['vallee', kw('vallées?', 'وادي')],
  ['village', kw('villages?|maisons?|villes?|rues?|écoles?|marchés?|médinas?', 'قرية|بيت|منزل|مدينة|شارع|مدرسة|سوق')],
];
const AMBIANCES = [
  ['nuit', kw('nuits?|lune|étoiles?', 'ليل|قمر|نجوم')],
  ['soir', kw('soirs?|soirée|coucher', 'مساء|غروب')],
  ['matin', kw('matins?|aube|lever', 'صباح|فجر')],
];
const CHARACTERS = [
  ['dragon', kw('dragons?', 'تنين'), { fr: 'Le dragon', ar: 'التنين' }, '▲'],
  ['oiseau', kw('oiseau|oiseaux|moineaux?|hirondelles?', 'عصفور|طائر|طير'), { fr: "L'oiseau", ar: 'العصفور' }, '●'],
  ['yasmine', kw('filles?|fillettes?|sœurs?|princesses?', 'بنت|فتاة|أخت|أميرة'), { fr: 'La fille', ar: 'البنت' }, '■'],
  ['adam', kw('garçons?|frères?|princes?', 'ولد|صبي|أمير(?!ة)'), { fr: 'Le garçon', ar: 'الولد' }, '◆'],
];
const SOUNDS = [
  ['vent', kw('vents?|souffle|soufflait|tempêtes?', 'ريح|رياح|عاصفة'), 'particules'],
  ['chant', kw('chante|chantait|chantent|chants?|gazouill\\p{L}*', 'يغرد|غناء|يغني'), 'notes'],
  ['rires', kw('rit|riait|rires?|rient|riaient', 'يضحك|ضحك'), 'etoiles'],
];
const DECOR_EMOJI = { mer: '🌊', montagne: '⛰️', foret: '🌳', vallee: '🏞️', village: '🏘️' };
const WHERE = {
  mer: { fr: 'Au bord de la mer', ar: 'على شاطئ البحر' },
  montagne: { fr: 'Dans la montagne', ar: 'في الجبل' },
  foret: { fr: 'Dans la nature', ar: 'في الطبيعة' },
  vallee: { fr: 'Dans la vallée', ar: 'في الوادي' },
  village: { fr: 'Au village', ar: 'في القرية' },
};
const SLOTS = [[0, 0], [-1.6, 0.8], [1.6, 0.8]];

/* Groupes : « les enfants » fait apparaître la fille et le garçon */
const GROUPS = [[kw('enfants', 'الأطفال|أطفال'), ['yasmine', 'adam']]];

/* Les verbes de la page deviennent des animations (la scène ne montre que ce que dit le texte) */
const ACTIONS = [
  ['fly', kw('vol\\p{L}*|envol\\p{L}*|se posa|posa', 'طار|حط|يطير')],
  ['walk', kw("descendit|marcha|marchait|courut|arriva|arrivèrent|approch\\p{L}*|partit", 'نزل|مشى|ركض|وصل|اقترب|ذهب')],
  ['baisser_tete', kw('baissa', 'أحنى')],
  ['regarder', kw('regard\\p{L}*|observ\\p{L}*', 'ينظر|نظر|يراقب')],
  ['rire', kw('rit|riait|rient|sourit|souriait|joyeux|joie', 'يضحك|ضحك|ابتسم')],
  ['raconter', kw('racont\\p{L}*|commença|demanda|murmura', 'يحكي|حكى|سأل|همس')],
];

/**
 * Personnages présents : par leur type (« le dragon »), par leur nom quand le texte l'a
 * présenté (« Il s'appelait Nour »), ou par groupe (« les enfants »). 3 au maximum.
 */
// un groupe n'apparaît que si la phrase le montre présent (pas s'il est seulement évoqué)
const PRESENCE = kw('jou\\p{L}*|voyait|vit|approch\\p{L}*|arriv\\p{L}*|vinrent|couraient|riaient|rient|dansaient', 'يلعب\\p{L}*|يرى|رأى|اقترب\\p{L}*|وصل\\p{L}*|جاء\\p{L}*|يضحك\\p{L}*');
const PRONOUN = kw('il|son|sa|ses|lui|elle', 'هو|هي');

export function charactersIn(text, aliases = {}, { main = null, decor = null } = {}) {
  const ids = [];
  const add = (id) => { if (!ids.includes(id)) ids.push(id); };
  CHARACTERS.forEach(([id, re]) => { if (re.test(text)) add(id); });
  Object.entries(aliases).forEach(([name, id]) => {
    if (new RegExp(`(?<![\\p{L}])${name}(?![\\p{L}])`, 'u').test(text)) add(id);
  });
  // le personnage principal reste en scène quand la page parle de lui (« son aile », « il »)
  if (main && !ids.includes(main) && PRONOUN.test(text)) ids.unshift(main);
  // dans la vallée, les enfants du village font déjà partie du décor
  if (decor !== 'vallee') {
    for (const sentence of text.split(/(?<=[.!?…؟])\s+/)) {
      GROUPS.forEach(([re, members]) => { if (re.test(sentence) && PRESENCE.test(sentence)) members.forEach(add); });
    }
  }
  return ids.slice(0, 3);
}

/** « Il s'appelait Nour » / « nommé Nour » / « اسمه نور » → { Nour: <dernier type nommé avant> } */
export function learnNames(text, aliases) {
  const out = { ...aliases };
  const re = /(?:s['’]appel(?:ait|le)|nommée?|اسمه|اسمها)\s+([\p{Lu}؀-ۿ][\p{L}؀-ۿ]+)/gu;
  let m;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(0, m.index);
    let best = null;
    let bestPos = -1;
    CHARACTERS.forEach(([id, rx]) => {
      const g = new RegExp(rx.source, 'giu');
      let k;
      while ((k = g.exec(before)) !== null) if (k.index > bestPos) { bestPos = k.index; best = id; }
    });
    if (best) out[m[1].replace(/[،,.]$/, '')] = best;
  }
  return out;
}

export function sceneFromText(text, previous, aliases = {}, main = null) {
  const decorHit = DECORS.find(([, re]) => re.test(text));
  const verbs = ACTIONS.filter(([, re]) => re.test(text)).map(([a]) => a);
  let decor = decorHit ? decorHit[0] : previous?.decor || 'village';
  // « regarder la vallée » = vue d'en haut ; « descendre dans la vallée » = on arrive au village
  if (decor === 'vallee' && verbs.includes('walk')) decor = 'village';
  const amb = AMBIANCES.find(([, re]) => re.test(text));
  const ambiance = amb ? amb[0] : previous?.ambiance || 'matin';
  const before = new Set((previous?.characters || []).map((c) => c.id));
  const pose = verbs.find((v) => !['fly', 'walk'].includes(v)) || 'respirer';
  const characters = charactersIn(text, aliases, { main, decor }).map((id, i) => {
    // entrée animée quand le personnage arrive dans cette page (en volant, en marchant)
    let enter = null;
    if (id === 'oiseau' && verbs.includes('fly')) enter = 'fly';
    else if (verbs.includes('walk') && (!before.has(id) || decor !== previous?.decor)) enter = 'walk';
    else if (!before.has(id) && i > 0 && id !== 'oiseau') enter = 'walk';
    // la pose du verbe va au sujet (premier personnage) ; les autres réagissent (rire) ou respirent
    const subject = i === 0;
    let animation = subject ? pose : pose === 'rire' || pose === 'raconter' ? 'rire' : 'respirer';
    if (id === 'dragon' && animation === 'rire') animation = 'respirer';
    return { id, position: SLOTS[i], animation, enter, emotion: null, reveal: null };
  });
  const snd = SOUNDS.find(([, re]) => re.test(text));
  return {
    decor,
    decorGuessed: !decorHit,
    ambiance,
    camera: 'plan_large',
    where: WHERE[decor],
    emoji: DECOR_EMOJI[decor],
    characters,
    sound: snd ? { type: snd[0], visual: snd[2] } : null,
  };
}

/* ---------------- Contrôle de contenu ---------------- */
const FLAGGED = new RegExp('(?<![\\p{L}])(?:tuer|tué|tuée|meurtre|armes?|fusils?|couteaux?|drogues?|alcool|suicide)(?![\\p{L}])|قتل|سلاح|مسدس|سكين|مخدر|خمر|انتحار', 'giu');
export function contentCheck(text) {
  const hits = [...new Set((text.match(FLAGGED) || []).map((w) => w.toLowerCase()))];
  return hits;
}

export function detectLang(text) {
  const ar = (text.match(/[؀-ۿ]/g) || []).length;
  const lat = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  return ar > lat ? 'ar' : 'fr';
}

export const IMPORT_STEPS = ['reception', 'extraction', 'nettoyage', 'decoupage', 'niveau', 'scenes', 'controle', 'publication'];

/** Construit le livre complet (statut « en attente » : le parent doit l'approuver). */
export function buildImportedBook({ id, title, raw, lang, source = 'txt', childIds = [], now = new Date() }) {
  const text = cleanText(raw);
  const bookLang = lang || detectLang(text);
  const sentences = splitSentences(text);
  // indices des phrases qui ouvrent un paragraphe (frontières naturelles)
  const paragraphStarts = new Set();
  let n = 0;
  for (const para of text.split(/\n\n/)) {
    paragraphStarts.add(n);
    n += splitSentences(para).length;
  }
  const pages = paginate(sentences, { paragraphStarts });
  const level = estimateLevel(sentences);
  const warnings = contentCheck(text);
  const characters = {};
  let prev = null;
  let aliases = learnNames(text, {});
  // personnage principal : celui que le texte nomme le plus souvent
  const counts = {};
  CHARACTERS.forEach(([id, re]) => { counts[id] = (text.match(new RegExp(re.source, 'giu')) || []).length; });
  Object.entries(aliases).forEach(([name, id]) => { counts[id] += (text.match(new RegExp(name, 'gu')) || []).length; });
  const main = Object.entries(counts).sort((a, b) => b[1] - a[1]).find(([, n]) => n > 0)?.[0] || null;
  const scenes = pages.map((pageSentences, i) => {
    const pageText = pageSentences.join(' ');
    aliases = learnNames(pageText, aliases);
    const sc = sceneFromText(pageText, prev, aliases, main);
    prev = sc;
    sc.characters.forEach((c) => {
      const def = CHARACTERS.find(([cid]) => cid === c.id);
      characters[c.id] = { name: def[2], shape: def[3] };
    });
    return {
      id: i + 1,
      ...sc,
      duree_s: Math.round(estimateTimeline(buildPage(pageSentences), 1).total / 1000),
      [bookLang]: {
        sentences: pageSentences.map((t) => ({ t, simple: null, explain: null })),
        definitions: {},
      },
      question: null,
    };
  });
  const words = sentences.join(' ').split(/\s+/).length;
  return {
    id,
    type: 'import',
    source,
    lang: bookLang,
    title: { fr: title, ar: title },
    summary: { fr: `${scenes.length} pages · ${words} mots`, ar: `${scenes.length} صفحات · ${words} كلمة` },
    cover: scenes[0]?.emoji || '📘',
    durationMin: Math.max(1, Math.round(scenes.reduce((n, s) => n + s.duree_s, 0) / 60)),
    characters,
    aliases,
    scenes,
    level,
    warnings,
    status: 'pending',
    childIds,
    createdAt: now.toISOString(),
    stats: { sentences: sentences.length, words, pages: scenes.length },
  };
}
