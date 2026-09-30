"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Générateur cryptographiquement sécurisé de clés de licence
 * Format officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUP_LENGTH = exports.GROUPS_COUNT = exports.LICENSE_KEY_PREFIX = exports.LICENSE_KEY_ALPHABET = void 0;
exports.generateLicenseKey = generateLicenseKey;
const crypto_1 = require("crypto");
// Alphabet sans ambiguïté (exclut 0, O, 1, I pour éviter toute confusion)
exports.LICENSE_KEY_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
exports.LICENSE_KEY_PREFIX = 'IANATRA';
exports.GROUPS_COUNT = 4;
exports.GROUP_LENGTH = 4;
/**
 * Génère une clé de licence officielle avec entropie cryptographique forte
 * Entropie : 32^16 = 2^80 = ~1.2 x 10^24 combinaisons possibles
 * Rend toute tentative de recherche par force brute mathématiquement impossible.
 */
function generateLicenseKey() {
    const totalCharsNeeded = exports.GROUPS_COUNT * exports.GROUP_LENGTH;
    // Allocation d'un tampon d'octets aléatoires de haute qualité
    const bytes = (0, crypto_1.randomBytes)(totalCharsNeeded * 2);
    const groups = [];
    let byteIndex = 0;
    for (let g = 0; g < exports.GROUPS_COUNT; g++) {
        let group = '';
        for (let c = 0; c < exports.GROUP_LENGTH; c++) {
            const randValue = bytes[byteIndex++] % exports.LICENSE_KEY_ALPHABET.length;
            group += exports.LICENSE_KEY_ALPHABET[randValue];
        }
        groups.push(group);
    }
    return `${exports.LICENSE_KEY_PREFIX}-${groups.join('-')}`;
}
//# sourceMappingURL=keyGenerator.js.map