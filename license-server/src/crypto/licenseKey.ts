/**
 * I-ANATRA License Server - RFC OFFICE
 * Génération et hachage sécurisé de clés de licence
 * Format : IANATRA-XXXX-XXXX-XXXX-XXXX
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { createHash, randomBytes } from 'crypto';
import {
  LICENSE_KEY_ALPHABET as ALPHABET,
  LICENSE_KEY_PREFIX as PREFIX,
  normalizeLicenseKey,
  isValidLicenseKeyFormat,
  getLicenseKeyLast4,
  maskLicenseKey,
} from '../../../i-anatra/licensing/licenseFormat';

export { normalizeLicenseKey, isValidLicenseKeyFormat, getLicenseKeyLast4, maskLicenseKey };

const BLOCK_COUNT = 4;
const BLOCK_LENGTH = 4;

/**
 * Génère une clé de licence cryptographiquement sécurisée
 * Exemple : IANATRA-7K4P-92XF-M8QD-5T2A
 */
export function generateLicenseKey(): string {
  const blocks: string[] = [];
  const totalCharsNeeded = BLOCK_COUNT * BLOCK_LENGTH;
  const bytes = randomBytes(totalCharsNeeded * 2);

  let byteIdx = 0;
  for (let b = 0; b < BLOCK_COUNT; b++) {
    let block = '';
    for (let c = 0; c < BLOCK_LENGTH; c++) {
      const randValue = bytes[byteIdx++] % ALPHABET.length;
      block += ALPHABET[randValue];
    }
    blocks.push(block);
  }

  return `${PREFIX}-${blocks.join('-')}`;
}

/**
 * Hache la clé de licence pour stockage sécurisé en base de données.
 * NE JAMAIS stocker la clé brute en base !
 */
export function hashLicenseKey(key: string, pepper: string = 'RFC-IANATRA-PEPPER-2026'): string {
  const normalized = normalizeLicenseKey(key);
  return createHash('sha256')
    .update(`${pepper}:${normalized}`)
    .digest('hex');
}

