import React, { useState, useCallback, FormEvent } from 'react';
import { Presence, HistoricalPresence } from '../types';
import { RefreshIcon } from './icons';

const API_BASE_URL = ''; // Use relative paths

interface PresenceViewerProps {
    currentPresence: Presence[];
    onRefresh: () => void;
}

// Helper to format date for datetime-local input
const toDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const PresenceViewer: React.FC<PresenceViewerProps> = ({ currentPresence, onRefresh }) => {
    const [lookupTime, setLookupTime] = useState<string>(toDateTimeLocal(new Date()));
    const [historicalResults, setHistoricalResults] = useState<HistoricalPresence[] | null>(null);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const handleHistoricalSearch = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        setSearchError(null);
        setHistoricalResults(null);
        
        try {
            const timestamp = new Date(lookupTime).toISOString();
            const response = await fetch(`${API_BASE_URL}/api/presence/historical?timestamp=${timestamp}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch historical data');
            }
            const data: HistoricalPresence[] = await response.json();
            setHistoricalResults(data);
        } catch (error) {
            console.error(error);
            setSearchError(error instanceof Error ? error.message : 'An unknown error occurred.');
        } finally {
            setIsSearching(false);
        }
    }, [lookupTime]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Presence</h1>
            
            {/* Current Presence Section */}
            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-md overflow-hidden mb-8">
                 <div className="p-6 flex justify-between items-center border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Currently in the Room ({currentPresence.length})</h2>
                    <button onClick={onRefresh} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <RefreshIcon className="h-5 w-5"/>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Chip ID</th>
                                <th scope="col" className="px-6 py-3">Entered At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPresence.length > 0 ? currentPresence.map((p) => (
                                <tr key={p.chip_id} className="bg-white border-b dark:bg-brand-dark dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{p.name}</td>
                                    <td className="px-6 py-4 font-mono">{p.chip_id}</td>
                                    <td className="px-6 py-4">{new Date(p.entry_time).toLocaleString()}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">The room is currently empty.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historical Lookup Section */}
            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Historical Presence Lookup</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a date and time to see who was in the room.</p>
                </div>
                <form onSubmit={handleHistoricalSearch} className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input
                            type="datetime-local"
                            value={lookupTime}
                            onChange={(e) => setLookupTime(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="w-full sm:w-auto px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-primary-400 disabled:cursor-not-allowed"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>

                {searchError && <p className="px-6 pb-4 text-sm text-red-500">{searchError}</p>}

                {historicalResults && (
                     <div className="overflow-x-auto">
                        <div className="px-6 pb-4">
                             <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Results for {new Date(lookupTime).toLocaleString()}: ({historicalResults.length} found)</h3>
                        </div>
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Name</th>
                                    <th scope="col" className="px-6 py-3">Chip ID</th>
                                    <th scope="col" className="px-6 py-3">Last Entry Before Lookup</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historicalResults.length > 0 ? historicalResults.map((p) => (
                                    <tr key={p.chip_id} className="bg-white border-b dark:bg-brand-dark dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{p.name}</td>
                                        <td className="px-6 py-4 font-mono">{p.chip_id}</td>
                                        <td className="px-6 py-4">{new Date(p.entry_time).toLocaleString()}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">No one was in the room at the selected time.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};