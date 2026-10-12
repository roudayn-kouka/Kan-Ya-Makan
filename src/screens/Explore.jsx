/**
 * Écran 5 — Explorer (livres éducatifs, 6.5) :
 * Lire → Explorer (3D) → Animer → Explique-moi → Quiz, pour chaque concept.
 * Le quiz s'adapte (ajusteur de difficulté) et Sidi Hkeya donne des indices,
 * jamais la réponse. Les résultats partent au tableau de bord du parent.
 */
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore, useActiveChild } from '../state/store.jsx';
import { useT } from '../i18n/index.js';
import { useBook } from '../data/library.js';
import { HEART_PARTS, HEART_QUESTIONS, PATH_NAMES } from '../data/eduBooks.js';
import { buildPage, locate } from '../engine/text.js';
import { readingVars, paletteFor, prefersReducedMotion, hasWebGL } from '../engine/adaptation.js';
import { Narrator } from '../engine/speech.js';
import { useSessionTimer, daySeconds } from '../engine/timeRules.js';
import { initialQuiz, recordAnswer, nextQuestion, markAsked, choicesForLevel } from '../engine/quiz.js';
import HeartModel from '../components/three/Heart.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import ReaderText from '../components/ReaderText.jsx';
import SidiHkeya from '../components/SidiHkeya.jsx';
import { Hourglass } from '../components/ui.jsx';
import { sidiLine } from '../data/sidi.js';

const ALL_STEPS = ['lire', 'video', 'explorer', 'animer', 'comprendre', 'quiz'];
const STEP_ICONS = { lire: '📖', video: '🎬', explorer: '🔍', animer: '▶️', comprendre: '💬', quiz: '❓' };
const QUESTIONS_PER_CONCEPT = 3;
const partName = (id, pick) => pick(HEART_PARTS[id]?.name || PATH_NAMES[id]);

