/**
 * Ajouter un profil enfant (6.13 B, étapes 2 à 6), en 4 étapes :
 *  1. Qui : surnom, tranche d'âge, avatar (minimum de données)
 *  2. Ce que vous avez remarqué : lecture, attention, compréhension, COULEURS
 *     (avec mini-test), audition, parole — observations de confort, pas un diagnostic
 *  3. Code secret en 3 images
 *  4. Confidentialité et consentement → réglages proposés avec aperçu en direct
 */
import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { hashCode } from '../engine/hash.js';
import { AVATARS, AGE_RANGES, CODE_IMAGES, defaultRules } from '../data/presets.js';
import { profileFromNeeds, presetFromNeeds } from '../engine/profileTest.js';
import ColorTest from '../components/ColorTest.jsx';
import { Toggle } from '../components/ui.jsx';

const NEEDS = [
  { key: 'reading', emoji: '📖' },
  { key: 'attention', emoji: '🎯' },
  { key: 'comprehension', emoji: '💭' },
  { key: 'colors', emoji: '🎨' },
  { key: 'hearing', emoji: '👂' },
  { key: 'speech', emoji: '🗣️' },
];
const COLOR_KINDS = ['rg', 'by', 'achro', 'unknown'];
const CVD_TO_KIND = { deutan: 'rg', protan: 'rg', tritan: 'by', achro: 'achro', none: 'none' };

