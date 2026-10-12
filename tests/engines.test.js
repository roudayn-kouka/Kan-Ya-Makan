// Tests des moteurs purs : `npm test` (Node 18+)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPage, locate, normalizeKey, estimateTimeline } from '../src/engine/text.js';
import { makeEvent, starsFor, badgesFor, crossedRewards, needsReadingDay } from '../src/engine/rewards.js';
import { observations, childStats } from '../src/engine/observations.js';
import { profileFromAnswers, whoFills } from '../src/engine/profileTest.js';
import { isInWindow, accessStatus } from '../src/engine/timeRules.js';
import { presetProfile, defaultRules, deepMerge } from '../src/data/presets.js';
import { readingVars } from '../src/engine/adaptation.js';
import { STORY } from '../src/data/story.js';

test('normalizeKey retire la ponctuation française et arabe', () => {
  assert.equal(normalizeKey('«Pourquoi'), 'pourquoi');
  assert.equal(normalizeKey("s'approchèrent,"), "s'approchèrent");
  assert.equal(normalizeKey('صباح،'), 'صباح');
  assert.equal(normalizeKey('»'), '');
});

test('buildPage et locate retrouvent phrase et mot', () => {
  const page = buildPage(['Un petit dragon.', 'Il vole.']);
  assert.equal(page.fullText, 'Un petit dragon. Il vole.');
  assert.deepEqual(locate(page, 3), { sentence: 0, word: 1 });
  assert.deepEqual(locate(page, 17), { sentence: 1, word: 0 });
  const { timeline, total } = estimateTimeline(page, 1);
  assert.equal(timeline.length, 5);
  assert.ok(total > 0);
});

test('script : chaque scène respecte les garde-fous et chaque langue est complète', () => {
  for (const scene of STORY.scenes) {
    assert.ok(scene.characters.length <= 3, `scène ${scene.id} : 3 points interactifs maximum`);
    for (const lang of ['fr', 'ar']) {
      const d = scene[lang];
      assert.ok(d.sentences.length > 0);
      for (const s of d.sentences) {
        assert.ok(s.t && s.simple && s.explain, `scène ${scene.id} (${lang}) : phrase complète`);
      }
      // chaque définition correspond à un mot présent dans le texte original
      const words = new Set(buildPage(d.sentences.map((s) => s.t)).sentences.flatMap((s) => s.words.map((w) => w.key)));
      for (const k of Object.keys(d.definitions)) assert.ok(words.has(k), `scène ${scene.id} (${lang}) : « ${k} » absent du texte`);
      for (const c of scene.characters) assert.ok(c.reveal[lang], `révélation ${c.id} (${lang})`);
      if (scene.question) assert.ok(scene.question[lang].choices[scene.question[lang].correct]);
    }
  }
});

test('récompenses : journal en ajout seul, étoiles et seuils', () => {
  const log = [];
  log.push(makeEvent('a', 'reading_day'));
  log.push(makeEvent('a', 'scene_complete'));
  log.push(makeEvent('a', 'book_complete'));
  log.push(makeEvent('b', 'scene_complete'));
  assert.equal(starsFor(log, 'a'), 5);
  assert.throws(() => { 'use strict'; log[0].stars = 99; }, TypeError, 'un évènement est gelé');
  assert.ok(badgesFor(log, 'a').includes('premier_livre'));
  assert.equal(needsReadingDay(log, 'a'), false);
  assert.equal(needsReadingDay(log, 'b'), true);
  const rules = defaultRules();
  assert.deepEqual(crossedRewards(rules.rewards, 8, 11).map((r) => r.id), ['r1']);
  assert.deepEqual(crossedRewards(rules.rewards, 11, 12), []);
});

test('observations : suggestions, jamais de modification silencieuse', () => {
  const child = { nickname: 'Amine', profile: presetProfile('general') };
  assert.equal(observations({ child, sessions: [], interactions: [] })[0].key, 'obs_none');

  const now = Date.now();
  const sessions = [1, 2].map((i) => ({
    id: `s${i}`, start: new Date(now - 600000).toISOString(), end: new Date(now - 120000).toISOString(), endReason: 'quit',
  }));
  const interactions = ['sommet', 'sommet', 'vallée', 'aile', 'posa'].map((w) => ({ type: 'word', value: w }));
  const obs = observations({ child, sessions, interactions });
  const keys = obs.map((o) => o.key);
  assert.ok(keys.includes('obs_drop'));
  assert.ok(keys.includes('obs_words_narration'));
  assert.ok(obs[0].patch, 'la suggestion de la semaine porte un réglage');
  assert.equal(child.profile.audio.narration, false, 'le profil n’a pas été modifié');
  assert.equal(childStats({ sessions, interactions }).topWords[0][0], 'sommet');
});

