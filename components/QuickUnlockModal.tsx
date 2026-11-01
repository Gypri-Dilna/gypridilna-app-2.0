import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { triggerHaptic, soundEffects, exitNativeApp } from '../mobile';
import { LockClosedIcon, LockOpenIcon, RefreshIcon, CloseIcon } from './icons';

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

                // Stay on screen for 1.8s then IMMEDIATELY exit native app
                // Calling exitNativeApp() FIRST keeps the modal covering the entire screen
                // so the dashboard NEVER flickers!
                setTimeout(async () => {
                    await exitNativeApp();
                    setTimeout(() => {
                        onClose();
                    }, 600);
                }, 1800);
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

        if (lastKeyRef.current !== triggerKey) {
            lastKeyRef.current = triggerKey;
            isRunningRef.current = false;

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
        <div className="fixed inset-0 z-[10000] w-screen h-[100dvh] bg-[#101215] flex flex-col items-center justify-center p-6 select-none font-sans overflow-hidden">
            {/* Minimalist Top Right Close Button */}
            <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 text-gray-500 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition active:scale-95"
                title="Zavřít"
            >
                <CloseIcon className="h-5 w-5" />
            </button>

            {/* Center Visual Indicator - ZERO text, ZERO glow, refined minimalism */}
            <div className="flex flex-col items-center justify-center space-y-6">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {(status === 'unlocking' || status === 'verifying') && (
                        <>
                            {/* Subtle background track */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                            {/* Crisp spinning arc */}
                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-teal animate-spin" />
                            {/* Padlock icon */}
                            <LockOpenIcon className="h-10 w-10 text-brand-teal transition-all" />
                        </>
                    )}

                    {status === 'success' && (
                        <div className="w-32 h-32 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10 transition-all">
                            {/* Crisp static checkmark - NO bounce, NO glow */}
                            <svg className="h-14 w-14 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="w-32 h-32 rounded-full border-2 border-rose-500 flex items-center justify-center bg-rose-500/10 transition-all">
                            <LockClosedIcon className="h-12 w-12 text-rose-400" />
                        </div>
                    )}
                </div>

                {/* On Error: Minimalist Retry & Login Actions */}
                {status === 'error' && (
                    <div className="flex items-center gap-3 pt-2">
                        {isAuthenticated ? (
                            <button
                                type="button"
                                onClick={executeUnlock}
                                className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 transition active:scale-95"
                                title="Zkusit znovu"
                            >
                                <RefreshIcon className="h-5 w-5" />
                            </button>
                        ) : onRequireLogin ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onRequireLogin();
                                }}
                                className="p-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl border border-white/10 transition active:scale-95"
                                title="Přihlásit se"
                            >
                                <LockClosedIcon className="h-5 w-5" />
                            </button>
                        ) : null}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
