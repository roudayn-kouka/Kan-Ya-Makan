/**
 * Écran 7 — Histoire terminée (ou fin de séance) :
 * questions, découvertes, étoiles, badges, coffre à ouvrir si une récompense réelle
 * attend le parent, Sidi Hkeya qui évolue, au revoir… puis une activité HORS ÉCRAN
 * liée à ce qui vient d'être lu (6.10, 6.13 F), que le parent pourra confirmer.
 */
import { useEffect, useRef, useState } from 'react';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useBook } from '../data/library.js';
import { GENERIC_OFFLINE } from '../data/offline.js';
import { badgesFor, BADGES, starsFor, sidiLevel } from '../engine/rewards.js';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { QuestionCard } from '../components/ui.jsx';

const LINES = { finished: 'bravo', limit: 'bye', goal: 'goal', quit: 'bye' };

export default function Finished({ params }) {
  const { state, dispatch, navigate, reward, log, uid } = useStore();
  const child = useActiveChild();
  const t = useT();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const book = useBook(session?.bookId);
  const [chestOpen, setChestOpen] = useState(false);
  const proposed = useRef(false);

  const reason = params.reason;
  // Activité hors écran : proposée quand l'histoire est finie ou que le temps d'écran est terminé
  const offlineText = book ? (book.offline?.[(session?.id?.length || 0) % (book.offline?.length || 1)] || GENERIC_OFFLINE) : null;
  const offerOffline = reason !== 'quit';

  useEffect(() => {
    if (!child || !session || !offerOffline || proposed.current || !offlineText) return;
    proposed.current = true;
    const already = (state.offline || []).some((o) => o.sessionId === session.id);
    if (!already) {
      dispatch({ type: 'ADD_OFFLINE', item: { id: uid('off'), childId: child.id, sessionId: session.id, bookId: book.id, kind: 'book', text: offlineText, emoji: '🌿', status: 'proposed', at: new Date().toISOString() } });
    }
  }, [child, session, offerOffline, offlineText, book, state.offline, dispatch, uid]);

  if (!child || !session || !book) return null;

  const events = state.rewardLog.slice(session.rewardCountAtStart || 0).filter((e) => e.childId === child.id);
  const starsEarned = events.reduce((n, e) => n + e.stars, 0);
  const newBadges = badgesFor(state.rewardLog, child.id).filter((b) => !(session.badgesAtStart || []).includes(b));
  const discovered = [...new Set(
    state.interactions.filter((i) => i.sessionId === session.id && i.type === 'character').map((i) => i.value),
  )];
  const newPending = state.pendingRewards.slice(session.pendingAtStart || 0).filter((r) => r.childId === child.id);
  const lvl = sidiLevel(starsFor(state.rewardLog, child.id));
  const levelBefore = sidiLevel(starsFor(state.rewardLog, child.id) - starsEarned).level;

  const title = {
    finished: t('story_finished'),
    limit: t('see_you_tomorrow'),
    goal: t('goal_done'),
    quit: t('see_you_soon'),
  }[reason];

  const bye = () => {
    dispatch({ type: 'SELECT_CHILD', id: null });
    navigate('who');
  };

  return (
    <main className="screen">
      <div className="screen-narrow stack">
        <SidiHkeya line={LINES[reason] || 'bye'} size={110} level={lvl.level} />
        <h1>{title}</h1>
        {(reason === 'limit' || reason === 'quit' || reason === 'goal') && <p>{t('progress_saved')}</p>}

        {reason === 'finished' && book.finalQuestions?.length > 0 && (
          <div className="card stack">
            <h2 style={{ fontSize: '1.2em' }}>{t('little_questions')}</h2>
            {book.finalQuestions.slice(0, 3).map((q, i) => (
              <QuestionCard
                key={i}
                question={q}
                onAnswer={({ correct, firstTry }) => {
                  log(child.id, session.id, 'quiz', `final_${i}`, { correct, firstTry, listen: Boolean(session.modes?.listen || session.modes?.film) });
                  if (correct) reward(child.id, 'quiz_correct', { final: i });
                }}
              />
            ))}
          </div>
        )}

        <div className="card stack">
          <div className="row">
            <span style={{ fontSize: 34 }} aria-hidden="true">⭐</span>
            <strong style={{ fontSize: '1.3em' }}>{t('stars_earned', { n: starsEarned })}</strong>
          </div>
          {lvl.level > levelBefore && <p>🎉 {t('sidi_grew', { n: lvl.level })}</p>}
          {discovered.length > 0 && (
            <p>
              💭 {t('discoveries', {
                names: discovered.map((id) => t.pick(book.characters?.[id]?.name)).join(', '),
              })}
            </p>
          )}
          {newBadges.map((b) => (
            <div key={b} className="row">
              <span style={{ fontSize: 32 }} aria-hidden="true">{BADGES.find((x) => x.id === b)?.icon}</span>
              <span><strong>{t('new_badge')}</strong> {t(`badge_${b}`)}</span>
            </div>
          ))}
          {newPending.length > 0 && (
            <div className="row">
              <button type="button" className={`chest ${chestOpen ? 'chest-open' : ''}`} aria-expanded={chestOpen} aria-label={t('open_chest')} onClick={() => setChestOpen(true)}>
                {chestOpen ? '🎁' : '🧰'}
              </button>
              <span>
                {chestOpen
                  ? newPending.map((r) => <span key={r.id}>{t('reward_waiting', { label: t.pick(r.label) })} </span>)
                  : t('chest_hint')}
              </span>
            </div>
          )}
        </div>

        {offerOffline && offlineText && (
          <div className="card stack" style={{ borderColor: 'var(--orange-deep)' }}>
            <strong>🌿 {t('offline_now')}</strong>
            <p style={{ margin: 0, fontSize: '1.1em' }}>{t.pick(offlineText)}</p>
            <span className="muted" style={{ fontSize: '0.88em' }}>{t('offline_parent_confirms')}</span>
          </div>
        )}

        <button type="button" className="btn btn-primary" onClick={bye} style={{ alignSelf: 'center' }}>
          👋 {t('goodbye')}
        </button>
      </div>
    </main>
  );
}
