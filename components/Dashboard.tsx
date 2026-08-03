import React, { useState, useEffect, useCallback } from 'react';
import { User, Chip, AccessLog, InventoryItem } from '../types';
import { 
    RefreshIcon, RemoteIcon, WarningIcon, 
    UsersIcon, ShieldIcon, 
    ArrowUpRight, BoxesIcon
} from './icons';
import { WorkshopMinimap } from './WorkshopMinimap';

interface DashboardProps {
    user: User;
    chips: Chip[];
    logs: AccessLog[];
    inventoryItems: InventoryItem[];
    onRemoteOpening: () => Promise<void>;
    onToggleServiceMode: (enabled: boolean) => Promise<void>;
    onRefresh: () => void;
    onNavigate: (tab: 'dashboard' | 'access' | 'inventory' | 'minimap' | 'scanner' | 'webconnect' | 'users') => void;
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

    const lowStockItems = inventoryItems.filter(i => i.quantity <= i.min_quantity);
    const recentLogs = logs.slice(0, 5);

    return (
        <div className="space-y-6 font-sans">
            {/* Top Banner & Quick Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-brand-dark border border-brand-border p-6 rounded-2xl">
                <div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        Gypri Dílna Overview
                    </h1>
                    <p className="text-xs text-gray-300 mt-1">RFID Door Access & Inventory Management</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onRefresh}
                        className="p-2.5 bg-brand-darker hover:bg-slate-800 text-gray-300 rounded-xl border border-brand-border transition"
                        title="Sync Data"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                    {(user.is_admin || user.permissions.remote_opening) && (
                        <button
                            onClick={onRemoteOpening}
                            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold text-xs rounded-xl transition"
                        >
                            <RemoteIcon className="h-4 w-4" />
                            Remote Door Unlock
                        </button>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Active RFID Chips */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active RFID Chips</p>
                        <p className="text-3xl font-black text-white mt-1">{chips.filter(c => c.is_allowed).length} <span className="text-xs text-gray-400 font-normal font-mono">/ {chips.length}</span></p>
                    </div>
                    <div className="p-3 bg-brand-teal/10 text-brand-teal rounded-xl">
                        <UsersIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* Total Inventory SKUs */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inventory Items</p>
                        <p className="text-3xl font-black text-white mt-1">{inventoryItems.length} <span className="text-xs text-gray-400 font-normal font-mono">SKUs</span></p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                        <BoxesIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Low Stock Alerts</p>
                        <p className={`text-3xl font-black mt-1 ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {lowStockItems.length}
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${lowStockItems.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        <WarningIcon className="h-6 w-6" />
                    </div>
                </div>

                {/* Door Service Mode Status */}
                <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Door Service Mode</p>
                        <p className={`text-sm font-bold mt-1 ${isServiceMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {isServiceMode ? 'UNLOCKED (OPEN)' : 'LOCKED (ACTIVE)'}
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
                            {isServiceMode ? 'Disable' : 'Enable'}
                        </button>
                    )}
                </div>
            </div>

            {/* Layout: Minimap & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Minimap Preview Widget */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between bg-brand-dark border border-brand-border px-5 py-3 rounded-2xl">
                        <h3 className="font-bold text-white text-sm">
                            Workshop Floorplan Overview
                        </h3>
                        <button
                            onClick={() => onNavigate('minimap')}
                            className="text-xs text-brand-teal hover:underline flex items-center gap-1 font-semibold"
                        >
                            Full Floorplan <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <WorkshopMinimap 
                        items={inventoryItems}
                        readOnly={true}
                    />
                </div>

                {/* Recent Access & Inventory Alerts */}
                <div className="space-y-6">
                    {/* Low Stock Box */}
                    {lowStockItems.length > 0 && (
                        <div className="bg-brand-dark border border-amber-500/40 p-5 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between text-amber-400">
                                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <WarningIcon className="h-4 w-4" /> Stock Alert
                                </span>
                                <span className="text-xs font-mono bg-amber-500/20 px-2 py-0.5 rounded font-bold">
                                    {lowStockItems.length} Items
                                </span>
                            </div>
                            <div className="space-y-2">
                                {lowStockItems.slice(0, 4).map((item) => (
                                    <div key={item.id} className="flex justify-between items-center bg-brand-darker p-2.5 rounded-xl border border-brand-border text-xs">
                                        <div>
                                            <p className="font-bold text-white leading-tight">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{item.location_code} ({item.zone})</p>
                                        </div>
                                        <span className="text-rose-400 font-bold font-mono">
                                            {item.quantity} {item.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => onNavigate('inventory')}
                                className="w-full text-center text-xs font-bold text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 py-2 rounded-xl border border-brand-teal/30 transition"
                            >
                                Open Inventory →
                            </button>
                        </div>
                    )}

                    {/* Recent RFID Door Access Logs */}
                    {(user.is_admin || user.permissions.view_logs) && (
                        <div className="bg-brand-dark border border-brand-border p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                    <ShieldIcon className="h-4 w-4 text-emerald-400" />
                                    Recent Door Access Logs
                                </h3>
                                <button
                                    onClick={() => onNavigate('access')}
                                    className="text-xs text-brand-teal hover:underline flex items-center gap-1 font-semibold"
                                >
                                    View All <ArrowUpRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {recentLogs.length > 0 ? (
                                    recentLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between p-2.5 bg-brand-darker rounded-xl border border-brand-border text-xs">
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
                                    <p className="text-xs text-gray-400 text-center py-4 font-mono">No recent door access logged.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};