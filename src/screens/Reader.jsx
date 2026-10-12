/**
 * Écran 4 — Lecteur (6.13 A, 6.14).
 * Boucle par page : lire / écouter / regarder, aide sur un mot ou une phrase,
 * personnages à toucher, question facultative, « Page suivante » comme action principale.
 * Gère aussi : minuteur doux, pauses proposées (jamais imposées), objectif du jour,
 * limite de séance (la page en cours se termine toujours).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useBook } from '../data/library.js';
import { textLang } from '../engine/film.js';
import { buildPage, locate, estimateTimeline } from '../engine/text.js';
import { readingVars } from '../engine/adaptation.js';
import { Narrator, speechSupported } from '../engine/speech.js';
import { playSound } from '../engine/sound.js';
import { useSessionTimer, daySeconds } from '../engine/timeRules.js';
import SceneView from '../components/Scene3D.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import ReaderText from '../components/ReaderText.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { Hourglass, ProgressPath, QuestionCard } from '../components/ui.jsx';

const CHALLENGES = ['challenge_stretch', 'challenge_blue', 'challenge_breathe'];

export default function Reader({ params }) {
  const { state, dispatch, navigate, reward, log } = useStore();
  const child = useActiveChild();
  const t = useT();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const book = useBook(session?.bookId);
  const profile = child?.profile;
  const rules = child?.rules;

  const [sceneIdx, setSceneIdx] = useState(params.from ?? session?.startScene ?? 0);
  // venant du film (« Lire cette page ») : on ouvre la page avec le texte, la voix et la scène
  const [modes, setModes] = useState(() => (session?.modes?.film
    ? { read: true, listen: true, watch: true }
    : session?.modes || { read: true, listen: false, watch: true }));
  const [simplified, setSimplified] = useState(Boolean(profile?.text.simplified));
  const [focusMode, setFocusMode] = useState(Boolean(profile?.scene.focusMode));
  const [split, setSplit] = useState(profile?.scene.split ?? 0.5);
  const [selectedChar, setSelectedChar] = useState(null);
  const [focusSentence, setFocusSentence] = useState(0);
  const [narrating, setNarrating] = useState(false);
  const [currentChar, setCurrentChar] = useState(null);
  const [sidi, setSidi] = useState(null); // { line?, text?, action? }
  const [phase, setPhase] = useState('reading'); // reading | pause | goal | confirm_quit
  const [showQuestion, setShowQuestion] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
  const [challenge, setChallenge] = useState(CHALLENGES[0]);

  const narrator = useRef(null);
  const pageStart = useRef(Date.now());
  const counters = useRef({ pagesDone: 0, sincePause: 0, pausesTaken: 0, pausesSkipped: 0, almostShown: false });
  const wordCounts = useRef({});
  const explored = useRef(new Set());

  if (!narrator.current) narrator.current = new Narrator();

  const flush = useCallback((sec) => child && dispatch({ type: 'ADD_DAY_TIME', childId: child.id, seconds: sec }), [child, dispatch]);
  const sessionSec = useSessionTimer(phase === 'reading', flush);
  const daySec = child ? daySeconds(state.dailyTime, child.id) : 0;

  // langue du TEXTE (un livre importé peut être dans une autre langue que l'interface)
  const lang = book ? textLang(book, t.lang) : t.lang;
  const scene = book?.scenes[sceneIdx];
  const data = scene?.[lang] || scene?.fr;
  const hasSimple = Boolean(data?.sentences.some((x) => x.simple));
  const page = useMemo(
    () => (data ? buildPage(data.sentences.map((s) => (simplified && s.simple ? s.simple : s.t))) : null),
    [data, simplified],
  );

  const limitReached = rules
    ? sessionSec >= rules.sessionMaxMin * 60 || daySec >= rules.dayMaxMin * 60
    : false;
  const minutesLeft = rules ? Math.min(rules.sessionMaxMin * 60 - sessionSec, rules.dayMaxMin * 60 - daySec) : 999;

  // Rappel doux une minute avant la limite
  useEffect(() => {
    if (minutesLeft <= 60 && minutesLeft > 0 && !counters.current.almostShown) {
      counters.current.almostShown = true;
      setSidi({ line: 'almost' });
    }
  }, [minutesLeft]);

  // Arrêt de la voix en quittant la page ou l'écran
  useEffect(() => () => narrator.current?.stop(), []);
  useEffect(() => {
    narrator.current?.stop();
    setNarrating(false);
    setCurrentChar(null);
    setSelectedChar(null);
    setShowQuestion(false);
    setFocusSentence(0);
    pageStart.current = Date.now();
  }, [sceneIdx, simplified, lang]);

  const logI = useCallback((type, value, meta) => log(child.id, session.id, type, value, meta), [log, child, session]);

  const endSession = useCallback((reason) => {
    narrator.current?.stop();
    if (reason !== 'quit') reward(child.id, 'session_complete', { session: session.id });
    dispatch({
      type: 'END_SESSION',
      id: session.id,
      patch: {
        endReason: reason,
        pagesDone: counters.current.pagesDone,
        pausesTaken: counters.current.pausesTaken,
        pausesSkipped: counters.current.pausesSkipped,
        lastModes: modes,
      },
    });
    navigate('finished', { sessionId: session.id, reason });
  }, [child, session, modes, reward, dispatch, navigate]);

  if (!child || !session || !book || !scene) {
    return (
      <main className="screen">
        <p>{t('nothing_here')}</p>
        <button type="button" className="btn" onClick={() => navigate('who')}>{t('back')}</button>
      </main>
    );
  }

  /* ---------------- Narration ---------------- */
  const startNarration = (fromSentence) => {
    const from = fromSentence ?? (focusMode ? focusSentence : 0);
    const res = narrator.current.speak({
      page,
      fromSentence: from,
      lang,
      rate: profile.audio.rate,
      volume: profile.audio.volume,
      voiceURI: profile.audio.voiceURI,
      muted: profile.audio.silent,
      onPosition: (c) => {
        setCurrentChar(c);
        const loc = locate(page, c);
        if (loc.sentence >= 0) setFocusSentence(loc.sentence);
      },
      onEnd: () => {
        setNarrating(false);
        setCurrentChar(null);
      },
    });
    setNoVoice(!res.audio && !profile.audio.silent);
    setNarrating(true);
    logI(fromSentence != null ? 'replay' : 'listen', sceneIdx);
  };
  const stopNarration = () => {
    narrator.current.stop();
    setNarrating(false);
    setCurrentChar(null);
  };

  /* ---------------- Aides ---------------- */
  const onWord = (w, hasDef) => {
    logI('word', w.key);
    if (hasDef) reward(child.id, 'word_help', { word: w.key });
    wordCounts.current[w.key] = (wordCounts.current[w.key] || 0) + 1;
    // Suggestion douce : un mot rejoué plusieurs fois -> proposer d'écouter la page
    if (wordCounts.current[w.key] >= 2 && !narrating) {
      setSidi({ line: 'help', action: 'listen_page' });
    }
  };
  const onSayWord = (word) => {
    if (profile.audio.silent) return;
    narrator.current.sayWord(word, { lang, rate: profile.audio.rate * 0.9, volume: profile.audio.volume, voiceURI: profile.audio.voiceURI });
  };
  const onExplain = (i) => {
    const s = data.sentences[i];
    setSidi({ text: s.explain, explained: i });
    setFocusSentence(i);
    logI('sentence', i, { scene: scene.id });
    reward(child.id, 'sentence_help', { scene: scene.id, sentence: i });
  };
  const onCharacter = (id) => {
    setSelectedChar(id);
    if (!id) return;
    logI('character', id, { scene: scene.id });
    const key = `${scene.id}:${id}`;
    if (!explored.current.has(key)) {
      explored.current.add(key);
      reward(child.id, 'character_explored', { scene: scene.id, character: id });
    }
  };

  /* ---------------- Navigation ---------------- */
  const nextPage = () => {
    stopNarration();
    const c = counters.current;
    logI('page', scene.id, { ms: Date.now() - pageStart.current, modes, simplified });
    reward(child.id, 'scene_complete', { scene: scene.id, book: book.id });
    c.pagesDone += 1;
    c.sincePause += 1;
    const isLast = sceneIdx >= book.scenes.length - 1;
    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: isLast ? 0 : sceneIdx + 1 });

    if (isLast) {
      reward(child.id, 'book_complete', { book: book.id });
      return endSession('finished');
    }
    if (limitReached) return endSession('limit');
    if (session.goal === '2' && c.pagesDone === 2) {
      reward(child.id, 'goal_reached', { goal: 2 });
      setSidi(null);
      return setPhase('goal');
    }
    if (profile.pauses.enabled && c.sincePause >= profile.pauses.everyScenes) {
      setChallenge(CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]);
      setSidi(null);
      return setPhase('pause');
    }
    setSidi(null);
    setSceneIdx((i) => i + 1);
  };

  const prevPage = () => {
    if (sceneIdx === 0) return;
    stopNarration();
    logI('replay_page', scene.id);
    setSidi(null);
    setSceneIdx((i) => i - 1);
  };

  const pauseAnswer = (action) => {
    const c = counters.current;
    logI('pause', action);
    if (action === 'taken') { c.pausesTaken += 1; c.sincePause = 0; }
    if (action === 'skipped') { c.pausesSkipped += 1; c.sincePause = 0; }
    if (action === 'postponed') c.sincePause = Math.max(0, profile.pauses.everyScenes - 1);
    setPhase('reading');
    setSceneIdx((i) => i + 1);
  };

  const toggleMode = (m) => {
    setModes((cur) => {
      const next = { ...cur, [m]: !cur[m] };
      if (!(next.read || next.listen || next.watch)) return cur;
      logI('mode_change', m, { on: next[m] });
      if (m === 'listen' && !next.listen) stopNarration();
      return next;
    });
  };

  /* ---------------- Mise en page ---------------- */
  const showText = modes.read;
  const showScene = modes.watch && !focusMode;
  const both = showText && showScene;
  const vars = readingVars(profile, lang);
  const revealRaw = selectedChar ? scene.characters.find((c) => c.id === selectedChar)?.reveal : null;
  // livre importé : on ne devine pas les émotions (pas d'IA dans le prototype), on nomme le personnage
  const reveal = selectedChar ? revealRaw || { fr: t('no_reveal', { name: t.pick(book.characters?.[selectedChar]?.name) }), ar: t('no_reveal', { name: t.pick(book.characters?.[selectedChar]?.name) }) } : null;
  const subtitleSentence = currentChar != null ? locate(page, currentChar).sentence : focusSentence;
  // La scène 3D de la page suit la voix : progression = position dans le texte lu
  const narrationProgress = narrating && currentChar != null
    ? Math.min(1, Math.max(0, (currentChar - page.sentences[0].start) / Math.max(1, page.fullText.length)))
    : null;
  const clipSeconds = Math.max(8, estimateTimeline(page, profile.audio.rate).total / 1000 + 2);

  const onSplitKey = (e) => {
    const dir = t.lang === 'ar' ? -1 : 1;
    if (e.key === 'ArrowLeft') setSplit((s) => Math.max(0.25, s - 0.05 * dir));
    if (e.key === 'ArrowRight') setSplit((s) => Math.min(0.75, s + 0.05 * dir));
  };
  const onSplitDrag = (e) => {
    const body = e.currentTarget.parentElement.getBoundingClientRect();
    const move = (ev) => {
      let r = (ev.clientX - body.left) / body.width;
      if (t.lang === 'ar') r = 1 - r;
      setSplit(Math.min(0.75, Math.max(0.25, r)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const soundKey = scene.sound ? `sound_${scene.sound.type}` : null;

  return (
    <div className="reader" style={vars}>
      {/* ---------- Barre du haut ---------- */}
      <header className="reader-top">
        <button type="button" className="btn btn-small btn-ghost" onClick={() => { stopNarration(); setPhase('confirm_quit'); }}>
          ✕ <span className="visually-hidden">{t('stop_reading')}</span>
        </button>
        <ProgressPath total={book.scenes.length} current={sceneIdx} />
        <div className="grow" />
        <div className="row" role="group" aria-label={t('how_read')}>
          <button type="button" className="chip" aria-pressed={modes.read} onClick={() => toggleMode('read')}>📖 {t('mode_read')}</button>
          <button type="button" className="chip" aria-pressed={modes.listen} onClick={() => toggleMode('listen')}>🎧 {t('mode_listen')}</button>
          <button type="button" className="chip" aria-pressed={modes.watch} onClick={() => toggleMode('watch')} disabled={focusMode}>🎬 {t('mode_watch')}</button>
          <button type="button" className="chip" aria-pressed={focusMode} onClick={() => { const next = !focusMode; setFocusMode(next); if (!next) setModes((m) => ({ ...m, watch: true })); logI('focus', next); }}>🎯 {t('focus_mode')}</button>
          <button type="button" className="btn btn-small" onClick={() => { narrator.current?.stop(); navigate('film', { sessionId: session.id, from: sceneIdx }); }}>🎬 {t('film_short')}</button>
        </div>
        <Hourglass usedSec={Math.max(sessionSec, rules.sessionMaxMin * 60 - minutesLeft)} maxMin={rules.sessionMaxMin} />
      </header>

      {/* ---------- Double page ---------- */}
      <div className="reader-body">
        {showText && (
          <section
            className="pane-text"
            style={{ flex: both ? `0 0 ${split * 100}%` : '1 1 100%' }}
            aria-label={t('text_zone')}
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            lang={lang}
          >
            <div className="row simplified-flag">
              <button type="button" className="chip" aria-pressed={simplified} disabled={!hasSimple} title={hasSimple ? undefined : t('no_simple')} onClick={() => { setSimplified((s) => !s); logI('simplified', !simplified); }}>
                ✂️ {t('simplified_text')}
              </button>
              {simplified && <span className="badge-tag">{t('adapted_text_flag')}</span>}
              {modes.listen && (
                narrating
                  ? <button type="button" className="btn btn-small" onClick={stopNarration}>❚❚ {t('pause_voice')}</button>
                  : <button type="button" className="btn btn-small" onClick={() => startNarration()}>🔊 {t('listen_page')}</button>
              )}
              {focusMode && (
                <>
                  <button type="button" className="btn btn-small btn-ghost" aria-label={t('prev_sentence')} onClick={() => setFocusSentence((i) => Math.max(0, i - 1))}>▲</button>
                  <button type="button" className="btn btn-small btn-ghost" aria-label={t('next_sentence')} onClick={() => setFocusSentence((i) => Math.min(page.sentences.length - 1, i + 1))}>▼</button>
                </>
              )}
            </div>
            {noVoice && <p className="banner" role="status">{t('no_voice', { lang: t(`lang_${lang}`) })}</p>}

            <ReaderText
              page={page}
              definitions={data.definitions}
              currentChar={narrating ? currentChar : null}
              highlight={profile.audio.highlight === 'none' && narrating ? 'sentence' : profile.audio.highlight}
              focusMode={focusMode}
              focusSentence={focusSentence}
              ruler={profile.display.ruler}
              onWord={onWord}
              onSayWord={onSayWord}
              onExplain={onExplain}
              explainedSentence={sidi?.explained}
              explainable={data.sentences.map((x) => Boolean(x.explain))}
            />

            {scene.question && (
              <div style={{ marginTop: 24, maxWidth: 520, fontSize: 18, letterSpacing: 'normal', wordSpacing: 'normal' }}>
                {!showQuestion ? (
                  <button type="button" className="btn btn-small" onClick={() => setShowQuestion(true)}>❓ {t('small_question')}</button>
                ) : (
                  <div className="card">
                    <QuestionCard
                      question={scene.question}
                      onAnswer={({ correct, firstTry }) => {
                        logI('quiz', scene.id, { correct, firstTry, listen: modes.listen });
                        if (correct) reward(child.id, 'quiz_correct', { scene: scene.id });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {both && (
          <button
            type="button"
            className="splitter"
            aria-label={t('splitter')}
            onPointerDown={onSplitDrag}
            onKeyDown={onSplitKey}
          />
        )}

        {showScene && (
          <section className="pane-scene" style={{ flex: both ? '1 1 0' : '1 1 100%' }} aria-label={t('scene_zone')}>
            {book.video && scene.clip ? (
              // Livre avec vraie vidéo : la page joue SON extrait (muet pendant la voix de lecture)
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                <VideoPlayer
                  compact
                  src={book.video.src}
                webm={book.video.webm}
                  poster={scene.poster}
                  range={scene.clip}
                  volume={profile.audio.volume}
                  muted={profile.audio.silent || narrating}
                  label={t('film_aria', { title: t.pick(book.title), where: t.pick(scene.where) })}
                >
                  <div className="vplayer-chars" role="group" aria-label={t('touch_character')}>
                    {scene.characters.slice(0, 3).map((c) => (
                      <button key={c.id} type="button" className="char-label" aria-pressed={selectedChar === c.id} onClick={() => onCharacter(c.id)}>
                        {profile.scene.shapes && <span aria-hidden="true">{book.characters[c.id]?.shape}</span>}
                        {t.pick(book.characters[c.id]?.name)}
                      </button>
                    ))}
                  </div>
                </VideoPlayer>
              </div>
            ) : (
              <SceneView scene={scene} profile={profile} selected={selectedChar} onSelect={onCharacter} narration={narrationProgress} clipSeconds={clipSeconds} characterNames={book.characters || {}} />
            )}
            <div className="scene-overlay">
              {reveal && (
                <div className="reveal-bubble" role="status" aria-live="polite">
                  <strong>💭 </strong>{t.pick(reveal)}
                </div>
              )}
              {scene.sound && (
                <button
                  type="button"
                  className="btn btn-small sound-caption"
                  onClick={() => playSound(scene.sound.type, profile.audio)}
                  title={profile.audio.silent ? t('silent_on') : t('play_sound')}
                >
                  {profile.audio.silent ? '🔇' : '🔊'} {t(soundKey)}
                </button>
              )}
              {!reveal && !book.video && scene.characters.length > 0 && (
                <span className="badge-tag" style={{ background: 'rgba(255,255,255,0.9)' }}>👆 {t('touch_character')}</span>
              )}
            </div>
            {!showText && page.sentences[subtitleSentence] && (
              <div className="subtitle-bar" aria-live="polite" style={book.video ? { bottom: 70 } : undefined}>{page.sentences[subtitleSentence].text}</div>
            )}
            {!showText && modes.listen && (
              <div style={{ position: 'absolute', insetInlineEnd: 12, top: 12, zIndex: 6 }}>
                {narrating
                  ? <button type="button" className="btn btn-small" onClick={stopNarration}>❚❚ {t('pause_voice')}</button>
                  : <button type="button" className="btn btn-small" onClick={() => startNarration()}>🔊 {t('listen_page')}</button>}
              </div>
            )}
          </section>
        )}

        {!showText && !showScene && (
          <section className="pane-text" style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <div className="stack" style={{ alignItems: 'center', maxWidth: 600 }}>
              <p className="read-text center">{page.sentences[subtitleSentence]?.text}</p>
              {narrating
                ? <button type="button" className="btn" onClick={stopNarration}>❚❚ {t('pause_voice')}</button>
                : <button type="button" className="btn btn-primary" onClick={() => startNarration()}>🔊 {t('listen_page')}</button>}
            </div>
          </section>
        )}
      </div>

      {/* ---------- Bas : Sidi Hkeya + action principale ---------- */}
      <footer className="reader-bottom">
        <div className="grow">
          {sidi ? (
            <SidiHkeya size={52} line={sidi.line} text={sidi.text}>
              {sidi.action === 'listen_page' && (
                <button type="button" className="btn btn-small" style={{ marginTop: 6 }} onClick={() => { setModes((m) => ({ ...m, listen: true })); setSidi(null); startNarration(); }}>
                  🔊 {t('listen_page')}
                </button>
              )}
              <button type="button" className="btn btn-small btn-ghost" style={{ marginTop: 6 }} onClick={() => setSidi(null)}>{t('close')}</button>
            </SidiHkeya>
          ) : (
            <span className="muted" style={{ fontSize: '0.9em' }}>{t('reader_tip')}</span>
          )}
        </div>
        {sceneIdx > 0 && (
          <button type="button" className="btn btn-ghost btn-small" onClick={prevPage} aria-label={t('prev_page')}>
            {t.lang === 'ar' ? '▶' : '◀'}
          </button>
        )}
        <button type="button" className="btn btn-primary" onClick={nextPage}>
          {sceneIdx === book.scenes.length - 1 ? t('finish_story') : t('next_page')} {t.lang === 'ar' ? '←' : '→'}
        </button>
      </footer>

      {/* ---------- Fenêtres : pause, objectif, arrêt ---------- */}
      {phase !== 'reading' && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(251,246,236,0.97)', zIndex: 50, display: 'grid', placeItems: 'center', padding: 16 }}
        >
          <div className="stack card" style={{ alignItems: 'center', maxWidth: 560, width: '100%' }}>
            {phase === 'pause' && (
              <>
                <SidiHkeya line="pause" size={96} />
                <p className="challenge">{t(challenge)}</p>
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => pauseAnswer('taken')}>{t('im_ready')}</button>
                  <button type="button" className="btn" onClick={() => pauseAnswer('postponed')}>{t('later')}</button>
                  <button type="button" className="btn btn-ghost" onClick={() => pauseAnswer('skipped')}>{t('skip')}</button>
                </div>
              </>
            )}
            {phase === 'goal' && (
              <>
                <SidiHkeya line="goal" size={96} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => { setPhase('reading'); setSceneIdx((i) => i + 1); }}>{t('continue_story')}</button>
                  <button type="button" className="btn" onClick={() => endSession('goal')}>{t('stop_today')}</button>
                </div>
              </>
            )}
            {phase === 'confirm_quit' && (
              <>
                <SidiHkeya text={t('quit_question')} size={80} />
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn btn-primary" onClick={() => setPhase('reading')}>{t('keep_reading')}</button>
                  <button type="button" className="btn" onClick={() => {
                    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: sceneIdx });
                    endSession('quit');
                  }}>{t('stop_reading')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!speechSupported() && modes.listen && (
        <span className="visually-hidden" role="status">{t('no_speech_api')}</span>
      )}
    </div>
  );
}
