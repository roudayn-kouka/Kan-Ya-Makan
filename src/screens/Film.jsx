/**
 * Mode Regarder : toute l'histoire en un FILM 3D continu.
 *
 * - Rien ne démarre seul : l'enfant appuie sur ▶ (règle 6.14).
 * - La voix lit chaque phrase ; l'image attend la fin de la phrase avant d'avancer
 *   (synchronisation voix / image / sous-titres). Sans voix, la durée est estimée.
 * - Sous-titres avec le mot en cours surligné, chapitres par scène, pause, retour.
 * - Toucher un personnage met le film en pause et révèle ce qu'il ressent.
 * - Mêmes règles que la lecture : minuteur doux, pauses proposées, objectif,
 *   limite (la scène en cours se termine), étoiles, marque-page.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useBook } from '../data/library.js';
import { buildPage, locate } from '../engine/text.js';
import { buildTimeline, sceneAt, segmentIndexAt, sceneProgress, fadeAt, textLang } from '../engine/film.js';
import { paletteFor, prefersReducedMotion, hasWebGL, readingVars } from '../engine/adaptation.js';
import { Narrator } from '../engine/speech.js';
import { playSound } from '../engine/sound.js';
import { useSessionTimer, daySeconds } from '../engine/timeRules.js';
import FilmStage from '../components/three/FilmStage.jsx';
import Fallback2D from '../components/Fallback2D.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { Hourglass } from '../components/ui.jsx';
import VideoFilm from './VideoFilm.jsx';

const CHALLENGES = ['challenge_stretch', 'challenge_blue', 'challenge_breathe'];
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Livre avec une vraie vidéo → lecteur vidéo ; sinon → film 3D généré depuis le script. */
export default function Film({ params }) {
  const { state } = useStore();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const book = useBook(session?.bookId);
  if (book?.video) return <VideoFilm params={params} book={book} />;
  return <Film3D params={params} />;
}

