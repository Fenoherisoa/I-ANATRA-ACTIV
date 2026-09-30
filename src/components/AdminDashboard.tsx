/**
 * I-ANATRA License Admin - RFC OFFICE
 * Tableau de bord principal des licences
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React from 'react';
import {
  Users,
  Key,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Laptop,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Cpu,
} from 'lucide-react';
import { DashboardStats } from '../types/licensing';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  expiringSoon: any[];
  recentActivations: any[];
  systemInfo: any;
  onNavigate: (section: string) => void;
  onRenewLicense?: (licId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  expiringSoon,
  recentActivations,
  systemInfo,
  onNavigate,
  onRenewLicense,
}) => {
  return (
    <div className="space-y-6">
      {/* Bannière de Sécurité et Cryptographie */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950 border border-cyan-800/40 rounded-xl p-5 shadow-sm text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Serveur Central de Licence RFC OFFICE
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                OPÉRATIONNEL (HTTPS)
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Signatures asymétriques Ed25519 (RFC 8032) • Hachage sécurisé SHA-256 • Zéro donnée scolaire transmise.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700 text-xs font-mono text-cyan-300">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Ed25519 : Clé publique RFC active</span>
        </div>
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          onClick={() => onNavigate('customers')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-cyan-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Écoles</span>
            <Users className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {stats?.totalCustomers ?? 0}
          </div>
          <div className="text-[11px] text-cyan-600 mt-1 font-medium">Clients actifs</div>
        </div>

        <div
          onClick={() => onNavigate('licenses')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-cyan-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Licences</span>
            <Key className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {stats?.totalLicenses ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Émises par RFC</div>
        </div>

        <div
          onClick={() => onNavigate('licenses')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-semibold">Actives</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {stats?.activeLicenses ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Validées</div>
        </div>

        <div
          onClick={() => onNavigate('licenses')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-amber-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-semibold">Expirées</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats?.expiredLicenses ?? 0}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">À renouveler</div>
        </div>

        <div
          onClick={() => onNavigate('licenses')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-rose-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-semibold">Révoquées</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {stats?.revokedLicenses ?? 0}
          </div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Inactives</div>
        </div>

        <div
          onClick={() => onNavigate('installations')}
          className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-cyan-500 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Postes Actifs</span>
            <Laptop className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {stats?.activeInstallations ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Windows reliés</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Licences arrivant à expiration */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Licences Expirant sous 30 jours
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {expiringSoon?.length || 0}
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {expiringSoon && expiringSoon.length > 0 ? (
                expiringSoon.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        {item.schoolName}
                      </span>
                      <span className="font-mono text-slate-400">{item.licenseId}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-600 font-medium block">
                        Exp. {new Date(item.expiresAt).toLocaleDateString('fr-FR')}
                      </span>
                      <button
                        onClick={() => onRenewLicense && onRenewLicense(item.licenseId)}
                        className="text-[11px] text-cyan-600 hover:text-cyan-800 font-semibold underline mt-0.5"
                      >
                        Renouveler 1 an
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Aucune licence arrivant à expiration prochainement.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Notification de renouvellement automatique</span>
            <button
              onClick={() => onNavigate('licenses')}
              className="font-bold text-cyan-600 hover:text-cyan-800"
            >
              Voir toutes les licences →
            </button>
          </div>
        </div>

        {/* Événements d'activation récents */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-cyan-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Derniers Événements d'Activation
                </h3>
              </div>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs text-cyan-600 hover:underline font-semibold"
              >
                Journal complet
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {recentActivations && recentActivations.length > 0 ? (
                recentActivations.slice(0, 5).map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            evt.success ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-bold text-slate-700 font-mono">
                          {evt.eventType}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {evt.licenseId || 'N/A'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Poste : {evt.machineName || 'Inconnu'} • {evt.installationId || ''}
                      </p>
                      {evt.failureReason && (
                        <p className="text-[10px] text-rose-600 font-medium">
                          Motif : {evt.failureReason}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(evt.createdAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Aucun événement récent enregistré.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Journal cryptographique inviolable</span>
            <span className="text-slate-400 font-mono">RFC-OFFICE-AUDIT-V1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
