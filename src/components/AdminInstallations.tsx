/**
 * I-ANATRA License Admin - RFC OFFICE
 * Gestion des Installations (Postes Windows Clients)
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState } from 'react';
import { Installation } from '../types/licensing';
import { Laptop, Search, ShieldCheck, ShieldAlert, MonitorCheck, RefreshCw } from 'lucide-react';

interface AdminInstallationsProps {
  installations: Installation[];
  onRefresh?: () => void;
}

export const AdminInstallations: React.FC<AdminInstallationsProps> = ({ installations, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = installations.filter(
    (i) =>
      i.installationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.machineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Postes Clients Déployés</h2>
          <p className="text-xs text-slate-500">
            Suivi des installations Windows actives autorisées par RFC OFFICE
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher machine, installation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-600 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition"
              title="Rafraîchir"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Installation ID</th>
                <th className="py-3 px-4">Établissement</th>
                <th className="py-3 px-4">Nom Machine</th>
                <th className="py-3 px-4">OS & Version</th>
                <th className="py-3 px-4">Première Activation</th>
                <th className="py-3 px-4">Dernière Activité</th>
                <th className="py-3 px-4">IP Enregistrée</th>
                <th className="py-3 px-4">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">
                      {inst.installationId}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {inst.schoolName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="flex items-center space-x-1.5 font-mono">
                        <Laptop className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inst.machineName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{inst.osVersion}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        v{inst.appVersion}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(inst.firstActivatedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {new Date(inst.lastSeenAt).toLocaleString('fr-FR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {inst.lastIp || inst.activationIp || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          inst.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inst.status === 'ACTIVE' ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{inst.status}</span>
                      </span>
                      {inst.revokedReason && (
                        <p className="text-[10px] text-rose-600 mt-0.5">
                          {inst.revokedReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aucune installation active trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
