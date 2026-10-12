/**
 * Création du compte parent (6.7, 6.13 B étape 1) : email et mot de passe,
 * pays, code parent à 4 chiffres, consentements. L'enfant n'a jamais de compte
 * propre : il sera un profil rattaché à ce compte (étape suivante).
 * Prototype : mot de passe et code hachés, gardés dans ce navigateur.
 * Version finale : Supabase Auth / Firebase Auth (6 bis B).
 */
import { useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { hashCode } from '../engine/hash.js';
import { Toggle, LangToggle } from '../components/ui.jsx';

const COUNTRIES = ['TN', 'DZ', 'MA', 'LY', 'EG', 'FR', 'BE', 'CA', 'other'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function passwordStrength(pw) {
  let n = 0;
  if (pw.length >= 8) n++;
  if (pw.length >= 12) n++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) n++;
  if (/\d/.test(pw)) n++;
  if (/[^A-Za-z0-9]/.test(pw)) n++;
  return Math.min(4, n);
}

export default function Signup() {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const [f, setF] = useState({ email: '', pw: '', pw2: '', country: 'TN', pin: '', pin2: '', adult: false, privacy: false });
  const [touched, setTouched] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));

  const errors = {
    email: !EMAIL_RE.test(f.email.trim()) ? t('err_email') : null,
    pw: f.pw.length < 8 ? t('err_pw_len') : null,
    pw2: f.pw2 !== f.pw ? t('err_pw_same') : null,
    pin: !/^\d{4}$/.test(f.pin) ? t('pin_format') : ['0000', '1234', '1111'].includes(f.pin) ? t('err_pin_easy') : null,
    pin2: f.pin2 !== f.pin ? t('err_pin_same') : null,
    consent: !(f.adult && f.privacy) ? t('err_consent') : null,
  };
  const valid = Object.values(errors).every((e) => !e);
  const strength = passwordStrength(f.pw);
  const replacing = Boolean(state.account);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    const email = f.email.trim().toLowerCase();
    const [passHash, parentCodeHash] = await Promise.all([hashCode(`pw:${email}:${f.pw}`), hashCode(`parent:${f.pin}`)]);
    if (replacing) dispatch({ type: 'INIT', state: { lang: state.lang, vision: state.vision }, screen: 'signup' });
    dispatch({
      type: 'CREATE_ACCOUNT',
      account: { email, passHash, country: f.country, consents: { adult: true, privacy: true, at: new Date().toISOString() }, createdAt: new Date().toISOString() },
      parentCodeHash,
    });
    navigate('add_child', { first: true });
  };

  const err = (k) => touched && errors[k] && <span className="error" id={`err-${k}`}>{errors[k]}</span>;

  return (
    <main className="screen">
      <div className="topbar screen-narrow">
        <button type="button" className="btn btn-small" onClick={() => navigate(state.account ? 'login' : 'welcome')}>← {t('back')}</button>
        <LangToggle />
      </div>
      <form className="screen-narrow stack" onSubmit={submit} noValidate>
        <div className="steps-bar" aria-hidden="true"><span className="on" /><span /><span /></div>
        <h1>{t('create_account')}</h1>
        <p className="muted" style={{ margin: 0 }}>{t('signup_intro')}</p>
        {replacing && <p className="banner" role="alert">⚠ {t('signup_replace')}</p>}

        <div className="field">
          <label htmlFor="su-email">{t('email')}</label>
          <input id="su-email" type="email" autoComplete="email" value={f.email} onChange={set('email')} aria-invalid={touched && Boolean(errors.email)} aria-describedby="err-email" />
          {err('email')}
        </div>
        <div className="field">
          <label htmlFor="su-pw">{t('password')}</label>
          <input id="su-pw" type="password" autoComplete="new-password" value={f.pw} onChange={set('pw')} aria-invalid={touched && Boolean(errors.pw)} aria-describedby="pw-strength err-pw" />
          <span id="pw-strength" className="muted" style={{ fontSize: '0.88em' }}>
            {t('pw_strength')} : {'■'.repeat(strength)}{'□'.repeat(4 - strength)} {t(`pw_s${strength}`)}
          </span>
          {err('pw')}
        </div>
        <div className="field">
          <label htmlFor="su-pw2">{t('password_confirm')}</label>
          <input id="su-pw2" type="password" autoComplete="new-password" value={f.pw2} onChange={set('pw2')} aria-describedby="err-pw2" />
          {err('pw2')}
        </div>
        <div className="field">
          <label htmlFor="su-country">{t('country')}</label>
          <select id="su-country" value={f.country} onChange={set('country')}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{t(`country_${c}`)}</option>)}
          </select>
          <span className="muted" style={{ fontSize: '0.85em' }}>{t('country_help')}</span>
        </div>

        <div className="card stack">
          <strong>🔒 {t('parent_code')}</strong>
          <span className="muted" style={{ fontSize: '0.9em' }}>{t('parent_code_help')}</span>
          <div className="row">
            <div className="field">
              <label htmlFor="su-pin">{t('new_code')}</label>
              <input id="su-pin" type="password" inputMode="numeric" maxLength={4} value={f.pin} onChange={(e) => set('pin')(e.target.value.replace(/\D/g, ''))} autoComplete="off" aria-describedby="err-pin" />
            </div>
            <div className="field">
              <label htmlFor="su-pin2">{t('confirm')}</label>
              <input id="su-pin2" type="password" inputMode="numeric" maxLength={4} value={f.pin2} onChange={(e) => set('pin2')(e.target.value.replace(/\D/g, ''))} autoComplete="off" aria-describedby="err-pin2" />
            </div>
          </div>
          {err('pin')}{err('pin2')}
        </div>

        <div className="card stack">
          <strong>{t('privacy_title')}</strong>
          <p style={{ margin: 0 }}>{t('privacy_text')}</p>
          <button type="button" className="btn btn-small btn-ghost" style={{ alignSelf: 'flex-start' }} aria-expanded={showPrivacy} onClick={() => setShowPrivacy((x) => !x)}>
            {showPrivacy ? '▾' : '▸'} {t('privacy_details')}
          </button>
          {showPrivacy && (
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              <li>{t('privacy_1')}</li><li>{t('privacy_2')}</li><li>{t('privacy_3')}</li><li>{t('privacy_4')}</li><li>{t('privacy_5')}</li>
            </ul>
          )}
          <Toggle label={t('consent_adult')} checked={f.adult} onChange={set('adult')} />
          <Toggle label={t('consent_privacy')} checked={f.privacy} onChange={set('privacy')} />
          {err('consent')}
        </div>

        {touched && !valid && <p role="alert" className="banner">⚠ {t('form_fix')}</p>}
        <button type="submit" className="btn btn-primary" disabled={busy} style={{ alignSelf: 'flex-start' }}>{t('create_account_next')} →</button>
      </form>
    </main>
  );
}