test('test de profil : réponses -> préréglage de confort', () => {
  assert.equal(profileFromAnswers({ letters: 'never', spacing: 'standard', focus: 'never' }).preset, 'general');
  assert.equal(profileFromAnswers({ letters: 'often', focus: 'often' }).preset, 'dyslexie_tdah');
  const p = profileFromAnswers({ letters: 'never', spacing: 'large', colorsRG: 'no', loud: 'yes' });
  assert.equal(p.preset, 'dyslexie');
  assert.equal(p.scene.palette, 'deuteranopie');
  assert.equal(p.scene.shapes, true);
  assert.equal(p.audio.volume, 0.4);
  assert.equal(whoFills('5-7'), 'parent_with_child');
});

test('temps : plage horaire et plafond du jour', () => {
  const rules = { ...defaultRules(), window: { enabled: true, start: '16:00', end: '19:30' }, dayMaxMin: 30 };
  const at = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };
  assert.equal(isInWindow(rules, at(17, 0)), true);
  assert.equal(isInWindow(rules, at(20, 0)), false);
  const today = at(17, 0);
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  assert.equal(accessStatus(rules, { a: { [key]: 1800 } }, 'a', today), 'day_limit');
  assert.equal(accessStatus(rules, {}, 'a', today), 'ok');
});

test('adaptation : jamais d’espacement des lettres en arabe', () => {
  const p = presetProfile('dyslexie');
  assert.equal(readingVars(p, 'fr')['--read-letter'], '0.12em');
  assert.equal(readingVars(p, 'ar')['--read-letter'], '0em');
  assert.ok(parseFloat(readingVars(p, 'ar')['--read-word']) > p.display.wordSpacing);
  assert.equal(deepMerge(p, { audio: { rate: 1.2 } }).audio.narration, true);
});

/* ===================== Version 2 ===================== */
import { buildTimeline, sampleTrack, sceneAt, segmentAt, sceneProgress, fadeAt, trackOf, soundsBetween, INTRO_S, OUTRO_S, textLang } from '../src/engine/film.js';
import { correctionMatrix, feValues, cvdFromTest } from '../src/engine/vision.js';
import { profileFromNeeds, presetFromNeeds } from '../src/engine/profileTest.js';
import { cleanText, splitSentences, paginate, buildImportedBook, sceneFromText, contentCheck } from '../src/engine/importBook.js';
import { initialQuiz, recordAnswer, nextQuestion, markAsked, choicesForLevel } from '../src/engine/quiz.js';
import { HEART_QUESTIONS, EDU_BOOKS } from '../src/data/eduBooks.js';
import { sidiLevel } from '../src/engine/rewards.js';

test('film : une timeline continue couvre toute l’histoire, phrase par phrase', () => {
  for (const lang of ['fr', 'ar']) {
    const tl = buildTimeline(STORY, { lang });
    assert.equal(tl.scenes.length, STORY.scenes.length);
    const nSentences = STORY.scenes.reduce((n, s) => n + s[lang].sentences.length, 0);
    assert.equal(tl.segments.length, nSentences);
    assert.equal(tl.scenes[0].start, INTRO_S);
    assert.ok(Math.abs(tl.total - (tl.outroStart + OUTRO_S)) < 1e-9);
    // scènes contiguës, segments dans leur scène, ordre respecté
    tl.scenes.forEach((s, i) => { if (i) assert.ok(Math.abs(s.start - tl.scenes[i - 1].end) < 1e-9); });
    for (const seg of tl.segments) {
      const sc = tl.scenes.find((x) => x.index === seg.scene);
      assert.ok(seg.start >= sc.start && seg.start + seg.dur <= sc.end + 1e-9);
      assert.equal(segmentAt(tl, seg.start + 0.01), seg);
      assert.equal(sceneAt(tl, seg.start + 0.01).index, seg.scene);
    }
    assert.ok(tl.total > 60, 'un vrai film, pas une suite d’images');
  }
  const slow = buildTimeline(STORY, { rate: 0.7 }).total;
  const fast = buildTimeline(STORY, { rate: 1.2 }).total;
  assert.ok(slow > fast, 'la durée suit la vitesse de la voix');
  const from3 = buildTimeline(STORY, { from: 3 });
  assert.equal(from3.scenes[0].index, 3);
});

