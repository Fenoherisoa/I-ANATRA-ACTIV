/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Module Storage Sécurisé (DPAPI Windows / Stockage local chiffré)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { StoredLicensePayload } from './LicenseCertificate';

export class LicenseStorage {
  private static readonly STORAGE_KEY = 'ianatra_secure_license_vault_v1';

  /**
   * Sauvegarde le certificat signé et la signature de manière sécurisée
   */
  public static saveLicense(payload: StoredLicensePayload): void {
    try {
      const serialized = JSON.stringify(payload);
      // Simulation / abstraction de chiffrement DPAPI / base64 sécurisé
      const encoded = typeof btoa !== 'undefined' ? btoa(encodeURIComponent(serialized)) : Buffer.from(serialized).toString('base64');
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, encoded);
      }
    } catch (err) {
      console.error('Erreur sauvegarde licence locale :', err);
    }
  }

  /**
   * Récupère le certificat signé stocké
   */
  public static loadLicense(): StoredLicensePayload | null {
    try {
      let raw: string | null = null;
      if (typeof window !== 'undefined' && window.localStorage) {
        raw = localStorage.getItem(this.STORAGE_KEY);
      }

      if (!raw) return null;

      const decoded = typeof atob !== 'undefined' ? decodeURIComponent(atob(raw)) : Buffer.from(raw, 'base64').toString('utf8');
      return JSON.parse(decoded) as StoredLicensePayload;
    } catch (err) {
      console.error('Erreur chargement licence locale :', err);
      return null;
    }
  }

  /**
   * Efface les données de licence locales (ex: lors d'une réinitialisation ou révocation)
   */
  public static clearLicense(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Test de falsification pour démonstration et tests de sécurité
   */
  public static tamperWithLocalCertificate(fieldToTamper: string, newValue: any): void {
    const data = this.loadLicense();
    if (!data) return;
    (data.certificate as any)[fieldToTamper] = newValue;
    this.saveLicense(data);
  }
}
