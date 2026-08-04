import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { User } from '../types';
import { Logo } from './Logo';

interface LoginProps {
    onLoginSuccess: (user: User, rememberMe: boolean) => void;
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
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const handleGoogleCredential = async (credential: string, emailFallback?: string) => {
        setError('');
        setIsLoading(true);
        try {
            const response = await fetch('/api/google-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credential, email: emailFallback }),
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                onLoginSuccess(data.user, rememberMe);
            } else {
                setError(data.detail || 'Google email is not authorized for any system account.');
            }
        } catch (err) {
            setError('Server connection error. Ensure backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Initialize Google Identity Services if available
        if (window.google?.accounts?.id && googleBtnRef.current) {
            try {
                window.google.accounts.id.initialize({
                    client_id: '928374829103-mockclientid.apps.googleusercontent.com', // Standard OAuth Client ID placeholder
                    callback: (response: any) => {
                        if (response?.credential) {
                            handleGoogleCredential(response.credential);
                        }
                    }
                });
                window.google.accounts.id.renderButton(googleBtnRef.current, {
                    theme: 'dark',
                    size: 'large',
                    width: 320,
                    text: 'signin_with'
                });
            } catch (e) {
                console.warn('Google GSI init warning:', e);
            }
        }
    }, []);

    const handleSimulatedGoogleSignIn = () => {
        const email = prompt("Enter your Google Account email to test Google Sign-In:");
        if (email) {
            handleGoogleCredential('', email);
        }
    };

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
                onLoginSuccess(data.user, rememberMe);
            } else {
                setError(data.detail || data.message || 'Invalid username or password.');
            }
        } catch (err) {
            setError('Failed to connect to the server. Ensure backend is running.');
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
                        <p className="text-xs text-gray-400 mt-1">Workshop Access & Inventory Control Platform</p>
                    </div>
                </div>

                {/* Google Sign In Section */}
                <div className="space-y-3 pt-2">
                    <div ref={googleBtnRef} className="flex justify-center min-h-[44px]"></div>
                    
                    <button
                        type="button"
                        onClick={handleSimulatedGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        Sign in with Google
                    </button>
                </div>

                <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-brand-border/80"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">or sign in with password</span>
                    <div className="flex-grow border-t border-brand-border/80"></div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-3">
                        <div>
                            <label htmlFor="username" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                                Username
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
                                placeholder="Enter username (e.g. admin)"
                            />
                        </div>
                        <div>
                            <label htmlFor="password-input" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                                Password
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
                            <span>Remember me</span>
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
                        {isLoading ? 'Authenticating...' : 'Sign in to Platform'}
                    </button>
                </form>

                {/* Default Credential Hint Box */}
                <div className="pt-2 text-center border-t border-brand-border/60">
                    <p className="text-[11px] font-mono text-gray-400">
                        Default Admin: <span className="text-gray-200">admin</span> / <span className="text-gray-200">rfid_admin_pass</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
