import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { InventoryItem, PrintQueueItem } from '../types';
import { PrinterIcon, CloseIcon, TrashIcon, TagIcon } from './icons';

interface PrintQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    queue: PrintQueueItem[];
    onRemoveFromQueue: (index: number) => void;
    onClearQueue: () => void;
    onUpdateQueueItemTape: (index: number, tape_size: '18mm' | '9mm') => void;
    onBulkUpdateQueueTape: (tape_size: '18mm' | '9mm') => void;
    onPrintQueue: () => Promise<void>;
    showToast: (message: string, type: 'success' | 'error') => void;
}

export const PrintQueueModal: React.FC<PrintQueueModalProps> = ({
    isOpen,
    onClose,
    queue,
    onRemoveFromQueue,
    onClearQueue,
    onUpdateQueueItemTape,
    onBulkUpdateQueueTape,
    onPrintQueue,
    showToast
}) => {
    const [isPrinting, setIsPrinting] = useState<boolean>(false);

    // Lock background page scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBatchPrint = async () => {
        if (queue.length === 0) return;
        setIsPrinting(true);
        try {
            await onPrintQueue();
        } catch (e: any) {
            showToast(e.message || 'Chyba při tisku fronty.', 'error');
        } finally {
            setIsPrinting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-backdrop-fade font-sans overflow-y-auto">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-modal-pop my-auto flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-lg relative">
                            <PrinterIcon className="h-6 w-6" />
                            {queue.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-brand-teal text-black text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono shadow">
                                    {queue.length}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Tisková fronta</h2>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Queue Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* Queued Items List */}
                    {queue.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                            <PrinterIcon className="h-10 w-10 text-gray-500 mx-auto opacity-50" />
                            <p className="text-xs font-bold text-gray-400">Tisková fronta je aktuálně prázdná.</p>
                            <p className="text-[11px] text-gray-500">Přidejte položky do fronty z detailu položky nebo při vytváření nového záznamu.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {queue.map((qItem, idx) => (
                                <div
                                    key={qItem.item.id + '_' + idx}
                                    className="p-3.5 bg-brand-darker border border-brand-border rounded-xl flex items-center justify-between gap-3 shadow-sm hover:border-brand-teal/40 transition"
                                >
                                    <div className="overflow-hidden flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-brand-teal bg-black px-2 py-0.5 rounded border border-brand-teal/30">
                                                {qItem.item.location_code}
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400 truncate">{qItem.item.category}</span>
                                        </div>
                                        <h4 className="text-xs font-bold text-white truncate mt-1">{qItem.item.title}</h4>
                                    </div>

                                    {/* Tape Size Selector */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQueueItemTape(idx, '18mm')}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                                                qItem.tape_size === '18mm'
                                                    ? 'bg-brand-teal text-black border-brand-teal'
                                                    : 'bg-slate-800 text-gray-400 border-brand-border hover:text-white'
                                            }`}
                                        >
                                            18mm
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQueueItemTape(idx, '9mm')}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                                                qItem.tape_size === '9mm'
                                                    ? 'bg-brand-teal text-black border-brand-teal'
                                                    : 'bg-slate-800 text-gray-400 border-brand-border hover:text-white'
                                            }`}
                                        >
                                            9mm
                                        </button>

                                        {/* Remove Item Button */}
                                        <button
                                            type="button"
                                            onClick={() => onRemoveFromQueue(idx)}
                                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition ml-1"
                                            title="Odstranit z fronty"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions Footer */}
                <div className="p-4 border-t border-brand-border bg-brand-darker flex flex-wrap items-center justify-between gap-3">
                    {queue.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Bulk tape-size toggle */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-gray-500 mr-1">Vše na:</span>
                                <button
                                    type="button"
                                    onClick={() => onBulkUpdateQueueTape('18mm')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                                        queue.every(q => q.tape_size === '18mm')
                                            ? 'bg-brand-teal text-black border-brand-teal'
                                            : 'bg-slate-800 text-gray-400 border-brand-border hover:text-white'
                                    }`}
                                >
                                    18mm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onBulkUpdateQueueTape('9mm')}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition ${
                                        queue.every(q => q.tape_size === '9mm')
                                            ? 'bg-brand-teal text-black border-brand-teal'
                                            : 'bg-slate-800 text-gray-400 border-brand-border hover:text-white'
                                    }`}
                                >
                                    9mm
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onClearQueue}
                                className="px-4 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition font-mono"
                            >
                                Vyprázdnit frontu
                            </button>
                        </div>
                    ) : <div />}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-xs font-bold text-gray-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                        >
                            Zavřít
                        </button>

                        {queue.length > 0 && (
                            <button
                                type="button"
                                onClick={handleBatchPrint}
                                disabled={isPrinting}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black text-xs font-extrabold rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 disabled:opacity-50"
                            >
                                <PrinterIcon className="h-4 w-4" />
                                {isPrinting ? 'Tisknu dávku...' : `Vytisknout celou frontu (${queue.length})`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
