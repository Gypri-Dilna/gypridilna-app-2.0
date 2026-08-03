import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, MapZone } from '../types';
import { MapPinIcon, TargetIcon, PlusIcon, RefreshIcon, FilterIcon, TagIcon } from './icons';

interface WorkshopMinimapProps {
    items: InventoryItem[];
    zones?: MapZone[];
    selectedItemId?: number | null;
    onSelectItem?: (item: InventoryItem) => void;
    onUpdateItemCoordinates?: (itemId: number, x: number, y: number, zoneName: string) => void;
    readOnly?: boolean;
}

const DEFAULT_ZONES: MapZone[] = [
    { id: 1, name: "Zone A: CNC & Woodworking", code: "ZONE_A", color: "#00F0FF", x: 5, y: 10, width: 42, height: 38, description: "CNC routers, Table saws, Sanders" },
    { id: 2, name: "Zone B: Metal & Welding Lab", code: "ZONE_B", color: "#F59E0B", x: 52, y: 10, width: 43, height: 38, description: "Welders, Plasma cutter, Drill press" },
    { id: 3, name: "Zone C: Electronics Bench", code: "ZONE_C", color: "#10B981", x: 5, y: 54, width: 42, height: 38, description: "Soldering, Oscilloscopes, RFID" },
    { id: 4, name: "Zone D: 3D Printing Lab", code: "ZONE_D", color: "#EC4899", x: 52, y: 54, width: 26, height: 38, description: "Prusa & Bambu 3D printers" },
    { id: 5, name: "Zone E: Entrance Gate", code: "ZONE_E", color: "#8B5CF6", x: 80, y: 54, width: 15, height: 38, description: "RFID Door & Check-in" }
];

