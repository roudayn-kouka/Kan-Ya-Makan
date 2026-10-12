/**
 * Tableau de bord du parent (6.11) : statistiques et OBSERVATIONS PÉDAGOGIQUES.
 * Jamais de diagnostic. Chaque observation peut porter une suggestion de réglage
 * (`patch`) que le parent applique lui-même : l'application ne modifie jamais
 * les réglages en silence.
 */

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function childStats({ sessions, interactions }) {
  const pages = interactions.filter((i) => i.type === 'page');
  const words = interactions.filter((i) => i.type === 'word');
  const wordCounts = {};
  for (const w of words) wordCounts[w.value] = (wordCounts[w.value] || 0) + 1;
  const topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const quiz = interactions.filter((i) => i.type === 'quiz');
  const firstTry = quiz.filter((q) => q.meta?.firstTry);
  const pauses = interactions.filter((i) => i.type === 'pause');

  const modeUse = { read: 0, listen: 0, watch: 0 };
  for (const p of pages) for (const m of Object.keys(modeUse)) if (p.meta?.modes?.[m]) modeUse[m] += 1;

  const totalMs = sessions.reduce((s, x) => s + Math.max(0, (x.end ? new Date(x.end) : new Date(x.start)) - new Date(x.start)), 0);

  return {
    sessions: sessions.length,
    totalMin: Math.round(totalMs / 60000),
    pages: pages.length,
    avgPageSec: Math.round(avg(pages.map((p) => p.meta?.ms || 0)) / 1000),
    wordsTouched: words.length,
    topWords,
    sentencesExplained: interactions.filter((i) => i.type === 'sentence').length,
    charactersExplored: interactions.filter((i) => i.type === 'character').length,
    quizAnswered: firstTry.length,
    quizCorrectRate: firstTry.length ? Math.round((firstTry.filter((q) => q.meta.correct).length / firstTry.length) * 100) : null,
    pausesTaken: pauses.filter((p) => p.value === 'taken').length,
    pausesSkipped: pauses.filter((p) => p.value === 'skipped').length,
    modeUse,
    abandons: sessions.filter((s) => s.endReason === 'quit').length,
  };
}

export function observations({ child, sessions, interactions }) {
  const out = [];
  const name = child.nickname;
  const profile = child.profile;
  const stats = childStats({ sessions, interactions });

  if (!sessions.length) {
    return [{ key: 'obs_none', params: { name } }];
  }

  // 1. Décrochage : plusieurs séances arrêtées avant la fin
  const quits = sessions.filter((s) => s.endReason === 'quit' && s.end);
  if (quits.length >= 2) {
    const min = Math.max(1, Math.round(avg(quits.map((s) => new Date(s.end) - new Date(s.start))) / 60000));
    out.push({
      key: 'obs_drop',
      params: { name, min },
      patch: { pauses: { enabled: true, everyScenes: Math.max(1, (profile.pauses.everyScenes || 3) - 1) } },
    });
  }

  // 2. Mots souvent touchés ou pages longues : proposer la narration, puis le texte simplifié
  const repeated = stats.topWords.filter(([, n]) => n >= 2).length;
  const heavyWords = stats.wordsTouched >= 5 || repeated >= 1 || (stats.pages >= 3 && stats.avgPageSec > 90);
  if (heavyWords && !profile.audio.narration) {
    out.push({ key: 'obs_words_narration', params: { name }, patch: { audio: { narration: true, highlight: 'sentence' } } });
  } else if (heavyWords && !profile.text.simplified) {
    out.push({ key: 'obs_words_simplified', params: { name }, patch: { text: { simplified: true } } });
  }

  // 3. Compréhension avec la narration
  const quiz = interactions.filter((i) => i.type === 'quiz' && i.meta?.firstTry);
  const withListen = quiz.filter((q) => q.meta.listen);
  const without = quiz.filter((q) => !q.meta.listen);
  const rate = (xs) => (xs.length ? xs.filter((q) => q.meta.correct).length / xs.length : null);
  if (withListen.length >= 2 && rate(withListen) >= 0.75 && (without.length === 0 || rate(withListen) > rate(without))) {
    out.push({ key: 'obs_listen_helps', params: { name } });
  }

  // 4. Pauses souvent passées : les espacer
  if (stats.pausesSkipped >= 3 && stats.pausesSkipped > stats.pausesTaken) {
    out.push({
      key: 'obs_pauses_skipped',
      params: { name },
      patch: { pauses: { everyScenes: (profile.pauses.everyScenes || 3) + 1 } },
    });
  }

  // 5. Curiosité pour les émotions des personnages
  if (stats.charactersExplored >= 4) out.push({ key: 'obs_emotions', params: { name } });

  if (!out.length) out.push({ key: 'obs_ok', params: { name } });
  // Les observations qui portent une suggestion d'abord
  return out.sort((a, b) => Number(Boolean(b.patch)) - Number(Boolean(a.patch)));
}

/** Résumé hebdomadaire : une seule suggestion. */
export function weeklySuggestion(obs) {
  return obs.find((o) => o.patch) || null;
}
