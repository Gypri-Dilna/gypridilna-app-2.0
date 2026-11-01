import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { triggerHaptic, soundEffects } from '../mobile';
import { LockClosedIcon, LockOpenIcon, SuccessIcon, CloseIcon } from './icons';
import { Logo } from './Logo';

interface QuickUnlockModalProps {
    isOpen: boolean;
    user: User | null;
    isAuthenticated: boolean;
    isAuthChecking?: boolean;
    triggerKey?: number;
    onClose: () => void;
    onRemoteOpen: () => Promise<boolean>;
    onRequireLogin?: () => void;
}

export const QuickUnlockModal: React.FC<QuickUnlockModalProps> = ({
    isOpen,
    user,
    isAuthenticated,
    isAuthChecking = false,
    triggerKey = 0,
    onClose,
    onRemoteOpen,
    onRequireLogin
}) => {
    const [status, setStatus] = useState<'idle' | 'verifying' | 'unlocking' | 'success' | 'error'>('idle');
    const isRunningRef = useRef(false);
    const lastKeyRef = useRef<number>(-1);

    const executeUnlock = async () => {
        if (isRunningRef.current) return;
        isRunningRef.current = true;
        setStatus('unlocking');
        triggerHaptic('heavy');

        try {
            const success = await onRemoteOpen();
            if (success) {
                setStatus('success');
                triggerHaptic('success');
                soundEffects.playUnlockSuccess();

                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setStatus('error');
                triggerHaptic('error');
                soundEffects.playErrorBuzz();
            }
        } catch (e) {
            setStatus('error');
            triggerHaptic('error');
            soundEffects.playErrorBuzz();
        } finally {
            isRunningRef.current = false;
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setStatus('idle');
            isRunningRef.current = false;
            lastKeyRef.current = -1;
            return;
        }

        // If trigger key changed or modal freshly opened
        if (lastKeyRef.current !== triggerKey) {
            lastKeyRef.current = triggerKey;
            isRunningRef.current = false;

            // If still checking authentication token with backend, wait in 'verifying' state
            if (isAuthChecking) {
                setStatus('verifying');
                return;
            }

            if (!isAuthenticated || !user) {
                setStatus('error');
                triggerHaptic('warning');
                soundEffects.playErrorBuzz();
                return;
            }

            executeUnlock();
        }
    }, [isOpen, triggerKey, isAuthChecking, isAuthenticated, user]);

    // When background auth check completes while modal is displayed in 'verifying' state
    useEffect(() => {
        if (isOpen && status === 'verifying' && !isAuthChecking) {
            if (isAuthenticated && user) {
                executeUnlock();
            } else {
                setStatus('error');
                triggerHaptic('warning');
                soundEffects.playErrorBuzz();
            }
        }
    }, [isOpen, status, isAuthChecking, isAuthenticated, user]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[10000] w-screen h-[100dvh] bg-brand-bg flex flex-col justify-between items-center p-6 sm:p-10 select-none font-sans overflow-hidden">
            <style>{`
                @keyframes pulseRing {
                    0% { transform: scale(0.88); opacity: 0.9; }
                    50% { transform: scale(1.22); opacity: 0.25; }
                    100% { transform: scale(1.55); opacity: 0; }
                }
                .animate-pulse-ring {
                    animation: pulseRing 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
                }
                @keyframes autoCloseProgress {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                .animate-progress-bar {
                    animation: autoCloseProgress 2.0s linear forwards;
                }
            `}</style>

            {/* Ambient Background Radial Glows */}
            <img 
                src="/assets/gradient.svg" 
                alt="" 
                className="fixed -top-32 -right-32 w-[600px] h-[600px] pointer-events-none opacity-40 mix-blend-screen select-none z-0" 
            />
            <img 
                src="/assets/gradient.svg" 
                alt="" 
                className="fixed -bottom-36 -left-36 w-[700px] h-[700px] pointer-events-none opacity-30 mix-blend-screen select-none z-0" 
            />

            {/* Top Bar: Brand Logo & Close Button */}
            <div className="w-full flex items-center justify-between relative z-10 pt-2">
                <div className="flex items-center gap-2.5">
                    <Logo variant="light" className="h-8 w-auto flex-shrink-0" />
                    <span className="font-black text-base tracking-tight lowercase">
                        <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-3 text-gray-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-2xl border border-brand-border/60 transition active:scale-95 shadow-lg"
                    title="Zavřít"
                >
                    <CloseIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Center: Hero Animated Glowing Ring & Single Punchy Status Title */}
            <div className="flex flex-col items-center justify-center my-auto space-y-8 relative z-10">
                <div className="relative flex items-center justify-center">
                    {(status === 'unlocking' || status === 'verifying') && (
                        <>
                            <div className="absolute -inset-4 rounded-full border-2 border-brand-teal animate-pulse-ring pointer-events-none" />
                            <div className="absolute -inset-10 rounded-full border-2 border-brand-teal/40 animate-pulse-ring [animation-delay:0.5s] pointer-events-none" />
                        </>
                    )}

                    <div className={`relative h-40 w-40 sm:h-48 sm:w-48 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                        status === 'success'
                            ? 'bg-emerald-500/20 border-4 border-emerald-400 text-emerald-300 shadow-emerald-500/50 scale-105'
                            : status === 'error'
                                ? 'bg-rose-500/20 border-4 border-rose-400 text-rose-300 shadow-rose-500/40'
                                : 'bg-brand-teal/20 border-4 border-brand-teal text-brand-teal shadow-brand-teal/50'
                    }`}>
                        {(status === 'unlocking' || status === 'verifying') && (
                            <div className="animate-spin text-brand-teal">
                                <LockOpenIcon className="h-16 w-16 sm:h-20 sm:w-20 animate-pulse" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="animate-bounce">
                                <SuccessIcon className="h-20 w-20 sm:h-24 sm:w-24 text-emerald-400" />
                            </div>
                        )}
                        {status === 'error' && (
                            <LockClosedIcon className="h-16 w-16 sm:h-20 sm:w-20 text-rose-400" />
                        )}
                    </div>
                </div>

                {/* Minimalist Bold Status - ZERO unwanted wordy descriptions */}
                <div className="text-center">
                    {status === 'verifying' && (
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Ověřuji...</h2>
                    )}
                    {status === 'unlocking' && (
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Otevírám...</h2>
                    )}
                    {status === 'success' && (
                        <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">Odemčeno</h2>
                    )}
                    {status === 'error' && (
                        <h2 className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">Přístup odepřen</h2>
                    )}
                </div>
            </div>

            {/* Bottom Controls / Feedback */}
            <div className="w-full max-w-xs flex flex-col items-center gap-3 relative z-10 pb-6">
                {status === 'success' && (
                    <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-emerald-500/30">
                        <div className="h-full bg-emerald-400 animate-progress-bar rounded-full" />
                    </div>
                )}

                {status === 'error' && (
                    <>
                        {!isAuthenticated && onRequireLogin ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onRequireLogin();
                                }}
                                className="w-full py-4 bg-brand-teal text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-teal-500/25 hover:bg-brand-teal-hover transition active:scale-95"
                            >
                                Přihlásit se
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={executeUnlock}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-brand-border text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl transition active:scale-95"
                            >
                                Zkusit znovu
                            </button>
                        )}
                    </>
                )}

                <button
                    type="button"
                    onClick={onClose}
                    className="text-xs font-bold text-gray-500 hover:text-gray-300 py-2 transition"
                >
                    Zavřít
                </button>
            </div>
        </div>,
        document.body
    );
};
