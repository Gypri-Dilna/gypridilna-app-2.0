import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { InventoryItem } from '../types';
import { CloseIcon, PrinterIcon, TagIcon } from './icons';

interface LabelPrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InventoryItem | null;
}

export const LabelPrinterModal: React.FC<LabelPrinterModalProps> = ({ isOpen, onClose, item }) => {
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen || !item) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-brand-card border border-brand-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-brand-border bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 text-brand-cyan rounded-lg">
                            <PrinterIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Brother PT-D460BTVP Label Engine</h2>
                            <p className="text-xs text-gray-400">18 mm Tape Format (64 mm x 18 mm Layout)</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Live Label Preview */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Live Print Preview (Scale 1:1)
                        </label>
                        <div className="flex justify-center p-6 bg-slate-950 border border-brand-border rounded-xl">
                            {/* Printable 18mm Tape Container */}
                            <div
                                ref={printRef}
                                className="print-area w-[260px] h-[72px] bg-white text-black p-1.5 flex items-center justify-between rounded shadow-md border border-gray-300 font-sans select-none overflow-hidden"
                            >
                                {/* Left: High-Contrast QR Code */}
                                <div className="bg-white p-1 rounded flex-shrink-0">
                                    <QRCodeSVG
                                        value={item.qr_code || `GYPRI-${item.id}`}
                                        size={54}
                                        level="M"
                                        includeMargin={false}
                                    />
                                </div>

                                {/* Center: Title & Location */}
                                <div className="flex-1 px-2 min-w-0 flex flex-col justify-center">
                                    <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 leading-none truncate">
                                        GYPRI DÍLNA
                                    </p>
                                    <p className="text-[11px] font-bold text-black leading-snug truncate mt-0.5">
                                        {item.title}
                                    </p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="bg-black text-white text-[9px] font-mono font-bold px-1 py-0.5 rounded leading-none">
                                            {item.location_code}
                                        </span>
                                        <span className="text-[9px] font-mono text-gray-600 truncate">
                                            {item.category}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Printer Details Card */}
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-brand-border space-y-2 text-xs">
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Target Printer:</span>
                            <span className="font-mono font-semibold text-brand-cyan">Brother PT-D460BTVP</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Tape Cassette:</span>
                            <span className="font-mono text-gray-200">TZe-241 (18mm Black on White)</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Payload SKU:</span>
                            <span className="font-mono text-cyan-400">{item.qr_code}</span>
                        </div>
                        <div className="flex justify-between text-gray-300">
                            <span className="text-gray-400">Location Tag:</span>
                            <span className="font-mono text-amber-400">{item.location_code} ({item.zone})</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-black bg-brand-cyan hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 transition active:scale-95"
                        >
                            <PrinterIcon className="h-4 w-4" />
                            Print Label Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
