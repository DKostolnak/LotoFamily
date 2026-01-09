'use client';

import React, { memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { TranslationDictionary } from '@/lib/translations';
import { playClickSound } from '@/lib/audio';

interface GamePausedOverlayProps {
    roomCode: string;
    joinUrl: string;
    isHost: boolean;
    onResume: () => void;
    t: TranslationDictionary;
}

/**
 * GamePausedOverlay Component
 * 
 * Full-screen overlay shown when the host pauses the game.
 * Displays pause message, QR code for new players, and resume button (host only).
 */
const GamePausedOverlay = memo(function GamePausedOverlay({
    roomCode,
    joinUrl,
    isHost,
    onResume,
    t,
}: GamePausedOverlayProps) {
    const mainStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
    };

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'rgba(26, 17, 9, 0.98)',
        border: '4px solid #8b6b4a',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(0,0,0,0.5)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
    };

    const pulseAnimation: React.CSSProperties = {
        animation: 'pulse 2s ease-in-out infinite',
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '18px',
        borderRadius: '16px',
        border: 'none',
        fontSize: '1.2rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
        color: 'white',
        borderBottom: '4px solid #15803d',
        boxShadow: '0 8px 20px rgba(34, 197, 94, 0.4)',
        transition: 'transform 0.1s',
    };

    return (
        <div style={mainStyle}>
            <div style={cardStyle}>
                {/* Pause Icon */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ffd700 0%, #daa520 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
                    ...pulseAnimation,
                }}>
                    <span style={{ fontSize: '3rem' }}>⏸️</span>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: '#ffd700',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}>
                        {t.paused}
                    </h1>
                    <p style={{
                        color: '#a0937e',
                        fontSize: '1rem',
                        marginTop: '8px',
                    }}>
                        {t.pausedByHost}
                    </p>
                </div>

                {/* Room Code + QR */}
                <div style={{
                    background: 'linear-gradient(180deg, #2d1f10 0%, #1a1109 100%)',
                    border: '2px solid #5a4025',
                    borderRadius: '16px',
                    padding: '20px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <p style={{
                        color: '#8b6b4a',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        margin: 0,
                    }}>
                        {t.roomCodeLabel}
                    </p>
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: 900,
                        color: 'white',
                        letterSpacing: '0.2em',
                        margin: 0,
                        textShadow: '0 0 15px rgba(255, 215, 0, 0.6)',
                    }}>
                        {roomCode}
                    </h2>
                    <div style={{
                        background: 'white',
                        padding: '12px',
                        borderRadius: '12px',
                    }}>
                        <QRCodeSVG value={joinUrl} size={120} level="M" />
                    </div>
                    <p style={{
                        color: '#6b5b4a',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        margin: 0,
                    }}>
                        {t.scanToJoin}
                    </p>
                </div>

                {/* Resume Button (Host only) or Waiting message */}
                {isHost ? (
                    <button
                        onClick={() => { playClickSound(); onResume(); }}
                        style={buttonStyle}
                        className="active:translate-y-1"
                    >
                        ▶️ {t.resume}
                    </button>
                ) : (
                    <div style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(139, 107, 74, 0.2)',
                        border: '1px solid #5a4025',
                        textAlign: 'center',
                    }}>
                        <p style={{
                            color: '#8b6b4a',
                            fontSize: '0.95rem',
                            margin: 0,
                            fontStyle: 'italic',
                        }}>
                            {t.waitingForHost}
                        </p>
                    </div>
                )}
            </div>

            {/* CSS Keyframes */}
            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
});

export default GamePausedOverlay;
