/**
 * CoinBadge Component
 *
 * Displays the current coin balance with a gold coin icon.
 * Reusable across MainMenu, GameHeader, and other components.
 */

import React from 'react';
import { k_colorGold } from '@/lib/constants';

interface CoinBadgeProps {
    /** Current coin amount to display */
    coins: number;
    /** Optional size variant */
    size?: 'sm' | 'md';
    /** Optional additional className */
    className?: string;
}

/**
 * Displays a coin amount with icon in a styled badge
 */
export function CoinBadge({ coins, size = 'md', className = '' }: CoinBadgeProps) {
    const isSmall = size === 'sm';

    return (
        <div
            className={className}
            style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: isSmall ? '4px 8px' : '6px 12px',
                borderRadius: isSmall ? '12px' : '20px',
                display: 'flex',
                alignItems: 'center',
                gap: isSmall ? '4px' : '8px',
                border: `1px solid rgba(255, 215, 0, 0.3)`,
            }}
        >
            <span style={{ fontSize: isSmall ? '1rem' : '1.2rem' }}>💰</span>
            <span
                style={{
                    color: k_colorGold,
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    fontSize: isSmall ? '0.9rem' : '1.1rem',
                }}
            >
                {coins}
            </span>
        </div>
    );
}

export default CoinBadge;
