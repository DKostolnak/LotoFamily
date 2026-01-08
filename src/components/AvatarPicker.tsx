'use client';

import React from 'react';

interface AvatarPickerProps {
    currentAvatar: string;
    onSelect: (avatar: string) => void;
    label?: string;
}

const AVATARS = [
    '🐻', '🦊', '🐱', '🐼', '🦁', '🐯', '🐨', '🐸',
    '🐣', '🦄', '🐲', '🐙', '🦋', '🐝', '🐞', '🐢'
];

export default function AvatarPicker({ currentAvatar, onSelect, label }: AvatarPickerProps) {
    return (
        <div className="flex flex-col gap-sm items-center w-full">
            {label && <label className="text-xs opacity-70 uppercase tracking-wider">{label}</label>}
            <div className="flex flex-wrap justify-center gap-xs" style={{ maxWidth: '320px', padding: 'var(--space-xs)' }}>
                {AVATARS.map((avatar) => (
                    <button
                        key={avatar}
                        type="button"
                        onClick={() => onSelect(avatar)}
                        className={`flex items-center justify-center shrink-0`}
                        style={{
                            width: '40px',
                            height: '40px',
                            fontSize: '20px',
                            borderRadius: 'var(--radius-md)',
                            aspectRatio: '1/1',
                            background: currentAvatar === avatar ? 'var(--color-gold)' : 'var(--color-cell-empty)',
                            border: currentAvatar === avatar ? '2px solid var(--color-gold-light)' : '1px solid var(--color-card-border)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            transform: currentAvatar === avatar ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: currentAvatar === avatar ? 'var(--shadow-md)' : 'none',
                        }}
                    >
                        {avatar}
                    </button>
                ))}
            </div>
        </div>
    );
}
