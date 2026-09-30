"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Normalisation et hachage sécurisé HMAC-SHA256 des clés de licence
 * Les clés en clair ne sont JAMAIS stockées dans Firestore !
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLicenseKey = normalizeLicenseKey;
exports.isValidLicenseKeyFormat = isValidLicenseKeyFormat;
exports.hashLicenseKey = hashLicenseKey;
exports.getLicenseKeyLast4 = getLicenseKeyLast4;
exports.maskLicenseKey = maskLicenseKey;
const crypto_1 = require("crypto");
const keyGenerator_1 = require("./keyGenerator");
/**
 * Normalise la clé de licence saisie :
 * - Retire espaces, tirets, underscores
 * - Convertit en majuscules
 * - Reconstitue le format canonique officiel : IANATRA-XXXX-XXXX-XXXX-XXXX
 */
function normalizeLicenseKey(input) {
    if (!input || typeof input !== 'string')
        return '';
    const raw = input.trim().toUpperCase().replace(/[\s\-_]/g, '');
    let payload = '';
    if (raw.startsWith(keyGenerator_1.LICENSE_KEY_PREFIX)) {
        payload = raw.slice(keyGenerator_1.LICENSE_KEY_PREFIX.length);
    }
    else {
        payload = raw;
    }
    if (payload.length === 16) {
        const g1 = payload.slice(0, 4);
        const g2 = payload.slice(4, 8);
        const g3 = payload.slice(8, 12);
        const g4 = payload.slice(12, 16);
        return `${keyGenerator_1.LICENSE_KEY_PREFIX}-${g1}-${g2}-${g3}-${g4}`;
    }
    return input.trim().toUpperCase();
}
/**
 * Valide strictement la structure et l'alphabet de la clé
 * Rejette strictement les caractères ambigus (0, O, 1, I)
 */
function isValidLicenseKeyFormat(key) {
    if (!key || typeof key !== 'string')
        return false;
    const normalized = normalizeLicenseKey(key);
    const regex = /^IANATRA-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
    return regex.test(normalized);
}
/**
 * Calcule l'empreinte cryptographique sécurisée HMAC-SHA256 de la clé
 * avec un poivre serveur secret (issu de Secret Manager ou variables d'environnement).
 */
function hashLicenseKey(key, secretPepper) {
    const normalized = normalizeLicenseKey(key);
    if (!secretPepper) {
        throw new Error('CONFIG_ERROR: Le poivre cryptographique (HMAC_SECRET / PEPPER) est obligatoire.');
    }
    return (0, crypto_1.createHmac)('sha256', secretPepper)
        .update(normalized)
        .digest('hex');
}
/**
 * Extrait les 4 derniers caractères pour identification visuelle sécurisée
 */
function getLicenseKeyLast4(key) {
    const normalized = normalizeLicenseKey(key);
    const clean = normalized.replace(/-/g, '');
    return clean.slice(-4);
}
/**
 * Masque une clé pour affichage administratif
 * Exemple : ••••••••••••••••NPQR
 */
function maskLicenseKey(last4) {
    return `••••••••••••••••${last4}`;
}
//# sourceMappingURL=keyHasher.js.map