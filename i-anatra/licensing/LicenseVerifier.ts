/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Vérificateur cryptographique de licence hors-ligne (Ed25519)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import nacl from 'tweetnacl';
import { LicenseCertificate, canonicalizeCertificate, StoredLicensePayload } from './LicenseCertificate';

export interface VerificationResult {
  valid: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'INVALID_SIGNATURE' | 'INVALID_INSTALLATION' | 'INVALID_PRODUCT' | 'CORRUPTED';
  message: string;
  expiresAt: string | null;
  features: string[];
}

export class LicenseVerifier {
  /**
   * Clé publique officielle RFC OFFICE embarquée dans l'exécutable I-ANATRA
   * La clé privée n'est JAMAIS présente dans l'exécutable.
   */
  private static defaultPublicKeyBase64: string = '';

  public static setDefaultPublicKey(key: string): void {
    this.defaultPublicKeyBase64 = key;
  }

  public static getDefaultPublicKey(): string {
    return this.defaultPublicKeyBase64;
  }

  /**
   * Vérifie la validité complète d'un certificat de licence en mode 100% hors-ligne
   */
  public static verifyOffline(
    payload: StoredLicensePayload,
    expectedInstallationId: string,
    overridePublicKey?: string
  ): VerificationResult {
    try {
      if (!payload || !payload.certificate || !payload.signature) {
        return {
          valid: false,
          status: 'CORRUPTED',
          message: 'Données de licence locales corrompues.',
          expiresAt: null,
          features: [],
        };
      }

      const { certificate, signature } = payload;
      const publicKeyToUse = overridePublicKey || payload.publicKey || this.defaultPublicKeyBase64;

      if (!publicKeyToUse) {
        return {
          valid: false,
          status: 'CORRUPTED',
          message: 'Clé publique de signature introuvable.',
          expiresAt: null,
          features: [],
        };
      }

      // 1. Vérification cryptographique Ed25519 de la signature
      const canonicalData = canonicalizeCertificate(certificate);
      const isSignatureValid = this.verifyEd25519(canonicalData, signature, publicKeyToUse);

      if (!isSignatureValid) {
        return {
          valid: false,
          status: 'INVALID_SIGNATURE',
          message: 'Erreur critique de sécurité : la signature du certificat de licence est invalide ou a été modifiée.',
          expiresAt: null,
          features: [],
        };
      }

      // 2. Vérification du produit
      if (certificate.product !== 'IANATRA') {
        return {
          valid: false,
          status: 'INVALID_PRODUCT',
          message: `Le certificat appartient au produit ${certificate.product} et non à I-ANATRA.`,
          expiresAt: null,
          features: [],
        };
      }

      // 3. Vérification de l'installation
      if (certificate.installationId !== expectedInstallationId) {
        return {
          valid: false,
          status: 'INVALID_INSTALLATION',
          message: 'Ce certificat de licence est destiné à une autre machine.',
          expiresAt: null,
          features: [],
        };
      }

      // 4. Vérification de la date d'expiration
      if (certificate.expiresAt) {
        const expirationDate = new Date(certificate.expiresAt);
        const now = new Date();
        if (expirationDate.getTime() < now.getTime()) {
          return {
            valid: false,
            status: 'EXPIRED',
            message: 'Votre licence I-ANATRA a expiré. Veuillez contacter RFC OFFICE pour son renouvellement.',
            expiresAt: certificate.expiresAt,
            features: certificate.features || [],
          };
        }
      }

      return {
        valid: true,
        status: 'ACTIVE',
        message: 'Licence valide et vérifiée avec succès.',
        expiresAt: certificate.expiresAt,
        features: certificate.features || [],
      };
    } catch (err: any) {
      return {
        valid: false,
        status: 'CORRUPTED',
        message: `Erreur interne lors de la vérification : ${err?.message || 'Inconnue'}`,
        expiresAt: null,
        features: [],
      };
    }
  }

  private static verifyEd25519(dataString: string, signatureBase64: string, publicKeyBase64: string): boolean {
    try {
      const dataBytes = new TextEncoder().encode(dataString);
      const signatureBytes = this.fromBase64(signatureBase64);
      const publicKeyBytes = this.fromBase64(publicKeyBase64);
      return nacl.sign.detached.verify(dataBytes, signatureBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  private static fromBase64(base64: string): Uint8Array {
    if (typeof Buffer !== 'undefined') {
      return new Uint8Array(Buffer.from(base64, 'base64'));
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
