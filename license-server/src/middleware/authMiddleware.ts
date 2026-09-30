/**
 * I-ANATRA License Server - RFC OFFICE
 * Middleware de sécurité et contrôle d'accès RBAC
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuthService, AdminSession } from '../services/adminAuthService';
import { AdminRole } from '../database/db';

export interface AuthenticatedRequest extends Request {
  user?: AdminSession;
}

export function requireAdminAuth(allowedRoles?: AdminRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Accès non autorisé. Jeton de session manquant.',
      });
      return;
    }

    const token = authHeader.substring(7);
    const session = adminAuthService.verifySession(token);

    if (!session) {
      res.status(401).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Session expirée ou jeton invalide. Veuillez vous reconnecter.',
      });
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const isAllowed = adminAuthService.checkRole(session.role, allowedRoles);
      if (!isAllowed) {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Permissions insuffisantes pour effectuer cette opération.',
        });
        return;
      }
    }

    req.user = session;
    next();
  };
}
