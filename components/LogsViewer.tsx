import React, { useMemo, useState } from 'react';
import { AccessLog, AccessResult, User } from '../types';
import { RefreshIcon, TrashIcon, DownloadIcon } from './icons';
import { ConfirmationModal } from './ConfirmationModal';

interface LogsViewerProps {
    user: User;
    logs: AccessLog[];
    onRefresh: () => void;
}

export const LogsViewer: React.FC<LogsViewerProps> = ({ user, logs, onRefresh }) => {
    const [filter, setFilter] = useState('');
    const [selectedUser, setSelectedUser] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const users = useMemo(() => {
        const userSet = new Set(logs.map(log => log.name));
        return ['All Users', ...Array.from(userSet).sort()];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];

            // Date filter
            if (selectedDate && logDate !== selectedDate) {
                return false;
            }
            // User filter
            if (selectedUser !== 'all' && log.name !== selectedUser) {
                return false;
            }
            // Text search filter
            const searchTerm = filter.toLowerCase();
            if (searchTerm && 
                !log.name.toLowerCase().includes(searchTerm) &&
                !log.chip_id.toLowerCase().includes(searchTerm) &&
                !log.result.toLowerCase().includes(searchTerm)
            ) {
                return false;
            }
            return true;
        });
    }, [logs, filter, selectedUser, selectedDate]);

    const handleClearFilters = () => {
        setFilter('');
        setSelectedUser('all');
        setSelectedDate('');
    };

    const handleDeleteAllLogs = async () => {
        try {
            const response = await fetch('/api/logs', { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('Failed to delete logs');
            }
            onRefresh(); // Refresh the logs list
        } catch (error) {
            console.error('Error deleting logs:', error);
        }
        setIsConfirmModalOpen(false);
    };
    
    const getResultColor = (result: AccessResult) => {
        switch (result) {
            case AccessResult.GRANTED:
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case AccessResult.DENIED_BLOCKED:
            case AccessResult.DENIED_EXPIRED:
            case AccessResult.DENIED_UNKNOWN:
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Access Logs</h1>
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full sm:w-auto flex-grow max-w-sm px-4 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <select 
                    value={selectedUser} 
                    onChange={e => setSelectedUser(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    {users.map(user => (
                        <option key={user} value={user}>{user === 'all' ? 'All Users' : user}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                 <button onClick={handleClearFilters} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                    Clear Filters
                </button>
                <div className="ml-auto flex items-center gap-2">
                    <a href="/api/logs/export" download="access_logs.csv" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors">
                        <DownloadIcon className="h-4 w-4" />
                        Export CSV
                    </a>
                    {(user.is_admin || user.permissions.erase_logs) && (
                        <button onClick={() => setIsConfirmModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">
                            <TrashIcon className="h-4 w-4" />
                            Delete All
                        </button>
                    )}
                </div>
                <button onClick={onRefresh} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <RefreshIcon className="h-5 w-5"/>
                </button>
            </div>
            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-md overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Timestamp</th>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Chip ID</th>
                                <th scope="col" className="px-6 py-3">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="bg-white border-b dark:bg-brand-dark dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{log.name}</td>
                                    <td className="px-6 py-4 font-mono">{log.chip_id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(log.result)}`}>
                                            {log.result}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        No logs found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card List */}
                <div className="md:hidden">
                    {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                        <div key={log.id} className="border-b dark:border-gray-700 p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{log.name}</p>
                                    <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{log.chip_id}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(log.result)}`}>
                                    {log.result}
                                </span>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    )) : (
                        <p className="p-4 text-center text-gray-500 dark:text-gray-400">No logs found matching your criteria.</p>
                    )}
                </div>
            </div>
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleDeleteAllLogs}
                    title="Delete All Logs"
                    message="Are you sure you want to permanently delete all access logs? This action cannot be undone."
                    confirmText="Yes, delete all"
                />
            )}
        </div>
    );
};