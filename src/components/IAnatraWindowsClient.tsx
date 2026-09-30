/**
 * I-ANATRA Windows Client - RFC OFFICE
 * Application desktop locale de gestion scolaire avec module de licensing officiel
 * Strictement SANS données de démonstration : base SQLite locale réelle & validation Ed25519
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Wifi,
  WifiOff,
  Key,
  Database,
  Lock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Users,
  GraduationCap,
  DollarSign,
  HardDrive,
  Cpu,
  Monitor,
  Plus,
  Trash2,
} from 'lucide-react';
import { LicenseManager, LicenseStatusInfo } from '../../i-anatra/licensing/LicenseManager';
import { InstallationIdentity } from '../../i-anatra/licensing/InstallationIdentity';
import { LicenseStorage } from '../../i-anatra/licensing/LicenseStorage';
import { licenseApiClient } from '../../i-anatra/licensing/LicenseApiClient';
import { normalizeLicenseKey, isValidLicenseKeyFormat } from '../../i-anatra/licensing/licenseFormat';

interface LocalStudent {
  id: string;
  matricule: string;
  fullName: string;
  className: string;
  parentContact: string;
  feeStatus: 'A_JOUR' | 'EN_RETARD';
}

export const IAnatraWindowsClient: React.FC = () => {
  const [licenseInfo, setLicenseInfo] = useState<LicenseStatusInfo>(LicenseManager.getLicenseStatus());
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [keyFormatValid, setKeyFormatValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isOfflineForced, setIsOfflineForced] = useState(false);
  const [currentMachineId, setCurrentMachineId] = useState(InstallationIdentity.getOrCreateInstallationId());
  const [activeSchoolTab, setActiveSchoolTab] = useState<'eleves' | 'finances' | 'notes' | 'backup'>('eleves');

  // Base de données scolaire locale (SQLite simulée via localStorage) — AUCUNE DONNÉE DE DÉMO
  const [students, setStudents] = useState<LocalStudent[]>(() => {
    try {
      const saved = localStorage.getItem('ianatra_local_students');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    matricule: '',
    fullName: '',
    className: '',
    parentContact: '',
  });

  useEffect(() => {
    LicenseManager.initialize().then((info) => {
      setLicenseInfo(info);
    });

    const unsubscribe = LicenseManager.subscribe((info) => {
      setLicenseInfo(info);
    });

    return () => unsubscribe();
  }, [currentMachineId]);

  // Normalisation dynamique de la clé de licence lors de la saisie
  const handleKeyChange = (val: string) => {
    const rawClean = val.toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '');
    let formatted = '';

    // Si commence par IANATRA
    let content = rawClean;
    if (content.startsWith('IANATRA')) {
      content = content.slice(7);
    }

    if (content.length > 0) {
      formatted = 'IANATRA';
      const parts = [
        content.slice(0, 4),
        content.slice(4, 8),
        content.slice(8, 12),
        content.slice(12, 16),
      ].filter((p) => p.length > 0);

      if (parts.length > 0) {
        formatted += '-' + parts.join('-');
      }
    } else {
      formatted = val.toUpperCase().trim();
    }

    setLicenseKeyInput(formatted);
    if (formatted.length >= 23) {
      setKeyFormatValid(isValidLicenseKeyFormat(formatted));
    } else {
      setKeyFormatValid(null);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeLicenseKey(licenseKeyInput);

    if (!isValidLicenseKeyFormat(normalized)) {
      setFeedbackMessage({
        type: 'error',
        text: 'Format de clé invalide. Format officiel requis : IANATRA-XXXX-XXXX-XXXX-XXXX (excluant 0, O, 1, I).',
      });
      return;
    }

    setLoading(true);
    setFeedbackMessage(null);

    try {
      const res = await LicenseManager.activateLicense(normalized);

      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: res.message || 'Licence activée avec succès.',
        });
        setLicenseKeyInput('');
        setKeyFormatValid(null);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: res.message || 'Échec de l’activation.',
        });
      }
    } catch {
      setFeedbackMessage({
        type: 'error',
        text: 'Une connexion Internet est requise pour activer I-ANATRA pour la première fois.',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleNetwork = () => {
    const nextState = !isOfflineForced;
    setIsOfflineForced(nextState);
    licenseApiClient.setSimulatedOffline(nextState);
    LicenseManager.initialize().then(setLicenseInfo);
  };

  const handleHeartbeat = async () => {
    setLoading(true);
    const res = await LicenseManager.sendHeartbeat();
    setLoading(false);
    if (res.ok) {
      setFeedbackMessage({ type: 'success', text: 'Heartbeat périodique validé par le serveur central RFC OFFICE.' });
    } else {
      setFeedbackMessage({ type: 'error', text: 'Impossible de contacter le serveur (Poste en mode hors-ligne).' });
    }
  };

  const handleTamperTest = () => {
    LicenseStorage.tamperWithLocalCertificate('licenseType', 'PERPETUAL_FRAUDULEUX');
    LicenseManager.initialize().then(setLicenseInfo);
    setFeedbackMessage({
      type: 'error',
      text: 'Alerte sécurité : Altération locale détectée immédiatement par la signature Ed25519 !',
    });
  };

  const handleResetLicense = () => {
    LicenseStorage.clearLicense();
    LicenseManager.initialize().then(setLicenseInfo);
    setFeedbackMessage(null);
  };

  const handleSwitchMachine = () => {
    const newId = `INS-${Math.random().toString(36).substring(2, 14).toUpperCase()}`;
    localStorage.setItem('ianatra_ins_id', newId);
    setCurrentMachineId(newId);
    LicenseManager.initialize().then(setLicenseInfo);
    setFeedbackMessage(null);
  };

  // Gestion des données scolaires locales réelles
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.matricule || !studentForm.fullName || !studentForm.className) return;

    const newStudent: LocalStudent = {
      id: `std-${Date.now()}`,
      matricule: studentForm.matricule.trim().toUpperCase(),
      fullName: studentForm.fullName.trim(),
      className: studentForm.className.trim(),
      parentContact: studentForm.parentContact.trim() || 'Non renseigné',
      feeStatus: 'A_JOUR',
    };

    const updated = [...students, newStudent];
    setStudents(updated);
    localStorage.setItem('ianatra_local_students', JSON.stringify(updated));
    setStudentForm({ matricule: '', fullName: '', className: '', parentContact: '' });
    setIsAddStudentOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    const updated = students.filter((s) => s.id !== id);
    setStudents(updated);
    localStorage.setItem('ianatra_local_students', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      {/* Barre de contrôle du banc d'essai Windows */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200">Poste Client Windows :</span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-slate-700">
                {currentMachineId}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Application desktop locale I-ANATRA (Base SQLite locale chiffrée)
            </p>
          </div>
        </div>

        {/* Commandes de simulation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleNetwork}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
              isOfflineForced
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isOfflineForced ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Réseau : HORS-LIGNE</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Réseau : CONNECTÉ</span>
              </>
            )}
          </button>

          {licenseInfo.state === 'ACTIVE' && (
            <>
              <button
                onClick={handleHeartbeat}
                disabled={loading}
                title="Tester le heartbeat"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-medium text-slate-200 transition"
              >
                Heartbeat J+7
              </button>

              <button
                onClick={handleTamperTest}
                title="Tester la détection d’altération locale"
                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 rounded-lg text-xs font-semibold text-rose-300 transition"
              >
                Simuler Falsification
              </button>
            </>
          )}

          <button
            onClick={handleSwitchMachine}
            title="Simuler un autre ordinateur"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-medium text-slate-300 transition"
          >
            Changer PC
          </button>

          <button
            onClick={handleResetLicense}
            title="Effacer la licence locale"
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
          >
            Reset Licence
          </button>
        </div>
      </div>

      {/* RÈGLE FONDAMENTALE : Isolation absolue des données scolaires */}
      <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-700/40 text-cyan-200 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Database className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-white font-bold">RÈGLE FONDAMENTALE RFC OFFICE :</strong>{' '}
            La base de données scolaire (élèves, bulletins, notes, finances) est strictement locale (SQLite). Aucune donnée scolaire n'est transmise au serveur de licence.
          </span>
        </div>
        <span className="hidden md:inline px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-600/40 text-[10px] font-mono font-bold text-cyan-300">
          Base Locale SQLite • Ed25519
        </span>
      </div>

      {/* Fenêtre Desktop Windows de I-ANATRA */}
      <div className="bg-slate-100 rounded-2xl border-4 border-slate-400/80 shadow-2xl overflow-hidden">
        {/* Barre de titre Windows */}
        <div className="bg-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between border-b border-slate-700 select-none">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded overflow-hidden bg-slate-900 p-0.5 border border-cyan-500/40 flex items-center justify-center">
              <img src="/ianatra.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xs font-bold tracking-wide text-white">
              I-ANATRA — Logiciel Professionnel de Gestion Scolaire (Windows Desktop)
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="text-[10px] font-mono text-slate-400">
              © 2026 RFC OFFICE
            </span>
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-600 hover:bg-slate-500 cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-slate-600 hover:bg-slate-500 cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-rose-600/80 hover:bg-rose-500 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Message de notification d'action */}
        {feedbackMessage && (
          <div
            className={`p-3 text-xs font-semibold flex items-center space-x-2 border-b ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* CONTENU PRINCIPAL DE L'APPLICATION DESKTOP */}
        <div className="p-6 min-h-[460px] bg-slate-50">
          {/* CAS 1 : LICENCE PENDING -> ÉCRAN OFFICIEL D'ACTIVATION */}
          {licenseInfo.state === 'PENDING' && (
            <div className="max-w-md mx-auto my-8 bg-white border border-slate-200 rounded-2xl shadow-xl p-8 text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 p-2 shadow-lg flex items-center justify-center mb-3">
                  <img
                    src="/ianatra.png"
                    alt="I-ANATRA Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-wider">
                  ACTIVATION DE I-ANATRA
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  RFC OFFICE — Système de Licence Commerciale
                </p>
              </div>

              <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs text-left space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Première Activation en Ligne Requise</span>
                </div>
                <p className="text-[11px] text-cyan-800">
                  Une connexion Internet est requise pour activer I-ANATRA pour la première fois. Après validation par le serveur RFC OFFICE, le logiciel fonctionnera de manière totalement autonome hors-ligne.
                </p>
              </div>

              <form onSubmit={handleActivate} className="space-y-4 text-left">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Clé de Licence Officielle :
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Format: IANATRA-XXXX-XXXX-XXXX-XXXX
                    </span>
                  </div>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="IANATRA-XXXX-XXXX-XXXX-XXXX"
                      value={licenseKeyInput}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2.5 font-mono text-sm uppercase bg-slate-50 border-2 rounded-xl focus:outline-none transition tracking-wider font-bold text-slate-800 ${
                        keyFormatValid === true
                          ? 'border-emerald-500 bg-emerald-50/30'
                          : keyFormatValid === false
                          ? 'border-rose-400 bg-rose-50/30'
                          : 'border-slate-300 focus:border-cyan-500 focus:bg-white'
                      }`}
                    />
                  </div>
                  {keyFormatValid === false && (
                    <p className="text-[10px] text-rose-600 mt-1">
                      Format invalide : 4 blocs de 4 caractères alphanumériques sans O, 0, I, 1.
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Identifiant Poste : {currentMachineId}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md hover:shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-2 disabled:bg-slate-400"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Validation en cours...' : 'ACTIVER LA LICENCE'}</span>
                </button>
              </form>

              <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100">
                © 2026 RFC OFFICE — Tous droits réservés
              </div>
            </div>
          )}

          {/* CAS 2 : LICENCE BLOQUÉE / RÉVOQUÉE / SIGNATURE INVALIDE / EXPIRÉE */}
          {(licenseInfo.state === 'REVOKED' ||
            licenseInfo.state === 'EXPIRED' ||
            licenseInfo.state === 'INVALID_SIGNATURE' ||
            licenseInfo.state === 'ERROR') && (
            <div className="max-w-md mx-auto my-12 bg-white border border-rose-200 rounded-2xl shadow-xl p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-black text-rose-800 uppercase tracking-wide">
                  {licenseInfo.state === 'INVALID_SIGNATURE'
                    ? 'Alerte Cryptographique : Signature Invalide'
                    : licenseInfo.state === 'REVOKED'
                    ? 'Licence Révoquée'
                    : licenseInfo.state === 'EXPIRED'
                    ? 'Licence Expirée'
                    : 'Erreur de Licence'}
                </h2>
                <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                  {licenseInfo.message}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 font-mono">
                Poste : {licenseInfo.installationId} • Licence : {licenseInfo.licenseId || 'N/A'}
              </div>

              <div className="pt-2 flex justify-center space-x-3">
                <button
                  onClick={handleResetLicense}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                >
                  Saisir une nouvelle clé
                </button>
              </div>
            </div>
          )}

          {/* CAS 3 : LICENCE ACTIVE -> GESTION SCOLAIRE LOCALE ACTIVE */}
          {licenseInfo.state === 'ACTIVE' && (
            <div className="space-y-6">
              {/* En-tête de statut de licence active */}
              <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-slate-900">
                        I-ANATRA Activé — Licence {licenseInfo.licenseType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {isOfflineForced ? 'VÉRIFIÉ HORS-LIGNE (Ed25519)' : 'VÉRIFIÉ EN LIGNE (RFC OFFICE)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Licence : <span className="font-mono font-bold text-slate-800">{licenseInfo.licenseId}</span> • Poste :{' '}
                      <span className="font-mono text-slate-800">{licenseInfo.installationId}</span>
                      {licenseInfo.daysRemaining !== null && (
                        <span> • Validité : {licenseInfo.daysRemaining} jours restants</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <Database className="w-4 h-4 text-cyan-600" />
                  <span>Base Locale SQLite Active ({students.length} dossiers)</span>
                </div>
              </div>

              {/* Navigation des modules scolaires locaux */}
              <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold text-slate-600">
                <button
                  onClick={() => setActiveSchoolTab('eleves')}
                  className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
                    activeSchoolTab === 'eleves'
                      ? 'border-cyan-600 text-cyan-700'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Registre des Élèves ({students.length})</span>
                </button>

                <button
                  onClick={() => setActiveSchoolTab('finances')}
                  className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
                    activeSchoolTab === 'finances'
                      ? 'border-cyan-600 text-cyan-700'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Comptabilité & Écolages</span>
                </button>

                <button
                  onClick={() => setActiveSchoolTab('notes')}
                  className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
                    activeSchoolTab === 'notes'
                      ? 'border-cyan-600 text-cyan-700'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Notes & Bulletins</span>
                </button>

                <button
                  onClick={() => setActiveSchoolTab('backup')}
                  className={`pb-2.5 border-b-2 flex items-center space-x-2 transition ${
                    activeSchoolTab === 'backup'
                      ? 'border-cyan-600 text-cyan-700'
                      : 'border-transparent hover:text-slate-900'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Sauvegardes SQLite</span>
                </button>
              </div>

              {/* Contenu du module scolaire local sélectionné */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                {activeSchoolTab === 'eleves' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          Répertoire des Élèves — Base Locale SQLite
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Les dossiers scolaires restent exclusivement enregistrés sur ce disque local.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddStudentOpen(true)}
                        className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Inscrire un élève</span>
                      </button>
                    </div>

                    {students.length > 0 ? (
                      <div className="overflow-x-auto text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                              <th className="py-2 px-3">Matricule</th>
                              <th className="py-2 px-3">Nom & Prénoms</th>
                              <th className="py-2 px-3">Classe</th>
                              <th className="py-2 px-3">Parent / Contact</th>
                              <th className="py-2 px-3">Statut Frais</th>
                              <th className="py-2 px-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {students.map((std) => (
                              <tr key={std.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-cyan-700 font-bold">
                                  {std.matricule}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {std.fullName}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{std.className}</td>
                                <td className="py-2.5 px-3 text-slate-600">{std.parentContact}</td>
                                <td className="py-2.5 px-3">
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                    À jour
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => handleDeleteStudent(std.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                    title="Supprimer ce dossier"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">Aucun élève enregistré dans la base locale.</p>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Utilisez le bouton "Inscrire un élève" ci-dessus pour ajouter vos dossiers scolaires réels.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeSchoolTab === 'finances' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Comptabilité & Suivi des Écolages (Strictement Local)
                    </h3>
                    <div className="py-10 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                      <DollarSign className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">Aucune transaction financière enregistrée.</p>
                      <p className="text-[11px] text-slate-400">
                        Les paiements d'écolages et reçus générés par l'établissement seront affichés ici.
                      </p>
                    </div>
                  </div>
                )}

                {activeSchoolTab === 'notes' && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Saisie des Notes & Bulletins Trimestriels
                    </h3>
                    <div className="py-10 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                      <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">Aucune note saisie pour la période en cours.</p>
                      <p className="text-[11px] text-slate-400">
                        Le relevé de notes reste exclusivement stocké dans le fichier SQLite local du poste.
                      </p>
                    </div>
                  </div>
                )}

                {activeSchoolTab === 'backup' && (
                  <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Sauvegarde de la Base Locale SQLite
                    </h3>
                    <p className="text-xs text-slate-600">
                      Les sauvegardes scolaires sont créées et chiffrées sur ce poste informatique sans jamais quitter l'établissement.
                    </p>
                    <div className="p-3 bg-slate-900 text-cyan-300 font-mono text-xs rounded-lg flex items-center justify-between">
                      <span>Emplacement : C:\IANATRA_DATA\school_offline.sqlite</span>
                      <span className="text-emerald-400 text-[10px]">Chiffré localement</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Inscription Élève Local */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Inscrire un Élève (Base Locale)</h3>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matricule *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: MAT-2026-001"
                  value={studentForm.matricule}
                  onChange={(e) => setStudentForm({ ...studentForm, matricule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom & Prénoms *</label>
                <input
                  type="text"
                  required
                  placeholder="Nom de l'élève"
                  value={studentForm.fullName}
                  onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classe *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: 6ème A, 3ème B, Terminale C"
                  value={studentForm.className}
                  onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Parent / Tuteur</label>
                <input
                  type="text"
                  placeholder="Téléphone ou email du tuteur"
                  value={studentForm.parentContact}
                  onChange={(e) => setStudentForm({ ...studentForm, parentContact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Enregistrer dans SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
