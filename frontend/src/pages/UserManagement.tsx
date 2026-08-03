import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, CheckSquare, Square } from 'lucide-react';
import { userService } from '../services/api';
import { User } from '../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['manage_inventory']);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.list();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName) return;
    try {
      await userService.create({
        username,
        password,
        full_name: fullName,
        role,
        permissions: selectedPermissions,
      });
      setShowAddModal(false);
      setUsername('');
      setPassword('');
      setFullName('');
      fetchUsers();
    } catch (e) {
      alert('Error creating user: ' + e);
    }
  };

  const allPermissions = [
    { id: 'unlock_door_remotely', label: 'Remote Door Unlock' },
    { id: 'toggle_service_mode', label: 'Toggle Service Mode' },
    { id: 'manage_inventory', label: 'Manage Inventory Items' },
    { id: 'manage_map_grid', label: 'Edit Workshop 2D Minimap Grid' },
    { id: 'manage_users', label: 'Admin User Management' },
  ];

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-brand-paper tracking-wider">
            USER MANAGEMENT & RBAC PERMISSIONS
          </h2>
          <p className="text-xs text-brand-paperMuted mt-1">
            Admin role hierarchy and granular permission control
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-brand-mint text-brand-dark font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-brand-mintLight transition-colors shadow-md"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* User Table Card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
        {loading ? (
          <p className="text-xs text-brand-paperMuted text-center py-6">Loading users...</p>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="bg-brand-dark/50 border border-brand-border/60 p-4 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-brand-mint/20 rounded-xl flex items-center justify-center text-brand-mintLight font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-brand-paper text-sm">{u.full_name}</p>
                    <p className="text-[11px] text-brand-paperMuted">
                      Username: <span className="font-mono text-brand-mint">{u.username}</span> • Role: {u.role}
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-brand-granted/15 text-brand-granted border border-brand-granted/40">
                  {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-brand-paper mb-4 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-brand-mint" />
              <span>Create New Workshop User</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint cursor-pointer"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="MEMBER">MEMBER</option>
                  <option value="GUEST">GUEST</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-paperMuted">
                  Granular Permissions
                </label>
                {allPermissions.map((p) => {
                  const isChecked = selectedPermissions.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => togglePermission(p.id)}
                      className="flex items-center space-x-2 text-xs text-brand-paper cursor-pointer select-none"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-brand-mint" />
                      ) : (
                        <Square className="w-4 h-4 text-brand-paperMuted" />
                      )}
                      <span>{p.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-brand-paperMuted hover:text-brand-paper"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-mint text-brand-dark font-bold rounded-lg text-sm hover:bg-brand-mintLight transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
