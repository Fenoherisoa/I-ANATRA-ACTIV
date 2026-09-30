/**
 * I-ANATRA License Server - RFC OFFICE
 * Service Métier de Licensing (Activation, Vérification, Transfert, Révocation, Génération)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { db, License, Installation, ActivationEvent, TransferRequest, AuditLog } from '../database/db';
import {
  generateLicenseKey,
  hashLicenseKey,
  getLicenseKeyLast4,
  normalizeLicenseKey,
  isValidLicenseKeyFormat,
} from '../crypto/licenseKey';
import { signData } from '../crypto/ed25519';

export interface CertificatePayload {
  licenseId: string;
  customerId: string;
  product: string;
  installationId: string;
  licenseType: string;
  issuedAt: string;
  expiresAt: string | null;
  features: string[];
}

export interface ActivationParams {
  licenseKey: string;
  installationId: string;
  productCode: string;
  appVersion: string;
  machineName: string;
  osVersion: string;
  ipAddress?: string;
}

export interface ActivationResult {
  success: boolean;
  error?: string;
  message?: string;
  license?: {
    licenseId: string;
    customerId: string;
    installationId: string;
    licenseType: string;
    expiresAt: string | null;
    schoolName?: string;
  };
  certificate?: CertificatePayload;
  signature?: string;
  publicKey?: string;
}

export class LicenseService {
  /**
   * Génère un identifiant séquentiel / formaté de licence (ex: LIC-000001)
   */
  private generateNextLicenseId(): string {
    const count = db.licenses.length + 1;
    return `LIC-${count.toString().padStart(6, '0')}`;
  }

  /**
   * Crée un certificat signé Ed25519 canonique
   */
  public generateSignedCertificate(license: License, installationId: string): {
    certificate: CertificatePayload;
    signature: string;
    canonicalJson: string;
  } {
    const features: string[] = JSON.parse(license.featuresJson || '[]');

    const certificate: CertificatePayload = {
      licenseId: license.licenseId,
      customerId: license.customerId,
      product: 'IANATRA',
      installationId,
      licenseType: license.licenseType,
      issuedAt: license.issuedAt,
      expiresAt: license.expiresAt,
      features,
    };

    // Sérialisation déterministe canonique pour signature
    const canonicalJson = JSON.stringify(certificate, Object.keys(certificate).sort());
    const signature = signData(canonicalJson, db.keys.privateKey);

    return { certificate, signature, canonicalJson };
  }

  /**
   * Active une licence commerciale pour une installation Windows I-ANATRA
   */
  public activate(params: ActivationParams): ActivationResult {
    const { licenseKey, installationId, productCode, appVersion, machineName, osVersion, ipAddress } = params;
    const now = new Date().toISOString();

    // 1. Validation du format
    if (!licenseKey || !isValidLicenseKeyFormat(licenseKey)) {
      this.recordEvent({
        licenseId: null,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: 'Format de clé de licence invalide.',
      });
      return {
        success: false,
        error: 'INVALID_LICENSE',
        message: 'Format de clé de licence invalide. Format attendu : IANATRA-XXXX-XXXX-XXXX-XXXX',
      };
    }

    if (!installationId || !installationId.startsWith('INS-')) {
      return {
        success: false,
        error: 'INVALID_INSTALLATION_ID',
        message: 'Identifiant d’installation invalide.',
      };
    }

    // 2. Recherche par hachage
    const keyHash = hashLicenseKey(licenseKey);
    const license = db.licenses.find((l) => l.licenseKeyHash === keyHash);

    if (!license) {
      this.recordEvent({
        licenseId: null,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: 'Clé de licence introuvable.',
      });
      return {
        success: false,
        error: 'LICENSE_NOT_FOUND',
        message: 'Clé de licence inconnue du serveur RFC OFFICE. Veuillez vérifier votre saisie.',
      };
    }

    // 3. Vérification du produit
    const product = db.products.find((p) => p.id === license.productId);
    if (!product || product.productCode !== productCode) {
      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: `Produit incompatible. Requis: ${product?.productCode}, fourni: ${productCode}`,
      });
      return {
        success: false,
        error: 'INVALID_PRODUCT',
        message: 'Cette licence n’est pas valable pour ce logiciel.',
      };
    }

    // 4. Vérification du statut
    if (license.status === 'REVOKED') {
      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: 'Licence révoquée.',
      });
      return {
        success: false,
        error: 'LICENSE_REVOKED',
        message: 'Cette licence a été révoquée. Veuillez contacter RFC OFFICE.',
      };
    }

    if (license.status === 'BLOCKED') {
      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: 'Licence bloquée administrativement.',
      });
      return {
        success: false,
        error: 'LICENSE_BLOCKED',
        message: 'Cette licence est temporairement bloquée. Veuillez contacter RFC OFFICE.',
      };
    }

    // 5. Expiration
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      license.status = 'EXPIRED';
      db.save();
      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: 'Licence expirée.',
      });
      return {
        success: false,
        error: 'LICENSE_EXPIRED',
        message: 'Votre licence I-ANATRA a expiré. Veuillez contacter RFC OFFICE pour son renouvellement.',
      };
    }

    // 6. Gestion des installations existantes
    const existingInst = db.installations.find(
      (inst) => inst.licenseId === license.id && inst.installationId === installationId
    );

    if (existingInst) {
      if (existingInst.status === 'REVOKED' || existingInst.status === 'BLOCKED') {
        return {
          success: false,
          error: 'INSTALLATION_NOT_AUTHORIZED',
          message: 'Cette installation a été révoquée par RFC OFFICE.',
        };
      }

      // Mise à jour de l'installation existante
      existingInst.lastSeenAt = now;
      existingInst.lastIp = ipAddress || null;
      existingInst.appVersion = appVersion;
      existingInst.machineName = machineName;
      existingInst.osVersion = osVersion;
      existingInst.updatedAt = now;

      const { certificate, signature } = this.generateSignedCertificate(license, installationId);

      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'REACTIVATION',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: true,
        failureReason: null,
      });

      db.save();

      const customer = db.customers.find((c) => c.id === license.customerId);

      return {
        success: true,
        message: 'Licence réactivée avec succès.',
        license: {
          licenseId: license.licenseId,
          customerId: license.customerId,
          installationId,
          licenseType: license.licenseType,
          expiresAt: license.expiresAt,
          schoolName: customer?.schoolName,
        },
        certificate,
        signature,
        publicKey: db.keys.publicKey,
      };
    }

    // 7. Vérification du quota d'installations (Double activation)
    const activeInstallationsCount = db.installations.filter(
      (inst) => inst.licenseId === license.id && inst.status === 'ACTIVE'
    ).length;

    if (activeInstallationsCount >= license.maxInstallations) {
      this.recordEvent({
        licenseId: license.licenseId,
        installationId,
        eventType: 'ACTIVATION_REJECTED',
        ipAddress: ipAddress || null,
        machineName,
        appVersion,
        success: false,
        failureReason: `Dépassement de quota d’installation (${activeInstallationsCount}/${license.maxInstallations}).`,
      });

      return {
        success: false,
        error: 'LICENSE_ALREADY_BOUND',
        message:
          'Cette licence est déjà associée à une autre installation. Veuillez contacter RFC OFFICE.',
      };
    }

    // 8. Nouvelle association réussie
    const newInstallation: Installation = {
      id: `inst-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      installationId,
      licenseId: license.id,
      customerId: license.customerId,
      productId: license.productId,
      machineName,
      appVersion,
      osVersion,
      firstActivatedAt: now,
      lastSeenAt: now,
      status: 'ACTIVE',
      activationIp: ipAddress || null,
      lastIp: ipAddress || null,
      revokedAt: null,
      revokedReason: null,
      createdAt: now,
      updatedAt: now,
    };

    db.installations.push(newInstallation);

    license.status = 'ACTIVE';
    license.activatedAt = license.activatedAt || now;
    license.currentInstallations = activeInstallationsCount + 1;
    license.updatedAt = now;

    const { certificate, signature } = this.generateSignedCertificate(license, installationId);

    this.recordEvent({
      licenseId: license.licenseId,
      installationId,
      eventType: 'ACTIVATED',
      ipAddress: ipAddress || null,
      machineName,
      appVersion,
      success: true,
      failureReason: null,
    });

    db.save();

    const customer = db.customers.find((c) => c.id === license.customerId);

    return {
      success: true,
      message: 'Licence activée avec succès.',
      license: {
        licenseId: license.licenseId,
        customerId: license.customerId,
        installationId,
        licenseType: license.licenseType,
        expiresAt: license.expiresAt,
        schoolName: customer?.schoolName,
      },
      certificate,
      signature,
      publicKey: db.keys.publicKey,
    };
  }

  /**
   * Vérification périodique en ligne
   */
  public verify(licenseId: string, installationId: string, appVersion: string, ipAddress?: string) {
    const license = db.licenses.find((l) => l.licenseId === licenseId);
    if (!license) {
      return { valid: false, status: 'NOT_FOUND', error: 'LICENSE_NOT_FOUND' };
    }

    const installation = db.installations.find(
      (inst) => inst.licenseId === license.id && inst.installationId === installationId
    );

    if (!installation || installation.status !== 'ACTIVE') {
      return {
        valid: false,
        status: installation ? installation.status : 'NOT_FOUND',
        error: 'INSTALLATION_NOT_AUTHORIZED',
      };
    }

    if (license.status !== 'ACTIVE') {
      return { valid: false, status: license.status, error: `LICENSE_${license.status}` };
    }

    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      license.status = 'EXPIRED';
      db.save();
      return { valid: false, status: 'EXPIRED', error: 'LICENSE_EXPIRED' };
    }

    installation.lastSeenAt = new Date().toISOString();
    installation.lastIp = ipAddress || installation.lastIp;
    installation.appVersion = appVersion;
    db.save();

    this.recordEvent({
      licenseId,
      installationId,
      eventType: 'VERIFICATION',
      ipAddress: ipAddress || null,
      machineName: installation.machineName,
      appVersion,
      success: true,
      failureReason: null,
    });

    return {
      valid: true,
      status: 'ACTIVE',
      expiresAt: license.expiresAt,
    };
  }

  /**
   * Heartbeat envoyé périodiquement (ex: tous les 7 jours)
   */
  public heartbeat(licenseId: string, installationId: string, ipAddress?: string) {
    const license = db.licenses.find((l) => l.licenseId === licenseId);
    if (!license) return { ok: false, error: 'LICENSE_NOT_FOUND' };

    const installation = db.installations.find(
      (inst) => inst.licenseId === license.id && inst.installationId === installationId
    );
    if (!installation) return { ok: false, error: 'INSTALLATION_NOT_FOUND' };

    installation.lastSeenAt = new Date().toISOString();
    installation.lastIp = ipAddress || installation.lastIp;
    db.save();

    this.recordEvent({
      licenseId,
      installationId,
      eventType: 'HEARTBEAT',
      ipAddress: ipAddress || null,
      machineName: installation.machineName,
      appVersion: installation.appVersion,
      success: true,
      failureReason: null,
    });

    return {
      ok: true,
      status: license.status,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * Génération administrative d'une nouvelle licence
   */
  public generateLicense(params: {
    customerId: string;
    productCode: string;
    licenseType: 'PERPETUAL' | 'ANNUAL' | 'TRIAL';
    durationMonths?: number;
    maxInstallations?: number;
    features?: string[];
    adminId?: string;
  }): { rawKey: string; license: License } {
    const {
      customerId,
      productCode = 'IANATRA',
      licenseType = 'ANNUAL',
      durationMonths = 12,
      maxInstallations = 1,
      features = [
        'STUDENT_MANAGEMENT',
        'FINANCE',
        'GRADES',
        'TIMETABLE',
        'ATTENDANCE',
        'REPORTS',
        'BACKUP',
      ],
      adminId,
    } = params;

    const customer = db.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Client introuvable.');

    const product = db.products.find((p) => p.productCode === productCode);
    if (!product) throw new Error('Produit introuvable.');

    // Clé sécurisée CSPRNG
    const rawKey = generateLicenseKey();
    const keyHash = hashLicenseKey(rawKey);
    const keyLast4 = getLicenseKeyLast4(rawKey);

    const now = new Date();
    let expiresAt: string | null = null;
    if (licenseType !== 'PERPETUAL') {
      const expDate = new Date(now);
      expDate.setMonth(expDate.getMonth() + (durationMonths || 12));
      expiresAt = expDate.toISOString();
    }

    const license: License = {
      id: `lic-uuid-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      licenseId: this.generateNextLicenseId(),
      licenseKeyHash: keyHash,
      licenseKeyLast4: keyLast4,
      customerId,
      productId: product.id,
      licenseType,
      status: 'PENDING',
      issuedAt: now.toISOString(),
      activatedAt: null,
      expiresAt,
      maxInstallations,
      currentInstallations: 0,
      featuresJson: JSON.stringify(features),
      createdBy: adminId || null,
      updatedAt: now.toISOString(),
    };

    db.licenses.unshift(license);

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'LICENSE_GENERATED',
      entityType: 'LICENSE',
      entityId: license.licenseId,
      description: `Génération licence ${license.licenseType} pour ${customer.schoolName} (${license.licenseId}, fin ${keyLast4})`,
      ipAddress: null,
      userAgent: null,
      createdAt: now.toISOString(),
    });

    db.save();

    return { rawKey, license };
  }

  /**
   * Révocation d'une licence par RFC OFFICE
   */
  public revokeLicense(licenseId: string, reason: string, adminId?: string): boolean {
    const license = db.licenses.find((l) => l.licenseId === licenseId || l.id === licenseId);
    if (!license) return false;

    const now = new Date().toISOString();
    license.status = 'REVOKED';
    license.updatedAt = now;

    // Révocation de toutes les installations rattachées
    for (const inst of db.installations) {
      if (inst.licenseId === license.id) {
        inst.status = 'REVOKED';
        inst.revokedAt = now;
        inst.revokedReason = reason || 'Révocation administrative RFC OFFICE';
        inst.updatedAt = now;

        this.recordEvent({
          licenseId: license.licenseId,
          installationId: inst.installationId,
          eventType: 'REVOCATION',
          ipAddress: null,
          machineName: inst.machineName,
          appVersion: inst.appVersion,
          success: true,
          failureReason: reason,
        });
      }
    }

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'LICENSE_REVOKED',
      entityType: 'LICENSE',
      entityId: license.licenseId,
      description: `Révocation de la licence ${license.licenseId}. Motif : ${reason}`,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
    });

    db.save();
    return true;
  }

  /**
   * Transfert officiel de licence (réservé RFC OFFICE)
   */
  public transferLicense(params: {
    licenseId: string;
    oldInstallationId: string;
    newInstallationId?: string;
    reason: string;
    adminId?: string;
  }) {
    const { licenseId, oldInstallationId, newInstallationId, reason, adminId } = params;
    const license = db.licenses.find((l) => l.licenseId === licenseId || l.id === licenseId);
    if (!license) throw new Error('Licence introuvable.');

    const oldInst = db.installations.find(
      (inst) => inst.licenseId === license.id && inst.installationId === oldInstallationId
    );
    if (!oldInst) throw new Error('Ancienne installation introuvable.');

    const now = new Date().toISOString();

    // 1. Révoquer l'ancienne installation
    oldInst.status = 'REVOKED';
    oldInst.revokedAt = now;
    oldInst.revokedReason = `Transféré : ${reason}`;
    oldInst.updatedAt = now;

    if (license.currentInstallations > 0) {
      license.currentInstallations -= 1;
    }
    license.updatedAt = now;

    // 2. Enregistrer la demande de transfert
    const transferReq: TransferRequest = {
      id: `trf-${Date.now()}`,
      licenseId: license.id,
      oldInstallationId,
      newInstallationId: newInstallationId || null,
      reason,
      status: 'APPROVED',
      requestedBy: adminId || 'SUPPORT',
      approvedBy: adminId || 'SUPER_ADMIN',
      requestedAt: now,
      approvedAt: now,
      completedAt: null,
    };
    db.transferRequests.unshift(transferReq);

    this.recordEvent({
      licenseId: license.licenseId,
      installationId: oldInstallationId,
      eventType: 'TRANSFER',
      ipAddress: null,
      machineName: oldInst.machineName,
      appVersion: oldInst.appVersion,
      success: true,
      failureReason: null,
    });

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'LICENSE_TRANSFERRED',
      entityType: 'LICENSE',
      entityId: license.licenseId,
      description: `Transfert autorisé de ${oldInstallationId} vers nouvelle machine. Motif : ${reason}`,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
    });

    db.save();
    return { success: true, message: 'Transfert autorisé. La nouvelle machine peut maintenant être activée.' };
  }

  /**
   * Renouvellement de licence
   */
  public renewLicense(licenseId: string, additionalMonths: number = 12, adminId?: string) {
    const license = db.licenses.find((l) => l.licenseId === licenseId || l.id === licenseId);
    if (!license) throw new Error('Licence introuvable.');

    const baseDate = license.expiresAt && new Date(license.expiresAt) > new Date()
      ? new Date(license.expiresAt)
      : new Date();

    baseDate.setMonth(baseDate.getMonth() + additionalMonths);
    license.expiresAt = baseDate.toISOString();
    license.status = 'ACTIVE';
    license.updatedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'LICENSE_RENEWED',
      entityType: 'LICENSE',
      entityId: license.licenseId,
      description: `Renouvellement de ${additionalMonths} mois. Nouvelle expiration : ${license.expiresAt}`,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date().toISOString(),
    });

    db.save();
    return license;
  }

  private recordEvent(event: Omit<ActivationEvent, 'id' | 'createdAt'>) {
    db.activationEvents.unshift({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...event,
      createdAt: new Date().toISOString(),
    });
    db.save();
  }
}

export const licenseService = new LicenseService();
