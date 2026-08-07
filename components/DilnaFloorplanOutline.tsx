import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { parseLocationCode } from '../locationParser';
import { CloseIcon, ZoomInIcon, MapPinIcon, CameraIcon } from './icons';

interface DilnaFloorplanOutlineProps {
    locationCode: string;
    itemTitle?: string;
    className?: string;
}

export const DilnaFloorplanOutline: React.FC<DilnaFloorplanOutlineProps> = ({
    locationCode,
    itemTitle,
    className = ""
}) => {
    const parsed = parseLocationCode(locationCode);
    const rack = parsed ? parsed.rack : 1;
    const sector = parsed ? parsed.sector : 0;

    const [svgContent, setSvgContent] = useState<string | null>(null);
    const [isMapLightboxOpen, setIsMapLightboxOpen] = useState(false);
    const [isClosingMap, setIsClosingMap] = useState(false);

    const closeMapLightbox = () => {
        setIsClosingMap(true);
        setTimeout(() => {
            setIsMapLightboxOpen(false);
            setIsClosingMap(false);
        }, 200);
    };

    // Fetch SVG layout content
    useEffect(() => {
        let isMounted = true;
        fetch('/location-pictures/dilna_storage_layout.svg')
            .then(res => {
                if (res.ok) return res.text();
                throw new Error('SVG not found');
            })
            .then(text => {
                if (isMounted) setSvgContent(text);
            })
            .catch(() => {
                fetch('/public/location-pictures/dilna_storage_layout.svg')
                    .then(res => res.text())
                    .then(text => { if (isMounted) setSvgContent(text); })
                    .catch(() => {});
            });
        return () => { isMounted = false; };
    }, []);

    // Synchronously process SVG string via DOMParser: HIGHLIGHT RED + PULSING PIN + DIMMED NON-TARGETS
    // Automatic Fallback: If exact sector ID (e.g. X1Y2) does not exist in SVG, fallback to rack ID (e.g. X1)
    // Multi-element Center: If location has 2 elements (e.g. X4Y3A & X4Y3B), red dot is placed dead center between them
    const processedSvg = useMemo(() => {
        if (!svgContent) return null;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');

            const targetPrefixFull = `X${rack}Y${sector}`.toUpperCase();
            const targetPrefixRack = `X${rack}`.toUpperCase();

            const allElements = doc.querySelectorAll('*');
            const svgEl = doc.querySelector('svg');
            const matchedElements: Element[] = [];

            // 1. Check if ANY element in SVG matches the exact full sector code (e.g. X4Y3)
            let hasExactMatchInSvg = false;
            allElements.forEach(el => {
                const elId = (el.getAttribute('id') || '').trim().toUpperCase();
                if (elId && !elId.startsWith('RECT') && !elId.startsWith('LAYER') && elId.startsWith(targetPrefixFull)) {
                    hasExactMatchInSvg = true;
                }
            });

            // 2. Element matching logic: exact match (X4Y3A, X4Y3B) or rack fallback (X1, X2, X3)
            allElements.forEach(el => {
                const elId = (el.getAttribute('id') || '').trim().toUpperCase();
                if (!elId || elId === 'LAYER1' || elId === 'SVG1' || elId === 'PATH1' || elId.startsWith('RECT') || elId.startsWith('NAMEDVIEW') || elId.startsWith('DEFS')) {
                    return;
                }

                const isExactMatch = elId.startsWith(targetPrefixFull);
                const isRackMatch = !hasExactMatchInSvg && elId.startsWith(targetPrefixRack);

                if (isExactMatch || isRackMatch) {
                    matchedElements.push(el);
                    // Solid Red Target Location
                    el.setAttribute('style', 'fill:#f43f5e !important; fill-opacity:0.95 !important; stroke:#ffffff !important; stroke-width:2.5px !important; filter:drop-shadow(0 0 12px #f43f5e) !important;');
                } else {
                    // Dimmed Darkened Non-target Locations
                    el.setAttribute('style', 'fill:#111827 !important; fill-opacity:0.85 !important; stroke:#1f2937 !important; stroke-width:0.8px !important;');
                }
            });

            // 3. Calculate COMBINED center point of ALL matched elements (dead center between X4Y3A & X4Y3B)
            let targetCenter: { cx: number; cy: number } | null = null;
            if (matchedElements.length > 0 && svgEl) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                matchedElements.forEach(el => {
                    const x = parseFloat(el.getAttribute('x') || '0');
                    const y = parseFloat(el.getAttribute('y') || '0');
                    const w = parseFloat(el.getAttribute('width') || '0');
                    const h = parseFloat(el.getAttribute('height') || '0');
                    if (w > 0 && h > 0) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x + w);
                        maxY = Math.max(maxY, y + h);
                    }
                });

                if (minX !== Infinity && maxX !== -Infinity) {
                    targetCenter = {
                        cx: (minX + maxX) / 2,
                        cy: (minY + maxY) / 2
                    };
                }
            }

            // 4. Insert Pulsing Red Dot Marker at calculated combined center
            if (targetCenter && svgEl) {
                const layer = doc.querySelector('#layer1') || svgEl;
                const pinDot = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
                pinDot.setAttribute('id', 'dynamic-map-pin');
                pinDot.setAttribute('cx', String(targetCenter.cx));
                pinDot.setAttribute('cy', String(targetCenter.cy));
                pinDot.setAttribute('r', '4.5');
                pinDot.setAttribute('fill', '#ff1744');
                pinDot.setAttribute('stroke', '#ffffff');
                pinDot.setAttribute('stroke-width', '1.5');

                const animR = doc.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animR.setAttribute('attributeName', 'r');
                animR.setAttribute('values', '3.5;7;3.5');
                animR.setAttribute('dur', '1.2s');
                animR.setAttribute('repeatCount', 'indefinite');

                const animOpacity = doc.createElementNS('http://www.w3.org/2000/svg', 'animate');
                animOpacity.setAttribute('attributeName', 'opacity');
                animOpacity.setAttribute('values', '1;0.4;1');
                animOpacity.setAttribute('dur', '1.2s');
                animOpacity.setAttribute('repeatCount', 'indefinite');

                pinDot.appendChild(animR);
                pinDot.appendChild(animOpacity);
                layer.appendChild(pinDot);
            }

            return new XMLSerializer().serializeToString(doc);
        } catch (e) {
            return svgContent;
        }
    }, [svgContent, rack, sector]);

    return (
        <div className={`space-y-4 font-sans w-full ${className}`}>
            <style>{`
                @keyframes modalZoomIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes modalZoomOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.92); }
                }
                @keyframes backdropFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes backdropFadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                .animate-backdrop-in {
                    animation: backdropFadeIn 0.22s ease-out forwards;
                }
                .animate-backdrop-out {
                    animation: backdropFadeOut 0.2s ease-in forwards;
                }
                .animate-modal-in {
                    animation: modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-modal-out {
                    animation: modalZoomOut 0.2s ease-in forwards;
                }
            `}</style>

            {/* Main Landscape Horizontal Floorplan Layout Container */}
            <div className="bg-brand-dark border border-brand-border p-3 sm:p-4 rounded-2xl space-y-3 shadow-xl w-full">
                <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                    <span className="text-xs font-extrabold text-white flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4 text-rose-500" />
                        Plán Dílny & Sektor
                    </span>
                </div>

                {/* Scaled Viewport Container (ADJUST MAP SIZE & POSITION HERE) */}
                <div
                    onClick={() => setIsMapLightboxOpen(true)}
                    className="relative group cursor-pointer w-full h-[150px] sm:h-[310px] lg:h-[310px] bg-slate-950 border border-brand-border rounded-xl p-2 flex items-center justify-center overflow-hidden transition-all"
                >
                    {/* SVG Map Container - Exact user configured positioning and scaling */}
                    <div 
                        className="w-full h-full flex items-center justify-center translate-x-[15px] -translate-y-[20px] sm:translate-x-[37px] sm:-translate-y-[53px] lg:translate-x-[37px] lg:-translate-y-[53px] [&_svg]:h-[250%] sm:[&_svg]:h-[310%] lg:[&_svg]:h-[310%] [&_svg]:w-auto [&_svg]:max-w-none [&_svg]:rotate-[-90deg] [&_svg]:origin-center"
                        dangerouslySetInnerHTML={{ __html: processedSvg || '<p className="text-xs text-gray-500 font-mono">Načítání schématu...</p>' }}
                    />
                    
                    {/* Hover Magnifying Glass Overlay (Mobile ONLY < 640px) */}
                    <div className="sm:hidden absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold pointer-events-none z-10">
                        <ZoomInIcon className="h-6 w-6 text-brand-teal animate-bounce flex-shrink-0" />
                        <span>Zvětšit plán dílny</span>
                    </div>
                </div>
            </div>

            {/* Fullscreen SVG Map Lightbox Modal */}
            {isMapLightboxOpen && createPortal(
                <div
                    onClick={closeMapLightbox}
                    className={`fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 ${
                        isClosingMap ? 'animate-backdrop-out' : 'animate-backdrop-in'
                    }`}
                >
                    <div
                        className={`relative max-w-6xl w-full h-[92vh] bg-brand-dark border border-brand-teal/50 rounded-2xl overflow-hidden shadow-2xl p-3 flex flex-col items-center ${
                            isClosingMap ? 'animate-modal-out' : 'animate-modal-in'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Sleek Floating Top-Right Close Button */}
                        <button
                            type="button"
                            onClick={closeMapLightbox}
                            className="absolute top-4 right-4 z-20 p-2.5 text-gray-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl transition border border-brand-border/60 shadow-lg"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>

                        <div
                            className="p-3 w-full h-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden [&_svg]:max-h-[85vh] [&_svg]:w-auto [&_svg]:rotate-0 sm:[&_svg]:rotate-[-90deg]"
                            dangerouslySetInnerHTML={{ __html: processedSvg || '' }}
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

interface LocationPhotoCardProps {
    locationCode: string;
    className?: string;
}

export const LocationPhotoCard: React.FC<LocationPhotoCardProps> = ({
    locationCode,
    className = ""
}) => {
    const parsed = parseLocationCode(locationCode);
    const rack = parsed ? parsed.rack : 1;
    const sector = parsed ? parsed.sector : 0;

    const [photoSrc, setPhotoSrc] = useState<string | null>(null);
    const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
    const [isClosingPhoto, setIsClosingPhoto] = useState(false);

    const closePhotoLightbox = () => {
        setIsClosingPhoto(true);
        setTimeout(() => {
            setIsPhotoLightboxOpen(false);
            setIsClosingPhoto(false);
        }, 200);
    };

    const handlePhotoClick = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 640 && photoSrc) {
            setIsPhotoLightboxOpen(true);
        }
    };

    // Try loading location photo: loc_XY.jpg -> loc_X.jpg
    useEffect(() => {
        let isMounted = true;
        setPhotoSrc(null);

        const candidates = [
            `/location-pictures/loc_${rack}${sector}.jpg`,
            `/location-pictures/loc_${rack}.jpg`
        ];

        let idx = 0;
        const tryNextPhoto = () => {
            if (idx >= candidates.length || !isMounted) return;
            const url = candidates[idx++];
            const img = new Image();
            img.src = url;
            img.onload = () => {
                if (isMounted) setPhotoSrc(url);
            };
            img.onerror = () => {
                tryNextPhoto();
            };
        };

        tryNextPhoto();

        return () => { isMounted = false; };
    }, [rack, sector]);

    return (
        <div className={`bg-brand-dark border border-brand-border p-4 rounded-2xl space-y-3 shadow-xl font-sans h-full flex flex-col justify-between ${className}`}>
            <div className="flex items-center justify-between border-b border-brand-border/60 pb-2">
                <span className="text-xs font-extrabold text-white flex items-center gap-2">
                    <CameraIcon className="h-4 w-4 text-amber-400" />
                    Fotka Reálné Lokace
                </span>
            </div>

            {photoSrc ? (
                <div
                    onClick={handlePhotoClick}
                    className="relative group cursor-pointer sm:cursor-default rounded-xl overflow-hidden border border-brand-teal/30 bg-black h-[220px] sm:h-[260px] flex items-center justify-center shadow-md flex-1"
                >
                    <img
                        src={photoSrc}
                        alt="Fotka lokace dílny"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Hover Magnifying Glass Overlay (Mobile ONLY < 640px) */}
                    <div className="sm:hidden absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold pointer-events-none z-10">
                        <ZoomInIcon className="h-6 w-6 text-brand-teal animate-bounce flex-shrink-0" />
                        <span>Zvětšit fotku</span>
                    </div>
                </div>
            ) : (
                <div className="h-[220px] sm:h-[260px] bg-slate-950 border border-dashed border-brand-border rounded-xl flex flex-col items-center justify-center p-6 text-center space-y-2 flex-1">
                    <CameraIcon className="h-10 w-10 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-400">Fotka pro tuto lokaci bude brzy doplněna</p>
                </div>
            )}

            {/* Fullscreen Photo Lightbox Modal */}
            {isPhotoLightboxOpen && photoSrc && createPortal(
                <div
                    onClick={closePhotoLightbox}
                    className={`fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 ${
                        isClosingPhoto ? 'animate-backdrop-out' : 'animate-backdrop-in'
                    }`}
                >
                    <div
                        className={`relative max-w-5xl max-h-[92vh] w-full bg-brand-dark border border-brand-teal/50 rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center ${
                            isClosingPhoto ? 'animate-modal-out' : 'animate-modal-in'
                        }`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={closePhotoLightbox}
                            className="absolute top-4 right-4 z-20 p-2.5 text-gray-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 backdrop-blur-md rounded-xl transition border border-brand-border/60 shadow-lg"
                        >
                            <CloseIcon className="h-5 w-5" />
                        </button>

                        <div className="p-2 w-full flex items-center justify-center overflow-auto max-h-[82vh]">
                            <img
                                src={photoSrc}
                                alt="Fotka lokace dílny"
                                className="max-h-[78vh] w-auto rounded-xl object-contain border border-brand-border shadow-2xl"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
