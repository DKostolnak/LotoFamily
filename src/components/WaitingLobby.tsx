import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GameState, Player } from '@/lib/types';
import { translations } from '@/lib/translations';
import PlayerList from './PlayerList';
import LotoCard from './LotoCard';
import { useToast } from './ToastProvider';
import { useGame } from '@/lib/GameContext';
import { playClickSound } from './GameAudioPlayer';
import AvatarPicker from './AvatarPicker';
import PlayerStatsModal from './PlayerStatsModal';

interface WaitingLobbyProps {
    gameState: GameState;
    currentPlayerId: string;
    isHost: boolean;
    onStartGame: () => void;
    onLeaveGame: () => void;
}

/**
 * WaitingLobby Component
 * Pre-game lobby showing connected players and room code
 */
export default function WaitingLobby({
    gameState,
    currentPlayerId,
    isHost,
    onStartGame,
    onLeaveGame,
}: WaitingLobbyProps) {
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    const canStart = gameState.players.length >= 1; // Allow starting even solo for testing

    const { showToast } = useToast();
    const { updateProfile, kickPlayer, closeRoom, playerAvatar, setPlayerAvatar } = useGame();

    const [isEditingProfile, setIsEditingProfile] = React.useState(false);
    const [tempName, setTempName] = React.useState(currentPlayer?.name || '');
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);

    const t = translations[gameState.settings.language || 'en'];

    const joinUrl = gameState.serverUrl
        ? `${gameState.serverUrl}?room=${gameState.roomCode}`
        : `${typeof window !== 'undefined' ? window.location.origin : ''}?room=${gameState.roomCode}`;

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(gameState.roomCode);
            showToast(t.copied, 'success', '📋');
        } catch (err) {
            showToast('Failed to copy', 'error');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my Loto game!',
                    text: `Join my Loto game with code: ${gameState.roomCode}`,
                    url: joinUrl,
                });
            } catch (err) {
                // User cancelled or error
            }
        } else {
            // Fallback to copy
            handleCopyCode();
        }
    };

    const handleUpdateProfile = () => {
        if (tempName.trim().length >= 2) {
            playClickSound();
            updateProfile(tempName.trim(), playerAvatar);
            setIsEditingProfile(false);
            showToast('Profile updated!', 'success');
        } else {
            showToast(t.nameError, 'error');
        }
    };

    const handleKick = (playerId: string, playerName: string) => {
        if (window.confirm(`Are you sure you want to kick ${playerName}?`)) {
            kickPlayer(playerId);
            showToast(`${playerName} kicked`, 'success');
        }
    };

    return (
        <div className="container flex flex-col h-screen overflow-hidden" style={{ padding: '16px', background: 'var(--color-bg)' }}>
            {/* Header with room code - fixed height */}
            <div className="wooden-panel text-center shrink-0" style={{ marginBottom: '12px', padding: '16px' }}>
                <p style={{ opacity: 0.8, fontSize: '0.75rem', margin: 0 }}>{t.roomCodeLabel}</p>
                <h1 style={{ fontSize: '1.5rem', letterSpacing: '0.2em', fontWeight: 700, margin: '4px 0' }}>
                    {gameState.roomCode}
                </h1>

                {/* QR Code Section for Host */}
                {isHost && (
                    <div style={{
                        background: 'white',
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        margin: '12px 0',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <QRCodeSVG
                            value={joinUrl}
                            size={120}
                            level="M"
                            includeMargin={false}
                        />
                        <p style={{ color: 'black', fontSize: '0.6rem', marginTop: '4px', fontWeight: 700 }}>
                            SCAN TO JOIN
                        </p>
                    </div>
                )}

                <p style={{ opacity: 0.6, fontSize: '0.7rem', margin: '0 0 8px 0' }}>
                    {isHost ? t.hostInfo : t.waitingForHost}
                </p>

                {/* Copy and Share buttons */}
                <div className="flex justify-center gap-2">
                    <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                            playClickSound();
                            handleCopyCode();
                        }}
                        style={{ fontSize: '0.75rem' }}
                    >
                        📋 {t.copy}
                    </button>
                    {'share' in navigator && (
                        <button
                            className="btn btn-secondary btn-xs"
                            onClick={() => {
                                playClickSound();
                                handleShare();
                            }}
                            style={{ fontSize: '0.75rem' }}
                        >
                            📤 {t.shared}
                        </button>
                    )}
                </div>
            </div>

            {/* Players - compact */}
            <div className="card shrink-0" style={{ padding: '12px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '0.9rem', marginBottom: '8px', marginTop: 0 }}>
                    {t.playersReady} ({gameState.players.length}/{gameState.settings.maxPlayers})
                </h3>

                <div className="flex justify-center w-full">
                    <PlayerList
                        players={gameState.players}
                        currentPlayerId={currentPlayerId}
                        compact={true}
                        onPlayerClick={(p) => {
                            playClickSound();
                            if (p.id === currentPlayerId) {
                                setIsEditingProfile(true);
                            } else {
                                setSelectedPlayer(p);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Player Stats Modal */}
            {selectedPlayer && (
                <PlayerStatsModal
                    player={selectedPlayer}
                    currentUserId={currentPlayerId}
                    onClose={() => setSelectedPlayer(null)}
                    onKick={isHost && selectedPlayer?.id !== currentPlayerId ? (pid) => {
                        handleKick(pid, selectedPlayer.name);
                        setSelectedPlayer(null);
                    } : undefined}
                />
            )}


            {/* Actions - centered in remaining space */}
            <div className="flex-1 flex flex-col justify-center" style={{ maxWidth: '300px', margin: '0 auto', width: '100%' }}>
                {isEditingProfile ? (
                    <div className="card text-left" style={{ padding: '12px', marginBottom: '8px', border: '2px solid var(--color-gold)' }}>
                        <div className="flex flex-col gap-sm">
                            <input
                                type="text"
                                className="input"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                placeholder={t.playerNamePlaceholder}
                                style={{ fontSize: '0.9rem', padding: '6px 10px' }}
                            />
                            <AvatarPicker
                                currentAvatar={playerAvatar}
                                onSelect={setPlayerAvatar}
                            />
                            <div className="flex gap-xs">
                                <button className="btn btn-primary btn-sm flex-1" onClick={handleUpdateProfile}>
                                    ✅ Save
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setIsEditingProfile(false)}>
                                    ✖️
                                </button>
                            </div>
                        </div>
                    </div>
                ) : isHost ? (
                    <>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                playClickSound();
                                onStartGame();
                            }}
                            disabled={!canStart}
                            style={{ padding: '12px 16px', width: '100%', marginBottom: '8px' }}
                        >
                            🎲 {t.startGame}
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={() => {
                                if (window.confirm("Are you sure you want to close the room? All players will be disconnected.")) {
                                    playClickSound();
                                    closeRoom();
                                }
                            }}
                            style={{ padding: '10px 16px', width: '100%', marginBottom: '8px', fontSize: '0.9rem' }}
                        >
                            🚫 Close Room
                        </button>
                    </>
                ) : (
                    <div className="wooden-panel text-center animate-pulse" style={{ fontSize: '0.9rem', padding: '12px', marginBottom: '8px' }}>
                        {t.waitingForHost}
                    </div>
                )}

                <button
                    className="btn btn-secondary"
                    onClick={() => {
                        playClickSound();
                        onLeaveGame();
                    }}
                    style={{ padding: '10px 16px', width: '100%' }}
                >
                    {t.back}
                </button>
            </div>
        </div>

    );
}
