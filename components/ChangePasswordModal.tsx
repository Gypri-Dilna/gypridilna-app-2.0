import React, { useState } from 'react';
import { CloseIcon, KeyIcon } from './icons';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, userId, showToast }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            showToast('Nová hesla se neshodují. Zkontrolujte prosím zadání.', 'error');
            return;
        }

        if (newPassword.length < 4) {
            showToast('Nové heslo musí mít alespoň 4 znaky.', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('gypri_auth_token');
            const response = await fetch('/api/change-password', {
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

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || data.detail || 'Změna hesla selhala');
            }

            showToast('Heslo bylo úspěšně změněno.', 'success');
            onClose();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Chyba při změně hesla.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-backdrop-fade font-sans overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modal-pop my-auto">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-xl">
                                <KeyIcon className="h-5 w-5" />
                            </div>
                            <h2 id="modal-title" className="text-base font-extrabold text-white">
                                Změnit přístupové heslo
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="p-6 space-y-4 text-xs">
                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Současné heslo *
                            </label>
                            <input
                                type="password"
                                required
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="Zadejte vaše nynější heslo"
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
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
                                placeholder="Zadejte nové heslo"
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1">
                                Potvrdit nové heslo *
                            </label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Zadejte znovu nové heslo"
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 px-6 py-4 border-t border-brand-border bg-brand-darker">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-brand-dark hover:bg-slate-800 text-gray-300 text-xs font-bold rounded-xl border border-brand-border transition active:scale-95"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 text-xs font-extrabold text-black bg-brand-teal hover:bg-brand-teal-hover rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 disabled:bg-teal-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Ukládání...' : 'Uložit nové heslo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
