/**
 * I-ANATRA License Server - RFC OFFICE
 * Routes REST de licensing pour le client desktop I-ANATRA
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Router } from 'express';
import { licenseController } from '../controllers/licenseController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Endpoints publics client I-ANATRA avec protection contre la force brute
router.post('/activate', rateLimiter(60000, 10), licenseController.activate);
router.post('/verify', rateLimiter(60000, 30), licenseController.verify);
router.post('/heartbeat', rateLimiter(60000, 30), licenseController.heartbeat);

// Opérations de gestion
router.post('/transfer', licenseController.transfer);
router.post('/revoke', licenseController.revoke);

export default router;
