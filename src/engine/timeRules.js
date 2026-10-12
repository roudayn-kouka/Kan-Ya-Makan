/**
 * Contrôle du temps (6.9 et 6 bis G).
 * Prototype : le temps est compté dans le navigateur, uniquement quand la page
 * de lecture est visible, et cumulé par enfant et par jour.
 * Version finale : signal au serveur toutes les 30 s, temps calculé côté serveur
 * pour qu'un rechargement ne remette pas le compteur à zéro.
 */
import { useEffect, useRef, useState } from 'react';
import { dateKey } from './rewards.js';

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function isInWindow(rules, now = new Date()) {
  if (!rules.window?.enabled) return true;
  // jours autorisés (1 = lundi … 7 = dimanche) ; absent = tous les jours
  const days = rules.window.days;
  const iso = ((now.getDay() + 6) % 7) + 1;
  if (Array.isArray(days) && days.length && !days.includes(iso)) return false;
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = toMinutes(rules.window.start);
  const end = toMinutes(rules.window.end);
  return start <= end ? cur >= start && cur < end : cur >= start || cur < end;
}

export function daySeconds(dailyTime, childId, now = new Date()) {
  return dailyTime?.[childId]?.[dateKey(now)] || 0;
}

/** Peut-on ouvrir un livre maintenant ? */
export function accessStatus(rules, dailyTime, childId, now = new Date()) {
  if (!isInWindow(rules, now)) return 'outside_window';
  if (daySeconds(dailyTime, childId, now) >= rules.dayMaxMin * 60) return 'day_limit';
  return 'ok';
}

/**
 * Minuteur de séance.
 * @param {boolean} active  vrai pendant la lecture (faux pendant les pauses)
 * @param {(sec:number)=>void} flush  appelé toutes les 5 s pour cumuler le temps du jour
 */
export function useSessionTimer(active, flush) {
  const [seconds, setSeconds] = useState(0);
  const pending = useRef(0);
  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSeconds((s) => s + 1);
      pending.current += 1;
      if (pending.current >= 5) {
        flushRef.current?.(pending.current);
        pending.current = 0;
      }
    }, 1000);
    return () => {
      clearInterval(id);
      if (pending.current) {
        flushRef.current?.(pending.current);
        pending.current = 0;
      }
    };
  }, [active]);

  return seconds;
}
