import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraIcon, QrCodeIcon, CloseIcon, SearchIcon, CheckCircle2, AlertTriangle, PlusIcon, MinusIcon } from './icons';
import { InventoryItem } from '../types';

interface QrScannerProps {
    onLookupItem: (qrPayload: string) => Promise<InventoryItem | null>;
    onAdjustStock: (itemId: number, delta: number) => Promise<void>;
    onClose?: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onLookupItem, onAdjustStock, onClose }) => {
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const startScanner = async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                setIsScanning(true);

                await html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    async (decodedText) => {
                        setScannedResult(decodedText);
                        setErrorMsg(null);
                        const item = await onLookupItem(decodedText);
                        if (item) {
                            setScannedItem(item);
                        } else {
                            setErrorMsg(`No item found matching payload: "${decodedText}"`);
                        }
                    },
                    (errorMessage) => {
                        // Silent scan errors
                    }
                );
            } catch (err: any) {
                console.warn("Camera start warning:", err);
                setIsScanning(false);
                setErrorMsg("Camera access not available or blocked. Use manual search below.");
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, [onLookupItem]);

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        setErrorMsg(null);
        const item = await onLookupItem(manualCode.trim());
        if (item) {
            setScannedItem(item);
            setScannedResult(manualCode);
        } else {
            setErrorMsg(`No item found matching SKU / QR Code: "${manualCode}"`);
        }
    };

    const handleStockChange = async (delta: number) => {
        if (!scannedItem) return;
        await onAdjustStock(scannedItem.id, delta);
        // Refresh item quantity locally
        const updated = await onLookupItem(scannedItem.qr_code);
        if (updated) setScannedItem(updated);
    };

    return (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-6 shadow-2xl max-w-2xl mx-auto space-y-6">
            {/* Title */}
            <div className="flex justify-between items-center pb-4 border-b border-brand-border">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/10 text-brand-cyan rounded-xl">
                        <CameraIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Browser Camera QR Code Scanner</h2>
                        <p className="text-xs text-gray-400">Instant Workshop Inventory Lookup & Quick Stock Adjustment</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Video Viewport Area */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-border bg-slate-950 flex flex-col items-center justify-center min-h-[300px]">
                <div id="reader" className="w-full max-w-sm rounded-xl overflow-hidden" />

                {!isScanning && (
                    <div className="p-8 text-center space-y-3">
                        <QrCodeIcon className="h-12 w-12 text-gray-500 mx-auto animate-pulse" />
                        <p className="text-sm font-semibold text-gray-300">Camera Feed Initializing or Unavailable</p>
                        <p className="text-xs text-gray-500 max-w-md">Ensure camera permissions are granted in your web browser or use manual SKU lookup below.</p>
                    </div>
                )}
            </div>

            {/* Manual SKU Lookup Fallback */}
            <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter QR payload or SKU (e.g. GYPRI-TOOL-001)..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-brand-border rounded-xl text-sm text-white focus:outline-none focus:border-brand-cyan"
                    />
                </div>
                <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-cyan hover:bg-cyan-300 text-black font-bold rounded-xl text-sm transition"
                >
                    Lookup
                </button>
            </form>

            {/* Error Banner */}
            {errorMsg && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Scanned Item Result Card */}
            {scannedItem && (
                <div className="bg-slate-900 border-2 border-brand-cyan/50 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                                {scannedItem.category}
                            </span>
                            <h3 className="text-lg font-bold text-white mt-1">{scannedItem.title}</h3>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">Location: <span className="text-amber-400 font-semibold">{scannedItem.location_code}</span> ({scannedItem.zone})</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400">Current Stock</p>
                            <p className={`text-2xl font-black ${scannedItem.quantity <= scannedItem.min_quantity ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {scannedItem.quantity} <span className="text-xs font-normal text-gray-400">{scannedItem.unit}</span>
                            </p>
                        </div>
                    </div>

                    {/* Stock Quick Adjustment */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-gray-300">Quick Stock Adjustment:</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleStockChange(-1)}
                                className="px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                                <MinusIcon className="h-3.5 w-3.5" /> Check-Out 1
                            </button>
                            <button
                                onClick={() => handleStockChange(1)}
                                className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                                <PlusIcon className="h-3.5 w-3.5" /> Restock 1
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
