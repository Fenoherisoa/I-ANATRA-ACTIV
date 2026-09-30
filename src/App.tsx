/**
 * I-ANATRA Licensing Ecosystem - RFC OFFICE
 * Interface Principale (LICENSE ADMIN, POSTE CLIENT WINDOWS, TESTS)
 * Strictement sans données de démonstration — Procédure de premier administrateur réel
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminCustomers } from './components/AdminCustomers';
import { AdminLicenses } from './components/AdminLicenses';
import { AdminInstallations } from './components/AdminInstallations';
import { AdminActivationHistory } from './components/AdminActivationHistory';
import { AdminTransfers } from './components/AdminTransfers';
import { AdminAuditLogs } from './components/AdminAuditLogs';
import { AdminDiagnostics } from './components/AdminDiagnostics';
import { IAnatraWindowsClient } from './components/IAnatraWindowsClient';
import { TestRunnerView } from './components/TestRunnerView';
import { AdminApiClient } from './services/api';
import { Customer, License, Installation, ActivationEvent, TransferRequest, AuditLog } from './types/licensing';
import {
  LayoutDashboard,
  Users,
  KeyRound,
  Laptop,
  History,
  Send,
  FileText,
  Cpu,
  LogIn,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  Lock,
} from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'admin' | 'client' | 'tests'>('admin');
  const [adminSection, setAdminSection] = useState<string>('dashboard');

  // État authentification & Premier administrateur
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Formulaires
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const [setupForm, setSetupForm] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  // Données du serveur
  const [stats, setStats] = useState<any>(null);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const [recentActivations, setRecentActivations] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [events, setEvents] = useState<ActivationEvent[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const [dash, custs, lics, insts, evts, trfs, logs] = await Promise.all([
        AdminApiClient.getDashboard(),
        AdminApiClient.getCustomers(),
        AdminApiClient.getLicenses(),
        AdminApiClient.getInstallations(),
        AdminApiClient.getActivationEvents(),
        AdminApiClient.getTransferRequests(),
        AdminApiClient.getAuditLogs(),
      ]);

      if (dash.success) {
        setStats(dash.stats);
        setExpiringSoon(dash.expiringSoon);
        setRecentActivations(dash.recentActivations);
        setSystemInfo(dash.system);
      }

      if (custs.success) setCustomers(custs.customers || []);
      if (lics.success) setLicenses(lics.licenses || []);
      if (insts.success) setInstallations(insts.installations || []);
      if (evts.success) setEvents(evts.events || []);
      if (trfs.success) setTransfers(trfs.transferRequests || []);
      if (logs.success) setAuditLogs(logs.auditLogs || []);
    } catch (err) {
      console.error('Erreur chargement données :', err);
    }
  };

  const checkServerSetupStatus = async () => {
    try {
      const res = await AdminApiClient.getSetupStatus();
      if (res.setupRequired) {
        setSetupRequired(true);
        setIsAuthenticated(false);
      } else {
        setSetupRequired(false);
        const token = AdminApiClient.getToken();
        if (token) {
          try {
            await loadData();
            setIsAuthenticated(true);
          } catch {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (e) {
      console.error('Erreur contrôle setup :', e);
    }
  };

  useEffect(() => {
    checkServerSetupStatus();
  }, []);

  const handleSetupInitialAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (setupForm.password.length < 8) {
      setSetupError('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setSetupLoading(true);
    try {
      const res = await AdminApiClient.setupInitialAdmin({
        fullName: setupForm.fullName,
        email: setupForm.email,
        username: setupForm.username,
        password: setupForm.password,
      });

      if (res.success) {
        setSetupRequired(false);
        setIsAuthenticated(true);
        setAdminUser(res.user);
        await loadData();
        showToast('success', 'Premier administrateur RFC OFFICE configuré avec succès !');
      } else {
        setSetupError(res.error || 'Erreur lors de la configuration.');
      }
    } catch {
      setSetupError('Le serveur de licence est momentanément indisponible.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await AdminApiClient.login(loginForm.username, loginForm.password);
      if (res.success) {
        setIsAuthenticated(true);
        setAdminUser(res.user);
        await loadData();
        showToast('success', `Connecté en tant que ${res.user.fullName}`);
      } else {
        setLoginError(res.message || 'Identifiants invalides');
      }
    } catch {
      setLoginError('Serveur de licence indisponible.');
    }
  };

  const handleLogout = async () => {
    await AdminApiClient.logout();
    setIsAuthenticated(false);
    setAdminUser(null);
    showToast('success', 'Déconnexion effectuée.');
  };

  // Actions d'administration
  const handleCreateCustomer = async (data: any) => {
    try {
      const res = await AdminApiClient.createCustomer(data);
      if (res.success) {
        showToast('success', `Établissement ${res.customer.schoolName} créé avec succès.`);
        await loadData();
        return true;
      }
      showToast('error', res.error || 'Erreur lors de la création.');
      return false;
    } catch {
      showToast('error', 'Erreur serveur.');
      return false;
    }
  };

  const handleGenerateLicense = async (payload: any) => {
    try {
      const res = await AdminApiClient.generateLicense(payload);
      if (res.success) {
        showToast('success', 'Licence générée avec succès.');
        await loadData();
        return res;
      }
      showToast('error', res.error || 'Échec de la génération.');
      return null;
    } catch {
      showToast('error', 'Erreur serveur.');
      return null;
    }
  };

  const handleRevokeLicense = async (id: string, reason: string) => {
    try {
      const res = await AdminApiClient.revokeLicense(id, reason);
      if (res.success) {
        showToast('success', `Licence ${id} révoquée.`);
        await loadData();
        return true;
      }
      showToast('error', res.error || 'Échec de la révocation.');
      return false;
    } catch {
      showToast('error', 'Erreur serveur.');
      return false;
    }
  };

  const handleRenewLicense = async (id: string, months: number) => {
    try {
      const res = await AdminApiClient.renewLicense(id, months);
      if (res.success) {
        showToast('success', `Licence ${id} prolongée de ${months} mois.`);
        await loadData();
        return true;
      }
      showToast('error', res.error || 'Échec du renouvellement.');
      return false;
    } catch {
      showToast('error', 'Erreur serveur.');
      return false;
    }
  };

  const handleTransferLicense = async (id: string, oldInstId: string, reason: string) => {
    try {
      const res = await AdminApiClient.transferLicense(id, oldInstId, reason);
      if (res.success) {
        showToast('success', 'Transfert autorisé. Prêt pour nouveau poste.');
        await loadData();
        return true;
      }
      showToast('error', res.error || 'Échec du transfert.');
      return false;
    } catch {
      showToast('error', 'Erreur serveur.');
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold text-white transition-all transform animate-bounce ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Barre de navigation officielle */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        adminUser={adminUser}
        onLogout={isAuthenticated ? handleLogout : undefined}
      />

      {/* Contenu selon l'onglet principal sélectionné */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ONGLET 1 : LICENSE ADMIN RFC OFFICE */}
        {currentTab === 'admin' && (
          <div>
            {setupRequired ? (
              /* ÉCRAN DE CONFIGURATION INITIALE DU PREMIER ADMINISTRATEUR RFC OFFICE */
              <div className="max-w-lg mx-auto my-10 bg-white rounded-2xl border-2 border-cyan-500/40 shadow-2xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 p-2 mx-auto flex items-center justify-center">
                    <img src="/ianatra.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    Configuration Initiale RFC OFFICE
                  </h2>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aucun administrateur n'est encore configuré. Enregistrez les identifiants officiels du tout premier <strong>SUPER_ADMIN</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Sécurité Stricte de Production</span>
                  </span>
                  <p className="text-[11px] text-amber-800">
                    Cette étape est unique. Une fois le premier administrateur enregistré, toute inscription publique est définitivement verrouillée.
                  </p>
                </div>

                {setupError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {setupError}
                  </div>
                )}

                <form onSubmit={handleSetupInitialAdmin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nom complet du responsable *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Directeur Technique RFC OFFICE"
                      value={setupForm.fullName}
                      onChange={(e) => setSetupForm({ ...setupForm, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Adresse email professionnelle *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="direction@rfc-office.com"
                      value={setupForm.email}
                      onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Identifiant de connexion *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Identifiant administrateur"
                      value={setupForm.username}
                      onChange={(e) => setSetupForm({ ...setupForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mot de passe * (min 8 car.)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={setupForm.password}
                        onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Confirmation *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={setupForm.confirmPassword}
                        onChange={(e) =>
                          setSetupForm({ ...setupForm, confirmPassword: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={setupLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{setupLoading ? 'Initialisation...' : 'Créer le Compte SUPER_ADMIN'}</span>
                  </button>
                </form>
              </div>
            ) : !isAuthenticated ? (
              /* ÉCRAN DE CONNEXION SÉCURISÉ ORDINAIRE */
              <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 p-2 mx-auto flex items-center justify-center">
                    <img src="/ianatra.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">
                    I-ANATRA LICENSE ADMIN
                  </h2>
                  <p className="text-xs text-slate-500">
                    Accès restreint aux opérateurs habilités RFC OFFICE
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Identifiant ou Email
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Identifiant ou email"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Mot de passe sécurisé (Argon2id)
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mot de passe"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm transition flex items-center justify-center space-x-1.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Se Connecter</span>
                  </button>
                </form>

                <div className="text-[11px] text-slate-400 text-center border-t border-slate-100 pt-3">
                  Connexion sécurisée par hachage salé Argon2id & protection contre les attaques par force brute.
                </div>
              </div>
            ) : (
              /* INTERFACE COMPLÈTE D'ADMINISTRATION */
              <div className="space-y-6">
                {/* Menu horizontal secondaire des sections d'administration */}
                <div className="flex items-center space-x-1 overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                  <button
                    onClick={() => setAdminSection('dashboard')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'dashboard'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('customers')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'customers'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Clients / Écoles ({customers.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('licenses')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'licenses'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Licences ({licenses.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('installations')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'installations'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Laptop className="w-4 h-4" />
                    <span>Installations ({installations.length})</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('events')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'events'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Activations</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('transfers')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'transfers'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>Transferts</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('audit')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'audit'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>Audit Logs</span>
                  </button>

                  <button
                    onClick={() => setAdminSection('diagnostics')}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                      adminSection === 'diagnostics'
                        ? 'bg-slate-900 text-cyan-300 shadow-sm'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <Cpu className="w-4 h-4" />
                    <span>Diagnostic & Ed25519</span>
                  </button>
                </div>

                {/* Affichage de la vue choisie */}
                {adminSection === 'dashboard' && (
                  <AdminDashboard
                    stats={stats}
                    expiringSoon={expiringSoon}
                    recentActivations={recentActivations}
                    systemInfo={systemInfo}
                    onNavigate={setAdminSection}
                    onRenewLicense={(licId) => handleRenewLicense(licId, 12)}
                  />
                )}

                {adminSection === 'customers' && (
                  <AdminCustomers
                    customers={customers}
                    onCreateCustomer={handleCreateCustomer}
                    onSelectCustomerForLicense={(c) => {
                      setAdminSection('licenses');
                    }}
                  />
                )}

                {adminSection === 'licenses' && (
                  <AdminLicenses
                    licenses={licenses}
                    customers={customers}
                    onGenerateLicense={handleGenerateLicense}
                    onRevokeLicense={handleRevokeLicense}
                    onRenewLicense={handleRenewLicense}
                    onTransferLicense={handleTransferLicense}
                  />
                )}

                {adminSection === 'installations' && (
                  <AdminInstallations installations={installations} onRefresh={loadData} />
                )}

                {adminSection === 'events' && <AdminActivationHistory events={events} />}

                {adminSection === 'transfers' && (
                  <AdminTransfers transferRequests={transfers} onRefresh={loadData} />
                )}

                {adminSection === 'audit' && <AdminAuditLogs logs={auditLogs} />}

                {adminSection === 'diagnostics' && <AdminDiagnostics />}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : POSTE WINDOWS CLIENT I-ANATRA */}
        {currentTab === 'client' && <IAnatraWindowsClient />}

        {/* ONGLET 3 : BANQUE DES 18 TESTS AUTOMATISÉS */}
        {currentTab === 'tests' && <TestRunnerView />}
      </main>

      {/* Footer Officiel */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-cyan-400">I-ANATRA</span>
            <span>— Système Officiel de Licensing Commercial</span>
          </div>

          <div className="font-mono text-slate-500 text-[11px]">
            © 2026 RFC OFFICE — Tous droits réservés
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
