"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Validation stricte des entrées et protection anti-pollution
 * Bloque strictement toute tentative d'injection et toute transmission de données scolaires !
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsProhibitedSchoolData = containsProhibitedSchoolData;
exports.validateActivatePayload = validateActivatePayload;
exports.validateVerifyPayload = validateVerifyPayload;
exports.validateHeartbeatPayload = validateHeartbeatPayload;
const keyHasher_1 = require("../crypto/keyHasher");
// Liste noire stricte de clés interdisant toute transmission de données scolaires à Firebase
const PROHIBITED_SCHOOL_KEYS = [
    'student',
    'students',
    'eleve',
    'eleves',
    'teacher',
    'teachers',
    'professeur',
    'professeurs',
    'note',
    'notes',
    'grade',
    'grades',
    'bulletin',
    'bulletins',
    'payment',
    'payments',
    'paiement',
    'paiements',
    'fee',
    'fees',
    'frais',
    'parent',
    'parents',
    'sqlite',
    'database',
    'backup',
    'presence',
    'presences',
    'absence',
    'absences',
];
/**
 * Vérifie récursivement qu'aucun champ scolaire n'est injecté dans le payload
 */
function containsProhibitedSchoolData(obj) {
    if (!obj || typeof obj !== 'object')
        return false;
    for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (PROHIBITED_SCHOOL_KEYS.some((pk) => lowerKey.includes(pk))) {
            return true;
        }
        if (typeof obj[key] === 'object' && containsProhibitedSchoolData(obj[key])) {
            return true;
        }
    }
    return false;
}
/**
 * Validation du payload d'activation POST /api/v1/license/activate
 */
function validateActivatePayload(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { isValid: false, errors: ['Corps de requête invalide ou manquant.'] };
    }
    // 1. Vérification stricte contre les données scolaires
    if (containsProhibitedSchoolData(body)) {
        return {
            isValid: false,
            errors: ['REJET DE SÉCURITÉ : Le serveur de licence RFC refuse formellement toute donnée scolaire.'],
        };
    }
    const { licenseKey, productId, installationId, machineName, os, appVersion } = body;
    // 2. Validation licenseKey
    if (!licenseKey || typeof licenseKey !== 'string') {
        errors.push('Le champ licenseKey est obligatoire.');
    }
    else {
        const normalized = (0, keyHasher_1.normalizeLicenseKey)(licenseKey);
        if (!(0, keyHasher_1.isValidLicenseKeyFormat)(normalized)) {
            errors.push('Format de clé de licence invalide. Le format officiel est IANATRA-XXXX-XXXX-XXXX-XXXX (hors 0, O, 1, I).');
        }
    }
    // 3. Validation productId
    if (!productId || typeof productId !== 'string' || productId.trim() !== 'I-ANATRA') {
        errors.push("Le produit doit être strictement 'I-ANATRA'.");
    }
    // 4. Validation installationId
    const idRegex = /^INS-[0-9A-Z_-]{6,36}$/i;
    if (!installationId || typeof installationId !== 'string' || !idRegex.test(installationId.trim())) {
        errors.push("L'identifiant d'installation (installationId) est invalide. Format attendu: INS-XXXXXXXXXXXX.");
    }
    // 5. Validation machineName
    if (!machineName || typeof machineName !== 'string' || machineName.length > 100) {
        errors.push('machineName obligatoire (chaîne de 1 à 100 caractères max).');
    }
    // 6. Validation os
    if (!os || typeof os !== 'string' || os.length > 50) {
        errors.push('os obligatoire (chaîne de 1 à 50 caractères max).');
    }
    // 7. Validation appVersion
    const versionRegex = /^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$/;
    if (!appVersion || typeof appVersion !== 'string' || !versionRegex.test(appVersion.trim())) {
        errors.push("appVersion invalide (format semver attendu, ex: '1.0.0').");
    }
    if (errors.length > 0) {
        return { isValid: false, errors };
    }
    return {
        isValid: true,
        errors: [],
        sanitized: {
            licenseKey: (0, keyHasher_1.normalizeLicenseKey)(licenseKey),
            productId: productId.trim(),
            installationId: installationId.trim().toUpperCase(),
            machineName: machineName.trim().replace(/[<>]/g, ''),
            os: os.trim().replace(/[<>]/g, ''),
            appVersion: appVersion.trim(),
        },
    };
}
/**
 * Validation du payload de vérification POST /api/v1/license/verify
 */
function validateVerifyPayload(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { isValid: false, errors: ['Corps de requête invalide ou manquant.'] };
    }
    if (containsProhibitedSchoolData(body)) {
        return { isValid: false, errors: ['REJET DE SÉCURITÉ : Données scolaires interdites.'] };
    }
    const { licenseId, productId, installationId } = body;
    if (!licenseId || typeof licenseId !== 'string' || !/^LIC-[0-9A-Z_-]{4,20}$/i.test(licenseId.trim())) {
        errors.push('licenseId invalide.');
    }
    if (!productId || typeof productId !== 'string' || productId.trim() !== 'I-ANATRA') {
        errors.push("productId doit être 'I-ANATRA'.");
    }
    if (!installationId || typeof installationId !== 'string' || !/^INS-[0-9A-Z_-]{6,36}$/i.test(installationId.trim())) {
        errors.push('installationId invalide.');
    }
    if (errors.length > 0) {
        return { isValid: false, errors };
    }
    return {
        isValid: true,
        errors: [],
        sanitized: {
            licenseId: licenseId.trim().toUpperCase(),
            productId: productId.trim(),
            installationId: installationId.trim().toUpperCase(),
        },
    };
}
/**
 * Validation du payload de heartbeat POST /api/v1/license/heartbeat
 */
function validateHeartbeatPayload(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { isValid: false, errors: ['Corps de requête invalide ou manquant.'] };
    }
    if (containsProhibitedSchoolData(body)) {
        return { isValid: false, errors: ['REJET DE SÉCURITÉ : Données scolaires interdites.'] };
    }
    const { licenseId, productId, installationId, appVersion } = body;
    if (!licenseId || typeof licenseId !== 'string' || !/^LIC-[0-9A-Z_-]{4,20}$/i.test(licenseId.trim())) {
        errors.push('licenseId invalide.');
    }
    if (!productId || typeof productId !== 'string' || productId.trim() !== 'I-ANATRA') {
        errors.push("productId doit être 'I-ANATRA'.");
    }
    if (!installationId || typeof installationId !== 'string' || !/^INS-[0-9A-Z_-]{6,36}$/i.test(installationId.trim())) {
        errors.push('installationId invalide.');
    }
    if (!appVersion || typeof appVersion !== 'string' || appVersion.length > 20) {
        errors.push('appVersion invalide.');
    }
    if (errors.length > 0) {
        return { isValid: false, errors };
    }
    return {
        isValid: true,
        errors: [],
        sanitized: {
            licenseId: licenseId.trim().toUpperCase(),
            productId: productId.trim(),
            installationId: installationId.trim().toUpperCase(),
            appVersion: appVersion.trim(),
        },
    };
}
//# sourceMappingURL=schemas.js.map