export default function Explore({ params }) {
  const { state, dispatch, navigate, reward, log } = useStore();
  const child = useActiveChild();
  const t = useT();
  const session = state.sessions.find((s) => s.id === params.sessionId);
  const book = useBook(session?.bookId);
  const profile = child?.profile;
  const rules = child?.rules;
  const lang = t.lang;

  const [concept, setConcept] = useState(session?.startScene || 0);
  const [step, setStep] = useState('lire');
  const [selected, setSelected] = useState(null);
  const [animate, setAnimate] = useState(false);
  const [labels, setLabels] = useState([]);
  const [simplified, setSimplified] = useState(Boolean(profile?.text.simplified));
  const [narrating, setNarrating] = useState(false);
  const [currentChar, setCurrentChar] = useState(null);
  const [quiz, setQuiz] = useState(() => initialQuiz(profile?.preset === 'comprehension' ? 1 : 2));
  const [question, setQuestion] = useState(null);
  const [tried, setTried] = useState([]);
  const [solved, setSolved] = useState(false);
  const [hint, setHint] = useState(false);
  const [orderPicks, setOrderPicks] = useState([]);
  const [answered, setAnswered] = useState(0);
  const [sidiMsg, setSidiMsg] = useState(null);
  const [videoT, setVideoT] = useState(0);
  const videoRef = useRef(null);
  const [webgl] = useState(() => hasWebGL());
  const rotation = useRef(0);
  const narrator = useRef(null);
  const qStart = useRef(Date.now());
  if (!narrator.current) narrator.current = new Narrator();

  const flush = useCallback((sec) => child && dispatch({ type: 'ADD_DAY_TIME', childId: child.id, seconds: sec }), [child, dispatch]);
  const sessionSec = useSessionTimer(true, flush);
  const daySec = child ? daySeconds(state.dailyTime, child.id) : 0;

  useEffect(() => () => narrator.current?.stop(), []);
  useEffect(() => { narrator.current?.stop(); setNarrating(false); setCurrentChar(null); }, [concept, step, simplified]);

  const scene = book?.scenes[concept];
  const data = scene?.[lang] || scene?.fr;
  const page = useMemo(() => (data ? buildPage(data.sentences.map((s) => (simplified ? s.simple : s.t))) : null), [data, simplified]);
  const logI = useCallback((type, value, meta) => child && session && log(child.id, session.id, type, value, meta), [log, child, session]);

  const endSession = useCallback((reason) => {
    narrator.current?.stop();
    if (reason !== 'quit') reward(child.id, 'session_complete', { session: session.id, edu: true });
    dispatch({ type: 'END_SESSION', id: session.id, patch: { endReason: reason, pagesDone: concept + (reason === 'finished' ? 1 : 0), lastModes: { read: true, explore: true } } });
    navigate('finished', { sessionId: session.id, reason });
  }, [child, session, concept, reward, dispatch, navigate]);

  const pickQuestion = useCallback((qs) => {
    const q = nextQuestion(HEART_QUESTIONS, qs, book.scenes[concept].id);
    setQuestion(q);
    setTried([]);
    setSolved(false);
    setHint(false);
    setOrderPicks([]);
    setSelected(null);
    qStart.current = Date.now();
    if (q) setQuiz(markAsked(qs, q.id));
  }, [book, concept]);

  if (!child || !session || !book || !scene) {
    return <main className="screen"><p>{t('nothing_here')}</p><button type="button" className="btn" onClick={() => navigate('who')}>{t('back')}</button></main>;
  }

  /* ---------------- Réponses ---------------- */
  const answer = (correct, choiceKey) => {
    if (solved || !question) return;
    const firstTry = tried.length === 0;
    const r = recordAnswer(quiz, { id: question.id, correct, usedHint: hint, ms: Date.now() - qStart.current });
    setQuiz(r.state);
    logI('quiz', question.id, { correct, firstTry, edu: true, level: quiz.level, hint });
    if (correct) {
      setSolved(true);
      setAnswered((n) => n + 1);
      reward(child.id, 'quiz_correct', { edu: book.id, q: question.id });
      setSidiMsg({ line: 'bravo' });
    } else {
      setTried((x) => [...x, choiceKey]);
      if (r.offerHint) setHint(true);
      setSidiMsg({ text: t.pick(question).hint });
    }
    if (r.levelChanged) logI('quiz_level', r.state.level, { change: r.levelChanged });
  };

  const onPart = (id) => {
    if (!id) { setSelected(null); return; }
    setSelected(id);
    logI('explore_part', id, { concept: scene.id });
    if (step === 'quiz' && question && !solved) {
      if (question.type === 'touch') answer(id === question.target, id);
      if (question.type === 'order') addOrder(id);
      return;
    }
    if (step !== 'quiz') setStep((s) => (s === 'lire' ? 'explorer' : s));
  };

  const addOrder = (id) => {
    if (!question.items.includes(id) || orderPicks.includes(id)) return;
    const next = [...orderPicks, id];
    setOrderPicks(next);
    if (next.length === question.items.length) {
      const ok = next.every((x, i) => x === question.items[i]);
      answer(ok, next.join('>'));
      if (!ok) setTimeout(() => setOrderPicks([]), 900);
    }
  };

  const conceptDone = answered >= QUESTIONS_PER_CONCEPT || (step === 'quiz' && !question);
  const nextConcept = () => {
    reward(child.id, 'scene_complete', { scene: scene.id, book: book.id, edu: true });
    logI('page', scene.id, { modes: { read: true, explore: true } });
    const limit = sessionSec >= rules.sessionMaxMin * 60 || daySec >= rules.dayMaxMin * 60;
    if (concept >= book.scenes.length - 1) {
      reward(child.id, 'book_complete', { book: book.id });
      dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: 0 });
      return endSession('finished');
    }
    dispatch({ type: 'SET_BOOKMARK', childId: child.id, bookId: book.id, scene: concept + 1 });
    if (limit) return endSession('limit');
    setConcept((c) => c + 1);
    setVideoT(0);
    setStep('lire');
    setAnswered(0);
    setQuestion(null);
    setAnimate(false);
    setSelected(null);
    setSidiMsg(null);
  };

  const goStep = (s) => {
    setStep(s);
    setSidiMsg(null);
    logI('edu_step', s, { concept: scene.id });
    if (s === 'animer') setAnimate(true);
    if (s === 'quiz' && !question) pickQuestion(quiz);
  };

  /* ---------------- Affichage ---------------- */
  const pal = paletteFor(profile);
  // étape Vidéo seulement si le livre a une vidéo ; chapitres du concept courant
  const STEPS = ALL_STEPS.filter((s) => s !== 'video' || book.video);
  const vChapters = (book.video?.chapters || []).filter((c) => c.concept === scene.id);
  const curChapter = vChapters.find((c) => videoT >= c.start && videoT < c.end) || vChapters[0];
  const reduced = prefersReducedMotion(profile);
  const vars = readingVars(profile, lang);
  const q = question ? t.pick(question) : null;
  const orderLabels = question?.type === 'order' ? [...question.items].sort() : [];

  return (
    <div className="reader" style={vars}>
      <header className="reader-top">
        <button type="button" className="btn btn-small btn-ghost" onClick={() => endSession('quit')} aria-label={t('stop_reading')}>✕</button>
        <strong>{t.pick(book.title)}</strong>
        <span className="badge-tag">{t('concept_n', { n: concept + 1, total: book.scenes.length })}</span>
        <div className="grow" />
        <nav className="edu-steps" aria-label={t('edu_steps')}>
          {STEPS.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={step === s} onClick={() => goStep(s)}>
              <span aria-hidden="true">{STEP_ICONS[s]}</span> {t(`edu_${s}`)}
            </button>
          ))}
        </nav>
        <Hourglass usedSec={sessionSec} maxMin={rules.sessionMaxMin} />
      </header>

      <div className="reader-body">
        <section className="pane-text" style={{ flex: '0 0 46%' }} aria-live="polite">
          {step === 'lire' && (
            <>
              <div className="row simplified-flag">
                <button type="button" className="chip" aria-pressed={simplified} onClick={() => setSimplified((x) => !x)}>✂️ {t('simplified_text')}</button>
                {simplified && <span className="badge-tag">{t('adapted_text_flag')}</span>}
                {narrating
                  ? <button type="button" className="btn btn-small" onClick={() => { narrator.current.stop(); setNarrating(false); setCurrentChar(null); }}>❚❚ {t('pause_voice')}</button>
                  : <button type="button" className="btn btn-small" onClick={() => {
                    setNarrating(true);
                    narrator.current.speak({ page, lang, rate: profile.audio.rate, volume: profile.audio.volume, voiceURI: profile.audio.voiceURI, muted: profile.audio.silent,
                      onPosition: setCurrentChar, onEnd: () => { setNarrating(false); setCurrentChar(null); } });
                  }}>🔊 {t('listen_page')}</button>}
              </div>
              <ReaderText
                page={page}
                definitions={data.definitions}
                currentChar={narrating ? currentChar : null}
                highlight={profile.audio.highlight === 'none' ? 'sentence' : profile.audio.highlight}
                focusMode={false}
                focusSentence={currentChar != null ? locate(page, currentChar).sentence : 0}
                ruler={profile.display.ruler}
                onWord={(w) => logI('word', w.key)}
                onSayWord={(w) => narrator.current.sayWord(w, { lang, volume: profile.audio.volume, voiceURI: profile.audio.voiceURI })}
                onExplain={(i) => { setSidiMsg({ text: data.sentences[i].explain }); logI('sentence', i, { scene: scene.id }); }}
              />
              <button type="button" className="btn btn-primary" style={{ marginTop: 24 }} onClick={() => goStep(STEPS.includes('video') ? 'video' : 'explorer')}>{STEPS.includes('video') ? `🎬 ${t('edu_go_video')}` : `🔍 ${t('edu_go_explore')}`}</button>
            </>
          )}

          {step === 'video' && vChapters.length > 0 && (
            <div className="stack">
              <h2>🎬 {t('edu_video')}</h2>
              <p className="muted" style={{ margin: 0 }}>{t('edu_video_help')}</p>
              <ol className="stack" style={{ listStyle: 'none', padding: 0, margin: 0, gap: 8 }}>
                {vChapters.map((c, i) => {
                  const here = videoT >= c.start && videoT < c.end;
                  return (
                    <li key={c.start}>
                      <button type="button" className={`need-card ${here ? '' : ''}`} aria-pressed={here} aria-current={here ? 'step' : undefined}
                        onClick={() => { videoRef.current?.seek(c.start + 0.05); setVideoT(c.start); logI('video_chapter', c.start, { concept: scene.id }); }}>
                        <span className="need-emoji" aria-hidden="true">{i + 1}</span>
                        <span><strong>{t.pick(c.title)}</strong><br /><span style={{ fontSize: '0.95em' }}>{t.pick(c.desc)}</span></span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => goStep('explorer')}>🔍 {t('edu_go_explore')}</button>
            </div>
          )}

          {step === 'explorer' && (
            <div className="stack">
              <h2>{t('edu_explorer')}</h2>
              <p style={{ fontSize: 18 }}>{data.explore}</p>
              {selected && (HEART_PARTS[selected] || PATH_NAMES[selected]) && (
                <div className="card stack" style={{ gap: 6 }}>
                  <strong style={{ fontSize: '1.15em' }}>{partName(selected, t.pick)}</strong>
                  <span>{HEART_PARTS[selected] ? t.pick(HEART_PARTS[selected].desc) : t('lungs_desc')}</span>
                  <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => narrator.current.sayWord(`${partName(selected, t.pick)}. ${HEART_PARTS[selected] ? t.pick(HEART_PARTS[selected].desc) : t('lungs_desc')}`, { lang, volume: profile.audio.volume, voiceURI: profile.audio.voiceURI, rate: profile.audio.rate })}>🔊 {t('listen_word')}</button>
                </div>
              )}
              {!selected && <span className="badge-tag">👆 {t('touch_part')}</span>}
              <div className="row">
                <button type="button" className="btn btn-primary" onClick={() => goStep('animer')}>▶️ {t('edu_animer')}</button>
              </div>
            </div>
          )}

          {step === 'animer' && (
            <div className="stack">
              <h2>{t('edu_animer')}</h2>
              <p style={{ fontSize: 18 }}>{t('animate_help')}</p>
              <div className="card stack" style={{ gap: 6 }}>
                <span><strong aria-hidden="true">●</strong> {t('blood_poor')}</span>
                <span><strong aria-hidden="true">▲</strong> {t('blood_rich')}</span>
              </div>
              <ol className="stack" style={{ paddingInlineStart: 22, margin: 0, gap: 4 }}>
                {['oreillette_droite', 'ventricule_droit', 'poumons', 'oreillette_gauche', 'ventricule_gauche', 'aorte'].map((id) => (
                  <li key={id}>{partName(id, t.pick)}</li>
                ))}
              </ol>
              <div className="row">
                <button type="button" className="btn" aria-pressed={animate} onClick={() => setAnimate((a) => !a)}>{animate ? `❚❚ ${t('pause_voice')}` : `▶ ${t('edu_animer')}`}</button>
                <button type="button" className="btn btn-primary" onClick={() => goStep('comprendre')}>💬 {t('edu_comprendre')}</button>
              </div>
              {reduced && <p className="muted">{t('reduced_motion_note')}</p>}
            </div>
          )}

          {step === 'comprendre' && (
            <div className="stack">
              <SidiHkeya live={false} text={data.sentences.map((s) => s.explain).join(' ')} />
              <p className="muted">{t('explain_note')}</p>
              <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => goStep('quiz')}>❓ {t('edu_quiz')}</button>
            </div>
          )}

          {step === 'quiz' && (
            <div className="stack" style={{ maxWidth: 560, letterSpacing: 'normal' }}>
              {question && q && (
                <div className="card question-card">
                  <span className="muted" style={{ fontSize: 14 }}>{t('question_n', { n: answered + (solved ? 0 : 1), total: QUESTIONS_PER_CONCEPT })}</span>
                  <strong style={{ fontSize: '1.15em' }}>{q.q}</strong>

                  {question.type === 'vf' && [true, false].map((v) => (
                    <button key={String(v)} type="button" className="btn choice-btn"
                      data-state={solved && v === q.answer ? 'correct' : tried.includes(String(v)) ? 'tried' : ''}
                      onClick={() => !tried.includes(String(v)) && answer(v === q.answer, String(v))}>
                      {v ? t('true') : t('false')}
                    </button>
                  ))}

                  {question.type === 'qcm' && choicesForLevel(q, quiz.level).map(({ c, i }) => (
                    <button key={i} type="button" className="btn choice-btn"
                      data-state={solved && i === q.correct ? 'correct' : tried.includes(i) ? 'tried' : ''}
                      onClick={() => !tried.includes(i) && answer(i === q.correct, i)}>
                      {c}
                    </button>
                  ))}

                  {question.type === 'touch' && (
                    <>
                      <span className="badge-tag">👆 {t('touch_in_model')}</span>
                      {/* alternative sans pointage (clavier, contacteur) */}
                      <div className="row">
                        {Object.keys(HEART_PARTS).map((id) => (
                          <button key={id} type="button" className="btn btn-small choice-btn" style={{ width: 'auto' }}
                            data-state={solved && id === question.target ? 'correct' : tried.includes(id) ? 'tried' : ''}
                            onClick={() => !tried.includes(id) && onPart(id)}>
                            {partName(id, t.pick)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {question.type === 'order' && (
                    <>
                      <div className="row" aria-live="polite">
                        {question.items.map((_, i) => (
                          <span key={i} className="code-slot" style={{ width: 'auto', minWidth: 120, padding: '0 10px', fontSize: 15 }}>
                            {orderPicks[i] ? `${i + 1}. ${partName(orderPicks[i], t.pick)}` : `${i + 1}.`}
                          </span>
                        ))}
                      </div>
                      <div className="row">
                        {orderLabels.map((id) => (
                          <button key={id} type="button" className="btn btn-small" disabled={orderPicks.includes(id) || solved} onClick={() => addOrder(id)}>
                            {partName(id, t.pick)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {!solved && !hint && (
                    <button type="button" className="btn btn-small btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => { setHint(true); setSidiMsg({ text: q.hint }); logI('hint', question.id); }}>
                      💡 {t('need_hint')}
                    </button>
                  )}
                  {solved && (answered < QUESTIONS_PER_CONCEPT
                    ? <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => { setSidiMsg(null); pickQuestion(quiz); }}>{t('next_question')} →</button>
                    : null)}
                </div>
              )}
              {conceptDone && (
                <div className="card stack">
                  <SidiHkeya line="bravo" size={64} />
                  <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={nextConcept}>
                    {concept >= book.scenes.length - 1 ? t('finish_story') : t('next_concept')} →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="pane-scene" style={{ flex: '1 1 0', background: step === 'video' ? '#10131c' : '#eef3f7' }} aria-label={step === 'video' ? t('edu_video') : t('model_zone')}>
          {step === 'video' && vChapters.length > 0 ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              <VideoPlayer
                ref={videoRef}
                src={book.video.src}
                webm={book.video.webm}
                poster={vChapters[0].poster}
                range={[vChapters[0].start, vChapters[vChapters.length - 1].end]}
                chapters={vChapters.map((c) => ({ start: c.start, end: c.end, label: t.pick(c.title) }))}
                volume={profile.audio.volume}
                muted={profile.audio.silent}
                caption={curChapter ? t.pick(curChapter.desc) : null}
                captionTag={curChapter ? t.pick(curChapter.title) : null}
                onTime={setVideoT}
                onPlayChange={(p) => logI(p ? 'video_play' : 'video_pause', scene.id, { edu: true })}
                label={t('edu_video')}
              />
            </div>
          ) : webgl ? (
            <div
              style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
              onPointerDown={(e) => {
                const x0 = e.clientX; const r0 = rotation.current;
                const move = (ev) => { rotation.current = r0 + (ev.clientX - x0) * 0.01; };
                const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
              }}
            >
              <Canvas camera={{ position: [0, 0.4, 6.6], fov: 45 }} dpr={[1, 2]} role="img" aria-label={t('heart_aria')} onPointerMissed={() => setSelected(null)}>
                <color attach="background" args={['#eef3f7']} />
                <hemisphereLight args={['#ffffff', '#c9d3dc', 1.1]} />
                <directionalLight position={[3, 5, 6]} intensity={1.1} />
                <Suspense fallback={null}>
                  <HeartModel pal={pal} selected={selected} onSelect={onPart} animate={animate} reduced={reduced} rotationRef={rotation} onLabels={setLabels} />
                </Suspense>
              </Canvas>
              {labels.filter((l) => !l.behind).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className="char-label"
                  aria-pressed={selected === l.id}
                  onClick={(e) => { e.stopPropagation(); onPart(l.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{ position: 'absolute', left: l.x, top: l.y, transform: 'translate(-50%, -50%)', zIndex: 4, fontSize: 13 }}
                >
                  {partName(l.id, t.pick)}
                </button>
              ))}
            </div>
          ) : (
            <div className="stack" style={{ padding: 20 }}>
              <p>{t('no_3d_heart')}</p>
              {Object.keys(HEART_PARTS).map((id) => (
                <button key={id} type="button" className="btn btn-small" onClick={() => onPart(id)}>{partName(id, t.pick)}</button>
              ))}
            </div>
          )}
          {step !== 'video' && <div className="row" style={{ position: 'absolute', bottom: 12, insetInlineStart: 12, zIndex: 5 }}>
            <button type="button" className="btn btn-small" aria-label={t('rotate_left')} onClick={() => { rotation.current -= 0.5; }}>⟲</button>
            <button type="button" className="btn btn-small" aria-label={t('rotate_right')} onClick={() => { rotation.current += 0.5; }}>⟳</button>
            <span className="badge-tag" style={{ background: '#fff' }}>{t('simplified_model')}</span>
          </div>}
        </section>
      </div>

      <footer className="reader-bottom">
        <div className="grow">
          {sidiMsg ? (
            <SidiHkeya size={52} line={sidiMsg.line} text={sidiMsg.text}>
              <button type="button" className="btn btn-small btn-ghost" style={{ marginTop: 6 }} onClick={() => setSidiMsg(null)}>{t('close')}</button>
            </SidiHkeya>
          ) : (
            <span className="muted" style={{ fontSize: '0.9em' }}>{sidiLine('help', lang).sub}</span>
          )}
        </div>
      </footer>
    </div>
  );
}
