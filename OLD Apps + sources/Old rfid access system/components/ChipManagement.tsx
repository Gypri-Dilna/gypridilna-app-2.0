
import React, { useState, useCallback } from 'react';
import { Chip } from '../types';
import { EditIcon, TrashIcon } from './icons';
import { ChipModal } from './ChipModal';
import { ConfirmationModal } from './ConfirmationModal';

interface ChipManagementProps {
    chips: Chip[];
    onAddChip: (newChip: Omit<Chip, 'id'>) => void;
    onUpdateChip: (updatedChip: Chip) => void;
    onDeleteChip: (chipId: number) => void;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const ChipManagement: React.FC<ChipManagementProps> = ({ chips, onAddChip, onUpdateChip, onDeleteChip, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedChip, setSelectedChip] = useState<Chip | null>(null);
    const [chipToDelete, setChipToDelete] = useState<Chip | null>(null);

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
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Chip Management</h1>
                <button
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    Add New Chip
                </button>
            </div>
            <div className="bg-white dark:bg-brand-dark rounded-lg shadow-md overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">Name</th>
                                <th scope="col" className="px-6 py-3">Chip ID</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3">Type</th>
                                <th scope="col" className="px-6 py-3">Valid Until</th>
                                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {chips.map((chip) => (
                                <tr key={chip.id} className="bg-white border-b dark:bg-brand-dark dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{chip.name}</td>
                                    <td className="px-6 py-4 font-mono">{chip.chip_id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${chip.is_allowed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                            {chip.is_allowed ? 'Allowed' : 'Blocked'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {chip.is_one_time ? 
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">One-Time</span> : 
                                            <span className="text-gray-500 dark:text-gray-400">Permanent</span>}
                                    </td>
                                    <td className="px-6 py-4">{chip.valid_until ? new Date(chip.valid_until).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-4">
                                            <button onClick={() => handleOpenEditModal(chip)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleOpenConfirmModal(chip)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Mobile Card List */}
                <div className="md:hidden">
                    {chips.map((chip) => (
                        <div key={chip.id} className="border-b dark:border-gray-700 p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">{chip.name}</p>
                                    <p className="font-mono text-sm text-gray-500 dark:text-gray-400">{chip.chip_id}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleOpenEditModal(chip)} className="p-2 text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenConfirmModal(chip)} className="p-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                <span className={`px-2 py-1 font-semibold rounded-full ${chip.is_allowed ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                                    {chip.is_allowed ? 'Allowed' : 'Blocked'}
                                </span>
                                {chip.is_one_time && (
                                    <span className="px-2 py-1 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">One-Time</span>
                                )}
                                {chip.valid_until && (
                                    <span className="px-2 py-1 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Expires: {new Date(chip.valid_until).toLocaleDateString()}</span>
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
                    title="Delete Chip"
                    message={`Are you sure you want to delete the chip for ${chipToDelete.name} (${chipToDelete.chip_id})? This action cannot be undone.`}
                />
            )}
        </div>
    );
};