export default function AddChild({ params }) {
  const { state, dispatch, navigate, uid } = useStore();
  const t = useT();
  const [step, setStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState('8-10');
  const [avatar, setAvatar] = useState('renard');
  const [needs, setNeeds] = useState({ colors: 'none' });
  const [testing, setTesting] = useState(false);
  const [code, setCode] = useState([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const first = params.first || state.children.length === 0;

  const toggleNeed = (k) => {
    if (k === 'colors') return setNeeds((n) => ({ ...n, colors: n.colors && n.colors !== 'none' ? 'none' : 'unknown' }));
    setNeeds((n) => ({ ...n, [k]: !n[k] }));
  };
  const has = (k) => (k === 'colors' ? needs.colors && needs.colors !== 'none' : Boolean(needs[k]));
  const nothing = !NEEDS.some((n) => has(n.key));

  const canNext = {
    1: nickname.trim().length >= 2,
    2: true,
    3: code.length === 3,
    4: consent,
  }[step];

  const save = async () => {
    setBusy(true);
    const id = uid('enf');
    const child = {
      id,
      nickname: nickname.trim().slice(0, 20),
      ageRange,
      avatar,
      codeHash: await hashCode(`child:${code.join(',')}`),
      profile: profileFromNeeds(needs),
      rules: defaultRules(),
      bookmarks: {},
      consentAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_CHILD', child });
    navigate('parent', { tab: 'settings', childId: id, fromNeeds: true });
  };

  return (
    <main className="screen">
      <div className="screen-narrow stack">
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => (step > 1 ? setStep(step - 1) : navigate(first ? 'welcome' : 'parent', { tab: 'family' }))}>← {t('back')}</button>
          <span className="muted">{t('step_of', { n: step, total: 4 })}</span>
        </div>
        {first && <div className="steps-bar" aria-hidden="true"><span className="on" /><span className="on" /><span /></div>}
        <h1>{first ? t('add_first_child') : t('add_child')}</h1>

        {step === 1 && (
          <>
            <p className="banner">🔒 {t('minimal_data')}</p>
            <div className="field">
              <label htmlFor="nick">{t('nickname')}</label>
              <input id="nick" type="text" value={nickname} maxLength={20} autoComplete="off" onChange={(e) => setNickname(e.target.value)} />
            </div>
            <div className="field">
              <span className="label">{t('age_range')}</span>
              <div className="row">
                {AGE_RANGES.map((a) => (
                  <button key={a} type="button" className="chip" aria-pressed={ageRange === a} onClick={() => setAgeRange(a)}>{t('years', { range: a })}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="label">{t('avatar')}</span>
              <div className="row">
                {AVATARS.map((a) => (
                  <button key={a.id} type="button" className="chip" style={{ fontSize: 28 }} aria-pressed={avatar === a.id} aria-label={t.pick(a.label)} onClick={() => setAvatar(a.id)}>{a.emoji}</button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ margin: 0 }}>{t('needs_title', { name: nickname.trim() })}</h2>
            <p className="muted" style={{ margin: 0 }}>{t('needs_intro')}</p>
            <div className="stack" role="group" aria-label={t('needs_title', { name: nickname.trim() })}>
              {NEEDS.map((n) => (
                <div key={n.key} className="stack" style={{ gap: 8 }}>
                  <button type="button" className="need-card" aria-pressed={has(n.key)} onClick={() => toggleNeed(n.key)}>
                    <span className="need-emoji" aria-hidden="true">{n.emoji}</span>
                    <span>
                      <strong>{t(`need_${n.key}`)}</strong>
                      <br />
                      <span className="muted" style={{ fontSize: '0.9em' }}>{t(`need_${n.key}_desc`)}</span>
                    </span>
                  </button>
                  {n.key === 'colors' && has('colors') && (
                    <div className="card stack" style={{ marginInlineStart: 24 }}>
                      <strong>{t('colors_which')}</strong>
                      <div className="row">
                        {COLOR_KINDS.map((k) => (
                          <button key={k} type="button" className="chip" aria-pressed={needs.colors === k} onClick={() => setNeeds((x) => ({ ...x, colors: k }))}>
                            {t(`colors_${k}`)}
                          </button>
                        ))}
                      </div>
                      {!testing ? (
                        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setTesting(true)}>🧪 {t('colors_do_test')}</button>
                      ) : (
                        <ColorTest subject="child" onResult={(cvd) => { setTesting(false); setNeeds((x) => ({ ...x, colors: CVD_TO_KIND[cvd] === 'none' ? 'none' : CVD_TO_KIND[cvd] })); }} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="banner">
              {nothing ? t('needs_none') : t('needs_result', { preset: t(`preset_${presetFromNeeds(needs)}`) })}
            </div>
            <p className="muted" style={{ fontSize: '0.88em', margin: 0 }}>{t('needs_not_diagnosis')}</p>
          </>
        )}

        {step === 3 && (
          <div className="field">
            <span className="label">{t('image_code')}</span>
            <span className="muted">{t('image_code_help')}</span>
            <div className="row">
              {CODE_IMAGES.map((img) => (
                <button key={img.id} type="button" className="code-btn" style={{ width: 64, height: 64, fontSize: 32 }} aria-label={t.pick(img.label)}
                  onClick={() => setCode((c) => (c.length < 3 ? [...c, img.id] : c))}>{img.emoji}</button>
              ))}
            </div>
            <div className="row">
              <strong aria-live="polite" style={{ fontSize: 28 }}>{code.map((cid) => CODE_IMAGES.find((c) => c.id === cid)?.emoji).join(' ') || '—'}</strong>
              <button type="button" className="btn btn-small" onClick={() => setCode([])} disabled={!code.length}>{t('erase')}</button>
            </div>
            <span className="muted" style={{ fontSize: '0.88em' }}>{t('image_code_remember')}</span>
          </div>
        )}

        {step === 4 && (
          <div className="card stack">
            <strong>{t('privacy_title')}</strong>
            <p style={{ margin: 0 }}>{t('privacy_child_text', { name: nickname.trim() })}</p>
            <Toggle label={t('consent')} checked={consent} onChange={setConsent} />
          </div>
        )}

        <div className="row">
          {step < 4
            ? <button type="button" className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{t('continue')} →</button>
            : <button type="button" className="btn btn-primary" disabled={!canNext || busy} onClick={save}>{t('create_profile')} →</button>}
        </div>
      </div>
    </main>
  );
}
