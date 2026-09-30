/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Gestionnaire principal de licensing local I-ANATRA (LicenseManager)
 * Point d'entrée exécuté avant le chargement du dashboard de gestion scolaire
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { InstallationIdentity } from './InstallationIdentity';
import { LicenseStorage } from './LicenseStorage';
import { LicenseVerifier, VerificationResult } from './LicenseVerifier';
import { licenseApiClient, ActivationResponse } from './LicenseApiClient';
import { StoredLicensePayload } from './LicenseCertificate';

export type AppLicenseState =
  | 'PENDING'            // Première utilisation, aucune licence enregistrée
  | 'ACTIVE'             // Licence valide (locale ou en ligne)
  | 'EXPIRED'            // Licence annuelle ou d'essai expirée
  | 'REVOKED'            // Licence révoquée par RFC OFFICE
  | 'INVALID_SIGNATURE'  // Certificat falsifié / signature invalide
  | 'NETWORK_REQUIRED'   // Période de grâce dépassée sans connexion
  | 'ERROR';

export interface LicenseStatusInfo {
  state: AppLicenseState;
  licenseId: string | null;
  customerId: string | null;
  installationId: string;
  licenseType: string | null;
  expiresAt: string | null;
  features: string[];
  schoolName: string | null;
  isOffline: boolean;
  message: string;
  daysRemaining: number | null;
}

export class LicenseManager {
  private static gracePeriodDays: number = 30;
  private static statusListeners: ((info: LicenseStatusInfo) => void)[] = [];
  private static currentStatus: LicenseStatusInfo = {
    state: 'PENDING',
    licenseId: null,
    customerId: null,
    installationId: '',
    licenseType: null,
    expiresAt: null,
    features: [],
    schoolName: null,
    isOffline: false,
    message: 'Initialisation du système de licence I-ANATRA...',
    daysRemaining: null,
  };

  /**
   * Initialise le système de licence au démarrage de I-ANATRA
   */
  public static async initialize(serverPublicKey?: string): Promise<LicenseStatusInfo> {
    const installationId = InstallationIdentity.getOrCreateInstallationId();
    if (serverPublicKey) {
      LicenseVerifier.setDefaultPublicKey(serverPublicKey);
    }

    const stored = LicenseStorage.loadLicense();

    if (!stored) {
      this.currentStatus = {
        state: 'PENDING',
        licenseId: null,
        customerId: null,
        installationId,
        licenseType: null,
        expiresAt: null,
        features: [],
        schoolName: null,
        isOffline: licenseApiClient.isSimulatedOffline(),
        message: 'I-ANATRA doit être activé avec une clé de licence officielle RFC OFFICE.',
        daysRemaining: null,
      };
      this.notifyListeners();
      return this.currentStatus;
    }

    // 1. Vérification locale immédiate (100% hors-ligne)
    const localCheck = LicenseVerifier.verifyOffline(stored, installationId, serverPublicKey);

    if (!localCheck.valid) {
      let mappedState: AppLicenseState = 'ERROR';
      if (localCheck.status === 'INVALID_SIGNATURE') mappedState = 'INVALID_SIGNATURE';
      else if (localCheck.status === 'EXPIRED') mappedState = 'EXPIRED';
      else if (localCheck.status === 'INVALID_INSTALLATION') mappedState = 'INVALID_SIGNATURE';

      this.currentStatus = {
        state: mappedState,
        licenseId: stored.certificate.licenseId,
        customerId: stored.certificate.customerId,
        installationId,
        licenseType: stored.certificate.licenseType,
        expiresAt: stored.certificate.expiresAt,
        features: [],
        schoolName: null,
        isOffline: true,
        message: localCheck.message,
        daysRemaining: 0,
      };
      this.notifyListeners();
      return this.currentStatus;
    }

    // Calcul des jours restants
    let daysRemaining: number | null = null;
    if (stored.certificate.expiresAt) {
      const diff = new Date(stored.certificate.expiresAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    this.currentStatus = {
      state: 'ACTIVE',
      licenseId: stored.certificate.licenseId,
      customerId: stored.certificate.customerId,
      installationId,
      licenseType: stored.certificate.licenseType,
      expiresAt: stored.certificate.expiresAt,
      features: stored.certificate.features || [],
      schoolName: null,
      isOffline: licenseApiClient.isSimulatedOffline(),
      message: 'Licence active (Mode vérifié localement).',
      daysRemaining,
    };

    // 2. Synchronisation en arrière-plan si Internet est disponible (sans bloquer le démarrage)
    this.backgroundSync(stored.certificate.licenseId);

    this.notifyListeners();
    return this.currentStatus;
  }

  /**
   * Active I-ANATRA avec une clé de licence commerciale fournie par RFC OFFICE
   */
  public static async activateLicense(licenseKey: string): Promise<ActivationResponse> {
    const res = await licenseApiClient.activate(licenseKey);

    if (res.success && res.certificate && res.signature) {
      const storedPayload: StoredLicensePayload = {
        certificate: res.certificate,
        signature: res.signature,
        activatedAt: new Date().toISOString(),
        lastVerifiedAt: new Date().toISOString(),
        publicKey: res.publicKey || LicenseVerifier.getDefaultPublicKey(),
      };

      LicenseStorage.saveLicense(storedPayload);
      if (res.publicKey) {
        LicenseVerifier.setDefaultPublicKey(res.publicKey);
      }

      await this.initialize();
    }

    return res;
  }

  /**
   * Synchronisation en arrière-plan (Heartbeat + vérification de révocation)
   */
  private static async backgroundSync(licenseId: string): Promise<void> {
    try {
      const heartbeatRes = await licenseApiClient.heartbeat(licenseId);
      if (heartbeatRes.ok && heartbeatRes.status) {
        if (heartbeatRes.status === 'REVOKED') {
          this.currentStatus.state = 'REVOKED';
          this.currentStatus.message = 'Cette licence a été révoquée par RFC OFFICE.';
          this.notifyListeners();
        } else if (heartbeatRes.status === 'EXPIRED') {
          this.currentStatus.state = 'EXPIRED';
          this.currentStatus.message = 'Votre licence a expiré. Veuillez contacter RFC OFFICE.';
          this.notifyListeners();
        }
      }
    } catch {
      // Échec silencieux : le mode hors-ligne prend le relais sans perturber l'utilisateur
    }
  }

  /**
   * Déclenche manuellement un heartbeat
   */
  public static async sendHeartbeat(): Promise<{ ok: boolean; status?: string }> {
    if (!this.currentStatus.licenseId) return { ok: false };
    return await licenseApiClient.heartbeat(this.currentStatus.licenseId);
  }

  public static getInstallationId(): string {
    return InstallationIdentity.getOrCreateInstallationId();
  }

  public static getLicenseFeatures(): string[] {
    return this.currentStatus.features;
  }

  public static getLicenseStatus(): LicenseStatusInfo {
    return { ...this.currentStatus };
  }

  public static subscribe(listener: (info: LicenseStatusInfo) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners(): void {
    for (const listener of this.statusListeners) {
      listener(this.currentStatus);
    }
  }
}
