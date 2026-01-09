/**
 * RankBadge Component
 *
 * Displays the player's rank/tier with a trophy icon.
 * Reusable across MainMenu, PlayerStats, and other components.
 */

import React from 'react';

interface RankBadgeProps {
    /** Current tier name (e.g., 'Bronze', 'Silver', 'Gold') */
    tier: string;
    /** Optional size variant */
    size?: 'sm' | 'md';
    /** Optional additional className */
    className?: string;
    /** Optional inline styles (merged with internal styles) */
    style?: React.CSSProperties;
}

/**
 * Displays rank/tier with trophy icon in a styled badge
 */
export function RankBadge({ tier, size = 'md', className = '', style = {} }: RankBadgeProps) {
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
                border: '1px solid rgba(255, 215, 0, 0.3)',
                ...style,
            }}
        >
            <span style={{ fontSize: isSmall ? '0.9rem' : '1rem' }}>🏆</span>
            <span
                style={{
                    color: '#e8d4b8',
                    fontWeight: 'bold',
                    fontSize: isSmall ? '0.8rem' : '0.9rem',
                }}
            >
                {tier || 'Bronze'}
            </span>
        </div>
    );
}

export default RankBadge;
