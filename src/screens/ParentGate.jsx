/** Accès à l'espace parent : code à 4 chiffres haché, verrouillage temporaire après 3 essais. */
import { useCallback, useEffect, useState } from 'react';
import { useStore, DEMO_MODE, DEMO_PARENT_CODE } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { hashCode } from '../engine/hash.js';
import { PinPad } from '../components/ui.jsx';

export default function ParentGate() {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const [msg, setMsg] = useState('');
  const [now, setNow] = useState(Date.now());
  const lockedFor = Math.max(0, Math.ceil(((state.parentLock?.until || 0) - now) / 1000));

  useEffect(() => {
    if (!lockedFor) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [lockedFor]);

  const onPin = useCallback(async (pin) => {
    const h = await hashCode(`parent:${pin}`);
    if (h === state.parentCodeHash) {
      dispatch({ type: 'PARENT_OK' });
      navigate('parent', { tab: 'family' });
    } else {
      dispatch({ type: 'PARENT_FAIL' });
      setNow(Date.now());
      setMsg(t('parent_code_wrong'));
    }
  }, [state.parentCodeHash, dispatch, navigate, t]);

  return (
    <main className="screen">
      <div className="screen-narrow stack" style={{ alignItems: 'center' }}>
        <h1>🔒 {t('parent_space')}</h1>
        <p className="center">{t('parent_code_prompt')}</p>
        <PinPad onComplete={onPin} disabled={lockedFor > 0} />
        <div role="alert" className="center">
          {lockedFor > 0 ? t('locked_for', { s: lockedFor }) : msg}
        </div>
        {DEMO_MODE && <p className="muted" style={{ fontSize: '0.85em' }}>{t('demo_parent_hint', { code: DEMO_PARENT_CODE })}</p>}
        <button type="button" className="btn btn-ghost" onClick={() => navigate('who')}>← {t('back')}</button>
      </div>
    </main>
  );
}
