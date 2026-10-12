/** Accueil avant tout compte : créer un compte parent, ou essayer la famille de démo. */
import { useStore, useResetDemo } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { LangToggle } from '../components/ui.jsx';

export default function Welcome() {
  const { navigate } = useStore();
  const t = useT();
  const [busy, loadDemo] = useResetDemo();
  return (
    <main className="screen">
      <div className="topbar screen-narrow">
        <span />
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => navigate('vision', { back: 'welcome' })}>♿ {t('colors_comfort')}</button>
          <LangToggle />
        </div>
      </div>
      <div className="screen-narrow stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <img src="./logo_kan_ya_makan.png" alt="Kan Ya Makan — كان يا مكان" className="logo-img" style={{ height: 96 }} />
        <p style={{ fontSize: '1.2em', margin: 0 }}>{t('tagline')}</p>
        <SidiHkeya line="welcome" size={90} />
        <div className="card stack" style={{ width: '100%', textAlign: 'start' }}>
          <h2 style={{ margin: 0 }}>{t('welcome_parent')}</h2>
          <p style={{ margin: 0 }}>{t('welcome_parent_text')}</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('signup')}>👤 {t('create_account')}</button>
          <button type="button" className="btn" disabled={busy} onClick={loadDemo}>🎬 {t('try_demo')}</button>
        </div>
        <p className="muted" style={{ fontSize: '0.88em' }}>{t('not_medical_short')}</p>
      </div>
    </main>
  );
}
