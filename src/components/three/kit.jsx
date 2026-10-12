/**
 * Kit d'assets 3D low-poly (6 bis D) : personnages, décors, équivalents visuels des sons.
 * Construit en primitives Three.js ; chaque composant peut être remplacé par un modèle
 * glTF/GLB fait dans Blender sans toucher au reste du moteur.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function Mat({ color, ...rest }) {
  return <meshStandardMaterial color={color} flatShading roughness={0.85} metalness={0} {...rest} />;
}

/** Nombre pseudo-aléatoire déterministe (même décor à chaque affichage). */
export function rand(seed) {
  const x = Math.sin(seed * 999.13) * 43758.5453;
  return x - Math.floor(x);
}

export function Dragon({ pal, animation, animate }) {
  const body = useRef();
  const head = useRef();
  const wingL = useRef();
  const wingR = useRef();
  const root = useRef();

  useEffect(() => {
    // Pose statique fidèle au texte, même sans animation
    if (head.current) head.current.rotation.x = animation === 'baisser_tete' ? 0.55 : 0;
  }, [animation]);

  useFrame(({ clock }) => {
    if (!animate) return;
    const t = clock.getElapsedTime();
    if (body.current) body.current.scale.y = 0.9 * (1 + 0.03 * Math.sin(t * 2));
    if (head.current) {
      const h = head.current.rotation;
      const lerp = THREE.MathUtils.lerp;
      // chaque pose revient doucement au neutre quand l'action change
      h.y = animation === 'regarder' ? 0.35 * Math.sin(t * 0.6) : lerp(h.y, 0, 0.06);
      if (animation === 'baisser_tete') h.x = lerp(h.x, 0.55, 0.05);
      else if (animation === 'raconter') h.x = 0.08 * Math.sin(t * 3);
      else h.x = lerp(h.x, 0, 0.06);
    }
    const flap = animation === 'raconter' || animation === 'marcher' ? 0.15 : 0.05;
    if (wingL.current) wingL.current.rotation.z = 0.7 + flap * Math.sin(t * 2.5);
    if (wingR.current) wingR.current.rotation.z = -0.7 - flap * Math.sin(t * 2.5);
    if (root.current) root.current.position.y = animation === 'marcher' ? Math.abs(Math.sin(t * 3)) * 0.08 : 0;
  });

  return (
    <group ref={root}>
      <group ref={body} position={[0, 0.85, 0]} scale={[1, 0.9, 1.15]}>
        <mesh>
          <sphereGeometry args={[0.72, 7, 5]} />
          <Mat color={pal.dragon} />
        </mesh>
        <mesh position={[0, -0.05, 0.42]} scale={[0.75, 0.8, 0.45]}>
          <sphereGeometry args={[0.55, 6, 4]} />
          <Mat color={pal.dragonBelly} />
        </mesh>
      </group>
      {/* pattes */}
      {[[-0.35, 0.35], [0.35, 0.35], [-0.35, -0.35], [0.35, -0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.13, 0.16, 0.4, 5]} />
          <Mat color={pal.dragon} />
        </mesh>
      ))}
      {/* ailes */}
      <mesh ref={wingL} position={[0.62, 1.2, -0.15]} rotation={[0, 0, 0.7]} scale={[1, 1, 0.18]}>
        <coneGeometry args={[0.45, 1.1, 3]} />
        <Mat color={pal.dragonBelly} />
      </mesh>
      <mesh ref={wingR} position={[-0.62, 1.2, -0.15]} rotation={[0, 0, -0.7]} scale={[1, 1, 0.18]}>
        <coneGeometry args={[0.45, 1.1, 3]} />
        <Mat color={pal.dragonBelly} />
      </mesh>
      {/* queue */}
      <mesh position={[0, 0.55, -0.95]} rotation={[-1.9, 0, 0]}>
        <coneGeometry args={[0.2, 0.9, 5]} />
        <Mat color={pal.dragon} />
      </mesh>
      {/* tête */}
      <group ref={head} position={[0, 1.7, 0.45]}>
        <mesh>
          <sphereGeometry args={[0.46, 7, 5]} />
          <Mat color={pal.dragon} />
        </mesh>
        <mesh position={[0, -0.08, 0.38]} scale={[1, 0.7, 1]}>
          <sphereGeometry args={[0.25, 6, 4]} />
          <Mat color={pal.dragonBelly} />
        </mesh>
        {[-0.17, 0.17].map((x) => (
          <group key={x}>
            <mesh position={[x, 0.1, 0.38]}>
              <sphereGeometry args={[0.07, 8, 6]} />
              <meshStandardMaterial color="#15171c" />
            </mesh>
            <mesh position={[x * 1.1, 0.42, -0.05]} rotation={[-0.3, 0, x > 0 ? -0.35 : 0.35]}>
              <coneGeometry args={[0.08, 0.3, 4]} />
              <Mat color={pal.dragonBelly} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** flying=false : l'oiseau est posé (ailes repliées, petit hochement de tête). */
export function Bird({ pal, animate, flying = true }) {
  const root = useRef();
  const wl = useRef();
  const wr = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!flying) {
      if (root.current) root.current.position.y = 0;
      if (wl.current) wl.current.rotation.z = 1.35;
      if (wr.current) wr.current.rotation.z = -1.35;
      if (root.current && animate) root.current.rotation.x = 0.08 * Math.max(0, Math.sin(t * 1.7));
      return;
    }
    if (!animate) return;
    if (root.current) root.current.position.y = 0.12 * Math.sin(t * 2);
    const f = Math.sin(t * 12) * 0.6;
    if (wl.current) wl.current.rotation.z = 0.6 + f;
    if (wr.current) wr.current.rotation.z = -0.6 - f;
  });
  return (
    <group ref={root} scale={0.62}>
      <mesh>
        <sphereGeometry args={[0.38, 6, 4]} />
        <Mat color={pal.bird} />
      </mesh>
      <mesh position={[0, 0.32, 0.25]}>
        <sphereGeometry args={[0.26, 6, 4]} />
        <Mat color={pal.bird} />
      </mesh>
      <mesh position={[0, 0.3, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.2, 4]} />
        <Mat color="#f7c744" />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.4, 0.46]}>
          <sphereGeometry args={[0.045, 6, 5]} />
          <meshStandardMaterial color="#15171c" />
        </mesh>
      ))}
      <mesh ref={wl} position={[0.35, 0.05, 0]} rotation={[0, 0, 0.6]} scale={[1, 1, 0.2]}>
        <coneGeometry args={[0.2, 0.6, 3]} />
        <Mat color={pal.bird} />
      </mesh>
      <mesh ref={wr} position={[-0.35, 0.05, 0]} rotation={[0, 0, -0.6]} scale={[1, 1, 0.2]}>
        <coneGeometry args={[0.2, 0.6, 3]} />
        <Mat color={pal.bird} />
      </mesh>
      <mesh position={[0, 0, -0.4]} rotation={[-1.2, 0, 0]}>
        <coneGeometry args={[0.14, 0.4, 3]} />
        <Mat color={pal.bird} />
      </mesh>
    </group>
  );
}

