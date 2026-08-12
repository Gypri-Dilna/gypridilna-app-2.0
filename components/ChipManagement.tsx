
import React, { useState, useCallback } from 'react';
import { Chip, User } from '../types';
import { EditIcon, TrashIcon, CheckSquareIcon, CloseIcon } from './icons';
import { ChipModal } from './ChipModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ChipManagementProps {
    user: User;
    chips: Chip[];
    onAddChip: (newChip: Omit<Chip, 'id'>) => void;
    onUpdateChip: (updatedChip: Chip) => void;
    onDeleteChip: (chipId: number) => void;
    onBatchDeleteChips?: (chipIds: number[]) => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const ChipManagement: React.FC<ChipManagementProps> = ({ 
    user, 
    chips, 
    onAddChip, 
    onUpdateChip, 
    onDeleteChip, 
    onBatchDeleteChips,
    showToast 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedChip, setSelectedChip] = useState<Chip | null>(null);
    const [chipToDelete, setChipToDelete] = useState<Chip | null>(null);

    // Batch Selection Mode State
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedChipIds, setSelectedChipIds] = useState<Set<number>>(new Set());
    const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState(false);

    const canEditChips = user.is_admin || user.permissions?.add_chips !== false;

    const toggleSelectChip = (id: number) => {
        setSelectedChipIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedChipIds.size === chips.length) {
            setSelectedChipIds(new Set());
        } else {
            setSelectedChipIds(new Set(chips.map(c => c.id)));
        }
    };

    const handleBatchDelete = async () => {
        const ids = Array.from(selectedChipIds);
        if (ids.length === 0) return;

        if (onBatchDeleteChips) {
            await onBatchDeleteChips(ids);
        } else {
            for (const id of ids) {
                await onDeleteChip(id);
            }
        }
        setSelectedChipIds(new Set());
        setIsSelectMode(false);
        setIsBatchConfirmOpen(false);
    };

    const handleOpenAddModal = useCallback(() => {
        setSelectedChip(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenEditModal = useCallback((chip: Chip) => {
        setSelectedChip(chip);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setSelectedChip(null);
    }, []);

    const handleSaveChip = useCallback((chip: Omit<Chip, 'id'> | Chip) => {
        if ('id' in chip) {
            onUpdateChip(chip);
        } else {
            onAddChip(chip);
        }
        handleCloseModal();
    }, [onUpdateChip, onAddChip, handleCloseModal]);

    const handleOpenConfirmModal = useCallback((chip: Chip) => {
        setChipToDelete(chip);
        setIsConfirmModalOpen(true);
    }, []);

    const handleCloseConfirmModal = useCallback(() => {
        setIsConfirmModalOpen(false);
        setChipToDelete(null);
    }, []);

    const confirmDelete = useCallback(() => {
        if (chipToDelete) {
            onDeleteChip(chipToDelete.id);
        }
        handleCloseConfirmModal();
    }, [chipToDelete, onDeleteChip, handleCloseConfirmModal]);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Seznam RFID čipů</h2>
                
                {canEditChips && (
                    <button
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                    >
                        Přidat nový čip
                    </button>
                )}
            </div>

            {/* Smooth Collapsible Animated Selection Bar directly ABOVE table */}
            <div className={`grid transition-all duration-300 ease-in-out ${
                isSelectMode ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'
            }`}>
                <div className="overflow-hidden">
                    <div className="bg-brand-dark border border-brand-teal/40 p-3 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="flex items-center gap-2 text-xs font-bold text-gray-200 hover:text-white bg-brand-darker hover:bg-[#343b47] px-3 py-1.5 rounded-xl border border-brand-border transition active:scale-95"
                            >
                                <input
                                    type="checkbox"
                                    checked={chips.length > 0 && selectedChipIds.size === chips.length}
                                    onChange={() => {}}
                                    className="w-4 h-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-brand-darker accent-brand-teal cursor-pointer pointer-events-none"
                                />
                                <span>Vybrat vše</span>
                            </button>

                            <span className="text-xs font-extrabold text-white font-mono bg-brand-darker px-3 py-1.5 rounded-xl border border-brand-border">
                                Vybráno: <span className="text-brand-teal font-extrabold">{selectedChipIds.size}</span> z {chips.length}
                            </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            {canEditChips && selectedChipIds.size > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setIsBatchConfirmOpen(true)}
                                    className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 animate-fadeIn"
                                >
                                    <TrashIcon className="h-4 w-4" />
                                    <span>Smazat vybrané čipy ({selectedChipIds.size})</span>
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setIsSelectMode(false);
                                    setSelectedChipIds(new Set());
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-brand-darker hover:bg-[#343b47] rounded-xl border border-brand-border transition flex items-center gap-1 active:scale-95"
                                title="Ukončit režim výběru"
                            >
                                <CloseIcon className="h-4 w-4" />
                                <span>Ukončit</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                <style>{`
                    @keyframes slideDownRow {
                        0% {
                            opacity: 0;
                            transform: translateY(-14px);
                        }
                        100% {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    .animate-slide-down {
                        animation: slideDownRow 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300 border-collapse">
                        <thead className="text-xs uppercase bg-[#343b47] text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th scope="col" className="px-3 py-3 w-12 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsSelectMode(!isSelectMode);
                                            if (isSelectMode) setSelectedChipIds(new Set());
                                        }}
                                        className={`p-1.5 rounded-lg border transition inline-flex items-center justify-center ${
                                            isSelectMode
                                                ? 'bg-brand-teal text-black border-brand-teal font-bold shadow-md'
                                                : 'bg-brand-darker text-gray-400 border-brand-border hover:text-white hover:bg-slate-800'
                                        }`}
                                        title={isSelectMode ? "Ukončit režim výběru" : "Aktivovat režim výběru"}
                                    >
                                        <CheckSquareIcon className="h-4 w-4" />
                                    </button>
                                </th>
                                {canEditChips && <th scope="col" className="px-4 py-4 w-24">AKCE</th>}
                                <th scope="col" className="px-6 py-4">JMÉNO</th>
                                <th scope="col" className="px-6 py-4">ID ČIPU</th>
                                <th scope="col" className="px-6 py-4">STAV</th>
                                <th scope="col" className="px-6 py-4">TYP</th>
                                <th scope="col" className="px-6 py-4">PLATNOST DO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border/60 text-xs">
                            {chips.map((chip) => (
                                <tr key={chip.id} className={`border-b border-brand-border/60 transition-all duration-300 animate-slide-down ${
                                    selectedChipIds.has(chip.id) ? 'bg-brand-teal/10' : 'bg-brand-dark hover:bg-[#343b47]/40'
                                }`}>
                                    {/* Centered Checkbox Column */}
                                    <td className="px-3 py-4 text-center align-middle">
                                        {isSelectMode && (
                                            <div className="flex items-center justify-center w-full">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChipIds.has(chip.id)}
                                                    onChange={() => toggleSelectChip(chip.id)}
                                                    className="w-4 h-4 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-brand-darker accent-brand-teal cursor-pointer"
                                                />
                                            </div>
                                        )}
                                    </td>
                                    {canEditChips && (
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-1.5">
                                                <button 
                                                    onClick={() => handleOpenEditModal(chip)} 
                                                    className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                    title="Upravit čip"
                                                >
                                                    <EditIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenConfirmModal(chip)} 
                                                    className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white font-bold rounded-xl shadow transition inline-flex items-center justify-center"
                                                    title="Smazat čip"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 font-bold text-white whitespace-nowrap">{chip.name}</td>
                                    <td className="px-6 py-4 font-mono text-gray-300">{chip.chip_id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                            chip.is_allowed 
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                        }`}>
                                            {chip.is_allowed ? 'Povoleno' : 'Zablokováno'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                        {chip.is_one_time ? 
                                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Jednorázový</span> : 
                                            <span className="text-gray-300">Trvalý</span>}
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">{chip.valid_until ? new Date(chip.valid_until).toLocaleDateString() : 'Bez omezení'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden divide-y divide-brand-border/60">
                    {chips.map((chip) => (
                        <div key={chip.id} className={`p-4 transition-all duration-300 animate-slide-down ${
                            selectedChipIds.has(chip.id) ? 'bg-brand-teal/10' : 'bg-brand-dark'
                        }`}>
                            <div className="flex justify-between items-start gap-3">
                                {isSelectMode && (
                                    <input
                                        type="checkbox"
                                        checked={selectedChipIds.has(chip.id)}
                                        onChange={() => toggleSelectChip(chip.id)}
                                        className="w-5 h-5 mt-0.5 rounded border-brand-border text-brand-teal focus:ring-brand-teal bg-brand-darker accent-brand-teal cursor-pointer"
                                    />
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-white">{chip.name}</p>
                                    <p className="font-mono text-xs text-gray-400 mt-0.5">{chip.chip_id}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenEditModal(chip)} 
                                        className="p-2 bg-brand-darker border border-brand-border text-brand-teal hover:bg-brand-teal hover:text-black rounded-xl transition"
                                    >
                                        <EditIcon className="h-4 w-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleOpenConfirmModal(chip)} 
                                        className="p-2 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className={`px-2.5 py-0.5 font-bold rounded-full border ${
                                    chip.is_allowed 
                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}>
                                    {chip.is_allowed ? 'Povoleno' : 'Zablokováno'}
                                </span>
                                {chip.is_one_time && (
                                    <span className="px-2.5 py-0.5 font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Jednorázový</span>
                                )}
                                {chip.valid_until && (
                                    <span className="px-2.5 py-0.5 font-bold rounded-full bg-brand-darker text-gray-300 border border-brand-border">Platí do: {new Date(chip.valid_until).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>



            {isModalOpen && <ChipModal chip={selectedChip} chips={chips} onClose={handleCloseModal} onSave={handleSaveChip} showToast={showToast} />}
            
            {isConfirmModalOpen && chipToDelete && (
                <ConfirmationModal
                    isOpen={isConfirmModalOpen}
                    onClose={handleCloseConfirmModal}
                    onConfirm={confirmDelete}
                    title="Smazat RFID čip"
                    message={`Opravdu chcete smazat RFID čip pro ${chipToDelete.name} (${chipToDelete.chip_id})? Tato akce je nevratná.`}
                />
            )}

            {isBatchConfirmOpen && (
                <ConfirmationModal
                    isOpen={isBatchConfirmOpen}
                    onClose={() => setIsBatchConfirmOpen(false)}
                    onConfirm={handleBatchDelete}
                    title="Hromadné mazání RFID čipů"
                    message={`Opravdu chcete smazat ${selectedChipIds.size} vybraných RFID čipů? Tato akce je nevratná.`}
                />
            )}
        </div>
    );
};