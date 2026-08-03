import React, { useState } from 'react';
import { 
    DashboardIcon, ScanIcon, LogoutIcon, 
    Menu, X, UserManagementIcon, UserIcon, KeyIcon, 
    InventoryIcon, QrCodeIcon, WebConnectIcon
} from './icons';
import { Logo } from './Logo';
import { User } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

export type TabType = 'dashboard' | 'access' | 'inventory' | 'scanner' | 'webconnect' | 'users';

interface HeaderProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    onLogout: () => void;
    user: User;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
    activeTab,
    setActiveTab,
    onLogout,
    user,
    showToast
}) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, show: true },
        { id: 'access', label: 'Door Access', icon: ScanIcon, show: user.is_admin || user.permissions?.add_chips || user.permissions?.view_logs },
        { id: 'inventory', label: 'Inventory', icon: InventoryIcon, show: true },
        { id: 'scanner', label: 'QR Scanner', icon: QrCodeIcon, show: true },
        { id: 'webconnect', label: 'WebConnect', icon: WebConnectIcon, show: true },
        { id: 'users', label: 'User Admin', icon: UserManagementIcon, show: user.is_admin },
    ];

    return (
        <>
            {/* Desktop Sidebar (Permanent 240px) */}
            <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 bg-brand-dark border-r border-brand-border h-screen sticky top-0 font-sans">
                <div className="p-5 flex flex-col h-full justify-between overflow-y-auto">
                    <div>
                        {/* Official Brand Logo & Name */}
                        <div className="flex items-center gap-3.5 pb-5 border-b border-brand-border">
                            <Logo variant="light" className="h-10 w-auto flex-shrink-0" />
                            <div>
                                <h1 className="font-extrabold text-brand-light text-base leading-tight tracking-tight">GYPRI DÍLNA</h1>
                                <p className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">Access & Inventory</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="mt-5 space-y-1">
                            {navItems.filter(item => item.show).map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as TabType)}
                                        className={`flex items-center w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition ${
                                            isActive
                                                ? 'bg-brand-teal text-black'
                                                : 'text-gray-300 hover:bg-brand-darker hover:text-white'
                                        }`}
                                    >
                                        <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-black' : 'text-brand-teal'}`} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* User Card & Logout */}
                    <div className="pt-4 border-t border-brand-border space-y-3">
                        <div className="p-3 bg-brand-darker rounded-xl border border-brand-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-lg">
                                    <UserIcon className="h-4 w-4" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-bold text-white truncate">{user.username}</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-mono">{user.is_admin ? 'Administrator' : 'User'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsChangePasswordOpen(true)}
                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-brand-dark hover:bg-slate-700 text-gray-300 text-[11px] font-semibold rounded-lg transition border border-brand-border"
                            >
                                <KeyIcon className="h-3.5 w-3.5" /> Change Password
                            </button>
                        </div>

                        <button
                            onClick={onLogout}
                            className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition"
                        >
                            <LogoutIcon className="h-4 w-4 mr-2" />
                            Log Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header Bar & Drawer */}
            <div className="md:hidden sticky top-0 z-40 bg-brand-dark border-b border-brand-border px-4 py-3 flex items-center justify-between font-sans">
                <div className="flex items-center gap-2.5">
                    <Logo variant="light" className="h-7 w-auto" />
                    <span className="font-extrabold text-white text-sm">GYPRI DÍLNA</span>
                </div>

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-300 hover:text-white bg-brand-darker rounded-lg border border-brand-border"
                >
                    {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile Drawer Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-50 bg-black/80 flex flex-col p-6 font-sans">
                    <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                        <div className="flex items-center gap-2">
                            <Logo variant="light" className="h-8 w-auto" />
                            <span className="font-extrabold text-white text-base">GYPRI DÍLNA</span>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="mt-6 space-y-2 flex-1">
                        {navItems.filter(item => item.show).map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id as TabType);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center w-full px-4 py-3 text-sm font-bold rounded-xl transition ${
                                        isActive
                                            ? 'bg-brand-teal text-black'
                                            : 'text-gray-200 bg-brand-dark border border-brand-border'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 mr-3" />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="pt-4 border-t border-brand-border space-y-3">
                        <div className="text-xs text-gray-300 font-mono">User: <strong className="text-brand-teal">{user.username}</strong></div>
                        <button
                            onClick={onLogout}
                            className="w-full py-3 bg-rose-500/20 text-rose-300 font-bold rounded-xl border border-rose-500/40 text-xs"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isChangePasswordOpen && (
                <ChangePasswordModal
                    isOpen={isChangePasswordOpen}
                    onClose={() => setIsChangePasswordOpen(false)}
                    userId={user.id}
                    showToast={showToast}
                />
            )}
        </>
    );
};