export function Child({ pal, color, hair = '#2b2118', animate, seed = 1, moving = true }) {
  const root = useRef();
  useFrame(({ clock }) => {
    if (!root.current) return;
    if (!animate || !moving) { root.current.position.y = 0; return; }
    const t = clock.getElapsedTime() + seed;
    root.current.position.y = Math.abs(Math.sin(t * 2.4)) * 0.06;
  });
  return (
    <group ref={root}>
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.2, 0.34, 0.9, 6]} />
        <Mat color={color} />
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <sphereGeometry args={[0.28, 7, 5]} />
        <Mat color={pal.skin} />
      </mesh>
      <mesh position={[0, 1.24, -0.04]} scale={[1.05, 0.7, 1.05]}>
        <sphereGeometry args={[0.28, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <Mat color={hair} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 1.14, 0.25]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshStandardMaterial color="#15171c" />
        </mesh>
      ))}
      {[-0.3, 0.3].map((x) => (
        <mesh key={`a${x}`} position={[x, 0.62, 0]} rotation={[0, 0, x > 0 ? -0.9 : 0.9]}>
          <cylinderGeometry args={[0.06, 0.06, 0.45, 5]} />
          <Mat color={pal.skin} />
        </mesh>
      ))}
    </group>
  );
}

export const CHAR_META = {
  dragon: { labelY: 2.55, baseY: 0 },
  oiseau: { labelY: 0.75, baseY: 1.75 },
  yasmine: { labelY: 1.75, baseY: 0 },
  adam: { labelY: 1.75, baseY: 0 },
};