export const WorkshopMinimap: React.FC<WorkshopMinimapProps> = ({
    items,
    zones = DEFAULT_ZONES,
    selectedItemId,
    onSelectItem,
    onUpdateItemCoordinates,
    readOnly = false
}) => {
    const [activeZoneFilter, setActiveZoneFilter] = useState<string>("ALL");
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);

    const activeZones = zones.length > 0 ? zones : DEFAULT_ZONES;

    useEffect(() => {
        if (selectedItemId) {
            const found = items.find(i => i.id === selectedItemId);
            if (found) {
                setEditingItem(found);
            }
        }
    }, [selectedItemId, items]);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isEditMode || !editingItem || !mapRef.current || !onUpdateItemCoordinates) return;

        const rect = mapRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const posX = Math.max(2, Math.min(98, (clickX / rect.width) * 100));
        const posY = Math.max(2, Math.min(98, (clickY / rect.height) * 100));

        // Determine zone based on coordinates
        let detectedZone = editingItem.zone;
        const matchedZone = activeZones.find(z => 
            posX >= z.x && posX <= (z.x + z.width) &&
            posY >= z.y && posY <= (z.y + z.height)
        );
        if (matchedZone) {
            detectedZone = matchedZone.name;
        }

        onUpdateItemCoordinates(editingItem.id, parseFloat(posX.toFixed(1)), parseFloat(posY.toFixed(1)), detectedZone);
        setIsEditMode(false);
    };

    const filteredItems = activeZoneFilter === "ALL" 
        ? items 
        : items.filter(i => i.zone.toLowerCase().includes(activeZoneFilter.toLowerCase()));

    return (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 shadow-xl space-y-4">
            {/* Minimap Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-border">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-cyan-500/10 text-brand-cyan rounded-lg">
                        <TargetIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base">Interactive Workshop Minimap</h3>
                        <p className="text-xs text-gray-400">Gypri Dílna 2D Floorplan & Spatial Item Tracker</p>
                    </div>
                </div>

                {/* Zone Filter & Coordinates Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={activeZoneFilter}
                        onChange={(e) => setActiveZoneFilter(e.target.value)}
                        className="bg-slate-900 border border-brand-border text-gray-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-cyan"
                    >
                        <option value="ALL">All Workshop Zones</option>
                        {activeZones.map(z => (
                            <option key={z.id} value={z.code}>{z.name}</option>
                        ))}
                    </select>

                    {!readOnly && onUpdateItemCoordinates && (
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`px-3 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 ${
                                isEditMode 
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 animate-pulse' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-gray-200'
                            }`}
                        >
                            <MapPinIcon className="h-3.5 w-3.5" />
                            {isEditMode ? 'Click Map to Set Pin' : 'Relocate Item Pin'}
                        </button>
                    )}
                </div>
            </div>

            {/* Minimap Canvas Container */}
            <div className="relative">
                <div
                    ref={mapRef}
                    onClick={handleMapClick}
                    className={`relative w-full h-[400px] sm:h-[480px] bg-slate-950 border-2 border-brand-border rounded-xl overflow-hidden select-none ${
                        isEditMode ? 'cursor-crosshair ring-2 ring-amber-500/50' : 'cursor-default'
                    }`}
                >
                    {/* Grid Overlay */}
                    <div 
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                            backgroundImage: `radial-gradient(#00F0FF 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}
                    />

                    {/* Render Workshop Zones */}
                    {activeZones.map((z) => (
                        <div
                            key={z.id}
                            style={{
                                left: `${z.x}%`,
                                top: `${z.y}%`,
                                width: `${z.width}%`,
                                height: `${z.height}%`,
                                borderColor: z.color
                            }}
                            className="absolute border-2 border-dashed bg-slate-900/40 rounded-xl p-3 flex flex-col justify-between pointer-events-none transition hover:bg-slate-900/60"
                        >
                            <div className="flex items-center justify-between">
                                <span 
                                    style={{ color: z.color, backgroundColor: `${z.color}15` }}
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-current"
                                >
                                    {z.name}
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-gray-500 truncate">{z.description}</span>
                        </div>
                    ))}

                    {/* Render Item Pins */}
                    {filteredItems.map((item) => {
                        const isSelected = selectedItemId === item.id || editingItem?.id === item.id;
                        return (
                            <div
                                key={item.id}
                                style={{
                                    left: `${item.location_x || 50}%`,
                                    top: `${item.location_y || 50}%`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem(item);
                                    if (onSelectItem) onSelectItem(item);
                                }}
                                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                            >
                                {/* Marker Dot / Pulse */}
                                <div className="relative">
                                    {isSelected && (
                                        <div className="absolute -inset-2 bg-brand-cyan/40 rounded-full animate-ping pointer-events-none" />
                                    )}
                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all transform group-hover:scale-125 shadow-lg ${
                                        isSelected 
                                            ? 'bg-brand-cyan border-white text-black font-black z-30 scale-125 shadow-cyan-500/50' 
                                            : item.quantity <= item.min_quantity 
                                                ? 'bg-rose-500 border-white text-white' 
                                                : 'bg-slate-900 border-cyan-400 text-cyan-300 hover:bg-cyan-500 hover:text-black'
                                    }`}>
                                        <MapPinIcon className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Tooltip on Hover / Selection */}
                                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-2.5 bg-slate-900/95 border border-brand-border rounded-xl shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-200 z-40 ${
                                    isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
                                }`}>
                                    <p className="text-xs font-bold text-white leading-tight truncate">{item.title}</p>
                                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-mono">
                                        <span className="text-amber-400 font-bold">{item.location_code}</span>
                                        <span className={item.quantity <= item.min_quantity ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                            Qty: {item.quantity} {item.unit}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Edit Mode Instruction Banner */}
                    {isEditMode && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-bounce">
                            <MapPinIcon className="h-4 w-4" />
                            Click anywhere on the map to set pin for "{editingItem?.title || 'Selected Item'}"
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Item Legend */}
            {editingItem && (
                <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-brand-border text-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 text-brand-cyan rounded-lg">
                            <TagIcon className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="font-bold text-white">{editingItem.title}</span>
                            <span className="ml-2 font-mono text-gray-400">({editingItem.location_code})</span>
                        </div>
                    </div>
                    <div className="font-mono text-cyan-400 text-xs">
                        Coords: X: {editingItem.location_x}%, Y: {editingItem.location_y}%
                    </div>
                </div>
            )}
        </div>
    );
};
