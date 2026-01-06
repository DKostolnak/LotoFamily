'use client';

import React from 'react';

interface GameSettingsFormProps {
    autoCallEnabled: boolean;
    setAutoCallEnabled: (enabled: boolean) => void;
    autoCallSpeed: 'slow' | 'normal' | 'fast';
    setAutoCallSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
    crazyMode: boolean;
    setCrazyMode: (enabled: boolean) => void;
    t: {
        autoCall: string;
        speed: string;
        slow: string;
        normal: string;
        fast: string;
        crazyMode: string;
        crazyModeDesc: string;
    };
}

/**
 * GameSettingsForm Component
 * Extracted from MainMenu for better code organization
 * Handles game configuration options like auto-call and crazy mode
 */
export default function GameSettingsForm({
    autoCallEnabled,
    setAutoCallEnabled,
    autoCallSpeed,
    setAutoCallSpeed,
    crazyMode,
    setCrazyMode,
    t
}: GameSettingsFormProps) {
    return (
        <div style={{ background: 'var(--color-cell-empty)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
            {/* Auto-Call Toggle */}
            <div className="flex items-center justify-between" style={{ marginBottom: autoCallEnabled ? 'var(--space-sm)' : 'var(--space-md)' }}>
                <span style={{ fontWeight: 600 }}>{t.autoCall}</span>
                <input
                    type="checkbox"
                    checked={autoCallEnabled}
                    onChange={(e) => setAutoCallEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-gold)' }}
                />
            </div>

            {/* Speed Selection (only visible when auto-call is on) */}
            {autoCallEnabled && (
                <div style={{ marginBottom: 'var(--space-md)' }}>
                    <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-xs)', opacity: 0.8 }}>
                        {t.speed}
                    </label>
                    <div className="flex gap-sm">
                        {(['slow', 'normal', 'fast'] as const).map((s) => (
                            <button
                                key={s}
                                className={`btn ${autoCallSpeed === s ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1, padding: 'var(--space-xs)', fontSize: 'var(--font-size-xs)' }}
                                onClick={() => setAutoCallSpeed(s)}
                            >
                                {t[s]}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Crazy Mode Toggle */}
            <div className="flex items-center justify-between">
                <span style={{ fontWeight: 600 }}>🎲 {t.crazyMode}</span>
                <input
                    type="checkbox"
                    checked={crazyMode}
                    onChange={(e) => setCrazyMode(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--color-red)' }}
                />
            </div>

            {/* Crazy Mode Description */}
            {crazyMode && (
                <p style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7, marginTop: 'var(--space-xs)' }}>
                    {t.crazyModeDesc}
                </p>
            )}
        </div>
    );
}
