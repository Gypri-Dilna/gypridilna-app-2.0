import React, { useState, useEffect, useCallback } from 'react';
import { User, Chip } from '../types';
import { RefreshIcon, UserManagementIcon, EditIcon, TrashIcon } from './icons';
import { UserModal } from './UserModal';

interface UserManagementProps {
    chips: Chip[];
    showToast: (message: string, type: 'success' | 'error') => void;
    currentUser?: User | null;
    onUpdateCurrentUser?: (user: User) => void;
    onRefresh?: () => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ 
    chips, 
    showToast,
    currentUser,
    onUpdateCurrentUser,
    onRefresh
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('gypri_google_client_id') || '');

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data?.google_client_id) {
                    setGoogleClientId(data.google_client_id.trim());
                    localStorage.setItem('gypri_google_client_id', data.google_client_id.trim());
                }
            })
            .catch(() => {});
    }, []);

    const handleSaveClientId = async () => {
        try {
            const token = localStorage.getItem('gypri_auth_token');
            const res = await fetch('/api/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ google_client_id: googleClientId.trim() })
            });

            if (res.ok) {
                localStorage.setItem('gypri_google_client_id', googleClientId.trim());
                showToast('Google OAuth Client ID byl úspěšně uložen na server!', 'success');
            } else {
                throw new Error('Uložení selhalo.');
            }
        } catch (e: any) {
            showToast('Chyba při ukládání Client ID na server.', 'error');
        }
    };

    const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
        const token = localStorage.getItem('gypri_auth_token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...extraHeaders
        };
    };

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/users', {
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.detail || 'Chyba při načítání uživatelů');
            }
            const data = await response.json();
            setUsers(data);

            // Sync currently logged in user if updated
            if (currentUser && onUpdateCurrentUser) {
                const me = data.find((u: User) => u.id === currentUser.id);
                if (me) {
                    onUpdateCurrentUser(me);
                    localStorage.setItem('savedUser', JSON.stringify(me));
                }
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Chyba při načítání uživatelů.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast, currentUser, onUpdateCurrentUser]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Opravdu chcete smazat tohoto uživatele?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || data.error || data.detail || 'Chyba při mazání uživatele');
            }
            showToast('Uživatel byl úspěšně smazán.', 'success');
            await fetchUsers();
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Chyba při mazání uživatele.', 'error');
        }
    };

    const handleSaveUser = async (userData: any) => {
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || data.detail || 'Failed to save user');
            }

            const savedUser = await response.json();

            // If updated user is currently logged in user, sync app state immediately!
            if (currentUser && currentUser.id === savedUser.id && onUpdateCurrentUser) {
                onUpdateCurrentUser(savedUser);
                localStorage.setItem('savedUser', JSON.stringify(savedUser));
            }

            showToast(`Uživatel ${userData.username} byl úspěšně uložen.`, 'success');
            setIsModalOpen(false);
            await fetchUsers();
            if (onRefresh) await onRefresh();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Chyba při ukládání uživatele.', 'error');
        }
    };

    return (
        <div className="font-sans space-y-6">
            {/* Top Banner Card (Styled matching all other pages) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-dark border border-brand-border p-6 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <UserManagementIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">Správa uživatelů</h1>
                        <p className="text-xs text-gray-300 mt-0.5">Správa uživatelských účtů, rolí a přístupových práv</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAddUser}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                    >
                        <UserManagementIcon className="h-4 w-4" />
                        Přidat uživatele
                    </button>
                </div>
            </div>

            {/* Google OAuth Client ID Configuration Card (Responsive & Overflow-proof) */}
            <div className="bg-brand-dark border border-brand-border rounded-2xl p-6 shadow-md font-sans">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>🔑</span> Nastavení Google OAuth 2.0 Client ID
                        </h2>
                        <p className="text-xs text-gray-300 mt-0.5">
                            Zadejte Google Cloud Client ID pro aktivaci přihlašování přes Google pro přiřazené e-maily.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
                        <input
                            type="text"
                            placeholder="např. 123456789-xyz.apps.googleusercontent.com"
                            value={googleClientId}
                            onChange={e => setGoogleClientId(e.target.value)}
                            className="w-full sm:w-80 px-3.5 py-2 bg-brand-darker border border-brand-border rounded-xl text-white text-xs font-mono placeholder-gray-500 focus:outline-none focus:border-brand-teal transition"
                        />
                        <button
                            onClick={handleSaveClientId}
                            className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl shadow transition shrink-0 text-center"
                        >
                            Uložit Client ID
                        </button>
                    </div>
                </div>
            </div>

            {/* User Management Table - Action Column First for Mobile Usability */}
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-md overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-brand-darker text-gray-400 font-bold tracking-wider border-b border-brand-border">
                            <tr>
                                <th scope="col" className="px-4 py-4 w-24">AKCE</th>
                                <th scope="col" className="px-6 py-4">UŽIVATELSKÉ JMÉNO</th>
                                <th scope="col" className="px-6 py-4">GOOGLE EMAIL</th>
                                <th scope="col" className="px-6 py-4">ROLE</th>
                                <th scope="col" className="px-6 py-4">PROPOJENÝ ČIP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-mono">Načítání uživatelů...</td>
                                </tr>
                            ) : users.length > 0 ? users.map(u => (
                                <tr key={u.id} className="bg-brand-dark border-b border-brand-border/60 hover:bg-[#343b47]/40 transition">
                                    {/* Action Buttons Column FIRST on left side */}
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <button 
                                                onClick={() => handleEditUser(u)} 
                                                className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                title="Upravit uživatele"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)} 
                                                className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                title="Smazat uživatele"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            {u.picture_url ? (
                                                <img src={u.picture_url} alt={u.username} className="w-7 h-7 rounded-lg object-cover border border-brand-teal/40 flex-shrink-0" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal flex-shrink-0 text-xs font-bold">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <span>{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">{u.email || <span className="text-gray-500 italic">Nenastaven</span>}</td>
                                    <td className="px-6 py-4 font-semibold">
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap leading-none ${
                                            u.is_admin 
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                                                : 'bg-brand-darker text-gray-300 border border-brand-border'
                                        }`}>
                                            {u.is_admin ? 'Administrátor' : 'Standardní uživatel'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        {u.chip_id ? chips.find(c => c.chip_id === u.chip_id)?.name || u.chip_id : <span className="text-gray-500 italic">Žádný</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-mono">Nenalezeni žádní uživatelé.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <UserModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    user={editingUser}
                    chips={chips}
                />
            )}
        </div>
    );
};
