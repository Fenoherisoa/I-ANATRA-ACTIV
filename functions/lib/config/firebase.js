"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Initialisation Firebase Admin SDK et Firestore
 * Compatible Cloud Functions Production & Firebase Emulator Suite
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFirebaseAdmin = initializeFirebaseAdmin;
exports.getFirestoreDb = getFirestoreDb;
exports.getFirebaseAuth = getFirebaseAuth;
exports.getLicensingConfig = getLicensingConfig;
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
let initialized = false;
function initializeFirebaseAdmin() {
    if (!initialized && (0, app_1.getApps)().length === 0) {
        (0, app_1.initializeApp)();
        initialized = true;
    }
    return (0, app_1.getApp)();
}
function getFirestoreDb() {
    initializeFirebaseAdmin();
    const db = (0, firestore_1.getFirestore)();
    db.settings({ ignoreUndefinedProperties: true });
    return db;
}
function getFirebaseAuth() {
    initializeFirebaseAdmin();
    return (0, auth_1.getAuth)();
}
/**
 * Récupération sécurisée de la configuration depuis les variables d'environnement / Secret Manager
 */
function getLicensingConfig() {
    const secretPepper = process.env.HMAC_SECRET || process.env.LICENSE_PEPPER || 'RFC-OFFICE-IANATRA-SECURE-PEPPER-2026-DEFAULT';
    const ed25519PrivateKey = process.env.ED25519_PRIVATE_KEY || '';
    const ed25519PublicKey = process.env.ED25519_PUBLIC_KEY || '';
    const gracePeriodDays = parseInt(process.env.GRACE_PERIOD_DAYS || '30', 10);
    return {
        secretPepper,
        ed25519PrivateKey,
        ed25519PublicKey,
        gracePeriodDays,
    };
}
//# sourceMappingURL=firebase.js.map