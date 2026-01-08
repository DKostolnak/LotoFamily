'use client';

import React from 'react';
import { SabotageType } from '@/lib/types';
import { SABOTAGE_COSTS } from '@/lib/constants';
import { playClickSound } from './GameAudioPlayer';
import type { TranslationDictionary } from '@/lib/translations';

interface SabotageShopProps {
    energy: number;
    activeItem: SabotageType | null;
    onUseItem: (type: SabotageType) => void;
    t: TranslationDictionary;
}

interface SabotageItemConfig {
    type: SabotageType;
    emoji: string;
    labelKey: 'freeze' | 'ink' | 'shuffle';
    descKey: 'freezeDesc' | 'inkDesc' | 'shuffleDesc';
    colorFrom: string;
    colorTo: string;
}

// Item visuals config - costs come from constants
const SABOTAGE_ITEMS: SabotageItemConfig[] = [
    {
        type: 'snowball',
        emoji: '❄️',
        labelKey: 'freeze',
        descKey: 'freezeDesc',
        colorFrom: 'from-blue-400',
        colorTo: 'to-blue-600'
    },
    {
        type: 'ink_splat',
        emoji: '🐙',
        labelKey: 'ink',
        descKey: 'inkDesc',
        colorFrom: 'from-purple-400',
        colorTo: 'to-purple-600'
    },
    {
        type: 'swap_hand',
        emoji: '🌀',
        labelKey: 'shuffle',
        descKey: 'shuffleDesc',
        colorFrom: 'from-orange-400',
        colorTo: 'to-red-600'
    },
];

/**
 * SabotageShop Component
 * Redesigned for maximum visual impact and clarity
 */
export default function SabotageShop({ energy, activeItem, onUseItem, t }: SabotageShopProps) {
    const handleClick = (type: SabotageType) => {
        playClickSound();
        onUseItem(type);
    };

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            {/* Energy Bar */}
            <div className="relative w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 mx-auto max-w-xs transition-transform hover:scale-105">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-amber-600 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, energy)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white shadow-black drop-shadow-md">
                    ⚡ {energy} {t.energy}
                </div>
            </div>

            {/* Shop Items */}
            <div className="flex justify-center gap-3 w-full">
                {SABOTAGE_ITEMS.map(item => {
                    const cost = SABOTAGE_COSTS[item.type];
                    const canAfford = energy >= cost;
                    const isActive = activeItem === item.type;
                    const progress = Math.min(100, (energy / cost) * 100);

                    return (
                        <button
                            key={item.type}
                            onClick={() => handleClick(item.type)}
                            disabled={!canAfford && !isActive}
                            className={`
                                relative group flex flex-col items-center justify-between
                                w-20 h-24 p-2 rounded-xl transition-all duration-300
                                ${isActive ? 'ring-4 ring-white scale-110 z-10' : ''}
                                ${canAfford
                                    ? `bg-gradient-to-b ${item.colorFrom} ${item.colorTo} shadow-lg hover:shadow-xl hover:-translate-y-1`
                                    : 'bg-gray-800/80 opacity-80 cursor-not-allowed grayscale'
                                }
                            `}
                        >
                            {/* Cost Badge */}
                            <div className="absolute -top-2 -right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/20">
                                {cost}
                            </div>

                            {/* Icon */}
                            <div className={`text-3xl filter drop-shadow-md ${canAfford ? 'animate-bounce-subtle' : ''}`}>
                                {item.emoji}
                            </div>

                            {/* Label */}
                            <div className="mt-1 text-[10px] font-bold text-white leading-tight text-center">
                                {t[item.labelKey]}
                            </div>

                            {/* Cooldown/Progress Overlay (if not affordable) */}
                            {!canAfford && (
                                <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full rounded-b-xl overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}

                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl border-2 border-white animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
