/**
 * RFC OFFICE - I-ANATRA License Server
 * Normalisation et hachage sécurisé HMAC-SHA256 des clés de licence
 * Les clés en clair ne sont JAMAIS stockées dans Firestore !
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { createHmac } from 'crypto';
import { LICENSE_KEY_PREFIX } from './keyGenerator';

/**
 * Normalise la clé de licence saisie :
 * - Retire espaces, tirets, underscores
 * - Convertit en majuscules
 * - Reconstitue le format canonique officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
 */
export function normalizeLicenseKey(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const raw = input.trim().toUpperCase().replace(/[\s\-_]/g, '');

  let payload = '';
  if (raw.startsWith(LICENSE_KEY_PREFIX)) {
    payload = raw.slice(LICENSE_KEY_PREFIX.length);
  } else {
    payload = raw;
  }

  if (payload.length === 16) {
    const g1 = payload.slice(0, 4);
    const g2 = payload.slice(4, 8);
    const g3 = payload.slice(8, 12);
    const g4 = payload.slice(12, 16);
    return `${LICENSE_KEY_PREFIX}-${g1}-${g2}-${g3}-${g4}`;
  }

  return input.trim().toUpperCase();
}

/**
 * Valide strictement la structure et l'alphabet de la clé
 * Rejette strictement les caractères ambigus (0, O, 1, I)
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const normalized = normalizeLicenseKey(key);
  const regex = /^IANATRA-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  return regex.test(normalized);
}

/**
 * Calcule l'empreinte cryptographique sécurisée HMAC-SHA256 de la clé
 * avec un poivre serveur secret (issu de Secret Manager ou variables d'environnement).
 */
export function hashLicenseKey(key: string, secretPepper: string): string {
  const normalized = normalizeLicenseKey(key);
  if (!secretPepper) {
    throw new Error('CONFIG_ERROR: Le poivre cryptographique (HMAC_SECRET / PEPPER) est obligatoire.');
  }
  return createHmac('sha256', secretPepper)
    .update(normalized)
    .digest('hex');
}

/**
 * Extrait les 4 derniers caractères pour identification visuelle sécurisée
 */
export function getLicenseKeyLast4(key: string): string {
  const normalized = normalizeLicenseKey(key);
  const clean = normalized.replace(/-/g, '');
  return clean.slice(-4);
}

/**
 * Masque une clé pour affichage administratif
 * Exemple : ••••••••••••••••NPQR
 */
export function maskLicenseKey(last4: string): string {
  return `••••••••••••••••${last4}`;
}
