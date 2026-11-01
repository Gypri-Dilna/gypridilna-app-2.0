import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { User } from '../types';
import { Logo } from './Logo';
import { KeyIcon } from './icons';

interface LoginProps {
    onLoginSuccess: (user: User, token?: string, rememberMe?: boolean) => void;
}

declare global {
    interface Window {
        google?: any;
    }
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [googleClientId, setGoogleClientId] = useState(() => (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('gypri_google_client_id') || '');
    const [showPasswordForm, setShowPasswordForm] = useState<boolean>(() => !googleClientId);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    // Fetch server-configured Google Client ID automatically so mobile devices & all browsers render Google Login
    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data?.google_client_id) {
                    const cid = data.google_client_id.trim();
                    setGoogleClientId(cid);
                    localStorage.setItem('gypri_google_client_id', cid);
                    setShowPasswordForm(false);
                }
            })
            .catch(() => {});
    }, []);

    const handleGoogleCredential = async (credential: string) => {
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                onLoginSuccess(data.user, data.token, rememberMe);
            } else {
                setError(data.detail || 'E-mail účtu Google není autorizován pro žádného uživatele systému.');
            }
        } catch (err) {
            setError('Chyba připojení k serveru. Ujistěte se, že běží backend.');
        } finally {
            setIsLoading(false);
        }
    };

    // Expose handleGoogleCredential to window so Native Android Google Sign-In can invoke it directly
    useEffect(() => {
        (window as any).handleGoogleCredential = (credential: string) => {
            handleGoogleCredential(credential);
        };
        (window as any).handleGoogleError = (errMessage: string) => {
            setError(errMessage);
            setIsLoading(false);
        };
        return () => {
            delete (window as any).handleGoogleCredential;
            delete (window as any).handleGoogleError;
        };
    }, [rememberMe]);

    const isAndroidNative = typeof (window as any).AndroidGoogleAuth !== 'undefined';

    useEffect(() => {
        // Initialize native Google OAuth directly on login screen if Client ID is configured
        if (googleClientId && googleBtnRef.current && !isAndroidNative) {
            const renderGoogleButton = () => {
                if (window.google?.accounts?.id && googleBtnRef.current) {
                    try {
                        googleBtnRef.current.innerHTML = '';
                        window.google.accounts.id.initialize({
                            client_id: googleClientId.trim(),
                            callback: (response: any) => {
                                if (response?.credential) {
                                    handleGoogleCredential(response.credential);
                                }
                            }
                        });
                        const btnWidth = Math.min(Math.max(window.innerWidth - 64, 250), 320);
                        window.google.accounts.id.renderButton(googleBtnRef.current, {
                            theme: 'filled_blue',
                            size: 'large',
                            width: btnWidth,
                            text: 'signin_with'
                        });
                    } catch (e) {
                        console.warn('Google GSI init notice:', e);
                    }
                }
            };

            renderGoogleButton();
            // Retry briefly if Google script hasn't loaded yet on slow mobile connections
            const timer = setTimeout(renderGoogleButton, 800);
            return () => clearTimeout(timer);
        }
    }, [googleClientId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                onLoginSuccess(data.user, data.token, rememberMe);
            } else {
                setError(data.message || data.detail || 'Neplatné uživatelské jméno nebo heslo.');
            }
        } catch (err) {
            setError('Chyba připojení k serveru. Ujistěte se, že běží backend.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-bg px-4 relative overflow-hidden font-sans">
            <div className="w-full max-w-md p-8 space-y-6 bg-brand-dark border border-brand-border rounded-2xl shadow-2xl">
                {/* Official Brand Logo & Header */}
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <Logo variant="light" className="h-20 w-auto" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight lowercase text-center">
                            <span className="text-white">gypri</span> <span className="text-brand-teal">dílna</span>
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">Platforma pro správu dílny a přístupový systém</p>
                    </div>
                </div>

                {/* Google Sign In Section */}
                <div className="pt-2">
                    {googleClientId ? (
                        isAndroidNative ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setError('');
                                    setIsLoading(true);
                                    (window as any).AndroidGoogleAuth.signInWithGoogle(googleClientId);
                                }}
                                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 active:scale-[0.98] font-semibold py-3 px-4 rounded-xl shadow-md border border-gray-200 transition-all text-sm cursor-pointer"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                <span>Pokračovat s účtem Google</span>
                            </button>
                        ) : (
                            <div className="flex justify-center min-h-[44px]">
                                <div ref={googleBtnRef}></div>
                            </div>
                        )
                    ) : (
                        <div className="p-3 bg-brand-darker border border-brand-border/60 rounded-xl text-center">
                            <p className="text-[11px] text-gray-400 font-medium">
                                Google OAuth je k dispozici. Přihlaste se jako správce a nastavte Google Client ID ve <span className="text-brand-teal font-semibold">Správě uživatelů</span>.
                            </p>
                        </div>
                    )}
                </div>

                {/* Collapsible Password Login Toggle */}
                <div className="pt-1 text-center">
                    <button
                        type="button"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-brand-teal transition py-1.5 px-3 rounded-xl hover:bg-brand-darker active:scale-95"
                    >
                        <KeyIcon className="h-3.5 w-3.5" />
                        <span>{showPasswordForm ? 'Skrýt přihlášení heslem' : 'Přihlásit se heslem'}</span>
                        <span className={`text-[10px] transition-transform duration-200 ${showPasswordForm ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                </div>

                {/* Collapsible Password Form */}
                {showPasswordForm && (
                    <form className="space-y-4 pt-2 border-t border-brand-border/60 animate-fadeIn" onSubmit={handleSubmit}>
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="username" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                                    E-mail / Uživatelské jméno
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2.5 text-xs text-white bg-brand-darker border border-brand-border rounded-xl focus:outline-none focus:border-brand-teal transition"
                                    placeholder="Zadejte e-mail (např. uzivatel@email.cz)"
                                />
                            </div>
                            <div>
                                <label htmlFor="password-input" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                                    Heslo
                                </label>
                                <input
                                    id="password-input"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 text-xs text-white bg-brand-darker border border-brand-border rounded-xl focus:outline-none focus:border-brand-teal transition"
                                    placeholder="••••••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label htmlFor="remember-me" className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="h-4 w-4 rounded border-brand-border bg-brand-darker text-brand-teal focus:ring-brand-teal cursor-pointer"
                                />
                                <span>Zapamatovat si mě</span>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 text-xs font-extrabold text-black bg-brand-teal hover:bg-brand-teal-hover rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 disabled:bg-teal-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Ověřování...' : 'Přihlásit se do systému'}
                        </button>
                    </form>
                )}

                {!showPasswordForm && error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold text-center animate-fadeIn">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
