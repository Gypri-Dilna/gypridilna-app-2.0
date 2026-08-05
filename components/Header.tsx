import React, { useState, useEffect } from 'react';
import {
    DashboardIcon, ScanIcon, LogoutIcon,
    Menu, X, UserManagementIcon, UserIcon, KeyIcon,
    InventoryIcon, QrCodeIcon, SearchIcon
} from './icons';
import { Logo } from './Logo';
import { User } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

export type TabType = 'dashboard' | 'access' | 'inventory' | 'scanner' | 'users';

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
    const [isClosing, setIsClosing] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Lock body scrolling when mobile menu drawer is open or animating out
    useEffect(() => {
        if (isMobileMenuOpen || isClosing) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen, isClosing]);

    const closeMobileMenu = () => {
        if (isClosing) return;
        setIsClosing(true);
        setTimeout(() => {
            setIsMobileMenuOpen(false);
            setIsClosing(false);
        }, 240);
    };

    const openMobileMenu = () => {
        setIsClosing(false);
        setIsMobileMenuOpen(true);
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const navItems = [
        { id: 'dashboard', label: 'Přehled', icon: DashboardIcon, show: true },
        { id: 'access', label: 'Vstup a čipy', icon: ScanIcon, show: user.is_admin || user.permissions?.add_chips || user.permissions?.view_logs },
        { id: 'inventory', label: 'Katalog zásob', icon: InventoryIcon, show: true },
        { id: 'scanner', label: isMobile ? 'QR Skener' : 'Vyhledat položku', icon: isMobile ? QrCodeIcon : SearchIcon, show: true },
        { id: 'users', label: 'Správa uživatelů', icon: UserManagementIcon, show: user.is_admin },
    ];

    return (
        <>
            {/* CSS Animation Keyframes for Smooth Slide-In AND Slide-Out */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0.5;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                @keyframes fadeInBackdrop {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOutBackdrop {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .drawer-slide-in {
                    animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .drawer-slide-out {
                    animation: slideOutRight 0.24s cubic-bezier(0.7, 0, 0.84, 0) forwards;
                }
                .backdrop-fade-in {
                    animation: fadeInBackdrop 0.25s ease-out forwards;
                }
                .backdrop-fade-out {
                    animation: fadeOutBackdrop 0.22s ease-in forwards;
                }
            `}</style>

            {/* Desktop Sidebar (Permanent 240px) */}
            <aside className="hidden md:flex md:flex-col w-64 flex-shrink-0 bg-brand-dark border-r border-brand-border h-screen sticky top-0 font-sans relative overflow-hidden">
                <div className="p-5 flex flex-col h-full justify-between overflow-y-auto relative z-10">
                    <div>
                        {/* Official Brand Logo & Name (lowercase: gypri in white, dílna in brand teal) */}
                        <div className="flex items-center gap-3 pb-5 border-b border-brand-border">
                            <Logo variant="light" className="h-9 w-auto flex-shrink-0" />
                            <div>
                                <h1 className="font-black text-base tracking-tight leading-tight lowercase">
                                    <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span>
                                </h1>
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
                                        className={`flex items-center w-full px-3.5 py-2.5 text-xs font-bold rounded-xl transition ${isActive
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
                                    <p className="text-[10px] text-gray-400 uppercase font-mono">{user.is_admin ? 'Administrátor' : 'Uživatel'}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsChangePasswordOpen(true)}
                                className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-brand-dark hover:bg-slate-700 text-gray-300 text-[11px] font-semibold rounded-lg transition border border-brand-border"
                            >
                                <KeyIcon className="h-3.5 w-3.5" /> Změnit heslo
                            </button>
                        </div>

                        <button
                            onClick={onLogout}
                            className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition"
                        >
                            <LogoutIcon className="h-4 w-4 mr-2" />
                            Odhlásit se
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Top Header Bar */}
            <div className="md:hidden sticky top-0 z-40 bg-brand-dark border-b border-brand-border px-4 py-3 flex items-center justify-between font-sans">
                <div className="flex items-center gap-2.5">
                    <Logo variant="light" className="h-7 w-auto" />
                    <span className="font-black text-sm tracking-tight lowercase">
                        <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span>
                    </span>
                </div>

                <button
                    onClick={openMobileMenu}
                    className="p-2 text-gray-300 hover:text-white bg-brand-darker rounded-xl border border-brand-border transition active:scale-95"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {/* Bi-Directional Animated Mobile Slide Drawer Overlay (Slide-In & Slide-Out) */}
            {(isMobileMenuOpen || isClosing) && (
                <div className="md:hidden fixed inset-0 z-[90]">
                    {/* Dimmed Blurred Backdrop with Fade-In / Fade-Out */}
                    <div
                        onClick={closeMobileMenu}
                        className={`fixed inset-0 bg-black/65 backdrop-blur-sm ${isClosing ? 'backdrop-fade-out' : 'backdrop-fade-in'
                            }`}
                    />

                    {/* Sliding Side Drawer with Slide-In & Slide-Out Animations */}
                    <div
                        className={`fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm h-[100dvh] bg-brand-dark border-l border-brand-border shadow-2xl z-[100] p-6 flex flex-col font-sans overflow-y-auto ${isClosing ? 'drawer-slide-out' : 'drawer-slide-in'
                            }`}
                    >
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                            <div className="flex items-center gap-2.5">
                                <Logo variant="light" className="h-7 w-auto flex-shrink-0" />
                                <span className="font-black text-base tracking-tight lowercase">
                                    <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span>
                                </span>
                            </div>
                            <button
                                onClick={closeMobileMenu}
                                className="p-2 text-gray-400 hover:text-white bg-brand-darker rounded-xl border border-brand-border transition"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Navigation Items */}
                        <nav className="mt-6 space-y-2 flex-1">
                            {navItems.filter(item => item.show).map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id as TabType);
                                            closeMobileMenu();
                                        }}
                                        className={`flex items-center w-full px-4 py-3.5 text-xs font-bold rounded-xl transition transform active:scale-98 ${isActive
                                                ? 'bg-brand-teal text-black shadow-lg shadow-brand-teal/20'
                                                : 'text-gray-200 bg-brand-darker border border-brand-border hover:bg-slate-800'
                                            }`}
                                    >
                                        <Icon className={`h-4 w-4 mr-3 flex-shrink-0 ${isActive ? 'text-black' : 'text-brand-teal'}`} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* User Card & Logout Footer */}
                        <div className="pt-4 border-t border-brand-border space-y-3 mt-4">
                            <div className="p-3 bg-brand-darker rounded-xl border border-brand-border flex items-center justify-between">
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <div className="p-1.5 bg-brand-teal/10 text-brand-teal rounded-lg flex-shrink-0">
                                        <UserIcon className="h-4 w-4" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-white truncate">{user.username}</p>
                                        <p className="text-[9px] text-gray-400 uppercase font-mono">{user.is_admin ? 'Admin' : 'Uživatel'}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        closeMobileMenu();
                                        setIsChangePasswordOpen(true);
                                    }}
                                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-brand-dark hover:bg-slate-700 text-gray-300 text-[10px] font-semibold rounded-lg transition border border-brand-border"
                                >
                                    <KeyIcon className="h-3 w-3 flex-shrink-0" /> Heslo
                                </button>
                            </div>

                            <button
                                onClick={onLogout}
                                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl border border-rose-500/30 text-xs transition"
                            >
                                <LogoutIcon className="h-4 w-4 mr-2 inline-block flex-shrink-0" />
                                Odhlásit se
                            </button>
                        </div>
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