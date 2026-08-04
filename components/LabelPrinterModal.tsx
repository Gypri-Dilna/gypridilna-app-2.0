import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { InventoryItem } from '../types';
import { CloseIcon, PrinterIcon, TagIcon } from './icons';
import { Logo } from './Logo';

interface LabelPrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
}

export const LabelPrinterModal: React.FC<LabelPrinterModalProps> = ({ isOpen, onClose, item }) => {
    const [tapeSize, setTapeSize] = useState<'18mm' | '9mm'>('18mm');
    const [isPrinting, setIsPrinting] = useState<boolean>(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
                setStatusMsg({ type: 'success', text: data.message || `Label successfully printed on PT-D460BTVP (${tapeSize})` });
            } else {
                setStatusMsg({ type: 'error', text: data.detail || data.message || 'b-PAC printing error. Check printer workstation status.' });
            }
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: 'Failed to connect to backend b-PAC printer agent.' });
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-backdrop-fade font-sans">
            <div className="bg-brand-dark border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-modal-pop">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-brand-darker">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-teal/10 text-brand-teal rounded-lg">
                            <PrinterIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-base font-extrabold text-white">Brother PT-D460BTVP b-PAC Engine</h2>
                            <p className="text-xs text-gray-400">Direct SDK Print Workstation Integration</p>
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
                            Select TZe Tape Size:
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
                                <TagIcon className="h-4 w-4" /> 18 mm Standard Tape
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
                                <TagIcon className="h-4 w-4" /> 9 mm Compact Tape
                            </button>
                        </div>
                    </div>

                    {/* Live Label Preview */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Live Print Layout Preview ({tapeSize})
                        </label>
                        <div className="flex justify-center p-6 bg-brand-bg border border-brand-border rounded-xl">
                            {tapeSize === '18mm' ? (
                                /* 18mm Standard Tape Preview */
                                <div className="w-[260px] h-[72px] bg-white text-black p-1.5 flex items-center justify-between rounded shadow-md border border-gray-300 select-none overflow-hidden">
                                    <div className="bg-white p-1 rounded flex-shrink-0">
                                        <QRCodeSVG value={item.location_code || item.qr_code} size={52} level="M" includeMargin={false} />
                                    </div>
                                    <div className="flex-1 px-2 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <Logo variant="full" className="h-2.5 w-auto flex-shrink-0" />
                                            <span className="text-[8px] font-black uppercase tracking-tight text-gray-900 leading-none truncate">
                                                gypri dílna
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-extrabold text-black leading-snug truncate">{item.title}</p>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="bg-black text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded leading-none">
                                                {item.location_code}
                                            </span>
                                            <span className="text-[8px] font-mono text-gray-600 truncate">{item.category}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* 9mm Compact Tape Preview */
                                <div className="w-[240px] h-[40px] bg-white text-black p-1 flex items-center justify-between rounded shadow-md border border-gray-300 select-none overflow-hidden">
                                    <div className="bg-white p-0.5 rounded flex-shrink-0">
                                        <QRCodeSVG value={item.location_code || item.qr_code} size={30} level="M" includeMargin={false} />
                                    </div>
                                    <div className="flex-1 px-2 flex items-center justify-between">
                                        <span className="bg-black text-white text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded leading-none">
                                            {item.location_code}
                                        </span>
                                        <span className="text-[8px] font-bold text-gray-800 truncate max-w-[90px]">{item.title}</span>
                                    </div>
                                </div>
                            )}
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
                            <span className="text-gray-400">Target Printer:</span>
                            <span className="font-mono font-semibold text-brand-teal">Brother PT-D460BTVP</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Tape Cassette:</span>
                            <span className="font-mono text-gray-200">
                                {tapeSize === '18mm' ? 'TZe-241 (18mm Black on White)' : 'TZe-221 (9mm Black on White)'}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Location Tag:</span>
                            <span className="font-mono text-amber-400">{item.location_code}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handlePrintBPac}
                            disabled={isPrinting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-black bg-brand-teal hover:bg-brand-teal-hover disabled:opacity-50 rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            {isPrinting ? 'Printing via b-PAC...' : `Print ${tapeSize} Label`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
