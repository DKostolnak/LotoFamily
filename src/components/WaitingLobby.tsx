'use client';

import React from 'react';
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
export default function WaitingLobby({
    gameState,
    currentPlayerId,
    isHost,
    onStartGame,
    onLeaveGame,
}: WaitingLobbyProps) {
    const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
    const canStart = gameState.players.length >= 1;

    const { showToast } = useToast();

    const { updateProfile, kickPlayer, playerAvatar, setPlayerAvatar } = useGame();

    const [isEditingProfile, setIsEditingProfile] = React.useState(false);
    const [tempName, setTempName] = React.useState(currentPlayer?.name || '');
    const [selectedPlayer, setSelectedPlayer] = React.useState<Player | null>(null);
    const [selectedSpeed, setSelectedSpeed] = React.useState<'slow' | 'normal' | 'fast'>('normal');

    const t = translations[gameState.settings.language || 'en'];

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
            } catch {
                // User cancelled
            }
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

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'rgba(26, 17, 9, 0.95)',
        border: '4px solid #8b6b4a',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(0,0,0,0.5)',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
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

    const buttonBaseStyle: React.CSSProperties = {
        padding: '16px',
        borderRadius: '12px',
        border: 'none',
        fontWeight: 800,
        textTransform: 'uppercase',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.1s',
        fontSize: '1rem',
    };

    const primaryBtnStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        background: 'linear-gradient(180deg, #ffd700 0%, #daa520 100%)',
        color: '#3d2814',
        borderBottom: '4px solid #b8860b',
        width: '100%',
        fontSize: '1.25rem',
    };

    const secondaryBtnStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        background: '#3d2814',
        color: '#f5e6c8',
        border: '2px solid #5a4025',
        fontSize: '0.9rem',
        padding: '8px 16px',
    };

    const woodBtnStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        background: 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)',
        color: '#3d2814',
        border: '2px solid #5a4025',
        boxShadow: '0 4px 0 #3d2814, inset 0 1px 0 rgba(255,255,255,0.3)',
        width: '100%',
    };

    return (
        <div style={mainStyle}>
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            <div style={{ ...scrollContainerStyle, position: 'relative', zIndex: 10 }}>
                {/* Room Card */}
                <div style={cardStyle}>
                    <div style={{ width: '100%' }}>
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

                            <div className="flex gap-3 mt-2">
                                <button
                                    onClick={() => { playClickSound(); handleCopyCode(); }}
                                    style={secondaryBtnStyle}
                                    className="active:scale-95 hover:bg-[#4d3319]"
                                >
                                    <span>📋</span> {t.copy}
                                </button>
                                {typeof navigator !== 'undefined' && 'share' in navigator && (
                                    <button
                                        onClick={() => { playClickSound(); handleShare(); }}
                                        style={secondaryBtnStyle}
                                        className="active:scale-95 hover:bg-[#4d3319]"
                                    >
                                        <span>📤</span> {t.share}
                                    </button>
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
                                    <input
                                        type="text"
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        className="flex-1 bg-[#1a1109] border border-[#5a4025] rounded-lg px-3 text-yellow-400 font-bold outline-none focus:border-yellow-500"
                                        placeholder={t.playerNamePlaceholder}
                                    />
                                </div>
                                <div className="mb-3">
                                    <AvatarPicker currentAvatar={playerAvatar} onSelect={setPlayerAvatar} />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleUpdateProfile} style={{ ...secondaryBtnStyle, background: '#15803d', flex: 1 }} >
                                        ✅ {t.save}
                                    </button>
                                    <button onClick={() => setIsEditingProfile(false)} style={{ ...secondaryBtnStyle, background: '#2d1f10', width: 'auto' }}>
                                        ✖️
                                    </button>
                                </div>
                            </div>
                        ) : isHost ? (
                            <div className="flex flex-col gap-4">
                                {/* Speed Control */}
                                <div>
                                    <p style={sectionTitleStyle}>{t.gameSpeed}</p>
                                    <div className="flex gap-4 justify-center">
                                        {(['slow', 'normal', 'fast'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => { playClickSound(); setSelectedSpeed(s); }}
                                                style={{
                                                    flex: 1,
                                                    height: '56px',
                                                    background: selectedSpeed === s
                                                        ? 'linear-gradient(145deg, #ffd700 0%, #daa520 100%)'
                                                        : 'linear-gradient(145deg, #2d1f10 0%, #1a1109 100%)',
                                                    borderRadius: '12px',
                                                    border: selectedSpeed === s ? '2px solid #b8860b' : '2px solid #3d2814',
                                                    boxShadow: selectedSpeed === s
                                                        ? '0 0 15px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                                                        : 'inset 0 2px 4px rgba(0,0,0,0.5)',
                                                    color: selectedSpeed === s ? '#3d2814' : '#5a4025', // Dark text on gold, dark brown on wood
                                                    fontSize: '1.75rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    filter: selectedSpeed === s ? 'brightness(1.1)' : 'grayscale(0.5)',
                                                    opacity: selectedSpeed === s ? 1 : 0.7
                                                }}
                                                title={t[s]}
                                                className="active:scale-95"
                                            >
                                                {s === 'slow' ? '🐢' : s === 'normal' ? '🚶' : '🐇'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        playClickSound();
                                        const intervals = { slow: 7000, normal: 5000, fast: 3000 };
                                        onStartGame({ autoCallIntervalMs: intervals[selectedSpeed] });
                                    }}
                                    disabled={!canStart}
                                    style={{ ...primaryBtnStyle, opacity: canStart ? 1 : 0.5 }}
                                    className="active:translate-y-1 active:border-b-0 shadow-lg"
                                >
                                    <span style={{ fontSize: '1.5rem' }}>🎲</span> {t.startGame}
                                </button>
                            </div>
                        ) : (
                            <div className="p-4 bg-[#1a1109]/50 rounded-xl border border-[#3d2814] text-center animate-pulse">
                                <p className="text-stone-400 font-medium">{t.waitingForHost}</p>
                            </div>
                        )}

                        <button
                            onClick={() => { playClickSound(); onLeaveGame(); }}
                            style={{ ...woodBtnStyle, marginTop: '16px' }}
                            className="active:translate-y-1 active:border-b-0 shadow-lg"
                        >
                            {t.back}
                        </button>
                    </div>
                </div>
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
}
