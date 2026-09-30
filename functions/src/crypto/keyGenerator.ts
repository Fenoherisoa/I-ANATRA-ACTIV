/**
 * RFC OFFICE - I-ANATRA License Server
 * Générateur cryptographiquement sécurisé de clés de licence
 * Format officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { randomBytes } from 'crypto';

// Alphabet sans ambiguïté (exclut 0, O, 1, I pour éviter toute confusion)
export const LICENSE_KEY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const LICENSE_KEY_PREFIX = 'IANATRA';
export const GROUPS_COUNT = 4;
export const GROUP_LENGTH = 4;

/**
 * Génère une clé de licence officielle avec entropie cryptographique forte
 * Entropie : 32^16 = 2^80 = ~1.2 x 10^24 combinaisons possibles
 * Rend toute tentative de recherche par force brute mathématiquement impossible.
 */
export function generateLicenseKey(): string {
  const totalCharsNeeded = GROUPS_COUNT * GROUP_LENGTH;
  // Allocation d'un tampon d'octets aléatoires de haute qualité
  const bytes = randomBytes(totalCharsNeeded * 2);

  const groups: string[] = [];
  let byteIndex = 0;

  for (let g = 0; g < GROUPS_COUNT; g++) {
    let group = '';
    for (let c = 0; c < GROUP_LENGTH; c++) {
      const randValue = bytes[byteIndex++] % LICENSE_KEY_ALPHABET.length;
      group += LICENSE_KEY_ALPHABET[randValue];
    }
    groups.push(group);
  }

  return `${LICENSE_KEY_PREFIX}-${groups.join('-')}`;
}
