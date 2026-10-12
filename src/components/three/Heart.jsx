/**
 * Modèle 3D simplifié du cœur (livre éducatif, parcours Explorer).
 * Parties nommées et touchables, battement, animation du trajet du sang.
 * Le sang « pauvre en oxygène » est une boule ●, le sang « riche en oxygène »
 * un triangle ▲ : la différence ne passe jamais par la couleur seule.
 */
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Mat } from './kit.jsx';

export const PART_GEOMETRY = {
  oreillette_droite: { pos: [-0.62, 0.58, 0.05], r: 0.42, scale: [1, 0.9, 0.9] },
  ventricule_droit: { pos: [-0.38, -0.32, 0.22], r: 0.6, scale: [1, 1.2, 0.9] },
  oreillette_gauche: { pos: [0.6, 0.62, -0.12], r: 0.4, scale: [1, 0.9, 0.9] },
  ventricule_gauche: { pos: [0.34, -0.42, 0.02], r: 0.68, scale: [1, 1.35, 1] },
};
const LUNGS = [[-2.15, 0.7, -0.2], [2.15, 0.7, -0.2]];
const LABEL_POS = {
  oreillette_droite: [-0.85, 0.95, 0.3],
  ventricule_droit: [-0.7, -0.5, 0.6],
  oreillette_gauche: [0.9, 0.95, 0],
  ventricule_gauche: [0.75, -0.75, 0.5],
  aorte: [0.35, 2.0, 0],
  poumons: [-2.15, 1.75, -0.2],
};

// Trajet du sang (vue de face) : corps → OD → VD → poumons → OG → VG → aorte → corps
const PATH = [
  [-1.1, -2.1, 0.4], [-0.95, -0.8, 0.45], [-0.62, 0.58, 0.45], [-0.4, -0.2, 0.7], [-0.45, 0.9, 0.6],
  [-0.4, 1.5, 0.3], [-1.5, 1.2, 0.1], [-2.1, 0.7, 0.2], [-1.6, 1.55, -0.4], [-0.2, 1.3, -0.5],
  [0.6, 0.62, -0.35], [0.4, -0.3, 0.45], [0.2, 0.7, 0.4], [0.15, 1.45, 0.2], [0.55, 1.85, 0],
  [1.0, 1.4, -0.3], [1.05, 0.0, -0.45], [1.1, -2.1, -0.4],
];
const RICH_FROM = 7;   // après le passage dans les poumons
const RICH_TO = 17;    // retour vers le corps

function PartMesh({ id, pal, selected, onSelect, beatRef }) {
  const g = PART_GEOMETRY[id];
  const ref = useRef();
  const isVentricle = id.startsWith('ventricule');
  useFrame(() => {
    if (!ref.current) return;
    const b = beatRef.current || 0;
    const k = isVentricle ? 1 - 0.06 * b : 1 - 0.03 * (1 - b);
    ref.current.scale.set(g.scale[0] * k, g.scale[1] * k, g.scale[2] * k);
  });
  return (
    <mesh
      ref={ref}
      position={g.pos}
      onClick={(e) => { e.stopPropagation(); onSelect?.(id); }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <sphereGeometry args={[g.r, 12, 9]} />
      <Mat color={pal.heart} emissive={selected ? '#ffffff' : '#000000'} emissiveIntensity={selected ? 0.35 : 0} />
    </mesh>
  );
}

function Aorta({ pal, selected, onSelect }) {
  const handlers = {
    onClick: (e) => { e.stopPropagation(); onSelect?.('aorte'); },
    onPointerOver: () => (document.body.style.cursor = 'pointer'),
    onPointerOut: () => (document.body.style.cursor = ''),
  };
  const mat = <Mat color={pal.heart} emissive={selected ? '#ffffff' : '#000000'} emissiveIntensity={selected ? 0.35 : 0} />;
  return (
    <group {...handlers}>
      <mesh position={[0.15, 1.15, 0.1]}>
        <cylinderGeometry args={[0.2, 0.22, 0.8, 10]} />
        {mat}
      </mesh>
      <mesh position={[0.6, 1.5, -0.1]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.45, 0.19, 8, 16, Math.PI]} />
        {mat}
      </mesh>
      <mesh position={[1.05, 0.6, -0.25]}>
        <cylinderGeometry args={[0.18, 0.18, 1.8, 10]} />
        {mat}
      </mesh>
    </group>
  );
}

