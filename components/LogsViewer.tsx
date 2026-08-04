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
        return ['Všichni uživatelé', ...Array.from(userSet).sort()];
    }, [logs]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];

            // Date filter
            if (selectedDate && logDate !== selectedDate) {
                return false;
            }
            // User filter
            if (selectedUser !== 'all' && selectedUser !== 'Všichni uživatelé' && log.name !== selectedUser) {
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
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-6">Kniha přístupů</h1>
            <div className="mb-4 flex flex-wrap items-center gap-4">
                <input
                    type="text"
                    placeholder="Hledat v záznamech..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full sm:w-auto flex-grow max-w-sm px-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:border-brand-teal"
                />
                <select 
                    value={selectedUser} 
                    onChange={e => setSelectedUser(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brand-teal"
                >
                    {users.map(u => (
                        <option key={u} value={u}>{u === 'all' ? 'Všichni uživatelé' : u}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-gray-200 focus:outline-none focus:border-brand-teal"
                />
                 <button onClick={handleClearFilters} className="px-4 py-2 text-xs font-bold text-gray-300 bg-brand-darker border border-brand-border rounded-xl hover:bg-slate-800 transition">
                    Vymazat filtry
                </button>
                <div className="ml-auto flex items-center gap-2">
                    <a href="/api/logs/export" download="access_logs.csv" className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-brand-teal hover:bg-brand-teal-hover rounded-xl shadow transition">
                        <DownloadIcon className="h-4 w-4" />
                        Exportovat CSV
                    </a>
                    {(user.is_admin || user.permissions.erase_logs) && (
                        <button onClick={() => setIsConfirmModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition">
                            <TrashIcon className="h-4 w-4" />
                            Smazat vše
                        </button>
                    )}
                </div>
                <button onClick={onRefresh} className="p-2.5 rounded-xl text-gray-300 bg-brand-darker border border-brand-border hover:bg-slate-800 transition">
                    <RefreshIcon className="h-4 w-4"/>
                </button>
            </div>
            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#343b47] text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th scope="col" className="px-6 py-4">DATUM A ČAS</th>
                                <th scope="col" className="px-6 py-4">JMÉNO</th>
                                <th scope="col" className="px-6 py-4">ID ČIPU</th>
                                <th scope="col" className="px-6 py-4">VÝSLEDEK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="bg-brand-dark border-b border-brand-border/60 hover:bg-[#343b47]/40 transition">
                                    <td className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{log.name}</td>
                                    <td className="px-6 py-4 font-mono">{log.chip_id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${getResultColor(log.result)}`}>
                                            {log.result}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 font-mono">
                                        Žádné záznamy neodpovídají zadaným kritériím.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-brand-border/60">
                    {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                        <div key={log.id} className="p-4 bg-brand-dark">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-white">{log.name}</p>
                                    <p className="font-mono text-xs text-gray-400 mt-0.5">{log.chip_id}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${getResultColor(log.result)}`}>
                                    {log.result}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                    )) : (
                        <p className="p-4 text-center text-gray-400 font-mono">Žádné záznamy neodpovídají zadaným kritériím.</p>
                    )}
                </div>
            </div>
            {isConfirmModalOpen && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onConfirm={handleDeleteAllLogs}
                    title="Smazat všechny záznamy"
                    message="Opravdu chcete trvale smazat všechny záznamy o průchodech? Tato akce je nevratná."
                    confirmText="Ano, smazat vše"
                />
            )}
        </div>
    );
};