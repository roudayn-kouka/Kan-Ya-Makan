/**
 * Activités hors écran (6.10) : proposées quand le temps d'écran se termine,
 * liées à ce qui vient d'être lu. Le parent confirme qu'elles ont été faites.
 */
export const FAMILY_CHALLENGES = [
  { id: 'lire_ensemble', emoji: '📚', text: { fr: 'Lire une histoire ensemble, chacun une page.', ar: 'قراءة حكاية معا، كل واحد صفحة.' } },
  { id: 'conteur', emoji: '🎙️', text: { fr: "Raconter à l'enfant une histoire de votre enfance qui commence par « Kan ya makan ».", ar: 'احكوا للطفل حكاية من طفولتكم تبدأ بـ«كان يا مكان».' } },
  { id: 'experience', emoji: '🔬', text: { fr: 'Petite expérience : faire pousser une graine de lentille dans du coton.', ar: 'تجربة صغيرة: زرع حبة عدس في القطن.' } },
  { id: 'balade', emoji: '🚶', text: { fr: 'Une balade où l’enfant compte 5 oiseaux ou 5 arbres différents.', ar: 'نزهة يعد فيها الطفل 5 عصافير أو 5 أشجار مختلفة.' } },
];

/** Activité générique pour un livre qui n'en a pas (livres importés). */
export const GENERIC_OFFLINE = {
  fr: "Dessine ton moment préféré de l'histoire, puis raconte-le à quelqu'un de ta famille.",
  ar: 'ارسم لحظتك المفضلة من الحكاية، ثم احكها لشخص من عائلتك.',
};
