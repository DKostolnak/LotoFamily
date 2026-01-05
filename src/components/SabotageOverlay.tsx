import React, { useEffect, useState } from 'react';

interface SabotageOverlayProps {
    frozenUntil?: number;
    inkSplats?: { x: number; y: number; id: string }[];
}

export default function SabotageOverlay({ frozenUntil, inkSplats }: SabotageOverlayProps) {
    const [now, setNow] = useState(Date.now());
    const [clearedSplats, setClearedSplats] = useState<Set<string>>(new Set());

    // Timer for freeze countdown
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 100);
        return () => clearInterval(interval);
    }, []);

    const isFrozen = frozenUntil && frozenUntil > now;
    const activeSplats = inkSplats?.filter(s => !clearedSplats.has(s.id)) || [];

    // Handle scrubbing ink
    const handleSplatHover = (id: string) => {
        // Simple "hover to clean" - maybe require movement or time?
        // For v1, let's make it 3 hovers or just rapid movement.
        // Simplest: Click to clean, or hover 500ms? 
        // Let's go with: Hover instantly cleans specific splat parts, or just click to remove.
        // Plan said: "scrub". Let's simulate by requiring 3 pointer moves over it?
        // Too complex for now. Let's do: Click to Clean.
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
