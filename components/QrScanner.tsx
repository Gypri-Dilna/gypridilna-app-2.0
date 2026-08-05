import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { CameraIcon, QrCodeIcon, CloseIcon, SearchIcon, WarningIcon } from './icons';
import { InventoryItem } from '../types';
import { MobileRemoteScanner } from './MobileRemoteScanner';

interface QrScannerProps {
    onLookupItem: (qrPayload: string) => Promise<InventoryItem | null>;
    onSelectItem?: (item: InventoryItem) => void;
    onClose?: () => void;
    pcSessionId?: string;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onLookupItem, onSelectItem, onClose, pcSessionId: propSessionId }) => {
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isInsecureOrigin, setIsInsecureOrigin] = useState<boolean>(false);
    const [manualCode, setManualCode] = useState<string>('');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const lastScanTimeRef = useRef<number>(Date.now());
    const isProcessingRef = useRef<boolean>(false);

    const [pcSessionId] = useState<string>(() => {
        if (propSessionId) return propSessionId;
        let id = sessionStorage.getItem('pc_scan_session');
        if (!id) {
            id = 'pc_' + Math.random().toString(36).substring(2, 8);
            sessionStorage.setItem('pc_scan_session', id);
        }
        return id;
    });

    // Detect if browser is on a mobile device or phone screen
    const isMobileDevice = useMemo(() => {
        const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const screenMobile = window.innerWidth < 768;
        return userAgentMobile || screenMobile;
    }, []);

    // On mobile devices, render dedicated MobileRemoteScanner
    if (isMobileDevice) {
        return <MobileRemoteScanner onLookupItem={onLookupItem} onSelectItem={onSelectItem} onClose={onClose} />;
    }

    // PC Screen: Poll for remote mobile phone scan events on pcSessionId
    useEffect(() => {
        if (isMobileDevice) return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/inventory/remote-scan/latest?session_id=${pcSessionId}&since=${lastRemoteTimestampRef.current}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.qr_code && data.timestamp > lastRemoteTimestampRef.current) {
                        lastRemoteTimestampRef.current = data.timestamp;
                        const item = await onLookupItem(data.qr_code);
                        if (item && onSelectItem) {
                            onSelectItem(item);
                        }
                    }
                }
            } catch (e) {
                // Silent poll fail
            }
        }, 1200);

        return () => clearInterval(interval);
    }, [isMobileDevice, pcSessionId, onLookupItem, onSelectItem]);

    // Check secure context for mobile WebRTC
    useEffect(() => {
        if (!isMobileDevice) return;
        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (!window.isSecureContext && !isLocal) {
            setIsInsecureOrigin(true);
            setErrorMsg(
                `Android camera access requires HTTPS or localhost connection. Currently connected over insecure HTTP (${window.location.host}).`
            );
        }
    }, [isMobileDevice]);

    const [zoomFactor, setZoomFactor] = useState<number>(2.0);

    const applyZoomAndFocus = useCallback((targetZoom: number) => {
        try {
            const videoElem = document.querySelector('#reader video') as HTMLVideoElement;
            if (videoElem && videoElem.srcObject) {
                const stream = videoElem.srcObject as MediaStream;
                const track = stream.getVideoTracks()?.[0];

                if (track) {
                    const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
                    const constraints: any = { advanced: [] };

                    if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                        constraints.advanced.push({ focusMode: 'continuous' });
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

                videoElem.style.transform = `scale(${targetZoom})`;
                videoElem.style.transformOrigin = 'center center';
                videoElem.style.transition = 'transform 0.2s ease-out';
            }
        } catch (e) {
            console.warn("Zoom error:", e);
        }
    }, []);

    const handleZoomChange = (newZoom: number) => {
        setZoomFactor(newZoom);
        applyZoomAndFocus(newZoom);
    };

    const startCamera = useCallback(async () => {
        if (!isMobileDevice) return;
        setErrorMsg(null);
        isProcessingRef.current = false;

        const container = document.getElementById('reader');
        if (!container) {
            console.warn("Reader element not present in DOM.");
            return;
        }
        container.innerHTML = '';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported on this browser context.");
            }

            const html5QrCode = new Html5Qrcode("reader", false);
            scannerRef.current = html5QrCode;

            const scanConfig = {
                fps: 25,
                qrbox: (w: number, h: number) => {
                    const size = Math.floor(Math.min(w, h) * 0.7);
                    return { width: size, height: size };
                }
            };

            const handleSuccess = async (decodedText: string) => {
                if (isProcessingRef.current) return;
                isProcessingRef.current = true;

                fetch('/api/inventory/remote-scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ qr_code: decodedText })
                }).catch(() => {});

                if (scannerRef.current && scannerRef.current.isScanning) {
                    try {
                        await scannerRef.current.stop();
                    } catch (e) {
                        console.warn("Scanner stop error:", e);
                    }
                }

                setErrorMsg(null);
                try {
                    const item = await onLookupItem(decodedText);
                    if (item) {
                        setScannedItem(item);
                        if (onSelectItem) {
                            onSelectItem(item);
                        }
                    } else {
                        setErrorMsg(`No item found matching: "${decodedText}"`);
                        isProcessingRef.current = false;
                    }
                } catch (err) {
                    setErrorMsg(`Error processing scanned QR code.`);
                    isProcessingRef.current = false;
                }
            };

            try {
                await html5QrCode.start({ facingMode: "environment" }, scanConfig, handleSuccess, () => {});
                setIsScanning(true);
                setTimeout(() => applyZoomAndFocus(zoomFactor), 250);
                return;
            } catch (e1) {
                console.warn("Attempt 1 (environment facingMode) failed:", e1);
            }

            try {
                const devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    const rearCamera = devices[devices.length - 1];
                    await html5QrCode.start(rearCamera.id, scanConfig, handleSuccess, () => {});
                    setIsScanning(true);
                    setTimeout(() => applyZoomAndFocus(zoomFactor), 250);
                    return;
                }
            } catch (e2) {
                console.warn("Attempt 2 (getCameras list) failed:", e2);
            }

            await html5QrCode.start({ facingMode: "user" }, scanConfig, handleSuccess, () => {});
            setIsScanning(true);
            setTimeout(() => applyZoomAndFocus(zoomFactor), 250);

        } catch (err: any) {
            console.error("All camera start attempts failed:", err);
            setIsScanning(false);
            if (!isInsecureOrigin) {
                setErrorMsg("Camera permission denied or camera unavailable.");
            }
        }
    }, [isMobileDevice, onLookupItem, onSelectItem, isInsecureOrigin, applyZoomAndFocus, zoomFactor]);

    useEffect(() => {
        if (!isMobileDevice) return;
        let isMounted = true;
        if (isMounted) {
            startCamera();
        }
        return () => {
            isMounted = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    const container = document.getElementById('reader');
                    if (container) container.innerHTML = '';
                }).catch(() => {});
            }
        };
    }, [isMobileDevice, startCamera]);

    const handleManualSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualCode.trim()) return;
        setErrorMsg(null);
        const item = await onLookupItem(manualCode.trim());
        if (item) {
            setScannedItem(item);
            if (onSelectItem) {
                onSelectItem(item);
            }
        } else {
            setErrorMsg(`No item found matching: "${manualCode}"`);
        }
    };

    return (
        <div className="bg-brand-dark border border-brand-border rounded-2xl p-6 max-w-xl mx-auto space-y-5 font-sans">
            {/* CSS Overrides to fix mobile Android video sizing and prevent duplicate elements */}
            <style>{`
                #reader {
                    width: 100% !important;
                    border: none !important;
                    overflow: hidden !important;
                    border-radius: 0.75rem !important;
                }
                #reader video {
                    width: 100% !important;
                    height: 100% !important;
                    max-height: 360px !important;
                    object-fit: cover !important;
                    border-radius: 0.75rem !important;
                }
                #reader canvas {
                    display: none !important;
                }
                #reader video:nth-of-type(n+2) {
                    display: none !important;
                }
                #reader__scan_region {
                    background: transparent !important;
                }
                #reader__dashboard {
                    display: none !important;
                }
                #reader img {
                    display: none !important;
                }
            `}</style>

            {/* Title */}
            <div className="flex justify-between items-center pb-3 border-b border-brand-border">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-teal/10 text-brand-teal rounded-xl">
                        {isMobileDevice ? <CameraIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
                    </div>
                    <h2 className="text-base font-bold text-white">{isMobileDevice ? 'QR Scanner' : 'Item Lookup'}</h2>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                        <CloseIcon className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Insecure HTTP Warning Banner for Android */}
            {isMobileDevice && isInsecureOrigin && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-2 font-sans">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                        <WarningIcon className="h-4 w-4 flex-shrink-0" />
                        <span>Android Security Requirement (Insecure Context)</span>
                    </div>
                    <p className="leading-relaxed">
                        Android browsers block camera hardware on unencrypted <strong>http://</strong> connections.
                    </p>
                    <div className="pt-1 text-[11px] text-gray-300 font-mono bg-black/40 p-2 rounded border border-amber-500/20">
                        <strong>Fix for local testing:</strong> Open <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> on your Android phone, add <code>{window.location.origin}</code>, and restart Chrome.
                    </div>
                </div>
            )}

            {/* Main Content: Dominant Hero Search Bar on PC vs Camera Feed on Mobile */}
            {!isMobileDevice ? (
                /* Hero Dominant Search Bar & Mobile Phone Pairing for PC */
                <div className="py-4 space-y-6">
                    <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-brand-teal" />
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Search location ID (e.g. 12-0001)..."
                                autoFocus
                                className="w-full pl-12 pr-4 py-4 bg-brand-darker border-2 border-brand-border rounded-2xl text-base font-bold text-white placeholder-gray-400 focus:outline-none focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/15 font-mono shadow-inner transition"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-8 py-4 bg-brand-teal hover:bg-brand-teal-hover text-black font-black text-sm rounded-2xl transition shadow-lg shadow-brand-teal/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <SearchIcon className="h-5 w-5" />
                            Search
                        </button>
                    </form>

                    {/* Scan with Phone as Remote Wireless Scanner */}
                    <div className="pt-6 border-t border-brand-border text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-brand-teal uppercase tracking-wider">
                            <CameraIcon className="h-4 w-4" />
                            <span>Use Mobile Phone as Wireless PC Scanner</span>
                        </div>
                        <div className="flex justify-center p-3 bg-white rounded-2xl w-fit mx-auto shadow-xl border-2 border-brand-teal/30">
                            <QRCodeSVG value={`PAIR:${pcSessionId}`} size={120} level="M" />
                        </div>
                        <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
                            Scan this pairing QR code with your phone camera in <strong>"Scan to PC"</strong> mode to connect as a wireless scanner.
                        </p>
                    </div>
                </div>
            ) : (
                /* Mobile Camera Scanner */
                <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-brand-border bg-brand-darker flex items-center justify-center min-h-[260px]">
                        <div id="reader" className="w-full rounded-xl overflow-hidden" />

                        {!isScanning && (
                            <div className="p-6 text-center space-y-3 absolute inset-0 bg-brand-darker flex flex-col items-center justify-center">
                                <QrCodeIcon className="h-10 w-10 text-brand-teal animate-pulse" />
                                <p className="text-xs font-semibold text-gray-300">Camera Feed Idle or Permission Required</p>
                                <button
                                    onClick={startCamera}
                                    className="px-4 py-2 bg-brand-teal text-black font-bold text-xs rounded-xl hover:bg-brand-teal-hover transition shadow"
                                >
                                    Enable Camera Access
                                </button>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleManualSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                placeholder="Enter location ID (e.g. 12-0001)..."
                                className="w-full pl-10 pr-4 py-2 bg-brand-darker border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:border-brand-teal font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold rounded-xl text-xs transition"
                        >
                            Lookup
                        </button>
                    </form>
                </div>
            )}

            {/* Error Message */}
            {errorMsg && !isInsecureOrigin && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                    <WarningIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Scanned Result */}
            {scannedItem && (
                <div className="bg-brand-darker border border-brand-teal/50 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-mono font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded border border-brand-teal/30">
                                {scannedItem.category}
                            </span>
                            <h3 className="text-sm font-bold text-white mt-1">{scannedItem.title}</h3>
                            <p className="text-xs text-gray-300 font-mono mt-0.5">Location Code: <span className="text-amber-400 font-bold">{scannedItem.location_code}</span></p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
