'use client';

import React from 'react';

export interface WoodenCardProps {
    children: React.ReactNode;
    title?: string;
    showBackArrow?: boolean;
    onBack?: () => void;
    style?: React.CSSProperties;
    maxWidth?: string;
}

export function WoodenCard({
    children,
    title,
    showBackArrow,
    onBack,
    style,
    maxWidth = 'clamp(320px, 90vw, 520px)',
}: WoodenCardProps) {
    return (
        <div
            style={{
                position: 'relative',
                zIndex: 10,
                width: '100%',
                maxWidth,
                padding: 'clamp(16px, 3vw, 32px)',
                paddingTop: showBackArrow ? 'clamp(48px, 4vw, 56px)' : 'clamp(16px, 3vw, 32px)',
                backgroundColor: 'rgba(26, 17, 9, 0.95)',
                border: '4px solid #8b6b4a',
                borderRadius: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'clamp(12px, 2vw, 24px)',
                margin: 'auto',
                ...style,
            }}
        >
            {/* Optional Back Arrow */}
            {showBackArrow && onBack && (
                <button
                    type="button"
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
                        borderRadius: '8px',
                        border: '2px solid #5a4025',
                        boxShadow: '0 2px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20,
                        color: '#3d2814',
                    }}
                    title="Back"
                    className="active:scale-95 transition-transform"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            )}

            {/* Optional Title Section */}
            {title && (
                <div style={{ textAlign: 'center', width: '100%', marginBottom: '8px' }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#ffd700',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    }}>
                        {title}
                    </h2>
                </div>
            )}

            {children}
        </div>
    );
}
