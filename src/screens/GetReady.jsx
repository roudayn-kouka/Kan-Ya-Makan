/**
 * Écran 3 — On se prépare : aperçu de la scène (qui et où), objectif du jour, mode.
 * Deux façons d'entrer dans l'histoire :
 *  - 🎬 Regarder : le FILM 3D continu de toute l'histoire (voix + sous-titres) ;
 *  - 📖 Lire page par page, en combinant Lire / Écouter / Regarder.
 * Livre éducatif : parcours Lire → Explorer → Animer → Explique-moi → Quiz.
 */
import { useState } from 'react';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useBook } from '../data/library.js';
import { CENDRILLON } from '../data/cendrillon.js';
import { badgesFor } from '../engine/rewards.js';
import { buildTimeline, textLang } from '../engine/film.js';
import SceneView from '../components/Scene3D.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';

export default function GetReady({ params }) {
  const { state, navigate, dispatch, uid } = useStore();
  const child = useActiveChild();
  const t = useT();
  const book = useBook(params.bookId) || CENDRILLON;
  const mark = child?.bookmarks?.[book.id] || 0;
  const canResume = mark > 0 && mark < book.scenes.length;
  const isEdu = book.type === 'edu';

  const [fromStart, setFromStart] = useState(!canResume);
  const [goal, setGoal] = useState('all');
  const [modes, setModes] = useState(() => ({
    read: true,
    listen: Boolean(child?.profile.audio.narration),
    watch: true,
  }));

  if (!child) return null;
  const startScene = fromStart ? 0 : mark;
  const scene = book.scenes[startScene];
  const who = scene.characters.map((c) => t.pick(book.characters?.[c.id]?.name)).filter(Boolean).join(', ');
  const filmMin = book.video
    ? Math.max(1, Math.round((book.video.duration - (scene.clip?.[0] || 0)) / 60))
    : Math.max(1, Math.round(buildTimeline(book, { lang: textLang(book, t.lang), from: startScene, rate: child.profile.audio.rate }).total / 60));

  const toggle = (m) => setModes((cur) => {
    const next = { ...cur, [m]: !cur[m] };
    return next.read || next.listen || next.watch ? next : cur; // au moins un mode
  });

  const start = (kind) => {
    const film = kind === 'film' || (kind === 'read' && !modes.read && !modes.listen && modes.watch);
    const session = {
      id: uid('ses'),
      childId: child.id,
      bookId: book.id,
      start: new Date().toISOString(),
      startScene,
      goal,
      modes: film ? { watch: true, listen: true, film: true } : modes,
      badgesAtStart: badgesFor(state.rewardLog, child.id),
      rewardCountAtStart: state.rewardLog.length,
      pendingAtStart: state.pendingRewards.length,
    };
    dispatch({ type: 'START_SESSION', session });
    navigate(isEdu ? 'explore' : film ? 'film' : 'reader', { sessionId: session.id });
  };

  return (
    <main className="screen">
      <div className="topbar screen-wide">
        <button type="button" className="btn btn-small" onClick={() => navigate('choose')}>← {t('back')}</button>
        <strong>{t.pick(book.title)}</strong>
        <span />
      </div>

      <div className="screen-wide" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative', minHeight: 300 }}>
          {isEdu || scene.poster ? (
            book.coverImg || scene.poster
              ? <img src={scene.poster || book.coverImg} alt={t.pick(scene.where)} style={{ width: '100%', height: '100%', minHeight: 300, objectFit: 'cover', display: 'block' }} />
              : <div style={{ display: 'grid', placeItems: 'center', height: '100%', minHeight: 300, fontSize: 110 }} aria-hidden="true">{book.cover}</div>
          ) : (
            <div style={{ position: 'absolute', inset: 0 }}>
              <SceneView scene={scene} profile={child.profile} interactive={false} showPlay={false} />
            </div>
          )}
        </div>

        <div className="stack">
          {isEdu
            ? <SidiHkeya text={t('edu_preview', { steps: book.scenes.map((s) => t.pick(s.where)).join(', ') })} />
            : <SidiHkeya text={who ? t('ready_preview', { who, where: t.pick(scene.where) }) : t('ready_preview_where', { where: t.pick(scene.where) })} />}

          {canResume && (
            <div className="stack">
              <strong>{t('where_start')}</strong>
              <div className="row">
                <button type="button" className="chip" aria-pressed={!fromStart} onClick={() => setFromStart(false)}>🔖 {t('resume_page', { n: mark + 1 })}</button>
                <button type="button" className="chip" aria-pressed={fromStart} onClick={() => setFromStart(true)}>↺ {t('from_start')}</button>
              </div>
            </div>
          )}

          {!isEdu && (
            <div className="stack">
              <strong>{t('goal_today')}</strong>
              <div className="row">
                <button type="button" className="chip" aria-pressed={goal === '2'} onClick={() => setGoal('2')}>{t('goal_two_pages')}</button>
                <button type="button" className="chip" aria-pressed={goal === 'all'} onClick={() => setGoal('all')}>{t('goal_whole')}</button>
              </div>
            </div>
          )}

          {isEdu ? (
            <button type="button" className="btn btn-primary" onClick={() => start('edu')} style={{ alignSelf: 'flex-start' }}>🔬 {t('start')}</button>
          ) : (
            <div className="film-choice">
              <div className="card stack" style={{ gap: 8 }}>
                <strong>🎬 {t('watch_film')}</strong>
                <span className="muted" style={{ fontSize: '0.9em' }}>{t(book.video ? 'watch_video_desc' : 'watch_film_desc', { min: filmMin })}</span>
                <button type="button" className="btn btn-primary" onClick={() => start('film')}>▶ {t('film_play')}</button>
              </div>
              <div className="card stack" style={{ gap: 8 }}>
                <strong>📖 {t('read_pages')}</strong>
                <div className="row" style={{ gap: 6 }}>
                  <button type="button" className="chip" aria-pressed={modes.read} onClick={() => toggle('read')}>📖 {t('mode_read')}</button>
                  <button type="button" className="chip" aria-pressed={modes.listen} onClick={() => toggle('listen')}>🎧 {t('mode_listen')}</button>
                  <button type="button" className="chip" aria-pressed={modes.watch} onClick={() => toggle('watch')}>🎬 {t('mode_watch')}</button>
                </div>
                <span className="muted" style={{ fontSize: '0.85em' }}>{t('modes_combinable')}</span>
                <button type="button" className="btn" onClick={() => start('read')}>▶ {t('start')}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