export function Mountains({ pal, z = -9 }) {
  const peaks = [[-6, 5.5, 4], [0, 7, 5], [6.5, 5, 3.8], [-11, 4, 3.5], [11, 4.5, 3.5]];
  return peaks.map(([x, h, r], i) => (
    <group key={i} position={[x, h / 2 - 0.5, z - (i % 2) * 2]}>
      <mesh>
        <coneGeometry args={[r, h, 5]} />
        <Mat color={pal.rock} />
      </mesh>
      <mesh position={[0, h / 2 - h * 0.12, 0]}>
        <coneGeometry args={[r * 0.26, h * 0.25, 5]} />
        <Mat color={pal.snow} />
      </mesh>
    </group>
  ));
}

export function House({ pal, position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.4, 1.2, 1.2]} />
        <Mat color={pal.house} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[1.5, 0.08, 1.3]} />
        <Mat color={pal.house} />
      </mesh>
      {/* porte bleue en arc : forme reconnaissable même sans la couleur */}
      <mesh position={[0, 0.38, 0.61]}>
        <boxGeometry args={[0.42, 0.76, 0.04]} />
        <Mat color={pal.door} />
      </mesh>
      <mesh position={[0, 0.76, 0.61]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.04, 12, 1, false, 0, Math.PI]} />
        <Mat color={pal.door} />
      </mesh>
    </group>
  );
}

export function Tree({ pal, position, s = 1 }) {
  return (
    <group position={position} scale={s}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.14, 0.8, 5]} />
        <Mat color={pal.trunk} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.6, 1.4, 6]} />
        <Mat color={pal.tree} />
      </mesh>
    </group>
  );
}

