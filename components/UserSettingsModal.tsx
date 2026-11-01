import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, SuccessIcon, SettingsIcon, KeyIcon } from './icons';
import { 
    isNativeMobileApp, 
    isWebNfcSupported, 
    isNfcUnlockEnabled, 
    setNfcUnlockEnabled,
    triggerHaptic 
} from '../mobile';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
    userId?: number;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
    isOpen,
    onClose,
    showToast,
    userId
}) => {
    const [activeTab, setActiveTab] = useState<'app' | 'password'>('app');
    
    // App settings state (fixed server URL: access.gypridilna.cz)
    const [nfcEnabled, setLocalNfcEnabled] = useState(isNfcUnlockEnabled());

    // Password change state
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    if (!isOpen) return null;

    const handleSaveAppSettings = () => {
        setNfcUnlockEnabled(nfcEnabled);
        triggerHaptic('success');
        showToast('Nastavení aplikace bylo uloženo.', 'success');
        onClose();
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            showToast('Nová hesla se neshodují.', 'error');
            return;
        }

        if (newPassword.length < 4) {
            showToast('Nové heslo musí mít alespoň 4 znaky.', 'error');
            return;
        }

        setIsChangingPassword(true);
        try {
            const token = localStorage.getItem('gypri_auth_token');
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    user_id: userId,
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.detail || 'Změna hesla selhala.');
            }

            showToast('Heslo bylo úspěšně změněno.', 'success');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        } catch (err: any) {
            showToast(err.message || 'Chyba při změně hesla.', 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-backdrop-fade font-sans select-none">
            <div className="bg-brand-dark border border-brand-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-modal-pop">
                {/* Header */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-brand-border bg-brand-darker">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl">
                            <SettingsIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-white tracking-tight">Nastavení</h3>
                            <p className="text-[11px] text-gray-400">Volby účtu a mobilní aplikace</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg transition"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-brand-border bg-brand-darker/60 px-6 pt-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('app')}
                        className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
                            activeTab === 'app'
                                ? 'border-brand-teal text-brand-teal'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Aplikace a NFC
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 ${
                            activeTab === 'password'
                                ? 'border-brand-teal text-brand-teal'
                                : 'border-transparent text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        Změna hesla
                    </button>
                </div>

                {/* Tab Content: App & NFC Settings */}
                {activeTab === 'app' && (
                    <div className="p-6 space-y-4 text-xs">
                        {/* Toggle: NFC Quick Unlock */}
                        <div className="bg-brand-darker border border-brand-border rounded-xl p-3.5 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="font-bold text-white">
                                    Rychlé NFC odemykání
                                </div>
                                <p className="text-[11px] text-gray-400">
                                    Automaticky odemkne dveře po přiložení k nálepce.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                <input
                                    type="checkbox"
                                    checked={nfcEnabled}
                                    onChange={(e) => setLocalNfcEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal" />
                            </label>
                        </div>

                        {/* Read-Only Server Info */}
                        <div className="bg-brand-darker border border-brand-border rounded-xl p-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
                            <span>Centrální server:</span>
                            <span className="font-bold text-gray-200">access.gypridilna.cz</span>
                        </div>

                        {/* Diagnostics */}
                        <div className="bg-brand-darker border border-brand-border rounded-xl p-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
                            <span>Režim aplikace:</span>
                            <span className="font-bold text-brand-teal">
                                {isNativeMobileApp() ? 'Nativní Android' : 'Webová aplikace'}
                            </span>
                        </div>

                        <div className="bg-brand-darker border border-brand-border rounded-xl p-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
                            <span>Hardwarové NFC:</span>
                            <span className={`font-bold ${isWebNfcSupported() || isNativeMobileApp() ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isWebNfcSupported() || isNativeMobileApp() ? 'Dostupné' : 'Omezeno systémem'}
                            </span>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-brand-darker hover:bg-slate-800 text-gray-300 font-bold text-xs rounded-xl transition border border-brand-border"
                            >
                                Zrušit
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveAppSettings}
                                className="px-5 py-2 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5"
                            >
                                <SuccessIcon className="h-4 w-4" />
                                <span>Uložit</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Content: Password Change */}
                {activeTab === 'password' && (
                    <form onSubmit={handleChangePassword} className="p-6 space-y-4 text-xs">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Současné heslo *
                            </label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="Zadejte současné heslo"
                                className="w-full px-3.5 py-2 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Nové heslo *
                            </label>
                            <input
                                type="password"
                                required
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Minimálně 4 znaky"
                                className="w-full px-3.5 py-2 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Potvrzení nového hesla *
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Zadejte nové heslo znovu"
                                className="w-full px-3.5 py-2 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                            />
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-border">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-brand-darker hover:bg-slate-800 text-gray-300 font-bold text-xs rounded-xl transition border border-brand-border"
                            >
                                Zrušit
                            </button>
                            <button
                                type="submit"
                                disabled={isChangingPassword}
                                className="px-5 py-2 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl shadow transition active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <KeyIcon className="h-4 w-4" />
                                <span>{isChangingPassword ? 'Ukládám...' : 'Změnit heslo'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
};