test('film : pistes d’images clés fidèles au texte et interpolation', () => {
  for (const scene of STORY.scenes) {
    const tr = trackOf(scene);
    assert.ok(tr.camera.length >= 2, `scène ${scene.id} : la caméra bouge`);
    for (const c of scene.characters) assert.ok(tr.actors[c.id], `scène ${scene.id} : ${c.id} est joué dans le film`);
    for (const keys of Object.values(tr.actors)) for (let i = 1; i < keys.length; i++) assert.ok(keys[i][0] >= keys[i - 1][0]);
  }
  // l'oiseau arrive du ciel et se pose sur l'aile (scène 3)
  const s3 = STORY.scenes[2].film;
  const start = sampleTrack(s3, 0).actors.oiseau;
  const end = sampleTrack(s3, 1).actors.oiseau;
  assert.ok(start.pos[1] > 4 && end.pos[1] < 2);
  assert.equal(end.action, 'pose');
  assert.ok(sampleTrack(s3, 0.2).actors.oiseau.moving);
  // Nour descend dans la forêt (scène 5)
  const s5 = STORY.scenes[4].film;
  assert.ok(sampleTrack(s5, 1).actors.dragon.pos[2] - sampleTrack(s5, 0).actors.dragon.pos[2] > 6);
  // animations réduites : caméra fixe
  const r0 = sampleTrack(s5, 0.1, { reduced: true }).camera.pos;
  const r1 = sampleTrack(s5, 0.6, { reduced: true }).camera.pos;
  assert.deepEqual(r0, r1);
  assert.deepEqual(soundsBetween(STORY.scenes[2].film, 0, 0.2), ['chant']);
  const tl = buildTimeline(STORY);
  const b = tl.scenes[1].start;
  assert.ok(fadeAt(tl, b + 0.05) > 0.5 && fadeAt(tl, (tl.scenes[1].start + tl.scenes[1].end) / 2) === 0);
  assert.ok(sceneProgress(tl, tl.scenes[2].end - 0.001) > 0.99);
});

test('vision : matrices de correction et mini-test', () => {
  for (const type of ['protan', 'deutan', 'tritan']) {
    const m = correctionMatrix(type);
    assert.equal(m.length, 3);
    // le blanc et le gris restent neutres (chaque ligne somme ≈ 1)
    m.forEach((row) => assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 0.02, `${type} ${row}`));
    assert.equal(feValues(m).split(' ').length, 20);
  }
  assert.equal(correctionMatrix('none'), null);
  assert.equal(cvdFromTest({ redGreen: false, blueYellow: true, anyColor: true }), 'deutan');
  assert.equal(cvdFromTest({ redGreen: true, blueYellow: false, anyColor: true }), 'tritan');
  assert.equal(cvdFromTest({ redGreen: true, blueYellow: true, anyColor: false }), 'achro');
  assert.equal(cvdFromTest({ redGreen: true, blueYellow: true, anyColor: true }), 'none');
});

test('inscription : besoins remarqués → réglages de départ (jamais un diagnostic)', () => {
  assert.equal(presetFromNeeds({}), 'general');
  assert.equal(presetFromNeeds({ reading: true, attention: true }), 'dyslexie_tdah');
  assert.equal(presetFromNeeds({ comprehension: true }), 'comprehension');
  const p = profileFromNeeds({ reading: true, colors: 'rg', hearing: true, speech: true });
  assert.equal(p.preset, 'dyslexie');
  assert.equal(p.scene.palette, 'deuteranopie');
  assert.equal(p.scene.shapes, true);
  assert.equal(p.audio.captions, true);
  assert.equal(p.a11y.bigTargets, true);
  assert.deepEqual(p.needs, { reading: true, colors: 'rg', hearing: true, speech: true });
  assert.equal(profileFromNeeds({ colors: 'by' }).scene.palette, 'tritanopie');
  assert.equal(profileFromNeeds({ colors: 'achro' }).scene.palette, 'achromatopsie');
  assert.equal(profileFromNeeds({ colors: 'none' }).scene.palette, 'standard');
  assert.equal(profileFromNeeds({ attention: true, comprehension: true }).text.simplified, true);
});

