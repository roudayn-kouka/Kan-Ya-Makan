import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n/index.js';
import { useStore } from '../state/store.jsx';
import { CODE_IMAGES, AVATARS } from '../data/presets.js';
import { sidiLine } from '../data/sidi.js';

export function avatarOf(id) {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}

/** Bascule FR / ع */
export function LangToggle() {
  const { state, dispatch } = useStore();
  const next = state.lang === 'ar' ? 'fr' : 'ar';
  return (
    <button
      type="button"
      className="btn btn-small"
      onClick={() => dispatch({ type: 'SET_LANG', lang: next })}
      aria-label={next === 'ar' ? 'العربية' : 'Français'}
      lang={next}
    >
      {next === 'ar' ? 'العربية' : 'Français'}
    </button>
  );
}

/** Minuteur visuel doux (sablier + barre), sans alarme. */
export function Hourglass({ usedSec, maxMin }) {
  const t = useT();
  const total = Math.max(1, maxMin * 60);
  const left = Math.max(0, total - usedSec);
  const ratio = left / total;
  const minLeft = Math.ceil(left / 60);
  return (
    <div className="hourglass" role="timer" aria-label={t('time_left', { min: minLeft })}>
      <span aria-hidden="true">⏳</span>
      <div className="hourglass-bar" aria-hidden="true">
        <div className="hourglass-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
      <span className="muted">{t('time_left_short', { min: minLeft })}</span>
    </div>
  );
}

/** Chemin de progression « tu es ici ». */
export function ProgressPath({ total, current }) {
  const t = useT();
  return (
    <div className="progress-path" aria-label={t('page_of', { n: current + 1, total })}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && <span className="progress-link" aria-hidden="true" />}
          <span
            className={`progress-dot ${i < current ? 'done' : ''} ${i === current ? 'here' : ''}`}
            aria-hidden="true"
          >
            {i < current ? '✓' : i === current ? i + 1 : ''}
          </span>
        </span>
      ))}
      <span className="visually-hidden">{t('you_are_here')}</span>
    </div>
  );
}

/** Saisie d'un code en 3 images (profil enfant). */
export function ImageCodePad({ onComplete, error, hint }) {
  const t = useT();
  const [code, setCode] = useState([]);
  useEffect(() => {
    if (code.length === 3) {
      onComplete(code);
      setCode([]);
    }
  }, [code, onComplete]);
  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <div className="code-slots" aria-live="polite" aria-label={t('code_progress', { n: code.length })}>
        {[0, 1, 2].map((i) => {
          const img = CODE_IMAGES.find((c) => c.id === code[i]);
          return (
            <div key={i} className={`code-slot ${img ? 'filled' : ''}`}>
              {img ? img.emoji : ''}
            </div>
          );
        })}
      </div>
      <div className="code-grid">
        {CODE_IMAGES.map((img) => (
          <button
            key={img.id}
            type="button"
            className="code-btn"
            aria-label={t.pick(img.label)}
            onClick={() => setCode((c) => (c.length < 3 ? [...c, img.id] : c))}
          >
            {img.emoji}
          </button>
        ))}
      </div>
      <div className="row">
        <button type="button" className="btn btn-small" onClick={() => setCode((c) => c.slice(0, -1))} disabled={!code.length}>
          ⌫ {t('erase')}
        </button>
      </div>
      {error && <p role="alert" className="center">{error}</p>}
      {hint && <p className="muted center" style={{ fontSize: '0.85em' }}>{hint}</p>}
    </div>
  );
}

/** Clavier du code parent (chiffres). */
export function PinPad({ length = 4, onComplete, disabled }) {
  const t = useT();
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (pin.length === length) {
      onComplete(pin);
      setPin('');
    }
  }, [pin, length, onComplete]);
  const press = (d) => !disabled && setPin((p) => (p.length < length ? p + d : p));
  return (
    <div className="stack" style={{ alignItems: 'center' }}>
      <div className="code-slots" aria-label={t('code_progress', { n: pin.length })}>
        {Array.from({ length }, (_, i) => (
          <div key={i} className={`code-slot ${i < pin.length ? 'filled' : ''}`}>{i < pin.length ? '●' : ''}</div>
        ))}
      </div>
      <div className="keypad" dir="ltr">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="btn" onClick={() => press(d)} disabled={disabled}>{d}</button>
        ))}
        <span />
        <button type="button" className="btn" onClick={() => press('0')} disabled={disabled}>0</button>
        <button type="button" className="btn" aria-label={t('erase')} onClick={() => setPin((p) => p.slice(0, -1))} disabled={disabled}>⌫</button>
      </div>
    </div>
  );
}

/**
 * Bouton à appui long (accès parent protégé dans l'espace enfant).
 * Au clavier : maintenir Entrée ou Espace.
 */
export function LongPressButton({ ms = 900, onDone, children, className = '' }) {
  const [p, setP] = useState(0);
  const raf = useRef(null);
  const start = useRef(0);
  const stop = () => {
    cancelAnimationFrame(raf.current);
    raf.current = null;
    setP(0);
  };
  const begin = () => {
    if (raf.current) return;
    start.current = performance.now();
    const tick = () => {
      const r = Math.min(1, (performance.now() - start.current) / ms);
      setP(r);
      if (r >= 1) {
        stop();
        onDone();
      } else raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return (
    <button
      type="button"
      className={`btn btn-small longpress ${className}`}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); begin(); } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') stop(); }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="fill" style={{ transform: `scaleX(${p})` }} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

/**
 * Question de compréhension : jamais d'échec affiché.
 * Une mauvaise réponse devient grisée et Sidi donne un indice ; l'enfant réessaie.
 */
export function QuestionCard({ question, onAnswer }) {
  const t = useT();
  const q = t.pick(question);
  const [tried, setTried] = useState([]);
  const [done, setDone] = useState(false);
  const hint = sidiLine('hint', t.lang);
  const bravo = sidiLine('bravo', t.lang);

  const choose = (i) => {
    if (done || tried.includes(i)) return;
    const correct = i === q.correct;
    onAnswer?.({ correct, firstTry: tried.length === 0 });
    if (correct) setDone(true);
    else setTried((x) => [...x, i]);
  };

  return (
    <div className="question-card">
      <strong style={{ fontSize: '1.15em' }}>{q.q}</strong>
      {q.choices.map((c, i) => (
        <button
          key={i}
          type="button"
          className="btn choice-btn"
          data-state={done && i === q.correct ? 'correct' : tried.includes(i) ? 'tried' : ''}
          onClick={() => choose(i)}
          aria-disabled={done || tried.includes(i)}
        >
          {c}
        </button>
      ))}
      <div role="status" aria-live="polite">
        {done && <p><strong>{bravo.main}</strong> — {bravo.sub}</p>}
        {!done && tried.length > 0 && <p><strong>{hint.main}</strong> — {hint.sub}</p>}
      </div>
    </div>
  );
}

export function Toggle({ label, checked, onChange, disabled, note }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={Boolean(checked)} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span>{label}{note && <span className="badge-tag soon" style={{ marginInlineStart: 8 }}>{note}</span>}</span>
    </label>
  );
}
