import React, { useState, useEffect } from 'react';
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
            setPassword(''); // Don't show password
            setIsAdmin(user.is_admin);
            setChipId(user.chip_id);
            setPermissions(user.permissions);
        } else {
            setUsername('');
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-brand-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                        {user ? 'Edit User' : 'Add New User'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {user ? 'Password (leave blank to keep current)' : 'Password'}
                        </label>
                        <input
                            type="password"
                            required={!user}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isAdmin"
                            checked={isAdmin}
                            onChange={e => setIsAdmin(e.target.checked)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isAdmin" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Administrator (Full Access)
                        </label>
                    </div>

                    {!isAdmin && (
                        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Permissions</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.entries(permissions).map(([key, value]) => (
                                    <div key={key} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`perm-${key}`}
                                            checked={value}
                                            onChange={() => togglePermission(key as keyof Permissions)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`perm-${key}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300 capitalize">
                                            {key.replace('_', ' ')}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Match with Chip Profile</label>
                        <select
                            value={chipId || ''}
                            onChange={e => setChipId(e.target.value || null)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">None</option>
                            {chips.map(chip => (
                                <option key={chip.id} value={chip.chip_id}>
                                    {chip.name} ({chip.chip_id})
                                </option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Linking a chip allows logging the user's name when they use their physical chip.
                        </p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Save User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
