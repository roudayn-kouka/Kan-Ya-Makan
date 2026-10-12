/**
 * Scène animée d'une page (lecteur et écran « On se prépare »).
 * Utilise le même moteur que le film complet : la page joue son extrait du film.
 *  - pendant la narration, l'image suit la voix (progression = position dans le texte) ;
 *  - sinon, ▶ joue l'extrait animé de la page ; au repos, on voit la pose finale
 *    (tous les personnages de la page présents, prêts à être touchés).
 * Secours : illustration 2D si l'appareil n'a pas la 3D ou si le parent le préfère.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { paletteFor, prefersReducedMotion, hasWebGL } from '../engine/adaptation.js';
import { useT } from '../i18n/index.js';
import FilmStage from './three/FilmStage.jsx';
import Fallback2D from './Fallback2D.jsx';
import { STORY } from '../data/story.js';
import { playSound } from '../engine/sound.js';

const MAX_HOTSPOTS = 3;

export default function SceneView({
  scene,
  profile,
  selected,
  onSelect,
  interactive = true,
  narration = null,      // progression 0..1 de la voix sur la page, ou null
  clipSeconds = 12,
  characterNames = STORY.characters,
  showPlay = true,
}) {
  const t = useT();
  const [webgl] = useState(() => hasWebGL());
  const [labels, setLabels] = useState([]);
  const [clip, setClip] = useState(false);
  const progressRef = useRef(1);
  const playingRef = useRef(false);
  const target = useRef(1);
  const raf = useRef(null);
  const pal = paletteFor(profile);
  const reduced = prefersReducedMotion(profile);
  const interactiveIds = interactive ? scene.characters.slice(0, MAX_HOTSPOTS).map((c) => c.id) : [];

  // Changement de page : pose finale, extrait arrêté
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    setClip(false);
    progressRef.current = 1;
    target.current = 1;
  }, [scene]);

  // La narration pilote l'image
  useEffect(() => {
    if (narration == null) {
      playingRef.current = clip;
      return;
    }
    cancelAnimationFrame(raf.current);
    setClip(false);
    playingRef.current = true;
    // 0.08 → 0.92 : l'image a un temps d'installation et une fin après la dernière phrase
    target.current = 0.08 + 0.84 * narration;
    if (progressRef.current >= 0.999 && narration < 0.05) progressRef.current = 0;
    const step = () => {
      progressRef.current += (target.current - progressRef.current) * 0.06;
      raf.current = requestAnimationFrame(step);
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [narration, clip]);

  // Fin de narration : l'image termine l'action de la page
  useEffect(() => {
    if (narration != null) return undefined;
    if (progressRef.current >= 0.999 || clip) return undefined;
    const start = performance.now();
    const from = progressRef.current;
    const step = (now) => {
      const u = Math.min(1, (now - start) / 1500);
      progressRef.current = from + (1 - from) * u;
      if (u < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [narration, clip]);

  const playClip = () => {
    cancelAnimationFrame(raf.current);
    setClip(true);
    playingRef.current = true;
    progressRef.current = 0;
    const start = performance.now();
    const step = (now) => {
      const u = Math.min(1, (now - start) / (clipSeconds * 1000));
      progressRef.current = u;
      if (u < 1) raf.current = requestAnimationFrame(step);
      else { setClip(false); playingRef.current = false; }
    };
    raf.current = requestAnimationFrame(step);
  };

  if (!webgl || profile.scene.renderMode === 'illustration') {
    return <Fallback2D scene={scene} profile={profile} selected={selected} onSelect={onSelect} interactive={interactive} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 3, 9], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        aria-label={t('scene_aria', { where: t.pick(scene.where) })}
        role="img"
        onPointerMissed={() => onSelect?.(null)}
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
            onSelect={onSelect}
            interactiveIds={interactiveIds}
            onLabels={interactive ? setLabels : undefined}
            onSound={(type) => playSound(type, profile.audio)}
            showSoundVisual={profile.audio.visualEquivalents}
          />
        </Suspense>
      </Canvas>
      {interactive && labels.map((l) => {
        const info = characterNames[l.id];
        return (
          <button
            key={l.id}
            type="button"
            className="char-label"
            aria-pressed={selected === l.id}
            onClick={() => onSelect?.(l.id)}
            style={{ position: 'absolute', left: l.x, top: l.y, transform: 'translate(-50%, -100%)', zIndex: 4 }}
          >
            {profile.scene.shapes && <span aria-hidden="true">{info?.shape}</span>}
            {t.pick(info?.name)}
          </button>
        );
      })}
      {showPlay && narration == null && !clip && (
        <button
          type="button"
          className="btn btn-small"
          onClick={playClip}
          style={{ position: 'absolute', insetInlineEnd: 12, bottom: 12, zIndex: 5 }}
        >
          ▶ {t('play_page_clip')}
        </button>
      )}
    </div>
  );
}
