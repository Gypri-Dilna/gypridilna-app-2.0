import React, { useState } from 'react';
import { DashboardIcon, UsersIcon, ClipboardIcon, LogoutIcon, SunIcon, MoonIcon, DesktopIcon, Menu, X, UserManagementIcon, UserIcon, KeyIcon } from './icons';
import { Theme } from '../App';
import { User } from '../types';
import { ChangePasswordModal } from './ChangePasswordModal';

interface HeaderProps {
    activeTab: 'dashboard' | 'chips' | 'logs' | 'users';
    setActiveTab: (tab: 'dashboard' | 'chips' | 'logs' | 'users') => void;
    onLogout: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    user: User;
    showToast: (message: string, type: 'success' | 'error') => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    isMobile?: boolean;
}> = ({ icon, label, isActive, onClick, isMobile }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-150 rounded-lg ${
                isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            } ${isMobile ? 'justify-center' : ''}`}
        >
            {icon}
            <span className={`ml-4 ${isMobile ? 'sr-only' : ''}`}>{label}</span>
        </button>
    );
};

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onLogout, theme, setTheme, user, showToast }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const themes: Theme[] = ['light', 'dark', 'system'];

    const handleThemeChange = () => {
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };
    
    const themeIcon = {
        light: <SunIcon className="h-5 w-5" />,
        dark: <MoonIcon className="h-5 w-5" />,
        system: <DesktopIcon className="h-5 w-5" />,
    }[theme];

    const navItems = (
        <>
            <NavItem 
                icon={<DashboardIcon className="h-5 w-5" />}
                label="Dashboard"
                isActive={activeTab === 'dashboard'}
                onClick={() => setActiveTab('dashboard')}
                isMobile={false}
            />
            {(user.is_admin || user.permissions.add_chips) && (
                <NavItem
                    icon={<UsersIcon className="h-5 w-5" />}
                    label="Chip Management"
                    isActive={activeTab === 'chips'}
                    onClick={() => setActiveTab('chips')}
                    isMobile={false}
                />
            )}
            {(user.is_admin || user.permissions.view_logs) && (
                <NavItem
                    icon={<ClipboardIcon className="h-5 w-5" />}
                    label="Access Logs"
                    isActive={activeTab === 'logs'}
                    onClick={() => setActiveTab('logs')}
                    isMobile={false}
                />
            )}
            {user.is_admin && (
                <NavItem
                    icon={<UserManagementIcon className="h-5 w-5" />}
                    label="User Management"
                    isActive={activeTab === 'users'}
                    onClick={() => setActiveTab('users')}
                    isMobile={false}
                />
            )}
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex md:flex-col md:w-64 flex-shrink-0 bg-white dark:bg-brand-dark shadow-lg">
                <div className="py-4 px-6 h-full flex flex-col">
                    <div className="flex items-center justify-start py-2">
                        <img 
                            src="/assets/logo.svg" 
                            alt="Logo"
                            className="h-12 w-auto"
                        />
                    </div>
                    <nav className="mt-8 flex-1 space-y-2">
                        {navItems}
                    </nav>
                    <div className="mt-auto space-y-2">
                        <div className="px-4 py-3 mb-2 border-t dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-full">
                                    <UserIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.username}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.is_admin ? 'Administrator' : 'User'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChangePasswordOpen(true)}
                                className="flex items-center w-full px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <KeyIcon className="h-4 w-4 mr-2" />
                                Change Password
                            </button>
                        </div>
                        <button
                            onClick={handleThemeChange}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 capitalize"
                        >
                            {themeIcon}
                            <span className="ml-4">Theme: {theme}</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <LogoutIcon className="h-5 w-5" />
                            <span className="ml-4">Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-brand-dark shadow-t-lg z-50">
                <div className="flex justify-around items-center h-16">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} isMobile={true} />
                    {(user.is_admin || user.permissions.add_chips) && (
                        <NavItem icon={<UsersIcon />} label="Chips" isActive={activeTab === 'chips'} onClick={() => setActiveTab('chips')} isMobile={true} />
                    )}
                    {(user.is_admin || user.permissions.view_logs) && (
                        <NavItem icon={<ClipboardIcon />} label="Logs" isActive={activeTab === 'logs'} onClick={() => setActiveTab('logs')} isMobile={true} />
                    )}
                    {user.is_admin && (
                        <NavItem icon={<UserManagementIcon />} label="Users" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} isMobile={true} />
                    )}
                    <button onClick={() => setIsMenuOpen(true)} className="p-4 text-gray-600 dark:text-gray-400">
                        <Menu />
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsMenuOpen(false)}>
                    <div className="fixed inset-y-0 right-0 w-64 bg-white dark:bg-brand-dark shadow-lg p-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 text-gray-600 dark:text-gray-400">
                            <X />
                        </button>
                        <div className="mt-12 space-y-4 flex-1">
                             <div className="px-4 py-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <UserIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{user.username}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setIsChangePasswordOpen(true);
                                    }}
                                    className="flex items-center w-full px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <KeyIcon className="h-4 w-4 mr-2" />
                                    Change Password
                                </button>
                            </div>
                             <button
                                onClick={handleThemeChange}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 capitalize"
                            >
                                {themeIcon}
                                <span className="ml-4">Theme: {theme}</span>
                            </button>
                             <button
                                onClick={onLogout}
                                className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                <LogoutIcon className="h-5 w-5" />
                                <span className="ml-4">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ChangePasswordModal 
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                userId={user.id}
                showToast={showToast}
            />
        </>
    );
};