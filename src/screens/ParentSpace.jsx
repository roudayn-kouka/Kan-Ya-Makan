/** Écran 8 — Espace parent : vue famille, suivi d'un enfant, réglages, récompenses, données. */
import { useMemo, useState } from 'react';
import { useStore, useResetDemo, useWipeAll, DEMO_MODE } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { starsFor, badgesFor, BADGES, scenesThisWeek } from '../engine/rewards.js';
import { childStats, observations, weeklySuggestion } from '../engine/observations.js';
import { daySeconds } from '../engine/timeRules.js';
import { deepMerge } from '../data/presets.js';
import { hashCode } from '../engine/hash.js';
import { CATALOGUE, findBook } from '../data/library.js';
import { FAMILY_CHALLENGES } from '../data/offline.js';
import ChildSettings from './ChildSettings.jsx';
import { LangToggle, avatarOf } from '../components/ui.jsx';

const TABS = ['family', 'child', 'settings', 'books', 'rewards', 'data'];

function Kpi({ value, label }) {
  return (
    <div className="kpi">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function Bar({ ratio, label }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <span style={{ fontSize: '0.9em' }}>{label}</span>
      <div className="hourglass-bar" style={{ width: '100%', height: 12 }} aria-hidden="true">
        <div className="hourglass-fill" style={{ width: `${Math.min(1, ratio) * 100}%` }} />
      </div>
    </div>
  );
}

/* ---------------- Vue famille ---------------- */
function FamilyTab({ go }) {
  const { state, navigate } = useStore();
  const t = useT();
  return (
    <div className="stack" style={{ width: '100%' }}>
      <div className="kpi-grid">
        {state.children.map((c) => {
          const today = Math.round(daySeconds(state.dailyTime, c.id) / 60);
          const pending = state.pendingRewards.filter((r) => r.childId === c.id && r.status === 'pending').length;
          const mark = c.bookmarks?.[CATALOGUE[0].id] || 0;
          return (
            <div key={c.id} className="card stack">
              <div className="row">
                <span style={{ fontSize: 40 }} aria-hidden="true">{avatarOf(c.avatar).emoji}</span>
                <div>
                  <strong style={{ fontSize: '1.15em' }}>{c.nickname}</strong>
                  <div className="muted" style={{ fontSize: '0.88em' }}>{t(`preset_${c.profile.preset}`)} · {t('years', { range: c.ageRange })}</div>
                </div>
              </div>
              <Bar ratio={today / c.rules.dayMaxMin} label={t('today_time', { n: today, max: c.rules.dayMaxMin })} />
              <div className="row" style={{ gap: 8 }}>
                <span className="badge-tag">⭐ {starsFor(state.rewardLog, c.id)}</span>
                <span className="badge-tag">📄 {t('week_pages', { n: scenesThisWeek(state.rewardLog, c.id), goal: c.rules.weeklyGoalScenes })}</span>
                {mark > 0 && <span className="badge-tag">🔖 {t('resume_page', { n: mark + 1 })}</span>}
                {pending > 0 && <span className="badge-tag">🎁 {t('pending_n', { n: pending })}</span>}
              </div>
              <div className="row">
                <button type="button" className="btn btn-small" onClick={() => go('child', c.id)}>{t('see_progress')}</button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => go('settings', c.id)}>⚙️ {t('tab_settings')}</button>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('add_child')}>＋ {t('add_child')}</button>
      <OfflineSection />
    </div>
  );
}

/* ---------------- Suivi d'un enfant ---------------- */
function ChildTab({ child }) {
  const { state, dispatch } = useStore();
  const t = useT();
  const [applied, setApplied] = useState([]);
  const sessions = state.sessions.filter((s) => s.childId === child.id);
  const inter = state.interactions.filter((i) => i.childId === child.id);
  const stats = useMemo(() => childStats({ sessions, interactions: inter }), [sessions, inter]);
  const obs = useMemo(() => observations({ child, sessions, interactions: inter }), [child, sessions, inter]);
  const weekly = weeklySuggestion(obs);
  const badges = badgesFor(state.rewardLog, child.id);
  const today = Math.round(daySeconds(state.dailyTime, child.id) / 60);

  const apply = (o) => {
    dispatch({ type: 'SET_PROFILE', id: child.id, profile: deepMerge(child.profile, o.patch) });
    setApplied((a) => [...a, o.key]);
  };

  const totalModes = Math.max(1, stats.pages);

  return (
    <div className="stack" style={{ width: '100%' }}>
      {weekly && !applied.includes(weekly.key) && (
        <div className="card stack" style={{ borderColor: 'var(--orange)' }}>
          <strong>💡 {t('weekly_suggestion')}</strong>
          <p style={{ margin: 0 }}>{t(weekly.key, weekly.params)}</p>
          <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => apply(weekly)}>{t('apply_setting')}</button>
        </div>
      )}

      <div className="kpi-grid">
        <Kpi value={`${today} / ${child.rules.dayMaxMin}`} label={t('kpi_today')} />
        <Kpi value={stats.sessions} label={t('kpi_sessions')} />
        <Kpi value={t('minutes', { n: stats.totalMin })} label={t('kpi_total')} />
        <Kpi value={stats.pages} label={t('kpi_pages')} />
        <Kpi value={`${stats.avgPageSec} s`} label={t('kpi_page_time')} />
        <Kpi value={stats.quizCorrectRate == null ? '—' : `${stats.quizCorrectRate} %`} label={t('kpi_quiz')} />
        <Kpi value={`${stats.pausesTaken} / ${stats.pausesSkipped}`} label={t('kpi_pauses')} />
        <Kpi value={starsFor(state.rewardLog, child.id)} label={t('kpi_stars')} />
      </div>

      <div className="settings-grid">
        <section className="card stack">
          <h2>{t('observations')}</h2>
          <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>{t('not_diagnosis')}</p>
          {obs.map((o) => (
            <div key={o.key} className="obs stack" style={{ gap: 6 }}>
              <span>{t(o.key, o.params)}</span>
              {o.patch && (applied.includes(o.key)
                ? <span className="badge-tag">✓ {t('applied')}</span>
                : <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => apply(o)}>{t('apply_setting')}</button>)}
            </div>
          ))}
        </section>

        <section className="card stack">
          <h2>{t('modes_used')}</h2>
          <Bar ratio={stats.modeUse.read / totalModes} label={`📖 ${t('mode_read')} — ${stats.modeUse.read}`} />
          <Bar ratio={stats.modeUse.listen / totalModes} label={`🎧 ${t('mode_listen')} — ${stats.modeUse.listen}`} />
          <Bar ratio={stats.modeUse.watch / totalModes} label={`🎬 ${t('mode_watch')} — ${stats.modeUse.watch}`} />
          <h3 style={{ marginTop: 12 }}>{t('words_to_practice')}</h3>
          {stats.topWords.length ? (
            <div className="row" style={{ gap: 6 }}>
              {stats.topWords.map(([w, n]) => <span key={w} className="badge-tag">{w} × {n}</span>)}
            </div>
          ) : <span className="muted">{t('none_yet')}</span>}
          <p className="muted" style={{ margin: 0 }}>{t('help_counts', { s: stats.sentencesExplained, c: stats.charactersExplored })}</p>
        </section>

        <section className="card stack">
          <h2>{t('badges')}</h2>
          {BADGES.map((b) => (
            <div key={b.id} className="row" style={{ opacity: badges.includes(b.id) ? 1 : 0.45 }}>
              <span style={{ fontSize: 26 }} aria-hidden="true">{b.icon}</span>
              <span>{t(`badge_${b.id}`)} {badges.includes(b.id) ? '✓' : `(${t('not_yet')})`}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="card stack">
        <h2>{t('last_sessions')}</h2>
        {sessions.length ? (
          <table className="simple">
            <thead><tr><th>{t('date')}</th><th>{t('duration')}</th><th>{t('kpi_pages')}</th><th>{t('end')}</th></tr></thead>
            <tbody>
              {sessions.slice(-8).reverse().map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.start).toLocaleString(t.lang === 'ar' ? 'ar-TN' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{s.end ? t('minutes', { n: Math.max(1, Math.round((new Date(s.end) - new Date(s.start)) / 60000)) }) : '…'}</td>
                  <td>{s.pagesDone ?? '…'}</td>
                  <td>{s.endReason ? t(`end_${s.endReason}`) : t('in_progress')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <span className="muted">{t('none_yet')}</span>}
      </section>
    </div>
  );
}

/* ---------------- Récompenses ---------------- */
/* ---------------- Hors écran : activités proposées et défis en famille (6.10) ---------------- */
function OfflineSection() {
  const { state, dispatch, reward, uid } = useStore();
  const t = useT();
  const [who, setWho] = useState(state.children[0]?.id);
  const nameOf = (id) => state.children.find((c) => c.id === id)?.nickname || '?';
  const open = (state.offline || []).filter((o) => o.status === 'proposed');
  const done = (state.offline || []).filter((o) => o.status === 'done');
  const weekAgo = Date.now() - 7 * 864e5;

  const markDone = (o) => {
    dispatch({ type: 'OFFLINE_DONE', id: o.id });
    reward(o.childId, 'offline_done', { offline: o.id, kind: o.kind });
  };
  const launch = (c) => {
    if (!who) return;
    dispatch({ type: 'ADD_OFFLINE', item: { id: uid('off'), childId: who, kind: 'challenge', text: c.text, emoji: c.emoji, status: 'proposed', at: new Date().toISOString() } });
  };

  return (
    <div className="settings-grid">
      <section className="card stack">
        <h2>🌿 {t('offline_title')}</h2>
        <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>{t('offline_help')}</p>
        {open.length ? open.map((o) => (
          <div key={o.id} className="obs stack" style={{ gap: 6 }}>
            <span><strong>{nameOf(o.childId)}</strong> — {o.emoji || '🌿'} {t.pick(o.text)}</span>
            <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => markDone(o)}>✓ {t('offline_mark_done')}</button>
          </div>
        )) : <span className="muted">{t('none_yet')}</span>}
        {done.length > 0 && <span className="muted">✓ {t('offline_done_n', { n: done.length })}</span>}
      </section>
      <section className="card stack">
        <h2>👨‍👩‍👧 {t('family_challenges')}</h2>
        {state.children.length > 1 && (
          <div className="row">
            {state.children.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={who === c.id} onClick={() => setWho(c.id)}>{avatarOf(c.avatar).emoji} {c.nickname}</button>
            ))}
          </div>
        )}
        {FAMILY_CHALLENGES.map((c) => (
          <div key={c.id} className="row">
            <span className="grow">{c.emoji} {t.pick(c.text)}</span>
            <button type="button" className="btn btn-small" onClick={() => launch(c)}>{t('launch')}</button>
          </div>
        ))}
      </section>
      <section className="card stack">
        <h2>⚖️ {t('balance_title')}</h2>
        {state.children.map((c) => {
          const readMin = Math.round(state.sessions.filter((x) => x.childId === c.id && new Date(x.start) > weekAgo && x.end)
            .reduce((n, x) => n + (new Date(x.end) - new Date(x.start)), 0) / 60000);
          const pauses = state.interactions.filter((i) => i.childId === c.id && i.type === 'pause' && i.value === 'taken' && new Date(i.at) > weekAgo).length;
          const real = done.filter((o) => o.childId === c.id && new Date(o.doneAt) > weekAgo).length;
          return (
            <div key={c.id} className="stack" style={{ gap: 4 }}>
              <strong>{avatarOf(c.avatar).emoji} {c.nickname}</strong>
              <span>📖 {t('minutes', { n: readMin })} · 🧘 {t('pauses_n', { n: pauses })} · 🌿 {t('activities_n', { n: real })}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}

/* ---------------- Livres : catalogue, imports, approbation, signalement ---------------- */
function BooksTab() {
  const { state, dispatch, navigate, uid } = useStore();
  const t = useT();
  const [reported, setReported] = useState(null);
  const report = (b) => {
    const why = window.prompt(t('report_prompt', { title: t.pick(b.title) }));
    if (!why) return;
    dispatch({ type: 'ADD_REPORT', report: { id: uid('sig'), bookId: b.id, text: why.slice(0, 500), at: new Date().toISOString() } });
    setReported(b.id);
  };
  const imported = state.books || [];
  const nameOf = (id) => state.children.find((c) => c.id === id)?.nickname;
  return (
    <div className="stack" style={{ width: '100%' }}>
      <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('import_book')}>＋ {t('add_book')}</button>
      {reported && <p className="banner" role="status">✓ {t('report_sent')}</p>}
      <div className="settings-grid">
        <section className="card stack">
          <h2>📚 {t('catalogue')}</h2>
          {CATALOGUE.map((b) => (
            <div key={b.id} className="row">
              <span style={{ fontSize: 28 }} aria-hidden="true">{b.cover}</span>
              <span className="grow"><strong>{t.pick(b.title)}</strong><br /><span className="muted" style={{ fontSize: '0.88em' }}>{b.type === 'edu' ? t('book_edu') : t('book_story')} · {t('years', { range: b.ageRange })}</span></span>
              <button type="button" className="btn btn-small btn-ghost" onClick={() => report(b)}>⚑ {t('report')}</button>
            </div>
          ))}
        </section>
        <section className="card stack">
          <h2>📥 {t('imported_books')}</h2>
          {imported.length ? imported.map((b) => (
            <div key={b.id} className="stack" style={{ gap: 6, borderBottom: '1px solid var(--ligne)', paddingBottom: 10 }}>
              <div className="row">
                <span style={{ fontSize: 26 }} aria-hidden="true">{b.cover}</span>
                <strong className="grow">{t.pick(b.title)}</strong>
                <span className="badge-tag">{b.status === 'approved' ? `✓ ${t('status_approved')}` : `⏳ ${t('status_pending')}`}</span>
              </div>
              <span className="muted" style={{ fontSize: '0.88em' }}>
                {t('pages_n', { n: b.scenes.length })} · {t(`level_${b.level.level}`)} · {b.childIds.map(nameOf).filter(Boolean).join(', ')}
              </span>
              {b.warnings?.length > 0 && <span className="banner">⚠ {t('import_warnings', { words: b.warnings.join(', ') })}</span>}
              <div className="row">
                {b.status !== 'approved'
                  ? <button type="button" className="btn btn-small" onClick={() => dispatch({ type: 'UPDATE_BOOK', id: b.id, patch: { status: 'approved', approvedAt: new Date().toISOString() } })}>✓ {t('approve_publish')}</button>
                  : <button type="button" className="btn btn-small" onClick={() => dispatch({ type: 'UPDATE_BOOK', id: b.id, patch: { status: 'pending' } })}>{t('unpublish')}</button>}
                <button type="button" className="btn btn-small btn-danger" onClick={() => window.confirm(t('delete_book_confirm')) && dispatch({ type: 'DELETE_BOOK', id: b.id })}>🗑 {t('remove')}</button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => report(b)}>⚑ {t('report')}</button>
              </div>
            </div>
          )) : <span className="muted">{t('none_yet')}</span>}
        </section>
        {(state.reports || []).length > 0 && (
          <section className="card stack">
            <h2>⚑ {t('reports')}</h2>
            {state.reports.slice(-10).reverse().map((r) => (
              <span key={r.id} className="muted">{t.pick(findBook(state, r.bookId)?.title) || r.bookId} — « {r.text} »</span>
            ))}
            <span className="muted" style={{ fontSize: '0.85em' }}>{t('reports_note')}</span>
          </section>
        )}
      </div>
    </div>
  );
}

function RewardsTab() {
  const { state, dispatch } = useStore();
  const t = useT();
  const nameOf = (id) => state.children.find((c) => c.id === id)?.nickname || '?';
  const pending = state.pendingRewards.filter((r) => r.status === 'pending');
  const done = state.pendingRewards.filter((r) => r.status === 'validated');
  return (
    <div className="settings-grid">
      <section className="card stack">
        <h2>🎁 {t('rewards_pending')}</h2>
        {pending.length ? pending.map((r) => (
          <div key={r.id} className="row">
            <span className="grow">{nameOf(r.childId)} — {t.pick(r.label)} ({r.stars} ⭐)</span>
            <button type="button" className="btn btn-small" onClick={() => dispatch({ type: 'VALIDATE_REWARD', id: r.id })}>✓ {t('validate')}</button>
          </div>
        )) : <span className="muted">{t('none_yet')}</span>}
        {done.length > 0 && (
          <>
            <h3>{t('rewards_given')}</h3>
            {done.map((r) => <span key={r.id} className="muted">✓ {nameOf(r.childId)} — {t.pick(r.label)}</span>)}
          </>
        )}
      </section>
      <section className="card stack">
        <h2>{t('journal')}</h2>
        <p className="muted" style={{ margin: 0, fontSize: '0.9em' }}>{t('journal_note')}</p>
        <table className="simple">
          <tbody>
            {state.rewardLog.slice(-25).reverse().map((e) => (
              <tr key={e.id}>
                <td>{nameOf(e.childId)}</td>
                <td>{t(`ev_${e.type}`)}</td>
                <td>{e.stars ? `+${e.stars} ⭐` : ''}</td>
                <td className="muted">{new Date(e.at).toLocaleTimeString(t.lang === 'ar' ? 'ar-TN' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------------- Données et confidentialité ---------------- */
function DataTab({ child }) {
  const { state, dispatch, navigate } = useStore();
  const t = useT();
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, reset] = useResetDemo();
  const wipe = useWipeAll();

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      child: { ...child, codeHash: undefined, demoCode: undefined },
      sessions: state.sessions.filter((s) => s.childId === child.id),
      interactions: state.interactions.filter((i) => i.childId === child.id),
      rewards: state.rewardLog.filter((e) => e.childId === child.id),
      pendingRewards: state.pendingRewards.filter((r) => r.childId === child.id),
      dailyTime: state.dailyTime[child.id] || {},
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kan-ya-makan-${child.nickname}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const remove = () => {
    if (window.confirm(t('delete_confirm', { name: child.nickname }))) {
      dispatch({ type: 'DELETE_CHILD', id: child.id });
      navigate('parent', { tab: 'family' });
    }
  };

  const changePin = async () => {
    if (!/^\d{4}$/.test(pin)) return setMsg(t('pin_format'));
    dispatch({ type: 'SET_PARENT_CODE', hash: await hashCode(`parent:${pin}`) });
    setPin('');
    setMsg(t('pin_changed'));
  };

  return (
    <div className="settings-grid">
      <section className="card stack">
        <h2>🔒 {t('privacy_title')}</h2>
        <p style={{ margin: 0 }}>{t('privacy_text')}</p>
        <ul style={{ margin: 0, paddingInlineStart: 20 }}>
          <li>{t('privacy_1')}</li>
          <li>{t('privacy_2')}</li>
          <li>{t('privacy_3')}</li>
          <li>{t('privacy_4')}</li>
        </ul>
      </section>
      <section className="card stack">
        <h2>{t('data_of', { name: child.nickname })}</h2>
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={exportData}>⬇ {t('export_data')}</button>
        <button type="button" className="btn btn-small btn-danger" style={{ alignSelf: 'flex-start' }} onClick={remove}>🗑 {t('delete_child')}</button>
      </section>
      <section className="card stack">
        <h2>{t('parent_code')}</h2>
        <div className="field">
          <label htmlFor="newpin">{t('new_code')}</label>
          <input id="newpin" type="text" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} autoComplete="off" />
        </div>
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={changePin}>{t('save')}</button>
        <span role="status">{msg}</span>
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => dispatch({ type: 'LOGOUT' })}>🚪 {t('logout')}</button>
          <button type="button" className="btn btn-small btn-danger" onClick={() => window.confirm(t('delete_account_confirm')) && wipe()}>🗑 {t('delete_account')}</button>
        </div>
        {DEMO_MODE && (
          <button type="button" className="btn btn-small btn-ghost" style={{ alignSelf: 'flex-start' }} disabled={busy} onClick={() => window.confirm(t('reset_confirm')) && reset()}>
            ↺ {t('reset_demo')}
          </button>
        )}
      </section>
    </div>
  );
}

/* ---------------- Conteneur ---------------- */
export default function ParentSpace({ params }) {
  const { state, navigate } = useStore();
  const t = useT();
  const tab = TABS.includes(params.tab) ? params.tab : 'family';
  const childId = params.childId && state.children.some((c) => c.id === params.childId)
    ? params.childId
    : state.children[0]?.id;
  const child = state.children.find((c) => c.id === childId);
  const go = (nextTab, id = childId) => navigate('parent', { tab: nextTab, childId: id });
  const needsChild = ['child', 'settings', 'data'].includes(tab);

  return (
    <main className="screen">
      <div className="topbar screen-wide">
        <div className="row">
          <img src="./logo_kan_ya_makan.png" alt="Kan Ya Makan" className="logo-img small" />
          <h1 style={{ margin: 0, fontSize: '1.4em' }}>{t('parent_space')}</h1>
        </div>
        <div className="row">
          <button type="button" className="btn btn-small" onClick={() => navigate('vision', { back: 'parent', backParams: params })}>♿ {t('colors_comfort')}</button>
          <LangToggle />
          <button type="button" className="btn btn-small" onClick={() => navigate('who')}>🔓 {t('leave_parent')}</button>
        </div>
      </div>

      <div className="screen-wide stack">
        <div className="tabs" role="tablist">
          {TABS.map((id) => (
            <button key={id} type="button" role="tab" className="tab" aria-selected={tab === id} onClick={() => go(id)}>
              {t(`tab_${id}`)}
            </button>
          ))}
        </div>

        {needsChild && state.children.length > 1 && (
          <div className="row" role="group" aria-label={t('choose_child')}>
            {state.children.map((c) => (
              <button key={c.id} type="button" className="chip" aria-pressed={c.id === childId} onClick={() => go(tab, c.id)}>
                {avatarOf(c.avatar).emoji} {c.nickname}
              </button>
            ))}
          </div>
        )}

        {tab === 'family' && <FamilyTab go={go} />}
        {tab === 'books' && <BooksTab />}
        {tab === 'rewards' && <RewardsTab />}
        {needsChild && !child && <p className="muted">{t('no_children')}</p>}
        {tab === 'child' && child && <ChildTab child={child} />}
        {tab === 'settings' && child && params.fromNeeds && (
          <div className="card stack" style={{ borderColor: 'var(--orange-deep)' }}>
            <strong>✨ {t('from_needs_title', { name: child.nickname })}</strong>
            <span>{t('from_needs_text')}</span>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={() => navigate('who')}>{t('ready_who')} →</button>
              <button type="button" className="btn" onClick={() => navigate('profile_test', { childId: child.id })}>🧭 {t('do_profile_test')}</button>
            </div>
          </div>
        )}
        {tab === 'settings' && child && <ChildSettings child={child} />}
        {tab === 'data' && child && <DataTab child={child} />}
      </div>
    </main>
  );
}
