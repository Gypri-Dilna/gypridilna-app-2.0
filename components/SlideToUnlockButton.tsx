import React, { useState, useRef, useEffect } from 'react';
import { RemoteIcon } from './icons';

interface SlideToUnlockButtonProps {
    onUnlock: () => Promise<void>;
    label?: string;
    className?: string;
}

export const SlideToUnlockButton: React.FC<SlideToUnlockButtonProps> = ({
    onUnlock,
    label = 'Vzdáleně otevřít dveře',
    className = ''
}) => {
    const [dragX, setDragX] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
    const [isUnlockingLoading, setIsUnlockingLoading] = useState<boolean>(false);

    const trackRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);

    const handleWidth = 48; // width of thumb in px

    const getMaxSlide = () => {
        if (!trackRef.current) return 200;
        return trackRef.current.clientWidth - handleWidth - 8; // 8px for padding
    };

    // Touch Event Handlers
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isUnlocked || isUnlockingLoading) return;
        setIsDragging(true);
        startXRef.current = e.touches[0].clientX - dragX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || isUnlocked || isUnlockingLoading) return;
        const maxSlide = getMaxSlide();
        const currentX = e.touches[0].clientX - startXRef.current;
        const clampedX = Math.max(0, Math.min(currentX, maxSlide));
        setDragX(clampedX);

        if (clampedX >= maxSlide * 0.88) {
            triggerUnlock();
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const maxSlide = getMaxSlide();
        if (dragX < maxSlide * 0.88 && !isUnlocked) {
            setDragX(0); // Snap back
        }
    };

    // Mouse Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (isUnlocked || isUnlockingLoading) return;
        setIsDragging(true);
        startXRef.current = e.clientX - dragX;
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || isUnlocked || isUnlockingLoading) return;
        const maxSlide = getMaxSlide();
        const currentX = e.clientX - startXRef.current;
        const clampedX = Math.max(0, Math.min(currentX, maxSlide));
        setDragX(clampedX);

        if (clampedX >= maxSlide * 0.88) {
            triggerUnlock();
        }
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const maxSlide = getMaxSlide();
        if (dragX < maxSlide * 0.88 && !isUnlocked) {
            setDragX(0); // Snap back
        }
    };

    useEffect(() => {
        if (isDragging) {
            const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
            const onMouseUp = () => handleMouseUp();
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            return () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [isDragging, dragX]);

    const triggerUnlock = async () => {
        setIsDragging(false);
        const maxSlide = getMaxSlide();
        setDragX(maxSlide);
        setIsUnlocked(true);
        setIsUnlockingLoading(true);

        // Haptic feedback on mobile if supported
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate([40, 30, 40]);
            } catch (e) {
                // Ignore vibration unsupported error
            }
        }

        try {
            await onUnlock();
        } catch (err) {
            console.error('Unlock error:', err);
        } finally {
            setIsUnlockingLoading(false);
            // Reset slider back after 2.5s
            setTimeout(() => {
                setIsUnlocked(false);
                setDragX(0);
            }, 2500);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Desktop Button (md:flex) */}
            <button
                onClick={async () => {
                    setIsUnlockingLoading(true);
                    try {
                        await onUnlock();
                    } finally {
                        setIsUnlockingLoading(false);
                    }
                }}
                disabled={isUnlockingLoading}
                className="hidden md:flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-teal hover:bg-brand-teal-hover disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-lg shadow-brand-teal/20 transition active:scale-95 cursor-pointer"
            >
                <RemoteIcon className={`h-4 w-4 ${isUnlockingLoading ? 'animate-spin' : ''}`} />
                {isUnlockingLoading ? 'Otevírám dveře...' : label}
            </button>

            {/* Mobile Touch Slide-to-Unlock Control (block md:hidden) */}
            <div className="block md:hidden w-full select-none touch-pan-y">
                <div
                    ref={trackRef}
                    className={`relative w-full h-[52px] bg-brand-darker border rounded-2xl p-1 flex items-center overflow-hidden transition-all duration-300 ${
                        isUnlocked
                            ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
                            : 'border-brand-teal/40 hover:border-brand-teal shadow-md'
                    }`}
                >
                    {/* Glowing Teal Progress Fill Behind Thumb */}
                    <div
                        className={`absolute left-0 top-0 bottom-0 rounded-2xl transition-colors duration-300 ${
                            isUnlocked
                                ? 'bg-emerald-500/30'
                                : 'bg-gradient-to-r from-brand-teal/10 via-brand-teal/25 to-brand-teal/40'
                        }`}
                        style={{
                            width: `${dragX + handleWidth}px`,
                            transition: isDragging ? 'none' : 'width 0.3s ease-out'
                        }}
                    />

                    {/* Animated Shimmer Text Track Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12">
                        {isUnlocked ? (
                            <span className="text-xs font-black uppercase font-mono tracking-wider text-emerald-300 animate-pulse flex items-center gap-1.5">
                                🔓 Dveře Odemčeny!
                            </span>
                        ) : (
                            <span className="text-[11px] font-extrabold uppercase font-sans tracking-wide text-gray-300 animate-pulse flex items-center gap-1">
                                Potažením otevřít <span className="text-brand-teal text-sm">➔</span>
                            </span>
                        )}
                    </div>

                    {/* Sliding Thumb Handle */}
                    <div
                        ref={handleRef}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        style={{
                            transform: `translateX(${dragX}px)`,
                            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                        }}
                        className={`relative z-10 w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-lg cursor-grab active:cursor-grabbing transition-colors duration-300 ${
                            isUnlocked
                                ? 'bg-emerald-400 text-black shadow-emerald-400/50 scale-105 animate-bounce'
                                : 'bg-brand-teal text-black shadow-brand-teal/40 hover:bg-brand-teal-hover'
                        }`}
                    >
                        <RemoteIcon className={`h-5 w-5 ${isUnlockingLoading ? 'animate-spin' : (isUnlocked ? 'scale-110' : '')}`} />
                    </div>
                </div>
            </div>
        </div>
    );
};
