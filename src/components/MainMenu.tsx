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
import { playClickSound } from '@/lib/audio';

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

export default function MainMenu({ onCreateGame, onJoinGame }: MainMenuProps) {
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [language, setLanguage] = useState<Language>('en');
    const [error, setError] = useState<string | null>(null);
    const [crazyMode, setCrazyMode] = useState(false);

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

    const { playerAvatar, setPlayerAvatar } = useGame();
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/assets/wood-seamless.png)',
        backgroundSize: '256px 256px',
        backgroundRepeat: 'repeat',
        backgroundColor: '#2d1f10', // Fallback color
        zIndex: 1000,
    };

    const overlayStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none',
    };

    const cardStyle: React.CSSProperties = {
        position: 'relative',
        zIndex: 10,
        width: '90%',
        maxWidth: '480px',
        padding: '32px',
        backgroundColor: 'rgba(26, 17, 9, 0.95)', // Dark wood tint
        border: '4px solid #8b6b4a',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), inset 0 0 0 2px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
    };

    const buttonStyle: React.CSSProperties = {
        width: '100%',
        padding: '20px',
        borderRadius: '16px',
        border: 'none',
        fontSize: '1.25rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'transform 0.1s',
        boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
    };

    const goldBtnStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(180deg, #ffd700 0%, #daa520 100%)',
        color: '#3d2814',
        borderBottom: '4px solid #b8860b',
    };

    const woodBtnStyle: React.CSSProperties = {
        ...buttonStyle,
        background: 'linear-gradient(180deg, #5a4025 0%, #3d2814 100%)',
        color: '#f5e6c8',
        borderBottom: '4px solid #2d1f10',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '16px',
        backgroundColor: '#1a1109',
        border: '2px solid #5a4025',
        borderRadius: '12px',
        fontSize: '1.25rem',
        color: '#ffd700',
        fontWeight: 'bold',
        outline: 'none',
        textAlign: 'left',
    };

    return (
        <main style={mainStyle}>
            <div style={overlayStyle} />

            {/* Back Button matching GameHeader style */}
            {mode !== 'menu' && (
                <button
                    type="button"
                    onClick={() => onModeChange('menu')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
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
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            <div style={cardStyle}>
                {/* Header */}
                <div style={{ textAlign: 'center', width: '100%' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '8px', lineHeight: 1 }}>🎱</div>
                    <h1 style={{
                        fontSize: '2.5rem',
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
                        <button
                            onClick={() => onModeChange('create')}
                            style={goldBtnStyle}
                            className="active:translate-y-1"
                        >
                            <span style={{ fontSize: '1.5rem' }}>👑</span> {t.createGame}
                        </button>

                        <button
                            onClick={() => onModeChange('join')}
                            style={woodBtnStyle}
                            className="active:translate-y-1"
                        >
                            <span style={{ fontSize: '1.5rem' }}>🎮</span> {t.joinGame}
                        </button>

                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(139, 107, 74, 0.3)', display: 'flex', justifyContent: 'center' }}>
                            <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                        </div>
                    </div>
                ) : (
                    <form
                        style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                        onSubmit={(e) => {
                            e.preventDefault();
                            playClickSound();
                            mode === 'create' ? handleCreate() : handleJoin();
                        }}
                    >
                        {/* Player Name */}
                        <div>
                            <label style={{ display: 'block', color: '#8b6b4a', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                                {t.playerName}
                            </label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '12px',
                                    backgroundColor: '#3d2814', border: '1px solid #5a4025',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem'
                                }}>
                                    {playerAvatar}
                                </div>
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder={t.playerNamePlaceholder}
                                    maxLength={18}
                                    style={inputStyle}
                                    required
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
                                    <label style={{ display: 'block', color: '#8b6b4a', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                                        {t.roomCode} <span style={{ opacity: 0.7, fontWeight: 'normal', textTransform: 'none' }}>({t.optionalLabel})</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="AUTO"
                                        maxLength={8}
                                        style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center', textTransform: 'uppercase' }}
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
                                <label style={{ display: 'block', color: '#8b6b4a', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase' }}>
                                    {t.roomCode}
                                </label>
                                <input
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder={t.roomCodePlaceholder}
                                    maxLength={8}
                                    style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.5rem', padding: '20px', textTransform: 'uppercase' }}
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

                        <button
                            type="submit"
                            style={{ ...goldBtnStyle, marginTop: '8px' }}
                            className="active:translate-y-1"
                        >
                            {mode === 'create' ? t.createBtn : t.joinBtn}
                        </button>
                    </form>
                )}
            </div>
        </main>
    );
}
