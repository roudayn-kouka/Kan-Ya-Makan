/** Écran 9 — Réglages d'un enfant : profil, affichage, voix, scène, temps, pauses, récompenses, droits. */
import { useEffect, useState } from 'react';
import { useStore } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { PRESET_IDS, presetProfile, deepMerge } from '../data/presets.js';
import { listVoices, onVoicesChanged } from '../engine/speech.js';
import ReadingPreview from '../components/ReadingPreview.jsx';
import { Toggle } from '../components/ui.jsx';
import { profileFromNeeds } from '../engine/profileTest.js';

const NEED_KEYS = ['reading', 'attention', 'comprehension', 'colors', 'hearing', 'speech'];

function Range({ id, label, value, min, max, step, onChange, format = (v) => v, note }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label} : <span className="muted">{format(value)}</span></label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      {note && <span className="muted" style={{ fontSize: '0.85em' }}>{note}</span>}
    </div>
  );
}

function Select({ id, label, value, options, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

export default function ChildSettings({ child }) {
  const { dispatch, navigate } = useStore();
  const t = useT();
  const p = child.profile;
  const r = child.rules;
  const [voices, setVoices] = useState(() => listVoices(t.lang));
  useEffect(() => {
    setVoices(listVoices(t.lang));
    return onVoicesChanged(() => setVoices(listVoices(t.lang)));
  }, [t.lang]);

  const setP = (patch) => dispatch({ type: 'SET_PROFILE', id: child.id, profile: deepMerge(p, patch) });
  const setR = (patch) => dispatch({ type: 'SET_RULES', id: child.id, rules: deepMerge(r, patch) });

  const applyPreset = (id) => {
    const next = presetProfile(id);
    next.audio.voiceURI = p.audio.voiceURI;
    dispatch({ type: 'SET_PROFILE', id: child.id, profile: next });
  };

  const setReward = (i, patch) => {
    const list = r.rewards.map((x, j) => (j === i ? deepMerge(x, patch) : x));
    dispatch({ type: 'SET_RULES', id: child.id, rules: { ...r, rewards: list } });
  };
  const addReward = () => dispatch({
    type: 'SET_RULES', id: child.id,
    rules: { ...r, rewards: [...r.rewards, { id: `r${Date.now()}`, stars: 15, label: { fr: 'Nouvelle récompense', ar: 'مكافأة جديدة' } }] },
  });
  const removeReward = (i) => dispatch({ type: 'SET_RULES', id: child.id, rules: { ...r, rewards: r.rewards.filter((_, j) => j !== i) } });

  const em = (v) => `${v.toFixed(2)} em`;
  const [needs, setNeeds] = useState(() => ({ colors: 'none', ...(p.needs || {}) }));

  return (
    <div className="stack" style={{ width: '100%' }}>
      <section className="card stack">
        <h2>{t('support_profile')}</h2>
        <div className="row">
          {PRESET_IDS.map((id) => (
            <button key={id} type="button" className="chip" aria-pressed={p.preset === id} onClick={() => applyPreset(id)}>{t(`preset_${id}`)}</button>
          ))}
          <button type="button" className="btn btn-small" onClick={() => navigate('profile_test', { childId: child.id })}>🧭 {t('do_profile_test')}</button>
        </div>
        <span className="muted" style={{ fontSize: '0.9em' }}>{t('presets_not_labels')}</span>
        <div className="stack" style={{ gap: 8, borderTop: '2px solid var(--ligne)', paddingTop: 12 }}>
          <strong>{t('needs_noticed')}</strong>
          <div className="row" style={{ gap: 6 }}>
            {NEED_KEYS.map((k) => {
              const on = k === 'colors' ? Boolean(needs.colors && needs.colors !== 'none') : Boolean(needs[k]);
              return (
                <button key={k} type="button" className="chip" aria-pressed={on}
                  onClick={() => setNeeds((n) => ({ ...n, [k]: k === 'colors' ? (on ? 'none' : 'unknown') : !on }))}>
                  {t(`need_${k}`)}
                </button>
              );
            })}
          </div>
          {JSON.stringify({ colors: 'none', ...needs }) !== JSON.stringify({ colors: 'none', ...(p.needs || {}) }) && (
            <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => {
              const next = profileFromNeeds(needs);
              next.audio.voiceURI = p.audio.voiceURI;
              dispatch({ type: 'SET_PROFILE', id: child.id, profile: next });
            }}>✨ {t('apply_needs')}</button>
          )}
        </div>
      </section>

      <div className="settings-grid">
        <section className="card stack">
          <h2>{t('display')}</h2>
          <ReadingPreview profile={p} />
          <Select id="font" label={t('font')} value={p.display.font} onChange={(v) => setP({ display: { font: v } })}
            options={[['lexend', 'Lexend / Noto Kufi'], ['verdana', 'Verdana / Tahoma'], ['system', t('font_system')]]} />
          <Range id="size" label={t('font_size')} value={p.display.fontSize} min={16} max={36} step={1} format={(v) => `${v} px`} onChange={(v) => setP({ display: { fontSize: v } })} />
          <Range id="ls" label={t('letter_spacing')} value={p.display.letterSpacing} min={0} max={0.25} step={0.01} format={em} onChange={(v) => setP({ display: { letterSpacing: v } })}
            note={t.lang === 'ar' ? t('arabic_spacing_note') : null} />
          <Range id="ws" label={t('word_spacing')} value={p.display.wordSpacing} min={0} max={0.6} step={0.05} format={em} onChange={(v) => setP({ display: { wordSpacing: v } })} />
          <Range id="lh" label={t('line_height')} value={p.display.lineHeight} min={1.2} max={2.2} step={0.1} format={(v) => v.toFixed(1)} onChange={(v) => setP({ display: { lineHeight: v } })} />
          <Range id="ll" label={t('line_length')} value={p.display.lineLength} min={30} max={80} step={5} format={(v) => t('chars', { n: v })} onChange={(v) => setP({ display: { lineLength: v } })} />
          <Select id="bg" label={t('background')} value={p.display.background} onChange={(v) => setP({ display: { background: v } })}
            options={['creme', 'peche', 'menthe', 'gris'].map((b) => [b, t(`bg_${b}`)])} />
          <Toggle label={t('reading_ruler')} checked={p.display.ruler} onChange={(v) => setP({ display: { ruler: v } })} />
          <Toggle label={t('simplified_default')} checked={p.text.simplified} onChange={(v) => setP({ text: { simplified: v } })} />
          <Toggle label={t('high_contrast')} checked={p.display.highContrast} onChange={(v) => setP({ display: { highContrast: v } })} />
          <Toggle label={t('big_targets')} checked={p.a11y?.bigTargets} onChange={(v) => setP({ a11y: { bigTargets: v } })} />
        </section>

        <section className="card stack">
          <h2>{t('voice_sound')}</h2>
          <Toggle label={t('narration_default')} checked={p.audio.narration} onChange={(v) => setP({ audio: { narration: v } })} />
          <Select id="hl" label={t('highlight')} value={p.audio.highlight} onChange={(v) => setP({ audio: { highlight: v } })}
            options={[['none', t('hl_none')], ['sentence', t('hl_sentence')], ['word', t('hl_word')]]} />
          <Range id="rate" label={t('voice_rate')} value={p.audio.rate} min={0.6} max={1.3} step={0.05} format={(v) => `× ${v.toFixed(2)}`} onChange={(v) => setP({ audio: { rate: v } })} />
          <Range id="vol" label={t('volume')} value={p.audio.volume} min={0} max={1} step={0.05} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setP({ audio: { volume: v } })} />
          <Select id="voice" label={t('narrator')} value={p.audio.voiceURI || ''} onChange={(v) => setP({ audio: { voiceURI: v || null } })}
            options={[['', t('voice_auto')], ...voices.map((v) => [v.voiceURI, `${v.name} (${v.lang})`])]} />
          {!voices.length && <span className="muted" style={{ fontSize: '0.9em' }}>{t('no_voice_settings', { lang: t(`lang_${t.lang}`) })}</span>}
          <Toggle label={t('silent_mode')} checked={p.audio.silent} onChange={(v) => setP({ audio: { silent: v } })} />
          <Toggle label={t('captions_always')} checked={p.audio.captions} onChange={(v) => setP({ audio: { captions: v } })} />
          <Toggle label={t('visual_equivalents')} checked={p.audio.visualEquivalents} onChange={(v) => setP({ audio: { visualEquivalents: v } })} />
        </section>

        <section className="card stack">
          <h2>{t('scene_settings')}</h2>
          <Select id="render" label={t('render_mode')} value={p.scene.renderMode} onChange={(v) => setP({ scene: { renderMode: v } })}
            options={[['3d', t('render_3d')], ['illustration', t('render_2d')]]} />
          <Select id="pal" label={t('palette')} value={p.scene.palette} onChange={(v) => setP({ scene: { palette: v } })}
            options={['standard', 'protanopie', 'deuteranopie', 'tritanopie', 'achromatopsie'].map((x) => [x, t(`pal_${x}`)])} />
          <Toggle label={t('child_correction')} checked={p.scene.correction} disabled={p.scene.palette === 'standard'} onChange={(v) => setP({ scene: { correction: v } })} />
          <span className="muted" style={{ fontSize: '0.85em', marginTop: -6 }}>{t('child_palette_ui')}</span>
          <Toggle label={t('shapes_extra')} checked={p.scene.shapes} onChange={(v) => setP({ scene: { shapes: v } })} />
          <Toggle label={t('focus_default')} checked={p.scene.focusMode} onChange={(v) => setP({ scene: { focusMode: v } })} />
          <Toggle label={t('single_motion')} checked={p.scene.singleMotion} onChange={(v) => setP({ scene: { singleMotion: v } })} />
          <Toggle label={t('reduced_motion')} checked={p.scene.reducedMotion} onChange={(v) => setP({ scene: { reducedMotion: v } })} />
          <Range id="split" label={t('text_share')} value={p.scene.split} min={0.25} max={0.75} step={0.05} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setP({ scene: { split: v } })} />
        </section>

        <section className="card stack">
          <h2>{t('time_pauses')}</h2>
          <Range id="smax" label={t('session_max')} value={r.sessionMaxMin} min={1} max={60} step={1} format={(v) => t('minutes', { n: v })} onChange={(v) => setR({ sessionMaxMin: v })} />
          <Range id="dmax" label={t('day_max')} value={r.dayMaxMin} min={5} max={120} step={5} format={(v) => t('minutes', { n: v })} onChange={(v) => setR({ dayMaxMin: v })} />
          <Toggle label={t('time_window')} checked={r.window.enabled} onChange={(v) => setR({ window: { enabled: v } })} />
          {r.window.enabled && (
            <div className="row">
              <div className="field"><label htmlFor="ws1">{t('from')}</label><input id="ws1" type="time" value={r.window.start} onChange={(e) => setR({ window: { start: e.target.value } })} /></div>
              <div className="field"><label htmlFor="ws2">{t('to')}</label><input id="ws2" type="time" value={r.window.end} onChange={(e) => setR({ window: { end: e.target.value } })} /></div>
            </div>
          )}
          {r.window.enabled && (
            <div className="row" role="group" aria-label={t('days_allowed')} style={{ gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                const days = r.window.days || [1, 2, 3, 4, 5, 6, 7];
                const on = days.includes(d);
                return (
                  <button key={d} type="button" className="chip" aria-pressed={on}
                    onClick={() => dispatch({ type: 'SET_RULES', id: child.id, rules: { ...r, window: { ...r.window, days: on ? days.filter((x) => x !== d) : [...days, d].sort() } } })}>
                    {t(`day_${d}`)}
                  </button>
                );
              })}
            </div>
          )}
          <Toggle label={t('pauses_enabled')} checked={p.pauses.enabled} onChange={(v) => setP({ pauses: { enabled: v } })} />
          {p.pauses.enabled && (
            <Range id="every" label={t('pause_every')} value={p.pauses.everyScenes} min={1} max={6} step={1} format={(v) => t('pages_n', { n: v })} onChange={(v) => setP({ pauses: { everyScenes: v } })} />
          )}
          <Range id="goal" label={t('weekly_goal')} value={r.weeklyGoalScenes} min={2} max={40} step={1} format={(v) => t('pages_n', { n: v })} onChange={(v) => setR({ weeklyGoalScenes: v })} />
        </section>

        <section className="card stack">
          <h2>{t('rewards')}</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>{t('rewards_principles')}</p>
          {r.rewards.map((rw, i) => (
            <div key={rw.id} className="row" style={{ alignItems: 'flex-end' }}>
              <div className="field" style={{ width: 90 }}>
                <label htmlFor={`rs${i}`}>⭐</label>
                <input id={`rs${i}`} type="number" min={1} max={500} value={rw.stars} onChange={(e) => setReward(i, { stars: Math.max(1, Number(e.target.value) || 1) })} />
              </div>
              <div className="field grow">
                <label htmlFor={`rl${i}`}>{t('reward_label')}</label>
                <input id={`rl${i}`} type="text" value={t.pick(rw.label)} onChange={(e) => setReward(i, { label: { [t.lang]: e.target.value } })} />
              </div>
              <button type="button" className="btn btn-small btn-danger" aria-label={t('remove')} onClick={() => removeReward(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-small" onClick={addReward} style={{ alignSelf: 'flex-start' }}>＋ {t('add_reward')}</button>
        </section>

        <section className="card stack">
          <h2>{t('rights')}</h2>
          <Toggle label={t('import_allowed')} checked={r.importAllowed} onChange={(v) => setR({ importAllowed: v })} note={t('coming_soon')} />
          <Toggle label={t('prompt_allowed')} checked={r.promptAllowed} onChange={(v) => setR({ promptAllowed: v })} note={t('coming_soon')} />
        </section>
      </div>
    </div>
  );
}
