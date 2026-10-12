/** Écran 2 — Choisir un livre : 3 à 6 choix au maximum, plus « Créer mon histoire » si le parent l'autorise. */
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { booksForChild } from '../data/library.js';
import { starsFor, scenesThisWeek, badgesFor, BADGES, sidiLevel } from '../engine/rewards.js';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { avatarOf } from '../components/ui.jsx';

export default function ChooseBook() {
  const { state, navigate, dispatch } = useStore();
  const child = useActiveChild();
  const t = useT();
  if (!child) return null;

  const stars = starsFor(state.rewardLog, child.id);
  const week = scenesThisWeek(state.rewardLog, child.id);
  const goal = child.rules.weeklyGoalScenes;
  const badges = badgesFor(state.rewardLog, child.id);
  const books = booksForChild(state, child); // 3 à 6 choix à la fois (6.2)
  const lvl = sidiLevel(stars);
  // petit gag récurrent de Sidi : il cherche sa chechia (une fois sur quatre)
  const greeting = new Date().getDate() % 4 === 0 ? 'chechia' : 'welcome';

  return (
    <main className="screen">
      <div className="topbar screen-wide">
        <div className="row">
          <span style={{ fontSize: 40 }} aria-hidden="true">{avatarOf(child.avatar).emoji}</span>
          <strong style={{ fontSize: '1.2em' }}>{child.nickname}</strong>
          <span className="badge-tag" aria-label={t('stars_aria', { n: stars })}>⭐ {stars}</span>
          {badges.map((b) => (
            <span key={b} className="badge-tag" title={t(`badge_${b}`)}>
              <span aria-hidden="true">{BADGES.find((x) => x.id === b)?.icon}</span>
              <span className="visually-hidden">{t(`badge_${b}`)}</span>
            </span>
          ))}
        </div>
        <button type="button" className="btn btn-small" onClick={() => { dispatch({ type: 'SELECT_CHILD', id: null }); navigate('who'); }}>
          {t('change_reader')}
        </button>
      </div>

      <div className="screen-wide stack">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <SidiHkeya line={greeting} level={lvl.level} />
          <span className="badge-tag level-badge" title={t('sidi_level_help')}>
            {t('sidi_level', { n: lvl.level })}{lvl.next ? ` · ${t('sidi_next', { n: lvl.toNext })}` : ''}
          </span>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div className="row">
            <strong>{t('weekly_goal')}</strong>
            <span className="muted">{t('weekly_goal_value', { n: Math.min(week, goal), goal })}</span>
          </div>
          <div className="hourglass-bar" style={{ width: '100%', height: 16, marginTop: 8 }} aria-hidden="true">
            <div className="hourglass-fill" style={{ width: `${Math.min(1, week / Math.max(1, goal)) * 100}%`, background: 'var(--orange)' }} />
          </div>
        </div>

        <h1>{t('choose_book')}</h1>
        <div className="book-grid">
          {books.map((b) => {
            const mark = child.bookmarks?.[b.id];
            const resume = mark && mark > 0 && mark < b.scenes.length;
            return (
              <button key={b.id} type="button" className="book-card" onClick={() => navigate('ready', { bookId: b.id })}>
                <div className="book-cover" aria-hidden="true">
                  {b.coverImg ? <img src={b.coverImg} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} /> : b.cover}
                </div>
                <div className="book-body">
                  <span className="book-title">{t.pick(b.title)}</span>
                  <span className="muted">{t.pick(b.summary)}</span>
                  <span className="row" style={{ gap: 6 }}>
                    <span className="badge-tag">⏱ {t('minutes', { n: b.durationMin })}</span>
                    <span className="badge-tag">{b.type === 'edu' ? `🔬 ${t('book_edu')}` : `📄 ${t('pages_n', { n: b.scenes.length })}`}</span>
                    {b.type === 'import' && <span className="badge-tag">📥 {t('book_family')}</span>}
                    {resume && <span className="badge-tag">🔖 {t('resume_page', { n: mark + 1 })}</span>}
                  </span>
                </div>
              </button>
            );
          })}
          {child.rules.promptAllowed && (
            <button type="button" className="book-card" disabled aria-describedby="soon-create">
              <div className="book-cover" aria-hidden="true">✨</div>
              <div className="book-body">
                <span className="book-title">{t('create_story')}</span>
                <span id="soon-create" className="badge-tag soon">{t('coming_soon')}</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
