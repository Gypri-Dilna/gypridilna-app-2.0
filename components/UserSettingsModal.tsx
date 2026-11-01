import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon, SuccessIcon } from './icons';
import { 
    isNativeMobileApp, 
    isWebNfcSupported, 
    getServerUrl, 
    setServerUrl, 
    isNfcUnlockEnabled, 
    setNfcUnlockEnabled,
    triggerHaptic 
} from '../mobile';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
    isOpen,
    onClose,
    showToast
}) => {
    const [serverUrl, setLocalServerUrl] = useState(getServerUrl());
    const [nfcEnabled, setLocalNfcEnabled] = useState(isNfcUnlockEnabled());
    const [isTesting, setIsTesting] = useState(false);

    if (!isOpen) return null;

    const handleSave = () => {
        setServerUrl(serverUrl);
        setNfcUnlockEnabled(nfcEnabled);
        triggerHaptic('success');
        showToast('Nastavení aplikace bylo uloženo.', 'success');
        onClose();
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        triggerHaptic('heavy');
        try {
            let base = serverUrl.trim();
            if (base.endsWith('/')) base = base.slice(0, -1);
            const testUrl = base ? `${base}/api/config` : '/api/config';
            
            const res = await fetch(testUrl, { cache: 'no-cache' });
            if (res.ok) {
                showToast('Spojení se serverem dílny je v pořádku!', 'success');
                triggerHaptic('success');
            } else {
                showToast(`Server odpověděl s chybou: ${res.status}`, 'error');
                triggerHaptic('error');
            }
        } catch (e: any) {
            showToast(`Nelze se připojit k serveru: ${e.message}`, 'error');
            triggerHaptic('error');
        } finally {
            setIsTesting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-backdrop-fade font-sans select-none">
            <div className="bg-brand-dark border border-brand-teal/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-modal-pop">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-brand-teal/15 text-brand-teal rounded-xl">
                            <span className="text-base">📱</span>
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-white tracking-tight">Nastavení Mobilní Aplikace</h3>
                            <p className="text-[11px] text-gray-400">NFC odemykání & připojení k serveru</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-white p-1.5 rounded-lg transition"
                    >
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Settings Body */}
                <div className="space-y-4 text-xs">
                    {/* Toggle: NFC Quick Unlock */}
                    <div className="bg-slate-900/70 border border-brand-border/60 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                            <div className="font-bold text-white flex items-center gap-1.5">
                                <span>⚡</span>
                                <span>Rychlé NFC odemykání</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                Automaticky odemkne dveře po přiložení telefonu k NFC nálepce u vstupu.
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                            <input
                                type="checkbox"
                                checked={nfcEnabled}
                                onChange={(e) => setLocalNfcEnabled(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-teal" />
                        </label>
                    </div>

                    {/* Server URL Input */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-300">
                            Adresa serveru dílny (URL)
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={serverUrl}
                                onChange={(e) => setLocalServerUrl(e.target.value)}
                                placeholder="např. https://dilna.gypri.cz (nebo prázdné pro lokální web)"
                                className="flex-1 bg-slate-950 border border-brand-border rounded-xl px-3.5 py-2 text-white text-xs font-mono placeholder:text-gray-600 focus:outline-none focus:border-brand-teal"
                            />
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={isTesting}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-xl text-xs transition border border-brand-border disabled:opacity-50"
                            >
                                {isTesting ? 'Ověřuji...' : 'Otestovat'}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400">
                            Zadejte doménu nebo IP adresu, pokud používáte nativní mobilní aplikaci mimo lokální síť.
                        </p>
                    </div>

                    {/* Diagnostics Badge */}
                    <div className="bg-slate-950/80 border border-brand-border/40 rounded-xl p-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
                        <span>Režim aplikace:</span>
                        <span className="font-bold text-brand-teal">
                            {isNativeMobileApp() ? 'Nativní Android / iOS Aplikace' : 'Webová aplikace (PWA)'}
                        </span>
                    </div>

                    <div className="bg-slate-950/80 border border-brand-border/40 rounded-xl p-3 flex items-center justify-between text-[11px] font-mono text-gray-400">
                        <span>Hardwarová podpora NFC:</span>
                        <span className={`font-bold ${isWebNfcSupported() || isNativeMobileApp() ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isWebNfcSupported() || isNativeMobileApp() ? 'Dostupná v zařízení' : 'Omezeno systémem'}
                        </span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2.5 pt-2 border-t border-brand-border/60">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold text-xs rounded-xl transition"
                    >
                        Zrušit
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-teal-500/20 transition active:scale-95 flex items-center gap-1.5"
                    >
                        <SuccessIcon className="h-4 w-4" />
                        <span>Uložit nastavení</span>
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
