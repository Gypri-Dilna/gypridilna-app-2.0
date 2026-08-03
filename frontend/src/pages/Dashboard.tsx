import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Lock,
  Printer,
  QrCode,
  ShieldCheck,
  Activity,
  Key,
} from 'lucide-react';
import { TabType } from '../components/Sidebar';
import { hardwareService, inventoryService, logService, chipService } from '../services/api';
import { AuditLog } from '../types';

interface DashboardProps {
  onNavigate: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalChips, setTotalChips] = useState<number>(0);
  const [isServiceMode, setIsServiceMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [unlocking, setUnlocking] = useState<boolean>(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const items = await inventoryService.list();
      setTotalItems(items.length);
      const chips = await chipService.list();
      setTotalChips(chips.length);
      const serviceMode = await hardwareService.getServiceModeStatus();
      setIsServiceMode(serviceMode);
      const recentLogs = await logService.getLogs(6);
      setLogs(recentLogs);
    } catch (e) {
      console.error('Failed to fetch dashboard metrics:', e);
    }
  };

  const handleRemoteUnlock = async () => {
    setUnlocking(true);
    try {
      await hardwareService.unlockDoor();
      alert('Remote unlock request sent to ESP32 door reader!');
    } catch (e) {
      alert('Unlock failed: ' + e);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-full">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-black text-brand-paper tracking-wider">
          WORKSHOP DASHBOARD OVERVIEW
        </h2>
        <p className="text-xs text-brand-paperMuted mt-1">
          Real-time metrics, quick hardware actions, and security audit trail
        </p>
      </div>

      {/* Metrics & Door Status Hero Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 bg-brand-mint/20 rounded-xl flex items-center justify-center">
            <Boxes className="w-6 h-6 text-brand-mintLight" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-paperMuted uppercase">Total Inventory</p>
            <p className="text-2xl font-black text-brand-paper">{totalItems} Items</p>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 bg-brand-mint/20 rounded-xl flex items-center justify-center">
            <Key className="w-6 h-6 text-brand-mintLight" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-paperMuted uppercase">Registered Badges</p>
            <p className="text-2xl font-black text-brand-paper">{totalChips} RFID Chips</p>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl flex items-center space-x-4 shadow-lg">
          <div className="w-12 h-12 bg-brand-mint/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-brand-mintLight" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-paperMuted uppercase">Door System State</p>
            <p className={`text-lg font-black ${isServiceMode ? 'text-brand-warning' : 'text-brand-granted'}`}>
              {isServiceMode ? 'SERVICE MODE' : 'LOCKED (RFID ACTIVE)'}
            </p>
          </div>
        </div>

        <div className="bg-brand-surface border border-brand-border p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-brand-paperMuted uppercase">ESP32 Manual Pass</p>
            <button
              onClick={handleRemoteUnlock}
              disabled={unlocking}
              className="mt-2 text-xs font-bold bg-brand-mint text-brand-dark px-4 py-2 rounded-xl hover:bg-brand-mintLight transition-colors shadow-md disabled:opacity-50"
            >
              {unlocking ? 'Unlocking...' : 'Unlock Door'}
            </button>
          </div>
          <Lock className="w-8 h-8 text-brand-mint/40" />
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => onNavigate('inventory')}
          className="bg-brand-surface border border-brand-border hover:border-brand-mint p-6 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-mint/20 transition-colors">
            <Boxes className="w-5 h-5 text-brand-mint" />
          </div>
          <h3 className="font-bold text-base text-brand-paper group-hover:text-brand-mintLight transition-colors">
            INVENTORY CATALOG
          </h3>
          <p className="text-xs text-brand-paperMuted mt-1">
            Browse and manage workshop items using location scheme XY-ZAAA
          </p>
        </button>

        <button
          onClick={() => onNavigate('onboard')}
          className="bg-brand-surface border border-brand-border hover:border-brand-mint p-6 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-mint/20 transition-colors">
            <Printer className="w-5 h-5 text-brand-mint" />
          </div>
          <h3 className="font-bold text-base text-brand-paper group-hover:text-brand-mintLight transition-colors">
            ITEM ONBOARDING
          </h3>
          <p className="text-xs text-brand-paperMuted mt-1">
            3-step wizard with 18mm Brother label preview & webcam photo capture
          </p>
        </button>

        <button
          onClick={() => onNavigate('scanner')}
          className="bg-brand-surface border border-brand-border hover:border-brand-mint p-6 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 shadow-lg group"
        >
          <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-mint/20 transition-colors">
            <QrCode className="w-5 h-5 text-brand-mint" />
          </div>
          <h3 className="font-bold text-base text-brand-paper group-hover:text-brand-mintLight transition-colors">
            MOBILE QR SCANNER
          </h3>
          <p className="text-xs text-brand-paperMuted mt-1">
            Browser camera scanner with instant item detail page lookup
          </p>
        </button>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-brand-mint" />
            <h3 className="font-bold text-sm text-brand-paper uppercase tracking-wider">
              RECENT ACCESS & SECURITY AUDIT LOGS
            </h3>
          </div>
          <button
            onClick={fetchMetrics}
            className="text-xs text-brand-mint hover:underline font-semibold"
          >
            Refresh
          </button>
        </div>

        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-xs text-brand-paperMuted py-4 text-center">No recent audit logs</p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-brand-dark/50 border border-brand-border/60 p-3 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-brand-granted" />
                  <span className="font-bold text-brand-paper">{log.event_type}</span>
                  <span className="text-brand-paperMuted">by {log.actor_name}</span>
                </div>
                <span className="text-[11px] text-brand-paperMuted font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
