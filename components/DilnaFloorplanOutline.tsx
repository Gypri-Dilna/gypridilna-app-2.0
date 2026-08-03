import React from 'react';
import { parseLocationCode, getRackCoordinates } from '../locationParser';
import { MapPinIcon } from './icons';

interface DilnaFloorplanOutlineProps {
    locationCode: string;
    itemTitle?: string;
    className?: string;
}

export const DilnaFloorplanOutline: React.FC<DilnaFloorplanOutlineProps> = ({
    locationCode,
    itemTitle,
    className = "h-[320px] w-full"
}) => {
    const parsed = parseLocationCode(locationCode);
    const rackNum = parsed ? parsed.rack : 1;
    const coords = getRackCoordinates(rackNum);

    const RACK_LABELS = [
        { num: 1, label: "Rack 1 (Woodworking)", x: 20, y: 15 },
        { num: 2, label: "Rack 2 (Storage Center)", x: 45, y: 15 },
        { num: 3, label: "Rack 3 (Metal Lab)", x: 75, y: 15 },
        { num: 4, label: "Rack 4 (Electronics)", x: 20, y: 85 },
        { num: 5, label: "Rack 5 (3D Print)", x: 55, y: 85 },
        { num: 6, label: "Door (Entrance)", x: 82, y: 85 }
    ];

    return (
        <div className={`relative bg-brand-darker border border-brand-border rounded-xl p-4 font-sans select-none overflow-hidden ${className}`}>
            {/* Header info */}
            <div className="flex items-center justify-between mb-3 border-b border-brand-border/60 pb-2">
                <span className="text-xs font-bold text-gray-300">Dílna Wall & Rack Outline</span>
                <span className="text-xs font-mono font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/30">
                    {locationCode || '11-0001'}
                </span>
            </div>

            {/* SVG Outline Container */}
            <div className="relative w-full h-[220px] bg-brand-bg border-2 border-brand-border rounded-lg p-2">
                {/* Outer Wall Boundary Outline */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    {/* Perimeter Wall Outline */}
                    <rect x="3%" y="5%" width="94%" height="90%" fill="none" stroke="#39414d" strokeWidth="2" strokeDasharray="4 4" rx="8" />
                    
                    {/* Interior Rack Section Dividers */}
                    <line x1="33%" y1="5%" x2="33%" y2="40%" stroke="#39414d" strokeWidth="1.5" strokeDasharray="2 2" />
                    <line x1="66%" y1="5%" x2="66%" y2="40%" stroke="#39414d" strokeWidth="1.5" strokeDasharray="2 2" />
                    <line x1="38%" y1="60%" x2="38%" y2="95%" stroke="#39414d" strokeWidth="1.5" strokeDasharray="2 2" />
                    <line x1="72%" y1="60%" x2="72%" y2="95%" stroke="#39414d" strokeWidth="1.5" strokeDasharray="2 2" />

                    {/* Entrance Door Symbol */}
                    <path d="M 80% 95% L 90% 95%" stroke="#3aa398" strokeWidth="4" strokeLinecap="round" />
                </svg>

                {/* Rack Sector Labels */}
                {RACK_LABELS.map(r => (
                    <div
                        key={r.num}
                        style={{ left: `${r.x}%`, top: `${r.y}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border transition ${
                            rackNum === r.num 
                                ? 'bg-brand-teal text-black border-white z-10' 
                                : 'bg-brand-dark text-gray-400 border-brand-border/60'
                        }`}
                    >
                        #{r.num} {r.label}
                    </div>
                ))}

                {/* Item Position Pin */}
                <div
                    style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
                >
                    <div className="h-6 w-6 rounded-full bg-brand-teal text-black flex items-center justify-center font-bold border-2 border-white shadow-lg animate-bounce">
                        <MapPinIcon className="h-3.5 w-3.5" />
                    </div>
                    {itemTitle && (
                        <div className="mt-1 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded border border-brand-teal shadow truncate max-w-[140px]">
                            {itemTitle}
                        </div>
                    )}
                </div>
            </div>

            {/* Parsed Legend Footer */}
            {parsed && (
                <div className="mt-3 text-[11px] font-mono text-gray-300 flex flex-wrap justify-between gap-2 border-t border-brand-border/60 pt-2">
                    <span>Rack: <strong className="text-brand-teal">#{parsed.rack}</strong></span>
                    <span>Sector/Shelf: <strong className="text-amber-400">#{parsed.sector}</strong></span>
                    <span>Box: <strong className="text-cyan-300">{parsed.box === 0 ? '0 (None)' : `#${parsed.box}`}</strong></span>
                    <span>Item ID: <strong className="text-emerald-400">#{parsed.itemId}</strong></span>
                </div>
            )}
        </div>
    );
};
