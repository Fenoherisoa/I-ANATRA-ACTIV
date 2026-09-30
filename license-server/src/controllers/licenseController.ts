/**
 * I-ANATRA License Server - RFC OFFICE
 * Contrôleur des endpoints publics de licensing (I-ANATRA Windows Client)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Request, Response } from 'express';
import { licenseService } from '../services/licenseService';

export class LicenseController {
  /**
   * POST /api/v1/license/activate
   */
  public activate = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseKey, installationId, productCode, appVersion, machineName, osVersion } = req.body;

      if (!licenseKey || !installationId || !productCode) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'Les champs licenseKey, installationId et productCode sont obligatoires.',
        });
        return;
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();

      const result = licenseService.activate({
        licenseKey,
        installationId,
        productCode,
        appVersion: appVersion || '1.0.0',
        machineName: machineName || 'PC-INCONNU',
        osVersion: osVersion || 'Windows',
        ipAddress,
      });

      if (!result.success) {
        const statusCode =
          result.error === 'LICENSE_ALREADY_BOUND'
            ? 409
            : result.error === 'LICENSE_EXPIRED' || result.error === 'LICENSE_REVOKED'
            ? 403
            : result.error === 'LICENSE_NOT_FOUND'
            ? 404
            : 400;

        res.status(statusCode).json(result);
        return;
      }

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Erreur activation :', error);
      res.status(500).json({
        success: false,
        error: 'SERVER_UNAVAILABLE',
        message: 'Le serveur de licence est momentanément indisponible. Vérifiez votre connexion Internet et réessayez.',
      });
    }
  };

  /**
   * POST /api/v1/license/verify
   */
  public verify = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId, installationId, appVersion } = req.body;

      if (!licenseId || !installationId) {
        res.status(400).json({
          valid: false,
          error: 'MISSING_FIELDS',
          message: 'licenseId et installationId sont obligatoires.',
        });
        return;
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
      const result = licenseService.verify(licenseId, installationId, appVersion || '1.0.0', ipAddress);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Erreur vérification :', error);
      res.status(500).json({
        valid: false,
        error: 'SERVER_UNAVAILABLE',
        message: 'Le serveur de licence est momentanément indisponible.',
      });
    }
  };

  /**
   * POST /api/v1/license/heartbeat
   */
  public heartbeat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId, installationId } = req.body;

      if (!licenseId || !installationId) {
        res.status(400).json({ ok: false, error: 'MISSING_FIELDS' });
        return;
      }

      const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
      const result = licenseService.heartbeat(licenseId, installationId, ipAddress);

      res.status(200).json(result);
    } catch (error: any) {
      console.error('Erreur heartbeat :', error);
      res.status(500).json({ ok: false, error: 'SERVER_UNAVAILABLE' });
    }
  };

  /**
   * POST /api/v1/license/transfer
   */
  public transfer = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId, oldInstallationId, newInstallationId, reason } = req.body;

      if (!licenseId || !oldInstallationId || !reason) {
        res.status(400).json({
          success: false,
          error: 'MISSING_FIELDS',
          message: 'licenseId, oldInstallationId et reason sont requis.',
        });
        return;
      }

      const result = licenseService.transferLicense({
        licenseId,
        oldInstallationId,
        newInstallationId,
        reason,
        adminId: (req as any).user?.id || 'API',
      });

      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: 'TRANSFER_FAILED',
        message: error.message || 'Échec du transfert.',
      });
    }
  };

  /**
   * POST /api/v1/license/revoke
   */
  public revoke = async (req: Request, res: Response): Promise<void> => {
    try {
      const { licenseId, reason } = req.body;

      if (!licenseId) {
        res.status(400).json({ success: false, error: 'MISSING_LICENSE_ID' });
        return;
      }

      const ok = licenseService.revokeLicense(
        licenseId,
        reason || 'Révocation demandée',
        (req as any).user?.id || 'API'
      );

      if (!ok) {
        res.status(404).json({ success: false, error: 'LICENSE_NOT_FOUND' });
        return;
      }

      res.status(200).json({ success: true, message: 'Licence révoquée avec succès.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: 'REVOKE_FAILED' });
    }
  };
}

export const licenseController = new LicenseController();
