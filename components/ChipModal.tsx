import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Chip } from '../types';
import { CloseIcon, ScanIcon } from './icons';
import { triggerHaptic, soundEffects, isWebNfcSupported, isNativeMobileApp } from '../mobile';

interface ChipModalProps {
    chip: Chip | null;
    chips: Chip[];
    onClose: () => void;
    onSave: (chip: Omit<Chip, 'id'> | Chip) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const removeDiacritics = (str: string): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/Ł/g, 'L')
        .replace(/ł/g, 'l')
        .replace(/Đ/g, 'D')
        .replace(/đ/g, 'd');
};

export const ChipModal: React.FC<ChipModalProps> = ({ chip, chips, onClose, onSave, showToast }) => {
    const [formData, setFormData] = useState({
        name: '',
        chip_id: '',
        is_allowed: true,
        is_one_time: false,
        valid_until: '',
    });
    const [isScanning, setIsScanning] = useState(false);
    const [isNfcScanning, setIsNfcScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);

    const handlePhoneNfcScan = async () => {
        if (!('NDEFReader' in window)) {
            showToast('Váš telefon nebo prohlížeč nepodporuje přímé čtení NFC.', 'error');
            return;
        }

        try {
            setIsNfcScanning(true);
            setScanError(null);
            triggerHaptic('heavy');

            const ndef = new (window as any).NDEFReader();
            await ndef.scan();
            showToast('NFC čtečka aktivní! Přiložte RFID čip k zádům telefonu...', 'success');

            ndef.onreading = (event: any) => {
                const serial = event.serialNumber || '';
                if (serial) {
                    // Normalize UID (e.g. "04:a2:3b:4c" -> "04A23B4C")
                    const cleanHex = serial.replace(/[:\s-]/g, '').toUpperCase();
                    
                    const existingChip = chips.find(c => c.chip_id.toUpperCase() === cleanHex);
                    if (existingChip) {
                        showToast(`Tento čip je již zaregistrován pro: ${existingChip.name}`, 'error');
                        triggerHaptic('error');
                        soundEffects.playErrorBuzz();
                    } else {
                        setFormData(prev => ({ ...prev, chip_id: cleanHex }));
                        triggerHaptic('success');
                        soundEffects.playChipBeep();
                        showToast(`RFID čip načten mobilem: ${cleanHex}`, 'success');
                    }
                    setIsNfcScanning(false);
                }
            };

            ndef.onreadingerror = () => {
                showToast('Chyba při čtení NFC čipu. Zkuste přiložit znovu.', 'error');
                triggerHaptic('error');
            };
        } catch (err: any) {
            console.error('NFC error:', err);
            setIsNfcScanning(false);
            setScanError(`Chyba NFC: ${err.message || 'Nelze aktivovat NFC čtečku.'}`);
            showToast('Nepodařilo se aktivovat NFC čtečku telefonu.', 'error');
        }
    };

    useEffect(() => {
        if (chip) {
            setFormData({
                name: removeDiacritics(chip.name),
                chip_id: chip.chip_id,
                is_allowed: chip.is_allowed,
                is_one_time: chip.is_one_time,
                valid_until: chip.valid_until ? chip.valid_until.split('T')[0] : '',
            });
        }
    }, [chip]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const finalValue = (type !== 'checkbox' && name === 'name') ? removeDiacritics(value) : (type === 'checkbox' ? checked : value);
        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
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
                        showToast(`Čip je již zaregistrován pro držitele ${existingChip.name}.`, 'error');
                    } else {
                        setFormData(prev => ({ ...prev, chip_id: data.chip_id }));
                        showToast('Nový RFID čip byl úspěšně naskenován!', 'success');
                    }
                    setIsScanning(false);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error('Polling error:', error);
                setScanError('Nelze se připojit k serveru.');
                setIsScanning(false);
                clearInterval(interval);
            }
        }, 2000); // Poll every 2 seconds

        // Stop scanning after 30 seconds
        setTimeout(() => {
            if (isScanning) {
                setIsScanning(false);
                clearInterval(interval);
                setScanError('Vypršel čas skenování. Zkuste to prosím znovu.');
            }
        }, 30000);

    }, [chips, showToast, isScanning]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const sanitizedName = removeDiacritics(formData.name).trim();
        const submissionData = {
            ...formData,
            name: sanitizedName,
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
                            {chip ? 'Upravit profil RFID čipu' : 'Registrovat nový RFID čip'}
                        </h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                        <div>
                            <label htmlFor="name" className="block text-xs font-semibold text-gray-300 mb-1">Jméno držitele (bez diakritiky) *</label>
                            <input 
                                type="text" 
                                name="name" 
                                id="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                placeholder="např. Ondrej Moudry"
                                className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs placeholder-gray-400 focus:outline-none focus:border-brand-teal transition" 
                            />
                            <p className="text-[10px] text-brand-teal mt-1">Háčky a čárky se automaticky přepisují na základní písmena bez diakritiky.</p>
                        </div>
                        <div>
                            <label htmlFor="chip_id" className="block text-xs font-semibold text-gray-300 mb-1">ID čipu *</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input 
                                    type="text" 
                                    name="chip_id" 
                                    id="chip_id" 
                                    value={formData.chip_id} 
                                    onChange={handleChange} 
                                    required 
                                    placeholder="např. 04A23B4C nebo 12345678"
                                    className="w-full px-4 py-2.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs font-mono placeholder-gray-400 focus:outline-none focus:border-brand-teal transition" 
                                />
                                <div className="flex gap-2 flex-shrink-0">
                                    {(isWebNfcSupported() || isNativeMobileApp()) && (
                                        <button
                                            type="button"
                                            onClick={handlePhoneNfcScan}
                                            disabled={isNfcScanning || isScanning}
                                            className={`flex items-center gap-1.5 px-3.5 py-2.5 font-extrabold text-xs rounded-xl transition shadow active:scale-95 ${
                                                isNfcScanning 
                                                    ? 'bg-amber-500 text-black animate-pulse' 
                                                    : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black shadow-teal-500/20'
                                            }`}
                                            title="Přiložit RFID čip přímo k telefonu"
                                        >
                                            <span>📱</span>
                                            <span>{isNfcScanning ? 'Čtu NFC...' : 'Přiložit k mobilu'}</span>
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleScan}
                                        disabled={isScanning || isNfcScanning}
                                        className={`flex items-center gap-1.5 px-3 py-2.5 font-bold text-xs rounded-xl transition-all shadow ${
                                            isScanning 
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                            : 'bg-slate-800 hover:bg-slate-700 border border-brand-border text-gray-200 active:scale-95'
                                        }`}
                                        title="Čekat na přiložení čipu ke krabičce u dveří"
                                    >
                                        <ScanIcon className={`h-4 w-4 ${isScanning ? 'animate-pulse text-brand-teal' : ''}`} />
                                        <span>{isScanning ? 'Čekám u dveří...' : 'Čtečka u dveří'}</span>
                                    </button>
                                </div>
                            </div>
                            {scanError && <p className="mt-1 text-xs text-rose-400 font-bold">{scanError}</p>}
                            {isScanning && <p className="mt-1 text-xs text-brand-teal font-mono font-bold animate-pulse">Přiložte fyzický čip ke čtečce u dveří...</p>}
                            {isNfcScanning && (
                                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300 animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base">📡</span>
                                        <span className="font-bold">Přiložte RFID klíčenku nebo kartu k zádům telefonu...</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsNfcScanning(false)}
                                        className="text-gray-400 hover:text-white font-bold underline text-[11px]"
                                    >
                                        Zrušit
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label htmlFor="valid_until" className="block text-xs font-semibold text-gray-300 mb-1">Platnost do (volitelné)</label>
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
                                <label htmlFor="is_allowed" className="text-xs font-bold text-white cursor-pointer">Povolit přístup k dveřím</label>
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
                                <label htmlFor="is_one_time" className="text-xs font-bold text-white cursor-pointer">Jednorázový přístup (host)</label>
                            </div>
                        </div>
                    </div>
                    <div className="bg-brand-darker px-6 py-4 flex justify-end gap-3 border-t border-brand-border">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 bg-brand-dark border border-brand-border text-gray-300 hover:text-white font-bold text-xs rounded-xl transition"
                        >
                            Zrušit
                        </button>
                        <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl transition shadow"
                        >
                            Uložit profil čipu
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};