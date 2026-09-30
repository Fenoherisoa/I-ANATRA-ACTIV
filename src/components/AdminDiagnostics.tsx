/**
 * I-ANATRA License Admin - RFC OFFICE
 * Diagnostics Système, Cryptographie et Paramètres
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Key, Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import { AdminApiClient } from '../services/api';

export const AdminDiagnostics: React.FC = () => {
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await AdminApiClient.getDiagnostics();
      setDiagnosticData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const copyPublicKey = () => {
    if (diagnosticData?.crypto?.publicKey) {
      navigator.clipboard.writeText(diagnosticData.crypto.publicKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Diagnostics Système & Cryptographie
          </h2>
          <p className="text-xs text-slate-500">
            Contrôle d'intégrité du serveur RFC OFFICE et des clés asymétriques Ed25519
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Rafraîchir Diagnostic</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Module Cryptographique */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-cyan-700 font-bold text-sm pb-2 border-b border-slate-100">
            <Cpu className="w-4 h-4" />
            <span>Moteur Cryptographique Ed25519 (RFC 8032)</span>
          </div>

          <div className="text-xs space-y-3">
            <div>
              <span className="text-slate-500 block mb-1 font-semibold">
                Clé Publique Officielle RFC OFFICE (Embarquée dans I-ANATRA Client) :
              </span>
              <div className="p-3 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] break-all select-all shadow-inner">
                {diagnosticData?.crypto?.publicKey || 'Chargement...'}
              </div>
              <button
                onClick={copyPublicKey}
                className="mt-2 text-[11px] text-cyan-600 hover:text-cyan-800 font-bold underline"
              >
                {copiedKey ? '✓ Clé publique copiée !' : 'Copier la clé publique base64'}
              </button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Clé Privée Sécurisée Côté Serveur</span>
              </div>
              <p className="text-[11px]">
                La clé privée Ed25519 est strictement conservée en mémoire sécurisée du serveur de licence et n'est jamais exposée ni transmise.
              </p>
            </div>
          </div>
        </div>

        {/* Santé de la Base de Données */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm pb-2 border-b border-slate-100">
            <Database className="w-4 h-4 text-cyan-600" />
            <span>État de la Persistance & Objets</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Comptes Administrateurs</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.admins ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Établissements / Écoles</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.customers ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Licences Générées</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.licenses ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Postes Windows Enregistrés</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.installations ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Événements d'Activation</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.events ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block">Entrées Journal d'Audit</span>
              <span className="text-lg font-bold text-slate-800">
                {diagnosticData?.counts?.auditLogs ?? 0}
              </span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-400">
            Node.js {diagnosticData?.nodeVersion || process.version} • Schéma Prisma PostgreSQL compatible
          </div>
        </div>
      </div>
    </div>
  );
};
