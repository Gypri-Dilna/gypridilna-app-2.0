import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-backdrop-fade font-sans overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop my-auto max-h-[85vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
                    <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker flex-shrink-0">
                        <h2 id="modal-title" className="text-base font-extrabold text-white">
                            {chip ? 'Edit RFID Chip Profile' : 'Register New RFID Chip'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold text-gray-300 mb-1">Holder's Name *</label>
                            <input 
                                type="text" 
                                name="name" 
                                id="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition" 
                            />
                        </div>
                        <div>
                            <label htmlFor="chip_id" className="block text-xs font-semibold text-gray-300 mb-1">Chip ID *</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    name="chip_id" 
                                    id="chip_id" 
                                    value={formData.chip_id} 
                                    onChange={handleChange} 
                                    required 
                                    className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-brand-teal transition" 
                                />
                                <button
                                    type="button"
                                    onClick={handleScan}
                                    disabled={isScanning}
                                    className={`flex items-center gap-2 px-4 py-2.5 font-extrabold text-xs rounded-xl transition-all shadow flex-shrink-0 ${
                                        isScanning 
                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                        : 'bg-brand-teal hover:bg-brand-teal-hover text-black active:scale-95'
                                    }`}
                                >
                                    <ScanIcon className={`h-4 w-4 ${isScanning ? 'animate-pulse' : ''}`} />
                                    {isScanning ? 'Scanning...' : 'Scan Door Reader'}
                                </button>
                            </div>
                            {scanError && <p className="mt-1 text-xs text-rose-400 font-bold">{scanError}</p>}
                            {isScanning && <p className="mt-1 text-xs text-brand-teal font-mono font-bold animate-pulse">Scan a physical chip at the door reader now...</p>}
                        </div>
                        <div>
                            <label htmlFor="valid_until" className="block text-xs font-semibold text-gray-300 mb-1">Valid Until (optional)</label>
                            <input 
                                type="date" 
                                name="valid_until" 
                                id="valid_until" 
                                value={formData.valid_until} 
                                onChange={handleChange} 
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs focus:outline-none focus:border-brand-teal transition" 
                            />
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2">
                                <input 
                                    id="is_allowed" 
                                    name="is_allowed" 
                                    type="checkbox" 
                                    checked={formData.is_allowed} 
                                    onChange={handleChange} 
                                    className="h-4 w-4 rounded bg-brand-darker border-brand-border text-brand-teal focus:ring-0" 
                                />
                                <label htmlFor="is_allowed" className="text-xs font-bold text-white cursor-pointer">Allow Door Access</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                    id="is_one_time" 
                                    name="is_one_time" 
                                    type="checkbox" 
                                    checked={formData.is_one_time} 
                                    onChange={handleChange} 
                                    className="h-4 w-4 rounded bg-brand-darker border-brand-border text-brand-teal focus:ring-0" 
                                />
                                <label htmlFor="is_one_time" className="text-xs font-bold text-white cursor-pointer">One-Time Guest Pass</label>
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-darker px-6 py-4 flex justify-end gap-3 border-t border-brand-border">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 bg-brand-dark border border-brand-border text-gray-300 hover:text-white font-bold text-xs rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl transition shadow"
                        >
                            Save Chip Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};