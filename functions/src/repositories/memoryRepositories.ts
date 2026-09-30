/**
 * RFC OFFICE - I-ANATRA License Server
 * Implémentation en mémoire pour les tests unitaires et la validation locale
 * Totalement découplée de Firestore pour tests instantanés
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
import {
  ILicenseRepository,
  IInstallationRepository,
  IProductRepository,
  ICustomerRepository,
  IActivationEventRepository,
  ITransferRequestRepository,
  IAuditRepository,
  ISettingsRepository,
  IAdminRepository,
} from './interfaces';

export class MemoryLicenseRepository implements ILicenseRepository {
  public licenses = new Map<string, License>();

  async findById(licenseId: string): Promise<License | null> {
    return this.licenses.get(licenseId) || null;
  }

  async findByHash(licenseKeyHash: string): Promise<License | null> {
    for (const lic of this.licenses.values()) {
      if (lic.licenseKeyHash === licenseKeyHash) return lic;
    }
    return null;
  }

  async create(license: License): Promise<void> {
    this.licenses.set(license.licenseId, { ...license });
  }

  async update(licenseId: string, partial: Partial<License>): Promise<void> {
    const existing = this.licenses.get(licenseId);
    if (existing) {
      this.licenses.set(licenseId, { ...existing, ...partial });
    }
  }

  async listByCustomer(customerId: string): Promise<License[]> {
    return Array.from(this.licenses.values()).filter((l) => l.customerId === customerId);
  }

  async listAll(): Promise<License[]> {
    return Array.from(this.licenses.values());
  }

  clear() {
    this.licenses.clear();
  }
}

export class MemoryInstallationRepository implements IInstallationRepository {
  public installations = new Map<string, Installation>();

  async findById(installationId: string): Promise<Installation | null> {
    return this.installations.get(installationId) || null;
  }

  async findByLicenseId(licenseId: string): Promise<Installation[]> {
    return Array.from(this.installations.values()).filter((i) => i.licenseId === licenseId);
  }

  async create(installation: Installation): Promise<void> {
    this.installations.set(installation.installationId, { ...installation });
  }

  async update(installationId: string, partial: Partial<Installation>): Promise<void> {
    const existing = this.installations.get(installationId);
    if (existing) {
      this.installations.set(installationId, { ...existing, ...partial });
    }
  }

  clear() {
    this.installations.clear();
  }
}

export class MemoryProductRepository implements IProductRepository {
  public products = new Map<string, Product>();

  async findById(productId: string): Promise<Product | null> {
    return this.products.get(productId) || null;
  }

  async create(product: Product): Promise<void> {
    this.products.set(product.productId, { ...product });
  }

  async update(productId: string, partial: Partial<Product>): Promise<void> {
    const existing = this.products.get(productId);
    if (existing) {
      this.products.set(productId, { ...existing, ...partial });
    }
  }
}

export class MemoryCustomerRepository implements ICustomerRepository {
  public customers = new Map<string, Customer>();

  async findById(customerId: string): Promise<Customer | null> {
    return this.customers.get(customerId) || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    for (const c of this.customers.values()) {
      if (c.email === email) return c;
    }
    return null;
  }

  async create(customer: Customer): Promise<void> {
    this.customers.set(customer.customerId, { ...customer });
  }

  async update(customerId: string, partial: Partial<Customer>): Promise<void> {
    const existing = this.customers.get(customerId);
    if (existing) {
      this.customers.set(customerId, { ...existing, ...partial });
    }
  }
}

export class MemoryActivationEventRepository implements IActivationEventRepository {
  public events: ActivationEvent[] = [];

  async create(event: ActivationEvent): Promise<void> {
    this.events.push({ ...event });
  }

  async listByLicenseId(licenseId: string, limit = 50): Promise<ActivationEvent[]> {
    return this.events
      .filter((e) => e.licenseId === licenseId)
      .slice(-limit)
      .reverse();
  }

  async listRecent(limit = 100): Promise<ActivationEvent[]> {
    return this.events.slice(-limit).reverse();
  }
}

export class MemoryTransferRequestRepository implements ITransferRequestRepository {
  public requests = new Map<string, TransferRequest>();

  async findById(requestId: string): Promise<TransferRequest | null> {
    return this.requests.get(requestId) || null;
  }

  async findByLicenseId(licenseId: string): Promise<TransferRequest[]> {
    return Array.from(this.requests.values()).filter((r) => r.licenseId === licenseId);
  }

  async create(request: TransferRequest): Promise<void> {
    this.requests.set(request.requestId, { ...request });
  }

  async update(requestId: string, partial: Partial<TransferRequest>): Promise<void> {
    const existing = this.requests.get(requestId);
    if (existing) {
      this.requests.set(requestId, { ...existing, ...partial });
    }
  }
}

export class MemoryAuditRepository implements IAuditRepository {
  public logs: AuditLog[] = [];

  async create(log: AuditLog): Promise<void> {
    this.logs.push({ ...log });
  }

  async listRecent(limit = 100): Promise<AuditLog[]> {
    return this.logs.slice(-limit).reverse();
  }
}

export class MemorySettingsRepository implements ISettingsRepository {
  public settings: LicensingSettings = {
    gracePeriodDays: 30,
    maxHeartbeatIntervalHours: 72,
    supportedProducts: ['I-ANATRA'],
  };

  async getSettings(): Promise<LicensingSettings> {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<LicensingSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
  }
}

export class MemoryAdminRepository implements IAdminRepository {
  public admins = new Map<string, AdminUser>();

  async findById(adminId: string): Promise<AdminUser | null> {
    return this.admins.get(adminId) || null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    for (const a of this.admins.values()) {
      if (a.email === email) return a;
    }
    return null;
  }

  async create(adminUser: AdminUser): Promise<void> {
    this.admins.set(adminUser.adminId, { ...adminUser });
  }

  async update(adminId: string, partial: Partial<AdminUser>): Promise<void> {
    const existing = this.admins.get(adminId);
    if (existing) {
      this.admins.set(adminId, { ...existing, ...partial });
    }
  }

  async count(): Promise<number> {
    return this.admins.size;
  }
}
