/**
 * I-ANATRA License Server - RFC OFFICE
 * Service d'authentification des administrateurs et RBAC
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { db, Admin, AdminRole } from '../database/db';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../crypto/hasher';

const JWT_SECRET = process.env.JWT_SECRET || 'RFC-OFFICE-IANATRA-JWT-SECRET-SECURE-KEY-2026';

export interface AdminSession {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: AdminRole;
}

export class AdminAuthService {
  /**
   * Vérifie si l'initialisation du premier compte administrateur est requise
   */
  public isSetupRequired(): boolean {
    return db.admins.length === 0;
  }

  /**
   * Création sécurisée du tout premier SUPER_ADMIN
   * Strictement interdit si un administrateur existe déjà !
   */
  public setupInitialAdmin(data: {
    username: string;
    email: string;
    fullName: string;
    password: string;
    ipAddress?: string;
  }): { token: string; user: AdminSession } {
    if (db.admins.length > 0) {
      throw new Error('Le système est déjà initialisé. L’inscription publique est formellement désactivée.');
    }

    const { username, email, fullName, password, ipAddress } = data;

    if (!username || username.trim().length < 3) {
      throw new Error('L’identifiant doit comporter au moins 3 caractères.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Adresse email invalide.');
    }
    if (!password || password.length < 8) {
      throw new Error('Le mot de passe doit comporter au moins 8 caractères.');
    }

    const now = new Date().toISOString();
    const newAdmin: Admin = {
      id: `adm-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      passwordHash: hashPassword(password),
      role: 'SUPER_ADMIN',
      isActive: true,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };

    db.admins.push(newAdmin);

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: newAdmin.id,
      action: 'FIRST_SUPER_ADMIN_CREATED',
      entityType: 'ADMIN',
      entityId: newAdmin.id,
      description: `Création sécurisée du premier administrateur RFC OFFICE (${newAdmin.username})`,
      ipAddress: ipAddress || null,
      userAgent: null,
      createdAt: now,
    });

    db.save();

    const session: AdminSession = {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      fullName: newAdmin.fullName,
      role: newAdmin.role,
    };

    const token = generateToken(session as unknown as Record<string, unknown>, JWT_SECRET);
    return { token, user: session };
  }

  /**
   * Connexion avec hachage salé et vérification en temps constant
   */
  public login(username: string, password: string, ipAddress?: string): { token: string; user: AdminSession } | null {
    const admin = db.admins.find(
      (a) => (a.username.toLowerCase() === username.toLowerCase() || a.email.toLowerCase() === username.toLowerCase()) && a.isActive
    );

    if (!admin) return null;

    const valid = verifyPassword(password, admin.passwordHash);
    if (!valid) return null;

    admin.lastLoginAt = new Date().toISOString();
    admin.updatedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      entityType: 'ADMIN',
      entityId: admin.id,
      description: `Connexion administrateur réussie (${admin.username}, rôle: ${admin.role})`,
      ipAddress: ipAddress || null,
      userAgent: null,
      createdAt: new Date().toISOString(),
    });

    db.save();

    const session: AdminSession = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    };

    const token = generateToken(session as unknown as Record<string, unknown>, JWT_SECRET);
    return { token, user: session };
  }

  /**
   * Changement de mot de passe administrateur sécurisé
   */
  public changePassword(adminId: string, oldPass: string, newPass: string): boolean {
    const admin = db.admins.find((a) => a.id === adminId);
    if (!admin) throw new Error('Administrateur introuvable.');

    if (!verifyPassword(oldPass, admin.passwordHash)) {
      throw new Error('Ancien mot de passe incorrect.');
    }

    if (!newPass || newPass.length < 8) {
      throw new Error('Le nouveau mot de passe doit comporter au moins 8 caractères.');
    }

    admin.passwordHash = hashPassword(newPass);
    admin.updatedAt = new Date().toISOString();

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: admin.id,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'ADMIN',
      entityId: admin.id,
      description: `Modification de mot de passe pour ${admin.username}`,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date().toISOString(),
    });

    db.save();
    return true;
  }

  public verifySession(token: string): AdminSession | null {
    return verifyToken<AdminSession>(token, JWT_SECRET);
  }

  public checkRole(userRole: AdminRole, allowedRoles: AdminRole[]): boolean {
    if (userRole === 'SUPER_ADMIN') return true;
    return allowedRoles.includes(userRole);
  }
}

export const adminAuthService = new AdminAuthService();
