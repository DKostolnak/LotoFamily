'use client';

import React from 'react';

interface CallerBoardProps {
    calledNumbers: number[];
    currentNumber: number | null;
}

export default function CallerBoard({ calledNumbers, currentNumber }: CallerBoardProps) {
    // Create a 9x10 grid showing all numbers 1-90
    const numberBoard: (number | null)[][] = [];
    for (let row = 0; row < 9; row++) {
        const boardRow: (number | null)[] = [];
        for (let col = 0; col < 10; col++) {
            const num = col * 9 + row + 1;
            boardRow.push(num <= 90 ? num : null);
        }
        numberBoard.push(boardRow);
    }

    return (
        <div className="card" style={{ padding: 'var(--space-sm)' }}>
            <p style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--space-sm)', opacity: 0.6 }}>
                Called: {calledNumbers.length} / 90
            </p>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, 1fr)',
                    gap: '2px',
                }}
            >
                {numberBoard.flat().map((num, index) => {
                    if (num === null) return <div key={index} />;

                    const isCalled = calledNumbers.includes(num);
                    const isCurrent = num === currentNumber;

                    return (
                        <div
                            key={num}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: isCalled ? 700 : 400,
                                background: isCurrent
                                    ? 'var(--color-gold)'
                                    : isCalled
                                        ? 'var(--color-red)'
                                        : 'var(--color-cell-empty)',
                                color: isCalled ? 'var(--color-text-light)' : 'var(--color-text-primary)',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'all var(--transition-fast)',
                            }}
                        >
                            {num}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
