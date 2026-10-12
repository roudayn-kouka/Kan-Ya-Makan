/**
 * État global du prototype (compte parent, vision des couleurs, profils, règles,
 * séances, journal de récompenses, livres importés, activités hors écran).
 * Prototype : état en mémoire, sauvegardé dans le navigateur (localStorage) pour la démo.
 * Version finale : API + PostgreSQL (tables en 6 bis H), sécurité au niveau des lignes.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { defaultRules, deepMerge } from '../data/presets.js';
import { profileFromNeeds } from '../engine/profileTest.js';
import { makeEvent, dateKey, starsFor, crossedRewards, needsReadingDay } from '../engine/rewards.js';
import { hashCode } from '../engine/hash.js';

const STORAGE_KEY = 'kan-ya-makan-proto-v2';
export const DEMO_EMAIL = 'demo@kanyamakan.tn';
export const DEMO_PASSWORD = 'demo1234';

export const DEFAULT_VISION = { asked: false, cvd: 'none', correction: false, highContrast: false, reduceMotion: false };

/** Premier écran selon l'état : vision des couleurs → compte → connexion → « Qui lit ? ». */
export function entryScreen(s) {
  if (!s.vision?.asked) return 'vision';
  if (!s.account) return 'welcome';
  if (!s.loggedIn) return 'login';
  return 'who';
}
export const DEMO_MODE = true;
export const DEMO_PARENT_CODE = '1234';

const StoreContext = createContext(null);

const uid = (p) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

