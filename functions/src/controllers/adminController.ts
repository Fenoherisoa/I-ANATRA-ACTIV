/**
 * RFC OFFICE - I-ANATRA License Server
 * Contrôleur d'administration pour la gestion des clients et des licences
 * Endpoints protégés par Firebase Auth + RBAC :
 * - POST /api/v1/admin/licenses/generate
 * - POST /api/v1/admin/licenses/:id/revoke
 * - POST /api/v1/admin/licenses/:id/transfer
 * - GET  /api/v1/admin/licenses
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Response } from 'express';
import { LicenseService } from '../services/licenseService';
import { AuthenticatedAdminRequest } from '../middleware/authMiddleware';
import { ILicenseRepository } from '../repositories/interfaces';

export class AdminController {
  constructor(
    private licenseService: LicenseService,
    private licenseRepo: ILicenseRepository
  ) {}

  /**
   * POST /api/v1/admin/licenses/generate
   */
  public generate = async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const { customerId, licenseType, features, expiresAt } = req.body;
      const actorId = req.adminUser?.adminId || 'SUPER_ADMIN';

      if (!customerId || typeof customerId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Le champ customerId est obligatoire.',
        });
      }

      const { rawKey, license } = await this.licenseService.createLicense({
        customerId: customerId.trim(),
        licenseType: licenseType || 'FREE',
        features,
        actorId,
        expiresAt,
      });

      return res.status(201).json({
        success: true,
        data: {
          licenseId: license.licenseId,
          productId: license.productId,
          customerId: license.customerId,
          licenseType: license.licenseType,
          licenseKey: rawKey, // Affiché UNE SEULE FOIS à l'administrateur
          maskedKey: `••••••••••••••••${license.licenseKeyLast4}`,
          status: license.status,
          maxInstallations: license.maxInstallations,
          createdAt: license.createdAt,
        },
        message: 'Licence générée avec succès.',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la génération de la licence.',
      });
    }
  };

  /**
   * POST /api/v1/admin/licenses/:id/revoke
   */
  public revoke = async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const licenseId = req.params.id;
      const { reason } = req.body;
      const actorId = req.adminUser?.adminId || 'SUPER_ADMIN';

      const result = await this.licenseService.revokeLicense(
        licenseId,
        actorId,
        reason || 'Révocation administrative RFC OFFICE'
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la révocation de la licence.',
      });
    }
  };

  /**
   * POST /api/v1/admin/licenses/:id/transfer
   */
  public transfer = async (req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const licenseId = req.params.id;
      const { fromInstallationId, toInstallationId, reason } = req.body;
      const actorId = req.adminUser?.adminId || 'SUPER_ADMIN';

      if (!fromInstallationId || !toInstallationId) {
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Les champs fromInstallationId et toInstallationId sont obligatoires.',
        });
      }

      const result = await this.licenseService.transferLicense(
        licenseId,
        fromInstallationId,
        toInstallationId,
        actorId,
        reason || 'Transfert de poste autorisé'
      );

      return res.status(result.statusCode).json({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors du transfert de licence.',
      });
    }
  };

  /**
   * GET /api/v1/admin/licenses
   */
  public list = async (_req: AuthenticatedAdminRequest, res: Response) => {
    try {
      const licenses = await this.licenseRepo.listAll();
      const safeLicenses = licenses.map((l) => ({
        licenseId: l.licenseId,
        productId: l.productId,
        customerId: l.customerId,
        licenseType: l.licenseType,
        status: l.status,
        maskedKey: `••••••••••••••••${l.licenseKeyLast4}`,
        createdAt: l.createdAt,
        activatedAt: l.activatedAt,
        expiresAt: l.expiresAt,
        maxInstallations: l.maxInstallations,
        features: l.features,
      }));

      return res.status(200).json({
        success: true,
        data: safeLicenses,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des licences.',
      });
    }
  };
}
