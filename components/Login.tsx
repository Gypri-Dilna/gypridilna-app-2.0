import React, { useState, FormEvent } from 'react';
import { User } from '../types';
import { Logo } from './Logo';
import { BoltGlyphChain } from './BoltGlyph';

interface LoginProps {
    onLoginSuccess: (user: User, rememberMe: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
        <div className="flex items-center justify-center min-h-screen bg-brand-bg px-4 relative overflow-hidden">
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
                    </div>
                </div>

                <form className="space-y-5 pt-2" onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
                                className="w-full px-4 py-3 text-sm text-white bg-brand-darker border border-brand-border rounded-xl focus:outline-none focus:border-brand-teal transition"
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
                                className="w-full px-4 py-3 text-sm text-white bg-brand-darker border border-brand-border rounded-xl focus:outline-none focus:border-brand-teal transition"
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
                            <span>Remember me on this workstation</span>
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
                        className="w-full py-3 text-sm font-bold text-black bg-brand-teal hover:bg-brand-teal-hover rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 disabled:bg-teal-900 disabled:text-gray-400 disabled:cursor-not-allowed"
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
