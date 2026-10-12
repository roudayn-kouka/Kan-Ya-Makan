/**
 * Narration (6 bis E).
 * Prototype : Web Speech API du navigateur. La position du mot vient de
 * l'évènement « boundary » quand la voix le fournit ; sinon le surlignage suit
 * une chronologie estimée. Version finale : voix cloud avec horodatage de chaque mot
 * (champ `mots[].debut_ms` du script).
 */
import { estimateTimeline } from './text.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

export function speechSupported() {
  return Boolean(synth && typeof window.SpeechSynthesisUtterance !== 'undefined');
}

export function listVoices(lang) {
  if (!speechSupported()) return [];
  const prefix = lang === 'ar' ? 'ar' : 'fr';
  return synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(prefix));
}

export function onVoicesChanged(cb) {
  if (!speechSupported()) return () => {};
  synth.addEventListener?.('voiceschanged', cb);
  return () => synth.removeEventListener?.('voiceschanged', cb);
}

export function pickVoice(lang, voiceURI) {
  const voices = listVoices(lang);
  if (!voices.length) return null;
  return voices.find((v) => v.voiceURI === voiceURI) || voices.find((v) => v.localService) || voices[0];
}

export class Narrator {
  constructor() {
    this.timer = null;
    this.utterance = null;
    this.runId = 0;
  }

  /**
   * Lit la page à partir de la phrase `fromSentence`.
   * @returns {{ audio: boolean }} audio=false si aucune voix n'est disponible
   *          (le surlignage guidé fonctionne quand même, sans son).
   */
  speak({ page, fromSentence = 0, toSentence, lang, rate = 1, volume = 0.7, voiceURI = null, muted = false, onPosition, onEnd }) {
    this.stop();
    const runId = ++this.runId;
    const last = toSentence ?? page.sentences.length - 1;
    const first = page.sentences[fromSentence];
    const end = page.sentences[last];
    if (!first || !end) return { audio: false };
    const offset = first.start;
    const text = page.fullText.slice(offset, end.end);

    // Chronologie estimée limitée aux phrases lues
    const sub = { sentences: page.sentences.slice(fromSentence, last + 1) };
    const { timeline, total } = estimateTimeline(sub, rate);

    let gotBoundary = false;
    const started = performance.now();
    const finish = () => {
      if (runId !== this.runId) return;
      this._clearTimer();
      onEnd?.();
    };

    const tick = () => {
      if (runId !== this.runId) return;
      if (!gotBoundary) {
        const elapsed = performance.now() - started;
        let current = timeline[0];
        for (const step of timeline) {
          if (step.at <= elapsed) current = step;
          else break;
        }
        if (current) onPosition?.(current.charIndex);
        // Sans audio, la fin est donnée par la chronologie
        if (!audio && elapsed > total + 300) return finish();
      }
      this.timer = requestAnimationFrame(tick);
    };

    const voice = !muted ? pickVoice(lang, voiceURI) : null;
    const audio = Boolean(voice && speechSupported());

    if (audio) {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = rate;
      u.volume = volume;
      u.onboundary = (e) => {
        if (runId !== this.runId) return;
        if (e.name && e.name !== 'word') return;
        gotBoundary = true;
        onPosition?.(offset + e.charIndex);
      };
      u.onend = finish;
      u.onerror = finish;
      this.utterance = u;
      synth.cancel();
      synth.speak(u);
    }
    onPosition?.(offset);
    this.timer = requestAnimationFrame(tick);
    return { audio };
  }

  /** Lit un seul mot (aide sur un mot). */
  sayWord(word, { lang, rate = 0.9, volume = 0.7, voiceURI = null }) {
    const voice = pickVoice(lang, voiceURI);
    if (!voice) return false;
    this.stop();
    const u = new SpeechSynthesisUtterance(word);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    u.volume = volume;
    synth.cancel();
    synth.speak(u);
    return true;
  }

  _clearTimer() {
    if (this.timer) cancelAnimationFrame(this.timer);
    this.timer = null;
  }

  stop() {
    this.runId++;
    this._clearTimer();
    if (speechSupported()) synth.cancel();
    this.utterance = null;
  }
}
