/**
 * I-ANATRA License Server - RFC OFFICE
 * Routes d'administration sécurisées (LICENSE ADMIN)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Authentification administrateur
router.get('/auth/setup-status', adminController.getSetupStatus);
router.post('/auth/setup-initial-admin', rateLimiter(60000, 5), adminController.setupInitialAdmin);
router.post('/auth/login', rateLimiter(60000, 5), adminController.login);
router.post('/auth/logout', adminController.logout);
router.post('/auth/change-password', requireAdminAuth(), adminController.changePassword);

// Endpoints sécurisés protégés par JWT & RBAC
router.get('/dashboard', requireAdminAuth(), adminController.getDashboard);

// Gestion clients / écoles
router.get('/customers', requireAdminAuth(), adminController.getCustomers);
router.post('/customers', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.createCustomer);
router.put('/customers/:id', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.updateCustomer);

// Gestion licences
router.get('/licenses', requireAdminAuth(), adminController.getLicenses);
router.post('/licenses/generate', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.generateLicense);
router.post('/licenses/:id/revoke', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.revokeLicense);
router.post('/licenses/:id/renew', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.renewLicense);
router.post('/licenses/:id/transfer', requireAdminAuth(['SUPER_ADMIN', 'LICENSE_MANAGER']), adminController.transferLicense);

// Consultations / Audits
router.get('/installations', requireAdminAuth(), adminController.getInstallations);
router.get('/activation-events', requireAdminAuth(), adminController.getActivationEvents);
router.get('/transfer-requests', requireAdminAuth(), adminController.getTransferRequests);
router.get('/audit-logs', requireAdminAuth(), adminController.getAuditLogs);
router.get('/diagnostics', requireAdminAuth(), adminController.getDiagnostics);
router.post('/tests/run', requireAdminAuth(), adminController.runTests);
router.get('/tests/run', requireAdminAuth(), adminController.runTests);

export default router;
