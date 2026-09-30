/**
 * RFC OFFICE - I-ANATRA License Server
 * Initialisation Firebase Admin SDK et Firestore
 * Compatible Cloud Functions Production & Firebase Emulator Suite
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let initialized = false;

export function initializeFirebaseAdmin(): App {
  if (!initialized && getApps().length === 0) {
    initializeApp();
    initialized = true;
  }
  return getApp();
}

export function getFirestoreDb(): Firestore {
  initializeFirebaseAdmin();
  const db = getFirestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}

export function getFirebaseAuth(): Auth {
  initializeFirebaseAdmin();
  return getAuth();
}


/**
 * Récupération sécurisée de la configuration depuis les variables d'environnement / Secret Manager
 */
export function getLicensingConfig() {
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
