import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { InventoryItem } from '../types';
import { CloseIcon, PrinterIcon, TagIcon } from './icons';
import { Logo } from './Logo';

interface LabelPrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
    onAddToQueue?: (item: InventoryItem, tapeSize: '18mm' | '9mm') => void;
    showPrintLater?: boolean;
}

export const LabelPrinterModal: React.FC<LabelPrinterModalProps> = ({ 
    isOpen, 
    onClose, 
    item, 
    onAddToQueue,
    showPrintLater = true 
}) => {
    const [tapeSize, setTapeSize] = useState<'18mm' | '9mm'>('18mm');
    const [isPrinting, setIsPrinting] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    if (!isOpen || !item) return null;

    const handlePrintBPac = async () => {
        setIsPrinting(true);
        setStatusMsg(null);

        try {
            const res = await fetch(`/api/inventory/${item.id}/print-label?tape_size=${tapeSize}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setStatusMsg({ type: 'success', text: data.message || `Štítek byl úspěšně vytisknut na tiskárně PT-D460BTVP (${tapeSize})` });
            } else {
                setStatusMsg({ type: 'error', text: data.detail || data.message || 'Chyba tisku b-PAC. Zkontrolujte připojení tiskárny.' });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Chyba připojení k tiskovému serveru b-PAC.' });
        } finally {
            setIsPrinting(false);
        }
    };

    const handleQueueClick = () => {
        if (onAddToQueue && item) {
            onAddToQueue(item, tapeSize);
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-backdrop-fade font-sans overflow-y-auto">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop my-auto max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-lg">
                            <PrinterIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Tiskárna štítků Brother PT-D460BTVP</h2>
                            <p className="text-xs text-gray-400">Přímý tisk štítků s kódem umístění</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Tape Size Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
                            Vyberte šířku pásky TZe:
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTapeSize('18mm')}
                                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    tapeSize === '18mm'
                                        ? 'bg-brand-teal text-black border-brand-teal shadow-lg shadow-brand-teal/10'
                                        : 'bg-brand-darker text-gray-300 border-brand-border hover:bg-slate-800'
                                }`}
                            >
                                <TagIcon className="h-4 w-4" /> 18 mm Standardní páska
                            </button>
                            <button
                                type="button"
                                onClick={() => setTapeSize('9mm')}
                                className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    tapeSize === '9mm'
                                        ? 'bg-brand-teal text-black border-brand-teal shadow-lg shadow-brand-teal/10'
                                        : 'bg-brand-darker text-gray-300 border-brand-border hover:bg-slate-800'
                                }`}
                            >
                                <TagIcon className="h-4 w-4" /> 9 mm Kompaktní páska
                            </button>
                        </div>
                    </div>

                    {/* Status Alert Banner */}
                    {statusMsg && (
                        <div
                            className={`p-3 rounded-xl text-xs font-semibold border ${
                                statusMsg.type === 'success'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                        >
                            {statusMsg.text}
                        </div>
                    )}

                    {/* Printer Details Card */}
                    <div className="bg-brand-darker p-3.5 rounded-xl border border-brand-border space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Cílová tiskárna:</span>
                            <span className="font-mono font-semibold text-brand-teal">Brother PT-D460BTVP</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Pásková kazeta:</span>
                            <span className="font-mono text-gray-200">
                                {tapeSize === '18mm' ? 'TZe-241 (18mm Černá na bílé)' : 'TZe-221 (9mm Černá na bílé)'}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Kód umístění:</span>
                            <span className="font-mono text-amber-400">{item.location_code}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-2.5 text-xs font-bold text-gray-400 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition text-center"
                        >
                            {showPrintLater ? 'Vytisknout později' : 'Zavřít'}
                        </button>

                        {onAddToQueue && (
                            <button
                                type="button"
                                onClick={handleQueueClick}
                                className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/40 rounded-xl transition active:scale-95 text-center"
                            >
                                <PrinterIcon className="h-4 w-4 text-brand-teal" />
                                <span>Přidat do fronty</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handlePrintBPac}
                            disabled={isPrinting}
                            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-black bg-brand-teal hover:bg-brand-teal-hover disabled:opacity-50 rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 text-center"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            {isPrinting ? 'Tisknu...' : `Vytisknout teď (${tapeSize})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
