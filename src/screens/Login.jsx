/** Connexion du parent sur cet appareil (verrouillage 60 s après 5 essais). */
import { useEffect, useState } from 'react';
import { useStore, useWipeAll, DEMO_MODE, DEMO_EMAIL, DEMO_PASSWORD } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { hashCode } from '../engine/hash.js';
import { LangToggle } from '../components/ui.jsx';

export default function Login() {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const wipe = useWipeAll();
  const [email, setEmail] = useState(state.account?.email || '');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(Date.now());
  const lockedFor = Math.max(0, Math.ceil(((state.loginLock?.until || 0) - now) / 1000));

  useEffect(() => {
    if (!lockedFor) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockedFor]);

  const submit = async (e) => {
    e.preventDefault();
    if (lockedFor) return;
    const em = email.trim().toLowerCase();
    const h = await hashCode(`pw:${em}:${pw}`);
    if (state.account && em === state.account.email && h === state.account.passHash) {
      dispatch({ type: 'LOGIN' });
      navigate('who');
    } else {
      dispatch({ type: 'LOGIN_FAIL' });
      setNow(Date.now());
      setPw('');
      setMsg(t('login_wrong'));
    }
  };

  return (
    <main className="screen">
      <div className="topbar screen-narrow">
        <img src="./logo_kan_ya_makan.png" alt="Kan Ya Makan" className="logo-img small" />
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => navigate('vision', { back: 'login' })}>♿ {t('colors_comfort')}</button>
          <LangToggle />
        </div>
      </div>
      <form className="screen-narrow stack" onSubmit={submit}>
        <h1>{t('login_title')}</h1>
        <div className="field">
          <label htmlFor="li-email">{t('email')}</label>
          <input id="li-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="li-pw">{t('password')}</label>
          <input id="li-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div role="alert">{lockedFor ? t('locked_for', { s: lockedFor }) : msg}</div>
        <button type="submit" className="btn btn-primary" disabled={lockedFor > 0} style={{ alignSelf: 'flex-start' }}>{t('login')}</button>
        {DEMO_MODE && state.account?.demo && <p className="muted" style={{ fontSize: '0.85em' }}>{t('demo_login_hint', { email: DEMO_EMAIL, pw: DEMO_PASSWORD })}</p>}
        <hr style={{ width: '100%', border: 0, borderTop: '2px solid var(--ligne)' }} />
        <button type="button" className="btn btn-small btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => { if (window.confirm(t('wipe_confirm'))) wipe(); }}>
          {t('not_you')}
        </button>
      </form>
    </main>
  );
}
