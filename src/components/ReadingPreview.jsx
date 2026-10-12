import { readingVars } from '../engine/adaptation.js';
import { useT } from '../i18n/index.js';

/** Aperçu en direct des réglages de lecture (configuration parent et test de profil). */
export default function ReadingPreview({ profile, text }) {
  const t = useT();
  return (
    <div className="preview-box" style={{ ...readingVars(profile, t.lang), background: 'var(--read-bg)' }}>
      <div className="muted" style={{ fontSize: 14, marginBottom: 6 }}>{t('live_preview')}</div>
      <p className="read-text" style={{ margin: 0 }}>{text || t('preview_sample')}</p>
    </div>
  );
}