function Film3D({ params }) {
  const { state, dispatch, navigate, reward, log } = useStore();
  const child = useActiveChild();
  const t = useT();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const book = useBook(session?.bookId);
  const profile = child?.profile;
  const rules = child?.rules;
  const lang = book ? textLang(book, t.lang) : t.lang;
  const startScene = params.from ?? session?.startScene ?? 0;

  const timeline = useMemo(
    () => (book ? buildTimeline(book, { lang, simplified: Boolean(profile?.text.simplified), rate: profile?.audio.rate || 1, from: startScene }) : null),
    [book, lang, profile?.text.simplified, profile?.audio.rate, startScene],
  );

  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState('film'); // film | pause | goal | confirm_quit
  const [ui, setUi] = useState({ t: 0, scene: startScene, seg: -1, char: null });
  const [captions, setCaptions] = useState(true);
  const [selected, setSelected] = useState(null);
  const [labels, setLabels] = useState([]);
  const [soundFlash, setSoundFlash] = useState(null);
  const [challenge, setChallenge] = useState(CHALLENGES[0]);
  const [webgl] = useState(() => hasWebGL());

  const tRef = useRef(0);
  const progressRef = useRef(0);
  const playingRef = useRef(false);
  const holdRef = useRef(false);
  const spokenIdx = useRef(-1);
  const sceneRef = useRef(startScene);
  const charRef = useRef(null);
  const narrator = useRef(null);
  const counters = useRef({ scenes: 0, sincePause: 0, lastDone: false });
  if (!narrator.current) narrator.current = new Narrator();

  const flush = useCallback((sec) => child && dispatch({ type: 'ADD_DAY_TIME', childId: child.id, seconds: sec }), [child, dispatch]);
  const sessionSec = useSessionTimer(playing && phase === 'film', flush);
  const daySec = child ? daySeconds(state.dailyTime, child.id) : 0;
  const limitReached = rules ? sessionSec >= rules.sessionMaxMin * 60 || daySec >= rules.dayMaxMin * 60 : false;
  const limitRef = useRef(false);
  limitRef.current = limitReached;

  useEffect(() => () => narrator.current?.stop(), []);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  const logI = useCallback((type, value, meta) => child && session && log(child.id, session.id, type, value, meta), [log, child, session]);

  const endSession = useCallback((reason) => {
    narrator.current?.stop();
    setPlaying(false);
    if (reason !== 'quit') reward(child.id, 'session_complete', { session: session.id, film: true });
    dispatch({
      type: 'END_SESSION',
      id: session.id,
      patch: { endReason: reason, pagesDone: counters.current.scenes, lastModes: { watch: true, listen: true, film: true } },
    });
    navigate('finished', { sessionId: session.id, reason });
  }, [child, session, reward, dispatch, navigate]);

  /* ---------- Voix de la phrase en cours ---------- */
  const speakSegment = useCallback((idx) => {
    const seg = timeline.segments[idx];
    if (!seg) return;
    holdRef.current = true;
    charRef.current = 0;
    narrator.current.speak({
      page: buildPage([seg.text]),
      lang,
      rate: profile.audio.rate,
      volume: profile.audio.volume,
      voiceURI: profile.audio.voiceURI,
      muted: profile.audio.silent,
      onPosition: (c) => { charRef.current = c; },
      onEnd: () => { holdRef.current = false; },
    });
  }, [timeline, lang, profile]);

  /* ---------- Fin d'une scène regardée ---------- */
  const completeScene = useCallback((index) => {
    const c = counters.current;
    c.scenes += 1;
    c.sincePause += 1;
    reward(child.id, 'scene_complete', { scene: book.scenes[index].id, book: book.id, film: true });
    logI('page', book.scenes[index].id, { modes: { watch: true, listen: !profile.audio.silent, film: true } });
    const isLast = index >= book.scenes.length - 1;
    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: isLast ? 0 : index + 1 });
    if (isLast) return null;
    if (limitRef.current) return 'limit';
    if (session.goal === '2' && c.scenes === 2) { reward(child.id, 'goal_reached', { goal: 2 }); return 'goal'; }
    if (profile.pauses.enabled && c.sincePause >= profile.pauses.everyScenes) return 'pause';
    return null;
  }, [child, book, session, profile, reward, logI, dispatch]);

  /* ---------- Horloge du film ---------- */
  useEffect(() => {
    if (!playing || !timeline) return undefined;
    let last = performance.now();
    let raf;
    let lastUi = 0;
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let tt = tRef.current;
      const curIdx = segmentIndexAt(timeline, tt);
      const cur = timeline.segments[curIdx];
      // l'image attend la fin de la phrase si la voix n'a pas fini
      const holding = holdRef.current && cur && tt + dt >= cur.start + cur.dur - 0.03;
      if (!holding) tt += dt;

      const idx = segmentIndexAt(timeline, tt);
      if (idx >= 0 && idx !== spokenIdx.current) {
        spokenIdx.current = idx;
        speakSegment(idx);
      }

      // passage d'une scène à la suivante, ou début du générique de fin
      const sc = tt >= timeline.outroStart ? null : sceneAt(timeline, tt);
      const prevScene = sceneRef.current;
      let stop = null;
      if ((sc && sc.index !== prevScene) || (!sc && !counters.current.lastDone)) {
        if (!sc) counters.current.lastDone = true;
        stop = completeScene(prevScene);
        if (sc) sceneRef.current = sc.index;
      }

      tRef.current = Math.min(tt, timeline.total);
      progressRef.current = tt >= timeline.outroStart ? 1 : sceneProgress(timeline, tt);

      if (stop) {
        setPlaying(false);
        narrator.current.stop();
        if (stop === 'limit') { endSession('limit'); return; }
        setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
        setPhase(stop);
      }
      if (tt >= timeline.total) {
        reward(child.id, 'book_complete', { book: book.id, film: true });
        endSession('finished');
        return;
      }
      if (now - lastUi > 90 || stop) {
        lastUi = now;
        setUi({ t: tRef.current, scene: sceneRef.current, seg: segmentIndexAt(timeline, tRef.current), char: charRef.current });
      }
      if (!stop) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, timeline, speakSegment, completeScene, endSession, reward, child, book]);

  if (!child || !session || !book || !timeline) {
    return (
      <main className="screen">
        <p>{t('nothing_here')}</p>
        <button type="button" className="btn" onClick={() => navigate('who')}>{t('back')}</button>
      </main>
    );
  }

  /* ---------- Commandes ---------- */
  const play = () => {
    setSelected(null);
    // reprise : on relance la phrase en cours depuis son début (voix et image restent alignées)
    const idx = segmentIndexAt(timeline, tRef.current);
    if (idx >= 0) tRef.current = timeline.segments[idx].start;
    spokenIdx.current = -1;
    holdRef.current = false;
    if (!started) { setStarted(true); logI('film_start', startScene); }
    setPhase('film');
    setPlaying(true);
  };
  const pause = () => {
    setPlaying(false);
    narrator.current.stop();
    holdRef.current = false;
    logI('film_pause', sceneRef.current);
  };
  const seekScene = (index) => {
    const sc = timeline.scenes.find((s) => s.index === index);
    if (!sc) return;
    narrator.current.stop();
    holdRef.current = false;
    spokenIdx.current = -1;
    tRef.current = sc.start + 0.01;
    sceneRef.current = index;
    counters.current.lastDone = false;
    progressRef.current = 0;
    setUi({ t: tRef.current, scene: index, seg: -1, char: null });
    logI('replay_page', book.scenes[index].id, { film: true });
  };
  const onCharacter = (id) => {
    if (!id) { setSelected(null); return; }
    if (playing) pause();
    setSelected(id);
    logI('character', id, { scene: book.scenes[ui.scene].id, film: true });
    reward(child.id, 'character_explored', { scene: book.scenes[ui.scene].id, character: id });
  };
  const onSound = (type) => {
    playSound(type, profile.audio);
    setSoundFlash(type);
    setTimeout(() => setSoundFlash((f) => (f === type ? null : f)), 3000);
  };
  const resumeAfter = (action) => {
    logI('pause', action, { film: true });
    if (action === 'taken' || action === 'skipped') counters.current.sincePause = 0;
    if (action === 'postponed') counters.current.sincePause = Math.max(0, profile.pauses.everyScenes - 1);
    play();
  };

  /* ---------- Affichage ---------- */
  const scene = book.scenes[ui.scene];
  const seg = timeline.segments[ui.seg];
  const fade = fadeAt(timeline, ui.t);
  const inIntro = ui.t < timeline.introEnd && started;
  const inOutro = ui.t >= timeline.outroStart;
  const reduced = prefersReducedMotion(profile);
  const pal = paletteFor(profile);
  const interactiveIds = scene.characters.slice(0, 3).map((c) => c.id);
  const reveal = selected ? scene.characters.find((c) => c.id === selected)?.reveal : null;
  const segPage = seg ? buildPage([seg.text]) : null;
  const curWord = segPage && ui.char != null ? locate(segPage, ui.char).word : -1;
  const vars = readingVars(profile, lang);
  const showCaptions = captions || profile.audio.silent; // en mode silencieux, les sous-titres restent toujours visibles

  return (
    <div className="film" style={vars}>
      <div className="film-stage" dir="ltr">
        {!webgl || profile.scene.renderMode === 'illustration' ? (
          <Fallback2D scene={scene} profile={profile} selected={selected} onSelect={onCharacter} interactive />
        ) : (
          <Canvas
            key={ui.scene}
            camera={{ position: [0, 3, 9], fov: 45 }}
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: 'low-power' }}
            role="img"
            aria-label={t('film_aria', { title: t.pick(book.title), where: t.pick(scene.where) })}
            onPointerMissed={() => setSelected(null)}
          >
            <Suspense fallback={null}>
              <FilmStage
                scene={scene}
                pal={pal}
                progressRef={progressRef}
                playingRef={playingRef}
                reduced={reduced}
                singleMotion={profile.scene.singleMotion}
                selected={selected}
                onSelect={onCharacter}
                interactiveIds={interactiveIds}
                onLabels={setLabels}
                onSound={onSound}
                showSoundVisual={profile.audio.visualEquivalents}
              />
            </Suspense>
          </Canvas>
        )}

        {/* personnages à toucher */}
        {webgl && profile.scene.renderMode !== 'illustration' && !inIntro && labels.map((l) => (
          <button
            key={l.id}
            type="button"
            className="char-label"
            aria-pressed={selected === l.id}
            onClick={() => onCharacter(l.id)}
            style={{ position: 'absolute', left: l.x, top: l.y, transform: 'translate(-50%, -100%)', zIndex: 4 }}
          >
            {profile.scene.shapes && <span aria-hidden="true">{book.characters?.[l.id]?.shape}</span>}
            {t.pick(book.characters?.[l.id]?.name)}
          </button>
        ))}

        {/* fondu entre les scènes */}
        <div className="film-fade" style={{ opacity: fade }} aria-hidden="true" />

        {/* carton d'ouverture / de fin */}
        {(!started || inIntro) && (
          <div className="film-card" dir={t.lang === 'ar' ? 'rtl' : 'ltr'}>
            <img src="./logo_kan_ya_makan.png" alt="" className="logo-img" />
            <div className="film-card-title">{t.pick(book.title)}</div>
            {!started ? (
              <>
                <p>{t('film_intro', { n: book.scenes.length - startScene, min: Math.max(1, Math.round(timeline.total / 60)) })}</p>
                <button type="button" className="btn btn-primary" onClick={play} autoFocus>▶ {t('film_play')}</button>
              </>
            ) : (
              <p className="film-card-kym" lang="ar">كان يا مكان…</p>
            )}
          </div>
        )}
        {inOutro && (
          <div className="film-card">
            <SidiHkeya line="bye" size={90} />
            <div className="film-card-title">{t('film_end')}</div>
          </div>
        )}

        {/* ce que ressent le personnage touché */}
        {reveal && (
          <div className="film-reveal" role="status" aria-live="polite">
            <strong>💭 {t.pick(book.characters?.[selected]?.name)}</strong> — {t.pick(reveal)}
            <div className="row" style={{ marginTop: 8 }}>
              <button type="button" className="btn btn-small btn-primary" onClick={play}>▶ {t('film_resume')}</button>
            </div>
          </div>
        )}

        {/* équivalent visuel du son */}
        {soundFlash && (
          <div className="film-sound badge-tag" role="status">🔊 {t(`sound_${soundFlash}`)}</div>
        )}

        {/* sous-titres */}
        {showCaptions && seg && !inOutro && (
          <div className="film-subtitle read-text" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang} aria-live="off">
            {segPage.sentences[0].words.map((w, i) => (
              <span key={i}><span className={`word ${i === curWord ? 'current-word' : ''}`}>{w.text}</span> </span>
            ))}
          </div>
        )}
      </div>

      {/* barre de commandes */}
      <div className="film-controls">
        <button type="button" className="btn btn-small btn-ghost" onClick={() => { pause(); setPhase('confirm_quit'); }} aria-label={t('stop_reading')}>✕</button>
        <button type="button" className="btn btn-small" onClick={() => seekScene(Math.max(startScene, ui.scene - 1))} aria-label={t('prev_scene')} disabled={!started}>⏮</button>
        {playing
          ? <button type="button" className="btn btn-primary" onClick={pause} aria-label={t('pause_voice')}>❚❚</button>
          : <button type="button" className="btn btn-primary" onClick={play} aria-label={t('film_play')}>▶</button>}
        <button type="button" className="btn btn-small" onClick={() => seekScene(Math.min(book.scenes.length - 1, ui.scene + 1))} aria-label={t('next_scene')} disabled={!started}>⏭</button>

        <div className="film-chapters" role="group" aria-label={t('chapters')}>
          {timeline.scenes.map((s) => {
            const done = ui.t >= s.end;
            const here = ui.scene === s.index && !inOutro;
            const fill = here ? Math.min(1, Math.max(0, (ui.t - s.start) / s.dur)) : done ? 1 : 0;
            return (
              <button
                key={s.index}
                type="button"
                className={`film-chapter ${here ? 'here' : ''}`}
                style={{ flexGrow: s.dur }}
                onClick={() => { seekScene(s.index); if (!playing && started) play(); }}
                aria-label={t('chapter_n', { n: s.index + 1, where: t.pick(book.scenes[s.index].where) })}
                aria-current={here ? 'step' : undefined}
                disabled={!started}
              >
                <span className="film-chapter-fill" style={{ width: `${fill * 100}%` }} />
                <span className="film-chapter-num">{done && !here ? '✓' : s.index + 1}</span>
              </button>
            );
          })}
        </div>
        <span className="muted" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.9em' }}>{fmt(ui.t)} / {fmt(timeline.total)}</span>
        <button type="button" className="chip" aria-pressed={captions} onClick={() => setCaptions((c) => !c)}>CC {t('captions')}</button>
        <button type="button" className="btn btn-small" onClick={() => { pause(); navigate('reader', { sessionId: session.id, from: ui.scene }); }}>📖 {t('read_this_page')}</button>
        <Hourglass usedSec={sessionSec} maxMin={rules.sessionMaxMin} />
      </div>

      {phase !== 'film' && (
        <div role="dialog" aria-modal="true" className="modal-backdrop">
          <div className="stack card" style={{ alignItems: 'center', maxWidth: 560, width: '100%' }}>
            {phase === 'pause' && (
              <>
                <SidiHkeya line="pause" size={96} />
                <p className="challenge">{t(challenge)}</p>
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => resumeAfter('taken')}>{t('im_ready')}</button>
                  <button type="button" className="btn" onClick={() => resumeAfter('postponed')}>{t('later')}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => resumeAfter('skipped')}>{t('skip')}</button>
                </div>
              </>
            )}
            {phase === 'goal' && (
              <>
                <SidiHkeya line="goal" size={96} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={play}>{t('continue_story')}</button>
                  <button type="button" className="btn" onClick={() => endSession('goal')}>{t('stop_today')}</button>
                </div>
              </>
            )}
            {phase === 'confirm_quit' && (
              <>
                <SidiHkeya text={t('quit_question')} size={80} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => { setPhase('film'); if (started) play(); }}>{t('keep_reading')}</button>
                  <button type="button" className="btn" onClick={() => {
                    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: ui.scene });
                    endSession('quit');
                  }}>{t('stop_reading')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