function BloodFlow({ pal, active, reduced }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(PATH.map((p) => new THREE.Vector3(...p))), []);
  const count = 18;
  const refs = useRef([]);
  const t0 = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const richA = RICH_FROM / (PATH.length - 1);
  const richB = RICH_TO / (PATH.length - 1);
  useFrame((_, dt) => {
    if (active && !reduced) t0.current = (t0.current + dt * 0.06) % 1;
    refs.current.forEach((g, i) => {
      if (!g) return;
      const u = (t0.current + i / count) % 1;
      curve.getPointAt(u, tmp);
      g.position.copy(tmp);
      const rich = u >= richA && u <= richB;
      g.children[0].visible = !rich; // ● pauvre en oxygène
      g.children[1].visible = rich;  // ▲ riche en oxygène
    });
  });
  if (!active) return null;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <mesh>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshStandardMaterial color={pal.bloodPoor} />
          </mesh>
          <mesh>
            <coneGeometry args={[0.1, 0.2, 3]} />
            <meshStandardMaterial color={pal.bloodRich} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function HeartModel({ pal, selected, onSelect, animate, reduced, rotationRef, onLabels, showLungs = true }) {
  const group = useRef();
  const beat = useRef(0);
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const lastKey = useRef('');

  useFrame(({ clock }) => {
    if (group.current && rotationRef) group.current.rotation.y = rotationRef.current;
    // battement : ~75 par minute, seulement si l'animation est permise
    beat.current = reduced ? 0 : Math.max(0, Math.sin(clock.getElapsedTime() * 7.85)) ** 3;
    if (!onLabels || !group.current) return;
    const out = [];
    for (const [id, p] of Object.entries(LABEL_POS)) {
      if (id === 'poumons' && !showLungs) continue;
      v.set(...p).applyMatrix4(group.current.matrixWorld).project(camera);
      out.push({ id, x: Math.round((v.x * 0.5 + 0.5) * size.width), y: Math.round((-v.y * 0.5 + 0.5) * size.height), behind: v.z > 1 });
    }
    const key = out.map((o) => `${o.id}${o.x},${o.y}`).join('|');
    if (key !== lastKey.current) { lastKey.current = key; onLabels(out); }
  });

  return (
    <group ref={group} rotation={[0, 0, 0]}>
      <group>
        {Object.keys(PART_GEOMETRY).map((id) => (
          <PartMesh key={id} id={id} pal={pal} selected={selected === id} onSelect={onSelect} beatRef={beat} />
        ))}
        <Aorta pal={pal} selected={selected === 'aorte'} onSelect={onSelect} />
        {/* artère pulmonaire (non touchable : décor du trajet) */}
        <mesh position={[-0.42, 1.2, 0.35]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.14, 0.16, 0.8, 8]} />
          <Mat color={pal.heart} />
        </mesh>
      </group>
      {showLungs && LUNGS.map((p, i) => (
        <mesh
          key={i}
          position={p}
          scale={[0.75, 1.25, 0.6]}
          onClick={(e) => { e.stopPropagation(); onSelect?.('poumons'); }}
        >
          <sphereGeometry args={[0.8, 12, 9]} />
          <meshStandardMaterial color={pal.lung} transparent opacity={selected === 'poumons' ? 0.75 : 0.45} flatShading />
        </mesh>
      ))}
      <BloodFlow pal={pal} active={animate} reduced={reduced} />
    </group>
  );
}
