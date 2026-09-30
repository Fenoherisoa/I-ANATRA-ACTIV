/**
 * RFC OFFICE - I-ANATRA License Server
 * Configuration des routes Express pour Cloud Functions
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Router } from 'express';
import { LicenseController } from '../controllers/licenseController';
import { AdminController } from '../controllers/adminController';
import { createRateLimiter } from '../middleware/rateLimiter';
import { createAdminAuthMiddleware } from '../middleware/authMiddleware';
import { IAdminRepository, ILicenseRepository } from '../repositories/interfaces';
import { CryptoService } from '../services/cryptoService';

export function createLicenseRouter(
  licenseController: LicenseController,
  adminController: AdminController,
  adminRepo: IAdminRepository,
  _licenseRepo: ILicenseRepository,
  cryptoService: CryptoService
): Router {
  const router = Router();

  // Rate Limiting : max 10 tentatives d'activation par minute par client
  const activationLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxAttempts: 10,
    message: 'Trop de tentatives d’activation. Veuillez patienter 1 minute.',
  });

  const generalLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxAttempts: 60,
    message: 'Trop de requêtes. Veuillez patienter.',
  });

  // Health check public
  router.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'OK',
      service: 'RFC OFFICE - I-ANATRA License Server (Firebase)',
      version: '1.0.0',
      crypto: 'Ed25519',
      timestamp: new Date().toISOString(),
    });
  });

  // Clé publique Ed25519 officielle pour vérification hors ligne
  router.get('/api/v1/public-key', (_req, res) => {
    res.status(200).json({
      publicKey: cryptoService.getPublicKeyBase64(),
      algorithm: 'Ed25519',
      organization: 'RFC OFFICE',
      product: 'I-ANATRA',
    });
  });

  // Routes publiques pour le client I-ANATRA.exe
  router.post('/api/v1/license/activate', activationLimiter, licenseController.activate);
  router.post('/api/v1/license/verify', generalLimiter, licenseController.verify);
  router.post('/api/v1/license/heartbeat', generalLimiter, licenseController.heartbeat);

  // Routes privées d'administration (authentifiées par Firebase Auth + RBAC)
  const adminAuth = createAdminAuthMiddleware(adminRepo, ['SUPER_ADMIN', 'LICENSE_MANAGER']);

  router.post('/api/v1/admin/licenses/generate', adminAuth, adminController.generate);
  router.post('/api/v1/admin/licenses/:id/revoke', adminAuth, adminController.revoke);
  router.post('/api/v1/admin/licenses/:id/transfer', adminAuth, adminController.transfer);
  router.get('/api/v1/admin/licenses', adminAuth, adminController.list);

  return router;
}
