'use client';

import React, { useState, useEffect } from 'react';

import { GameSettings } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { useGame } from '@/lib/GameContext';
import AvatarPicker from './AvatarPicker';
import GameSettingsForm from './GameSettingsForm';
import LanguageSelector from './LanguageSelector';

interface MainMenuProps {
    onCreateGame: (playerName: string, settings?: Partial<GameSettings>) => void;
    onJoinGame: (roomCode: string, playerName: string) => void;
}

/**
 * MainMenu Component
 * Entry screen with Create/Join game options
 */
export default function MainMenu({ onCreateGame, onJoinGame }: MainMenuProps) {
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    // Game Settings
    const [autoCallEnabled, setAutoCallEnabled] = useState(false);
    const [autoCallSpeed, setAutoCallSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
    const [language, setLanguage] = useState<Language>('en');
    const [crazyMode, setCrazyMode] = useState(false);

    const { playerAvatar, setPlayerAvatar } = useGame();

    const t = translations[language];

    // Persistence: Load language from localStorage or auto-detect
    useEffect(() => {
        const savedLang = localStorage.getItem('loto_language') as Language;
        if (savedLang && translations[savedLang]) {
            setLanguage(savedLang);
        } else {
            const browserLang = (navigator.language || navigator.languages[0]).toLowerCase();
            if (browserLang.includes('sk')) {
                setLanguage('sk');
            } else if (browserLang.includes('uk')) {
                setLanguage('uk');
            } else if (browserLang.includes('ru')) {
                setLanguage('ru');
            }
        }
    }, []);

    // Save language change to localStorage
    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('loto_language', lang);
    };

    // Load saved player name from localStorage and handle join from URL
    useEffect(() => {
        const savedName = localStorage.getItem('loto_playerName');
        if (savedName) {
            setPlayerName(savedName);
        }

        // Check for room in URL (deep link from QR code)
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get('room');
        if (urlRoom) {
            setRoomCode(urlRoom.toUpperCase());
            setMode('join');
        }
    }, []);

    const handleCreate = () => {
        if (playerName.trim().length < 2) {
            setError(t.nameError);
            return;
        }
        setError('');

        const intervalMap = {
            slow: 8000,
            normal: 5000,
            fast: 3000
        };

        onCreateGame(playerName.trim(), {
            autoCallEnabled,
            autoCallIntervalMs: intervalMap[autoCallSpeed],
            language,
            crazyMode,
            customRoomCode: roomCode.length > 0 ? roomCode : undefined
        });

        // Save name to localStorage
        localStorage.setItem('loto_playerName', playerName.trim());
    };

    const handleJoin = () => {
        if (playerName.trim().length < 2) {
            setError(t.nameError);
            return;
        }
        if (roomCode.trim().length !== 6) {
            setError(t.codeError);
            return;
        }
        setError('');
        onJoinGame(roomCode.trim().toUpperCase(), playerName.trim());

        // Save name to localStorage
        localStorage.setItem('loto_playerName', playerName.trim());
    };

    if (mode === 'menu') {
        return (
            <div className="flex flex-col h-screen overflow-hidden items-center justify-center gap-lg p-4 bg-[var(--color-bg)]">
                <div className="text-center">
                    <h1 className="title title-lg" style={{ marginBottom: 'var(--space-sm)' }}>
                        {t.title}
                    </h1>
                    <p style={{ color: 'var(--color-text-light)', opacity: 0.8 }}>
                        {t.subtitle}
                    </p>
                </div>

                <div className="flex flex-col gap-md" style={{ width: '100%', maxWidth: '300px' }}>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setMode('create')}
                    >
                        👑 {t.createGame}
                    </button>

                    <button
                        className="btn btn-secondary btn-lg"
                        onClick={() => setMode('join')}
                    >
                        🎮 {t.joinGame}
                    </button>
                </div>

                {/* Language Selector */}
                <LanguageSelector
                    currentLanguage={language}
                    onLanguageChange={handleLanguageChange}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden items-center justify-center gap-lg bg-[var(--color-bg)]">
            <button
                className="btn btn-secondary"
                onClick={() => {
                    setMode('menu');
                    setError('');
                }}
                style={{ alignSelf: 'flex-start' }}
            >
                ← {t.back}
            </button>

            <div className="card" style={{ width: '100%', maxWidth: '350px' }}>
                <h2 style={{ marginBottom: 'var(--space-lg)', textAlign: 'center' }}>
                    {mode === 'create' ? `👑 ${t.createGame}` : `🎮 ${t.joinGame}`}
                </h2>

                <div className="flex flex-col gap-md" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="input-group">
                        <label
                            htmlFor="playerName"
                            style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                opacity: 0.8
                            }}
                        >
                            {t.playerName}
                        </label>
                        <div className="flex items-center gap-sm">
                            <div
                                className="avatar-preview"
                                style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: 'var(--radius-full)',
                                    background: 'var(--color-gold)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    boxShadow: 'var(--shadow-sm)',
                                    flexShrink: 0
                                }}
                            >
                                {playerAvatar}
                            </div>
                            <input
                                id="playerName"
                                type="text"
                                className="input"
                                placeholder={t.playerNamePlaceholder}
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                maxLength={15}
                            />
                        </div>
                    </div>

                    <AvatarPicker
                        currentAvatar={playerAvatar}
                        onSelect={setPlayerAvatar}
                        label={t.selectAvatar}
                    />

                    {mode === 'create' && (
                        <div>
                            <label
                                htmlFor="customCode"
                                style={{
                                    display: 'block',
                                    marginBottom: 'var(--space-xs)',
                                    fontWeight: 600,
                                    fontSize: 'var(--font-size-sm)',
                                    opacity: 0.8
                                }}
                            >
                                {t.roomCode} (Optional)
                            </label>
                            <input
                                id="customCode"
                                type="text"
                                className="input"
                                placeholder="AUTO"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                maxLength={8}
                                style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                        </div>
                    )}
                </div>

                {mode === 'create' && (
                    <GameSettingsForm
                        autoCallEnabled={autoCallEnabled}
                        setAutoCallEnabled={setAutoCallEnabled}
                        autoCallSpeed={autoCallSpeed}
                        setAutoCallSpeed={setAutoCallSpeed}
                        crazyMode={crazyMode}
                        setCrazyMode={setCrazyMode}
                        t={t}
                    />
                )}

                {mode === 'join' && (
                    <div>
                        <label
                            htmlFor="roomCode"
                            style={{
                                display: 'block',
                                marginBottom: 'var(--space-xs)',
                                fontWeight: 600,
                            }}
                        >
                            {t.roomCode}
                        </label>
                        <input
                            id="roomCode"
                            type="text"
                            className="input"
                            placeholder={t.roomCodePlaceholder}
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
                        />
                    </div>
                )}

                {error && (
                    <p style={{ color: 'var(--color-red)', fontSize: 'var(--font-size-sm)' }}>
                        {error}
                    </p>
                )}
                <button
                    className="btn btn-primary btn-lg"
                    onClick={mode === 'create' ? handleCreate : handleJoin}
                    style={{ marginTop: 'var(--space-sm)' }}
                >
                    {mode === 'create' ? t.createBtn : t.joinBtn}
                </button>
            </div>
        </div>
    );
}
