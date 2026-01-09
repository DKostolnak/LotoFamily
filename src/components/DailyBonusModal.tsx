'use client';

import React, { useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import { WoodenButton } from '@/components/common';
import { playClickSound, playBonusSound } from '@/lib/audio';

interface DailyBonusModalProps {
    onClose: () => void;
}

export default function DailyBonusModal({ onClose }: DailyBonusModalProps) {
    const { latestReward } = useGame();

    useEffect(() => {
        playBonusSound();
    }, []);

    // Only show if it is a daily reward
    if (!latestReward || latestReward.reason !== 'daily') return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    from { transform: scale(0.8); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>

            <div style={{
                backgroundColor: 'rgba(26, 17, 9, 0.98)',
                border: '4px solid #ffd700',
                borderRadius: '24px',
                padding: '32px',
                width: '90%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 0 50px rgba(255, 215, 0, 0.3)',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
                <div style={{
                    fontSize: '4rem',
                    marginBottom: '16px',
                    animation: 'float 2s ease-in-out infinite'
                }}>
                    🎁
                </div>

                <h2 style={{
                    color: '#ffd700',
                    fontSize: '2rem',
                    margin: '0 0 16px 0',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                    Daily Bonus!
                </h2>

                <p style={{
                    color: '#e8d4b8',
                    textAlign: 'center',
                    marginBottom: '24px',
                    fontSize: '1.2rem',
                    lineHeight: 1.5
                }}>
                    Welcome back! Here is your daily reward for playing.
                </p>

                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '2rem' }}>💰</span>
                    <span style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        color: '#ffd700',
                        fontFamily: 'monospace'
                    }}>
                        +{latestReward.amount}
                    </span>
                </div>

                <WoodenButton
                    variant="gold"
                    size="lg"
                    fullWidth
                    onClick={() => {
                        playClickSound();
                        onClose();
                    }}
                >
                    Claim & Play
                </WoodenButton>
            </div>
        </div>
    );
}
