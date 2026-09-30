/**
 * I-ANATRA License Server - RFC OFFICE
 * Service de gestion des clients / établissements scolaires
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import { db, Customer } from '../database/db';

export class CustomerService {
  private generateNextCustomerCode(): string {
    const count = db.customers.length + 1;
    return `CUS-${count.toString().padStart(6, '0')}`;
  }

  public getAll(): Customer[] {
    return [...db.customers];
  }

  public getById(id: string): Customer | undefined {
    return db.customers.find((c) => c.id === id || c.customerCode === id);
  }

  public create(data: {
    schoolName: string;
    responsibleName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country?: string;
    notes?: string;
  }, adminId?: string): Customer {
    const now = new Date().toISOString();
    const customerCode = this.generateNextCustomerCode();

    const newCustomer: Customer = {
      id: `cus-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      customerCode,
      schoolName: data.schoolName,
      responsibleName: data.responsibleName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country || 'Madagascar',
      notes: data.notes || null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    db.customers.unshift(newCustomer);

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'CUSTOMER_CREATED',
      entityType: 'CUSTOMER',
      entityId: newCustomer.customerCode,
      description: `Création client/école : ${newCustomer.schoolName} (${newCustomer.customerCode})`,
      ipAddress: null,
      userAgent: null,
      createdAt: now,
    });

    db.save();
    return newCustomer;
  }

  public update(id: string, updates: Partial<Omit<Customer, 'id' | 'customerCode' | 'createdAt'>>, adminId?: string): Customer | null {
    const customer = db.customers.find((c) => c.id === id || c.customerCode === id);
    if (!customer) return null;

    Object.assign(customer, updates, { updatedAt: new Date().toISOString() });

    db.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      adminId: adminId || null,
      action: 'CUSTOMER_UPDATED',
      entityType: 'CUSTOMER',
      entityId: customer.customerCode,
      description: `Mise à jour client : ${customer.schoolName} (${customer.customerCode})`,
      ipAddress: null,
      userAgent: null,
      createdAt: new Date().toISOString(),
    });

    db.save();
    return customer;
  }
}

export const customerService = new CustomerService();
