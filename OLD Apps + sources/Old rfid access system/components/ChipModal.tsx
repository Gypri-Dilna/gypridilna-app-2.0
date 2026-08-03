import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { Chip } from '../types';
import { CloseIcon, ScanIcon } from './icons';

interface ChipModalProps {
    chip: Chip | null;
    chips: Chip[];
    onClose: () => void;
    onSave: (chip: Omit<Chip, 'id'> | Chip) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const ChipModal: React.FC<ChipModalProps> = ({ chip, chips, onClose, onSave, showToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        chip_id: '',
        is_allowed: true,
        is_one_time: false,
        valid_until: '',
    });
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    useEffect(() => {
        if (chip) {
            setFormData({
                name: chip.name,
                chip_id: chip.chip_id,
                is_allowed: chip.is_allowed,
                is_one_time: chip.is_one_time,
                valid_until: chip.valid_until ? chip.valid_until.split('T')[0] : '',
            });
        }
    }, [chip]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleScan = useCallback(() => {
        setIsScanning(true);
        setScanError(null);

        const interval = setInterval(async () => {
            try {
                const response = await fetch('/api/last-unknown-chip');
                const data = await response.json();

                if (data.chip_id) {
                    const existingChip = chips.find(c => c.chip_id === data.chip_id);
                    if (existingChip) {
                        showToast(`Chip is already registered to ${existingChip.name}.`, 'error');
                    } else {
                        setFormData(prev => ({ ...prev, chip_id: data.chip_id }));
                        showToast('New chip scanned successfully!', 'success');
                    }
                    setIsScanning(false);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Polling error:', error);
                setScanError('Could not connect to the server.');
                setIsScanning(false);
                clearInterval(interval);
            }
        }, 2000); // Poll every 2 seconds

        // Stop scanning after 30 seconds
        setTimeout(() => {
            if (isScanning) {
                setIsScanning(false);
                clearInterval(interval);
                setScanError('Scan timed out. Please try again.');
            }
        }, 30000);

    }, [chips, showToast, isScanning]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const submissionData = {
            ...formData,
            valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        };
        if (chip) {
            onSave({ ...chip, ...submissionData });
        } else {
            onSave(submissionData);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-xl w-full max-w-lg mx-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-center">
                            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                                {chip ? 'Edit Chip' : 'Add New Chip'}
                            </h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Holder's Name</label>
                                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="chip_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Chip ID</label>
                                <div className="mt-1 flex gap-2">
                                    <input 
                                        type="text" 
                                        name="chip_id" 
                                        id="chip_id" 
                                        value={formData.chip_id} 
                                        onChange={handleChange} 
                                        required 
                                        className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono" 
                                    />
                                    <button
                                        type="button"
                                        onClick={handleScan}
                                        disabled={isScanning}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all ${
                                            isScanning 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                                        }`}
                                    >
                                        <ScanIcon className={`h-4 w-4 ${isScanning ? 'animate-pulse' : ''}`} />
                                        {isScanning ? 'Scanning...' : 'Start Scanning'}
                                    </button>
                                </div>
                                {scanError && <p className="mt-1 text-xs text-red-500 font-medium">{scanError}</p>}
                                {isScanning && <p className="mt-1 text-xs text-primary-500 font-medium animate-pulse">Now scan a chip at the main door reader...</p>}
                            </div>
                            <div>
                                <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Valid Until (optional)</label>
                                <input type="date" name="valid_until" id="valid_until" value={formData.valid_until} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                            </div>
                            <div className="flex items-center space-x-8">
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input id="is_allowed" name="is_allowed" type="checkbox" checked={formData.is_allowed} onChange={handleChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="is_allowed" className="font-medium text-gray-700 dark:text-gray-300">Allow Access</label>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input id="is_one_time" name="is_one_time" type="checkbox" checked={formData.is_one_time} onChange={handleChange} className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded" />
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="is_one_time" className="font-medium text-gray-700 dark:text-gray-300">One-Time Chip</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Cancel
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                            Save Chip
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};