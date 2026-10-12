/**
 * Mini-test de vision des couleurs (3 paires, ~30 secondes).
 * Ce n'est pas un test médical : il sert seulement à proposer des couleurs
 * confortables. Les paires sont choisies pour se confondre selon le type.
 */
import { useState } from 'react';
import { useT } from '../i18n/index.js';
import { cvdFromTest } from '../engine/vision.js';

const PAIRS = [
  { key: 'redGreen', colors: ['#c0392b', '#5b8c2a'] },   // se confondent en protanopie / deutéranopie
  { key: 'blueYellow', colors: ['#5b8fd6', '#7aa87a'] }, // se confondent en tritanopie
  { key: 'anyColor', colors: ['#d98a2b', '#8e8e8e'] },   // même clarté : différentes seulement par la couleur
];

export default function ColorTest({ onResult, subject = 'you' }) {
  const t = useT();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const pair = PAIRS[i];

  const answer = (sees) => {
    const next = { ...answers, [pair.key]: sees };
    setAnswers(next);
    if (i < PAIRS.length - 1) setI(i + 1);
    else onResult(cvdFromTest(next), next);
  };

  return (
    <div className="card stack" style={{ alignItems: 'center' }}>
      <span className="muted">{t('step_of', { n: i + 1, total: PAIRS.length })}</span>
      <strong className="center">{t(subject === 'child' ? 'ct_question_child' : 'ct_question')}</strong>
      <div className="test-pair" role="img" aria-label={t('ct_pair_aria')}>
        <span style={{ background: pair.colors[0] }} />
        <span style={{ background: pair.colors[1] }} />
      </div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn" onClick={() => answer(true)}>👍 {t('ct_yes')}</button>
        <button type="button" className="btn" onClick={() => answer(false)}>🤔 {t('ct_no')}</button>
      </div>
      <span className="muted center" style={{ fontSize: '0.85em' }}>{t('ct_not_medical')}</span>
    </div>
  );
}