test('import : nettoyage, phrases entières, pages de 30 à 60 s, scènes fidèles', () => {
  const raw = 'Un petit garçon vivait près de la mer.\n\n3\n\nChaque soir, il regardait les étoi-\nles. M. Ali riait.';
  const clean = cleanText(raw);
  assert.ok(!/\n3\n/.test(clean) && clean.includes('étoiles'));
  assert.deepEqual(splitSentences(clean), ['Un petit garçon vivait près de la mer.', 'Chaque soir, il regardait les étoiles.', 'M. Ali riait.']);
  const long = Array.from({ length: 40 }, (_, i) => `Voici la phrase numéro ${i + 1} de cette longue histoire pour enfants.`);
  const pages = paginate(long);
  assert.ok(pages.length > 1);
  assert.equal(pages.flat().length, long.length, 'aucune phrase perdue ni coupée');
  const sc = sceneFromText('Le dragon vole au-dessus de la forêt, le vent souffle.');
  assert.equal(sc.decor, 'foret');
  assert.deepEqual(sc.characters.map((c) => c.id), ['dragon']);
  assert.equal(sc.sound.type, 'vent');
  assert.deepEqual(sceneFromText('Il faisait beau.').characters, [], 'aucun personnage inventé');
  assert.deepEqual(contentCheck('Il prit une arme.'), ['arme']);
  const book = buildImportedBook({ id: 'b', title: 'Test', raw: long.join(' ') });
  assert.equal(book.status, 'pending', 'jamais visible sans l’approbation du parent');
  assert.equal(book.lang, 'fr');
  assert.ok(book.scenes.every((s) => s.fr.sentences.every((x) => x.simple === null)));
  const ar = buildImportedBook({ id: 'c', title: 'حكاية', raw: 'ذهب الولد إلى البحر. كان العصفور يغرد فوق الشاطئ.' });
  assert.equal(ar.lang, 'ar');
  assert.equal(ar.scenes[0].decor, 'mer');
  assert.equal(textLang(ar, 'fr'), 'ar');
});

test('livre éducatif : quiz adaptatif et banque complète', () => {
  const book = EDU_BOOKS[0];
  for (const s of book.scenes) for (const l of ['fr', 'ar']) {
    assert.ok(s[l].explore && s[l].sentences.every((x) => x.t && x.simple && x.explain));
    assert.ok(HEART_QUESTIONS.filter((q) => q.concept === s.id).length >= 3);
  }
  let q = initialQuiz(2);
  let r = recordAnswer(q, { id: 'a', correct: true });
  r = recordAnswer(r.state, { id: 'b', correct: true });
  assert.equal(r.state.level, 3, 'deux réussites sans indice → plus difficile');
  r = recordAnswer(r.state, { id: 'c', correct: false });
  assert.equal(r.offerHint, true);
  r = recordAnswer(r.state, { id: 'd', correct: false });
  assert.equal(r.state.level, 2, 'deux erreurs → plus facile, avec indice');
  q = markAsked(initialQuiz(1), 'q1');
  const next = nextQuestion(HEART_QUESTIONS, q, 1);
  assert.notEqual(next.id, 'q1');
  assert.equal(next.level, 1);
  const q3 = HEART_QUESTIONS.find((x) => x.id === 'q3');
  assert.equal(choicesForLevel(q3.fr, 1).length, 2);
  assert.ok(choicesForLevel(q3.fr, 1).some((c) => c.i === q3.fr.correct));
});

test('Sidi Hkeya évolue sans jamais régresser', () => {
  assert.equal(sidiLevel(0).level, 1);
  assert.equal(sidiLevel(10).level, 2);
  assert.equal(sidiLevel(24).toNext, 1);
  assert.equal(sidiLevel(500).next, null);
});

/* ===================== Vidéos (Cendrillon, cours sur le cœur) ===================== */
import { CENDRILLON } from '../src/data/cendrillon.js';
import { HEART_VIDEO } from '../src/data/eduBooks.js';
import { sceneIndexAt } from '../src/engine/film.js';
import fs from 'node:fs';

