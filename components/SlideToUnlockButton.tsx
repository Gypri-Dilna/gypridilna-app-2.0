import React, { useState, useRef, useEffect } from 'react';
import { LockClosedIcon, LockOpenIcon } from './icons';

interface SlideToUnlockButtonProps {
    onUnlock: () => Promise<void>;
    label?: string;
    className?: string;
}

export const SlideToUnlockButton: React.FC<SlideToUnlockButtonProps> = ({
    onUnlock,
    label = 'Potažením otevřít dveře',
    className = ''
}) => {
    const [dragX, setDragX] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
    const [isUnlockingLoading, setIsUnlockingLoading] = useState<boolean>(false);

    const trackRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef<number>(0);

    const handleSize = 44; // 44px circular handle

    const getMaxSlide = () => {
        if (!trackRef.current) return 200;
        // 4px padding on left + 4px padding on right = 8px total track padding
        return trackRef.current.clientWidth - handleSize - 8;
    };

    const currentMax = getMaxSlide();
    const progress = currentMax > 0 ? Math.min(1, Math.max(0, dragX / currentMax)) : 0;

    // Start Drag (Touch or Mouse)
    const startDrag = (clientX: number) => {
        if (isUnlocked || isUnlockingLoading) return;
        setIsDragging(true);
        startXRef.current = clientX - dragX;
    };

    const moveDrag = (clientX: number) => {
        if (!isDragging || isUnlocked || isUnlockingLoading) return;
        const max = getMaxSlide();
        const currentX = clientX - startXRef.current;
        const clampedX = Math.max(0, Math.min(currentX, max));
        setDragX(clampedX);

        if (clampedX >= max * 0.88) {
            triggerUnlock();
        }
    };

    const endDrag = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const max = getMaxSlide();
        if (dragX < max * 0.88 && !isUnlocked) {
            setDragX(0); // Spring snap back to start
        }
    };

    // Global Event Listeners for smooth drag tracking
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
        const onMouseUp = () => endDrag();
        const onTouchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientX);
        const onTouchEnd = () => endDrag();

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
            window.addEventListener('touchmove', onTouchMove);
            window.addEventListener('touchend', onTouchEnd);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [isDragging, dragX]);

    const triggerUnlock = async () => {
        setIsDragging(false);
        const max = getMaxSlide();
        setDragX(max);
        setIsUnlocked(true);
        setIsUnlockingLoading(true);

        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate([50, 30, 50]);
            } catch (e) {}
        }

        try {
            await onUnlock();
        } catch (err) {
            console.error('Unlock error:', err);
        } finally {
            setIsUnlockingLoading(false);
            setTimeout(() => {
                setIsUnlocked(false);
                setDragX(0);
            }, 2500);
        }
    };

    return (
        <div className={`w-full min-w-[240px] sm:min-w-[320px] md:min-w-[360px] max-w-md shrink-0 select-none ${className}`}>
            {/* Slide-to-Unlock Round Pill Track */}
            <div
                ref={trackRef}
                className={`relative w-full h-[52px] min-w-[240px] sm:min-w-[320px] md:min-w-[360px] rounded-full p-1 flex items-center select-none overflow-hidden transition-colors duration-300 ${
                    isUnlocked
                        ? 'bg-emerald-950/40 border border-emerald-500/30'
                        : 'bg-[#181d24] border border-[#3aa398]/40 shadow-inner'
                }`}
            >
                {/* Active Fill Trail (Matches handle 44px height & 22px radius perfectly) */}
                <div
                    className={`absolute left-1 top-1 bottom-1 rounded-full transition-all ${
                        isUnlocked
                            ? 'bg-emerald-500/20 border border-emerald-500/20'
                            : 'bg-gradient-to-r from-[#3aa398]/10 via-[#3aa398]/25 to-[#3aa398]/50'
                    }`}
                    style={{
                        width: `${dragX + handleSize}px`,
                        transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                />

                {/* Shimmer Text & Chevron Arrow Guide (Hidden when unlocked to keep track clean) */}
                {!isUnlocked && (
                    <div 
                        className="absolute inset-0 flex items-center justify-center pointer-events-none pl-14 pr-4 transition-opacity duration-200"
                        style={{ opacity: Math.max(0, 1 - progress * 1.8) }}
                    >
                        <div className="flex items-center gap-1.5 font-bold text-xs tracking-wide text-gray-300 whitespace-nowrap overflow-hidden">
                            <span className="bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-clip-text text-transparent animate-pulse whitespace-nowrap">
                                {label}
                            </span>
                            <span className="text-[#3aa398] font-mono font-black animate-pulse whitespace-nowrap">›››</span>
                        </div>
                    </div>
                )}

                {/* Circular Slider Handle Button (Flush against edges) */}
                <div
                    onMouseDown={(e) => startDrag(e.clientX)}
                    onTouchStart={(e) => startDrag(e.touches[0].clientX)}
                    style={{
                        transform: `translateX(${dragX}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
                    }}
                    className={`relative z-10 w-[44px] h-[44px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-300 shrink-0 ${
                        isUnlocked
                            ? 'bg-emerald-500 text-black shadow-md'
                            : 'bg-[#3aa398] text-black shadow-[0_0_10px_rgba(58,163,152,0.4)] hover:bg-[#46c2b5]'
                    }`}
                >
                    {isUnlockingLoading ? (
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : isUnlocked ? (
                        <LockOpenIcon className="h-5 w-5 text-black animate-pulse" />
                    ) : (
                        <LockClosedIcon className="h-5 w-5 text-black" />
                    )}
                </div>
            </div>
        </div>
    );
};
