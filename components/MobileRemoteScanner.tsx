import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CameraIcon, QrCodeIcon, SuccessIcon, WarningIcon, DesktopIcon, ExternalLinkIcon } from './icons';
import { InventoryItem } from '../types';

interface MobileRemoteScannerProps {
    onLookupItem: (qrPayload: string) => Promise<InventoryItem | null>;
    onSelectItem?: (item: InventoryItem) => void;
    onClose?: () => void;
}

export const MobileRemoteScanner: React.FC<MobileRemoteScannerProps> = ({ onLookupItem, onSelectItem, onClose }) => {
    const [scanMode, setScanMode] = useState<'pc' | 'local'>('pc');
    const [pairedSessionId, setPairedSessionId] = useState<string | null>(() => {
        return localStorage.getItem('gypri_paired_pc_session') || null;
    });
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [scannedFeedback, setScannedFeedback] = useState<{ title: string; location_code: string; mode: 'pc' | 'local' } | null>(null);

    const scanModeRef = useRef(scanMode);
    useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);

    const pairedSessionIdRef = useRef(pairedSessionId);
    useEffect(() => { pairedSessionIdRef.current = pairedSessionId; }, [pairedSessionId]);

    // Permanent 2.0x Default Hardware Zoom
    const zoomFactor = 2.0;

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef<boolean>(false);

    // Smooth WebRTC Native Hardware Zoom & Focus Adjuster
    const applyHardwareZoomAndFocus = useCallback((targetZoom: number) => {
        try {
            const videoElem = document.querySelector('#remote-mobile-reader video') as HTMLVideoElement;
            if (videoElem && videoElem.srcObject) {
                const stream = videoElem.srcObject as MediaStream;
                const track = stream.getVideoTracks()?.[0];

                if (track) {
                    const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
                    const constraints: any = { advanced: [] };

                    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                        constraints.advanced.push({ focusMode: 'continuous' });
                    }

                    if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
                        constraints.advanced.push({ exposureMode: 'continuous' });
                    }

                    if (capabilities.zoom) {
                        const min = capabilities.zoom.min || 1;
                        const max = capabilities.zoom.max || 5;
                        const clamped = Math.min(max, Math.max(min, targetZoom));
                        constraints.advanced.push({ zoom: clamped });
                    }

                    if (constraints.advanced.length > 0) {
                        track.applyConstraints(constraints).catch(() => {});
                    }
                }
            }
        } catch (e) {
            console.warn("Hardware camera constraint error:", e);
        }
    }, []);

    const startCamera = useCallback(async () => {
        setErrorMsg(null);
        isProcessingRef.current = false;

        const container = document.getElementById('remote-mobile-reader');
        if (!container) return;
        container.innerHTML = '';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera hardware unavailable.");
            }

            const html5QrCode = new Html5Qrcode("remote-mobile-reader", false);
            scannerRef.current = html5QrCode;

            const scanConfig = {
                fps: 25,
                qrbox: (w: number, h: number) => {
                    const size = Math.floor(Math.min(w, h) * 0.70);
                    return { width: size, height: size };
                }
            };

            const handleSuccess = async (decodedText: string) => {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;

                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate([80, 40, 80]); } catch (e) {}
                }

                if (decodedText.startsWith('PAIR:')) {
                    const newSession = decodedText.replace('PAIR:', '').trim();
                    setPairedSessionId(newSession);
                    localStorage.setItem('gypri_paired_pc_session', newSession);
                    setScannedFeedback({ title: 'PAIRED WITH PC WORKSTATION', location_code: newSession, mode: 'pc' });
                    setTimeout(() => {
                        setScannedFeedback(null);
                        isProcessingRef.current = false;
                    }, 1400);
                    return;
                }

                try {
                    const item = await onLookupItem(decodedText);
                    const title = item ? item.title : 'Inventory Item Tag';
                    const location_code = item ? item.location_code : decodedText;

                    if (scanModeRef.current === 'pc') {
                        const targetSession = pairedSessionIdRef.current || 'default';
                        fetch('/api/inventory/remote-scan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ session_id: targetSession, qr_code: decodedText })
                        }).catch(() => {});

                        setScannedFeedback({ title, location_code, mode: 'pc' });
                    } else {
                        setScannedItem(item);
                        setScannedFeedback({ title, location_code, mode: 'local' });
                    }
                } catch (e) {
                    console.warn("Lookup item error:", e);
                }

                setTimeout(() => {
                    setScannedFeedback(null);
                    isProcessingRef.current = false;
                }, 1400);
            };

            // Enumerate cameras & strictly lock onto the last camera (Camera 4/4, Main Primary Rear Lens)
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    const mainRearCamera = devices[devices.length - 1];
                    await html5QrCode.start(mainRearCamera.id, scanConfig, handleSuccess, () => {});
                    setIsScanning(true);
                    setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);
                    return;
                }
            } catch (eEnum) {
                console.warn("Camera list enumeration fallback:", eEnum);
            }

            // Fallback: Exact environment facing mode
            try {
                await html5QrCode.start({ facingMode: { exact: "environment" } }, scanConfig, handleSuccess, () => {});
                setIsScanning(true);
                setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);
                return;
            } catch (e1) {}

            await html5QrCode.start({ facingMode: "environment" }, scanConfig, handleSuccess, () => {});
            setIsScanning(true);
            setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);

        } catch (err: any) {
            console.error("Camera start error:", err);
            setIsScanning(false);
            setErrorMsg("Grant camera permissions in phone settings to scan items.");
        }
    }, [onLookupItem, applyHardwareZoomAndFocus, zoomFactor]);

    useEffect(() => {
        let isMounted = true;
        const timer = setTimeout(() => {
            if (isMounted) {
                startCamera();
            }
        }, 100);

        return () => {
            isMounted = false;
            clearTimeout(timer);
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(() => {});
                    }
                } catch (e) {}
            }
        };
    }, [startCamera]);

    const handleUnpairPC = () => {
        setPairedSessionId(null);
        localStorage.removeItem('gypri_paired_pc_session');
    };

    return (
        <div className="space-y-4 font-sans max-w-md mx-auto animate-fadeIn">
            {/* Mode Switcher Banner: Scan to PC vs Scan Locally */}
            <div className="bg-brand-dark border border-brand-border p-2 rounded-2xl grid grid-cols-2 gap-2 shadow-xl">
                <button
                    type="button"
                    onClick={() => setScanMode('pc')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        scanMode === 'pc'
                            ? 'bg-brand-teal text-black shadow-lg shadow-brand-teal/20'
                            : 'text-gray-300 hover:bg-brand-darker hover:text-white'
                    }`}
                >
                    <DesktopIcon className="h-4 w-4" />
                    <span>Scan to PC</span>
                </button>

                <button
                    type="button"
                    onClick={() => setScanMode('local')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        scanMode === 'local'
                            ? 'bg-brand-teal text-black shadow-lg shadow-brand-teal/20'
                            : 'text-gray-300 hover:bg-brand-darker hover:text-white'
                    }`}
                >
                    <CameraIcon className="h-4 w-4" />
                    <span>Scan Locally</span>
                </button>
            </div>

            {/* PC Pairing Status Subheader */}
            {scanMode === 'pc' && (
                <div className="bg-brand-dark border border-brand-teal/30 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${pairedSessionId ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                        <span className="font-mono text-gray-200">
                            {pairedSessionId ? `Paired to PC (${pairedSessionId})` : 'Unpaired: Scan PC Pairing QR Code'}
                        </span>
                    </div>
                    {pairedSessionId && (
                        <button
                            type="button"
                            onClick={handleUnpairPC}
                            className="text-[10px] text-gray-400 hover:text-rose-400 underline font-mono"
                        >
                            Unpair
                        </button>
                    )}
                </div>
            )}

            {/* Live Camera Scanner Viewport */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-teal/30 bg-black min-h-[310px] shadow-2xl flex items-center justify-center">
                <style>{`
                    #remote-mobile-reader {
                        width: 100% !important;
                        border: none !important;
                        overflow: hidden !important;
                        border-radius: 0.75rem !important;
                    }
                    #remote-mobile-reader video {
                        width: 100% !important;
                        height: 100% !important;
                        max-height: 380px !important;
                        object-fit: cover !important;
                        border-radius: 0.75rem !important;
                        filter: none !important;
                    }
                    #remote-mobile-reader canvas {
                        display: none !important;
                    }
                    #remote-mobile-reader video:nth-of-type(n+2) {
                        display: none !important;
                    }
                    #remote-mobile-reader__scan_region {
                        background: transparent !important;
                    }
                    #remote-mobile-reader__dashboard {
                        display: none !important;
                    }
                `}</style>
                <div id="remote-mobile-reader" className="w-full rounded-2xl overflow-hidden" />

                {!isScanning && (
                    <div className="p-6 text-center space-y-3 absolute inset-0 bg-brand-darker flex flex-col items-center justify-center">
                        <QrCodeIcon className="h-12 w-12 text-brand-teal animate-bounce" />
                        <p className="text-xs font-semibold text-gray-300">Initializing Camera Stream...</p>
                        <button
                            onClick={startCamera}
                            className="px-5 py-2.5 bg-brand-teal text-black font-extrabold text-xs rounded-xl hover:bg-brand-teal-hover transition shadow"
                        >
                            Enable Camera
                        </button>
                    </div>
                )}
            </div>

            {/* Local Mode Scanned Item Quick Action Bottom Card */}
            {scanMode === 'local' && scannedItem && (
                <div className="bg-brand-dark border border-brand-teal/40 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xl animate-modal-pop">
                    <div className="overflow-hidden">
                        <span className="text-[10px] font-mono text-brand-teal font-bold bg-black px-2 py-0.5 rounded border border-brand-teal/30">
                            {scannedItem.location_code}
                        </span>
                        <h3 className="text-sm font-bold text-white truncate mt-1">{scannedItem.title}</h3>
                    </div>
                    {onSelectItem && (
                        <button
                            type="button"
                            onClick={() => onSelectItem(scannedItem)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-teal text-black text-xs font-extrabold rounded-xl hover:bg-brand-teal-hover transition flex-shrink-0"
                        >
                            Open Details <ExternalLinkIcon className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-semibold">
                    <WarningIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}
        </div>
    );
};
