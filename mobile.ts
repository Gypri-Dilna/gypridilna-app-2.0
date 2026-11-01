import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Check if running inside native Capacitor container (Android / iOS)
export const isNativeMobileApp = (): boolean => {
    return Capacitor.isNativePlatform();
};

// Check if device supports Web NFC scanning (Android Chrome / Android WebView)
export const isWebNfcSupported = (): boolean => {
    return typeof window !== 'undefined' && 'NDEFReader' in window;
};

// Server URL storage for native mobile app connecting to central workshop server
const SERVER_URL_KEY = 'gypri_server_url';
const DEFAULT_SERVER_URL = 'https://access.gypridilna.cz';
const NFC_UNLOCK_ENABLED_KEY = 'gypri_nfc_unlock_enabled';
const BIOMETRIC_REQUIRED_KEY = 'gypri_biometric_required';

export const getServerUrl = (): string => {
    try {
        return localStorage.getItem(SERVER_URL_KEY) || DEFAULT_SERVER_URL;
    } catch {
        return DEFAULT_SERVER_URL;
    }
};

export const setServerUrl = (url: string): void => {
    try {
        let clean = url.trim();
        if (clean.endsWith('/')) {
            clean = clean.slice(0, -1);
        }
        localStorage.setItem(SERVER_URL_KEY, clean);
    } catch (e) {
        console.error('Failed to save server URL:', e);
    }
};

export const getApiUrl = (path: string): string => {
    const base = getServerUrl();
    if (!path.startsWith('http')) {
        return `${base}${path.startsWith('/') ? path : '/' + path}`;
    }
    return path;
};

// User Preference: Quick NFC Unlock enabled (default: true)
export const isNfcUnlockEnabled = (): boolean => {
    try {
        const val = localStorage.getItem(NFC_UNLOCK_ENABLED_KEY);
        return val === null ? true : val === 'true';
    } catch {
        return true;
    }
};

export const setNfcUnlockEnabled = (enabled: boolean): void => {
    try {
        localStorage.setItem(NFC_UNLOCK_ENABLED_KEY, String(enabled));
    } catch (e) {
        console.error('Failed to save NFC unlock setting:', e);
    }
};

// User Preference: Require biometrics before unlock (default: false)
export const isBiometricRequired = (): boolean => {
    try {
        return localStorage.getItem(BIOMETRIC_REQUIRED_KEY) === 'true';
    } catch {
        return false;
    }
};

export const setBiometricRequired = (required: boolean): void => {
    try {
        localStorage.setItem(BIOMETRIC_REQUIRED_KEY, String(required));
    } catch (e) {
        console.error('Failed to save biometric setting:', e);
    }
};

// Tactile Haptic Vibration
export const triggerHaptic = async (type: 'success' | 'warning' | 'error' | 'heavy' = 'heavy'): Promise<void> => {
    try {
        if (isNativeMobileApp()) {
            if (type === 'success') {
                await Haptics.notification({ type: NotificationType.Success });
            } else if (type === 'warning') {
                await Haptics.notification({ type: NotificationType.Warning });
            } else if (type === 'error') {
                await Haptics.notification({ type: NotificationType.Error });
            } else {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            }
            return;
        }
    } catch (e) {
        // Fallback to web vibration API
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (type === 'success') {
            navigator.vibrate([80, 40, 100]);
        } else if (type === 'error') {
            navigator.vibrate([150, 60, 150]);
        } else {
            navigator.vibrate(100);
        }
    }
};

// Futuristic Sci-Fi Audio Synthesizer (Zero asset dependencies, Web Audio API)
class AudioSynth {
    private ctx: AudioContext | null = null;

    private getContext(): AudioContext | null {
        if (typeof window === 'undefined') return null;
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    // Melodic high-tech unlock chime
    playUnlockSuccess(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            
            // First note (E5 - 659.25 Hz)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(523.25, now); // C5
            osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
            gain1.gain.setValueAtTime(0.2, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.35);

            // Second high chime (G5 - 783.99 Hz)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(783.99, now + 0.08);
            gain2.gain.setValueAtTime(0.001, now);
            gain2.gain.setValueAtTime(0.25, now + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now + 0.08);
            osc2.stop(now + 0.5);
        } catch (e) {
            console.error('Audio synth error:', e);
        }
    }

    // Short crisp beep when scanning an RFID chip via phone
    playChipBeep(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(880, now); // A5
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } catch (e) {}
    }

    // Low denial buzz
    playErrorBuzz(): void {
        const ctx = this.getContext();
        if (!ctx) return;
        try {
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        } catch (e) {}
    }
}

export const soundEffects = new AudioSynth();

// Setup Deep Link Listener for Mobile and Web
export const setupDeepLinkListener = (onQuickUnlock: () => void) => {
    // 1. Expose function and event listener directly on window
    if (typeof window !== 'undefined') {
        (window as any).triggerQuickUnlock = () => {
            console.log('[mobile.ts] triggerQuickUnlock invoked directly');
            onQuickUnlock();
        };

        window.addEventListener('gypri-quick-unlock', () => {
            console.log('[mobile.ts] gypri-quick-unlock custom event received');
            onQuickUnlock();
        });

        // 2. Check current URL query / path on initial load (Web or PWA)
        const urlParams = new URLSearchParams(window.location.search);
        const path = window.location.pathname;
        const hash = window.location.hash;

        if (
            urlParams.get('action') === 'quick-unlock' ||
            path.includes('quick-unlock') ||
            hash.includes('quick-unlock') ||
            hash.includes('unlock')
        ) {
            setTimeout(onQuickUnlock, 300);
        }
    }

    // 3. Listen to Capacitor Native App URL Open events (e.g. gypridilna://unlock)
    if (isNativeMobileApp()) {
        try {
            CapApp.addListener('appUrlOpen', (event) => {
                const url = event.url || '';
                console.log('[mobile.ts] CapApp appUrlOpen:', url);
                if (url.includes('unlock') || url.includes('quick-unlock')) {
                    onQuickUnlock();
                }
            });

            CapApp.getLaunchUrl().then((launchUrl) => {
                if (launchUrl && launchUrl.url) {
                    console.log('[mobile.ts] CapApp launchUrl:', launchUrl.url);
                    if (launchUrl.url.includes('unlock') || launchUrl.url.includes('quick-unlock')) {
                        onQuickUnlock();
                    }
                }
            });
        } catch (e) {
            console.error('Capacitor App listener error:', e);
        }
    }
};
