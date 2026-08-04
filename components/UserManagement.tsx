import React, { useState, useEffect, useCallback } from 'react';
import { User, Chip } from '../types';
import { RefreshIcon, UserManagementIcon, EditIcon, TrashIcon } from './icons';
import { UserModal } from './UserModal';

interface UserManagementProps {
    chips: Chip[];
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ chips, showToast }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            showToast('Error fetching users.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (userId: number) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete user');
            }
            showToast('User deleted successfully.', 'success');
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Error deleting user.', 'error');
        }
    };

    const handleSaveUser = async (userData: any) => {
        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save user');
            }

            showToast(`User ${userData.username} saved successfully.`, 'success');
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Error saving user.', 'error');
        }
    };

    return (
        <div className="font-sans space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <UserManagementIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight">User Administration</h1>
                        <p className="text-xs text-gray-300 mt-0.5">Manage System Accounts, Roles & Permissions</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchUsers} 
                        className="p-2.5 bg-brand-darker border border-brand-border text-gray-300 hover:text-white rounded-xl transition shadow"
                        title="Refresh Users"
                    >
                        <RefreshIcon className="h-4 w-4"/>
                    </button>
                    <button
                        onClick={handleAddUser}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                    >
                        <UserManagementIcon className="h-4 w-4" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#343b47] text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">USERNAME</th>
                                <th scope="col" className="px-6 py-4">ROLE</th>
                                <th scope="col" className="px-6 py-4">LINKED CHIP</th>
                                <th scope="col" className="px-6 py-4 text-right">ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-mono">Loading users...</td>
                                </tr>
                            ) : users.length > 0 ? users.map(u => (
                                <tr key={u.id} className="bg-brand-dark border-b border-brand-border/60 hover:bg-[#343b47]/40 transition">
                                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                                        {u.username}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                            u.is_admin ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                        }`}>
                                            {u.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        {u.chip_id ? chips.find(c => c.chip_id === u.chip_id)?.name || u.chip_id : <span className="text-gray-400 italic">None</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleEditUser(u)} 
                                                className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                title="Edit User"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)} 
                                                className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                title="Delete User"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-mono">No users found.</td>
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
