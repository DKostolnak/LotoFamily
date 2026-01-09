'use client';

/**
 * MainMenu Component
 * 
 * Entry screen for the Loto game.
 * Uses INLINE STYLES for critical layout to guarantee it works visually 
 * even if CSS classes fail to load.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { GameSettings } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { useGame } from '@/lib/GameContext';
import {
    storageService,
    STORAGE_KEYS,
    getPlayerName,
    setPlayerName as savePlayerName,
} from '@/lib/services/storage';
import AvatarPicker from './AvatarPicker';
import LanguageSelector from './LanguageSelector';
import PlayerStatsPage from './PlayerStatsPage';
import ShopModal from './ShopModal';
import RulesModal from './RulesModal';
import { playClickSound } from '@/lib/audio';
import { CoinShower } from '@/components/effects/CoinShower';

// ============================================================================
// TYPES
// ============================================================================

interface MainMenuProps {
    onCreateGame: (playerName: string, settings?: Partial<GameSettings>) => void;
    onJoinGame: (roomCode: string, playerName: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

import { WoodenCard, WoodenButton, WoodenInput } from '@/components/common';

// ... (keep others)

export default function MainMenu({ onCreateGame, onJoinGame }: MainMenuProps) {
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [language, setLanguage] = useState<Language>('en');
    const [error, setError] = useState<string | null>(null);
    const [crazyMode, setCrazyMode] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showRules, setShowRules] = useState(false);

    useEffect(() => {
        // Recover Language
        const savedLang = storageService.getString(STORAGE_KEYS.LANGUAGE) as Language | null;
        let browserLang = 'en';
        if (typeof window !== 'undefined') {
            browserLang = (window.navigator.language || window.navigator.languages?.[0] || 'en').toLowerCase();
        }
        let detectedLanguage: Language = 'en';

        if (savedLang && savedLang in translations) {
            detectedLanguage = savedLang;
        } else if (browserLang.includes('sk')) {
            detectedLanguage = 'sk';
        } else if (browserLang.includes('uk')) {
            detectedLanguage = 'uk';
        } else if (browserLang.includes('ru')) {
            detectedLanguage = 'ru';
        }
        setLanguage(detectedLanguage);

        // Recover Player Name
        const savedName = getPlayerName();
        if (savedName) setPlayerName(savedName);

        // Recover Room Code
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const urlRoomCode = params.get('room');
            if (urlRoomCode) {
                setRoomCode(urlRoomCode.toUpperCase());
                setMode('join');
            }
        }
    }, []);

    const { playerAvatar, setPlayerAvatar, coins } = useGame();
    const t = translations[language];

    const handleLanguageChange = useCallback((lang: Language) => {
        playClickSound();
        setLanguage(lang);
        storageService.set(STORAGE_KEYS.LANGUAGE, lang);
    }, []);

    const validateCommonFields = useCallback(() => {
        if (playerName.trim().length < 2) {
            setError(t.nameError);
            return false;
        }
        setError(null);
        savePlayerName(playerName.trim());
        return true;
    }, [playerName, t.nameError]);

    const handleCreate = () => {
        if (!validateCommonFields()) return;

        onCreateGame(playerName.trim(), {
            autoCallEnabled: false,
            language,
            crazyMode,
            customRoomCode: roomCode.length >= 3 ? roomCode.toUpperCase() : undefined,
        });
    };

    const handleJoin = () => {
        if (!validateCommonFields()) return;
        if (roomCode.trim().length < 6) {
            setError(t.codeError);
            return;
        }
        setError(null);
        onJoinGame(roomCode.trim().toUpperCase(), playerName.trim());
    };

    const onModeChange = (newMode: 'menu' | 'create' | 'join') => {
        playClickSound();
        setMode(newMode);
        setError(null);
    };

    // --- STYLES ---
    const mainStyle: React.CSSProperties = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100dvh', // Use dynamic viewport height
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        // Start alignment allows scrolling if content is too tall
        justifyContent: 'center',
        backgroundImage: 'url(/assets/wood-seamless.png)',
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        backgroundColor: '#2d1f10',
        zIndex: 1000,
        overflowY: 'auto', // Enable vertical scrolling
        padding: '16px', // Safety padding
        WebkitOverflowScrolling: 'touch', // Smooth scroll iOS
    };

    const overlayStyle: React.CSSProperties = {
        position: 'fixed', // Fixed to cover background even when scrolling
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none',
    };

    return (
        <main style={mainStyle}>
            <CoinShower />
            <div style={overlayStyle} />

            <WoodenCard
                showBackArrow={mode !== 'menu'}
                onBack={() => onModeChange('menu')}
            >
                {/* Rules Button (Top Left) - Only in Menu Mode */}
                {mode === 'menu' && (
                    <button
                        onClick={() => { playClickSound(); setShowRules(true); }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(139, 107, 74, 0.5)',
                            color: '#ffd700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        className="hover:bg-black/50 hover:scale-105 active:scale-95"
                        title="Game Rules"
                    >
                        📖
                    </button>
                )}

                {/* Coin Badge (Top Right of Card) */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid rgba(255, 215, 0, 0.3)',
                }}>
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    <span style={{ color: '#ffd700', fontWeight: 'bold', fontFamily: 'monospace' }}>{coins}</span>
                </div>

                {/* Header */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: mode === 'menu' ? '4rem' : '2.5rem', marginBottom: mode === 'menu' ? '8px' : '4px', lineHeight: 1 }}>🎱</div>
                    <h1 style={{
                        fontSize: mode === 'menu' ? '2.5rem' : 'clamp(1.5rem, 5vw, 2rem)',
                        fontWeight: 900,
                        color: '#ffd700',
                        textTransform: 'uppercase',
                        margin: 0,
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        lineHeight: 1.2,
                    }}>
                        {mode === 'menu' ? t.title : (mode === 'create' ? t.createGame : t.joinGame)}
                    </h1>
                    {mode === 'menu' && (
                        <p style={{ color: '#8b6b4a', margin: '8px 0 0 0', fontSize: '1.1rem' }}>{t.subtitle}</p>
                    )}
                </div>

                {mode === 'menu' ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <WoodenButton
                            onClick={() => onModeChange('create')}
                            variant="gold"
                            size="lg"
                            fullWidth
                            style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>👑</span> {t.createGame}
                        </WoodenButton>

                        <WoodenButton
                            onClick={() => onModeChange('join')}
                            variant="secondary"
                            size="lg"
                            fullWidth
                            style={{
                                fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                                background: 'linear-gradient(180deg, #5a4025 0%, #3d2814 100%)',
                                borderColor: '#2d1f10'
                            }}
                        >
                            <span style={{ fontSize: '1.5rem' }}>🎮</span> {t.joinGame}
                        </WoodenButton>

                        {/* Stats & Shop Buttons Row */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <WoodenButton
                                onClick={() => { playClickSound(); setShowStats(true); }}
                                variant="secondary"
                                size="lg"
                                style={{
                                    flex: 1,
                                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                                    background: 'linear-gradient(180deg, #3d2814 0%, #2d1f10 100%)',
                                    borderBottom: '4px solid #1a1109',
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>📊</span> {t.score || 'Stats'}
                            </WoodenButton>

                            <WoodenButton
                                onClick={() => { playClickSound(); setShowShop(true); }}
                                variant="secondary"
                                size="lg"
                                style={{
                                    flex: 1,
                                    fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                                    background: 'linear-gradient(180deg, #3d2814 0%, #2d1f10 100%)',
                                    borderBottom: '4px solid #1a1109',
                                }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>🛒</span> Shop
                            </WoodenButton>
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(139, 107, 74, 0.3)', display: 'flex', justifyContent: 'center' }}>
                            <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                        </div>
                    </div>
                ) : (
                    <form
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 20px)' }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            playClickSound();
                            mode === 'create' ? handleCreate() : handleJoin();
                        }}
                    >
                        {/* Player Name */}
                        <div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '12px',
                                    backgroundColor: '#3d2814', border: '1px solid #5a4025',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem',
                                    flexShrink: 0
                                }}>
                                    {playerAvatar}
                                </div>
                                <WoodenInput
                                    label={t.playerName}
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder={t.playerNamePlaceholder}
                                    maxLength={18}
                                    required
                                    fullWidth
                                />
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <AvatarPicker currentAvatar={playerAvatar} onSelect={setPlayerAvatar} label={t.selectAvatar} />
                            </div>
                        </div>

                        {/* Mode Specific Inputs */}
                        {mode === 'create' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <WoodenInput
                                        label={`${t.roomCode} (${t.optionalLabel})`}
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="AUTO"
                                        maxLength={8}
                                        style={{ fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#5a4025', marginTop: '8px', textAlign: 'center' }}>{t.customCodeHelp}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => { playClickSound(); setCrazyMode(!crazyMode); }}
                                    style={{
                                        width: '100%', padding: '16px', borderRadius: '12px',
                                        backgroundColor: crazyMode ? '#2d1f10' : '#1a1109',
                                        border: crazyMode ? '2px solid #ffd700' : '2px solid #3d2814',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>🎲</span>
                                        <div style={{ textAlign: 'left' }}>
                                            <div style={{ color: crazyMode ? '#ffd700' : '#8b6b4a', fontWeight: 'bold' }}>{t.crazyMode}</div>
                                            <div style={{ color: '#5a4025', fontSize: '0.8rem' }}>{t.crazyModeDesc}</div>
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '48px', height: '28px', borderRadius: '14px',
                                        backgroundColor: crazyMode ? '#ffd700' : '#3d2814',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white',
                                            position: 'absolute', top: '2px',
                                            left: crazyMode ? '22px' : '2px',
                                            transition: 'left 0.2s'
                                        }} />
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <div>
                                <WoodenInput
                                    label={t.roomCode}
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder={t.roomCodePlaceholder}
                                    maxLength={8}
                                    style={{ fontFamily: 'monospace', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.5rem', padding: '20px', textTransform: 'uppercase' }}
                                    required
                                />
                            </div>
                        )}

                        {error && (
                            <div style={{
                                padding: '12px', backgroundColor: 'rgba(127, 29, 29, 0.2)', border: '1px solid rgba(220, 38, 38, 0.4)',
                                color: '#fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
                            }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <WoodenButton
                            type="submit"
                            variant="gold"
                            size="lg"
                            fullWidth
                            style={{ marginTop: '8px' }}
                        >
                            {mode === 'create' ? t.createBtn : t.joinBtn}
                        </WoodenButton>
                    </form>
                )}
            </WoodenCard>

            {/* Stats Modal */}
            {showStats && (
                <PlayerStatsPage
                    onClose={() => setShowStats(false)}
                    t={t}
                />
            )}

            {/* Shop Modal */}
            <ShopModal
                isOpen={showShop}
                onClose={() => setShowShop(false)}
            />

            {/* Rules Modal */}
            <RulesModal
                isOpen={showRules}
                onClose={() => setShowRules(false)}
            />
        </main>
    );
}
