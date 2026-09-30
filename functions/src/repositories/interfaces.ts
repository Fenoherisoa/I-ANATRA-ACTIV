/**
 * RFC OFFICE - I-ANATRA License Server
 * Interfaces d'abstraction des données (Clean Architecture)
 * Permet de basculer facilement de Firestore vers PostgreSQL/VPS dédié sans réécrire la logique métier.
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import {
  Product,
  Customer,
  License,
  Installation,
  ActivationEvent,
  TransferRequest,
  AuditLog,
  LicensingSettings,
  AdminUser,
} from '../models/types';

export interface ILicenseRepository {
  findById(licenseId: string): Promise<License | null>;
  findByHash(licenseKeyHash: string): Promise<License | null>;
  create(license: License): Promise<void>;
  update(licenseId: string, partial: Partial<License>): Promise<void>;
  listByCustomer(customerId: string): Promise<License[]>;
  listAll(): Promise<License[]>;
}

export interface IInstallationRepository {
  findById(installationId: string): Promise<Installation | null>;
  findByLicenseId(licenseId: string): Promise<Installation[]>;
  create(installation: Installation): Promise<void>;
  update(installationId: string, partial: Partial<Installation>): Promise<void>;
}

export interface IProductRepository {
  findById(productId: string): Promise<Product | null>;
  create(product: Product): Promise<void>;
  update(productId: string, partial: Partial<Product>): Promise<void>;
}

export interface ICustomerRepository {
  findById(customerId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  create(customer: Customer): Promise<void>;
  update(customerId: string, partial: Partial<Customer>): Promise<void>;
}

export interface IActivationEventRepository {
  create(event: ActivationEvent): Promise<void>;
  listByLicenseId(licenseId: string, limit?: number): Promise<ActivationEvent[]>;
  listRecent(limit?: number): Promise<ActivationEvent[]>;
}

export interface ITransferRequestRepository {
  findById(requestId: string): Promise<TransferRequest | null>;
  findByLicenseId(licenseId: string): Promise<TransferRequest[]>;
  create(request: TransferRequest): Promise<void>;
  update(requestId: string, partial: Partial<TransferRequest>): Promise<void>;
}

export interface IAuditRepository {
  create(log: AuditLog): Promise<void>;
  listRecent(limit?: number): Promise<AuditLog[]>;
}

export interface ISettingsRepository {
  getSettings(): Promise<LicensingSettings>;
  updateSettings(settings: Partial<LicensingSettings>): Promise<void>;
}

export interface IAdminRepository {
  findById(adminId: string): Promise<AdminUser | null>;
  findByEmail(email: string): Promise<AdminUser | null>;
  create(admin: AdminUser): Promise<void>;
  update(adminId: string, partial: Partial<AdminUser>): Promise<void>;
  count(): Promise<number>;
}
