'use client';

import React, { useState, useCallback, memo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GameState, Player } from '@/lib/types';
import { translations } from '@/lib/translations';
import PlayerList from './PlayerList';
import { useToast } from './ToastProvider';
import { useGame } from '@/lib/GameContext';
import { playClickSound } from '@/lib/audio';
import AvatarPicker from './AvatarPicker';
import PlayerStatsModal from './PlayerStatsModal';

interface WaitingLobbyProps {
    gameState: GameState;
    currentPlayerId: string;
    isHost: boolean;
    onStartGame: (options?: { autoCallIntervalMs: number }) => void;
    onLeaveGame: () => void;
}

/**
 * WaitingLobby Component
 * 
 * Pre-game lobby showing connected players and room code.
 * Styled with "Royal Wooden" theme using inline styles for guaranteed consistency.
 */
import { WoodenCard, WoodenButton, WoodenInput } from '@/components/common';

// ... (keep props interface)

const WaitingLobby = memo(function WaitingLobby({
    gameState,
    currentPlayerId,
    isHost,
    onStartGame,
    onLeaveGame,
}: WaitingLobbyProps) {
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    const canStart = gameState.players.length >= 1;

    const { showToast } = useToast();
    const { updateProfile, kickPlayer, playerAvatar, setPlayerAvatar, addDebugPlayers } = useGame();

    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [tempName, setTempName] = useState(currentPlayer?.name || '');
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

    const t = translations[gameState.settings.language || 'en'];

    // ... (keep logic: joinUrl, handleCopyCode, handleShare, handleUpdateProfile, handleKick)

    const joinUrl = gameState.serverUrl
        ? `${gameState.serverUrl}?room=${gameState.roomCode}`
        : `${typeof window !== 'undefined' ? window.location.origin : ''}?room=${gameState.roomCode}`;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(gameState.roomCode);
            showToast(t.copied, 'success', '📋');
        } catch {
            showToast(t.copiedError, 'error');
        }
    };

    const handleShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: t.joinMyGame,
                    text: `${t.joinWithCode} ${gameState.roomCode}`,
                    url: joinUrl,
                });
            } catch { }
        } else {
            handleCopyCode();
        }
    };

    const handleUpdateProfile = () => {
        if (tempName.trim().length >= 2) {
            playClickSound();
            updateProfile(tempName.trim(), playerAvatar);
            setIsEditingProfile(false);
            showToast(t.profileUpdated, 'success');
        } else {
            showToast(t.nameError, 'error');
        }
    };

    const handleKick = (playerId: string, playerName: string) => {
        if (window.confirm(`${t.confirmKick} ${playerName}?`)) {
            kickPlayer(playerId);
            showToast(`${playerName} ${t.kicked}`, 'success');
        }
    };

    // --- STYLES ---
    const mainStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url(/assets/wood-seamless.png)',
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        backgroundColor: '#1a1109',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };

    const scrollContainerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
    };

    const sectionTitleStyle: React.CSSProperties = {
        color: '#8b6b4a',
        fontWeight: 'bold',
        fontSize: '0.8rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: '8px',
        textAlign: 'center',
    };

    const codeBoxStyle: React.CSSProperties = {
        background: 'linear-gradient(180deg, #2d1f10 0%, #1a1109 100%)',
        border: '2px solid #5a4025',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
    };

    return (
        <div style={mainStyle}>
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            <div style={{ ...scrollContainerStyle, position: 'relative', zIndex: 10 }}>
                {/* Room Card */}
                <WoodenCard
                    maxWidth="420px"
                    showBackArrow={true}
                    onBack={() => { playClickSound(); onLeaveGame(); }}
                    style={{ marginBottom: '24px', gap: '20px' }}
                >
                    <div style={{ width: '100%', marginTop: '32px' }}>
                        <p style={sectionTitleStyle}>{t.roomCodeLabel}</p>
                        <div style={codeBoxStyle}>
                            <h1 className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-4 uppercase" style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.6)' }}>
                                {gameState.roomCode}
                            </h1>

                            {isHost && (
                                <div className="bg-white p-3 rounded-xl shadow-lg mb-4">
                                    <QRCodeSVG value={joinUrl} size={140} level="M" />
                                </div>
                            )}

                            <div className="flex gap-3 mt-2 w-full justify-center">
                                <WoodenButton
                                    onClick={() => { playClickSound(); handleCopyCode(); }}
                                    variant="secondary"
                                    size="sm"
                                    icon={<span>📋</span>}
                                >
                                    {t.copy}
                                </WoodenButton>
                                {typeof navigator !== 'undefined' && 'share' in navigator && (
                                    <WoodenButton
                                        onClick={() => { playClickSound(); handleShare(); }}
                                        variant="secondary"
                                        size="sm"
                                        icon={<span>📤</span>}
                                    >
                                        {t.share}
                                    </WoodenButton>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Players Section */}
                    <div style={{ width: '100%' }}>
                        <p style={sectionTitleStyle}>
                            {t.playersReady} <span className="text-yellow-500">({gameState.players.length})</span>
                        </p>
                        <div style={{
                            background: 'linear-gradient(180deg, #2d1f10 0%, #1a1109 100%)',
                            border: '2px solid #5a4025',
                            borderRadius: '16px',
                            padding: '16px',
                            width: '100%',
                            minHeight: '100px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            display: 'flex',
                            justifyContent: 'center'
                        }}>
                            <PlayerList
                                players={gameState.players}
                                currentPlayerId={currentPlayerId}
                                compact={true}
                                onPlayerClick={(p) => {
                                    playClickSound();
                                    if (p.id === currentPlayerId) setIsEditingProfile(true);
                                    else setSelectedPlayer(p);
                                }}
                            />
                            {gameState.players.length === 0 && (
                                <p className="text-stone-500 text-center italic mt-2">{t.waitingForPlayers}</p>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div style={{ width: '100%', marginTop: 'auto' }}>
                        {isEditingProfile ? (
                            <div className="bg-[#2d1f10] p-4 rounded-xl border border-yellow-600/50 animate-fadeIn">
                                <p style={sectionTitleStyle}>{t.updateProfile}</p>
                                <div className="flex gap-2 mb-3">
                                    <div className="w-[48px] h-[48px] bg-[#1a1109] rounded-lg flex items-center justify-center text-2xl border border-[#5a4025]">
                                        {playerAvatar}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <WoodenInput
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            placeholder={t.playerNamePlaceholder}
                                            fullWidth
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <AvatarPicker currentAvatar={playerAvatar} onSelect={setPlayerAvatar} />
                                </div>
                                <div className="flex gap-2">
                                    <WoodenButton
                                        onClick={handleUpdateProfile}
                                        variant="secondary"
                                        fullWidth
                                        style={{ background: '#15803d', borderColor: '#14532d' }}
                                    >
                                        ✅ {t.save}
                                    </WoodenButton>
                                    <WoodenButton
                                        onClick={() => setIsEditingProfile(false)}
                                        variant="secondary"
                                        style={{ background: '#2d1f10' }}
                                    >
                                        ✖️
                                    </WoodenButton>
                                </div>
                            </div>
                        ) : isHost ? (
                            <div className="flex flex-col gap-4">
                                {/* Debug: Add Bots for Testing */}
                                {process.env.NODE_ENV === 'development' && (
                                    <WoodenButton
                                        onClick={() => { playClickSound(); addDebugPlayers(); }}
                                        variant="secondary"
                                        size="sm"
                                        style={{ marginBottom: '8px', opacity: 0.7 }}
                                    >
                                        🤖 Add Bots (Debug)
                                    </WoodenButton>
                                )}

                                {/* Speed Control */}
                                <div>
                                    <p style={sectionTitleStyle}>{t.gameSpeed}</p>
                                    <div className="flex gap-2 justify-center">
                                        {(['slow', 'normal', 'fast'] as const).map((s) => (
                                            <WoodenButton
                                                key={s}
                                                onClick={() => { playClickSound(); setSelectedSpeed(s); }}
                                                variant={selectedSpeed === s ? 'gold' : 'secondary'}
                                                style={{
                                                    flex: 1,
                                                    height: '56px',
                                                    fontSize: '1.75rem',
                                                    opacity: selectedSpeed === s ? 1 : 0.7,
                                                    filter: selectedSpeed === s ? 'brightness(1.1)' : 'grayscale(0.5)'
                                                }}
                                                title={t[s]}
                                            >
                                                {s === 'slow' ? '🐢' : s === 'normal' ? '🚶' : '🐇'}
                                            </WoodenButton>
                                        ))}
                                    </div>
                                </div>

                                <WoodenButton
                                    onClick={() => {
                                        playClickSound();
                                        const intervals = { slow: 7000, normal: 5000, fast: 3000 };
                                        onStartGame({ autoCallIntervalMs: intervals[selectedSpeed] });
                                    }}
                                    disabled={!canStart}
                                    variant="gold"
                                    size="lg"
                                    fullWidth
                                >
                                    <span style={{ fontSize: '1.5rem' }}>🎲</span> {t.startGame}
                                </WoodenButton>
                            </div>
                        ) : (
                            <div className="p-4 bg-[#1a1109]/50 rounded-xl border border-[#3d2814] text-center animate-pulse">
                                <p className="text-stone-400 font-medium">{t.waitingForHost}</p>
                            </div>
                        )}
                    </div>
                </WoodenCard>
            </div>

            {/* Modal */}
            {selectedPlayer && (
                <PlayerStatsModal
                    player={selectedPlayer}
                    currentUserId={currentPlayerId}
                    onClose={() => setSelectedPlayer(null)}
                    onKick={isHost && selectedPlayer?.id !== currentPlayerId ? (pid) => {
                        handleKick(pid, selectedPlayer.name);
                        setSelectedPlayer(null);
                    } : undefined}
                    t={t}
                />
            )}
        </div>
    );
});

export default WaitingLobby;
