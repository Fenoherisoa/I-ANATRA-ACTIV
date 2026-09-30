"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Point d'entrée Firebase Cloud Functions (HTTPS API)
 * © 2026 RFC OFFICE — Tous droits réservés
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cryptoService = exports.licenseService = exports.app = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const express_1 = __importDefault(require("express"));
const firestoreRepositories_1 = require("./repositories/firestoreRepositories");
const cryptoService_1 = require("./services/cryptoService");
const licenseService_1 = require("./services/licenseService");
const licenseController_1 = require("./controllers/licenseController");
const adminController_1 = require("./controllers/adminController");
const routes_1 = require("./api/routes");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json({ limit: '64kb' })); // Protection contre les payloads excessifs
app.use(express_1.default.urlencoded({ extended: true, limit: '64kb' }));
// Initialisation des Repositories Firestore
const licenseRepo = new firestoreRepositories_1.FirestoreLicenseRepository();
const installationRepo = new firestoreRepositories_1.FirestoreInstallationRepository();
const productRepo = new firestoreRepositories_1.FirestoreProductRepository();
const customerRepo = new firestoreRepositories_1.FirestoreCustomerRepository();
const eventRepo = new firestoreRepositories_1.FirestoreActivationEventRepository();
const auditRepo = new firestoreRepositories_1.FirestoreAuditRepository();
const settingsRepo = new firestoreRepositories_1.FirestoreSettingsRepository();
const transferRepo = new firestoreRepositories_1.FirestoreTransferRequestRepository();
const adminRepo = new firestoreRepositories_1.FirestoreAdminRepository();
// Initialisation des Services
const cryptoService = new cryptoService_1.CryptoService();
exports.cryptoService = cryptoService;
const licenseService = new licenseService_1.LicenseService(licenseRepo, installationRepo, productRepo, customerRepo, eventRepo, auditRepo, settingsRepo, transferRepo, cryptoService);
exports.licenseService = licenseService;
// Initialisation des Contrôleurs
const licenseController = new licenseController_1.LicenseController(licenseService);
const adminController = new adminController_1.AdminController(licenseService, licenseRepo);
// Montage des Routes
const router = (0, routes_1.createLicenseRouter)(licenseController, adminController, adminRepo, licenseRepo, cryptoService);
app.use(router);
// Export Cloud Functions v2 HTTPS
exports.api = (0, https_1.onRequest)({
    region: 'europe-west1',
    cors: false, // Pas de CORS ouvert par défaut pour l'API de licensing
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
}, app);
//# sourceMappingURL=index.js.map