"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Service Métier de Licensing (Activation, Vérification, Heartbeat, Révocation, Transfert)
 * Totalement découplé de Firestore grâce aux interfaces de Repositories
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseService = void 0;
class LicenseService {
    licenseRepo;
    installationRepo;
    productRepo;
    customerRepo;
    eventRepo;
    auditRepo;
    settingsRepo;
    transferRepo;
    cryptoService;
    constructor(licenseRepo, installationRepo, productRepo, customerRepo, eventRepo, auditRepo, settingsRepo, transferRepo, cryptoService) {
        this.licenseRepo = licenseRepo;
        this.installationRepo = installationRepo;
        this.productRepo = productRepo;
        this.customerRepo = customerRepo;
        this.eventRepo = eventRepo;
        this.auditRepo = auditRepo;
        this.settingsRepo = settingsRepo;
        this.transferRepo = transferRepo;
        this.cryptoService = cryptoService;
    }
    getProductRepository() {
        return this.productRepo;
    }
    getCustomerRepository() {
        return this.customerRepo;
    }
    getSettingsRepository() {
        return this.settingsRepo;
    }
    /**
     * 1. Activation d'une licence I-ANATRA
     */
    async activateLicense(payload, ipAddress) {
        const timestamp = new Date().toISOString();
        const { licenseKey, productId, installationId, machineName, os, appVersion } = payload;
        // 1. Vérification du format
        if (!this.cryptoService.validateFormat(licenseKey)) {
            await this.recordEvent(null, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Format de clé invalide.');
            return {
                success: false,
                statusCode: 400,
                errorCode: 'INVALID_LICENSE_KEY_FORMAT',
                message: 'Format de clé de licence invalide. Le format officiel est IANATRA-XXXX-XXXX-XXXX-XXXX.',
            };
        }
        // 2. Recherche par empreinte cryptographique (la clé brute n'est jamais stockée)
        const keyHash = this.cryptoService.hashKey(licenseKey);
        const license = await this.licenseRepo.findByHash(keyHash);
        if (!license) {
            await this.recordEvent(null, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Clé inconnue.');
            return {
                success: false,
                statusCode: 404,
                errorCode: 'LICENSE_NOT_FOUND',
                message: "Cette clé d'activation n'existe pas ou n'a pas été émise par RFC OFFICE.",
            };
        }
        // 3. Vérification du produit
        if (license.productId !== productId) {
            await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Produit discordant.');
            return {
                success: false,
                statusCode: 403,
                errorCode: 'INVALID_PRODUCT',
                message: `Cette clé de licence est attribuée à ${license.productId} et ne peut pas activer ${productId}.`,
            };
        }
        // 4. Vérification du statut de la licence
        if (license.status === 'REVOKED') {
            await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Licence révoquée.');
            return {
                success: false,
                statusCode: 403,
                errorCode: 'LICENSE_REVOKED',
                message: 'Cette licence a été révoquée par RFC OFFICE. Contactez le support.',
            };
        }
        if (license.status === 'BLOCKED') {
            await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Licence bloquée.');
            return {
                success: false,
                statusCode: 403,
                errorCode: 'LICENSE_BLOCKED',
                message: 'Cette licence a été suspendue pour des raisons de sécurité par RFC OFFICE.',
            };
        }
        if (license.status === 'EXPIRED') {
            await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Licence expirée.');
            return {
                success: false,
                statusCode: 403,
                errorCode: 'LICENSE_EXPIRED',
                message: 'Cette licence I-ANATRA a expiré.',
            };
        }
        // 5. Vérification de la date d'expiration temporelle
        if (license.expiresAt) {
            const expDate = new Date(license.expiresAt);
            if (expDate.getTime() < Date.now()) {
                await this.licenseRepo.update(license.licenseId, { status: 'EXPIRED' });
                await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Date d\'expiration échue.');
                return {
                    success: false,
                    statusCode: 403,
                    errorCode: 'LICENSE_EXPIRED',
                    message: 'La période de validité de votre licence est terminée.',
                };
            }
        }
        // 6. Gestion stricte des installations (Limitation à maxInstallations = 1)
        const existingInstallations = await this.installationRepo.findByLicenseId(license.licenseId);
        const activeInstallations = existingInstallations.filter((i) => i.status === 'ACTIVE');
        const sameMachineInstall = existingInstallations.find((i) => i.installationId === installationId);
        if (sameMachineInstall) {
            // Réactivation ou rafraîchissement légitime sur la même machine
            await this.installationRepo.update(installationId, {
                lastSeenAt: timestamp,
                machineName,
                os,
                appVersion,
                status: 'ACTIVE',
            });
        }
        else {
            // Nouvelle machine
            if (activeInstallations.length >= license.maxInstallations) {
                await this.recordEvent(license.licenseId, installationId, productId, 'FAILED_ACTIVATION', 'FAILURE', ipAddress, appVersion, 'Tentative double activation.');
                return {
                    success: false,
                    statusCode: 409,
                    errorCode: 'LICENSE_ALREADY_ACTIVATED',
                    message: 'Cette licence est déjà associée à une autre installation. Veuillez contacter RFC OFFICE pour un transfert de poste.',
                };
            }
            // Enregistrement de la nouvelle installation
            const newInstallation = {
                installationId,
                licenseId: license.licenseId,
                productId,
                machineName,
                os,
                appVersion,
                activatedAt: timestamp,
                lastSeenAt: timestamp,
                status: 'ACTIVE',
            };
            await this.installationRepo.create(newInstallation);
        }
        // 7. Mise à jour de l'état de la licence
        await this.licenseRepo.update(license.licenseId, {
            status: 'ACTIVE',
            activatedAt: license.activatedAt || timestamp,
            lastVerification: timestamp,
        });
        // 8. Génération du certificat signé numériquement Ed25519
        const certPayload = {
            licenseId: license.licenseId,
            productId: license.productId,
            customerId: license.customerId,
            licenseType: license.licenseType,
            installationId,
            status: 'ACTIVE',
            issuedAt: timestamp,
            expiresAt: license.expiresAt,
            features: license.features,
        };
        const signedCert = this.cryptoService.signCertificate(certPayload);
        // 9. Enregistrement d'événement et journal d'audit
        await this.recordEvent(license.licenseId, installationId, productId, 'ACTIVATION', 'SUCCESS', ipAddress, appVersion, 'Activation réussie.');
        await this.auditRepo.create({
            auditId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            action: 'LICENSE_ACTIVATION',
            actorId: installationId,
            licenseId: license.licenseId,
            customerId: license.customerId,
            timestamp,
            result: 'SUCCESS',
            metadata: { machineName, os, appVersion, ipAddress },
        });
        return {
            success: true,
            statusCode: 200,
            data: {
                status: 'ACTIVE',
                licenseId: license.licenseId,
                productId: license.productId,
                licenseType: license.licenseType,
                certificate: signedCert,
            },
            message: 'Activation réussie avec succès.',
        };
    }
    /**
     * 2. Vérification périodique d'une licence POST /api/v1/license/verify
     */
    async verifyLicense(payload, ipAddress) {
        const timestamp = new Date().toISOString();
        const { licenseId, productId, installationId } = payload;
        const license = await this.licenseRepo.findById(licenseId);
        if (!license) {
            await this.recordEvent(licenseId, installationId, productId, 'VERIFICATION', 'FAILURE', ipAddress, 'unknown', 'Licence introuvable.');
            return {
                success: false,
                statusCode: 404,
                errorCode: 'LICENSE_NOT_FOUND',
                message: 'Licence introuvable.',
            };
        }
        if (license.productId !== productId) {
            return {
                success: false,
                statusCode: 403,
                errorCode: 'INVALID_PRODUCT',
                message: 'Produit discordant.',
            };
        }
        const installation = await this.installationRepo.findById(installationId);
        if (!installation || installation.licenseId !== licenseId || installation.status !== 'ACTIVE') {
            return {
                success: false,
                statusCode: 403,
                errorCode: 'UNAUTHORIZED_INSTALLATION',
                message: 'Cette installation logicielle n’est pas autorisée pour cette licence.',
            };
        }
        if (license.status !== 'ACTIVE') {
            return {
                success: false,
                statusCode: 403,
                errorCode: `LICENSE_${license.status}`,
                message: `Licence non active (Statut actuel: ${license.status}).`,
            };
        }
        // Mise à jour de la dernière vérification
        await this.licenseRepo.update(licenseId, { lastVerification: timestamp });
        await this.installationRepo.update(installationId, { lastSeenAt: timestamp });
        await this.recordEvent(licenseId, installationId, productId, 'VERIFICATION', 'SUCCESS', ipAddress, installation.appVersion, 'Vérification réussie.');
        return {
            success: true,
            statusCode: 200,
            data: {
                valid: true,
                status: license.status,
                licenseId: license.licenseId,
                productId: license.productId,
                licenseType: license.licenseType,
                expiresAt: license.expiresAt,
            },
            message: 'Licence valide et active.',
        };
    }
    /**
     * 3. Heartbeat d'une installation POST /api/v1/license/heartbeat
     */
    async processHeartbeat(payload, ipAddress) {
        const timestamp = new Date().toISOString();
        const { licenseId, productId, installationId, appVersion } = payload;
        const license = await this.licenseRepo.findById(licenseId);
        if (!license) {
            return {
                success: false,
                statusCode: 404,
                errorCode: 'LICENSE_NOT_FOUND',
                message: 'Licence introuvable.',
            };
        }
        const installation = await this.installationRepo.findById(installationId);
        if (!installation || installation.licenseId !== licenseId || installation.status !== 'ACTIVE') {
            return {
                success: false,
                statusCode: 403,
                errorCode: 'UNAUTHORIZED_INSTALLATION',
                message: 'Installation non autorisée.',
            };
        }
        await this.installationRepo.update(installationId, {
            lastSeenAt: timestamp,
            appVersion,
        });
        await this.recordEvent(licenseId, installationId, productId, 'HEARTBEAT', 'SUCCESS', ipAddress, appVersion, 'Heartbeat acquitté.');
        return {
            success: true,
            statusCode: 200,
            data: {
                received: true,
                status: license.status,
                lastSeenAt: timestamp,
            },
            message: 'Heartbeat reçu avec succès.',
        };
    }
    /**
     * Révocation d'une licence (Admin)
     */
    async revokeLicense(licenseId, actorId, reason) {
        const license = await this.licenseRepo.findById(licenseId);
        if (!license) {
            return { success: false, statusCode: 404, errorCode: 'LICENSE_NOT_FOUND', message: 'Licence introuvable.' };
        }
        await this.licenseRepo.update(licenseId, { status: 'REVOKED' });
        // Désactivation de toutes les installations liées
        const installations = await this.installationRepo.findByLicenseId(licenseId);
        for (const inst of installations) {
            await this.installationRepo.update(inst.installationId, { status: 'REVOKED' });
        }
        await this.auditRepo.create({
            auditId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            action: 'LICENSE_REVOCATION',
            actorId,
            licenseId,
            customerId: license.customerId,
            timestamp: new Date().toISOString(),
            result: 'SUCCESS',
            metadata: { reason },
        });
        return { success: true, statusCode: 200, message: 'Licence et installations associées révoquées avec succès.' };
    }
    /**
     * Transfert d'une licence vers une nouvelle installation (Admin contrôlé)
     */
    async transferLicense(licenseId, fromInstallationId, toInstallationId, actorId, reason) {
        const license = await this.licenseRepo.findById(licenseId);
        if (!license) {
            return { success: false, statusCode: 404, errorCode: 'LICENSE_NOT_FOUND', message: 'Licence introuvable.' };
        }
        const fromInst = await this.installationRepo.findById(fromInstallationId);
        if (!fromInst || fromInst.licenseId !== licenseId) {
            return { success: false, statusCode: 400, errorCode: 'SOURCE_INSTALLATION_INVALID', message: "L'ancienne installation est invalide." };
        }
        // 1. Désactivation de l'ancienne installation
        await this.installationRepo.update(fromInstallationId, { status: 'TRANSFERRED' });
        // 2. Création de l'enregistrement de transfert
        const requestId = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await this.transferRepo.create({
            requestId,
            licenseId,
            fromInstallationId,
            toInstallationId,
            reason,
            requestedAt: new Date().toISOString(),
            status: 'APPROVED',
            approvedAt: new Date().toISOString(),
            approvedBy: actorId,
        });
        // 3. Audit log
        await this.auditRepo.create({
            auditId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            action: 'LICENSE_TRANSFER',
            actorId,
            licenseId,
            customerId: license.customerId,
            timestamp: new Date().toISOString(),
            result: 'SUCCESS',
            metadata: { fromInstallationId, toInstallationId, reason },
        });
        return { success: true, statusCode: 200, message: 'Transfert effectué. L’ancienne installation a été désactivée.' };
    }
    /**
     * Génération d'une nouvelle licence (Admin)
     * Prise en charge par défaut : FREE (Prix: 0, maxInstallations: 1)
     * Extensible sans refactorisation : TRIAL, ANNUAL, PERPETUAL
     */
    async createLicense(params) {
        const rawKey = this.cryptoService.generateKey();
        const keyHash = this.cryptoService.hashKey(rawKey);
        const keyLast4 = this.cryptoService.getLast4(rawKey);
        const licenseId = `LIC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const licenseType = params.licenseType || 'FREE';
        const price = licenseType === 'FREE' ? 0 : 500000; // 0 pour FREE
        const license = {
            licenseId,
            productId: 'I-ANATRA',
            customerId: params.customerId,
            licenseKeyHash: keyHash,
            licenseKeyLast4: keyLast4,
            licenseType,
            status: 'ACTIVE',
            price,
            currency: 'MGA',
            createdAt: new Date().toISOString(),
            activatedAt: null,
            expiresAt: params.expiresAt || null,
            maxInstallations: 1,
            features: params.features || ['STUDENTS', 'FINANCE', 'OFFLINE_READY'],
            lastVerification: null,
        };
        await this.licenseRepo.create(license);
        await this.auditRepo.create({
            auditId: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            action: 'LICENSE_GENERATION',
            actorId: params.actorId,
            licenseId,
            customerId: params.customerId,
            timestamp: new Date().toISOString(),
            result: 'SUCCESS',
            metadata: { licenseType, last4: keyLast4 },
        });
        return { rawKey, license };
    }
    async recordEvent(licenseId, installationId, productId, eventType, result, ipAddress, appVersion, details) {
        try {
            await this.eventRepo.create({
                eventId: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                licenseId,
                installationId,
                productId,
                eventType,
                result,
                timestamp: new Date().toISOString(),
                ipAddress,
                appVersion: appVersion || '1.0.0',
                details,
            });
        }
        catch {
            // Ignorer pour ne pas bloquer l'opération principale si la journalisation échoue
        }
    }
}
exports.LicenseService = LicenseService;
//# sourceMappingURL=licenseService.js.map