/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Client API de communication sécurisée avec le serveur de licences RFC OFFICE
 * IMPORTANT : Aucune donnée scolaire n'est transmise via ce client !
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { InstallationIdentity } from './InstallationIdentity';

export interface ActivationResponse {
  success: boolean;
  message?: string;
  error?: string;
  license?: {
    licenseId: string;
    customerId: string;
    installationId: string;
    licenseType: string;
    expiresAt: string | null;
    schoolName?: string;
  };
  certificate?: any;
  signature?: string;
  publicKey?: string;
}

export class LicenseApiClient {
  private baseUrl: string;
  private isOfflineModeForced: boolean = false;

  constructor(serverUrl: string = '/api/v1/license') {
    this.baseUrl = serverUrl;
  }

  public setServerUrl(url: string): void {
    this.baseUrl = url;
  }

  public getServerUrl(): string {
    return this.baseUrl;
  }

  public setSimulatedOffline(offline: boolean): void {
    this.isOfflineModeForced = offline;
  }

  public isSimulatedOffline(): boolean {
    return this.isOfflineModeForced;
  }

  private resolveUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const origin = typeof window !== 'undefined' ? '' : 'http://127.0.0.1:3000';
    return `${origin}${path}`;
  }

  /**
   * Première activation en ligne
   */
  public async activate(licenseKey: string): Promise<ActivationResponse> {
    if (this.isOfflineModeForced) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Une connexion Internet est requise pour activer I-ANATRA pour la première fois.',
      };
    }

    const installationId = InstallationIdentity.getOrCreateInstallationId();
    const meta = InstallationIdentity.getTechnicalMetadata();

    // STRICT : Uniquement les métadonnées techniques minimales de licensing
    const payload = {
      licenseKey: licenseKey.trim(),
      installationId,
      productCode: 'IANATRA',
      appVersion: meta.appVersion,
      machineName: meta.machineName,
      osVersion: meta.osVersion,
    };

    try {
      const res = await fetch(this.resolveUrl(`${this.baseUrl}/activate`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: 'SERVER_UNAVAILABLE',
        message:
          'Le serveur de licence est momentanément indisponible. Vérifiez votre connexion Internet et réessayez.',
      };
    }
  }

  /**
   * Vérification en ligne
   */
  public async verify(licenseId: string): Promise<{ valid: boolean; status?: string; error?: string }> {
    if (this.isOfflineModeForced) {
      return { valid: false, error: 'NETWORK_ERROR' };
    }

    const installationId = InstallationIdentity.getOrCreateInstallationId();
    const meta = InstallationIdentity.getTechnicalMetadata();

    try {
      const res = await fetch(this.resolveUrl(`${this.baseUrl}/verify`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId,
          installationId,
          appVersion: meta.appVersion,
        }),
      });

      return await res.json();
    } catch {
      return { valid: false, error: 'SERVER_UNAVAILABLE' };
    }
  }

  /**
   * Heartbeat périodique (ex: tous les 7 jours)
   */
  public async heartbeat(licenseId: string): Promise<{ ok: boolean; status?: string }> {
    if (this.isOfflineModeForced) {
      return { ok: false };
    }

    const installationId = InstallationIdentity.getOrCreateInstallationId();

    try {
      const res = await fetch(this.resolveUrl(`${this.baseUrl}/heartbeat`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseId,
          installationId,
        }),
      });

      return await res.json();
    } catch {
      return { ok: false };
    }
  }

  /**
   * Contrôle de santé du serveur
   */
  public async checkHealth(): Promise<boolean> {
    if (this.isOfflineModeForced) return false;
    try {
      const res = await fetch(this.resolveUrl('/health'));
      const data = await res.json();
      return data.status === 'ok';
    } catch {
      return false;
    }
  }
}

export const licenseApiClient = new LicenseApiClient();
