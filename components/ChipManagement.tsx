
import React, { useState, useCallback } from 'react';
import { Chip } from '../types';
import { EditIcon, TrashIcon } from './icons';
import { ChipModal } from './ChipModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ChipManagementProps {
    user: User;
    chips: Chip[];
    onAddChip: (newChip: Omit<Chip, 'id'>) => void;
    onUpdateChip: (updatedChip: Chip) => void;
    onDeleteChip: (chipId: number) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const ChipManagement: React.FC<ChipManagementProps> = ({ user, chips, onAddChip, onUpdateChip, onDeleteChip, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedChip, setSelectedChip] = useState<Chip | null>(null);
    const [chipToDelete, setChipToDelete] = useState<Chip | null>(null);

    const canEditChips = user.is_admin || user.permissions?.add_chips !== false;

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
            <div className="flex justify-between items-center mb-6">
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
            <div className="bg-brand-dark border border-brand-border rounded-xl shadow-md overflow-hidden font-sans">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#343b47] text-gray-400 font-bold tracking-wider">
                            <tr>
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
                                <tr key={chip.id} className="bg-brand-dark border-b border-brand-border/60 hover:bg-[#343b47]/40 transition">
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
                        <div key={chip.id} className="p-4 bg-brand-dark">
                            <div className="flex justify-between items-start">
                                <div>
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
        </div>
    );
};