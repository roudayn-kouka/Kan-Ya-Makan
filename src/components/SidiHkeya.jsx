import { sidiLine } from '../data/sidi.js';
import { useT } from '../i18n/index.js';

/** Sidi Hkeya dessiné en SVG (d'après le logo) : visage orange, chechia rouge et pompon noir. */
/** level (1 à 5) : Sidi gagne un accessoire à chaque niveau d'étoiles (livre, étoile, lanterne, bande dorée). */
export function SidiFace({ size = 88, bob = true, mood = 'normal', title, level = 1 }) {
  const happy = mood === 'happy';
  return (
    <svg
      className={`sidi-svg ${bob ? 'bob' : ''}`}
      width={size}
      height={size * 1.12}
      viewBox="0 0 100 112"
      role="img"
      aria-label={title || 'Sidi Hkeya'}
    >
      {/* visage */}
      <rect x="6" y="26" width="88" height="82" rx="24" fill="#F47B2A" />
      {/* chechia */}
      <path d="M26 30 Q27 10 50 9 Q73 10 74 30 Z" fill="#C8283C" />
      <ellipse cx="50" cy="30" rx="25" ry="5" fill="#A51F31" />
      <ellipse cx="50" cy="10" rx="10" ry="3" fill="#A51F31" />
      {/* pompon */}
      <path d="M50 9 Q66 6 70 20 Q73 30 68 42" stroke="#15171c" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M68 40 l-3 7 M68 40 l1 8 M68 40 l4 6" stroke="#15171c" strokeWidth="2.4" strokeLinecap="round" />
      {/* yeux */}
      {happy ? (
        <>
          <path d="M28 58 q5 -6 10 0" stroke="#15171c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M62 58 q5 -6 10 0" stroke="#15171c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="33" cy="58" r="5" fill="#15171c" />
          <circle cx="67" cy="58" r="5" fill="#15171c" />
          <circle cx="34.6" cy="56.4" r="1.6" fill="#fff" />
          <circle cx="68.6" cy="56.4" r="1.6" fill="#fff" />
        </>
      )}
      {/* bec */}
      <path d="M44 66 L56 66 L50 76 Z" fill="#F7C744" />
      {/* accessoires gagnés */}
      {level >= 5 && <rect x="26" y="25" width="48" height="4" rx="2" fill="#F7C744" stroke="#8a6a00" strokeWidth="0.8" />}
      {level >= 3 && <path d="M34 14 l2.2 4.6 5 .6 -3.7 3.4 1 5 -4.5-2.5 -4.5 2.5 1-5 -3.7-3.4 5-.6z" fill="#F7C744" stroke="#8a6a00" strokeWidth="0.8" />}
      {level >= 2 && (
        <g>
          <rect x="4" y="88" width="20" height="15" rx="2" fill="#2f6fb5" stroke="#15171c" strokeWidth="1" />
          <line x1="14" y1="88" x2="14" y2="103" stroke="#fff" strokeWidth="1.2" />
        </g>
      )}
      {level >= 4 && (
        <g>
          <rect x="80" y="88" width="12" height="15" rx="3" fill="#F7C744" stroke="#15171c" strokeWidth="1" />
          <path d="M83 88 q3 -5 6 0" stroke="#15171c" strokeWidth="1" fill="none" />
        </g>
      )}
      {/* moustache */}
      <path d="M50 74 Q40 74 30 84 Q24 92 20 94 Q32 92 40 86 Q46 82 50 80 Z" fill="#fff" />
      <path d="M50 74 Q60 74 70 84 Q76 92 80 94 Q68 92 60 86 Q54 82 50 80 Z" fill="#fff" />
    </svg>
  );
}

/**
 * Sidi Hkeya avec une bulle.
 * `line` = clé d'une phrase en derja (sous-titrée), ou `text` = texte libre (aide contextuelle).
 */
export default function SidiHkeya({ line, text, title, size = 80, mood, children, live = true, level = 1 }) {
  const t = useT();
  const l = line ? sidiLine(line, t.lang) : null;
  const hasBubble = Boolean(l || text || children);
  return (
    <div className="sidi">
      <SidiFace size={size} level={level} mood={mood || (line === 'bravo' || line === 'goal' ? 'happy' : 'normal')} />
      {hasBubble && (
        <div className="sidi-bubble" role={live ? 'status' : undefined} aria-live={live ? 'polite' : undefined}>
          {title && <div className="sidi-derja">{title}</div>}
          {l && (
            <>
              <div className="sidi-derja" lang={t.lang === 'ar' ? 'aeb' : 'aeb-Latn'}>{l.main}</div>
              <div className="sidi-sub">{l.sub}</div>
            </>
          )}
          {text && <div>{text}</div>}
          {children}
        </div>
      )}
    </div>
  );
}
