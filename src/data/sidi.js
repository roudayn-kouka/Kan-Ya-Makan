/**
 * Phrases de Sidi Hkeya (Identité de la marque).
 * En interface française : derja en lettres latines + sous-titre français.
 * En interface arabe : derja en écriture arabe + sous-titre en arabe standard.
 */
export const SIDI = {
  welcome: {
    lat: 'Ija, n7kilek hkeya !',
    arDerja: 'إيجا، نحكيلك حكاية!',
    fr: 'Viens, je te raconte une histoire !',
    ar: 'تعال، سأحكي لك حكاية!',
  },
  help: {
    lat: 'Kelma s3iba ? Ahawka n9ollek !',
    arDerja: 'كلمة صعيبة؟ أهاوكا نقلك!',
    fr: "Un mot difficile ? Je t'explique !",
    ar: 'كلمة صعبة؟ سأشرحها لك!',
  },
  pause: {
    lat: 'Nertah chwaya w nkamlou !',
    arDerja: 'نرتاح شوية ونكملو!',
    fr: 'On se repose un peu et on continue !',
    ar: 'نرتاح قليلا ثم نكمل!',
  },
  bravo: {
    lat: 'Bravo 3lik, fhemt !',
    arDerja: 'برافو عليك، فهمت!',
    fr: 'Bravo, tu as compris !',
    ar: 'أحسنت، لقد فهمت!',
  },
  bye: {
    lat: 'Ghodwa n7kilek el ba9i...',
    arDerja: 'غدوة نحكيلك الباقي...',
    fr: 'Demain je te raconte la suite...',
    ar: 'غدا أحكي لك البقية...',
  },
  hint: {
    lat: 'Chouf mli7 fel tsawer !',
    arDerja: 'شوف مليح في التصاور!',
    fr: 'Regarde bien la scène, la réponse est cachée dedans !',
    ar: 'انظر جيدا إلى المشهد، الجواب مخبأ فيه!',
  },
  goal: {
    lat: 'Bravo, wselt lel hadaf !',
    arDerja: 'برافو، وصلت للهدف!',
    fr: 'Bravo, tu as atteint ton objectif !',
    ar: 'أحسنت، وصلت إلى هدفك!',
  },
  almost: {
    lat: 'Chwaya w nertahou...',
    arDerja: 'شوية ونرتاحو...',
    fr: 'Encore un petit peu, puis on se repose.',
    ar: 'قليلا بعد، ثم نرتاح.',
  },
  chechia: {
    lat: 'Win chechiti ?! Ah, hani lebesha !',
    arDerja: 'وين شاشيتي؟! آه، هاني لابسها!',
    fr: "Où est ma chechia ?! Ah, je la porte !",
    ar: 'أين شاشيتي؟! آه، إنني أرتديها!',
  },
};

export function sidiLine(key, lang) {
  const p = SIDI[key];
  if (!p) return { main: '', sub: '' };
  return lang === 'ar' ? { main: p.arDerja, sub: p.ar } : { main: p.lat, sub: p.fr };
}
