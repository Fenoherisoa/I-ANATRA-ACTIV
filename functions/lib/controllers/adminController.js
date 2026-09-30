"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
class AdminController {
    licenseService;
    licenseRepo;
    constructor(licenseService, licenseRepo) {
        this.licenseService = licenseService;
        this.licenseRepo = licenseRepo;
    }
    /**
     * POST /api/v1/admin/licenses/generate
     */
    generate = async (req, res) => {
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
        }
        catch (error) {
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
    revoke = async (req, res) => {
        try {
            const licenseId = req.params.id;
            const { reason } = req.body;
            const actorId = req.adminUser?.adminId || 'SUPER_ADMIN';
            const result = await this.licenseService.revokeLicense(licenseId, actorId, reason || 'Révocation administrative RFC OFFICE');
            return res.status(result.statusCode).json({
                success: result.success,
                message: result.message,
            });
        }
        catch (error) {
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
    transfer = async (req, res) => {
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
            const result = await this.licenseService.transferLicense(licenseId, fromInstallationId, toInstallationId, actorId, reason || 'Transfert de poste autorisé');
            return res.status(result.statusCode).json({
                success: result.success,
                message: result.message,
            });
        }
        catch (error) {
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
    list = async (_req, res) => {
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
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Erreur lors de la récupération des licences.',
            });
        }
    };
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map