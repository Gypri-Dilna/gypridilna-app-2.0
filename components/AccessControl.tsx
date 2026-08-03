import React, { useState } from 'react';
import { Chip, AccessLog, User } from '../types';
import { ChipManagement } from './ChipManagement';
import { LogsViewer } from './LogsViewer';
import { ScanIcon, RemoteIcon, ShieldIcon, RefreshIcon, ClipboardIcon } from './icons';

interface AccessControlProps {
    user: User;
    chips: Chip[];
    logs: AccessLog[];
    onAddChip: (newChip: Omit<Chip, 'id'>) => Promise<void>;
    onUpdateChip: (updatedChip: Chip) => Promise<void>;
    onDeleteChip: (chipId: number) => Promise<void>;
    onRemoteOpening: () => Promise<void>;
    onToggleServiceMode: (enabled: boolean) => Promise<void>;
    onRefresh: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({
    user,
    chips,
    logs,
    onAddChip,
    onUpdateChip,
    onDeleteChip,
    onRemoteOpening,
    onToggleServiceMode,
    onRefresh,
    showToast
}) => {
    const [subTab, setSubTab] = useState<'chips' | 'logs'>('chips');
    const [isServiceMode, setIsServiceMode] = useState<boolean>(false);

    const handleToggleService = async () => {
        const next = !isServiceMode;
        setIsServiceMode(next);
        await onToggleServiceMode(next);
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-brand-card border border-brand-border p-6 rounded-2xl shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 text-brand-cyan rounded-xl">
                            <ScanIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">RFID Access Control System</h1>
                            <p className="text-xs text-gray-400">Physical Gate Controller, RFID Chips & Security Logs</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {(user.is_admin || user.permissions.service_mode) && (
                            <button
                                onClick={handleToggleService}
                                className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                                    isServiceMode 
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20' 
                                        : 'bg-slate-900 border-brand-border text-gray-300 hover:bg-slate-800'
                                }`}
                            >
                                Service Mode: {isServiceMode ? 'ACTIVE (Door Unlocked)' : 'OFF'}
                            </button>
                        )}

                        {(user.is_admin || user.permissions.remote_opening) && (
                            <button
                                onClick={onRemoteOpening}
                                className="flex items-center gap-2 px-5 py-2 bg-brand-cyan hover:bg-cyan-300 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-95"
                            >
                                <RemoteIcon className="h-4 w-4" />
                                Remote Gate Unlock
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex gap-2 pt-2 border-t border-brand-border">
                    <button
                        onClick={() => setSubTab('chips')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            subTab === 'chips' 
                                ? 'bg-slate-800 text-brand-cyan border border-brand-cyan/40 shadow' 
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <ScanIcon className="h-4 w-4" /> RFID Chips ({chips.length})
                    </button>
                    {(user.is_admin || user.permissions.view_logs) && (
                        <button
                            onClick={() => setSubTab('logs')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                                subTab === 'logs' 
                                    ? 'bg-slate-800 text-brand-cyan border border-brand-cyan/40 shadow' 
                                    : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <ClipboardIcon className="h-4 w-4" /> Access Logs ({logs.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Subtab Content */}
            {subTab === 'chips' ? (
                <ChipManagement
                    chips={chips}
                    onAddChip={onAddChip}
                    onUpdateChip={onUpdateChip}
                    onDeleteChip={onDeleteChip}
                    showToast={showToast}
                />
            ) : (
                <LogsViewer
                    user={user}
                    logs={logs}
                    onRefresh={onRefresh}
                />
            )}
        </div>
    );
};
