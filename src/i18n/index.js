import { useCallback } from 'react';
import { useStore } from '../state/store.jsx';
import fr from './fr.js';
import ar from './ar.js';

export const DICTS = { fr, ar };

export function translate(lang, key, params = {}) {
  const dict = DICTS[lang] || fr;
  let s = dict[key] ?? fr[key];
  if (s === undefined) {
    if (import.meta.env?.DEV) console.warn(`[i18n] clé manquante : ${key}`);
    return key;
  }
  return s.replace(/\{(\w+)\}/g, (_, k) => (params[k] ?? `{${k}}`));
}

/** Hook de traduction. `t.pick({fr, ar})` choisit la bonne langue d'un objet de données. */
export function useT() {
  const { state } = useStore();
  const lang = state.lang || 'fr';
  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  t.lang = lang;
  t.pick = (obj) => (obj ? obj[lang] ?? obj.fr : '');
  return t;
}
