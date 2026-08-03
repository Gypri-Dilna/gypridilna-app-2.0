import React, { useState } from 'react';
import { Cpu, Lock, User, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await authService.login(username, password);
      onLoginSuccess();
    } catch (err: any) {
      setLoading(false);
      if (err.message && (err.message.includes('Network Error') || err.code === 'ERR_NETWORK')) {
        setError('Cannot connect to FastAPI backend at http://localhost:8000. Ensure uvicorn is running.');
      } else {
        setError('Invalid username or password credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-dark rounded-2xl border border-brand-mint/40 flex items-center justify-center mx-auto mb-4 shadow-inner">
            <Cpu className="w-9 h-9 text-brand-mint" />
          </div>
          <h2 className="text-2xl font-black text-brand-paper tracking-wider">GYPRI DÍLNA 2.0</h2>
          <p className="text-xs text-brand-paperMuted font-medium mt-1">
            Unified Access & Inventory System Sign In
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-brand-denied/15 border border-brand-denied rounded-xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-brand-denied shrink-0" />
            <p className="text-xs font-bold text-brand-denied leading-tight">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-paperMuted mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-brand-mint absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-paperMuted mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-brand-mint absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-brand-paper focus:outline-none focus:border-brand-mint transition-colors"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-mint text-brand-dark font-black rounded-xl text-sm tracking-wider uppercase hover:bg-brand-mintLight transition-all duration-200 shadow-lg shadow-brand-mint/20 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workshop'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-brand-border/40 pt-4">
          <p className="text-[11px] text-brand-paperMuted">Default Admin: <span className="text-brand-mint font-bold">admin</span> / <span className="text-brand-mint font-bold">password</span></p>
        </div>
      </div>
    </div>
  );
};
