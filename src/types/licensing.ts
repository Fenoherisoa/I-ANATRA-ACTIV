/**
 * Types partagés pour le système de licence I-ANATRA
 * © 2026 RFC OFFICE — Tous droits réservés
 */

export type LicenseType = 'PERPETUAL' | 'ANNUAL' | 'TRIAL';
export type LicenseStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'BLOCKED';
export type InstallationStatus = 'ACTIVE' | 'REVOKED' | 'BLOCKED';

export interface Customer {
  id: string;
  customerCode: string;
  schoolName: string;
  responsibleName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes?: string | null;
  status: string;
  licenseCount?: number;
  installationCount?: number;
  createdAt: string;
}

export interface License {
  id: string;
  licenseId: string;
  licenseKeyLast4: string;
  maskedKey: string;
  customerId: string;
  customerName?: string;
  customerCode?: string;
  productId: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  maxInstallations: number;
  currentInstallations: number;
  featuresJson: string;
  activeInstallationId?: string | null;
  activeMachineName?: string | null;
  lastSeenAt?: string | null;
  createdBy?: string | null;
}

export interface Installation {
  id: string;
  installationId: string;
  licenseId: string;
  schoolName?: string;
  machineName: string;
  appVersion: string;
  osVersion: string;
  firstActivatedAt: string;
  lastSeenAt: string;
  status: InstallationStatus;
  activationIp: string | null;
  lastIp: string | null;
  revokedAt?: string | null;
  revokedReason?: string | null;
}

export interface ActivationEvent {
  id: string;
  licenseId: string | null;
  installationId: string | null;
  eventType: string;
  ipAddress: string | null;
  machineName: string | null;
  appVersion: string | null;
  success: boolean;
  failureReason: string | null;
  createdAt: string;
}

export interface TransferRequest {
  id: string;
  licenseId: string;
  licensePublicId?: string;
  schoolName?: string;
  oldInstallationId: string;
  newInstallationId: string | null;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: string;
  approvedAt: string | null;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  activeInstallations: number;
}
