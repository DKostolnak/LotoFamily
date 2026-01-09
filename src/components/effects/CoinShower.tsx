import React, { useEffect, useState, memo } from 'react';
import { useGame } from '@/lib/GameContext';

const COIN_COUNT = 50;

/**
 * CoinShower Component
 * 
 * Displays a falling coin animation when a reward is received.
 * Listens to `latestReward` from GameContext.
 */
export const CoinShower = memo(function CoinShower() {
    const { latestReward } = useGame();
    const [isActive, setIsActive] = useState(false);
    const [coins, setCoins] = useState<Array<{ id: number; left: number; duration: number; delay: number }>>([]);

    useEffect(() => {
        if (latestReward && (Date.now() - latestReward.timestamp < 2000)) {
            // Trigger animation if reward is recent (<2s)
            startAnimation();
        }
    }, [latestReward]);

    const startAnimation = () => {
        const newCoins = Array.from({ length: COIN_COUNT }).map((_, i) => ({
            id: i,
            left: Math.random() * 100, // Random horizontal position 0-100%
            duration: Math.random() * 1 + 1, // Random duration 1-2s
            delay: Math.random() * 0.5, // Random delay 0-0.5s
        }));
        setCoins(newCoins);
        setIsActive(true);

        // Auto-hide after animation
        setTimeout(() => {
            setIsActive(false);
        }, 2500);
    };

    if (!isActive) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden',
        }}>
            {coins.map((coin) => (
                <div
                    key={coin.id}
                    style={{
                        position: 'absolute',
                        top: '-50px',
                        left: `${coin.left}%`,
                        fontSize: '2rem',
                        animation: `fall ${coin.duration}s linear ${coin.delay}s forwards`,
                        opacity: 0,
                    }}
                >
                    💰
                </div>
            ))}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fall {
                    0% {
                        transform: translateY(0) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(110vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes popIn {
                    from { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                    to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `}} />

            {/* Reward Text */}
            {latestReward && (
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    color: '#ffd700',
                    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
                    animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    textAlign: 'center',
                }}>
                    <div>+{latestReward.amount}</div>
                    <div style={{ fontSize: '1.5rem', color: '#fff' }}>
                        {latestReward.reason === 'win' ? 'Winner!' :
                            latestReward.reason === 'daily' ? 'Daily Bonus!' :
                                latestReward.reason === 'participation' ? 'Good Game!' : 'Bonus!'}
                    </div>
                </div>
            )}
        </div>
    );
});
