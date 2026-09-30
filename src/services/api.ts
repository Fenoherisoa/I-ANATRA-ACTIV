/**
 * I-ANATRA License Admin - Client HTTP API
 * © 2026 RFC OFFICE — Tous droits réservés
 */

const API_BASE = '/api/v1/admin';

export class AdminApiClient {
  private static token: string | null = null;

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('ianatra_admin_token', token);
    } else {
      localStorage.removeItem('ianatra_admin_token');
    }
  }

  public static getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('ianatra_admin_token');
    }
    return this.token;
  }

  private static getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const t = this.getToken();
    if (t) {
      headers['Authorization'] = `Bearer ${t}`;
    }
    return headers;
  }

  public static async getSetupStatus() {
    const res = await fetch(`${API_BASE}/auth/setup-status`);
    return await res.json();
  }

  public static async setupInitialAdmin(data: {
    fullName: string;
    email: string;
    username: string;
    password: string;
  }) {
    const res = await fetch(`${API_BASE}/auth/setup-initial-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success && result.token) {
      this.setToken(result.token);
    }
    return result;
  }

  public static async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  public static async logout() {
    this.setToken(null);
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: this.getHeaders() });
    } catch {}
  }

  public static async getDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async getCustomers() {
    const res = await fetch(`${API_BASE}/customers`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async createCustomer(payload: any) {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  public static async getLicenses() {
    const res = await fetch(`${API_BASE}/licenses`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async generateLicense(payload: any) {
    const res = await fetch(`${API_BASE}/licenses/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return await res.json();
  }

  public static async revokeLicense(id: string, reason: string) {
    const res = await fetch(`${API_BASE}/licenses/${id}/revoke`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return await res.json();
  }

  public static async renewLicense(id: string, months: number) {
    const res = await fetch(`${API_BASE}/licenses/${id}/renew`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ months }),
    });
    return await res.json();
  }

  public static async transferLicense(id: string, oldInstallationId: string, reason: string) {
    const res = await fetch(`${API_BASE}/licenses/${id}/transfer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ oldInstallationId, reason }),
    });
    return await res.json();
  }

  public static async getInstallations() {
    const res = await fetch(`${API_BASE}/installations`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async getActivationEvents() {
    const res = await fetch(`${API_BASE}/activation-events`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async getTransferRequests() {
    const res = await fetch(`${API_BASE}/transfer-requests`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async getDiagnostics() {
    const res = await fetch(`${API_BASE}/diagnostics`, { headers: this.getHeaders() });
    return await res.json();
  }

  public static async runTests() {
    const res = await fetch(`${API_BASE}/tests/run`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    return await res.json();
  }
}
