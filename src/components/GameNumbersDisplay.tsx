'use client';

import React from 'react';
import Image from 'next/image';

interface GameNumbersDisplayProps {
    currentNumber: number | null;
    history: number[];
}

/**
 * GameNumbersDisplay Component
 * Displays the current called number (Main Chip) and the recent history (History Chips).
 * Main chip is always centered. History chips appear to its right.
 */
export function GameNumbersDisplay({
    currentNumber,
    history,
}: GameNumbersDisplayProps) {
    return (
        <div
            className="relative overflow-visible"
            style={{
                width: '100%',
                height: '130px',
            }}
        >
            {/* Main Chip - Always centered using left:50% + transform */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                }}
            >
                {/* Circular dent/inset in wood */}
                <div
                    style={{
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #3a2614 0%, #4a3520 70%, transparent 100%)',
                        boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.7), inset 0 -2px 8px rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #2d1f10',
                    }}
                >
                    {/* The chip sitting in the dent */}
                    <div
                        style={{
                            width: '74px',
                            height: '74px',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Image
                            src="/assets/wooden-medallion.jpg"
                            alt="chip"
                            width={74}
                            height={74}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
                            priority
                        />
                        <span
                            className="font-bold"
                            style={{
                                position: 'relative',
                                zIndex: 10,
                                fontSize: '36px',
                                color: '#f5e6c8',
                                textShadow: '1px 1px 0 #3d2814, -1px -1px 0 #3d2814, 1px -1px 0 #3d2814, -1px 1px 0 #3d2814, 0 2px 4px rgba(0,0,0,0.6)',
                                letterSpacing: '-1px',
                            }}
                        >
                            {currentNumber !== null ? currentNumber : '?'}
                        </span>
                    </div>
                </div>
            </div>

            {/* History Chips - Positioned to the right of the main chip */}
            {history.length > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        // Start at center + half of main chip width (45px) + small gap (8px)
                        left: 'calc(50% + 53px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 20,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.25) 100%)',
                        borderRadius: '25px',
                        padding: '6px 10px',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
                        marginTop: '15px', // Slight offset down
                    }}
                >
                    {history.slice(-4).reverse().map((num, index) => {
                        const opacity = 1 - index * 0.15;
                        return (
                            <div
                                key={`${num}-${index}`}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity,
                                    flexShrink: 0,
                                }}
                            >
                                <Image
                                    src="/assets/wooden-medallion.jpg"
                                    alt="chip"
                                    width={38}
                                    height={38}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: '50%',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.4)',
                                    }}
                                />
                                <span
                                    className="font-bold"
                                    style={{
                                        position: 'relative',
                                        zIndex: 10,
                                        fontSize: '15px',
                                        color: '#f5e6c8',
                                        textShadow: '1px 1px 0 #3d2814, -1px -1px 0 #3d2814, 1px -1px 0 #3d2814, -1px 1px 0 #3d2814, 0 1px 3px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    {num}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export const GameNumbersDisplayMemo = React.memo(GameNumbersDisplay);
export { GameNumbersDisplayMemo as default };
