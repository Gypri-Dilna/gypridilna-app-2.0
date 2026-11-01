import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { triggerHaptic, soundEffects, isNfcUnlockEnabled } from '../mobile';
import { LockClosedIcon, LockOpenIcon, SuccessIcon, CloseIcon } from './icons';

interface QuickUnlockModalProps {
    isOpen: boolean;
    user: User | null;
    isAuthenticated: boolean;
    onClose: () => void;
    onRemoteOpen: () => Promise<boolean>;
    onRequireLogin?: () => void;
}

export const QuickUnlockModal: React.FC<QuickUnlockModalProps> = ({
    isOpen,
    user,
    isAuthenticated,
    onClose,
    onRemoteOpen,
    onRequireLogin
}) => {
    const [status, setStatus] = useState<'idle' | 'verifying' | 'unlocking' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const hasTriggeredRef = useRef(false);

    const userCanOpen = Boolean(
        user && (user.is_admin || (typeof user.permissions === 'string' ? JSON.parse(user.permissions || '{}').remote_opening : user.permissions?.remote_opening))
    );

    useEffect(() => {
        if (!isOpen) {
            setStatus('idle');
            setErrorMessage('');
            hasTriggeredRef.current = false;
            return;
        }

        if (hasTriggeredRef.current) return;
        hasTriggeredRef.current = true;

        if (!isAuthenticated || !user) {
            setStatus('error');
            setErrorMessage('Pro odemknutí dveří se nejprve přihlaste ke svému účtu dílny.');
            triggerHaptic('warning');
            soundEffects.playErrorBuzz();
            return;
        }

        if (!userCanOpen) {
            setStatus('error');
            setErrorMessage('Váš účet nemá přiděleno oprávnění k dálkovému otevírání dveří.');
            triggerHaptic('error');
            soundEffects.playErrorBuzz();
            return;
        }

        // Automatic unlock execution
        executeUnlock();
    }, [isOpen, isAuthenticated, user, userCanOpen]);

    const executeUnlock = async () => {
        setStatus('unlocking');
        triggerHaptic('heavy');

        try {
            const success = await onRemoteOpen();
            if (success) {
                setStatus('success');
                triggerHaptic('success');
                soundEffects.playUnlockSuccess();

                // Automatically close after 2.6 seconds
                setTimeout(() => {
                    onClose();
                }, 2600);
            } else {
                setStatus('error');
                setErrorMessage('Nepodařilo se spojit se zámkem dveří. Zkuste to prosím znovu.');
                triggerHaptic('error');
                soundEffects.playErrorBuzz();
            }
        } catch (e: any) {
            setStatus('error');
            setErrorMessage(e.message || 'Chyba při komunikaci se serverem dílny.');
            triggerHaptic('error');
            soundEffects.playErrorBuzz();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-backdrop-fade font-sans select-none">
            <style>{`
                @keyframes pulseRing {
                    0% { transform: scale(0.85); opacity: 0.8; }
                    50% { transform: scale(1.15); opacity: 0.2; }
                    100% { transform: scale(1.4); opacity: 0; }
                }
                .animate-pulse-ring {
                    animation: pulseRing 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
                }
                @keyframes autoCloseProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress-bar {
                    animation: autoCloseProgress 2.6s linear forwards;
                }
            `}</style>

            <div className="relative w-full max-w-sm bg-brand-dark border border-brand-teal/40 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden flex flex-col items-center text-center space-y-6">
                {/* Floating Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/80 rounded-full transition"
                    title="Zavřít"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>

                {/* Status Indicator Glow Circles */}
                <div className="relative my-4 flex items-center justify-center">
                    {/* Pulsing rings for unlocking state */}
                    {status === 'unlocking' && (
                        <>
                            <div className="absolute inset-0 rounded-full border-2 border-brand-teal animate-pulse-ring pointer-events-none" />
                            <div className="absolute -inset-4 rounded-full border-2 border-brand-teal/40 animate-pulse-ring [animation-delay:0.5s] pointer-events-none" />
                        </>
                    )}

                    {/* Outer Badge */}
                    <div className={`relative h-28 w-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                        status === 'success'
                            ? 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 shadow-emerald-500/40 scale-105'
                            : status === 'error'
                                ? 'bg-rose-500/20 border-2 border-rose-400 text-rose-300 shadow-rose-500/30'
                                : 'bg-brand-teal/20 border-2 border-brand-teal text-brand-teal shadow-brand-teal/40'
                    }`}>
                        {status === 'unlocking' && (
                            <div className="animate-spin text-brand-teal">
                                <LockOpenIcon className="h-12 w-12 animate-pulse" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="animate-bounce">
                                <SuccessIcon className="h-14 w-14 text-emerald-400" />
                            </div>
                        )}
                        {status === 'error' && (
                            <LockClosedIcon className="h-12 w-12 text-rose-400" />
                        )}
                    </div>
                </div>

                {/* State Title & Messages */}
                <div className="space-y-2">
                    {status === 'unlocking' && (
                        <>
                            <h3 className="text-xl font-extrabold text-white tracking-tight">Ověřuji & Otevírám</h3>
                            <p className="text-xs text-gray-400 font-mono">Přenáším signál k relé zámku brány...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <h3 className="text-2xl font-black text-emerald-400 tracking-tight">Dveře Odemčeny!</h3>
                            <p className="text-xs text-gray-200">
                                Vítejte v dílně, <span className="font-bold text-white">{user?.name || user?.username}</span>.
                            </p>
                            <p className="text-[11px] text-gray-400 pt-1 font-mono">Vstupte prosím, brána je volná.</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <h3 className="text-xl font-bold text-rose-400 tracking-tight">Přístup Odepřen</h3>
                            <p className="text-xs text-gray-300 max-w-xs">{errorMessage}</p>
                        </>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="w-full pt-2 flex flex-col gap-2">
                    {status === 'error' && !isAuthenticated && onRequireLogin && (
                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                onRequireLogin();
                            }}
                            className="w-full py-3 bg-brand-teal text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-teal-500/20 hover:bg-brand-teal-hover transition active:scale-95"
                        >
                            Přihlásit se k účtu dílny
                        </button>
                    )}

                    {status === 'error' && isAuthenticated && (
                        <button
                            type="button"
                            onClick={executeUnlock}
                            className="w-full py-3 bg-slate-800 border border-brand-border text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-700 transition active:scale-95"
                        >
                            Zkusit znovu
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="w-full bg-slate-900/60 rounded-full h-1 overflow-hidden">
                            <div className="h-full bg-emerald-400 animate-progress-bar rounded-full" />
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
