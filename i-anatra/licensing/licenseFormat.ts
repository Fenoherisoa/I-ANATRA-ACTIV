/**
 * I-ANATRA Licensing Ecosystem - RFC OFFICE
 * Utilitaires de formatage et de validation de clé (Compatible Navigateur et Serveur)
 * Format officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
 * © 2026 RFC OFFICE — Tous droits réservés
 */

// Alphabet non-ambigu (exclut 0, O, 1, I pour éviter les confusions de saisie)
export const LICENSE_KEY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const LICENSE_KEY_PREFIX = 'IANATRA';

/**
 * Normalise la clé :
 * - Supprime les espaces superflus, tirets et séparateurs variés
 * - Convertit en majuscules
 * - Prend en charge la saisie avec ou sans tirets et avec ou sans préfixe
 * - Reformate au format canonique officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
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
    const p1 = payload.slice(0, 4);
    const p2 = payload.slice(4, 8);
    const p3 = payload.slice(8, 12);
    const p4 = payload.slice(12, 16);
    return `${LICENSE_KEY_PREFIX}-${p1}-${p2}-${p3}-${p4}`;
  }

  return input.trim().toUpperCase();
}

/**
 * Valide le format d'une clé de licence I-ANATRA
 * Exclut explicitement les caractères ambigus (0, O, 1, I)
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const normalized = normalizeLicenseKey(key);
  const regex = /^IANATRA-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  return regex.test(normalized);
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
 * Masque la clé pour affichage administratif
 * Exemple : ••••••••••••••••5T2A
 */
export function maskLicenseKey(last4: string): string {
  return `••••••••••••••••${last4}`;
}
