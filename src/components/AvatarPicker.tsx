'use client';

import React from 'react';
import { playClickSound } from '@/lib/audio';

interface AvatarPickerProps {
    currentAvatar: string;
    onSelect: (avatar: string) => void;
    label?: string;
}

const AVATARS = [
    '🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸',
    '🐣', '🦄', '🐲', '🐙', '🦋', '🐝', '🐞', '🐢'
];

/**
 * AvatarPicker Component
 * Renders a grid of emoji avatars.
 * Styled with Royal Wooden theme (Dark wood inactive, Gold active).
 */
export default function AvatarPicker({ currentAvatar, onSelect, label }: AvatarPickerProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '12px' }}>
            {label && (
                <label style={{
                    color: '#8b6b4a',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    {label}
                </label>
            )}

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '8px',
                maxWidth: '340px',
                padding: '4px'
            }}>
                {AVATARS.map((avatar) => {
                    const isSelected = currentAvatar === avatar;
                    return (
                        <button
                            key={avatar}
                            type="button"
                            onClick={() => {
                                playClickSound();
                                onSelect(avatar);
                            }}
                            className="active:scale-95 transition-transform hover:brightness-110"
                            style={{
                                width: '48px',
                                height: '48px',
                                fontSize: '24px',
                                borderRadius: '12px',
                                background: isSelected
                                    ? 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)'
                                    : '#1a1109', // Dark wood background for inactive
                                border: isSelected
                                    ? '2px solid #b8860b'
                                    : '2px solid #3d2814',
                                cursor: 'pointer',
                                boxShadow: isSelected
                                    ? '0 0 15px rgba(255, 215, 0, 0.4)'
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
        </div>
    );
}
