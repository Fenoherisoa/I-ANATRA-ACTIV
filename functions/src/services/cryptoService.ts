/**
 * RFC OFFICE - I-ANATRA License Server
 * Service Cryptographique (Ed25519 + HMAC-SHA256 + KeyGen)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { generateLicenseKey } from '../crypto/keyGenerator';
import { hashLicenseKey, isValidLicenseKeyFormat, normalizeLicenseKey, getLicenseKeyLast4 } from '../crypto/keyHasher';
import { Ed25519Signer } from '../crypto/ed25519Signer';
import { LicenseCertificate, SignedLicenseCertificate } from '../models/types';
import { getLicensingConfig } from '../config/firebase';

export class CryptoService {
  private signer: Ed25519Signer;
  private secretPepper: string;

  constructor(privateKeyBase64?: string, pepper?: string) {
    const config = getLicensingConfig();
    this.secretPepper = pepper || config.secretPepper;
    this.signer = new Ed25519Signer(privateKeyBase64 || config.ed25519PrivateKey);
  }

  public generateKey(): string {
    return generateLicenseKey();
  }

  public normalizeKey(rawKey: string): string {
    return normalizeLicenseKey(rawKey);
  }

  public validateFormat(rawKey: string): boolean {
    return isValidLicenseKeyFormat(rawKey);
  }

  public hashKey(rawKey: string): string {
    return hashLicenseKey(rawKey, this.secretPepper);
  }

  public getLast4(rawKey: string): string {
    return getLicenseKeyLast4(rawKey);
  }

  public getPublicKeyBase64(): string {
    return this.signer.getPublicKey();
  }

  public signCertificate(certificate: LicenseCertificate): SignedLicenseCertificate {
    return this.signer.signCertificate(certificate);
  }

  public verifyCertificate(cert: LicenseCertificate, signatureBase64: string, publicKeyBase64?: string): boolean {
    return Ed25519Signer.verifyCertificate(
      cert,
      signatureBase64,
      publicKeyBase64 || this.signer.getPublicKey()
    );
  }
}
