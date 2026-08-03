import React, { useState } from 'react';
import { MapPin, Edit3, Check, Plus, Map } from 'lucide-react';
import { MapZone } from '../types';
import { mapService } from '../services/api';

interface WorkshopMinimapProps {
  zones: MapZone[];
  selectedRack?: number;
  onRackSelect?: (rack: number) => void;
  onRefreshZones?: () => void;
}

export const WorkshopMinimap: React.FC<WorkshopMinimapProps> = ({
  zones,
  selectedRack,
  onRackSelect,
  onRefreshZones,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form for adding a new rack
  const [newCode, setNewCode] = useState('');
  const [newRackNum, setNewRackNum] = useState<number>(3);
  const [newName, setNewName] = useState('');

  const handleDragEnd = async (zone: MapZone, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const newX = Math.max(0, Math.min(500, e.clientX - rect.left - zone.width / 2));
    const newY = Math.max(0, Math.min(320, e.clientY - rect.top - zone.height / 2));

    try {
      await mapService.updateZone(zone.id, {
        grid_x: Math.round(newX),
        grid_y: Math.round(newY),
      });
      onRefreshZones?.();
    } catch (err) {
      console.error('Failed to update zone position:', err);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName || !newRackNum) return;
    try {
      await mapService.createZone({
        zone_code: newCode,
        rack_number: newRackNum,
        display_name: newName,
        grid_x: 100,
        grid_y: 100,
        width: 120,
        height: 80,
        color_hex: '#3AA69A',
      });
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      onRefreshZones?.();
    } catch (err) {
      alert('Failed to add rack: ' + err);
    }
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden shadow-lg">
      {/* Header Bar */}
      <div className="bg-brand-dark px-4 py-3 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Map className="w-5 h-5 text-brand-mint" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-brand-paper">
            WORKSHOP 2D MINIMAP FLOORPLAN
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {isEditMode && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1 text-xs bg-brand-mint/20 text-brand-mintLight border border-brand-mint/50 px-2.5 py-1 rounded-md hover:bg-brand-mint/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Rack</span>
            </button>
          )}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-1.5 text-xs px-3 py-1 rounded-md font-semibold transition-colors ${
              isEditMode
                ? 'bg-brand-granted text-brand-dark font-bold'
                : 'bg-brand-surface text-brand-mint border border-brand-mint/40 hover:bg-brand-mint/10'
            }`}
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit 2D Grid</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2D Canvas Container */}
      <div className="relative w-full h-[380px] bg-[#1E232A] p-4 overflow-hidden select-none">
        {/* Grid Background Pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#3AA69A 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Render Racks & Zones */}
        <div className="relative w-full h-full">
          {zones.map((zone) => {
            const isSelected = selectedRack === zone.rack_number;
            return (
              <div
                key={zone.id}
                onClick={() => !isEditMode && onRackSelect?.(zone.rack_number)}
                onMouseUp={(e) => handleDragEnd(zone, e)}
                style={{
                  left: `${zone.grid_x}px`,
                  top: `${zone.grid_y}px`,
                  width: `${zone.width}px`,
                  height: `${zone.height}px`,
                }}
                className={`absolute rounded-lg p-2 transition-all flex flex-col justify-center items-center text-center cursor-pointer border ${
                  isSelected
                    ? 'bg-brand-mint/35 border-brand-mintLight shadow-lg shadow-brand-mint/30 ring-2 ring-brand-mintLight scale-105'
                    : isEditMode
                    ? 'bg-brand-surface/80 border-brand-warning border-dashed hover:scale-105'
                    : 'bg-brand-surface/60 border-brand-border hover:border-brand-mint/60 hover:bg-brand-surface'
                }`}
              >
                <span
                  className={`font-bold text-xs ${
                    isSelected ? 'text-brand-paper font-black' : 'text-brand-mint'
                  }`}
                >
                  {zone.zone_code}
                </span>
                <span className="text-[10px] text-brand-paperMuted truncate max-w-full leading-tight mt-0.5">
                  {zone.display_name}
                </span>

                {/* Animated Pulsing Location Pin */}
                {isSelected && (
                  <div className="absolute -top-3 -right-3 w-7 h-7 bg-brand-mint rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <MapPin className="w-4 h-4 text-brand-dark" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Rack Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-brand-paper mb-4 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-brand-mint" />
              <span>Add New Rack to Workshop Map</span>
            </h3>
            <form onSubmit={handleAddZone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Zone Code (e.g. RACK-3) *
                </label>
                <input
                  type="text"
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Rack Number (X) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="9"
                  value={newRackNum}
                  onChange={(e) => setNewRackNum(parseInt(e.target.value) || 1)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-paperMuted mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-paper focus:outline-none focus:border-brand-mint"
                />
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
                  Add to 2D Map
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
