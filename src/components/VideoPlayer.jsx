/**
 * Lecteur vidéo accessible pour les livres qui ont une vraie vidéo (Cendrillon,
 * le cours sur le cœur). Règles 6.14 : jamais de lecture automatique, une action
 * principale, gros boutons, volume et mode silencieux du profil, texte toujours
 * disponible (bandeau « ce qui se passe »), clavier : Espace = lecture/pause,
 * ← / → = 5 secondes.
 *
 * range = [début, fin] en secondes : le lecteur reste dans cet extrait.
 * chapters = [{ start, end, label }] : marqueurs cliquables sur la barre.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useT } from '../i18n/index.js';

const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

const VideoPlayer = forwardRef(function VideoPlayer({
  src,
  webm,                    // copie WebM (VP9) : lue si le navigateur n'a pas le H.264
  poster,
  range,
  chapters = [],
  volume = 0.7,
  muted = false,
  caption = null,          // texte affiché en bas (ou null)
  captionTag = null,       // petite étiquette au-dessus du texte
  onTime,                  // (t) => void, ~4 fois par seconde
  onPlayChange,            // (playing) => void
  onRangeEnd,              // fin de l'extrait atteinte
  compact = false,
  label,
  children,                // superpositions (bulles, personnages…)
}, ref) {
  const t = useT();
  const video = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(range ? range[0] : 0);
  const [dur, setDur] = useState(0);
  const [error, setError] = useState(false);
  const start = range ? range[0] : 0;
  const end = range ? range[1] : dur || 0;

  useImperativeHandle(ref, () => ({
    play: () => video.current?.play().catch(() => {}),
    pause: () => video.current?.pause(),
    seek: (s) => { if (video.current) video.current.currentTime = s; },
    get time() { return video.current?.currentTime || 0; },
    get playing() { return playing; },
  }), [playing]);

  // Volume et mode silencieux viennent du profil de l'enfant
  useEffect(() => {
    if (!video.current) return;
    video.current.volume = Math.min(1, Math.max(0, volume));
    video.current.muted = muted;
  }, [volume, muted]);

  // Nouvelle vidéo : recharger les sources
  useEffect(() => { setError(false); video.current?.load(); }, [src, webm]);

  // Changement d'extrait : on se place au début, en pause
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    v.pause();
    const go = () => { v.currentTime = start; setTime(start); };
    if (v.readyState >= 1) go();
    else v.addEventListener('loadedmetadata', go, { once: true });
  }, [src, webm, start, end]);

  const onTimeUpdate = () => {
    const v = video.current;
    if (!v) return;
    let now = v.currentTime;
    if (range && now >= end - 0.05) {
      v.pause();
      now = end;
      onRangeEnd?.();
    }
    if (range && now < start - 0.5) { v.currentTime = start; now = start; }
    setTime(now);
    onTime?.(now);
  };

  // toutes les sources ont échoué → message clair (le texte reste disponible)
  const noSource = () => {
    setTimeout(() => { if (video.current?.networkState === 3) setError(true); }, 0);
  };

  const toggle = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime >= end - 0.1) v.currentTime = start;
      v.play().catch(() => setError(true));
    } else v.pause();
  }, [start, end]);

  const seekTo = (s) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = Math.min(end, Math.max(start, s));
    setTime(v.currentTime);
    onTime?.(v.currentTime);
  };

  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowRight') seekTo(time + 5);
    if (e.key === 'ArrowLeft') seekTo(time - 5);
  };

  const span = Math.max(0.001, end - start);
  const pct = ((time - start) / span) * 100;

  return (
    <div className={`vplayer ${compact ? 'compact' : ''}`} onKeyDown={onKey}>
      <div className="vplayer-stage">
        <video
          ref={video}
          poster={poster}
          preload="metadata"
          playsInline
          onClick={toggle}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={(e) => setDur(e.currentTarget.duration || 0)}
          onPlay={() => { setPlaying(true); onPlayChange?.(true); }}
          onPause={() => { setPlaying(false); onPlayChange?.(false); }}
          // une <source> qui échoue déclenche aussi cet évènement : on ne compte que l'échec de la vidéo elle-même
          onError={(e) => { if (e.target === e.currentTarget && e.currentTarget.error) setError(true); }}
          aria-label={label}
        >
          <source src={src} type="video/mp4" onError={webm ? undefined : noSource} />
          {webm && <source src={webm} type="video/webm" onError={noSource} />}
        </video>
        {!playing && !error && (
          <button type="button" className="vplayer-big" onClick={toggle} aria-label={t('video_play')}>▶</button>
        )}
        {error && <div className="vplayer-error" role="alert">{t('video_error')}</div>}
        {caption && (
          <div className="vplayer-caption read-text" aria-live="polite">
            {captionTag && <span className="vplayer-caption-tag">{captionTag}</span>}
            {caption}
          </div>
        )}
        {children}
      </div>
      <div className="vplayer-bar">
        <button type="button" className="btn btn-primary btn-small" onClick={toggle} aria-label={playing ? t('pause_voice') : t('video_play')}>
          {playing ? '❚❚' : '▶'}
        </button>
        <button type="button" className="btn btn-small" onClick={() => seekTo(time - 10)} aria-label={t('video_back10')}>↺ 10 s</button>
        <div
          className="vplayer-track"
          role="slider"
          tabIndex={0}
          aria-label={t('video_position')}
          aria-valuemin={0}
          aria-valuemax={Math.round(span)}
          aria-valuenow={Math.round(time - start)}
          aria-valuetext={`${fmt(time - start)} / ${fmt(span)}`}
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            let x = (e.clientX - r.left) / r.width;
            if (getComputedStyle(e.currentTarget).direction === 'rtl') x = 1 - x;
            seekTo(start + x * span);
          }}
        >
          <div className="vplayer-fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
          {chapters.map((c, i) => (
            <button
              key={i}
              type="button"
              className="vplayer-mark"
              style={{ insetInlineStart: `${((c.start - start) / span) * 100}%` }}
              onClick={(e) => { e.stopPropagation(); seekTo(c.start + 0.05); }}
              aria-label={c.label}
              title={c.label}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="muted" style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.9em' }}>{fmt(time - start)} / {fmt(span)}</span>
      </div>
    </div>
  );
});

export default VideoPlayer;
