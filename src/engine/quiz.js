/**
 * Ajusteur de difficulté (6.5) : observe les réponses, le temps et les indices.
 * - 2 bonnes réponses d'affilée sans indice → niveau +1 (max 3)
 * - 2 erreurs d'affilée → niveau −1 (min 1), indice proposé et nouvel exemple
 * Jamais d'échec affiché : une erreur déclenche de l'aide, pas une sanction.
 */

export function initialQuiz(level = 1) {
  return { level, rightStreak: 0, wrongStreak: 0, asked: [], history: [] };
}

/** @returns {{state:object, offerHint:boolean, levelChanged:number}} */
export function recordAnswer(state, { id, correct, usedHint = false, ms = 0 }) {
  const s = { ...state, history: [...state.history, { id, correct, usedHint, ms, level: state.level }] };
  let offerHint = false;
  let levelChanged = 0;
  if (correct) {
    s.wrongStreak = 0;
    s.rightStreak = usedHint ? 0 : state.rightStreak + 1;
    if (s.rightStreak >= 2 && s.level < 3) {
      s.level += 1;
      s.rightStreak = 0;
      levelChanged = 1;
    }
  } else {
    s.rightStreak = 0;
    s.wrongStreak = state.wrongStreak + 1;
    offerHint = true;
    if (s.wrongStreak >= 2 && s.level > 1) {
      s.level -= 1;
      s.wrongStreak = 0;
      levelChanged = -1;
    }
  }
  return { state: s, offerHint, levelChanged };
}

/** Choisit la prochaine question du concept, au niveau le plus proche, jamais déjà posée. */
export function nextQuestion(bank, state, concept) {
  const pool = bank.filter((q) => (concept == null || q.concept === concept) && !state.asked.includes(q.id));
  if (!pool.length) return null;
  const byDistance = [...pool].sort((a, b) => Math.abs(a.level - state.level) - Math.abs(b.level - state.level) || a.level - b.level);
  return byDistance[0];
}

export function markAsked(state, id) {
  return { ...state, asked: [...state.asked, id] };
}

/** Au niveau 1, une question à choix est réduite à 2 réponses (la bonne + une autre). */
export function choicesForLevel(q, level) {
  const choices = q.choices.map((c, i) => ({ c, i }));
  if (level > 1 || choices.length <= 2) return choices;
  const wrong = choices.find((x) => x.i !== q.correct);
  return choices.filter((x) => x.i === q.correct || x === wrong);
}
