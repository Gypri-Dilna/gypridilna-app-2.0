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

    const [googleClientId] = useState(() => (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('gypri_google_client_id') || '');
    const [showPasswordForm, setShowPasswordForm] = useState<boolean>(() => !googleClientId);
    const googleBtnRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        // Initialize native Google OAuth directly on login screen if Client ID is configured
        if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
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
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'filled_blue',
                    size: 'large',
                    width: 320,
                    text: 'signin_with'
                });
            } catch (e) {
                console.warn('Google GSI init notice:', e);
            }
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
                        <div className="flex justify-center min-h-[44px]">
                            <div ref={googleBtnRef}></div>
                        </div>
                    ) : (
                        <div className="p-3 bg-brand-darker border border-brand-border/60 rounded-xl text-center">
                            <p className="text-[11px] text-gray-400 font-medium">
                                🔑 Google OAuth je k dispozici. Přihlaste se jako správce a nastavte Google Client ID ve <span className="text-brand-teal font-semibold">Správě uživatelů</span>.
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
