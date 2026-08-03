

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chip, AccessLog, User, AccessResult } from '../types';
import { Header } from './Header';
import { ChipManagement } from './ChipManagement';
import { LogsViewer } from './LogsViewer';
import { UserManagement } from './UserManagement';
import { RemoteIcon, RefreshIcon } from './icons';
import { Toast } from './Toast';
import { Theme } from '../App';

// The base URL of your Python Flask backend
const API_BASE_URL = ''; // Use relative paths

interface DashboardProps {
    user: User;
    onLogout: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout, theme, setTheme }) => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'chips' | 'logs' | 'users'>('dashboard');
    const [chips, setChips] = useState<Chip[]>([]);
    const [logs, setLogs] = useState<AccessLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    
    const latestLogId = useRef<number | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
    };

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        const canViewLogs = user.is_admin || user.permissions.view_logs;
        try {
            const [chipsResponse, logsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/chips`),
                canViewLogs ? fetch(`${API_BASE_URL}/api/logs`) : Promise.resolve(null),
            ]);
            if (!chipsResponse.ok) throw new Error('Failed to fetch chips');
            
            const chipsData: Chip[] = await chipsResponse.json();
            setChips(chipsData);

            if (logsResponse && logsResponse.ok) {
                const logsData: AccessLog[] = await logsResponse.json();
                setLogs(logsData);
                if (logsData.length > 0) {
                    latestLogId.current = logsData[0].id;
                }
            }
        } catch (error) {
            console.error(error);
            showToast('Error fetching data.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [user.is_admin, user.permissions.view_logs]);
    
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/logs?limit=1`);
                if (!response.ok) return;
                const latestLogs: AccessLog[] = await response.json();

                if (latestLogs.length > 0 && latestLogs[0].id !== latestLogId.current) {
                    // Only refresh if the new activity is not an unknown chip scan
                    if (latestLogs[0].result !== AccessResult.DENIED_UNKNOWN) {
                        showToast('New activity detected. Refreshing...', 'success');
                        fetchAllData();
                    } else {
                        // If it is an unknown chip, just update the log ID to prevent repeated checks
                        latestLogId.current = latestLogs[0].id;
                    }
                }
            } catch (error) {
                console.warn('Polling error:', error);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [fetchAllData]);
    
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const handleAddChip = useCallback(async (newChip: Omit<Chip, 'id'>) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newChip),
            });
            if (!response.ok) throw new Error('Failed to add chip');
            showToast(`Chip for ${newChip.name} added successfully.`, 'success');
            fetchAllData();
        } catch (error) {
            console.error(error);
            showToast('Error adding chip.', 'error');
        }
    }, [fetchAllData]);
    
    const handleUpdateChip = useCallback(async (updatedChip: Chip) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chips/${updatedChip.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedChip),
            });
            if (!response.ok) throw new Error('Failed to update chip');
            showToast(`Chip for ${updatedChip.name} updated successfully.`, 'success');
            fetchAllData();
        } catch (error) {
            console.error(error);
            showToast('Error updating chip.', 'error');
        }
    }, [fetchAllData]);

    const handleDeleteChip = useCallback(async (chipId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/chips/${chipId}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete chip');
            showToast('Chip deleted successfully.', 'success');
            fetchAllData();
        } catch (error) {
            console.error(error);
            showToast('Error deleting chip.', 'error');
        }
    }, [fetchAllData]);

    const handleRemoteOpening = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/remote-opening`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ username: user.username })
            });
             if (!response.ok) throw new Error('Server did not acknowledge opening request.');

            showToast('Unlock command sent to server.', 'success');
            // Refresh logs after a short delay to see the event
            setTimeout(fetchAllData, 1000);
        } catch (error) {
            console.error(error);
            showToast('Error sending opening command.', 'error');
        }
    }, [fetchAllData, user.username]);
    
    const handleRefresh = useCallback(() => {
        showToast('Refreshing data...', 'success');
        fetchAllData();
    }, [fetchAllData]);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 animate-pulse">Loading Dashboard...</div>
                </div>
            );
        }
        
        switch (activeTab) {
            case 'dashboard':
                return <DashboardHome user={user} onRemoteOpening={handleRemoteOpening} logs={logs} chips={chips} onRefresh={handleRefresh} />;
            case 'chips':
                return <ChipManagement 
                            chips={chips} 
                            onAddChip={handleAddChip}
                            onUpdateChip={handleUpdateChip}
                            onDeleteChip={handleDeleteChip}
                            showToast={showToast}
                        />;
            case 'logs':
                return <LogsViewer user={user} logs={logs} onRefresh={handleRefresh} />;
            case 'users':
                return <UserManagement chips={chips} showToast={showToast} />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} theme={theme} setTheme={setTheme} user={user} showToast={showToast} />
            <main className="flex-1 p-4 sm:p-6 md:p-8 bg-brand-light dark:bg-brand-darker overflow-y-auto pb-20 md:pb-8">
                {renderContent()}
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

interface DashboardHomeProps {
    user: User;
    onRemoteOpening: () => void;
    logs: AccessLog[];
    chips: Chip[];
    onRefresh: () => void;
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user, onRemoteOpening, logs, chips, onRefresh }) => {
    const [isServiceMode, setIsServiceMode] = useState(false);
    const [isLoadingServiceMode, setIsLoadingServiceMode] = useState(true);

    const fetchServiceModeStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/service-mode-status`);
            if (!response.ok) throw new Error('Failed to fetch service mode status');
            const data = await response.json();
            setIsServiceMode(data.enabled);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingServiceMode(false);
        }
    }, []);

    useEffect(() => {
        fetchServiceModeStatus();
    }, [fetchServiceModeStatus]);

    const handleToggleServiceMode = async () => {
        const newStatus = !isServiceMode;
        try {
            const response = await fetch(`${API_BASE_URL}/api/service-mode?enabled=${newStatus}&username=${user.username}`);
            if (!response.ok) throw new Error('Failed to update service mode');
            setIsServiceMode(newStatus);
        } catch (error) {
            console.error(error);
        }
    };

    const recentLogs = logs.slice(0, 5);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
                 <button onClick={onRefresh} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <RefreshIcon className="h-5 w-5"/>
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Total Chips</h3>
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">{chips.length}</p>
                </div>
                <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Allowed Chips</h3>
                    <p className="text-3xl font-bold text-green-500 mt-2">{chips.filter(c => c.is_allowed).length}</p>
                </div>
                <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">Total Logs Today</h3>
                    <p className="text-3xl font-bold text-yellow-500 mt-2">{logs.filter(l => new Date(l.timestamp).toDateString() === new Date().toDateString()).length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {(user.is_admin || user.permissions.remote_opening) && (
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Remote Opening</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Immediately unlock the main door. This action will be logged.</p>
                        <button
                            onClick={onRemoteOpening}
                            className="flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                        >
                            <RemoteIcon className="h-5 w-5" />
                            Unlock Door
                        </button>
                    </div>
                )}
                {(user.is_admin || user.permissions.service_mode) && (
                    <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Service Mode</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Keep the door permanently unlocked for maintenance or service.</p>
                        <div className="flex items-center">
                            <button
                                onClick={handleToggleServiceMode}
                                disabled={isLoadingServiceMode}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 ${
                                    isServiceMode ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                            >
                                <span
                                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                        isServiceMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isLoadingServiceMode ? 'Loading...' : (isServiceMode ? 'Enabled' : 'Disabled')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
            {(user.is_admin || user.permissions.view_logs) && (
                <div className="bg-white dark:bg-brand-dark p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                            <tr className="border-b dark:border-gray-700">
                                    <th className="p-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Timestamp</th>
                                    <th className="p-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Name</th>
                                    <th className="p-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Result</th>
                            </tr>
                            </thead>
                            <tbody>
                                {recentLogs.length > 0 ? recentLogs.map(log => (
                                <tr key={log.id} className="border-b dark:border-gray-700 last:border-b-0">
                                        <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-2 text-gray-600 dark:text-gray-300">{log.name}</td>
                                        <td className="p-2"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            log.result.startsWith('GRANTED') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        }`}>{log.result}</span></td>
                                </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="p-4 text-center text-gray-500 dark:text-gray-400">No recent activity.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;