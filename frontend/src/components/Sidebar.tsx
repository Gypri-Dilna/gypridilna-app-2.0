import React from 'react';
import {
  LayoutDashboard,
  Lock,
  Boxes,
  Users,
  Printer,
  QrCode,
  Globe,
} from 'lucide-react';

export type TabType = 'dashboard' | 'access' | 'inventory' | 'users' | 'onboard' | 'scanner' | 'webconnect';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const menuItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'access', label: 'Access Control', icon: <Lock className="w-5 h-5" /> },
    { id: 'inventory', label: 'Inventory Catalog', icon: <Boxes className="w-5 h-5" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-5 h-5" /> },
    { id: 'onboard', label: 'Print Label (18mm)', icon: <Printer className="w-5 h-5" /> },
    { id: 'scanner', label: 'QR Scanner', icon: <QrCode className="w-5 h-5" /> },
    { id: 'webconnect', label: 'WebConnect', icon: <Globe className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-brand-surface border-r border-brand-border flex flex-col shrink-0">
      <div className="p-4 border-b border-brand-border/40">
        <p className="text-[11px] font-bold text-brand-paperMuted tracking-wider uppercase">
          Navigation Menu
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 text-left ${
                isActive
                  ? 'bg-brand-mint/20 text-brand-mintLight border border-brand-mint/60 shadow-lg shadow-brand-mint/10'
                  : 'text-brand-paperMuted hover:bg-brand-dark/50 hover:text-brand-paper border border-transparent'
              }`}
            >
              <span className={isActive ? 'text-brand-mintLight' : 'text-brand-paperMuted'}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-brand-border/40 text-center">
        <p className="text-[11px] text-brand-paperMuted font-medium">Gypri Dílna App v2.0</p>
        <p className="text-[10px] text-brand-mint/70 font-semibold">24/7 Workshop Server</p>
      </div>
    </aside>
  );
};
