"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Implémentation en mémoire pour les tests unitaires et la validation locale
 * Totalement découplée de Firestore pour tests instantanés
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryAdminRepository = exports.MemorySettingsRepository = exports.MemoryAuditRepository = exports.MemoryTransferRequestRepository = exports.MemoryActivationEventRepository = exports.MemoryCustomerRepository = exports.MemoryProductRepository = exports.MemoryInstallationRepository = exports.MemoryLicenseRepository = void 0;
class MemoryLicenseRepository {
    licenses = new Map();
    async findById(licenseId) {
        return this.licenses.get(licenseId) || null;
    }
    async findByHash(licenseKeyHash) {
        for (const lic of this.licenses.values()) {
            if (lic.licenseKeyHash === licenseKeyHash)
                return lic;
        }
        return null;
    }
    async create(license) {
        this.licenses.set(license.licenseId, { ...license });
    }
    async update(licenseId, partial) {
        const existing = this.licenses.get(licenseId);
        if (existing) {
            this.licenses.set(licenseId, { ...existing, ...partial });
        }
    }
    async listByCustomer(customerId) {
        return Array.from(this.licenses.values()).filter((l) => l.customerId === customerId);
    }
    async listAll() {
        return Array.from(this.licenses.values());
    }
    clear() {
        this.licenses.clear();
    }
}
exports.MemoryLicenseRepository = MemoryLicenseRepository;
class MemoryInstallationRepository {
    installations = new Map();
    async findById(installationId) {
        return this.installations.get(installationId) || null;
    }
    async findByLicenseId(licenseId) {
        return Array.from(this.installations.values()).filter((i) => i.licenseId === licenseId);
    }
    async create(installation) {
        this.installations.set(installation.installationId, { ...installation });
    }
    async update(installationId, partial) {
        const existing = this.installations.get(installationId);
        if (existing) {
            this.installations.set(installationId, { ...existing, ...partial });
        }
    }
    clear() {
        this.installations.clear();
    }
}
exports.MemoryInstallationRepository = MemoryInstallationRepository;
class MemoryProductRepository {
    products = new Map();
    async findById(productId) {
        return this.products.get(productId) || null;
    }
    async create(product) {
        this.products.set(product.productId, { ...product });
    }
    async update(productId, partial) {
        const existing = this.products.get(productId);
        if (existing) {
            this.products.set(productId, { ...existing, ...partial });
        }
    }
}
exports.MemoryProductRepository = MemoryProductRepository;
class MemoryCustomerRepository {
    customers = new Map();
    async findById(customerId) {
        return this.customers.get(customerId) || null;
    }
    async findByEmail(email) {
        for (const c of this.customers.values()) {
            if (c.email === email)
                return c;
        }
        return null;
    }
    async create(customer) {
        this.customers.set(customer.customerId, { ...customer });
    }
    async update(customerId, partial) {
        const existing = this.customers.get(customerId);
        if (existing) {
            this.customers.set(customerId, { ...existing, ...partial });
        }
    }
}
exports.MemoryCustomerRepository = MemoryCustomerRepository;
class MemoryActivationEventRepository {
    events = [];
    async create(event) {
        this.events.push({ ...event });
    }
    async listByLicenseId(licenseId, limit = 50) {
        return this.events
            .filter((e) => e.licenseId === licenseId)
            .slice(-limit)
            .reverse();
    }
    async listRecent(limit = 100) {
        return this.events.slice(-limit).reverse();
    }
}
exports.MemoryActivationEventRepository = MemoryActivationEventRepository;
class MemoryTransferRequestRepository {
    requests = new Map();
    async findById(requestId) {
        return this.requests.get(requestId) || null;
    }
    async findByLicenseId(licenseId) {
        return Array.from(this.requests.values()).filter((r) => r.licenseId === licenseId);
    }
    async create(request) {
        this.requests.set(request.requestId, { ...request });
    }
    async update(requestId, partial) {
        const existing = this.requests.get(requestId);
        if (existing) {
            this.requests.set(requestId, { ...existing, ...partial });
        }
    }
}
exports.MemoryTransferRequestRepository = MemoryTransferRequestRepository;
class MemoryAuditRepository {
    logs = [];
    async create(log) {
        this.logs.push({ ...log });
    }
    async listRecent(limit = 100) {
        return this.logs.slice(-limit).reverse();
    }
}
exports.MemoryAuditRepository = MemoryAuditRepository;
class MemorySettingsRepository {
    settings = {
        gracePeriodDays: 30,
        maxHeartbeatIntervalHours: 72,
        supportedProducts: ['I-ANATRA'],
    };
    async getSettings() {
        return { ...this.settings };
    }
    async updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
    }
}
exports.MemorySettingsRepository = MemorySettingsRepository;
class MemoryAdminRepository {
    admins = new Map();
    async findById(adminId) {
        return this.admins.get(adminId) || null;
    }
    async findByEmail(email) {
        for (const a of this.admins.values()) {
            if (a.email === email)
                return a;
        }
        return null;
    }
    async create(adminUser) {
        this.admins.set(adminUser.adminId, { ...adminUser });
    }
    async update(adminId, partial) {
        const existing = this.admins.get(adminId);
        if (existing) {
            this.admins.set(adminId, { ...existing, ...partial });
        }
    }
    async count() {
        return this.admins.size;
    }
}
exports.MemoryAdminRepository = MemoryAdminRepository;
//# sourceMappingURL=memoryRepositories.js.map