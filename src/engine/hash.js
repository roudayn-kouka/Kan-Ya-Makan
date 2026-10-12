/**
 * Codes (parent et code en images de l'enfant) : jamais stockés en clair.
 * SHA-256 via Web Crypto (disponible en HTTPS et sur localhost).
 * Version finale : hachage côté serveur (bcrypt/argon2) + verrouillage serveur.
 */
const SALT = 'kan-ya-makan:v1:';

async function sha256(text) {
  const data = new TextEncoder().encode(SALT + text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Repli non cryptographique si Web Crypto est indisponible (page ouverte en http:// sur le réseau). */
function fallbackHash(text) {
  let h1 = 0xdeadbeef ^ text.length;
  let h2 = 0x41c6ce57 ^ text.length;
  const s = SALT + text;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'fb' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export async function hashCode(text) {
  try {
    if (globalThis.crypto?.subtle) return await sha256(text);
  } catch {
    /* repli ci-dessous */
  }
  return fallbackHash(text);
}

export const LOCK_AFTER_FAILS = 3;
export const LOCK_SECONDS = 30;
