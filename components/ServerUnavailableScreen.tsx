import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { RefreshIcon } from './icons';

interface ServerUnavailableScreenProps {
    onRetry: () => Promise<boolean>;
}

export const ServerUnavailableScreen: React.FC<ServerUnavailableScreenProps> = ({ onRetry }) => {
    const [isChecking, setIsChecking] = useState(false);

    const handleManualRetry = async () => {
        if (isChecking) return;
        setIsChecking(true);
        try {
            await onRetry();
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] w-screen h-[100dvh] bg-[#101215] flex flex-col items-center justify-center p-6 text-center select-none font-sans overflow-hidden">
            <div className="flex flex-col items-center max-w-sm w-full">
                {/* Official Brand Logo */}
                <div className="p-4 bg-brand-dark rounded-2xl border border-brand-border/60 shadow-xl mb-6">
                    <Logo variant="light" className="h-14 w-auto" />
                </div>

                <h1 className="text-2xl font-black text-white tracking-tight">
                    Server je nedostupný
                </h1>
                
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Aplikace se nemůže spojit s centrálním serverem dílny. Spojení je automaticky a průběžně ověřováno.
                </p>

                {/* Status Indicator */}
                <div className="flex items-center gap-2 mt-6 px-4 py-2 bg-brand-dark/80 border border-brand-border/40 rounded-full text-brand-teal text-xs font-mono">
                    <RefreshIcon className="h-3.5 w-3.5 animate-spin" />
                    <span>Zjišťuji dostupnost...</span>
                </div>

                {/* Manual Retry Button */}
                <button
                    type="button"
                    onClick={handleManualRetry}
                    disabled={isChecking}
                    className="mt-8 px-6 py-2.5 bg-brand-dark hover:bg-slate-800 text-gray-200 border border-brand-border rounded-xl text-xs font-bold transition active:scale-95 disabled:opacity-50"
                >
                    {isChecking ? 'Ověřuji...' : 'Zkusit znovu'}
                </button>
            </div>
        </div>
    );
};