function freezeLog(log) {
  return (log || []).map((e) => Object.freeze({ ...e, meta: Object.freeze({ ...(e.meta || {}) }) }));
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT': {
      const next = { ...emptyState(), ...action.state };
      return { ...next, rewardLog: freezeLog(next.rewardLog), screen: { name: action.screen || entryScreen(next) }, ready: true };
    }

    case 'SET_VISION':
      return { ...state, vision: { ...state.vision, ...action.patch } };

    case 'CREATE_ACCOUNT':
      return { ...state, account: action.account, parentCodeHash: action.parentCodeHash, loggedIn: true, loginLock: { fails: 0, until: 0 } };

    case 'LOGIN':
      return { ...state, loggedIn: true, loginLock: { fails: 0, until: 0 } };

    case 'LOGIN_FAIL': {
      const fails = (state.loginLock?.fails || 0) + 1;
      return { ...state, loginLock: fails >= 5 ? { fails: 0, until: Date.now() + 60000 } : { fails, until: state.loginLock?.until || 0 } };
    }

    case 'LOGOUT':
      return { ...state, loggedIn: false, activeChildId: null, screen: { name: 'login' } };

    case 'ADD_BOOK':
      return { ...state, books: [...(state.books || []), action.book] };

    case 'UPDATE_BOOK':
      return { ...state, books: (state.books || []).map((b) => (b.id === action.id ? { ...b, ...action.patch } : b)) };

    case 'DELETE_BOOK':
      return { ...state, books: (state.books || []).filter((b) => b.id !== action.id) };

    case 'ADD_OFFLINE':
      return { ...state, offline: [...(state.offline || []), action.item] };

    case 'OFFLINE_DONE':
      return { ...state, offline: (state.offline || []).map((o) => (o.id === action.id ? { ...o, status: 'done', doneAt: new Date().toISOString() } : o)) };

    case 'ADD_REPORT':
      return { ...state, reports: [...(state.reports || []), action.report] };

    case 'SET_LANG':
      return { ...state, lang: action.lang };

    case 'NAVIGATE':
      return { ...state, screen: { name: action.name, params: action.params || {} } };

    case 'SELECT_CHILD':
      return { ...state, activeChildId: action.id };

    case 'ADD_CHILD':
      return { ...state, children: [...state.children, action.child] };

    case 'UPDATE_CHILD':
      return {
        ...state,
        children: state.children.map((c) => (c.id === action.id ? deepMerge(c, action.patch) : c)),
      };

    case 'SET_PROFILE':
      return { ...state, children: state.children.map((c) => (c.id === action.id ? { ...c, profile: action.profile } : c)) };

    case 'SET_RULES':
      return { ...state, children: state.children.map((c) => (c.id === action.id ? { ...c, rules: action.rules } : c)) };

    case 'DELETE_CHILD': {
      // Droit à l'effacement exercé par le parent : toutes les données de l'enfant disparaissent.
      const { [action.id]: _drop, ...dailyTime } = state.dailyTime;
      return {
        ...state,
        children: state.children.filter((c) => c.id !== action.id),
        sessions: state.sessions.filter((s) => s.childId !== action.id),
        interactions: state.interactions.filter((i) => i.childId !== action.id),
        rewardLog: state.rewardLog.filter((e) => e.childId !== action.id),
        pendingRewards: state.pendingRewards.filter((r) => r.childId !== action.id),
        offline: (state.offline || []).filter((o) => o.childId !== action.id),
        dailyTime,
        activeChildId: state.activeChildId === action.id ? null : state.activeChildId,
      };
    }

    case 'APPEND_EVENTS':
      // Journal en ajout seul : aucune action ne modifie ni ne retire un évènement existant.
      return { ...state, rewardLog: [...state.rewardLog, ...action.events] };

    case 'ADD_PENDING_REWARDS':
      return { ...state, pendingRewards: [...state.pendingRewards, ...action.items] };

    case 'VALIDATE_REWARD':
      return {
        ...state,
        pendingRewards: state.pendingRewards.map((r) =>
          r.id === action.id ? { ...r, status: 'validated', validatedAt: new Date().toISOString() } : r,
        ),
      };

    case 'START_SESSION':
      return { ...state, sessions: [...state.sessions, action.session] };

    case 'END_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) => (s.id === action.id && !s.end ? { ...s, ...action.patch, end: new Date().toISOString() } : s)),
      };

    case 'LOG':
      return { ...state, interactions: [...state.interactions, action.item].slice(-3000) };

    case 'ADD_DAY_TIME': {
      const day = dateKey();
      const forChild = state.dailyTime[action.childId] || {};
      return {
        ...state,
        dailyTime: { ...state.dailyTime, [action.childId]: { ...forChild, [day]: (forChild[day] || 0) + action.seconds } },
      };
    }

    case 'SET_BOOKMARK':
      return {
        ...state,
        children: state.children.map((c) =>
          c.id === action.childId ? { ...c, bookmarks: { ...(c.bookmarks || {}), [action.bookId]: action.scene } } : c,
        ),
      };

    case 'SET_PARENT_CODE':
      return { ...state, parentCodeHash: action.hash };

    case 'PARENT_FAIL': {
      const fails = (state.parentLock?.fails || 0) + 1;
      const until = fails >= 3 ? Date.now() + 30000 : state.parentLock?.until || 0;
      return { ...state, parentLock: { fails: fails >= 3 ? 0 : fails, until } };
    }

    case 'PARENT_OK':
      return { ...state, parentLock: { fails: 0, until: 0 } };

    default:
      return state;
  }
}

/** État vide : premier lancement, avant la création du compte. */
export function emptyState() {
  return {
    version: 2,
    lang: 'fr',
    vision: { ...DEFAULT_VISION },
    account: null,
    loggedIn: false,
    loginLock: { fails: 0, until: 0 },
    parentCodeHash: null,
    parentLock: { fails: 0, until: 0 },
    children: [],
    activeChildId: null,
    sessions: [],
    interactions: [],
    rewardLog: [],
    pendingRewards: [],
    dailyTime: {},
    books: [],
    offline: [],
    reports: [],
  };
}

