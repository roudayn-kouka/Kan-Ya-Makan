/** Écran 1 — « Qui lit ? » : avatar + code en 3 images, accès parent protégé (appui long + code). */
import { useCallback, useState } from 'react';
import { useStore, DEMO_MODE } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { hashCode } from '../engine/hash.js';
import { accessStatus } from '../engine/timeRules.js';
import { CODE_IMAGES } from '../data/presets.js';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { ImageCodePad, LongPressButton, LangToggle, avatarOf } from '../components/ui.jsx';

export default function WhoReads() {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const [picked, setPicked] = useState(null);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(null);

  const child = state.children.find((c) => c.id === picked);

  const onCode = useCallback(async (code) => {
    if (!child) return;
    const h = await hashCode(`child:${code.join(',')}`);
    if (h !== child.codeHash) {
      setError(t('code_wrong'));
      return;
    }
    const status = accessStatus(child.rules, state.dailyTime, child.id);
    if (status !== 'ok') {
      setBlocked(status);
      return;
    }
    dispatch({ type: 'SELECT_CHILD', id: child.id });
    navigate('choose');
  }, [child, state.dailyTime, dispatch, navigate, t]);

  const demoHint = DEMO_MODE && child?.demoCode
    ? t('demo_code_hint', { code: child.demoCode.map((id) => CODE_IMAGES.find((c) => c.id === id)?.emoji).join(' ') })
    : null;

  return (
    <main className="screen">
      <div className="topbar screen-wide">
        <img src="./logo_kan_ya_makan.png" alt="Kan Ya Makan — كان يا مكان" className="logo-img" />
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => navigate('vision', { back: 'who' })}>♿ {t('colors_comfort')}</button>
          <LangToggle />
        </div>
      </div>

      <div className="screen-narrow stack" style={{ alignItems: 'center' }}>
        {!child && (
          <>
            <SidiHkeya line="welcome" size={96} />
            <h1 className="center">{t('who_reads')}</h1>
            {state.children.length === 0 && <p className="muted center">{t('no_children')}</p>}
            <div className="avatar-grid">
              {state.children.map((c) => (
                <button key={c.id} type="button" className="avatar-btn" onClick={() => { setPicked(c.id); setError(''); setBlocked(null); }}>
                  <span className="avatar-emoji" aria-hidden="true">{avatarOf(c.avatar).emoji}</span>
                  {c.nickname}
                </button>
              ))}
            </div>
          </>
        )}

        {child && !blocked && (
          <>
            <span className="avatar-emoji" aria-hidden="true">{avatarOf(child.avatar).emoji}</span>
            <h1 className="center">{t('hello_name', { name: child.nickname })}</h1>
            <p className="center">{t('enter_code')}</p>
            <ImageCodePad onComplete={onCode} error={error} hint={demoHint} />
            <button type="button" className="btn btn-ghost" onClick={() => setPicked(null)}>← {t('back')}</button>
          </>
        )}

        {child && blocked && (
          <>
            <SidiHkeya line={blocked === 'day_limit' ? 'bye' : 'pause'} size={96} />
            <h1 className="center">{blocked === 'day_limit' ? t('see_you_tomorrow') : t('outside_window_title')}</h1>
            <p className="center">
              {blocked === 'day_limit'
                ? t('progress_saved')
                : t('outside_window', { start: child.rules.window.start, end: child.rules.window.end })}
            </p>
            <button type="button" className="btn" onClick={() => { setPicked(null); setBlocked(null); }}>{t('ok')}</button>
          </>
        )}
      </div>

      <div style={{ marginTop: 'auto' }} className="stack center">
        <LongPressButton onDone={() => navigate('parent_gate')}>🔒 {t('parent_space')}</LongPressButton>
        <span className="muted" style={{ fontSize: '0.85em' }}>{t('long_press_hint')}</span>
      </div>
    </main>
  );
}
