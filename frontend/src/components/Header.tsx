import React from 'react';
import { Cpu, LogOut, ShieldCheck } from 'lucide-react';
import { authService } from '../services/api';

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const username = localStorage.getItem('username') || 'Administrator';
  const role = localStorage.getItem('role') || 'ADMIN';

  return (
    <header className="h-16 bg-brand-surface border-b border-brand-border px-6 flex items-center justify-between shrink-0 shadow-md">
      {/* Brand Title & Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-brand-dark rounded-lg border border-brand-mint/30 flex items-center justify-center shadow-inner">
          <Cpu className="w-5 h-5 text-brand-mint" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-brand-paper tracking-wider">GYPRI DÍLNA 2.0</h1>
          <p className="text-[11px] text-brand-paperMuted uppercase tracking-widest font-medium">
            Unified Access & Inventory System
          </p>
        </div>
      </div>

      {/* Live Server Indicator & User Profile Badge */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-brand-dark/60 border border-brand-mint/40 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-brand-granted animate-pulse"></span>
          <span className="text-xs font-semibold text-brand-mint uppercase tracking-wider">Server Online</span>
        </div>

        <div className="flex items-center space-x-3 bg-brand-dark border border-brand-border px-3 py-1.5 rounded-lg">
          <div className="w-7 h-7 bg-brand-mint/20 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-mintLight" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-brand-paper leading-tight">{username}</p>
            <p className="text-[10px] font-semibold text-brand-mintLight leading-tight">{role}</p>
          </div>
          <button
            onClick={() => {
              authService.logout();
              onLogout();
            }}
            className="text-brand-paperMuted hover:text-brand-denied transition-colors p-1"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
