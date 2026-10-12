/**
 * Tout premier écran (et accessible ensuite par le bouton ♿) :
 * « Voyez-vous bien toutes les couleurs ? ». Le choix adapte IMMÉDIATEMENT
 * le site entier (aperçu en direct sur cette page), avec correction optionnelle,
 * contraste élevé et réduction des animations.
 */
import { useState } from 'react';
import { useStore, entryScreen } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import ColorTest from '../components/ColorTest.jsx';
import { Toggle, LangToggle } from '../components/ui.jsx';
import { SidiFace } from '../components/SidiHkeya.jsx';

export const VISION_CHOICES = [
  { id: 'none', emoji: '👁️', swatches: ['#c0392b', '#5b8c2a', '#2f6fb5', '#f2c230'] },
  { id: 'deutan', emoji: '🔴🟢', swatches: ['#9a8a2e', '#8f8a34', '#2f6fb5', '#f2c230'] },
  { id: 'protan', emoji: '🔴', swatches: ['#6e6a2c', '#9a9338', '#2f6fb5', '#f2c230'] },
  { id: 'tritan', emoji: '🔵🟡', swatches: ['#c0392b', '#5b8c2a', '#3b8a8a', '#f2a2a2'] },
  { id: 'achro', emoji: '⚫⚪', swatches: ['#555', '#777', '#999', '#ccc'] },
];

export default function Vision({ params }) {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const v = state.vision;
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const set = (patch) => dispatch({ type: 'SET_VISION', patch });

  const choose = (cvd) => {
    // la correction est proposée (activée) dès qu'un daltonisme est indiqué ; on peut l'enlever
    set({ cvd, correction: cvd === 'none' ? false : v.cvd === 'none' ? true : v.correction });
  };

  const done = () => {
    set({ asked: true });
    if (params.back) navigate(params.back, params.backParams || {});
    else navigate(entryScreen({ ...state, vision: { ...v, asked: true } }));
  };

  return (
    <main className="screen">
      <div className="topbar screen-narrow">
        <img src="./logo_kan_ya_makan.png" alt="Kan Ya Makan — كان يا مكان" className="logo-img small" />
        <LangToggle />
      </div>
      <div className="screen-narrow stack">
        <div className="row" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
          <SidiFace size={64} />
          <div>
            <h1 style={{ marginBottom: 4 }}>{t('vision_title')}</h1>
            <p className="muted" style={{ margin: 0 }}>{t('vision_intro')}</p>
          </div>
        </div>

        {!testing && (
          <div className="vision-options" role="radiogroup" aria-label={t('vision_title')}>
            {VISION_CHOICES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={v.cvd === c.id} className="vision-option" onClick={() => choose(c.id)}>
                <span className="swatches" aria-hidden="true">{c.swatches.map((s, i) => <span key={i} style={{ background: s }} />)}</span>
                <span>
                  <strong>{t(`vision_${c.id}`)}</strong>
                  <br />
                  <span className="muted" style={{ fontSize: '0.9em' }}>{t(`vision_${c.id}_desc`)}</span>
                </span>
              </button>
            ))}
            <button type="button" className="vision-option" onClick={() => { setTesting(true); setResult(null); }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">❓</span>
              <span><strong>{t('vision_unsure')}</strong><br /><span className="muted" style={{ fontSize: '0.9em' }}>{t('vision_unsure_desc')}</span></span>
            </button>
          </div>
        )}

        {testing && (
          <ColorTest onResult={(cvd) => { choose(cvd); setResult(cvd); setTesting(false); }} />
        )}
        {result && !testing && (
          <p className="banner" role="status">🧪 {t('vision_test_result', { type: t(`vision_${result}`) })}</p>
        )}

        <div className="card stack">
          <strong>{t('vision_more')}</strong>
          <Toggle label={t('vision_correction')} checked={v.correction} disabled={v.cvd === 'none'} onChange={(x) => set({ correction: x })} />
          <span className="muted" style={{ fontSize: '0.88em', marginTop: -6 }}>{t('vision_correction_help')}</span>
          <Toggle label={t('high_contrast')} checked={v.highContrast} onChange={(x) => set({ highContrast: x })} />
          <Toggle label={t('reduced_motion')} checked={v.reduceMotion} onChange={(x) => set({ reduceMotion: x })} />
        </div>

        {/* aperçu en direct : ce bloc utilise les couleurs du site */}
        <div className="card stack" aria-label={t('live_preview')}>
          <span className="muted" style={{ fontSize: 14 }}>{t('live_preview')}</span>
          <div className="row">
            <button type="button" className="btn btn-primary" tabIndex={-1}>{t('next_page')} →</button>
            <button type="button" className="chip" aria-pressed="true" tabIndex={-1}>📖 {t('mode_read')}</button>
            <button type="button" className="chip" aria-pressed="false" tabIndex={-1}>🎧 {t('mode_listen')}</button>
          </div>
          <div className="row">
            <button type="button" className="btn choice-btn" data-state="correct" style={{ width: 'auto' }} tabIndex={-1}>{t('vision_sample_ok')}</button>
            <button type="button" className="btn choice-btn" data-state="tried" style={{ width: 'auto' }} tabIndex={-1}>{t('vision_sample_try')}</button>
          </div>
          <div className="row" style={{ gap: 6 }}>
            <span className="badge-tag">▲ Nour</span><span className="badge-tag">● {t('bird')}</span><span className="badge-tag">■ Yasmine</span><span className="badge-tag">◆ Adam</span>
          </div>
        </div>

        <p className="muted" style={{ fontSize: '0.9em' }}>{t('vision_child_later')}</p>
        <button type="button" className="btn btn-primary" onClick={done} style={{ alignSelf: 'flex-start' }}>{t('continue')} →</button>
      </div>
    </main>
  );
}
