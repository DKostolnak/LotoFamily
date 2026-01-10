'use client';

/**
 * LocalGameModal Component
 * 
 * Modal for creating or joining a local P2P game.
 * Provides host/join options with room code entry.
 */

import React, { useState } from 'react';
import { WoodenButton, WoodenCard } from './common';
import { playClickSound } from '@/lib/audio';

interface LocalGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateRoom: (playerName: string) => Promise<string>;
    onJoinRoom: (roomCode: string, playerName: string) => Promise<void>;
    initialPlayerName?: string;
}

export default function LocalGameModal({
    isOpen,
    onClose,
    onCreateRoom,
    onJoinRoom,
    initialPlayerName = '',
}: LocalGameModalProps) {
    const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
    const [playerName, setPlayerName] = useState(initialPlayerName);
    const [roomCode, setRoomCode] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleCreateRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        playClickSound();
        setIsLoading(true);
        setError(null);

        try {
            const code = await onCreateRoom(playerName.trim());
            setCreatedCode(code);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!roomCode.trim() || roomCode.length !== 4) {
            setError('Please enter a 4-letter room code');
            return;
        }

        playClickSound();
        setIsLoading(true);
        setError(null);

        try {
            await onJoinRoom(roomCode.trim().toUpperCase(), playerName.trim());
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        playClickSound();
        if (mode === 'select') {
            onClose();
        } else {
            setMode('select');
            setError(null);
            setCreatedCode('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
        }}>
            <WoodenCard
                title={mode === 'select' ? '🏠 Local Game' : mode === 'host' ? '📡 Host Game' : '🔗 Join Game'}
                showBackArrow
                onBack={handleBack}
            >
                {/* Error Display */}
                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '0.875rem',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Mode Selection */}
                {mode === 'select' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{
                            color: '#8b6b4a',
                            textAlign: 'center',
                            marginBottom: '8px',
                            fontSize: '0.9rem',
                        }}>
                            Play without internet! One device hosts, others join with a code.
                        </p>

                        <WoodenButton
                            onClick={() => { playClickSound(); setMode('host'); }}
                            variant="primary"
                        >
                            📡 Host a Game
                        </WoodenButton>

                        <WoodenButton
                            onClick={() => { playClickSound(); setMode('join'); }}
                            variant="secondary"
                        >
                            🔗 Join a Game
                        </WoodenButton>
                    </div>
                )}

                {/* Host Mode */}
                {mode === 'host' && !createdCode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#8b6b4a',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                            }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your name"
                                maxLength={20}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #5a4025',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    color: '#e8d4b8',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <WoodenButton
                            onClick={handleCreateRoom}
                            variant="primary"
                            disabled={isLoading}
                        >
                            {isLoading ? '⏳ Creating...' : '🎮 Create Room'}
                        </WoodenButton>
                    </div>
                )}

                {/* Host Mode - Room Created */}
                {mode === 'host' && createdCode && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                        <p style={{
                            color: '#4ade80',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                        }}>
                            ✅ Room created! Share this code:
                        </p>

                        <div style={{
                            fontSize: '3rem',
                            fontWeight: 900,
                            color: '#ffd700',
                            letterSpacing: '0.3em',
                            fontFamily: 'monospace',
                            textShadow: '0 2px 8px rgba(255, 215, 0, 0.5)',
                            padding: '16px 24px',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            borderRadius: '12px',
                            border: '2px solid #ffd700',
                        }}>
                            {createdCode}
                        </div>

                        <p style={{
                            color: '#8b6b4a',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                        }}>
                            Tell other players to enter this code to join.
                            <br />
                            Waiting for players...
                        </p>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#8b6b4a',
                            marginTop: '8px',
                        }}>
                            <div className="animate-pulse" style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#4ade80',
                            }} />
                            <span>Hosting...</span>
                        </div>
                    </div>
                )}

                {/* Join Mode */}
                {mode === 'join' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#8b6b4a',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                            }}>
                                Your Name
                            </label>
                            <input
                                type="text"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter your name"
                                maxLength={20}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #5a4025',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    color: '#e8d4b8',
                                    fontSize: '1rem',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div>
                            <label style={{
                                display: 'block',
                                color: '#8b6b4a',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                marginBottom: '6px',
                                textTransform: 'uppercase',
                            }}>
                                Room Code
                            </label>
                            <input
                                type="text"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
                                placeholder="ABCD"
                                maxLength={4}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '2px solid #5a4025',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    color: '#ffd700',
                                    fontSize: '2rem',
                                    fontWeight: 900,
                                    fontFamily: 'monospace',
                                    textAlign: 'center',
                                    letterSpacing: '0.3em',
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <WoodenButton
                            onClick={handleJoinRoom}
                            variant="primary"
                            disabled={isLoading || roomCode.length !== 4}
                        >
                            {isLoading ? '⏳ Joining...' : '🔗 Join Room'}
                        </WoodenButton>
                    </div>
                )}
            </WoodenCard>
        </div>
    );
}
