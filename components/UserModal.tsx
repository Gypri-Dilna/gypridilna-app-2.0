import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Chip, Permissions } from '../types';
import { CloseIcon } from './icons';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: any) => void;
    user: User | null;
    chips: Chip[];
}

const DEFAULT_PERMISSIONS: Permissions = {
    service_mode: false,
    add_chips: false,
    view_logs: false,
    remote_opening: false,
    erase_logs: false,
    inventory_edit: true
};

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, chips }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [chipId, setChipId] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

    // Lock background page scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (user) {
            setUsername(user.username || '');
            setEmail(user.email || '');
            setPassword(''); // Don't show password
            setIsAdmin(user.is_admin || false);
            setChipId(user.chip_id || null);
            setPermissions({
                service_mode: user.permissions?.service_mode ?? false,
                add_chips: user.permissions?.add_chips ?? false,
                view_logs: user.permissions?.view_logs ?? false,
                remote_opening: user.permissions?.remote_opening ?? false,
                erase_logs: user.permissions?.erase_logs ?? false,
                inventory_edit: user.permissions?.inventory_edit ?? true,
            });
        } else {
            setUsername('');
            setEmail('');
            setPassword('');
            setIsAdmin(false);
            setChipId(null);
            setPermissions(DEFAULT_PERMISSIONS);
        }
    }, [user, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userData: any = {
            username,
            email: email.trim() || null,
            is_admin: isAdmin,
            permissions,
            chip_id: chipId
        };
        if (password) {
            userData.password = password;
        }
        onSave(userData);
    };

    const togglePermission = (key: keyof Permissions) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 180);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md font-sans overflow-hidden ${
            isClosing ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade'
        }`}>
            <div className={`bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto max-h-[85vh] flex flex-col ${
                isClosing ? 'animate-modal-pop-out' : 'animate-modal-pop'
            }`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker shrink-0">
                    <h2 className="text-base font-extrabold text-white">
                        {user ? 'Upravit uživatele' : 'Přidat nového uživatele'}
                    </h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Uživatelské jméno *</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Google Email (Pro přihlašování přes Google)</label>
                        <input
                            type="email"
                            placeholder="uzivatel@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">
                            Přiřazením e-mailu umožníte uživateli přihlášení přes Google.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                            {user ? 'Heslo (ponechte prázdné pro zachování)' : 'Heslo *'}
                        </label>
                        <input
                            type="password"
                            required={!user}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="isAdmin"
                            checked={isAdmin}
                            onChange={e => setIsAdmin(e.target.checked)}
                            className="h-4 w-4 rounded bg-brand-darker border-brand-border text-brand-teal focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="isAdmin" className="text-xs font-bold text-white cursor-pointer select-none">
                            Administrátor (Plný přístup k systému)
                        </label>
                    </div>

                    {!isAdmin && (
                        <div className="space-y-3 p-4 bg-brand-darker border border-brand-border rounded-xl">
                            <h3 className="text-xs font-bold text-brand-teal uppercase tracking-wider">Detailní oprávnění</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(permissions).map(([key, value]) => {
                                    const czechLabels: Record<string, string> = {
                                        service_mode: 'Servisní režim',
                                        add_chips: 'Správa čipů',
                                        view_logs: 'Prohlížení historie',
                                        remote_opening: 'Vzdálené otevírání',
                                        erase_logs: 'Mazání historie',
                                        inventory_edit: 'Úprava skladu'
                                    };
                                    return (
                                        <div key={key} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id={`perm-${key}`}
                                                checked={!!value}
                                                onChange={() => togglePermission(key as keyof Permissions)}
                                                className="h-4 w-4 rounded bg-brand-dark border-brand-border text-brand-teal focus:ring-0 cursor-pointer"
                                            />
                                            <label htmlFor={`perm-${key}`} className="text-xs text-gray-300 cursor-pointer select-none">
                                                {czechLabels[key] || key.replace('_', ' ')}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Propojit s profilovým čipem RFID</label>
                        <select
                            value={chipId || ''}
                            onChange={e => setChipId(e.target.value || null)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-brand-teal transition"
                        >
                            <option value="">Žádný (nepropojeno)</option>
                            {chips.map(chip => (
                                <option key={chip.id} value={chip.chip_id}>
                                    {chip.name} ({chip.chip_id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-brand-border">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-5 py-2.5 bg-brand-darker border border-brand-border text-gray-300 hover:text-white font-bold text-xs rounded-xl transition"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl transition shadow"
                        >
                            Uložit uživatele
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
