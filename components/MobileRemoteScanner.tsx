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
    const [scanMode, setScanMode] = useState<'local' | 'pc'>('local');
    const [pairedSessionId, setPairedSessionId] = useState<string | null>(() => {
        return localStorage.getItem('gypri_paired_pc_session') || null;
    });
    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
    const [scannedFeedback, setScannedFeedback] = useState<{ title: string; location_code: string; mode: 'pc' | 'local' } | null>(null);

    const [cameraDevices, setCameraDevices] = useState<Array<{ id: string; label: string }>>([]);
    const [activeCamIndex, setActiveCamIndex] = useState<number>(0);

    const scanModeRef = useRef(scanMode);
    useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);

    const pairedSessionIdRef = useRef(pairedSessionId);
    useEffect(() => { pairedSessionIdRef.current = pairedSessionId; }, [pairedSessionId]);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef<boolean>(false);
    const lastScannedQrRef = useRef<string>('');
    const lastScannedTimeRef = useRef<number>(0);

    // Heartbeat Ping & Auto-Disconnect Lifecycle
    useEffect(() => {
        if (scanMode !== 'pc' || !pairedSessionId) return;

        const deviceName = /iPhone|iPad|iPod/i.test(navigator.userAgent)
            ? 'iPhone'
            : /Android/i.test(navigator.userAgent)
            ? 'Android'
            : 'Mobilní skener';

        const sendPing = async () => {
            try {
                await fetch('/api/inventory/remote-scan/ping', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        session_id: pairedSessionId,
                        device_name: deviceName
                    })
                });
            } catch (e) {}
        };

        sendPing();
        const pingInterval = setInterval(sendPing, 2000);

        const handleUnload = () => {
            if (pairedSessionIdRef.current) {
                const blob = new Blob([JSON.stringify({ session_id: pairedSessionIdRef.current })], { type: 'application/json' });
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/inventory/remote-scan/disconnect', blob);
                } else {
                    fetch('/api/inventory/remote-scan/disconnect', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ session_id: pairedSessionIdRef.current }),
                        keepalive: true
                    }).catch(() => {});
                }
            }
        };

        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('pagehide', handleUnload);

        return () => {
            clearInterval(pingInterval);
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('pagehide', handleUnload);
            handleUnload();
        };
    }, [scanMode, pairedSessionId]);

    // Hardware Zoom and Autofocus Controller
    const [cameraPermissionState, setCameraPermissionState] = useState<'granted' | 'denied' | 'insecure' | 'not_found' | 'error' | null>(null);

    const applyHardwareZoomAndFocus = useCallback(() => {
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

                    if (capabilities.zoom) {
                        const min = capabilities.zoom.min || 1;
                        const max = capabilities.zoom.max || 4;
                        const defaultOptimum = Math.min(max, Math.max(min, 2.0));
                        constraints.advanced.push({ zoom: defaultOptimum });
                    }

                    if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
                        constraints.advanced.push({ exposureMode: 'continuous' });
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

    const startCamera = useCallback(async (targetDeviceId?: string) => {
        setErrorMsg(null);
        isProcessingRef.current = false;

        const container = document.getElementById('remote-mobile-reader');
        if (!container) return;

        // Check for secure context (HTTPS requirement on modern smartphones)
        const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
        if (!window.isSecureContext && !isLocalHost) {
            setCameraPermissionState('insecure');
            setErrorMsg("Prohlížeč blokuje kameru z důvodu nezabezpečeného připojení HTTP. Připojte se přes HTTPS nebo localhost.");
            return;
        }

        // Gracefully stop previous scanner instance if running
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
            } catch (e) {}
        }
        container.innerHTML = '';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraPermissionState('error');
                throw new Error("Funkce fotoaparátu není v tomto prohlížeči podporována.");
            }

            // Explicitly request camera permission to trigger OS/browser prompt on modern phones
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                tempStream.getTracks().forEach(t => t.stop());
                setCameraPermissionState('granted');
            } catch (permErr: any) {
                console.warn("Explicit getUserMedia permission check:", permErr);
                const permStr = (permErr?.name || permErr?.message || String(permErr)).toLowerCase();
                if (permStr.includes('notallowed') || permStr.includes('permission') || permStr.includes('denied')) {
                    setCameraPermissionState('denied');
                    setErrorMsg("Přístup k fotoaparátu byl v prohlížeči nebo v telefonu zamítnut.");
                    return;
                } else if (permStr.includes('notfound') || permStr.includes('devicesnotfound')) {
                    setCameraPermissionState('not_found');
                    setErrorMsg("V tomto zařízení nebyl nalezen žádný fotoaparát.");
                    return;
                }
            }

            const html5QrCode = new Html5Qrcode("remote-mobile-reader", false);
            scannerRef.current = html5QrCode;

            // Retrieve all available camera devices
            let devices: Array<{ id: string; label: string }> = [];
            try {
                devices = await Html5Qrcode.getCameras();
                if (devices && devices.length > 0) {
                    setCameraDevices(devices.map((d, i) => ({ id: d.id, label: d.label || `Kamera ${i + 1}` })));
                }
            } catch (e) {}

            let selectedConstraint: any = { facingMode: "environment" };

            if (targetDeviceId) {
                selectedConstraint = { deviceId: { exact: targetDeviceId } };
            } else if (devices && devices.length > 0) {
                // Default to working Lens 4/4 (last rear camera in device list)
                const mainLens = devices[devices.length - 1];
                if (mainLens && mainLens.id) {
                    selectedConstraint = { deviceId: { exact: mainLens.id } };
                    setActiveCamIndex(devices.length - 1);
                }
            }

            const scanConfig = {
                fps: 30,
                qrbox: (w: number, h: number) => {
                    const size = Math.floor(Math.min(w, h) * 0.72);
                    return { width: size, height: size };
                }
            };

            const handleSuccess = async (decodedText: string) => {
                const lastScannedKey = `${decodedText}_${scanModeRef.current}`;
                if (lastScannedQrRef.current === lastScannedKey && (Date.now() - lastScannedTimeRef.current < 5000)) {
                    return;
                }
                lastScannedQrRef.current = lastScannedKey;
                lastScannedTimeRef.current = Date.now();

                if (decodedText.startsWith('PAIR:')) {
                    const sessionId = decodedText.replace('PAIR:', '').trim();
                    setPairedSessionId(sessionId);
                    localStorage.setItem('gypri_paired_pc_session', sessionId);
                    setScanMode('pc');
                    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([80, 40, 80]); } catch (e) {}
                    }
                    setScannedFeedback({
                        title: `Spárováno s PC (${sessionId})`,
                        location_code: 'SPÁROVÁNO ÚSPĚŠNĚ',
                        mode: 'pc'
                    });
                    setTimeout(() => { setScannedFeedback(null); isProcessingRef.current = false; }, 2200);
                    return;
                }

                // 1. ALWAYS check database to verify if QR code / location code exists!
                try {
                    const item = await onLookupItem(decodedText);

                    if (!item) {
                        // QR code NOT found in database -> Glow RED edge + Error vibration + Single Toast Card!
                        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                            try { navigator.vibrate([200, 100, 200]); } catch (e) {}
                        }
                        setScannedFeedback({
                            title: `Kód '${decodedText}' nebyl nalezen v databázi!`,
                            location_code: 'NEEXISTUJE',
                            mode: 'error'
                        });
                        setTimeout(() => {
                            setScannedFeedback(null);
                            isProcessingRef.current = false;
                        }, 3200);
                        return;
                    }

                    // 2. QR code IS valid & found in database -> Glow GREEN edge + Send to PC / Local!
                    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([80, 40, 80]); } catch (e) {}
                    }

                    if (scanModeRef.current === 'pc') {
                        const targetSession = pairedSessionIdRef.current;
                        if (!targetSession) {
                            setErrorMsg("Není spárováno PC. Naskenuj nejprve QR kód na obrazovce počítače.");
                            setTimeout(() => { setErrorMsg(null); isProcessingRef.current = false; }, 3000);
                            return;
                        }

                        const res = await fetch('/api/inventory/remote-scan', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                session_id: targetSession,
                                qr_code: decodedText
                            })
                        });

                        if (res.ok) {
                            setScannedFeedback({
                                title: item.title,
                                location_code: `${item.location_code || 'Bez lokace'} (Odesláno na PC)`,
                                mode: 'pc',
                                item: item
                            } as any);
                            setTimeout(() => { setScannedFeedback(null); isProcessingRef.current = false; }, 2800);
                        } else {
                            setErrorMsg("Chyba při odesílání skenu na PC.");
                            setTimeout(() => { setErrorMsg(null); isProcessingRef.current = false; }, 2500);
                        }
                    } else {
                        // Local Mode
                        setScannedItem(item);
                        setScannedFeedback({
                            title: item.title,
                            location_code: item.location_code || 'Bez lokace',
                            mode: 'local',
                            item: item
                        } as any);
                        setTimeout(() => {
                            setScannedFeedback(null);
                            isProcessingRef.current = false;
                        }, 4500);
                    }
                } catch (dbErr) {
                    setErrorMsg("Chyba ověřování v databázi.");
                    setTimeout(() => { setErrorMsg(null); isProcessingRef.current = false; }, 2500);
                }
            };

            await html5QrCode.start(
                selectedConstraint,
                scanConfig,
                handleSuccess,
                () => {}
            );

            setIsScanning(true);
            setCameraPermissionState('granted');

            setTimeout(() => {
                applyHardwareZoomAndFocus();
            }, 500);

        } catch (err: any) {
            console.error("Camera startup error:", err);
            setIsScanning(false);
            const errStr = (err?.name || err?.message || String(err)).toLowerCase();
            if (errStr.includes('notallowed') || errStr.includes('permission') || errStr.includes('denied')) {
                setCameraPermissionState('denied');
                setErrorMsg("Přístup k fotoaparátu byl v prohlížeči nebo v telefonu zamítnut.");
            } else if (errStr.includes('notfound') || errStr.includes('devicesnotfound')) {
                setCameraPermissionState('not_found');
                setErrorMsg("V tomto zařízení nebyl nalezen žádný fotoaparát.");
            } else {
                setCameraPermissionState('error');
                setErrorMsg(err.message || "Chyba při spouštění fotoaparátu.");
            }
        }
    }, [onLookupItem, applyHardwareZoomAndFocus]);

    const requestCameraPermissionAndStart = useCallback(async () => {
        setErrorMsg(null);
        setCameraPermissionState(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraPermissionState('error');
                setErrorMsg("Fotoaparát není v tomto prostředí podporován.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            stream.getTracks().forEach(t => t.stop());
            setCameraPermissionState('granted');
            await startCamera();
        } catch (permErr: any) {
            console.warn("Manual permission request error:", permErr);
            const permStr = (permErr?.name || permErr?.message || String(permErr)).toLowerCase();
            if (permStr.includes('notallowed') || permStr.includes('permission') || permStr.includes('denied')) {
                setCameraPermissionState('denied');
                setErrorMsg("Přístup k fotoaparátu byl zamítnut. V nastavení prohlížeče (ikona zámku 🔒 u adresy webu) povolte přístup ke kameře a klikněte znova.");
            } else {
                setCameraPermissionState('error');
                setErrorMsg("Fotoaparát se nepodařilo spustit. Ujistěte se, že není používán jinou aplikací.");
            }
        }
    }, [startCamera]);

    const isCameraStartedRef = useRef(false);

    useEffect(() => {
        if (isCameraStartedRef.current) return;
        isCameraStartedRef.current = true;

        startCamera();

        return () => {
            isCameraStartedRef.current = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    const handleSwitchLens = () => {
        if (cameraDevices.length <= 1) return;
        const nextIndex = (activeCamIndex + 1) % cameraDevices.length;
        setActiveCamIndex(nextIndex);
        const nextDevice = cameraDevices[nextIndex];
        if (nextDevice && nextDevice.id) {
            startCamera(nextDevice.id);
        }
    };

    const handleUnpairPC = () => {
        setPairedSessionId(null);
        localStorage.removeItem('gypri_paired_pc_session');
    };

    return (
        <div className="space-y-4 font-sans max-w-md mx-auto animate-fadeIn">
            {/* Mode Switcher Banner: Local Scan (Default - Left) vs Scan to PC (Right) */}
            <div className="bg-brand-dark border border-brand-border p-2 rounded-2xl grid grid-cols-2 gap-2 shadow-xl">
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
                    <span>Skenovat lokálně</span>
                </button>

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
                    <span>Skenovat do PC</span>
                </button>
            </div>

            {/* Viewport & Subheader Container (DOM persistent to keep camera stream alive without blackouts) */}
            <div className="space-y-4">
                <style>{`
                    @keyframes modeSwitchFade {
                        from {
                            opacity: 0.2;
                            transform: translateY(8px) scale(0.985);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0) scale(1);
                        }
                    }
                    .animate-mode-switch {
                        animation: modeSwitchFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>

                {/* PC Pairing Status Subheader */}
                {scanMode === 'pc' && (
                    <div key="pc-subheader" className="animate-mode-switch bg-brand-dark border border-brand-teal/30 p-3 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${pairedSessionId ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                                <span className="font-mono text-gray-200 font-bold">
                                    {pairedSessionId ? `Spárováno s PC (${pairedSessionId})` : 'Nespárováno: Naskenuj QR na PC nebo zadej kód'}
                                </span>
                            </div>
                            {pairedSessionId && (
                                <button
                                    type="button"
                                    onClick={handleUnpairPC}
                                    className="px-2.5 py-1 text-[10px] text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500 border border-rose-500/40 rounded-lg font-bold transition"
                                >
                                    Odpojit
                                </button>
                            )}
                        </div>

                        {!pairedSessionId && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const input = form.elements.namedItem('manualSession') as HTMLInputElement;
                                    const val = input.value.trim();
                                    if (val) {
                                        setPairedSessionId(val);
                                        localStorage.setItem('gypri_paired_pc_session', val);
                                        setScannedFeedback({
                                            title: `Spárováno s PC (${val})`,
                                            location_code: 'PAIRING SUCCESS',
                                            mode: 'pc'
                                        });
                                        setTimeout(() => setScannedFeedback(null), 2000);
                                    }
                                }}
                                className="flex gap-2 pt-1"
                            >
                                <input
                                    type="text"
                                    name="manualSession"
                                    placeholder="Zadej kód relace z PC (např. pc_a1b2c3)..."
                                    className="flex-1 px-3 py-1.5 bg-brand-darker border border-brand-border rounded-xl text-white text-xs font-mono focus:outline-none focus:border-brand-teal"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-bold text-xs rounded-xl shadow transition"
                                >
                                    Spárovat
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Live Camera Scanner Viewport (Fixed Height 340px to prevent layout jump/stretch) */}
                <div className={`relative rounded-2xl overflow-hidden border-4 transition-all duration-300 bg-black h-[340px] max-h-[340px] w-full shadow-2xl flex items-center justify-center ${
                    scannedFeedback?.mode === 'error'
                        ? 'animate-edge-red'
                        : scannedFeedback?.mode === 'pc'
                        ? 'animate-edge-green'
                        : 'border-brand-teal/30'
                }`}>
                    <style>{`
                        @keyframes edgePulseRed {
                            0%, 100% {
                                border-color: rgba(244, 63, 94, 0.9);
                                box-shadow: 0 0 15px rgba(244, 63, 94, 0.6), inset 0 0 12px rgba(244, 63, 94, 0.4);
                            }
                            50% {
                                border-color: rgba(255, 255, 255, 1);
                                box-shadow: 0 0 40px rgba(244, 63, 94, 1), inset 0 0 25px rgba(244, 63, 94, 0.8);
                            }
                        }
                        @keyframes edgePulseGreen {
                            0%, 100% {
                                border-color: rgba(52, 211, 153, 0.9);
                                box-shadow: 0 0 15px rgba(52, 211, 153, 0.6), inset 0 0 12px rgba(52, 211, 153, 0.4);
                            }
                            50% {
                                border-color: rgba(255, 255, 255, 1);
                                box-shadow: 0 0 40px rgba(52, 211, 153, 1), inset 0 0 25px rgba(52, 211, 153, 0.8);
                            }
                        }
                        .animate-edge-red {
                            animation: edgePulseRed 1.1s infinite ease-in-out !important;
                        }
                        .animate-edge-green {
                            animation: edgePulseGreen 1.1s infinite ease-in-out !important;
                        }
                        #remote-mobile-reader {
                            width: 100% !important;
                            height: 340px !important;
                            max-height: 340px !important;
                            border: none !important;
                            overflow: hidden !important;
                            border-radius: 0.75rem !important;
                        }
                        #remote-mobile-reader video {
                            width: 100% !important;
                            height: 340px !important;
                            max-height: 340px !important;
                            object-fit: cover !important;
                        }
                        #remote-mobile-reader video:nth-of-type(n+2),
                        #remote-mobile-reader canvas,
                        #remote-mobile-reader img,
                        #remote-mobile-reader__scan_region svg,
                        #remote-mobile-reader__shaded_region,
                        #remote-mobile-reader div[style*="position: absolute"] {
                            display: none !important;
                        }
                        #remote-mobile-reader__scan_region {
                            border: none !important;
                            box-shadow: none !important;
                            background: transparent !important;
                        }
                    `}</style>

                    <div id="remote-mobile-reader" className="w-full h-[340px] max-h-[340px]" />

                    {/* Camera Permission / Access Error Card Overlay */}
                    {cameraPermissionState && cameraPermissionState !== 'granted' && (
                        <div className="absolute inset-2 bg-brand-darker/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-3 z-40 animate-fadeIn">
                            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                                <CameraIcon className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-white font-black text-sm">
                                    {cameraPermissionState === 'denied' && "Přístup k fotoaparátu byl zamítnut"}
                                    {cameraPermissionState === 'insecure' && "Vyžadováno zabezpečené připojení (HTTPS)"}
                                    {cameraPermissionState === 'not_found' && "Fotoaparát nebyl nalezen"}
                                    {cameraPermissionState === 'error' && "Fotoaparát nelze spustit"}
                                </h4>
                                <p className="text-xs text-gray-300 leading-relaxed max-w-xs mx-auto">
                                    {cameraPermissionState === 'denied' && "V nastavení prohlížeče (ikona zámku 🔒 u adresy webu nebo v nastavení telefonu) povolte přístup ke kameře a klikněte znova."}
                                    {cameraPermissionState === 'insecure' && "Prohlížeče na nových telefonech blokují kameru na nezabezpečených HTTP adresách."}
                                    {cameraPermissionState === 'not_found' && "Ujistěte se, že je kamera v telefonu funkční."}
                                    {cameraPermissionState === 'error' && "Zavřete ostatní aplikace (fotoaparát/WhatsApp) a klikněte na zkusit znova."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={requestCameraPermissionAndStart}
                                className="px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-hover text-black font-extrabold text-xs rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 flex items-center gap-2"
                            >
                                <CameraIcon className="w-4 h-4" />
                                <span>Povolit fotoaparát a zkusit znova</span>
                            </button>
                        </div>
                    )}

                    {/* Single Non-blocking Bottom Floating Scanned Feedback Toast Card */}
                    {scannedFeedback && (
                        <div 
                            onClick={() => {
                                const matchedItem = (scannedFeedback as any).item;
                                if (matchedItem && onSelectItem) {
                                    onSelectItem(matchedItem);
                                }
                            }}
                            className={`absolute bottom-3 inset-x-3 backdrop-blur-md p-3.5 rounded-2xl border shadow-2xl flex items-center justify-between z-30 transition-all cursor-pointer active:scale-95 animate-slideUp ${
                                scannedFeedback.mode === 'error'
                                    ? 'bg-rose-950/95 border-rose-500/60 text-rose-200 shadow-rose-900/40'
                                    : scannedFeedback.mode === 'pc'
                                    ? 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200 shadow-emerald-900/40'
                                    : 'bg-slate-900/95 border-brand-teal/50 text-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl flex-shrink-0 ${
                                    scannedFeedback.mode === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-brand-teal/20 text-brand-teal'
                                }`}>
                                    {scannedFeedback.mode === 'error' ? <WarningIcon className="h-5 w-5" /> : <SuccessIcon className="h-5 w-5" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-extrabold text-white line-clamp-1">{scannedFeedback.title}</p>
                                    <p className="text-[11px] font-mono text-gray-300">Lokace: <span className="text-brand-teal font-bold">{scannedFeedback.location_code}</span></p>
                                </div>
                            </div>

                            {(scannedFeedback as any).item && (
                                <span className="text-[11px] font-bold text-brand-teal bg-brand-teal/15 px-3 py-1.5 rounded-xl border border-brand-teal/30 flex items-center gap-1 flex-shrink-0">
                                    Detail →
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
