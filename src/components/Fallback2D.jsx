/**
 * Illustration fixe de secours (appareil sans 3D, ou préférence « Illustration »).
 * Même narration, mêmes personnages à toucher : jamais une page cassée.
 */
import { paletteFor } from '../engine/adaptation.js';
import { STORY } from '../data/story.js';
import { useT } from '../i18n/index.js';

const SKY = { matin: 'sky', midi: 'sky', soir: 'skyEvening' };

function Figure({ id, pal }) {
  if (id === 'dragon') {
    return (
      <g>
        <ellipse cx="0" cy="-30" rx="34" ry="28" fill={pal.dragon} stroke="#1f2a44" strokeWidth="2" />
        <ellipse cx="0" cy="-26" rx="18" ry="16" fill={pal.dragonBelly} />
        <circle cx="0" cy="-72" r="20" fill={pal.dragon} stroke="#1f2a44" strokeWidth="2" />
        <circle cx="-7" cy="-75" r="3" fill="#15171c" />
        <circle cx="7" cy="-75" r="3" fill="#15171c" />
        <path d="M-30 -45 L-58 -70 L-38 -30 Z" fill={pal.dragonBelly} stroke="#1f2a44" strokeWidth="2" />
        <path d="M30 -45 L58 -70 L38 -30 Z" fill={pal.dragonBelly} stroke="#1f2a44" strokeWidth="2" />
      </g>
    );
  }
  if (id === 'oiseau') {
    return (
      <g transform="translate(0 -70)">
        <circle r="14" fill={pal.bird} stroke="#1f2a44" strokeWidth="2" />
        <path d="M12 -2 L22 2 L12 6 Z" fill="#f7c744" />
        <circle cx="5" cy="-4" r="2.2" fill="#15171c" />
      </g>
    );
  }
  const color = id === 'yasmine' ? pal.yasmine : pal.adam;
  return (
    <g>
      <path d="M-14 0 L-9 -38 L9 -38 L14 0 Z" fill={color} stroke="#1f2a44" strokeWidth="2" />
      <circle cx="0" cy="-50" r="12" fill={pal.skin} stroke="#1f2a44" strokeWidth="2" />
    </g>
  );
}

export default function Fallback2D({ scene, profile, selected, onSelect, interactive = true }) {
  const t = useT();
  const pal = paletteFor(profile);
  const chars = scene.characters.slice(0, 3);
  const toX = (x) => 50 + x * 18; // position en % de largeur
  const toY = (z, id) => 78 + z * 6 - (id === 'oiseau' ? 4 : 0);

  return (
    <div style={{ position: 'absolute', inset: 0 }} role="img" aria-label={t('scene_aria', { where: t.pick(scene.where) })}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        <rect width="100" height="100" fill={pal[SKY[scene.ambiance] || 'sky']} />
        {scene.decor !== 'village' && <path d="M0 62 L18 30 L34 58 L52 22 L70 56 L86 34 L100 60 L100 100 L0 100 Z" fill={pal.rock} />}
        <path d="M0 70 Q50 62 100 70 L100 100 L0 100 Z" fill={scene.decor === 'village' ? pal.path : pal.ground} />
        {scene.decor === 'village' && [15, 45, 75].map((x) => (
          <g key={x}>
            <rect x={x - 8} y="48" width="16" height="16" fill={pal.house} stroke="#1f2a44" strokeWidth="0.4" />
            <rect x={x - 2} y="56" width="4" height="8" fill={pal.door} />
          </g>
        ))}
      </svg>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax meet" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden="true">
        {chars.map((c) => (
          <g key={c.id} transform={`translate(${toX(c.position[0])} ${toY(c.position[1], c.id)}) scale(0.28)`}>
            <Figure id={c.id} pal={pal} />
          </g>
        ))}
      </svg>
      {interactive && chars.map((c) => (
        <button
          key={c.id}
          type="button"
          className="char-label"
          aria-pressed={selected === c.id}
          onClick={() => onSelect?.(c.id)}
          style={{
            position: 'absolute',
            left: `${toX(c.position[0])}%`,
            top: `${toY(c.position[1], c.id) - (c.id === 'dragon' ? 34 : 24)}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {profile.scene.shapes && <span aria-hidden="true">{STORY.characters[c.id]?.shape}</span>}
          {t.pick(STORY.characters[c.id]?.name)}
        </button>
      ))}
    </div>
  );
}