/** Famille de démonstration (compte, deux enfants avec des besoins différents). */
export async function demoState(keep = {}) {
  const [passHash, parentCodeHash, codeAmine, codeSami] = await Promise.all([
    hashCode(`pw:${DEMO_EMAIL}:${DEMO_PASSWORD}`),
    hashCode(`parent:${DEMO_PARENT_CODE}`),
    hashCode('child:soleil,lune,etoile'),
    hashCode('child:poisson,fleur,pomme'),
  ]);
  const amineProfile = profileFromNeeds({ reading: true });
  const samiProfile = profileFromNeeds({ attention: true, colors: 'rg' });
  return {
    ...emptyState(),
    lang: keep.lang || 'fr',
    vision: { ...DEFAULT_VISION, ...(keep.vision || {}), asked: true },
    account: { email: DEMO_EMAIL, passHash, country: 'TN', consents: { privacy: true, adult: true }, createdAt: new Date().toISOString(), demo: true },
    loggedIn: true,
    parentCodeHash,
    parentLock: { fails: 0, until: 0 },
    children: [
      {
        id: 'amine', nickname: 'Amine', ageRange: '8-10', avatar: 'renard',
        codeHash: codeAmine, demoCode: ['soleil', 'lune', 'etoile'],
        profile: amineProfile, rules: defaultRules(), bookmarks: {},
      },
      {
        id: 'sami', nickname: 'Sami', ageRange: '8-10', avatar: 'hibou',
        codeHash: codeSami, demoCode: ['poisson', 'fleur', 'pomme'],
        profile: samiProfile, rules: { ...defaultRules(), sessionMaxMin: 10 }, bookmarks: {},
      },
    ],
  };
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === 2 ? parsed : null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { ready: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = loadSaved();
      if (alive) dispatch({ type: 'INIT', state: saved || emptyState() });
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Sauvegarde (sans l'écran courant)
  useEffect(() => {
    if (!state.ready) return;
    try {
      const { screen, ready, ...persist } = state; // l'écran courant n'est pas gardé
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
    } catch {
      /* navigation privée ou stockage bloqué : l'état reste en mémoire */
    }
  }, [state]);

  // Langue et direction du document
  useEffect(() => {
    if (!state.lang) return;
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  }, [state.lang]);

  const stateRef = useRef(state);
  stateRef.current = state;
  // Journal « optimiste » : plusieurs récompenses peuvent être données dans le même
  // geste (page terminée + livre terminé + séance terminée) avant le prochain rendu.
  const logRef = useRef(state.rewardLog || []);
  useEffect(() => {
    logRef.current = state.rewardLog || [];
  }, [state.rewardLog]);

  const navigate = useCallback((name, params) => dispatch({ type: 'NAVIGATE', name, params }), []);

  /** Enregistre des évènements de récompense et crée les récompenses réelles en attente. */
  const reward = useCallback((childId, type, meta) => {
    const s = stateRef.current;
    const child = s.children.find((c) => c.id === childId);
    if (!child) return [];
    const current = logRef.current;
    const events = [];
    if (needsReadingDay(current, childId) && type !== 'reading_day') events.push(makeEvent(childId, 'reading_day'));
    events.push(makeEvent(childId, type, meta));
    const before = starsFor(current, childId);
    const after = before + events.reduce((n, e) => n + e.stars, 0);
    logRef.current = [...current, ...events];
    dispatch({ type: 'APPEND_EVENTS', events });
    const crossed = crossedRewards(child.rules.rewards, before, after);
    if (crossed.length) {
      dispatch({
        type: 'ADD_PENDING_REWARDS',
        items: crossed.map((r) => ({ id: uid('rw'), childId, rewardId: r.id, label: r.label, stars: r.stars, status: 'pending', at: new Date().toISOString() })),
      });
    }
    return events;
  }, []);

  const log = useCallback((childId, sessionId, type, value, meta) => {
    dispatch({ type: 'LOG', item: { childId, sessionId, type, value, meta, at: new Date().toISOString() } });
  }, []);

  const value = useMemo(() => ({ state, dispatch, navigate, reward, log, uid }), [state, navigate, reward, log]);

  if (!state.ready) return <div className="screen center muted">…</div>;
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

export function useActiveChild() {
  const { state } = useStore();
  return state.children.find((c) => c.id === state.activeChildId) || null;
}

/** Charge la famille de démonstration (garde la langue et la vision déjà choisies). */
export function useResetDemo() {
  const [busy, setBusy] = useState(false);
  const { state, dispatch } = useStore();
  return [
    busy,
    async () => {
      setBusy(true);
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      dispatch({ type: 'INIT', state: await demoState({ lang: state.lang, vision: state.vision }) });
      setBusy(false);
    },
  ];
}

/** Efface tout (compte compris) et revient au tout premier écran. */
export function useWipeAll() {
  const { dispatch } = useStore();
  return () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    dispatch({ type: 'INIT', state: emptyState() });
  };
}
