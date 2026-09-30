/**
 * I-ANATRA License Admin - RFC OFFICE
 * Gestion des Demandes de Transfert de Licence
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState } from 'react';
import { TransferRequest } from '../types/licensing';
import { Send, Search, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AdminTransfersProps {
  transferRequests: TransferRequest[];
  onRefresh?: () => void;
}

export const AdminTransfers: React.FC<AdminTransfersProps> = ({ transferRequests, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = transferRequests.filter(
    (t) =>
      t.licenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.oldInstallationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Demandes de Transfert de Poste</h2>
          <p className="text-xs text-slate-500">
            Migration de licences commerciales lors de renouvellement de matériel ou pannes PC
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrer les transferts..."
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
                <th className="py-3 px-4">Date Demande</th>
                <th className="py-3 px-4">Établissement</th>
                <th className="py-3 px-4">Licence</th>
                <th className="py-3 px-4">Ancien Poste</th>
                <th className="py-3 px-4">Nouveau Poste</th>
                <th className="py-3 px-4">Motif</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Approuvé par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(tr.requestedAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {tr.schoolName || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">
                      {tr.licensePublicId || tr.licenseId}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-semibold">
                      {tr.oldInstallationId}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-600">
                      {tr.newInstallationId || 'En attente d’activation'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {tr.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          tr.status === 'APPROVED' || tr.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tr.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tr.status === 'APPROVED' || tr.status === 'COMPLETED' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : tr.status === 'PENDING' ? (
                          <Clock className="w-3 h-3 text-amber-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{tr.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {tr.approvedBy || 'SUPPORT'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Aucune demande de transfert enregistrée.
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
