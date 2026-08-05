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

                    // 1. Continuous Auto Focus
                    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                        constraints.advanced.push({ focusMode: 'continuous' });
                    }

                    // 2. Continuous Auto Exposure
                    if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
                        constraints.advanced.push({ exposureMode: 'continuous' });
                    }

                    // 3. WebRTC Hardware Optical/Sensor Zoom
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

            // Advanced Scan Config requesting HD video resolution & crisp 30FPS for clear focus
            const scanConfig = {
                fps: 30,
                qrbox: (w: number, h: number) => {
                    const size = Math.floor(Math.min(w, h) * 0.70);
                    return { width: size, height: size };
                },
                videoConstraints: {
                    width: { min: 1280, ideal: 1920 },
                    height: { min: 720, ideal: 1080 }
                }
            };

            const handleSuccess = async (decodedText: string) => {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;

                // Vibrate mobile device for physical feedback
                if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate([80, 40, 80]); } catch (e) {}
                }

                // Check if scanning a PC Pairing Code (e.g. PAIR:session_xyz)
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

                // Fetch item title locally
                const item = await onLookupItem(decodedText);
                const title = item ? item.title : 'Inventory Item Tag';
                const location_code = item ? item.location_code : decodedText;

                if (scanMode === 'pc') {
                    // Broadcast scanned QR code over API to paired Workstation PC
                    const targetSession = pairedSessionId || 'default';
                    fetch('/api/inventory/remote-scan', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: targetSession, qr_code: decodedText })
                    }).catch(() => {});

                    setScannedFeedback({ title, location_code, mode: 'pc' });
                } else {
                    // Local Phone Scan Mode
                    setScannedItem(item);
                    setScannedFeedback({ title, location_code, mode: 'local' });
                }

                // NON-STOP CONTINUOUS SCANNING: Auto-unlock frame lock in 1.4s without closing camera
                setTimeout(() => {
                    setScannedFeedback(null);
                    isProcessingRef.current = false;
                }, 1400);
            };

            // Enumerate camera devices to pick the Primary Rear Main Camera Sensor (avoids noisy ultra-wide / macro lenses)
            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    // Filter for rear/back cameras, preferring the main 1x sensor (usually index 0 or labeled '0' / 'main' / 'back')
                    const rearCameras = devices.filter(d => 
                        /back|rear|environment/i.test(d.label) || (!/front|user/i.test(d.label))
                    );

                    // Prefer camera labeled '0' or primary main sensor to avoid noisy wide/macro lens
                    const primaryCamera = rearCameras.find(d => /0|main|primary/i.test(d.label)) 
                        || rearCameras[0] 
                        || devices[devices.length - 1];

                    await html5QrCode.start(primaryCamera.id, scanConfig, handleSuccess, () => {});
                    setIsScanning(true);
                    setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);
                    return;
                }
            } catch (eEnum) {
                console.warn("Camera enumeration fallback:", eEnum);
            }

            // Fallback to facingMode environment
            await html5QrCode.start({ facingMode: "environment" }, scanConfig, handleSuccess, () => {});
            setIsScanning(true);
            setTimeout(() => applyHardwareZoomAndFocus(zoomFactor), 150);

        } catch (err: any) {
            console.error("Mobile camera start error:", err);
            setIsScanning(false);
            setErrorMsg("Grant camera permissions in phone settings to scan items.");
        }
    }, [onLookupItem, scanMode, pairedSessionId, applyHardwareZoomAndFocus, zoomFactor]);

    useEffect(() => {
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

                {/* Permanent Zoom Level Pills (1.0x, 1.5x, 2.0x, 2.5x) */}
                {isScanning && (
                    <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-lg">
                        {[1.0, 1.5, 2.0, 2.5].map((z) => (
                            <button
                                key={z}
                                type="button"
                                onClick={() => handleZoomChange(z)}
                                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition ${
                                    zoomFactor === z
                                        ? 'bg-brand-teal text-black shadow'
                                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {z.toFixed(1)}x
                            </button>
                        ))}
                    </div>
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
