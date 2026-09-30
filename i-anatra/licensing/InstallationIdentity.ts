/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Module Identity : Générateur d'identifiant d'installation unique et stable
 * Format : INS-XXXXXXXXXXXX
 * © 2026 RFC OFFICE — Tous droits réservés
 */

export class InstallationIdentity {
  private static readonly STORAGE_KEY = 'ianatra_ins_id';

  /**
   * Obtient ou génère l'identifiant d'installation unique et persistant de cette machine
   */
  public static getOrCreateInstallationId(): string {
    if (typeof window !== 'undefined' && window.localStorage) {
      const existing = localStorage.getItem(this.STORAGE_KEY);
      if (existing && existing.startsWith('INS-')) {
        return existing;
      }
    }

    const newId = this.generateId();
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, newId);
    }
    return newId;
  }

  /**
   * Génère un identifiant INS-XXXXXXXXXXXX non-intrusif mais stable
   */
  private static generateId(): string {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let suffix = '';
    // 12 caractères alphanumériques sécurisés
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      for (let i = 0; i < 12; i++) {
        suffix += chars[bytes[i] % chars.length];
      }
    } else {
      for (let i = 0; i < 12; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return `INS-${suffix}`;
  }

  /**
   * Métadonnées techniques minimales de l'environnement (Aucune donnée scolaire !)
   */
  public static getTechnicalMetadata() {
    const isBrowser = typeof window !== 'undefined';
    return {
      machineName: isBrowser ? `PC-ECOLE-${window.location.hostname.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase() || 'LOCAL'}` : 'PC-WINDOWS-LOCAL',
      osVersion: isBrowser && navigator.userAgent.includes('Windows') ? 'Windows 11 Pro 64-bit' : 'Windows 10/11',
      appVersion: '1.0.0',
    };
  }
}
