"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Contrôleur HTTP pour les requêtes publiques du client I-ANATRA
 * Endpoints :
 * - POST /api/v1/license/activate
 * - POST /api/v1/license/verify
 * - POST /api/v1/license/heartbeat
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseController = void 0;
const schemas_1 = require("../validation/schemas");
class LicenseController {
    licenseService;
    constructor(licenseService) {
        this.licenseService = licenseService;
    }
    /**
     * POST /api/v1/license/activate
     */
    activate = async (req, res) => {
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            // 1. Validation stricte des entrées et filtre anti-données scolaires
            const validation = (0, schemas_1.validateActivatePayload)(req.body);
            if (!validation.isValid || !validation.sanitized) {
                return res.status(400).json({
                    success: false,
                    error: 'BAD_REQUEST',
                    message: validation.errors[0] || 'Données fournies invalides.',
                    details: validation.errors,
                });
            }
            // 2. Exécution du service métier
            const result = await this.licenseService.activateLicense(validation.sanitized, ip);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    success: false,
                    error: result.errorCode,
                    message: result.message,
                });
            }
            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Une erreur interne est survenue lors de l’activation.',
            });
        }
    };
    /**
     * POST /api/v1/license/verify
     */
    verify = async (req, res) => {
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            const validation = (0, schemas_1.validateVerifyPayload)(req.body);
            if (!validation.isValid || !validation.sanitized) {
                return res.status(400).json({
                    success: false,
                    error: 'BAD_REQUEST',
                    message: validation.errors[0] || 'Données fournies invalides.',
                    details: validation.errors,
                });
            }
            const result = await this.licenseService.verifyLicense(validation.sanitized, ip);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    success: false,
                    error: result.errorCode,
                    message: result.message,
                });
            }
            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Erreur lors de la vérification de la licence.',
            });
        }
    };
    /**
     * POST /api/v1/license/heartbeat
     */
    heartbeat = async (req, res) => {
        try {
            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            const validation = (0, schemas_1.validateHeartbeatPayload)(req.body);
            if (!validation.isValid || !validation.sanitized) {
                return res.status(400).json({
                    success: false,
                    error: 'BAD_REQUEST',
                    message: validation.errors[0] || 'Données fournies invalides.',
                    details: validation.errors,
                });
            }
            const result = await this.licenseService.processHeartbeat(validation.sanitized, ip);
            if (!result.success) {
                return res.status(result.statusCode).json({
                    success: false,
                    error: result.errorCode,
                    message: result.message,
                });
            }
            return res.status(200).json({
                success: true,
                data: result.data,
                message: result.message,
            });
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Erreur lors du traitement du heartbeat.',
            });
        }
    };
}
exports.LicenseController = LicenseController;
//# sourceMappingURL=licenseController.js.map