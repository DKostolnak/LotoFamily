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

    // Generate random frost particles for freeze effect
    const [snowflakes, setSnowflakes] = useState<Array<{ id: number, left: number, delay: number }>>([]);

    useEffect(() => {
        if (isFrozen) {
            setSnowflakes(Array.from({ length: 20 }, (_, i) => ({
                id: i,
                left: Math.random() * 100,
                delay: Math.random() * 2
            })));
        }
    }, [isFrozen]);

    // Disable interactions if nothing active
    if (!isFrozen && activeSplats.length === 0) return null;

    return (
        <div className={`fixed inset-0 z-50 pointer-events-none ${isFrozen ? 'pointer-events-auto' : ''}`}>
            {/* Frozen Effect (CSS Only, no missing images) */}
            {isFrozen && (
                <div className="absolute inset-0 z-50 overflow-hidden flex items-center justify-center cursor-not-allowed">
                    {/* Icy Overlay */}
                    <div className="absolute inset-0 bg-cyan-200/20 backdrop-blur-[2px] animate-pulse"></div>

                    {/* Frost Vignette */}
                    <div className="absolute inset-0" style={{
                        background: 'radial-gradient(circle, transparent 40%, rgba(180, 220, 255, 0.6) 90%)',
                        boxShadow: 'inset 0 0 100px rgba(255, 255, 255, 0.5)'
                    }}></div>

                    {/* Falling Snowflakes */}
                    {snowflakes.map(flake => (
                        <div
                            key={flake.id}
                            className="absolute top-0 text-white opacity-80 animate-bounce"
                            style={{
                                left: `${flake.left}%`,
                                animationDuration: `${2 + flake.delay}s`,
                                fontSize: '1.5rem'
                            }}
                        >
                            ❄️
                        </div>
                    ))}

                    {/* Central Icon */}
                    <div className="relative z-10 text-8xl drop-shadow-[0_0_20px_rgba(0,255,255,0.8)] animate-bounce">
                        🥶
                    </div>
                    <div className="absolute top-1/2 mt-12 text-white font-black text-2xl uppercase tracking-widest drop-shadow-md">
                        Frozen!
                    </div>
                </div>
            )}

            {/* Ink Splats (Pointer events auto to allow cleaning) */}
            {activeSplats.map((splat) => (
                <div
                    key={splat.id}
                    className="absolute pointer-events-auto transition-all duration-500 ease-out group"
                    style={{
                        left: `${splat.x}%`,
                        top: `${splat.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: '180px',
                        height: '180px',
                        cursor: 'crosshair' // Signal that you can interact
                    }}
                    onPointerEnter={() => handleSplatHover(splat.id)}
                    onClick={() => handleSplatHover(splat.id)}
                >
                    <div className="relative w-full h-full animate-in zoom-in duration-300">
                        {/* Ink Blob (CSS Shape) */}
                        <div className="absolute inset-0 bg-black rounded-full opacity-90 blur-sm transform scale-95 group-hover:scale-105 transition-transform"
                            style={{
                                clipPath: 'polygon(10% 10%, 20% 5%, 40% 15%, 60% 5%, 80% 15%, 90% 30%, 85% 50%, 95% 70%, 80% 85%, 60% 95%, 40% 85%, 20% 90%, 5% 70%, 15% 50%, 5% 30%)'
                            }}
                        ></div>
                        {/* Core */}
                        <div className="absolute inset-4 bg-gray-900 rounded-full blur-md"></div>
                        {/* Drips */}
                        <div className="absolute bottom-0 left-1/4 w-4 h-12 bg-black rounded-full blur-[2px]"></div>
                        <div className="absolute bottom-2 right-1/3 w-6 h-8 bg-black rounded-full blur-[2px]"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
