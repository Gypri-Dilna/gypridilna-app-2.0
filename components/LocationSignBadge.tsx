import React from 'react';
import { BoltGlyph } from './BoltGlyph';

interface LocationSignBadgeProps {
    rack: number | string;
    sector: number | string;
    box: number | string;
    itemId?: string;
    className?: string;
    compact?: boolean;
}

export const LocationSignBadge: React.FC<LocationSignBadgeProps> = ({
    rack,
    sector,
    box,
    itemId = '001',
    className = '',
    compact = false
}) => {
    const rVal = String(rack || '1');
    const sVal = String(sector || '1');
    const bVal = String(box ?? '0');
    const idVal = String(itemId || '001').padStart(3, '0');

    if (compact) {
        return (
            <div className={`relative bg-gradient-to-b from-slate-900 via-brand-dark to-slate-950 border-2 border-brand-teal/60 rounded-xl p-3 shadow-xl font-mono ${className}`}>
                {/* Corner Mount Rivets */}
                <div className="absolute top-1.5 left-1.5 opacity-60"><BoltGlyph className="h-2.5 w-2.5 text-brand-teal" /></div>
                <div className="absolute top-1.5 right-1.5 opacity-60"><BoltGlyph className="h-2.5 w-2.5 text-brand-teal" /></div>
                <div className="absolute bottom-1.5 left-1.5 opacity-60"><BoltGlyph className="h-2.5 w-2.5 text-brand-teal" /></div>
                <div className="absolute bottom-1.5 right-1.5 opacity-60"><BoltGlyph className="h-2.5 w-2.5 text-brand-teal" /></div>

                {/* Industrial Header */}
                <div className="text-[9px] font-sans font-black tracking-widest text-center text-gray-400 uppercase mb-1.5 border-b border-brand-border/60 pb-1">
                    <span className="text-white">GYPRI DÍLNA</span> <span className="text-brand-teal">LOKACE</span>
                </div>

                {/* Primary Number Display Plate */}
                <div className="flex items-center justify-center gap-1.5 text-center my-1">
                    <span className="px-2 py-1 bg-brand-teal/20 text-brand-teal border border-brand-teal/40 rounded-lg text-base font-black">
                        {rVal}{sVal}
                    </span>
                    <span className="text-gray-500 font-bold text-lg">-</span>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-base font-black">
                        {bVal}{idVal}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-gradient-to-b from-slate-900 via-brand-dark to-slate-950 border-2 border-brand-teal/60 rounded-2xl p-4 sm:p-5 shadow-2xl font-sans select-none overflow-hidden ${className}`}>
            {/* Corner Mount Rivets */}
            <div className="absolute top-2.5 left-2.5 opacity-70"><BoltGlyph className="h-3 w-3 text-brand-teal" /></div>
            <div className="absolute top-2.5 right-2.5 opacity-70"><BoltGlyph className="h-3 w-3 text-brand-teal" /></div>
            <div className="absolute bottom-2.5 left-2.5 opacity-70"><BoltGlyph className="h-3 w-3 text-brand-teal" /></div>
            <div className="absolute bottom-2.5 right-2.5 opacity-70"><BoltGlyph className="h-3 w-3 text-brand-teal" /></div>

            {/* Industrial Header */}
            <div className="flex items-center justify-between border-b border-brand-border/80 pb-2 mb-3 px-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                    <span className="text-[10px] font-black tracking-widest text-gray-300 uppercase">
                        GYPRI DÍLNA • OZNAČENÍ LOKALITY
                    </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/30">
                    CEDULKA LOKACE
                </span>
            </div>

            {/* Large Bold Physical Signboard Plate */}
            <div className="bg-black/60 border-2 border-brand-teal/40 rounded-xl p-3 sm:p-4 my-2 text-center shadow-inner relative overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-teal/10 rounded-full blur-2xl pointer-events-none" />

                {/* Location Digits Display */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono my-1">
                    {/* X: Rack / Skříň / Lokace */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-sans font-extrabold text-brand-teal uppercase tracking-wider mb-0.5">X</span>
                        <div className="w-10 h-12 sm:w-12 sm:h-14 bg-brand-teal/20 border-2 border-brand-teal text-white text-xl sm:text-2xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-brand-teal/20">
                            {rVal}
                        </div>
                    </div>

                    {/* Y: Police / Sektor */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-sans font-extrabold text-brand-teal uppercase tracking-wider mb-0.5">Y</span>
                        <div className="w-10 h-12 sm:w-12 sm:h-14 bg-brand-teal/20 border-2 border-brand-teal text-white text-xl sm:text-2xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-brand-teal/20">
                            {sVal}
                        </div>
                    </div>

                    <span className="text-gray-500 font-bold text-2xl sm:text-3xl mt-4">-</span>

                    {/* Z: Box / Krabice */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-sans font-extrabold text-amber-400 uppercase tracking-wider mb-0.5">Z</span>
                        <div className="w-10 h-12 sm:w-12 sm:h-14 bg-amber-500/20 border-2 border-amber-500 text-amber-300 text-xl sm:text-2xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            {bVal}
                        </div>
                    </div>

                    {/* AAA: ID Položky */}
                    <div className="flex flex-col items-center">
                        <span className="text-[9px] font-sans font-extrabold text-cyan-300 uppercase tracking-wider mb-0.5">AAA</span>
                        <div className="px-2 sm:px-3 h-12 sm:h-14 bg-slate-900 border-2 border-cyan-400 text-cyan-300 text-lg sm:text-xl font-black rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 tracking-widest">
                            {idVal}
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Guide Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans pt-2 border-t border-brand-border/60 mt-3">
                <div className="flex items-center gap-1.5 bg-brand-darker p-1.5 rounded-lg border border-brand-border/60">
                    <span className="px-1.5 py-0.5 bg-brand-teal text-black font-extrabold rounded font-mono text-[9px]">X</span>
                    <span className="text-gray-200 font-semibold truncate">Rack / Skříň / Lokace</span>
                </div>
                <div className="flex items-center gap-1.5 bg-brand-darker p-1.5 rounded-lg border border-brand-border/60">
                    <span className="px-1.5 py-0.5 bg-brand-teal text-black font-extrabold rounded font-mono text-[9px]">Y</span>
                    <span className="text-gray-200 font-semibold truncate">Police / Sektor</span>
                </div>
                <div className="flex items-center gap-1.5 bg-brand-darker p-1.5 rounded-lg border border-brand-border/60">
                    <span className="px-1.5 py-0.5 bg-amber-500 text-black font-extrabold rounded font-mono text-[9px]">Z</span>
                    <span className="text-gray-200 font-semibold truncate">Box / Krabice (0=bez)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-brand-darker p-1.5 rounded-lg border border-brand-border/60">
                    <span className="px-1.5 py-0.5 bg-cyan-400 text-black font-extrabold rounded font-mono text-[9px]">AAA</span>
                    <span className="text-gray-200 font-semibold truncate">ID Položky</span>
                </div>
            </div>
        </div>
    );
};
