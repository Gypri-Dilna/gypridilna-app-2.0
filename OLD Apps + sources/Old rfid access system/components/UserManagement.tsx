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
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">User Management</h1>
                <div className="flex gap-2">
                    <button onClick={fetchUsers} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <RefreshIcon className="h-5 w-5"/>
                    </button>
                    <button
                        onClick={handleAddUser}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <UserManagementIcon className="h-5 w-5" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Linked Chip</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Loading users...</td>
                                </tr>
                            ) : users.length > 0 ? users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            user.is_admin ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                        }`}>
                                            {user.is_admin ? 'Admin' : 'User'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {user.chip_id ? chips.find(c => c.chip_id === user.chip_id)?.name || user.chip_id : 'None'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => handleEditUser(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">No users found.</td>
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
