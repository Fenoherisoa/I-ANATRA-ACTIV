/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Définition et sérialisation canonique du Certificat de Licence
 * © 2026 RFC OFFICE — Tous droits réservés
 */

export interface LicenseCertificate {
  licenseId: string;
  customerId: string;
  product: 'IANATRA';
  installationId: string;
  licenseType: 'PERPETUAL' | 'ANNUAL' | 'TRIAL';
  issuedAt: string;
  expiresAt: string | null;
  features: string[];
}

export interface StoredLicensePayload {
  certificate: LicenseCertificate;
  signature: string;
  activatedAt: string;
  lastVerifiedAt: string;
  publicKey: string;
}

/**
 * Sérialise le certificat de manière canonique (clés triées alphabétiquement)
 * Essentiel pour que la vérification de signature Ed25519 soit déterministe
 */
export function canonicalizeCertificate(cert: LicenseCertificate): string {
  const sortedKeys = Object.keys(cert).sort() as (keyof LicenseCertificate)[];
  const sortedObj: Record<string, any> = {};
  for (const key of sortedKeys) {
    sortedObj[key] = cert[key];
  }
  return JSON.stringify(sortedObj);
}
