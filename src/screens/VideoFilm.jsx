/**
 * Mode Regarder pour un livre qui a une VRAIE vidéo (Cendrillon) :
 * la vidéo de toute l'histoire, découpée en scènes (chapitres = pages du livre).
 * - Rien ne démarre seul ; volume / silencieux du profil.
 * - Bandeau « Ce qui se passe » : le texte de la page, phrase par phrase (le texte
 *   reste disponible même sans le son — 6.15).
 * - Personnages de la scène à toucher : la vidéo se met en pause et on découvre
 *   ce qu'ils ressentent.
 * - Mêmes règles que la lecture : minuteur, pauses proposées entre les scènes,
 *   objectif, limite (la scène en cours se termine), étoiles, marque-page.
 */
import { useCallback, useRef, useState } from 'react';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useSessionTimer, daySeconds } from '../engine/timeRules.js';
import { readingVars } from '../engine/adaptation.js';
import { textLang, sceneIndexAt } from '../engine/film.js';
import VideoPlayer from '../components/VideoPlayer.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { Hourglass } from '../components/ui.jsx';

const CHALLENGES = ['challenge_stretch', 'challenge_blue', 'challenge_breathe'];


export default function VideoFilm({ params, book }) {
  const { state, dispatch, navigate, reward, log } = useStore();
  const child = useActiveChild();
  const t = useT();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const profile = child?.profile;
  const rules = child?.rules;
  const lang = textLang(book, t.lang);
  const startScene = params.from ?? session?.startScene ?? 0;

  const player = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(book.scenes[startScene].clip[0]);
  const [phase, setPhase] = useState('film');
  const [selected, setSelected] = useState(null);
  const [captions, setCaptions] = useState(true);
  const [challenge, setChallenge] = useState(CHALLENGES[0]);
  const sceneRef = useRef(startScene);
  const counters = useRef({ scenes: 0, sincePause: 0, done: false });

  const flush = useCallback((sec) => child && dispatch({ type: 'ADD_DAY_TIME', childId: child.id, seconds: sec }), [child, dispatch]);
  const sessionSec = useSessionTimer(playing && phase === 'film', flush);
  const daySec = child ? daySeconds(state.dailyTime, child.id) : 0;
  const limitRef = useRef(false);
  limitRef.current = rules ? sessionSec >= rules.sessionMaxMin * 60 || daySec >= rules.dayMaxMin * 60 : false;

  const logI = useCallback((type, value, meta) => child && session && log(child.id, session.id, type, value, meta), [log, child, session]);

  const endSession = useCallback((reason) => {
    player.current?.pause();
    if (reason !== 'quit') reward(child.id, 'session_complete', { session: session.id, video: true });
    dispatch({ type: 'END_SESSION', id: session.id, patch: { endReason: reason, pagesDone: counters.current.scenes, lastModes: { watch: true, listen: true, film: true } } });
    navigate('finished', { sessionId: session.id, reason });
  }, [child, session, reward, dispatch, navigate]);

  /** Une scène vient d'être regardée jusqu'au bout. */
  const completeScene = useCallback((index) => {
    const c = counters.current;
    c.scenes += 1;
    c.sincePause += 1;
    reward(child.id, 'scene_complete', { scene: book.scenes[index].id, book: book.id, video: true });
    logI('page', book.scenes[index].id, { modes: { watch: true, listen: !profile.audio.silent, film: true } });
    const isLast = index >= book.scenes.length - 1;
    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: isLast ? 0 : index + 1 });
    if (isLast) return 'end';
    if (limitRef.current) return 'limit';
    if (session.goal === '2' && c.scenes === 2) { reward(child.id, 'goal_reached', { goal: 2 }); return 'goal'; }
    if (profile.pauses.enabled && c.sincePause >= profile.pauses.everyScenes) return 'pause';
    return null;
  }, [child, book, session, profile, reward, logI, dispatch]);

  const lastT = useRef(null);
  const onTime = (now) => {
    setTime(now);
    // lecture continue (pas un saut de chapitre) : seul cas où une scène compte comme regardée
    const continuous = lastT.current != null && now - lastT.current >= 0 && now - lastT.current < 1.5;
    lastT.current = now;
    const idx = sceneIndexAt(book, now);
    const prev = sceneRef.current;
    if (idx === prev + 1 && playing && continuous) {
      sceneRef.current = idx;
      const stop = completeScene(prev);
      if (stop === 'limit') return endSession('limit');
      if (stop === 'goal' || stop === 'pause') {
        player.current?.pause();
        setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
        setPhase(stop);
      }
    } else if (idx !== prev) {
      sceneRef.current = idx; // saut volontaire (chapitre) : pas d'étoile
    }
  };

  const onEnd = () => {
    if (counters.current.done) return;
    counters.current.done = true;
    completeScene(book.scenes.length - 1);
    reward(child.id, 'book_complete', { book: book.id, video: true });
    endSession('finished');
  };

  const onCharacter = (id) => {
    player.current?.pause();
    setSelected(id);
    logI('character', id, { scene: book.scenes[sceneRef.current].id, video: true });
    reward(child.id, 'character_explored', { scene: book.scenes[sceneRef.current].id, character: id });
  };

  const resume = (action) => {
    if (action) {
      logI('pause', action, { video: true });
      if (action === 'taken' || action === 'skipped') counters.current.sincePause = 0;
      if (action === 'postponed') counters.current.sincePause = Math.max(0, profile.pauses.everyScenes - 1);
    }
    setPhase('film');
    setSelected(null);
    player.current?.play();
  };

  if (!child || !session) return null;

  const idx = sceneIndexAt(book, time);
  const scene = book.scenes[idx];
  const data = scene[lang];
  const sentences = data.sentences.map((s) => (profile.text.simplified && s.simple ? s.simple : s.t));
  // « Ce qui se passe » : la phrase de la page qui correspond au moment de la scène
  const k = Math.min(sentences.length - 1, Math.floor(((time - scene.clip[0]) / (scene.clip[1] - scene.clip[0])) * sentences.length));
  const showCaption = captions || profile.audio.silent || profile.audio.captions;
  const reveal = selected ? scene.characters.find((c) => c.id === selected)?.reveal : null;
  const chapters = book.scenes.map((s, i) => ({ start: s.clip[0], end: s.clip[1], label: t('chapter_n', { n: i + 1, where: t.pick(s.where) }) }));

  return (
    <div className="film" style={readingVars(profile, lang)}>
      <div className="film-stage" style={{ display: 'flex', flexDirection: 'column' }}>
        <VideoPlayer
          ref={player}
          src={book.video.src}
                webm={book.video.webm}
          poster={book.scenes[startScene].poster}
          range={[book.scenes[startScene].clip[0], book.video.duration]}
          chapters={chapters.slice(startScene)}
          volume={profile.audio.volume}
          muted={profile.audio.silent}
          caption={showCaption ? sentences[Math.max(0, k)] : null}
          captionTag={t('what_happens')}
          onTime={onTime}
          onPlayChange={(p) => { setPlaying(p); if (p) setSelected(null); logI(p ? 'film_play' : 'film_pause', idx, { video: true }); }}
          onRangeEnd={onEnd}
          label={t('film_aria', { title: t.pick(book.title), where: t.pick(scene.where) })}
        >
          {/* personnages de la scène, à toucher */}
          <div className="vplayer-chars" role="group" aria-label={t('touch_character')}>
            {scene.characters.slice(0, 3).map((c) => (
              <button key={c.id} type="button" className="char-label" aria-pressed={selected === c.id} onClick={() => onCharacter(c.id)}>
                {profile.scene.shapes && <span aria-hidden="true">{book.characters[c.id]?.shape}</span>}
                {t.pick(book.characters[c.id]?.name)}
              </button>
            ))}
          </div>
          {reveal && (
            <div className="film-reveal" role="status" aria-live="polite">
              <strong>💭 {t.pick(book.characters[selected]?.name)}</strong> — {t.pick(reveal)}
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-small btn-primary" onClick={() => resume()}>▶ {t('film_resume')}</button>
              </div>
            </div>
          )}
        </VideoPlayer>
      </div>

      <div className="film-controls">
        <button type="button" className="btn btn-small btn-ghost" onClick={() => { player.current?.pause(); setPhase('confirm_quit'); }} aria-label={t('stop_reading')}>✕</button>
        <strong className="grow" style={{ minWidth: 160 }}>{idx + 1}. {t.pick(scene.where)}</strong>
        <button type="button" className="btn btn-small" disabled={idx <= startScene} onClick={() => player.current?.seek(book.scenes[idx - 1].clip[0] + 0.05)}>⏮ {t('prev_scene')}</button>
        <button type="button" className="btn btn-small" disabled={idx >= book.scenes.length - 1} onClick={() => player.current?.seek(book.scenes[idx + 1].clip[0] + 0.05)}>{t('next_scene')} ⏭</button>
        <button type="button" className="chip" aria-pressed={showCaption} disabled={profile.audio.silent || profile.audio.captions} onClick={() => setCaptions((c) => !c)}>CC {t('captions')}</button>
        <button type="button" className="btn btn-small" onClick={() => { player.current?.pause(); navigate('reader', { sessionId: session.id, from: idx }); }}>📖 {t('read_this_page')}</button>
        <Hourglass usedSec={sessionSec} maxMin={rules.sessionMaxMin} />
      </div>
      {book.video.credit && <div className="video-credit">{book.video.credit}</div>}

      {phase !== 'film' && (
        <div role="dialog" aria-modal="true" className="modal-backdrop">
          <div className="stack card" style={{ alignItems: 'center', maxWidth: 560, width: '100%' }}>
            {phase === 'pause' && (
              <>
                <SidiHkeya line="pause" size={96} />
                <p className="challenge">{t(challenge)}</p>
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => resume('taken')}>{t('im_ready')}</button>
                  <button type="button" className="btn" onClick={() => resume('postponed')}>{t('later')}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => resume('skipped')}>{t('skip')}</button>
                </div>
              </>
            )}
            {phase === 'goal' && (
              <>
                <SidiHkeya line="goal" size={96} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => resume()}>{t('continue_story')}</button>
                  <button type="button" className="btn" onClick={() => endSession('goal')}>{t('stop_today')}</button>
                </div>
              </>
            )}
            {phase === 'confirm_quit' && (
              <>
                <SidiHkeya text={t('quit_question')} size={80} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setPhase('film')}>{t('keep_reading')}</button>
                  <button type="button" className="btn" onClick={() => { dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: idx }); endSession('quit'); }}>{t('stop_reading')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
