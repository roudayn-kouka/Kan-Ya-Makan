/**
 * Plateau du film : compose une scène (décor, ambiance, personnages) et la fait
 * jouer à partir de sa piste d'images clés. La progression (0..1) est lue dans
 * `progressRef` à chaque image, sans re-rendu React : c'est le lecteur de film
 * (ou la narration de la page) qui la fait avancer.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Decor, Dragon, Bird, Child, SoundVisual, AMBIANCES } from './kit.jsx';
import { sampleTrack, trackOf, soundsBetween } from '../../engine/film.js';

const LABEL_Y = { dragon: 2.55, oiseau: 0.55, yasmine: 1.75, adam: 1.75 };
// anneau de sélection à la taille de chaque personnage
const RING = { dragon: [0.95, 1.1], yasmine: [0.45, 0.56], adam: [0.45, 0.56] };

function ActorBody({ id, pal, action, moving, animate }) {
  if (id === 'dragon') return <Dragon pal={pal} animation={moving ? 'marcher' : action} animate={animate} />;
  if (id === 'oiseau') return <Bird pal={pal} animate={animate} flying={action !== 'pose'} />;
  if (id === 'yasmine') return <Child pal={pal} color={pal.yasmine} animate={animate} seed={1} moving={moving || action === 'rire'} />;
  if (id === 'adam') return <Child pal={pal} color={pal.adam} hair="#4a3423" animate={animate} seed={2.3} moving={moving || action === 'rire'} />;
  return null;
}

export default function FilmStage({
  scene,
  pal,
  progressRef,
  reduced = false,
  singleMotion = false,
  selected = null,
  onSelect,
  interactiveIds = [],
  onLabels,
  onSound,
  showSoundVisual = true,
  playingRef,
}) {
  const { camera, size } = useThree();
  const track = useMemo(() => trackOf(scene), [scene]);
  const ids = useMemo(() => Object.keys(track.actors || {}), [track]);
  const groups = useRef({});
  const lastP = useRef(-1);
  const lastLabels = useRef('');
  const look = useMemo(() => new THREE.Vector3(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const [states, setStates] = useState(() => {
    const s = sampleTrack(track, progressRef.current ?? 0, { reduced });
    return Object.fromEntries(Object.entries(s.actors).map(([id, a]) => [id, { action: a.action, moving: a.moving }]));
  });
  const statesRef = useRef(states);
  statesRef.current = states;

  useEffect(() => { lastP.current = -1; }, [scene]);

  useFrame(() => {
    const p = progressRef.current ?? 0;
    const s = sampleTrack(track, p, { reduced });

    if (s.camera) {
      camera.position.set(...s.camera.pos);
      look.set(...s.camera.look);
      camera.lookAt(look);
    }

    let changed = false;
    const next = { ...statesRef.current };
    for (const id of ids) {
      const a = s.actors[id];
      const g = groups.current[id];
      if (!a || !g) continue;
      g.position.set(...a.pos);
      g.rotation.y = a.rotY;
      const cur = next[id];
      if (!cur || cur.action !== a.action || cur.moving !== a.moving) {
        next[id] = { action: a.action, moving: a.moving };
        changed = true;
      }
    }
    if (changed) setStates(next);

    // Sons de la piste (uniquement en avançant pendant la lecture)
    if (onSound && playingRef?.current && lastP.current >= 0 && p > lastP.current) {
      soundsBetween(track, lastP.current, p).forEach((type) => onSound(type));
    }
    lastP.current = p;

    // Étiquettes des personnages à toucher, projetées en pixels écran
    if (onLabels) {
      const out = [];
      for (const id of interactiveIds) {
        const g = groups.current[id];
        if (!g) continue;
        v.set(g.position.x, g.position.y + (LABEL_Y[id] ?? 2), g.position.z).project(camera);
        if (v.z > 1) continue; // derrière la caméra
        out.push({ id, x: Math.round((v.x * 0.5 + 0.5) * size.width), y: Math.round((-v.y * 0.5 + 0.5) * size.height) });
      }
      const key = out.map((o) => `${o.id}:${o.x}:${o.y}`).join('|');
      if (key !== lastLabels.current) {
        lastLabels.current = key;
        onLabels(out);
      }
    }
  });

  const amb = AMBIANCES[scene.ambiance] || AMBIANCES.matin;
  // Un seul élément animé à la fois : le personnage choisi, sinon le premier qui bouge
  const mover = selected || ids.find((id) => states[id]?.moving) || ids[0];

  return (
    <>
      <color attach="background" args={[pal[amb.sky] || pal.sky]} />
      <hemisphereLight args={[pal[amb.sky] || pal.sky, pal.ground, amb.hemi]} />
      <directionalLight position={[5, 8, 5]} intensity={amb.dir} color={amb.dirColor} />
      <Decor decor={scene.decor} pal={pal} />
      {ids.map((id) => {
        const st = states[id] || {};
        const interactive = interactiveIds.includes(id);
        return (
          <group key={id} ref={(g) => { if (g) groups.current[id] = g; }}>
            <group
              onClick={interactive ? (e) => { e.stopPropagation(); onSelect?.(id); } : undefined}
              onPointerOver={interactive ? () => (document.body.style.cursor = 'pointer') : undefined}
              onPointerOut={interactive ? () => (document.body.style.cursor = '') : undefined}
            >
              <ActorBody
                id={id}
                pal={pal}
                action={st.action}
                moving={st.moving}
                animate={!reduced && (!singleMotion || id === mover)}
              />
            </group>
            {selected === id && RING[id] && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[...RING[id], 32]} />
                <meshBasicMaterial color="#1f2a44" />
              </mesh>
            )}
          </group>
        );
      })}
      {scene.sound && showSoundVisual && (
        <SoundVisual
          kind={scene.sound.visual}
          anchor={scene.sound.visual === 'notes' ? [0.9, 2.2, 0] : [0, 1.3, 0.8]}
          animate={!reduced && !singleMotion}
        />
      )}
    </>
  );
}
