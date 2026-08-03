import React, { useEffect, useState } from 'react';
import { Lock, Unlock, ShieldAlert, Plus, Radio, Wifi } from 'lucide-react';
import { hardwareService, chipService } from '../services/api';
import { RfidChip } from '../types';

export const AccessControl: React.FC = () => {
  const [chips, setChips] = useState<RfidChip[]>([]);
  const [isServiceMode, setIsServiceMode] = useState<boolean>(false);
  const [unlocking, setUnlocking] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [newChipId, setNewChipId] = useState('');
  const [newName, setNewName] = useState('');
  const [isOneTime, setIsOneTime] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedChips = await chipService.list();
      setChips(fetchedChips);
      const serviceMode = await hardwareService.getServiceModeStatus();
      setIsServiceMode(serviceMode);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoteUnlock = async () => {
    setUnlocking(true);
    try {
      await hardwareService.unlockDoor();
      alert('Remote door unlock pulse sent to ESP32!');
    } catch (e) {
      alert('Unlock failed: ' + e);
    } finally {
      setUnlocking(false);
    }
  };

  const handleToggleServiceMode = async (enabled: boolean) => {
    try {
      await hardwareService.setServiceMode(enabled);
      setIsServiceMode(enabled);
    } catch (e) {
      alert('Failed to toggle service mode: ' + e);
    }
  };

  // Learn Mode auto-polling when modal is open
  useEffect(() => {
    if (!showAddModal) return;
    const interval = setInterval(async () => {
      try {
        const lastUnknown = await hardwareService.getLastUnknownChip();
        if (lastUnknown && lastUnknown.trim()) {
          setNewChipId(lastUnknown);
        }
      } catch (e) {
        // Silent
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showAddModal]);

  const handleRegisterChip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChipId || !newName) return;
    try {
      await chipService.create({
        chip_id: newChipId.trim(),
        name: newName.trim(),
        is_allowed: true,
        is_one_time: isOneTime,
      });
      setShowAddModal(false);
      setNewChipId('');
      setNewName('');
      setIsOneTime(false);
      fetchData();
    } catch (e) {
      alert('Error registering chip: ' + e);
    }
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-full">
      <div>
        <h2 className="text-2xl font-black text-brand-paper tracking-wider">
          RFID ACCESS CONTROL SYSTEM
        </h2>
        <p className="text-xs text-brand-paperMuted mt-1">
          Direct hardware interface for ESP32 RFID door locks & chip permissions
        </p>
      </div>

      {/* Door Status Card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
              isServiceMode ? 'bg-brand-warning/20 border border-brand-warning/40' : 'bg-brand-granted/20 border border-brand-granted/40'
            }`}>
              {isServiceMode ? <ShieldAlert className="w-7 h-7 text-brand-warning" /> : <Lock className="w-7 h-7 text-brand-granted" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-brand-paper uppercase">
                DOOR CONTROL SYSTEM
              </h3>
              <p className="text-xs text-brand-paperMuted">
                {isServiceMode ? 'Service Mode Enabled (Doors Permanently Unlocked)' : 'Locked & Secured via ESP32 RFID Reader'}
              </p>
            </div>
          </div>

          {/* Service Mode Toggle Switch */}
          <div className="flex items-center space-x-3 bg-brand-dark px-4 py-2 rounded-xl border border-brand-border">
            <span className="text-xs font-bold text-brand-paperMuted">Service Mode</span>
            <input
              type="checkbox"
              checked={isServiceMode}
              onChange={(e) => handleToggleServiceMode(e.target.checked)}
              className="w-5 h-5 accent-brand-mint cursor-pointer"
            />
          </div>
        </div>

        {/* Remote Unlock Trigger */}
        <button
          onClick={handleRemoteUnlock}
          disabled={unlocking}
          className="w-full py-4 bg-brand-mint text-brand-dark font-black rounded-xl text-sm tracking-wider uppercase hover:bg-brand-mintLight transition-all duration-200 shadow-lg shadow-brand-mint/20 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Unlock className="w-5 h-5" />
          <span>{unlocking ? 'Sending Unlock Command...' : 'REMOTE UNLOCK DOOR'}</span>
        </button>
      </div>

      {/* RFID Chips Management */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-brand-mint" />
            <h3 className="font-bold text-sm text-brand-paper uppercase tracking-wider">
              REGISTERED RFID BADGES & CHIPS
            </h3>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-brand-mint text-brand-dark font-bold text-xs px-4 py-2 rounded-xl hover:bg-brand-mintLight transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Chip</span>
          </button>
        </div>

        {loading ? (
          <p className="text-xs text-brand-paperMuted py-6 text-center">Loading registered chips...</p>
        ) : (
          <div className="space-y-2">
            {chips.map((chip) => (
              <div
                key={chip.id}
                className="bg-brand-dark/50 border border-brand-border/60 p-4 rounded-xl flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${chip.is_allowed ? 'bg-brand-granted' : 'bg-brand-denied'}`} />
                  <div>
                    <p className="font-bold text-brand-paper">{chip.name}</p>
                    <p className="text-[11px] text-brand-paperMuted font-mono">
                      Chip ID: {chip.chip_id} {chip.is_one_time && '• One-Time Pass'}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                    chip.is_allowed
                      ? 'bg-brand-granted/15 text-brand-granted border-brand-granted/40'
                      : 'bg-brand-denied/15 text-brand-denied border-brand-denied/40'
                  }`}
                >
                  {chip.is_allowed ? 'ALLOWED' : 'BLOCKED'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Learn Mode Register Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-brand-paper mb-4 flex items-center space-x-2">
              <Radio className="w-5 h-5 text-brand-mint" />
              <span>Register New RFID Badge</span>
            </h3>

            <div className="bg-brand-mint/10 border border-brand-mint/40 p-3 rounded-xl mb-4 flex items-center space-x-3">
              <Wifi className="w-5 h-5 text-brand-mintLight animate-pulse shrink-0" />
              <p className="text-xs text-brand-mintLight font-medium">
                Learn Mode Active: Scan an unregistered chip at the door reader to auto-fill.
              </p>
            </div>

            <form onSubmit={handleRegisterChip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Chip ID (Hex) *
                </label>
                <input
                  type="text"
                  required
                  value={newChipId}
                  onChange={(e) => setNewChipId(e.target.value)}
                  placeholder="e.g. 1A2B3C4D"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Holder Name / Description *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jan Novák"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="onetime"
                  checked={isOneTime}
                  onChange={(e) => setIsOneTime(e.target.checked)}
                  className="w-4 h-4 accent-brand-mint cursor-pointer"
                />
                <label htmlFor="onetime" className="text-xs text-brand-paper font-semibold cursor-pointer">
                  One-Time Visitor Pass
                </label>
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
                  Register Chip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
