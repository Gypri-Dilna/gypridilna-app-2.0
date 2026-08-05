import React, { useState, useEffect, useCallback } from 'react';
import { User, Chip, AccessLog, InventoryItem } from '../types';
import { 
    RefreshIcon, RemoteIcon, UsersIcon, ShieldIcon, 
    ArrowUpRight, BoxesIcon
} from './icons';
import { BoltGlyphChain } from './BoltGlyph';

import { SlideToUnlockButton } from './SlideToUnlockButton';

interface DashboardProps {
    user: User;
    chips: Chip[];
    logs: AccessLog[];
    inventoryItems: InventoryItem[];
    onRemoteOpening: () => Promise<void>;
    onToggleServiceMode: (enabled: boolean) => Promise<void>;
    onRefresh: () => void;
    onNavigate: (tab: 'dashboard' | 'access' | 'inventory' | 'scanner' | 'webconnect' | 'users') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    user,
    chips,
    logs,
    inventoryItems,
    onRemoteOpening,
    onToggleServiceMode,
    onRefresh,
    onNavigate
}) => {
    const [isServiceMode, setIsServiceMode] = useState<boolean>(false);
    const [isServiceLoading, setIsServiceLoading] = useState<boolean>(true);

    const fetchServiceMode = useCallback(async () => {
        try {
            const res = await fetch('/api/service-mode-status');
            if (res.ok) {
                const data = await res.json();
                setIsServiceMode(data.enabled);
            }
        } catch (e) {
            console.error('Service mode status fetch error:', e);
        } finally {
            setIsServiceLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchServiceMode();
    }, [fetchServiceMode]);

    const handleServiceToggle = async () => {
        const nextState = !isServiceMode;
        setIsServiceMode(nextState);
        await onToggleServiceMode(nextState);
    };

    const recentLogs = logs.slice(0, 8);

    return (
        <div className="space-y-6 font-sans">
            {/* Top Banner */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-dark border border-brand-border p-6 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight leading-tight lowercase">
                        <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span> <span className="text-white">přehled</span>
                    </h1>
                    <p className="text-xs text-gray-300 mt-1">Přístupový systém RFID & Správa dílenského skladu</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        className="p-2.5 bg-brand-darker hover:bg-slate-800 text-gray-300 rounded-xl border border-brand-border transition"
                        title="Synchronizovat data"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                    {(user.is_admin || user.permissions.remote_opening) && (
                        <div className="w-full sm:w-auto">
                            <SlideToUnlockButton onUnlock={onRemoteOpening} className="sm:w-[220px]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Main KPI Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Active RFID Chips */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aktivní RFID čipy</p>
                        <p className="text-3xl font-black text-white mt-1">{chips.filter(c => c.is_allowed).length} <span className="text-xs text-gray-400 font-normal font-mono">/ {chips.length}</span></p>
                    </div>
                    <div className="p-3 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <UsersIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* Total Inventory Items */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Položky v zásobách</p>
                        <p className="text-3xl font-black text-white mt-1">{inventoryItems.length} <span className="text-xs text-gray-400 font-normal font-mono">položek</span></p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <BoxesIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* Door Service Mode Status */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Servisní režim dveří</p>
                        <p className={`text-sm font-bold mt-1 ${isServiceMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isServiceMode ? 'ODEMČENO (TRVALE)' : 'ZAMČENO (AKTIVNÍ)'}
                        </p>
                    </div>
                    {(user.is_admin || user.permissions.service_mode) && (
                        <button
                            onClick={handleServiceToggle}
                            disabled={isServiceLoading}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                                isServiceMode 
                                    ? 'bg-amber-500 text-black' 
                                    : 'bg-brand-darker text-gray-300 border border-brand-border hover:bg-slate-700'
                            }`}
                        >
                            {isServiceMode ? 'Vypnout' : 'Zapnout'}
                        </button>
                    )}
                </div>
            </div>

            {/* Recent RFID Door Access Logs */}
            {(user.is_admin || user.permissions.view_logs) && (
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <ShieldIcon className="h-4 w-4 text-emerald-400" />
                            Nedávné průchody dveřmi
                        </h3>
                        <button
                            onClick={() => onNavigate('access')}
                            className="text-xs text-brand-teal hover:underline flex items-center gap-1 font-semibold"
                        >
                            Zobrazit vše <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        {recentLogs.length > 0 ? (
                            recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-brand-darker rounded-xl border border-brand-border text-xs">
                                    <div>
                                        <p className="font-bold text-white">{log.name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()} · {log.chip_id}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                        log.result.includes('GRANTED') 
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    }`}>
                                        {log.result}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-4 font-mono">Žádné nedávné průchody.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};