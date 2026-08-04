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

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, user, chips }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [chipId, setChipId] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permissions>({
        service_mode: false,
        add_chips: false,
        view_logs: false,
        remote_opening: false,
        erase_logs: false
    });

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email || '');
            setPassword(''); // Don't show password
            setIsAdmin(user.is_admin);
            setChipId(user.chip_id);
            setPermissions(user.permissions);
        } else {
            setUsername('');
            setEmail('');
            setPassword('');
            setIsAdmin(false);
            setChipId(null);
            setPermissions({
                service_mode: false,
                add_chips: false,
                view_logs: false,
                remote_opening: false,
                erase_logs: false
            });
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

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-backdrop-fade font-sans overflow-y-auto">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop my-auto max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker flex-shrink-0">
                    <h2 className="text-base font-extrabold text-white">
                        {user ? 'Edit System User' : 'Add New System User'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Username *</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Google Email (For Google Sign-In Authorization)</label>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition"
                        />
                        <p className="mt-1 text-[11px] text-gray-400">
                            Assigning an email allows this user to log in via Google. Unassigned Google emails are strictly rejected.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">
                            {user ? 'Password (leave blank to keep current)' : 'Password *'}
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
                            className="h-4 w-4 rounded bg-brand-darker border-brand-border text-brand-teal focus:ring-0"
                        />
                        <label htmlFor="isAdmin" className="text-xs font-bold text-white cursor-pointer">
                            Administrator (Full System Access)
                        </label>
                    </div>

                    {!isAdmin && (
                        <div className="space-y-3 p-4 bg-brand-darker border border-brand-border rounded-xl">
                            <h3 className="text-xs font-bold text-brand-teal uppercase tracking-wider">Granular Permissions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={`perm-${key}`}
                                            checked={value}
                                            onChange={() => togglePermission(key as keyof Permissions)}
                                            className="h-4 w-4 rounded bg-brand-dark border-brand-border text-brand-teal focus:ring-0"
                                        />
                                        <label htmlFor={`perm-${key}`} className="text-xs text-gray-300 capitalize cursor-pointer">
                                            {key.replace('_', ' ')}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1">Link with RFID Chip Profile</label>
                        <select
                            value={chipId || ''}
                            onChange={e => setChipId(e.target.value || null)}
                            className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-brand-teal transition"
                        >
                            <option value="">None (Unlinked)</option>
                            {chips.map(chip => (
                                <option key={chip.id} value={chip.chip_id}>
                                    {chip.name} ({chip.chip_id})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-gray-400">
                            Linking a chip tags the user's username when unlocking doors using their physical RFID chip.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-brand-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-2.5 bg-brand-darker border border-brand-border text-gray-300 hover:text-white font-bold text-xs rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl transition shadow"
                        >
                            Save User
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
