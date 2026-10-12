/**
 * Bibliothèque : livres du catalogue (écrits à la main pour le prototype),
 * livres éducatifs, et livres importés par le parent (approuvés avant d'être
 * visibles par l'enfant). Un livre importé reste privé à la famille.
 */
import { useStore } from '../state/store.jsx';
import { CENDRILLON } from './cendrillon.js';
import { EDU_BOOKS } from './eduBooks.js';

// Catalogue du prototype : Cendrillon (vidéo) et le cours sur le cœur (vidéo + 3D).
// « Nour, le petit dragon » (src/data/story.js) reste dans le code : c'est l'exemple de
// film 3D généré depuis un script, utilisé aussi pour les livres importés.
export const CATALOGUE = [CENDRILLON, ...EDU_BOOKS];

export function findBook(state, id) {
  return CATALOGUE.find((b) => b.id === id) || (state.books || []).find((b) => b.id === id) || null;
}

export function useBook(id) {
  const { state } = useStore();
  return findBook(state, id);
}

/** Livres que l'enfant peut voir : catalogue + imports approuvés pour lui (3 à 6 à la fois). */
export function booksForChild(state, child) {
  const imported = (state.books || []).filter(
    (b) => b.status === 'approved' && (!b.childIds?.length || b.childIds.includes(child.id)),
  );
  return [...CATALOGUE, ...imported].slice(0, 6);
}
