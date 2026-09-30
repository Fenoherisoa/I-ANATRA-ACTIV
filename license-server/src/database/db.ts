/**
 * I-ANATRA License Server - RFC OFFICE
 * Couche d'accès aux données persistante (compatible PostgreSQL / Prisma)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import fs from 'fs';
import path from 'path';
import { hashPassword } from '../crypto/hasher';
import { generateEd25519KeyPair, KeyPairBase64 } from '../crypto/ed25519';

export type AdminRole = 'SUPER_ADMIN' | 'LICENSE_MANAGER' | 'SUPPORT' | 'VIEWER';
export type LicenseType = 'PERPETUAL' | 'ANNUAL' | 'TRIAL';
export type LicenseStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'BLOCKED';
export type InstallationStatus = 'ACTIVE' | 'REVOKED' | 'BLOCKED';
export type ActivationEventType =
  | 'ACTIVATION_REQUEST'
  | 'ACTIVATED'
  | 'ACTIVATION_REJECTED'
  | 'VERIFICATION'
  | 'HEARTBEAT'
  | 'TRANSFER'
  | 'REVOCATION'
  | 'REACTIVATION';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface Admin {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  description: string | null;
  currentVersion: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface License {
  id: string;
  licenseId: string;
  licenseKeyHash: string;
  licenseKeyLast4: string;
  customerId: string;
  productId: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  issuedAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  maxInstallations: number;
  currentInstallations: number;
  featuresJson: string; // Tableau stringifié JSON
  createdBy: string | null;
  updatedAt: string;
}

export interface Installation {
  id: string;
  installationId: string;
  licenseId: string;
  customerId: string;
  productId: string;
  machineName: string;
  appVersion: string;
  osVersion: string;
  firstActivatedAt: string;
  lastSeenAt: string;
  status: InstallationStatus;
  activationIp: string | null;
  lastIp: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationEvent {
  id: string;
  licenseId: string | null;
  installationId: string | null;
  eventType: ActivationEventType;
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
  oldInstallationId: string;
  newInstallationId: string | null;
  reason: string;
  status: TransferStatus;
  requestedBy: string;
  approvedBy: string | null;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

export interface AuditLog {
  id: string;
  adminId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface DatabaseSchema {
  admins: Admin[];
  customers: Customer[];
  products: Product[];
  licenses: License[];
  installations: Installation[];
  activationEvents: ActivationEvent[];
  transferRequests: TransferRequest[];
  auditLogs: AuditLog[];
  keys: KeyPairBase64;
}

const DATA_DIR = path.resolve(process.cwd(), '.license_data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Erreur lecture base, réinitialisation :', err);
      }
    }

    // Initialisation STRICTEMENT SANS données de démonstration
    const generatedKeys = generateEd25519KeyPair();
    const now = new Date().toISOString();

    const initialData: DatabaseSchema = {
      keys: {
        publicKey: process.env.LICENSE_PUBLIC_KEY || generatedKeys.publicKey,
        privateKey: process.env.LICENSE_PRIVATE_KEY || generatedKeys.privateKey,
      },
      // AUCUN compte administrateur de démonstration ou mot de passe par défaut
      admins: [],
      products: [
        {
          id: 'prod-000001',
          productCode: 'IANATRA',
          productName: 'I-ANATRA School Management Software',
          description: 'Système professionnel de gestion scolaire locale pour établissements scolaires.',
          currentVersion: '1.0.0',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
      // AUCUNE école fictive ou client de démonstration
      customers: [],
      licenses: [],
      installations: [],
      activationEvents: [],
      transferRequests: [],
      auditLogs: [],
    };

    // Si des variables d'environnement de premier administrateur sont fournies
    if (process.env.RFC_INITIAL_ADMIN_EMAIL && process.env.RFC_INITIAL_ADMIN_PASSWORD) {
      initialData.admins.push({
        id: 'adm-000001',
        username: process.env.RFC_INITIAL_ADMIN_USERNAME || 'admin',
        email: process.env.RFC_INITIAL_ADMIN_EMAIL,
        passwordHash: hashPassword(process.env.RFC_INITIAL_ADMIN_PASSWORD),
        fullName: process.env.RFC_INITIAL_ADMIN_NAME || 'Administrateur RFC OFFICE',
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      });
      initialData.auditLogs.push({
        id: `aud-${Date.now()}`,
        adminId: 'adm-000001',
        action: 'SUPER_ADMIN_INITIALIZED_ENV',
        entityType: 'ADMIN',
        entityId: 'adm-000001',
        description: 'Création du premier SUPER_ADMIN via variables d’environnement sécurisées.',
        ipAddress: '127.0.0.1',
        userAgent: 'Environment Configurator',
        createdAt: now,
      });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  public save(): void {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erreur écriture base :', err);
    }
  }

  // Getters & Setters
  get admins() { return this.data.admins; }
  set admins(val) { this.data.admins = val; }

  get customers() { return this.data.customers; }
  set customers(val) { this.data.customers = val; }

  get products() { return this.data.products; }
  set products(val) { this.data.products = val; }

  get licenses() { return this.data.licenses; }
  set licenses(val) { this.data.licenses = val; }

  get installations() { return this.data.installations; }
  set installations(val) { this.data.installations = val; }

  get activationEvents() { return this.data.activationEvents; }
  set activationEvents(val) { this.data.activationEvents = val; }

  get transferRequests() { return this.data.transferRequests; }
  set transferRequests(val) { this.data.transferRequests = val; }

  get auditLogs() { return this.data.auditLogs; }
  set auditLogs(val) { this.data.auditLogs = val; }

  get keys() { return this.data.keys; }
  set keys(val) { this.data.keys = val; }
}

export const db = new DatabaseManager();
