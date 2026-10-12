/**
 * Zone de texte du lecteur (mode Lire).
 * - Texte réglé par le profil (variables CSS du moteur d'adaptation)
 * - Surlignage du mot ou de la phrase en cours pendant la narration
 * - Toucher un mot : définition simple sur la page, sans la quitter
 * - Bouton 💬 après chaque phrase : Sidi Hkeya explique la phrase DANS l'histoire
 * - Mode concentration : tout est assombri sauf la phrase en cours
 * - Règle de lecture optionnelle
 */
import { useEffect, useRef, useState } from 'react';
import { locate } from '../engine/text.js';
import { useT } from '../i18n/index.js';

export default function ReaderText({
  page,
  definitions,
  currentChar,
  highlight,
  focusMode,
  focusSentence,
  ruler,
  onWord,
  onSayWord,
  onExplain,
  explainedSentence,
  explainable,
}) {
  const t = useT();
  const box = useRef(null);
  const [pop, setPop] = useState(null);
  const [rulerY, setRulerY] = useState(0);

  const pos = currentChar != null ? locate(page, currentChar) : { sentence: -1, word: -1 };
  const activeSentence = pos.sentence >= 0 ? pos.sentence : focusSentence;

  useEffect(() => {
    const close = (e) => { if (e.key === 'Escape') setPop(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);

  useEffect(() => setPop(null), [page]);

  const openWord = (w, el) => {
    const def = definitions?.[w.key];
    const r = el.getBoundingClientRect();
    const b = box.current.getBoundingClientRect();
    setPop({
      word: w.text.replace(/^[«"“(]+|[»"”),.!?:;…،؟]+$/g, ''),
      def,
      x: Math.max(0, Math.min(r.left - b.left + box.current.scrollLeft, b.width - 330)),
      y: r.bottom - b.top + box.current.scrollTop + 8,
    });
    onWord?.(w, Boolean(def));
  };

  return (
    <div
      ref={box}
      className="read-text"
      style={{ position: 'relative' }}
      onPointerMove={ruler ? (e) => {
        const b = box.current.getBoundingClientRect();
        setRulerY(e.clientY - b.top + box.current.scrollTop);
      } : undefined}
      onClick={(e) => { if (!e.target.closest('.word, .popover, .explain-btn')) setPop(null); }}
    >
      {page.sentences.map((s) => {
        const isCurrent = s.index === activeSentence;
        const dim = focusMode && activeSentence >= 0 && !isCurrent;
        const sentenceHl = isCurrent && (highlight === 'sentence' || (focusMode && highlight !== 'word'));
        return (
          <span
            key={s.index}
            className={`read-sentence ${dim ? 'dim' : ''} ${sentenceHl && currentChar != null ? 'current-sentence' : ''} ${focusMode && isCurrent ? 'current-sentence' : ''}`}
          >
            {s.words.map((w, wi) => {
              const hasDef = Boolean(definitions?.[w.key]);
              const isWord = highlight === 'word' && isCurrent && wi === pos.word && currentChar != null;
              return (
                <span key={wi}>
                  <span
                    className={`word ${hasDef ? 'has-def' : ''} ${isWord ? 'current-word' : ''}`}
                    role={hasDef ? 'button' : undefined}
                    tabIndex={hasDef ? 0 : undefined}
                    aria-label={hasDef ? t('word_help_aria', { word: w.key }) : undefined}
                    onClick={(e) => w.isWord && openWord(w, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWord(w, e.currentTarget); }
                    }}
                  >
                    {w.text}
                  </span>{' '}
                </span>
              );
            })}
            {(!explainable || explainable[s.index]) && <button
              type="button"
              className="explain-btn"
              aria-label={t('explain_sentence_aria', { n: s.index + 1 })}
              aria-pressed={explainedSentence === s.index}
              onClick={() => onExplain?.(s.index)}
              title={t('explain_sentence')}
            >
              💬
            </button>}{' '}
          </span>
        );
      })}

      {ruler && <div className="ruler" style={{ top: Math.max(0, rulerY - 24) }} aria-hidden="true" />}

      {pop && (
        <div className="popover" role="dialog" aria-label={pop.word} style={{ left: pop.x, top: pop.y }}>
          <h4>{pop.word}</h4>
          <p style={{ margin: '0 0 10px' }}>{pop.def || t('no_definition')}</p>
          <div className="row">
            <button type="button" className="btn btn-small" onClick={() => onSayWord?.(pop.word)}>🔊 {t('listen_word')}</button>
            <button type="button" className="btn btn-small btn-ghost" onClick={() => setPop(null)}>{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
