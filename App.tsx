import React, { useState, useCallback, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User } from './types';

export type Theme = 'light' | 'dark' | 'system';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'system';
    });

    useEffect(() => {
        const savedUser = localStorage.getItem('savedUser');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
            } catch (e) {
                localStorage.removeItem('savedUser');
            }
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.classList.remove(isDark ? 'light' : 'dark');
        root.classList.add(isDark ? 'dark' : 'light');

        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleLoginSuccess = useCallback((loggedInUser: User, rememberMe: boolean) => {
        setUser(loggedInUser);
        setIsAuthenticated(true);
        if (rememberMe) {
            localStorage.setItem('savedUser', JSON.stringify(loggedInUser));
        }
    }, []);

    const handleLogout = useCallback(() => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('savedUser');
    }, []);

    const handleSetTheme = useCallback((newTheme: Theme) => {
        setTheme(newTheme);
    }, []);

    return (
        <div className="min-h-screen bg-brand-light dark:bg-brand-darker text-gray-800 dark:text-gray-200">
            {isAuthenticated && user ? (
                <Dashboard user={user} onLogout={handleLogout} theme={theme} setTheme={handleSetTheme} />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
};

export default App;