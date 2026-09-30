/**
 * I-ANATRA License Admin - RFC OFFICE
 * Gestion des Licences Commerciales
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState } from 'react';
import { License, Customer } from '../types/licensing';
import {
  KeyRound,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Copy,
  Check,
  Send,
  Lock,
} from 'lucide-react';

interface AdminLicensesProps {
  licenses: License[];
  customers: Customer[];
  onGenerateLicense: (payload: any) => Promise<{ rawLicenseKey: string; license: any } | null>;
  onRevokeLicense: (id: string, reason: string) => Promise<boolean>;
  onRenewLicense: (id: string, months: number) => Promise<boolean>;
  onTransferLicense: (id: string, oldInstId: string, reason: string) => Promise<boolean>;
  preselectedCustomerId?: string | null;
}

export const AdminLicenses: React.FC<AdminLicensesProps> = ({
  licenses,
  customers,
  onGenerateLicense,
  onRevokeLicense,
  onRenewLicense,
  onTransferLicense,
  preselectedCustomerId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  // Génération
  const [formData, setFormData] = useState({
    customerId: preselectedCustomerId || (customers[0]?.id ?? ''),
    productCode: 'IANATRA',
    licenseType: 'ANNUAL',
    durationMonths: 12,
    maxInstallations: 1,
    features: [
      'STUDENT_MANAGEMENT',
      'FINANCE',
      'GRADES',
      'TIMETABLE',
      'ATTENDANCE',
      'REPORTS',
      'BACKUP',
    ],
  });

  // Clé brute générée affichée UNE SEULE FOIS
  const [generatedResult, setGeneratedResult] = useState<{
    rawKey: string;
    license: any;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Formulaire Révocation / Transfert / Renouvellement
  const [actionReason, setActionReason] = useState('');
  const [renewMonths, setRenewMonths] = useState(12);

  const filtered = licenses.filter((lic) => {
    const matchesSearch =
      lic.licenseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lic.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      lic.licenseKeyLast4.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await onGenerateLicense(formData);
    if (res) {
      setGeneratedResult({
        rawKey: res.rawLicenseKey,
        license: res.license,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Licences Commerciales</h2>
          <p className="text-xs text-slate-500">
            Émission, suivi cryptographique et cycle de vie des licences I-ANATRA
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">PENDING (En attente)</option>
            <option value="ACTIVE">ACTIVE (En service)</option>
            <option value="EXPIRED">EXPIRED (Expirée)</option>
            <option value="REVOKED">REVOKED (Révoquée)</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une licence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={() => {
              setGeneratedResult(null);
              setIsGenerateOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Générer Licence</span>
          </button>
        </div>
      </div>

      {/* Tableau des licences */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">License ID</th>
                <th className="py-3 px-4">Établissement</th>
                <th className="py-3 px-4">Clé Masquée</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Expiration</th>
                <th className="py-3 px-4">Poste Lié</th>
                <th className="py-3 px-4">Dernière Vue</th>
                <th className="py-3 px-4 text-right">Actions RFC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((lic) => {
                  const isExp = lic.expiresAt && new Date(lic.expiresAt) < new Date();
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {lic.licenseId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        <span>{lic.customerName || 'N/A'}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {lic.customerCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 font-medium tracking-wider">
                        {lic.maskedKey || `••••••••••••••••${lic.licenseKeyLast4}`}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            lic.licenseType === 'PERPETUAL'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {lic.licenseType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            lic.status === 'ACTIVE' && !isExp
                              ? 'bg-emerald-100 text-emerald-800'
                              : lic.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : lic.status === 'EXPIRED' || isExp
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {lic.status === 'ACTIVE' && !isExp ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          ) : lic.status === 'REVOKED' ? (
                            <XCircle className="w-3 h-3 text-rose-600" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                          )}
                          <span>{isExp && lic.status === 'ACTIVE' ? 'EXPIRED' : lic.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {lic.expiresAt
                          ? new Date(lic.expiresAt).toLocaleDateString('fr-FR')
                          : 'Illimitée (Perpétuelle)'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {lic.activeInstallationId ? (
                          <div>
                            <span className="text-cyan-700 font-bold block">
                              {lic.activeInstallationId}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {lic.activeMachineName || ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucun poste lié</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {lic.lastSeenAt
                          ? new Date(lic.lastSeenAt).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Jamais'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLicense(lic);
                            setIsRenewOpen(true);
                          }}
                          title="Renouveler la licence"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition"
                        >
                          Renouveler
                        </button>

                        {lic.activeInstallationId && (
                          <button
                            onClick={() => {
                              setSelectedLicense(lic);
                              setActionReason('');
                              setIsTransferOpen(true);
                            }}
                            title="Transférer vers une autre machine"
                            className="px-2 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-[11px] font-semibold transition"
                          >
                            Transférer
                          </button>
                        )}

                        {lic.status !== 'REVOKED' && (
                          <button
                            onClick={() => {
                              setSelectedLicense(lic);
                              setActionReason('');
                              setIsRevokeOpen(true);
                            }}
                            title="Révoquer cette licence"
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition"
                          >
                            Révoquer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Aucune licence correspondant aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Générer Licence */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Générer une Licence Commerciale I-ANATRA
                </h3>
              </div>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* ÉCRAN RÉSULTAT : Clé brute affichée UNE SEULE FOIS */}
            {generatedResult ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>AVERTISSEMENT DE SÉCURITÉ RFC OFFICE</span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    Copiez cette clé maintenant. Elle ne pourra plus être affichée intégralement ultérieurement. Seuls le hash et les 4 derniers caractères seront conservés sur le serveur.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-center space-y-2 shadow-inner">
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest block font-sans">
                    Clé de Licence Officielle
                  </span>
                  <div className="text-lg sm:text-xl font-black text-cyan-300 tracking-wider select-all py-1">
                    {generatedResult.rawKey}
                  </div>
                  <button
                    onClick={() => copyToClipboard(generatedResult.rawKey)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    {hasCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Clé copiée dans le presse-papiers !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copier la Clé</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div>
                    <span className="font-semibold">ID de Licence :</span>{' '}
                    <span className="font-mono">{generatedResult.license.licenseId}</span>
                  </div>
                  <div>
                    <span className="font-semibold">Type :</span> {generatedResult.license.licenseType}
                  </div>
                  <div>
                    <span className="font-semibold">Expiration :</span>{' '}
                    {generatedResult.license.expiresAt
                      ? new Date(generatedResult.license.expiresAt).toLocaleDateString('fr-FR')
                      : 'Perpétuelle'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => setIsGenerateOpen(false)}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    Fermer et retourner au tableau
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULAIRE DE CRÉATION */
              <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Établissement Scolaire (Client) *
                  </label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.schoolName} ({c.customerCode}) — {c.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Type de Licence
                    </label>
                    <select
                      value={formData.licenseType}
                      onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      <option value="ANNUAL">ANNUAL (Annuelle avec renouvellement)</option>
                      <option value="PERPETUAL">PERPETUAL (Perpétuelle)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Durée (mois)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      disabled={formData.licenseType === 'PERPETUAL'}
                      value={formData.durationMonths}
                      onChange={(e) =>
                        setFormData({ ...formData, durationMonths: parseInt(e.target.value, 10) })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nombre maximum de postes autorisés (défaut : 1)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxInstallations}
                    onChange={(e) =>
                      setFormData({ ...formData, maxInstallations: parseInt(e.target.value, 10) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Une licence standard autorise 1 seule installation Windows active.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Modules inclus dans le certificat Ed25519
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {[
                      { id: 'STUDENT_MANAGEMENT', label: 'Gestion des Élèves' },
                      { id: 'FINANCE', label: 'Comptabilité & Frais' },
                      { id: 'GRADES', label: 'Notes & Bulletins' },
                      { id: 'TIMETABLE', label: 'Emploi du temps' },
                      { id: 'ATTENDANCE', label: 'Absences & Présence' },
                      { id: 'REPORTS', label: 'Rapports & Statistiques' },
                      { id: 'BACKUP', label: 'Sauvegardes Locales SQLite' },
                    ].map((feat) => (
                      <label key={feat.id} className="flex items-center space-x-2 text-[11px]">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                features: [...formData.features, feat.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                features: formData.features.filter((f) => f !== feat.id),
                              });
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="text-slate-700 font-medium">{feat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsGenerateOpen(false)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm transition"
                  >
                    Générer la Clé Cryptographique
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Révocation */}
      {isRevokeOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-rose-600 pb-2 border-b border-slate-100 font-bold">
              <XCircle className="w-5 h-5" />
              <span>Révoquer la Licence {selectedLicense.licenseId}</span>
            </div>

            <p className="text-xs text-slate-600">
              Cette action désactivera immédiatement la licence sur le serveur RFC OFFICE et révoquera tous les postes rattachés.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif officiel de révocation *
              </label>
              <textarea
                required
                rows={3}
                placeholder="ex: Résiliation de contrat / Remplacement matériel"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsRevokeOpen(false)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!actionReason) return;
                  const ok = await onRevokeLicense(selectedLicense.licenseId, actionReason);
                  if (ok) setIsRevokeOpen(false);
                }}
                className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
              >
                Confirmer la Révocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renouvellement */}
      {isRenewOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 pb-2 border-b border-slate-100 font-bold">
              <RotateCw className="w-5 h-5 text-cyan-600" />
              <span>Renouveler la Licence {selectedLicense.licenseId}</span>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>Établissement : <span className="font-bold">{selectedLicense.customerName}</span></p>
              <p>Expiration actuelle : <span className="font-mono">{selectedLicense.expiresAt ? new Date(selectedLicense.expiresAt).toLocaleDateString('fr-FR') : 'N/A'}</span></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prolongation (mois)
              </label>
              <select
                value={renewMonths}
                onChange={(e) => setRenewMonths(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              >
                <option value={12}>12 mois (1 an)</option>
                <option value={24}>24 mois (2 ans)</option>
                <option value={36}>36 mois (3 ans)</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsRenewOpen(false)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  const ok = await onRenewLicense(selectedLicense.licenseId, renewMonths);
                  if (ok) setIsRenewOpen(false);
                }}
                className="px-4 py-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm"
              >
                Valider le Renouvellement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Transfert */}
      {isTransferOpen && selectedLicense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 pb-2 border-b border-slate-100 font-bold">
              <Send className="w-5 h-5 text-cyan-600" />
              <span>Transfert de Poste ({selectedLicense.licenseId})</span>
            </div>

            <p className="text-xs text-slate-600">
              Le poste actuel (<span className="font-mono font-bold text-slate-800">{selectedLicense.activeInstallationId}</span>) sera révoqué sur le serveur, libérant la licence pour activation sur le nouveau poste de travail.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motif du transfert *
              </label>
              <textarea
                required
                rows={3}
                placeholder="ex: Changement de poste de travail ou panne matérielle"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setIsTransferOpen(false)}
                className="px-4 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!actionReason || !selectedLicense.activeInstallationId) return;
                  const ok = await onTransferLicense(
                    selectedLicense.licenseId,
                    selectedLicense.activeInstallationId,
                    actionReason
                  );
                  if (ok) setIsTransferOpen(false);
                }}
                className="px-4 py-2 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm"
              >
                Autoriser le Transfert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
