import React, { useState, FormEvent } from 'react';
import { User } from '../types';

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
        <div className="flex items-center justify-center min-h-screen bg-brand-bg px-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-brand-card border border-brand-border rounded-2xl shadow-2xl">
                {/* Brand Logo & Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex h-14 w-14 items-center justify-center bg-cyan-500/10 border-2 border-brand-cyan rounded-2xl text-brand-cyan font-black text-2xl shadow-lg shadow-cyan-500/20">
                        GD
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tight">GYPRI DÍLNA 2.0</h1>
                        <p className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mt-1">Workshop Management Platform</p>
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
                                className="w-full px-4 py-3 text-sm text-white bg-slate-900 border border-brand-border rounded-xl focus:outline-none focus:border-brand-cyan transition"
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
                                className="w-full px-4 py-3 text-sm text-white bg-slate-900 border border-brand-border rounded-xl focus:outline-none focus:border-brand-cyan transition"
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
                                className="h-4 w-4 rounded border-brand-border bg-slate-900 text-brand-cyan focus:ring-brand-cyan cursor-pointer"
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
                        className="w-full py-3 text-sm font-bold text-black bg-brand-cyan hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-95 disabled:bg-cyan-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Authenticating...' : 'Sign in to Platform'}
                    </button>
                </form>

                {/* Default Credential Hint Box */}
                <div className="pt-2 text-center border-t border-brand-border/60">
                    <p className="text-[11px] font-mono text-gray-500">
                        Default Admin: <span className="text-gray-300">admin</span> / <span className="text-gray-300">rfid_admin_pass</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
