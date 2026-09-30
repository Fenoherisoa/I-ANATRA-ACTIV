/**
 * I-ANATRA License Admin - RFC OFFICE
 * Historique des Activations et Journal des Événements
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState } from 'react';
import { ActivationEvent } from '../types/licensing';
import { Shield, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AdminActivationHistoryProps {
  events: ActivationEvent[];
}

export const AdminActivationHistory: React.FC<AdminActivationHistoryProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = events.filter(
    (e) =>
      (e.licenseId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.installationId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.machineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.eventType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Historique des Activations</h2>
          <p className="text-xs text-slate-500">
            Journal immuable des requêtes d'activation, de vérification et de heartbeat
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer par licence, machine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Événement</th>
                <th className="py-3 px-4">License ID</th>
                <th className="py-3 px-4">Installation ID</th>
                <th className="py-3 px-4">Machine</th>
                <th className="py-3 px-4">Adresse IP</th>
                <th className="py-3 px-4">Résultat</th>
                <th className="py-3 px-4">Détails / Motif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(evt.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-700 font-semibold">
                      {evt.licenseId || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {evt.installationId || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {evt.machineName || 'Inconnu'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {evt.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4">
                      {evt.success ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SUCCÈS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>REJETÉ</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {evt.failureReason ? (
                        <span className="text-rose-600 font-medium">{evt.failureReason}</span>
                      ) : (
                        <span className="text-emerald-700">Certificat Ed25519 validé</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aucun événement dans le journal.
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
