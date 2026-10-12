/**
 * Couche d'accessibilité globale.
 * - Vision des couleurs : celle de l'enfant connecté (son profil), sinon celle
 *   choisie au premier lancement par le parent → attribut data-cvd sur <html>
 *   (jetons de couleur sûrs + motifs, voir global.css).
 * - Correction des couleurs (option) : filtre SVG de daltonisation sur toute l'app.
 * - Contraste élevé, réduction des animations, grandes cibles tactiles.
 */
import { useEffect, useMemo } from 'react';
import { useStore } from '../state/store.jsx';
import { correctionMatrix, feValues, ACHRO_VALUES } from '../engine/vision.js';
import { PALETTE_TO_CVD } from '../engine/profileTest.js';

export function useEffectiveA11y() {
  const { state } = useStore();
  const child = state.children.find((c) => c.id === state.activeChildId);
  const v = state.vision || {};
  if (child) {
    const p = child.profile;
    return {
      cvd: PALETTE_TO_CVD[p.scene.palette] || 'none',
      correction: Boolean(p.scene.correction),
      highContrast: Boolean(v.highContrast || p.display.highContrast),
      reduceMotion: Boolean(v.reduceMotion || p.scene.reducedMotion),
      bigTargets: Boolean(p.a11y?.bigTargets),
    };
  }
  return { cvd: v.cvd || 'none', correction: Boolean(v.correction), highContrast: Boolean(v.highContrast), reduceMotion: Boolean(v.reduceMotion), bigTargets: false };
}

export default function A11yLayer({ children }) {
  const a = useEffectiveA11y();
  const filters = useMemo(() => ({
    protan: feValues(correctionMatrix('protan')),
    deutan: feValues(correctionMatrix('deutan')),
    tritan: feValues(correctionMatrix('tritan')),
  }), []);

  useEffect(() => {
    const d = document.documentElement.dataset;
    d.cvd = a.cvd;
    d.contrast = a.highContrast ? 'high' : 'normal';
    d.motion = a.reduceMotion ? 'reduce' : 'normal';
    d.targets = a.bigTargets ? 'big' : 'normal';
  }, [a.cvd, a.highContrast, a.reduceMotion, a.bigTargets]);

  const filterId = a.correction && a.cvd !== 'none' ? `kym-fix-${a.cvd}` : null;

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          {Object.entries(filters).map(([k, values]) => (
            <filter key={k} id={`kym-fix-${k}`} colorInterpolationFilters="linearRGB">
              <feColorMatrix type="matrix" values={values} />
            </filter>
          ))}
          {/* vision sans couleurs : conversion en clarté + contraste renforcé */}
          <filter id="kym-fix-achro" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={ACHRO_VALUES} />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.25" intercept="-0.12" />
              <feFuncG type="linear" slope="1.25" intercept="-0.12" />
              <feFuncB type="linear" slope="1.25" intercept="-0.12" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div className="app-root" style={filterId ? { filter: `url(#${filterId})` } : undefined}>
        {children}
      </div>
    </>
  );
}
