'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ShakeIntensity = 'light' | 'medium' | 'heavy';

interface ScreenShakeContextType {
    shake: (intensity: ShakeIntensity) => void;
}

const ScreenShakeContext = createContext<ScreenShakeContextType | null>(null);

export function useScreenShake() {
    const context = useContext(ScreenShakeContext);
    if (!context) {
        throw new Error('useScreenShake must be used within a ScreenShakeProvider');
    }
    return context;
}

export default function ScreenShakeProvider({ children }: { children: ReactNode }) {
    const [shakeClass, setShakeClass] = useState<string>('');

    const shake = useCallback((intensity: ShakeIntensity) => {
        const className = `animate-shake-${intensity}`;
        setShakeClass(className);

        // Remove class after animation completes to allow re-triggering
        const duration = intensity === 'heavy' ? 500 : intensity === 'medium' ? 400 : 300;

        setTimeout(() => {
            setShakeClass('');
        }, duration);
    }, []);

    return (
        <ScreenShakeContext.Provider value={{ shake }}>
            <div className={`${shakeClass} min-h-screen transition-transform will-change-transform`}>
                {children}
            </div>
        </ScreenShakeContext.Provider>
    );
}
