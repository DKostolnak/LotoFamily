'use client';

import React from 'react';
import { SabotageType } from '@/lib/types';
import { playClickSound } from './GameAudioPlayer';

interface SabotageShopProps {
    energy: number;
    activeItem: SabotageType | null;
    onUseItem: (type: SabotageType) => void;
}

interface SabotageItemConfig {
    type: SabotageType;
    emoji: string;
    cost: number;
    tooltip: string;
    buttonClass: string;
}

const SABOTAGE_ITEMS: SabotageItemConfig[] = [
    { type: 'snowball', emoji: '❄️', cost: 30, tooltip: 'Freeze (30e)', buttonClass: 'btn-info' },
    { type: 'ink_splat', emoji: '🐙', cost: 60, tooltip: 'Ink Squirt (60e)', buttonClass: 'btn-purple' },
    { type: 'swap_hand', emoji: '🌀', cost: 90, tooltip: 'Chaos Shuffle (90e)', buttonClass: 'btn-warning' },
];

/**
 * SabotageShop Component
 * Displays available sabotage items with energy costs
 */
export default function SabotageShop({ energy, activeItem, onUseItem }: SabotageShopProps) {
    const handleClick = (type: SabotageType) => {
        playClickSound();
        onUseItem(type);
    };

    return (
        <div className="flex items-center gap-1 py-1 px-2 rounded-lg bg-black/30 backdrop-blur-sm">
            {/* Energy Display */}
            <span
                className="text-sm font-bold mr-1"
                style={{ color: 'var(--color-gold)' }}
            >
                ⚡{energy}
            </span>

            {/* Sabotage Buttons */}
            {SABOTAGE_ITEMS.map(item => {
                const canAfford = energy >= item.cost;
                const isActive = activeItem === item.type;

                return (
                    <button
                        key={item.type}
                        className={`btn btn-xs tooltip tooltip-bottom ${isActive ? 'ring-2 ring-white' : ''
                            } ${canAfford ? `${item.buttonClass} hover:opacity-90` : 'opacity-50 grayscale'}`}
                        onClick={() => handleClick(item.type)}
                        disabled={!canAfford}
                        data-tip={item.tooltip}
                        aria-label={item.tooltip}
                    >
                        {item.emoji} {item.cost}
                    </button>
                );
            })}
        </div>
    );
}