test('Cendrillon : les scènes couvrent toute la vidéo, sans trou ni chevauchement', () => {
  let prev = 0;
  for (const s of CENDRILLON.scenes) {
    assert.equal(s.clip[0], prev, `scène ${s.id} commence où la précédente s’arrête`);
    assert.ok(s.clip[1] > s.clip[0]);
    prev = s.clip[1];
    assert.ok(fs.existsSync(`public/${s.poster.replace('./', '')}`), `image de la scène ${s.id}`);
  }
  assert.equal(prev, CENDRILLON.video.duration);
  assert.ok(fs.existsSync(`public/${CENDRILLON.video.src.replace('./', '')}`));
});

test('Cendrillon : texte complet en français et en arabe, fidèle au découpage', () => {
  for (const scene of CENDRILLON.scenes) {
    assert.ok(scene.characters.length <= 3);
    for (const lang of ['fr', 'ar']) {
      const d = scene[lang];
      for (const s of d.sentences) assert.ok(s.t && s.simple && s.explain, `scène ${scene.id} (${lang})`);
      const words = new Set(buildPage(d.sentences.map((s) => s.t)).sentences.flatMap((s) => s.words.map((w) => w.key)));
      for (const k of Object.keys(d.definitions)) assert.ok(words.has(k), `scène ${scene.id} (${lang}) : « ${k} » absent du texte`);
      for (const c of scene.characters) assert.ok(CENDRILLON.characters[c.id] && c.reveal[lang]);
      if (scene.question) assert.ok(scene.question[lang].choices[scene.question[lang].correct]);
    }
  }
  assert.equal(sceneIndexAt(CENDRILLON, 0), 0);
  assert.equal(sceneIndexAt(CENDRILLON, 300), 7);
  assert.equal(sceneIndexAt(CENDRILLON, 488), CENDRILLON.scenes.length - 1);
});

test('Cœur : chapitres vidéo continus, décrits dans les deux langues, liés aux concepts', () => {
  let prev = 0;
  for (const c of HEART_VIDEO.chapters) {
    assert.equal(c.start, prev);
    prev = c.end;
    assert.ok(c.title.fr && c.title.ar && c.desc.fr && c.desc.ar);
    assert.ok([1, 2].includes(c.concept));
  }
  assert.equal(prev, HEART_VIDEO.duration);
  assert.ok(fs.existsSync('public/videos/coeur.mp4'));
  assert.ok(HEART_QUESTIONS.some((q) => q.video && q.concept === 1) && HEART_QUESTIONS.some((q) => q.video && q.concept === 2));
});

test('génération 3D : noms, personnage principal, présence et verbes → animations', async () => {
  const { buildImportedBook, learnNames, charactersIn } = await import('../src/engine/importBook.js');
  assert.deepEqual(learnNames('Un petit dragon vivait là. Il s’appelait Nour.', {}), { Nour: 'dragon' });
  assert.deepEqual(charactersIn('Nour regardait la mer.', { Nour: 'dragon' }), ['dragon']);
  assert.deepEqual(charactersIn('Il avait peur que les enfants aient peur.', {}), [], 'un groupe seulement évoqué n’apparaît pas');
  assert.deepEqual(charactersIn('Les enfants jouaient au village.', {}), ['yasmine', 'adam']);
  const raw = 'Un petit dragon vivait sur une montagne. Il s’appelait Nour.\n\nUn jour, un oiseau se posa sur son aile. Il chantait.\n\nNour descendit dans la vallée. Les enfants s’approchèrent en riant.';
  const b = buildImportedBook({ id: 'g', title: 'Test', raw });
  assert.equal(b.scenes.length, 3, 'une page par paragraphe');
  assert.equal(b.scenes[0].decor, 'montagne');
  const s2 = b.scenes[1].characters;
  assert.ok(s2.some((c) => c.id === 'oiseau' && c.enter === 'fly'), 'l’oiseau arrive en volant');
  assert.ok(s2.some((c) => c.id === 'dragon'), '« son aile » garde le personnage principal en scène');
  assert.equal(b.scenes[2].decor, 'village', 'descendre dans la vallée = arriver au village');
  assert.ok(b.scenes[2].characters.filter((c) => c.enter === 'walk').length >= 2);
  // la piste générée anime bien l'entrée
  const tr = trackOf(b.scenes[1]);
  const bird0 = sampleTrack(tr, 0).actors.oiseau.pos;
  const bird1 = sampleTrack(tr, 1).actors.oiseau.pos;
  assert.ok(bird0[1] > bird1[1] + 2, 'descend du ciel');
});
