import React, { useEffect, useState } from 'react';

interface SabotageOverlayProps {
    frozenUntil?: number;
    inkSplats?: { x: number; y: number; id: string }[];
}

import { useScreenShake } from './ScreenShakeProvider';

export default function SabotageOverlay({ frozenUntil, inkSplats }: SabotageOverlayProps) {
    const [isFrozen, setIsFrozen] = useState(false);
    const [clearedSplats, setClearedSplats] = useState<Set<string>>(new Set());
    const { shake } = useScreenShake();
    const prevFrozenRef = React.useRef(false);
    const prevSplatsLengthRef = React.useRef(0);

    // Efficiently handle freeze state without constant polling
    useEffect(() => {
        if (!frozenUntil) {
            setIsFrozen(false);
            return;
        }

        const checkFreeze = () => {
            const now = Date.now();
            if (frozenUntil > now) {
                setIsFrozen(true);
                // Schedule unfreeze exactly when needed
                const timeLeft = frozenUntil - now;
                const timer = setTimeout(() => setIsFrozen(false), timeLeft);
                return () => clearTimeout(timer);
            } else {
                setIsFrozen(false);
            }
        };

        return checkFreeze();
    }, [frozenUntil]);
    const activeSplats = inkSplats?.filter(s => !clearedSplats.has(s.id)) || [];

    // Trigger Shake on Freeze
    useEffect(() => {
        if (isFrozen && !prevFrozenRef.current) {
            shake('heavy');
        }
        prevFrozenRef.current = !!isFrozen;
    }, [isFrozen, shake]);

    // Trigger Shake on new Ink Splat
    useEffect(() => {
        const currentLength = inkSplats?.length || 0;
        if (currentLength > prevSplatsLengthRef.current) {
            shake('medium');
        }
        prevSplatsLengthRef.current = currentLength;
    }, [inkSplats, shake]);

    // Handle scrubbing ink
    const handleSplatHover = (id: string) => {
        setClearedSplats(prev => {
            const newSet = new Set(prev);
            newSet.add(id);
            return newSet;
        });
    };

    // Disable interactions if nothing active
    if (!isFrozen && activeSplats.length === 0) return null;

    return (
        <div className={`fixed inset-0 z-50 pointer-events-none ${isFrozen ? 'pointer-events-auto' : ''}`}>
            {/* Frozen Effect */}
            {isFrozen && (
                <div className="absolute inset-0 bg-blue-500/30 backdrop-blur-[2px] flex items-center justify-center animate-pulse cursor-not-allowed">
                    <div className="text-6xl animate-bounce">❄️</div>
                    <div className="absolute inset-0 bg-[url('/ice-texture.png')] opacity-50 mix-blend-overlay"></div>
                </div>
            )}

            {/* Ink Splats (Pointer events auto to allow cleaning) */}
            {activeSplats.map((splat) => (
                <div
                    key={splat.id}
                    className="absolute pointer-events-auto transition-opacity duration-500"
                    style={{
                        left: `${splat.x}%`,
                        top: `${splat.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '8rem',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.5))',
                        cursor: 'crosshair'
                    }}
                    onPointerEnter={() => handleSplatHover(splat.id)}
                    onClick={() => handleSplatHover(splat.id)}
                >
                    <div className="animate-in zoom-in duration-300">
                        🐙
                        <div className="absolute inset-0 bg-black rounded-full blur-xl opacity-60 scale-75 -z-10"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