export function Decor({ decor, pal }) {
  if (decor === 'montagne') {
    return (
      <group>
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[3.2, 4, 0.5, 7]} />
          <Mat color={pal.rock} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.9, 7]} />
          <Mat color={pal.ground} />
        </mesh>
        {[[-2.3, 0.2, 0.6], [2.4, -0.4, 0.45], [1.8, 1.4, 0.3]].map(([x, z, r], i) => (
          <mesh key={i} position={[x, r * 0.5, z]}>
            <dodecahedronGeometry args={[r, 0]} />
            <Mat color={pal.rock} />
          </mesh>
        ))}
        <Mountains pal={pal} />
      </group>
    );
  }
  if (decor === 'vallee') {
    return (
      <group>
        <mesh position={[-1.2, -0.25, 1]}>
          <cylinderGeometry args={[2.4, 3, 0.5, 7]} />
          <Mat color={pal.rock} />
        </mesh>
        <mesh position={[-1.2, 0.005, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 7]} />
          <Mat color={pal.ground} />
        </mesh>
        {/* la vallée, plus bas */}
        <mesh position={[0, -3, -7]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 16]} />
          <Mat color={pal.ground} />
        </mesh>
        <House pal={pal} position={[-1.5, -3, -6.5]} scale={0.8} />
        <House pal={pal} position={[0.6, -3, -7.5]} scale={0.8} />
        <House pal={pal} position={[2.6, -3, -6.2]} scale={0.8} />
        <group position={[1, -3, -5.2]} scale={0.6}><Child pal={pal} color={pal.yasmine} animate={false} /></group>
        <group position={[1.7, -3, -5.4]} scale={0.6}><Child pal={pal} color={pal.adam} animate={false} /></group>
        <Mountains pal={pal} z={-13} />
      </group>
    );
  }
  if (decor === 'foret') {
    const trees = Array.from({ length: 12 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      return [side * (2.2 + rand(i) * 4), 0, -1 - rand(i + 20) * 8, 0.8 + rand(i + 40) * 0.6];
    });
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[40, 30]} />
          <Mat color={pal.ground} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -3]}>
          <planeGeometry args={[2.4, 16]} />
          <Mat color={pal.path} />
        </mesh>
        {trees.map(([x, y, z, s], i) => <Tree key={i} pal={pal} position={[x, y, z]} s={s} />)}
        <Mountains pal={pal} z={-14} />
      </group>
    );
  }
  if (decor === 'mer') {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]}>
          <planeGeometry args={[40, 12]} />
          <Mat color={pal.sand} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -10]}>
          <planeGeometry args={[60, 22]} />
          <meshStandardMaterial color={pal.sea} flatShading roughness={0.4} />
        </mesh>
        <Tree pal={pal} position={[-4.5, 0, 0.5]} s={1.2} />
        <Mountains pal={pal} z={-22} />
      </group>
    );
  }
  // village
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 30]} />
        <Mat color={pal.path} />
      </mesh>
      <House pal={pal} position={[-3.2, 0, -3]} />
      <House pal={pal} position={[0, 0, -4]} scale={1.15} />
      <House pal={pal} position={[3.3, 0, -3]} />
      <Tree pal={pal} position={[-4.8, 0, -1]} />
      <Tree pal={pal} position={[4.9, 0, -1.2]} s={1.2} />
      <Mountains pal={pal} z={-15} />
    </group>
  );
}

export function SoundVisual({ kind, animate, anchor = [0, 0, 0] }) {
  const group = useRef();
  const count = kind === 'particules' ? 14 : 7;
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => rand(i + 7)), [count]);

  useFrame(({ clock }) => {
    if (!animate || !group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((m, i) => {
      const s = seeds[i];
      if (kind === 'particules') {
        m.position.x = ((t * (1.5 + s) + s * 20) % 16) - 8;
      } else {
        const p = (t * 0.5 + s) % 1;
        m.position.y = anchor[1] + p * 1.6;
        m.rotation.y = t * 2 + i;
        m.material.opacity = 1 - p;
      }
    });
  });

  if (kind === 'particules') {
    return (
      <group ref={group}>
        {seeds.map((s, i) => (
          <mesh key={i} position={[s * 16 - 8, 1 + s * 3, -2 + rand(i + 3) * 4]}>
            <boxGeometry args={[0.9, 0.03, 0.03]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
    );
  }
  const color = kind === 'notes' ? '#1f2a44' : '#f7c744';
  return (
    <group ref={group}>
      {seeds.map((s, i) => (
        <mesh key={i} position={[anchor[0] + (s - 0.5) * 2.2, anchor[1] + s * 1.2, anchor[2] + (rand(i + 9) - 0.5)]}>
          <octahedronGeometry args={[kind === 'notes' ? 0.09 : 0.12, 0]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export const AMBIANCES = {
  nuit: { sky: 'skyNight', hemi: 0.7, dir: 0.6, dirColor: '#c9d6ff' },
  matin: { sky: 'sky', hemi: 0.9, dir: 1.1, dirColor: '#fff1d6' },
  midi: { sky: 'sky', hemi: 1.0, dir: 1.3, dirColor: '#ffffff' },
  soir: { sky: 'skyEvening', hemi: 1.05, dir: 1.15, dirColor: '#ffe0c0' },
};

