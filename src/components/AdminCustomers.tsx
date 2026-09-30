/**
 * I-ANATRA License Admin - RFC OFFICE
 * Gestion des Clients / Établissements Scolaires
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState } from 'react';
import { Customer } from '../types/licensing';
import { Plus, Search, Building2, Mail, Phone, MapPin, KeyRound } from 'lucide-react';

interface AdminCustomersProps {
  customers: Customer[];
  onCreateCustomer: (data: any) => Promise<boolean>;
  onSelectCustomerForLicense: (customer: Customer) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  onCreateCustomer,
  onSelectCustomerForLicense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    responsibleName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Antananarivo',
    country: 'Madagascar',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await onCreateCustomer(formData);
    setLoading(false);
    if (ok) {
      setIsModalOpen(false);
      setFormData({
        schoolName: '',
        responsibleName: '',
        email: '',
        phone: '',
        address: '',
        city: 'Antananarivo',
        country: 'Madagascar',
        notes: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Entête avec Recherche & Bouton Nouveau */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Établissements Scolaires (Clients)
          </h2>
          <p className="text-xs text-slate-500">
            Gestion du répertoire des écoles sous contrat commercial I-ANATRA
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une école, un code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle École</span>
          </button>
        </div>
      </div>

      {/* Tableau des Écoles */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Établissement</th>
                <th className="py-3 px-4">Responsable</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Localisation</th>
                <th className="py-3 px-4 text-center">Licences</th>
                <th className="py-3 px-4 text-center">Postes</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-700">
                      {customer.customerCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{customer.schoolName}</span>
                      </div>
                      {customer.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate">
                          {customer.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {customer.responsibleName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[150px]">{customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {customer.city}, {customer.country}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded-full">
                        {customer.licenseCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-bold text-cyan-800 px-2 py-0.5 bg-cyan-50 rounded-full">
                        {customer.installationCount ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                        {customer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectCustomerForLicense(customer)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded text-[11px] font-semibold transition"
                      >
                        <KeyRound className="w-3 h-3 text-cyan-600" />
                        <span>Créer Licence</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Aucun établissement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création École */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Enregistrer un Nouvel Établissement
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom de l'établissement scolaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Collège Privé Safidy"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nom du Responsable / Directeur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Dr. Jean Razafindrakoto"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="direction@ecole.mg"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+261 34 00 000 00"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse</label>
                <input
                  type="text"
                  placeholder="Lotissement / Rue"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes internes</label>
                <textarea
                  rows={2}
                  placeholder="Informations contractuelles ou techniques..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm transition"
                >
                  {loading ? 'Création...' : 'Enregistrer le Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
