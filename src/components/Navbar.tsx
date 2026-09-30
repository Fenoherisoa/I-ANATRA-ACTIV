/**
 * I-ANATRA Ecosystem - RFC OFFICE
 * Composant de navigation supérieure
 * © 2026 RFC OFFICE — Tous droits réservés
 */

import React from 'react';
import { ShieldCheck, Monitor, CheckCircle2, Server, LogOut, KeyRound } from 'lucide-react';

interface NavbarProps {
  currentTab: 'admin' | 'client' | 'tests';
  onTabChange: (tab: 'admin' | 'client' | 'tests') => void;
  adminUser?: any;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  adminUser,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 border-b border-cyan-900/50 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marque */}
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-800 border border-cyan-500/40 p-1 flex items-center justify-center shadow-inner">
              <img
                src="/ianatra.png"
                alt="Logo I-ANATRA"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <KeyRound className="w-6 h-6 text-cyan-400 absolute" style={{ opacity: 0.2 }} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold tracking-wider text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200">
                  I-ANATRA
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 font-mono font-medium">
                  LICENSE SYSTEM
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide font-medium">
                RFC OFFICE — ÉDITEUR OFFICIEL © 2026
              </p>
            </div>
          </div>

          {/* Sélecteur de mode de l'écosystème */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => onTabChange('admin')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'admin'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              <span>LICENSE ADMIN</span>
            </button>

            <button
              onClick={() => onTabChange('client')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'client'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Monitor className="w-4 h-4 text-teal-300" />
              <span>POSTE I-ANATRA (WINDOWS)</span>
            </button>

            <button
              onClick={() => onTabChange('tests')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                currentTab === 'tests'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>TESTS DE SÉCURITÉ (18/18)</span>
            </button>
          </nav>

          {/* Badge utilisateur / Déconnexion */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-200">
                {adminUser?.fullName || 'Directeur Technique'}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">
                {adminUser?.role || 'SUPER_ADMIN'}
              </span>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Déconnexion"
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
