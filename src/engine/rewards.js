/**
 * Système de récompenses (6.9 et 6 bis G).
 * - Chaque action produit un évènement ; des règles le transforment en étoiles.
 * - Le journal est en AJOUT SEUL : une étoile gagnée n'est jamais retirée.
 * - On récompense la régularité, l'effort et la curiosité, pas la vitesse ni le volume.
 * - Aucune série ne se « perd » : on compte les jours de lecture, pas les jours consécutifs.
 */

export const EVENT_STARS = {
  scene_complete: 1,
  quiz_correct: 1,
  session_complete: 2,
  reading_day: 1,
  book_complete: 3,
  goal_reached: 1,
  offline_done: 2,
  character_explored: 0,
  word_help: 0,
  sentence_help: 0,
};

export const BADGES = [
  { id: 'detective', icon: '🔍', need: (c) => c.explored >= 5 },
  { id: 'curieux', icon: '💡', need: (c) => c.help >= 5 },
  { id: 'fidele', icon: '📅', need: (c) => c.days >= 3 },
  { id: 'premier_livre', icon: '📖', need: (c) => c.books >= 1 },
  { id: 'compris', icon: '🧠', need: (c) => c.quiz >= 3 },
  { id: 'explorateur', icon: '🌿', need: (c) => c.offline >= 1 },
];

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

let seq = 0;
export function makeEvent(childId, type, meta = {}, now = new Date()) {
  seq += 1;
  return Object.freeze({
    id: `ev_${now.getTime().toString(36)}_${seq}`,
    childId,
    type,
    stars: EVENT_STARS[type] ?? 0,
    at: now.toISOString(),
    day: dateKey(now),
    meta: Object.freeze({ ...meta }),
  });
}

export function eventsOf(log, childId) {
  return log.filter((e) => e.childId === childId);
}

export function starsFor(log, childId) {
  return eventsOf(log, childId).reduce((s, e) => s + (e.stars || 0), 0);
}

export function countersFor(log, childId) {
  const ev = eventsOf(log, childId);
  const explored = new Set(
    ev.filter((e) => e.type === 'character_explored').map((e) => `${e.meta.scene}:${e.meta.character}`),
  );
  return {
    explored: explored.size,
    help: ev.filter((e) => e.type === 'word_help' || e.type === 'sentence_help').length,
    days: new Set(ev.filter((e) => e.type === 'reading_day').map((e) => e.day)).size,
    books: ev.filter((e) => e.type === 'book_complete').length,
    quiz: ev.filter((e) => e.type === 'quiz_correct').length,
    offline: ev.filter((e) => e.type === 'offline_done').length,
  };
}

export function badgesFor(log, childId) {
  const c = countersFor(log, childId);
  return BADGES.filter((b) => b.need(c)).map((b) => b.id);
}

export function needsReadingDay(log, childId, now = new Date()) {
  const today = dateKey(now);
  return !log.some((e) => e.childId === childId && e.type === 'reading_day' && e.day === today);
}

/** Récompenses réelles dont le seuil vient d'être franchi. */
export function crossedRewards(rewards, before, after) {
  return (rewards || []).filter((r) => before < r.stars && after >= r.stars);
}

/** Étoiles de la semaine en cours (lundi à dimanche) pour la barre d'objectif. */
export function scenesThisWeek(log, childId, now = new Date()) {
  const monday = new Date(now);
  const d = (monday.getDay() + 6) % 7;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - d);
  return eventsOf(log, childId).filter((e) => e.type === 'scene_complete' && new Date(e.at) >= monday).length;
}

/**
 * Sidi Hkeya évolue avec les étoiles de l'enfant (la mascotte qui grandit, 6.9) :
 * chaque niveau ajoute un accessoire. Jamais de niveau perdu : les étoiles ne sont jamais retirées.
 */
export const SIDI_LEVELS = [
  { level: 1, stars: 0, item: null },
  { level: 2, stars: 10, item: 'book' },
  { level: 3, stars: 25, item: 'star' },
  { level: 4, stars: 50, item: 'lantern' },
  { level: 5, stars: 100, item: 'crown' },
];

export function sidiLevel(stars) {
  let cur = SIDI_LEVELS[0];
  for (const l of SIDI_LEVELS) if (stars >= l.stars) cur = l;
  const next = SIDI_LEVELS.find((l) => l.stars > stars) || null;
  return { ...cur, next, toNext: next ? next.stars - stars : 0 };
}
