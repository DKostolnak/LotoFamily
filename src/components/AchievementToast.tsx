'use client';

/**
 * AchievementToast Component
 * 
 * Animated popup notification when a player unlocks an achievement.
 * Auto-dismisses after 4 seconds.
 */

import React, { useEffect, useState } from 'react';
import { playBonusSound } from '@/lib/audio';

interface AchievementToastProps {
    id: string;
    name: string;
    icon: string;
    description: string;
    onDismiss: () => void;
}

export default function AchievementToast({
    id,
    name,
    icon,
    description,
    onDismiss,
}: AchievementToastProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Play celebration sound
        playBonusSound();

        // Animate in
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // Auto-dismiss after 4 seconds
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 400); // Wait for exit animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div
            style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: `translateX(-50%) translateY(${isVisible && !isExiting ? '0' : '-100px'})`,
                opacity: isVisible && !isExiting ? 1 : 0,
                transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease',
                zIndex: 9999,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px 24px',
                    background: 'linear-gradient(135deg, #4a1a6e 0%, #6b2d9e 50%, #4a1a6e 100%)',
                    border: '2px solid #ffd700',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    minWidth: '280px',
                    maxWidth: '400px',
                }}
            >
                {/* Badge Icon */}
                <div
                    style={{
                        fontSize: '48px',
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
                        animation: 'achievementPulse 1s ease-in-out infinite',
                    }}
                >
                    {icon}
                </div>

                {/* Text Content */}
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#ffd700',
                            marginBottom: '4px',
                        }}
                    >
                        🎉 Achievement Unlocked!
                    </div>
                    <div
                        style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            marginBottom: '2px',
                        }}
                    >
                        {name}
                    </div>
                    <div
                        style={{
                            fontSize: '13px',
                            opacity: 0.8,
                        }}
                    >
                        {description}
                    </div>
                </div>
            </div>

            {/* Keyframe animation for pulse */}
            <style jsx>{`
                @keyframes achievementPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
            `}</style>
        </div>
    );
}
