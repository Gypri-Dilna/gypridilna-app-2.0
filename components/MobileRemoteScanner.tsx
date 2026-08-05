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

    // Camera devices list for manual switching if device has multi-lenses
    const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
    const [currentCamIdx, setCurrentCamIdx] = useState<number>(0);

    // Zoom state
    const [zoomFactor, setZoomFactor] = useState<number>(2.0);

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

    const handleZoomChange = (newZoom: number) => {
        setZoomFactor(newZoom);
        applyHardwareZoomAndFocus(newZoom);
    };

    const startCameraWithId = useCallback(async (cameraIdOrConfig: any) => {
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

                const item = await onLookupItem(decodedText);
                const title = item ? item.title : 'Inventory Item Tag';
                const location_code = item ? item.location_code : decodedText;

                if (scanMode === 'pc') {
                    const targetSession = pairedSessionId || 'default';
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

                setTimeout(() => {
                    setScannedFeedback(null);
                    isProcessingRef.current = false;
                }, 1400);
            };

            await html5QrCode.start(cameraIdOrConfig, scanConfig, handleSuccess, () => {});
            setIsScanning(true);
            setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);

        } catch (err: any) {
            console.error("Camera start error with config:", cameraIdOrConfig, err);
            throw err;
        }
    }, [onLookupItem, scanMode, pairedSessionId, applyHardwareZoomAndFocus, zoomFactor]);

    const startCamera = useCallback(async () => {
        try {
            // Attempt 1: Exact environment facing mode (Strict Rear Camera)
            await startCameraWithId({ facingMode: { exact: "environment" } });
            return;
        } catch (eExact) {
            console.warn("Exact environment facingMode failed:", eExact);
        }

        try {
            // Attempt 2: Ideal environment facing mode
            await startCameraWithId({ facingMode: "environment" });
            return;
        } catch (eIdeal) {
            console.warn("Ideal environment facingMode failed:", eIdeal);
        }

        // Attempt 3: Enumerate cameras & pick non-front camera
        try {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
                setAvailableCameras(devices);
                const nonFront = devices.filter(d => !/front|user|selfie/i.test(d.label || ''));
                const chosen = nonFront[nonFront.length - 1] || devices[devices.length - 1];
                const chosenIdx = devices.findIndex(d => d.id === chosen.id);
                if (chosenIdx >= 0) setCurrentCamIdx(chosenIdx);

                await startCameraWithId(chosen.id);
                return;
            }
        } catch (eDevices) {
            console.warn("Camera enumeration failed:", eDevices);
        }

        setErrorMsg("Grant camera permissions in phone settings to scan items.");
    }, [startCameraWithId]);

    const handleSwitchCamera = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (e) {}
        }

        // Freshly enumerate cameras if list was empty
        let cams = availableCameras;
        if (cams.length === 0) {
            try {
                cams = await Html5Qrcode.getCameras();
                setAvailableCameras(cams);
            } catch (e) {}
        }

        if (cams.length > 0) {
            const nextIdx = (currentCamIdx + 1) % cams.length;
            setCurrentCamIdx(nextIdx);
            try {
                await startCameraWithId(cams[nextIdx].id);
            } catch (e) {
                setErrorMsg("Chyba při přepnutí fotoaparátu.");
            }
        } else {
            try {
                await startCameraWithId({ facingMode: "user" });
            } catch (e) {
                setErrorMsg("Chyba při přepnutí fotoaparátu.");
            }
        }
    };

    useEffect(() => {
        // Enumerate camera devices on load so availableCameras is always populated
        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length > 0) {
                setAvailableCameras(devices);
            }
        }).catch(() => {});

        startCamera();
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
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

                {/* Always-visible Camera Switcher Button (Top Left) */}
                {isScanning && (
                    <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-brand-teal/40 shadow-lg text-[11px] font-mono font-bold text-brand-teal hover:text-white hover:bg-brand-teal/20 transition active:scale-95"
                    >
                        <CameraIcon className="h-3.5 w-3.5" />
                        <span>Přepnout fotoaparát {availableCameras.length > 0 ? `(${currentCamIdx + 1}/${availableCameras.length})` : ''}</span>
                    </button>
                )}

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
