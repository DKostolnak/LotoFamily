'use client';

import React, { useMemo } from 'react';
import { useGame, DEFAULT_AVATARS } from '@/lib/GameContext';
import { playClickSound } from '@/lib/audio';
import { SHOP_ITEMS } from '@/lib/shopData';

interface AvatarPickerProps {
    currentAvatar: string;
    onSelect: (avatar: string) => void;
    label?: string;
}

export default function AvatarPicker({ currentAvatar, onSelect, label }: AvatarPickerProps) {
    const { inventory } = useGame();
    const [isExpanded, setIsExpanded] = React.useState(false);

    const allAvatars = useMemo(() => {
        // Get unlocked items from context
        const unlockedAvatars = SHOP_ITEMS
            .filter(item => item.category === 'avatar' && inventory.includes(item.id))
            .map(item => item.icon);

        // Combine default + unlocked
        return [...DEFAULT_AVATARS, ...unlockedAvatars];
    }, [inventory]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '12px' }}>
            {/* Header / Toggle */}
            <div
                onClick={() => { playClickSound(); setIsExpanded(!isExpanded); }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: '1px solid #5a4025',
                    transition: 'all 0.2s',
                    width: '100%',
                    justifyContent: 'space-between'
                }}
                className="hover:bg-black/30 active:scale-95"
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8b6b4a', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {label || 'Avatar'}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{currentAvatar}</span>
                    <span style={{ color: '#8b6b4a', fontSize: '0.8rem' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {/* Grid */}
            {isExpanded && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '6px',
                    maxWidth: '340px',
                    padding: '12px',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    border: '1px solid rgba(90, 64, 37, 0.3)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    {allAvatars.map((avatar) => {
                        const isSelected = currentAvatar === avatar;
                        return (
                            <button
                                key={avatar}
                                type="button"
                                onClick={() => {
                                    playClickSound();
                                    onSelect(avatar);
                                    setIsExpanded(false); // Auto-collapse on select? Maybe better UX for mobile.
                                }}
                                className="active:scale-95 transition-transform hover:brightness-110"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '20px',
                                    borderRadius: '10px',
                                    background: isSelected
                                        ? 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)'
                                        : '#1a1109', // Dark wood background for inactive
                                    border: isSelected
                                        ? '2px solid #b8860b'
                                        : '2px solid #3d2814',
                                    cursor: 'pointer',
                                    boxShadow: isSelected
                                        ? '0 0 12px rgba(255, 215, 0, 0.4)'
                                        : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s',
                                    position: 'relative',
                                    zIndex: isSelected ? 10 : 1,
                                }}
                            >
                                {avatar}
                            </button>
                        );
                    })}
                </div>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
}
