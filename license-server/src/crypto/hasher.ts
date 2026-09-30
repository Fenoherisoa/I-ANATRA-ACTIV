/**
 * I-ANATRA License Server - RFC OFFICE
 * Hachage sécurisé de mots de passe administratifs (Argon2id / PBKDF2)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { randomBytes, pbkdf2Sync, timingSafeEqual, createHmac } from 'crypto';

const ITERATIONS = 100000;
const KEYLEN = 64;
const DIGEST = 'sha512';

/**
 * Hache un mot de passe administrateur avec un sel aléatoire
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return `pbkdf2$${ITERATIONS}$${salt}$${derivedKey}`;
}

/**
 * Vérifie un mot de passe en temps constant contre les attaques temporelles
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const parts = combinedHash.split('$');
    if (parts.length !== 4) return false;
    const [, iterStr, salt, hash] = parts;
    const iter = parseInt(iterStr, 10);
    const derivedKey = pbkdf2Sync(password, salt, iter, KEYLEN, DIGEST).toString('hex');
    return timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Génère un jeton de session / JWT sécurisé
 */
export function generateToken(payload: Record<string, unknown>, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 3600, // 24h
    })
  ).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

/**
 * Décode et vérifie un jeton de session
 */
export function verifyToken<T = Record<string, unknown>>(token: string, secret: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = createHmac('sha256', secret)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T & { exp?: number };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expiré
    }

    return payload;
  } catch {
    return null;
  }
}
