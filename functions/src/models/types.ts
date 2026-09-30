/**
 * RFC OFFICE - I-ANATRA License Server
 * Modèles de données officiels pour Firestore et l'API de licensing
 * Mode initial : FREE (Prix: 0, maxInstallations: 1)
 * Compatible pour l'extension future : TRIAL, ANNUAL, PERPETUAL
 * © 2026 RFC OFFICE — Tous droits réservés
 */

export type LicenseStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'BLOCKED';

export type LicenseType = 'FREE' | 'TRIAL' | 'ANNUAL' | 'PERPETUAL';

export interface Product {
  productId: string;        // ex: 'I-ANATRA'
  name: string;             // ex: 'I-ANATRA'
  version: string;          // ex: '1.0.0'
  status: 'ACTIVE' | 'DEPRECATED';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  customerId: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface License {
  licenseId: string;
  productId: string;           // 'I-ANATRA'
  customerId: string;
  licenseKeyHash: string;      // Hachage HMAC-SHA256 sécurisé
  licenseKeyLast4: string;     // 4 derniers caractères pour identification visuelle
  licenseType: LicenseType;    // 'FREE'
  status: LicenseStatus;       // 'ACTIVE', 'REVOKED', etc.
  price: number;               // 0 pour FREE
  currency: string;            // 'MGA' ou 'EUR'
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;    // null pour FREE ou PERPETUAL
  maxInstallations: number;    // 1 par défaut
  features: string[];          // Ex: ['STUDENTS', 'FINANCE', 'OFFLINE_READY']
  lastVerification: string | null;
}

export type InstallationStatus = 'ACTIVE' | 'REVOKED' | 'TRANSFERRED';

export interface Installation {
  installationId: string;      // Identifiant stable INS-XXXXXXXXXXXX
  licenseId: string;
  productId: string;
  machineName: string;
  os: string;
  appVersion: string;
  activatedAt: string;
  lastSeenAt: string;
  status: InstallationStatus;
}

export type EventType =
  | 'ACTIVATION'
  | 'VERIFICATION'
  | 'HEARTBEAT'
  | 'FAILED_ACTIVATION'
  | 'TRANSFER'
  | 'REVOCATION'
  | 'RENEWAL';

export interface ActivationEvent {
  eventId: string;
  licenseId: string | null;
  installationId: string;
  productId: string;
  eventType: EventType;
  result: 'SUCCESS' | 'FAILURE';
  timestamp: string;
  ipAddress: string;
  appVersion: string;
  details?: string;
}

export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TransferRequest {
  requestId: string;
  licenseId: string;
  fromInstallationId: string;
  toInstallationId: string;
  reason: string;
  requestedAt: string;
  status: TransferStatus;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface AuditLog {
  auditId: string;
  action: string;
  actorId: string;
  licenseId?: string;
  customerId?: string;
  timestamp: string;
  result: 'SUCCESS' | 'FAILURE';
  metadata: Record<string, any>;
}

export interface LicensingSettings {
  gracePeriodDays: number;            // Période de grâce hors-ligne (ex: 30 jours)
  maxHeartbeatIntervalHours: number;   // Intervalle de heartbeat
  supportedProducts: string[];
}

export type AdminRole = 'SUPER_ADMIN' | 'LICENSE_MANAGER' | 'SUPPORT' | 'VIEWER';

export interface AdminUser {
  adminId: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
}

/**
 * Modèle officiel du certificat signé retourné à I-ANATRA
 */
export interface LicenseCertificate {
  licenseId: string;
  productId: string;
  customerId: string;
  licenseType: LicenseType;
  installationId: string;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string | null;
  features: string[];
}

export interface SignedLicenseCertificate extends LicenseCertificate {
  signature: string; // Signature Ed25519 en Base64
  publicKey?: string;
}

/**
 * Payloads d'API I-ANATRA
 */
export interface ActivateRequestPayload {
  licenseKey: string;
  productId: string;
  installationId: string;
  machineName: string;
  os: string;
  appVersion: string;
}

export interface VerifyRequestPayload {
  licenseId: string;
  productId: string;
  installationId: string;
}

export interface HeartbeatRequestPayload {
  licenseId: string;
  productId: string;
  installationId: string;
  appVersion: string;
}
