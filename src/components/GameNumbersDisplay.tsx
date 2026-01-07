'use client';

import React from 'react';

interface GameNumbersDisplayProps {
    currentNumber: number | null;
    history: number[];
}

/**
 * GameNumbersDisplay Component
 * Displays the current called number (Main Chip) and the recent history (History Chips).
 * Styled with a wooden theme and centered layout.
 */
export default function GameNumbersDisplay({
    currentNumber,
    history,
}: GameNumbersDisplayProps) {
    return (
        <div className="w-full h-full min-h-[130px] relative flex items-center justify-center overflow-visible">
            {/* Main Chip - Static (Flow) Center for robustness - z-30 to be on top */}
            <div className="relative z-30 flex-shrink-0">
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
                        <img
                            src="/assets/wooden-medallion.jpg"
                            alt="chip"
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                            }}
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

            {/* History Chips - Absolute Center + Offset relative to the container center */}
            <div
                className="absolute flex items-center gap-2 z-20"
                style={{
                    left: '50%',
                    top: '50%',
                    // Offset: Start 45px to the right of center (slight overlap/tighter fit)
                    // Start 15px down from center (more distinct stepped effect)
                    // Note: Since main chip is 90px wide (radius 45px), margin-left 45px starts exactly at its edge. 
                    // To overlap slightly or be tight, 45px is good.
                    marginLeft: '45px',
                    marginTop: '15px',

                    background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.25) 100%)',
                    borderRadius: '25px',
                    padding: '6px 10px',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap', // Prevent wrapping
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
                            }}
                        >
                            <img
                                src="/assets/wooden-medallion.jpg"
                                alt="chip"
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
        </div>
    );
}
