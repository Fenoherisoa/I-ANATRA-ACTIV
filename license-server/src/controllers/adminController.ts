/**
 * I-ANATRA License Server - RFC OFFICE
 * Contrôleur d'administration (Dashboard, Clients, Licences, Audit, Diagnostic)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Response } from 'express';
import { db } from '../database/db';
import { adminAuthService } from '../services/adminAuthService';
import { customerService } from '../services/customerService';
import { licenseService } from '../services/licenseService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AdminController {
  /**
   * POST /api/v1/admin/auth/login
   */
  public login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Identifiants requis.' });
      return;
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
    const result = adminAuthService.login(username, password, ipAddress);

    if (!result) {
      res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Nom d’utilisateur ou mot de passe incorrect.',
      });
      return;
    }

    res.status(200).json({ success: true, ...result });
  };

  /**
   * GET /api/v1/admin/auth/setup-status
   */
  public getSetupStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const setupRequired = adminAuthService.isSetupRequired();
    res.status(200).json({
      success: true,
      setupRequired,
      adminCount: db.admins.length,
      product: 'IANATRA',
    });
  };

  /**
   * POST /api/v1/admin/auth/setup-initial-admin
   */
  public setupInitialAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { username, email, fullName, password } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
      const result = adminAuthService.setupInitialAdmin({
        username,
        email,
        fullName,
        password,
        ipAddress,
      });
      res.status(201).json({ success: true, ...result, message: 'Premier administrateur RFC OFFICE configuré avec succès.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Erreur lors de la configuration.' });
    }
  };

  /**
   * POST /api/v1/admin/auth/change-password
   */
  public changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!req.user?.id) {
        res.status(401).json({ success: false, error: 'Non authentifié.' });
        return;
      }
      adminAuthService.changePassword(req.user.id, oldPassword, newPassword);
      res.status(200).json({ success: true, message: 'Mot de passe modifié avec succès.' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  };

  /**
   * POST /api/v1/admin/auth/logout
   */
  public logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ success: true, message: 'Déconnexion effectuée.' });
  };

  /**
   * GET /api/v1/admin/dashboard
   */
  public getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const totalCustomers = db.customers.length;
    const totalLicenses = db.licenses.length;
    const activeLicenses = db.licenses.filter((l) => l.status === 'ACTIVE').length;
    const expiredLicenses = db.licenses.filter((l) => l.status === 'EXPIRED').length;
    const revokedLicenses = db.licenses.filter((l) => l.status === 'REVOKED').length;
    const activeInstallations = db.installations.filter((i) => i.status === 'ACTIVE').length;

    // Licences arrivant à expiration sous 30 jours
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const expiringSoon = db.licenses.filter((l) => {
      if (!l.expiresAt || l.status !== 'ACTIVE') return false;
      const exp = new Date(l.expiresAt);
      return exp > new Date() && exp <= in30Days;
    }).map((l) => {
      const cust = db.customers.find((c) => c.id === l.customerId);
      return {
        licenseId: l.licenseId,
        schoolName: cust?.schoolName || 'Inconnu',
        expiresAt: l.expiresAt,
        licenseType: l.licenseType,
      };
    });

    const recentActivations = db.activationEvents.slice(0, 10);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        revokedLicenses,
        activeInstallations,
      },
      expiringSoon,
      recentActivations,
      system: {
        status: 'OPERATIONAL',
        version: '1.0.0',
        publicKey: db.keys.publicKey,
        serverTime: new Date().toISOString(),
      },
    });
  };

  /**
   * GET /api/v1/admin/customers
   */
  public getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const customersWithStats = db.customers.map((c) => {
      const licenses = db.licenses.filter((l) => l.customerId === c.id);
      const installations = db.installations.filter((i) => i.customerId === c.id);
      return {
        ...c,
        licenseCount: licenses.length,
        installationCount: installations.length,
      };
    });
    res.status(200).json({ success: true, customers: customersWithStats });
  };

  /**
   * POST /api/v1/admin/customers
   */
  public createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { schoolName, responsibleName, email, phone, address, city, country, notes } = req.body;
    if (!schoolName || !responsibleName || !email) {
      res.status(400).json({ success: false, error: 'Champs obligatoires manquants.' });
      return;
    }

    const customer = customerService.create(
      { schoolName, responsibleName, email, phone, address, city, country, notes },
      req.user?.id
    );

    res.status(201).json({ success: true, customer });
  };

  /**
   * PUT /api/v1/admin/customers/:id
   */
  public updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const customer = customerService.update(id, req.body, req.user?.id);
    if (!customer) {
      res.status(404).json({ success: false, error: 'Client introuvable.' });
      return;
    }
    res.status(200).json({ success: true, customer });
  };

  /**
   * GET /api/v1/admin/licenses
   */
  public getLicenses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const licensesWithDetails = db.licenses.map((lic) => {
      const customer = db.customers.find((c) => c.id === lic.customerId);
      const activeInst = db.installations.find(
        (i) => i.licenseId === lic.id && i.status === 'ACTIVE'
      );
      return {
        ...lic,
        customerName: customer?.schoolName || 'Inconnu',
        customerCode: customer?.customerCode || 'N/A',
        activeInstallationId: activeInst?.installationId || null,
        activeMachineName: activeInst?.machineName || null,
        lastSeenAt: activeInst?.lastSeenAt || null,
        // Ne jamais renvoyer le hash sensible complet, juste le masqué
        maskedKey: `••••••••••••••••${lic.licenseKeyLast4}`,
      };
    });

    res.status(200).json({ success: true, licenses: licensesWithDetails });
  };

  /**
   * POST /api/v1/admin/licenses/generate
   */
  public generateLicense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { customerId, productCode, licenseType, durationMonths, maxInstallations, features } =
        req.body;

      if (!customerId) {
        res.status(400).json({ success: false, error: 'customerId est requis.' });
        return;
      }

      const { rawKey, license } = licenseService.generateLicense({
        customerId,
        productCode: productCode || 'IANATRA',
        licenseType: licenseType || 'ANNUAL',
        durationMonths: durationMonths !== undefined ? Number(durationMonths) : 12,
        maxInstallations: maxInstallations !== undefined ? Number(maxInstallations) : 1,
        features,
        adminId: req.user?.id,
      });

      res.status(201).json({
        success: true,
        message: 'Licence générée avec succès.',
        rawLicenseKey: rawKey, // Affiché UNE SEULE FOIS
        license: {
          licenseId: license.licenseId,
          licenseType: license.licenseType,
          status: license.status,
          expiresAt: license.expiresAt,
          maxInstallations: license.maxInstallations,
          licenseKeyLast4: license.licenseKeyLast4,
        },
        notice:
          'IMPORTANT : Copiez cette clé maintenant. Elle ne pourra plus être affichée intégralement ultérieurement.',
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  /**
   * POST /api/v1/admin/licenses/:id/revoke
   */
  public revokeLicense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { reason } = req.body;
    const ok = licenseService.revokeLicense(id, reason || 'Révocation manuelle admin', req.user?.id);
    if (!ok) {
      res.status(404).json({ success: false, error: 'Licence introuvable.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Licence révoquée avec succès.' });
  };

  /**
   * POST /api/v1/admin/licenses/:id/renew
   */
  public renewLicense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { months } = req.body;
      const renewed = licenseService.renewLicense(id, Number(months) || 12, req.user?.id);
      res.status(200).json({ success: true, license: renewed });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  /**
   * POST /api/v1/admin/licenses/:id/transfer
   */
  public transferLicense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { oldInstallationId, newInstallationId, reason } = req.body;
      const result = licenseService.transferLicense({
        licenseId: id,
        oldInstallationId,
        newInstallationId,
        reason: reason || 'Changement de poste de travail établissement',
        adminId: req.user?.id,
      });
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  /**
   * GET /api/v1/admin/installations
   */
  public getInstallations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const installationsWithDetails = db.installations.map((inst) => {
      const cust = db.customers.find((c) => c.id === inst.customerId);
      const lic = db.licenses.find((l) => l.id === inst.licenseId);
      return {
        ...inst,
        schoolName: cust?.schoolName || 'Inconnu',
        licenseId: lic?.licenseId || 'N/A',
      };
    });
    res.status(200).json({ success: true, installations: installationsWithDetails });
  };

  /**
   * GET /api/v1/admin/activation-events
   */
  public getActivationEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ success: true, events: db.activationEvents });
  };

  /**
   * GET /api/v1/admin/transfer-requests
   */
  public getTransferRequests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const enriched = db.transferRequests.map((tr) => {
      const lic = db.licenses.find((l) => l.id === tr.licenseId);
      const cust = lic ? db.customers.find((c) => c.id === lic.customerId) : null;
      return {
        ...tr,
        licensePublicId: lic?.licenseId || 'N/A',
        schoolName: cust?.schoolName || 'N/A',
      };
    });
    res.status(200).json({ success: true, transferRequests: enriched });
  };

  /**
   * GET /api/v1/admin/audit-logs
   */
  public getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({ success: true, auditLogs: db.auditLogs });
  };

  /**
   * GET /api/v1/admin/diagnostics
   */
  public getDiagnostics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      service: 'I-ANATRA LICENSE SERVER',
      version: '1.0.0',
      nodeVersion: process.version,
      crypto: {
        algorithm: 'Ed25519 (RFC 8032)',
        publicKey: db.keys.publicKey,
        hasPrivateKey: !!db.keys.privateKey,
      },
      counts: {
        admins: db.admins.length,
        customers: db.customers.length,
        licenses: db.licenses.length,
        installations: db.installations.length,
        events: db.activationEvents.length,
        auditLogs: db.auditLogs.length,
      },
    });
  };

  /**
   * POST /api/v1/admin/tests/run
   */
  public runTests = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { runAllTests } = await import('../../../tests/run-all-tests');
      const results = await runAllTests();
      res.status(200).json({ success: true, ...results });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Erreur exécution tests' });
    }
  };
}

export const adminController = new AdminController();
