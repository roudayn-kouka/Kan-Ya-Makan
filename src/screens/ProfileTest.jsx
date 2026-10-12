/** Test de profil (6.8) — confort de lecture, couleurs, son, puis aperçu « c'est confortable ? ». */
import { useMemo, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { profileFromAnswers, whoFills } from '../engine/profileTest.js';
import { presetProfile } from '../data/presets.js';
import ReadingPreview from '../components/ReadingPreview.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';

const STEPS = ['intro', 'letters', 'spacing', 'focus', 'colorsRG', 'colorsBY', 'loud', 'preview'];

export default function ProfileTest({ params }) {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const child = state.children.find((c) => c.id === params.childId);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const profile = useMemo(() => profileFromAnswers(answers), [answers]);
  if (!child) return null;

  const key = STEPS[step];
  const answer = (k, v) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setStep((s) => s + 1);
  };
  const save = (thenSettings) => {
    // On garde la voix choisie et le partage texte/scène déjà réglés par le parent
    const merged = { ...profile, audio: { ...profile.audio, voiceURI: child.profile.audio.voiceURI } };
    dispatch({ type: 'SET_PROFILE', id: child.id, profile: merged });
    navigate('parent', { tab: thenSettings ? 'settings' : 'child', childId: child.id });
  };

  const Choice = ({ k, options }) => (
    <div className="stack">
      {options.map(([v, label]) => (
        <button key={v} type="button" className="btn choice-btn" onClick={() => answer(k, v)}>{label}</button>
      ))}
    </div>
  );
  const freq = [['often', t('often')], ['sometimes', t('sometimes')], ['never', t('never')]];
  const yesNo = [['yes', t('yes')], ['no', t('no')]];
  const standard = presetProfile('general');
  const large = presetProfile('dyslexie');

  return (
    <main className="screen">
      <div className="screen-narrow stack">
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => (step ? setStep(step - 1) : navigate('parent', { tab: 'settings', childId: child.id }))}>← {t('back')}</button>
          <span className="muted">{t('step_of', { n: step + 1, total: STEPS.length })}</span>
        </div>
        <h1>{t('profile_test_title', { name: child.nickname })}</h1>

        {key === 'intro' && (
          <>
            <SidiHkeya text={t('test_intro')} />
            <p className="banner">{t(`fills_${whoFills(child.ageRange)}`)}</p>
            <p className="muted">{t('test_not_medical')}</p>
            <button type="button" className="btn btn-primary" onClick={() => setStep(1)} style={{ alignSelf: 'flex-start' }}>{t('start')}</button>
          </>
        )}

        {key === 'letters' && (<><h2>{t('q_letters')}</h2><Choice k="letters" options={freq} /></>)}

        {key === 'spacing' && (
          <>
            <h2>{t('q_spacing')}</h2>
            <div className="stack">
              <button type="button" className="btn choice-btn" style={{ display: 'block', padding: 0 }} onClick={() => answer('spacing', 'standard')}>
                <ReadingPreview profile={standard} />
              </button>
              <button type="button" className="btn choice-btn" style={{ display: 'block', padding: 0 }} onClick={() => answer('spacing', 'large')}>
                <ReadingPreview profile={large} />
              </button>
            </div>
          </>
        )}

        {key === 'focus' && (<><h2>{t('q_focus')}</h2><Choice k="focus" options={freq} /></>)}

        {key === 'colorsRG' && (
          <>
            <h2>{t('q_colors')}</h2>
            <div className="color-pair" aria-hidden="true" style={{ alignSelf: 'flex-start' }}>
              <span style={{ background: '#d9534f' }} />
              <span style={{ background: '#5cb85c' }} />
            </div>
            <Choice k="colorsRG" options={yesNo} />
          </>
        )}

        {key === 'colorsBY' && (
          <>
            <h2>{t('q_colors')}</h2>
            <div className="color-pair" aria-hidden="true" style={{ alignSelf: 'flex-start' }}>
              <span style={{ background: '#4a90d9' }} />
              <span style={{ background: '#6fb07a' }} />
            </div>
            <Choice k="colorsBY" options={yesNo} />
          </>
        )}

        {key === 'loud' && (<><h2>{t('q_loud')}</h2><Choice k="loud" options={yesNo} /></>)}

        {key === 'preview' && (
          <>
            <SidiHkeya text={t('is_it_comfortable')} />
            <ReadingPreview profile={profile} />
            <p className="muted">{t('suggested_preset', { preset: t(`preset_${profile.preset}`) })}</p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={() => save(false)}>👍 {t('yes_comfortable')}</button>
              <button type="button" className="btn" onClick={() => save(true)}>🛠 {t('adjust')}</button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
