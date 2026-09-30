/**
 * RFC OFFICE - I-ANATRA License Server
 * Implémentation Firestore des Repositories
 * Respecte strictement la structure des 9 collections :
 * products/, customers/, licenses/, installations/, activationEvents/, transferRequests/, auditLogs/, settings/, admins/
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { getFirestoreDb } from '../config/firebase';
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

export class FirestoreLicenseRepository implements ILicenseRepository {
  private col = () => getFirestoreDb().collection('licenses');

  async findById(licenseId: string): Promise<License | null> {
    const snap = await this.col().doc(licenseId).get();
    return snap.exists ? (snap.data() as License) : null;
  }

  async findByHash(licenseKeyHash: string): Promise<License | null> {
    const snap = await this.col().where('licenseKeyHash', '==', licenseKeyHash).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as License;
  }

  async create(license: License): Promise<void> {
    await this.col().doc(license.licenseId).set(license);
  }

  async update(licenseId: string, partial: Partial<License>): Promise<void> {
    await this.col().doc(licenseId).update(partial);
  }

  async listByCustomer(customerId: string): Promise<License[]> {
    const snap = await this.col().where('customerId', '==', customerId).get();
    return snap.docs.map((doc: any) => doc.data() as License);
  }

  async listAll(): Promise<License[]> {
    const snap = await this.col().limit(100).get();
    return snap.docs.map((doc: any) => doc.data() as License);
  }
}

export class FirestoreInstallationRepository implements IInstallationRepository {
  private col = () => getFirestoreDb().collection('installations');

  async findById(installationId: string): Promise<Installation | null> {
    const snap = await this.col().doc(installationId).get();
    return snap.exists ? (snap.data() as Installation) : null;
  }

  async findByLicenseId(licenseId: string): Promise<Installation[]> {
    const snap = await this.col().where('licenseId', '==', licenseId).get();
    return snap.docs.map((doc: any) => doc.data() as Installation);
  }

  async create(installation: Installation): Promise<void> {
    await this.col().doc(installation.installationId).set(installation);
  }

  async update(installationId: string, partial: Partial<Installation>): Promise<void> {
    await this.col().doc(installationId).update(partial);
  }
}

export class FirestoreProductRepository implements IProductRepository {
  private col = () => getFirestoreDb().collection('products');

  async findById(productId: string): Promise<Product | null> {
    const snap = await this.col().doc(productId).get();
    return snap.exists ? (snap.data() as Product) : null;
  }

  async create(product: Product): Promise<void> {
    await this.col().doc(product.productId).set(product);
  }

  async update(productId: string, partial: Partial<Product>): Promise<void> {
    await this.col().doc(productId).update(partial);
  }
}

export class FirestoreCustomerRepository implements ICustomerRepository {
  private col = () => getFirestoreDb().collection('customers');

  async findById(customerId: string): Promise<Customer | null> {
    const snap = await this.col().doc(customerId).get();
    return snap.exists ? (snap.data() as Customer) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const snap = await this.col().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as Customer;
  }

  async create(customer: Customer): Promise<void> {
    await this.col().doc(customer.customerId).set(customer);
  }

  async update(customerId: string, partial: Partial<Customer>): Promise<void> {
    await this.col().doc(customerId).update(partial);
  }
}

export class FirestoreActivationEventRepository implements IActivationEventRepository {
  private col = () => getFirestoreDb().collection('activationEvents');

  async create(event: ActivationEvent): Promise<void> {
    await this.col().doc(event.eventId).set(event);
  }

  async listByLicenseId(licenseId: string, limit = 50): Promise<ActivationEvent[]> {
    const snap = await this.col()
      .where('licenseId', '==', licenseId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((doc: any) => doc.data() as ActivationEvent);
  }

  async listRecent(limit = 100): Promise<ActivationEvent[]> {
    const snap = await this.col().orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map((doc: any) => doc.data() as ActivationEvent);
  }
}

export class FirestoreTransferRequestRepository implements ITransferRequestRepository {
  private col = () => getFirestoreDb().collection('transferRequests');

  async findById(requestId: string): Promise<TransferRequest | null> {
    const snap = await this.col().doc(requestId).get();
    return snap.exists ? (snap.data() as TransferRequest) : null;
  }

  async findByLicenseId(licenseId: string): Promise<TransferRequest[]> {
    const snap = await this.col().where('licenseId', '==', licenseId).get();
    return snap.docs.map((doc: any) => doc.data() as TransferRequest);
  }

  async create(request: TransferRequest): Promise<void> {
    await this.col().doc(request.requestId).set(request);
  }

  async update(requestId: string, partial: Partial<TransferRequest>): Promise<void> {
    await this.col().doc(requestId).update(partial);
  }
}

export class FirestoreAuditRepository implements IAuditRepository {
  private col = () => getFirestoreDb().collection('auditLogs');

  async create(log: AuditLog): Promise<void> {
    await this.col().doc(log.auditId).set(log);
  }

  async listRecent(limit = 100): Promise<AuditLog[]> {
    const snap = await this.col().orderBy('timestamp', 'desc').limit(limit).get();
    return snap.docs.map((doc: any) => doc.data() as AuditLog);
  }
}

export class FirestoreSettingsRepository implements ISettingsRepository {
  private doc = () => getFirestoreDb().collection('settings').doc('licensing');

  async getSettings(): Promise<LicensingSettings> {
    const snap = await this.doc().get();
    if (!snap.exists) {
      return {
        gracePeriodDays: 30,
        maxHeartbeatIntervalHours: 72,
        supportedProducts: ['I-ANATRA'],
      };
    }
    return snap.data() as LicensingSettings;
  }

  async updateSettings(settings: Partial<LicensingSettings>): Promise<void> {
    await this.doc().set(settings, { merge: true });
  }
}

export class FirestoreAdminRepository implements IAdminRepository {
  private col = () => getFirestoreDb().collection('admins');

  async findById(adminId: string): Promise<AdminUser | null> {
    const snap = await this.col().doc(adminId).get();
    return snap.exists ? (snap.data() as AdminUser) : null;
  }

  async findByEmail(email: string): Promise<AdminUser | null> {
    const snap = await this.col().where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    return snap.docs[0].data() as AdminUser;
  }

  async create(adminUser: AdminUser): Promise<void> {
    await this.col().doc(adminUser.adminId).set(adminUser);
  }

  async update(adminId: string, partial: Partial<AdminUser>): Promise<void> {
    await this.col().doc(adminId).update(partial);
  }

  async count(): Promise<number> {
    const snap = await this.col().count().get();
    return snap.data().count;
  }
}
