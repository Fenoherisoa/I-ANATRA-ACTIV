/**
 * RFC OFFICE - I-ANATRA License Server
 * Point d'entrée Firebase Cloud Functions (HTTPS API)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import {
  FirestoreLicenseRepository,
  FirestoreInstallationRepository,
  FirestoreProductRepository,
  FirestoreCustomerRepository,
  FirestoreActivationEventRepository,
  FirestoreAuditRepository,
  FirestoreSettingsRepository,
  FirestoreTransferRequestRepository,
  FirestoreAdminRepository,
} from './repositories/firestoreRepositories';
import { CryptoService } from './services/cryptoService';
import { LicenseService } from './services/licenseService';
import { LicenseController } from './controllers/licenseController';
import { AdminController } from './controllers/adminController';
import { createLicenseRouter } from './api/routes';

const app = express();

app.use(express.json({ limit: '64kb' })); // Protection contre les payloads excessifs
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Initialisation des Repositories Firestore
const licenseRepo = new FirestoreLicenseRepository();
const installationRepo = new FirestoreInstallationRepository();
const productRepo = new FirestoreProductRepository();
const customerRepo = new FirestoreCustomerRepository();
const eventRepo = new FirestoreActivationEventRepository();
const auditRepo = new FirestoreAuditRepository();
const settingsRepo = new FirestoreSettingsRepository();
const transferRepo = new FirestoreTransferRequestRepository();
const adminRepo = new FirestoreAdminRepository();

// Initialisation des Services
const cryptoService = new CryptoService();
const licenseService = new LicenseService(
  licenseRepo,
  installationRepo,
  productRepo,
  customerRepo,
  eventRepo,
  auditRepo,
  settingsRepo,
  transferRepo,
  cryptoService
);

// Initialisation des Contrôleurs
const licenseController = new LicenseController(licenseService);
const adminController = new AdminController(licenseService, licenseRepo);

// Montage des Routes
const router = createLicenseRouter(licenseController, adminController, adminRepo, licenseRepo, cryptoService);
app.use(router);

// Export Cloud Functions v2 HTTPS
export const api = onRequest(
  {
    region: 'europe-west1',
    cors: false, // Pas de CORS ouvert par défaut pour l'API de licensing
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  app
);

// Exportation de l'application Express pour tests unitaires et intégration locale
export { app, licenseService, cryptoService };
