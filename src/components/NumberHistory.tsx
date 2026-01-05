'use client';

import React, { useState, useEffect } from 'react';

interface NumberHistoryProps {
    numbers: number[];
    maxVisible?: number;
}

/**
 * NumberHistory Component
 * Shows the last called numbers in small medallions with slide-in animation
 */
export default function NumberHistory({
    numbers,
    maxVisible = 5,
}: NumberHistoryProps) {
    const visibleNumbers = numbers.slice(-maxVisible).reverse();
    const [animatingNumber, setAnimatingNumber] = useState<number | null>(null);

    useEffect(() => {
        if (numbers.length > 0) {
            const latestNum = numbers[numbers.length - 1];
            setAnimatingNumber(latestNum);

            // Reset animation after it plays
            const timer = setTimeout(() => {
                setAnimatingNumber(null);
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [numbers.length]);

    return (
        <div className="flex gap-sm items-center" style={{ overflow: 'hidden' }}>
            {visibleNumbers.map((num, index) => {
                const isNew = index === 0 && num === animatingNumber;

                return (
                    <div
                        key={`${num}-${index}`}
                        className="medallion medallion-sm"
                        style={{
                            opacity: 1 - index * 0.15,
                            transform: isNew
                                ? 'translateX(0) scale(1)'
                                : `scale(${1 - index * 0.05})`,
                            animation: isNew ? 'slideIn 0.3s ease-out' : undefined,
                            transition: 'all 0.3s ease-out',
                        }}
                    >
                        {num}
                    </div>
                );
            })}
            {numbers.length > maxVisible && (
                <span style={{ color: 'var(--color-text-light)', opacity: 0.7, fontSize: '0.8rem' }}>
                    +{numbers.length - maxVisible}
                </span>
            )}

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(-20px) scale(0.8);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}

