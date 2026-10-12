/**
 * Découpage du texte d'une page en phrases et en mots, avec positions
 * de caractères (utilisées pour synchroniser la voix et le surlignage).
 */

const EDGE_PUNCT = /^[\s«»"“”'’()[\],.!?:;…—–\-،؛؟]+|[\s«»"“”'’()[\],.!?:;…—–\-،؛؟]+$/g;

export function normalizeKey(word) {
  return word.replace(/ /g, ' ').replace(/’/g, "'").replace(EDGE_PUNCT, '').toLowerCase();
}

export function tokenize(sentence, offset = 0) {
  const words = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(sentence)) !== null) {
    const key = normalizeKey(m[0]);
    words.push({
      text: m[0],
      key,
      isWord: key.length > 0,
      start: offset + m.index,
      end: offset + m.index + m[0].length,
    });
  }
  return words;
}

/**
 * @param {string[]} sentences
 * @returns {{ fullText: string, sentences: {index:number,start:number,end:number,text:string,words:object[]}[] }}
 */
export function buildPage(sentences) {
  let cursor = 0;
  const out = [];
  sentences.forEach((text, index) => {
    const start = cursor;
    const words = tokenize(text, start);
    out.push({ index, start, end: start + text.length, text, words });
    cursor = start + text.length + 1; // +1 pour l'espace de jonction
  });
  return { fullText: sentences.join(' '), sentences: out };
}

/** Retrouve la phrase et le mot qui contiennent la position charIndex. */
export function locate(page, charIndex) {
  for (const s of page.sentences) {
    if (charIndex >= s.start && charIndex <= s.end) {
      const w = s.words.findIndex((word) => charIndex >= word.start && charIndex < word.end + 1);
      return { sentence: s.index, word: w };
    }
  }
  return { sentence: -1, word: -1 };
}

/** Durée estimée (ms) de chaque mot, pour le surlignage quand la voix ne donne pas les positions. */
export function estimateTimeline(page, rate = 1) {
  const timeline = [];
  let t = 0;
  for (const s of page.sentences) {
    for (let i = 0; i < s.words.length; i++) {
      const w = s.words[i];
      timeline.push({ at: t, charIndex: w.start });
      const letters = Math.max(1, w.key.length || w.text.length);
      let d = (140 + letters * 55) / rate;
      if (/[.!?…؟]["»”]?$/.test(w.text)) d += 380 / rate;
      else if (/[,;:،]$/.test(w.text)) d += 180 / rate;
      t += d;
    }
  }
  return { timeline, total: t };
}
