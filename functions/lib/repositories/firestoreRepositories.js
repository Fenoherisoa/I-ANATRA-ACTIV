"use strict";
/**
 * RFC OFFICE - I-ANATRA License Server
 * Implémentation Firestore des Repositories
 * Respecte strictement la structure des 9 collections :
 * products/, customers/, licenses/, installations/, activationEvents/, transferRequests/, auditLogs/, settings/, admins/
 * © 2026 RFC OFFICE — Tous droits réservés
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreAdminRepository = exports.FirestoreSettingsRepository = exports.FirestoreAuditRepository = exports.FirestoreTransferRequestRepository = exports.FirestoreActivationEventRepository = exports.FirestoreCustomerRepository = exports.FirestoreProductRepository = exports.FirestoreInstallationRepository = exports.FirestoreLicenseRepository = void 0;
const firebase_1 = require("../config/firebase");
class FirestoreLicenseRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('licenses');
    async findById(licenseId) {
        const snap = await this.col().doc(licenseId).get();
        return snap.exists ? snap.data() : null;
    }
    async findByHash(licenseKeyHash) {
        const snap = await this.col().where('licenseKeyHash', '==', licenseKeyHash).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async create(license) {
        await this.col().doc(license.licenseId).set(license);
    }
    async update(licenseId, partial) {
        await this.col().doc(licenseId).update(partial);
    }
    async listByCustomer(customerId) {
        const snap = await this.col().where('customerId', '==', customerId).get();
        return snap.docs.map((doc) => doc.data());
    }
    async listAll() {
        const snap = await this.col().limit(100).get();
        return snap.docs.map((doc) => doc.data());
    }
}
exports.FirestoreLicenseRepository = FirestoreLicenseRepository;
class FirestoreInstallationRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('installations');
    async findById(installationId) {
        const snap = await this.col().doc(installationId).get();
        return snap.exists ? snap.data() : null;
    }
    async findByLicenseId(licenseId) {
        const snap = await this.col().where('licenseId', '==', licenseId).get();
        return snap.docs.map((doc) => doc.data());
    }
    async create(installation) {
        await this.col().doc(installation.installationId).set(installation);
    }
    async update(installationId, partial) {
        await this.col().doc(installationId).update(partial);
    }
}
exports.FirestoreInstallationRepository = FirestoreInstallationRepository;
class FirestoreProductRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('products');
    async findById(productId) {
        const snap = await this.col().doc(productId).get();
        return snap.exists ? snap.data() : null;
    }
    async create(product) {
        await this.col().doc(product.productId).set(product);
    }
    async update(productId, partial) {
        await this.col().doc(productId).update(partial);
    }
}
exports.FirestoreProductRepository = FirestoreProductRepository;
class FirestoreCustomerRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('customers');
    async findById(customerId) {
        const snap = await this.col().doc(customerId).get();
        return snap.exists ? snap.data() : null;
    }
    async findByEmail(email) {
        const snap = await this.col().where('email', '==', email).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async create(customer) {
        await this.col().doc(customer.customerId).set(customer);
    }
    async update(customerId, partial) {
        await this.col().doc(customerId).update(partial);
    }
}
exports.FirestoreCustomerRepository = FirestoreCustomerRepository;
class FirestoreActivationEventRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('activationEvents');
    async create(event) {
        await this.col().doc(event.eventId).set(event);
    }
    async listByLicenseId(licenseId, limit = 50) {
        const snap = await this.col()
            .where('licenseId', '==', licenseId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        return snap.docs.map((doc) => doc.data());
    }
    async listRecent(limit = 100) {
        const snap = await this.col().orderBy('timestamp', 'desc').limit(limit).get();
        return snap.docs.map((doc) => doc.data());
    }
}
exports.FirestoreActivationEventRepository = FirestoreActivationEventRepository;
class FirestoreTransferRequestRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('transferRequests');
    async findById(requestId) {
        const snap = await this.col().doc(requestId).get();
        return snap.exists ? snap.data() : null;
    }
    async findByLicenseId(licenseId) {
        const snap = await this.col().where('licenseId', '==', licenseId).get();
        return snap.docs.map((doc) => doc.data());
    }
    async create(request) {
        await this.col().doc(request.requestId).set(request);
    }
    async update(requestId, partial) {
        await this.col().doc(requestId).update(partial);
    }
}
exports.FirestoreTransferRequestRepository = FirestoreTransferRequestRepository;
class FirestoreAuditRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('auditLogs');
    async create(log) {
        await this.col().doc(log.auditId).set(log);
    }
    async listRecent(limit = 100) {
        const snap = await this.col().orderBy('timestamp', 'desc').limit(limit).get();
        return snap.docs.map((doc) => doc.data());
    }
}
exports.FirestoreAuditRepository = FirestoreAuditRepository;
class FirestoreSettingsRepository {
    doc = () => (0, firebase_1.getFirestoreDb)().collection('settings').doc('licensing');
    async getSettings() {
        const snap = await this.doc().get();
        if (!snap.exists) {
            return {
                gracePeriodDays: 30,
                maxHeartbeatIntervalHours: 72,
                supportedProducts: ['I-ANATRA'],
            };
        }
        return snap.data();
    }
    async updateSettings(settings) {
        await this.doc().set(settings, { merge: true });
    }
}
exports.FirestoreSettingsRepository = FirestoreSettingsRepository;
class FirestoreAdminRepository {
    col = () => (0, firebase_1.getFirestoreDb)().collection('admins');
    async findById(adminId) {
        const snap = await this.col().doc(adminId).get();
        return snap.exists ? snap.data() : null;
    }
    async findByEmail(email) {
        const snap = await this.col().where('email', '==', email).limit(1).get();
        if (snap.empty)
            return null;
        return snap.docs[0].data();
    }
    async create(adminUser) {
        await this.col().doc(adminUser.adminId).set(adminUser);
    }
    async update(adminId, partial) {
        await this.col().doc(adminId).update(partial);
    }
    async count() {
        const snap = await this.col().count().get();
        return snap.data().count;
    }
}
exports.FirestoreAdminRepository = FirestoreAdminRepository;
//# sourceMappingURL=firestoreRepositories.js.map