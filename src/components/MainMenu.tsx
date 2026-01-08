'use client';

/**
 * MainMenu Component
 * 
 * Entry screen for the Loto game with:
 * - Create Game option (for hosts)
 * - Join Game option (for players)
 * - Language selection
 * - Avatar picker
 * 
 * Handles:
 * - Player name input and validation
 * - Room code input for joining
 * - Crazy Mode toggle
 * - URL-based room code recovery
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

interface MainMenuProps {
    onCreateGame: (playerName: string, settings?: Partial<GameSettings>) => void;
    onJoinGame: (roomCode: string, playerName: string) => void;
}

/**
 * MainMenu Component
 * Entry screen with Create/Join game options
 */
export default function MainMenu({ onCreateGame, onJoinGame }: MainMenuProps) {
    // Initialize with server-safe defaults to match SSR
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [language, setLanguage] = useState<Language>('en');
    const [error, setError] = useState<string | null>(null);
    const [crazyMode, setCrazyMode] = useState(false);

    // Hydrate state from client storage/URL after mount
    useEffect(() => {
        // 1. Recover Language
        const savedLang = storageService.getString(STORAGE_KEYS.LANGUAGE) as Language | null;
        const browserLang = (window.navigator.language || window.navigator.languages?.[0] || 'en').toLowerCase();
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

        // 2. Recover Player Name
        const savedName = getPlayerName();
        if (savedName) setPlayerName(savedName);

        // 3. Recover Room Code from URL (for shared links)
        const params = new URLSearchParams(window.location.search);
        const urlRoomCode = params.get('room');
        if (urlRoomCode) {
            setRoomCode(urlRoomCode.toUpperCase());
            setMode('join');
        }
    }, []);

    const { playerAvatar, setPlayerAvatar } = useGame();

    const t = translations[language];

    const handleLanguageChange = useCallback((lang: Language) => {
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

        const intervalMap = {
            slow: 8000,
            normal: 5000,
            fast: 3000,
        };

        onCreateGame(playerName.trim(), {
            autoCallEnabled: false, // Default to false here, host enables in lobby
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

    return (
        <main
            className="flex flex-col h-screen overflow-hidden items-center justify-center px-4 py-6 bg-[var(--color-bg)]"
            aria-labelledby="main-menu-heading"
        >
            {mode !== 'menu' && (
                <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => {
                        setMode('menu');
                        setError(null);
                    }}
                    style={{ alignSelf: 'flex-start' }}
                >
                    ← {t.back}
                </button>
            )}

            {mode === 'menu' ? (
                <section className="card" style={{ width: '100%', maxWidth: '420px', textAlign: 'center' }}>
                    <h1 id="main-menu-heading" style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-sm)' }}>
                        {t.title}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
                        {t.subtitle}
                    </p>

                    <div className="flex flex-col gap-md">
                        <button className="btn btn-primary btn-lg" type="button" onClick={() => setMode('create')}>
                            👑 {t.createGame}
                        </button>
                        <button className="btn btn-secondary btn-lg" type="button" onClick={() => setMode('join')}>
                            🎮 {t.joinGame}
                        </button>
                    </div>

                    <div style={{ marginTop: 'var(--space-xl)' }}>
                        <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                    </div>
                </section>
            ) : (
                <section className="card" style={{ width: '100%', maxWidth: '480px' }}>
                    <header style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-xs)' }}>
                            {mode === 'create' ? `👑 ${t.createGame}` : `🎮 ${t.joinGame}`}
                        </h2>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {mode === 'create' ? t.createHint : t.joinHint}
                        </p>
                    </header>

                    <form
                        onSubmit={(evt) => {
                            evt.preventDefault();
                            if (mode === 'create') handleCreate();
                            else handleJoin();
                        }}
                        className="flex flex-col gap-md"
                        noValidate
                    >
                        <div>
                            <label
                                htmlFor="playerName"
                                style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 600 }}
                            >
                                {t.playerName}
                            </label>
                            <div className="flex items-center gap-sm">
                                <div
                                    className="avatar"
                                    aria-hidden="true"
                                    style={{ width: '52px', height: '52px', fontSize: '1.6rem' }}
                                >
                                    {playerAvatar}
                                </div>
                                <input
                                    id="playerName"
                                    type="text"
                                    className="input"
                                    placeholder={t.playerNamePlaceholder}
                                    value={playerName}
                                    onChange={(event) => setPlayerName(event.target.value)}
                                    maxLength={18}
                                    autoComplete="name"
                                    required
                                />
                            </div>
                        </div>

                        <AvatarPicker currentAvatar={playerAvatar} onSelect={setPlayerAvatar} label={t.selectAvatar} />

                        {mode === 'create' ? (
                            <div className="flex flex-col gap-md">
                                <div>
                                    <label
                                        htmlFor="customCode"
                                        style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 600 }}
                                    >
                                        {t.roomCode}
                                        <span style={{ fontWeight: 400, marginLeft: 'var(--space-xs)', color: 'var(--color-text-secondary)' }}>
                                            ({t.optionalLabel})
                                        </span>
                                    </label>
                                    <input
                                        id="customCode"
                                        type="text"
                                        className="input"
                                        placeholder="AUTO"
                                        value={roomCode}
                                        onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                                        maxLength={8}
                                        inputMode="text"
                                        pattern="[A-Z0-9]{3,8}"
                                        aria-describedby="room-code-hint"
                                        style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}
                                    />
                                    <p id="room-code-hint" style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                        {t.customCodeHelp}
                                    </p>
                                </div>

                                {/* Crazy Mode Toggle */}
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-md)',
                                        background: crazyMode ? 'linear-gradient(135deg, rgba(139, 69, 19, 0.3), rgba(160, 82, 45, 0.2))' : 'rgba(0,0,0,0.05)',
                                        borderRadius: '12px',
                                        border: crazyMode ? '2px solid var(--color-gold)' : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🎲</span>
                                            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>
                                                {t.crazyMode}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                                            {t.crazyModeDesc}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCrazyMode(!crazyMode)}
                                        style={{
                                            width: '56px',
                                            height: '32px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: crazyMode
                                                ? 'linear-gradient(145deg, #c9a66b 0%, #a07d4a 100%)'
                                                : '#ccc',
                                            position: 'relative',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                            boxShadow: crazyMode ? '0 2px 4px rgba(0,0,0,0.3)' : 'inset 0 1px 3px rgba(0,0,0,0.2)',
                                        }}
                                        aria-pressed={crazyMode}
                                        aria-label={t.crazyMode}
                                    >
                                        <div
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '50%',
                                                background: '#fff',
                                                position: 'absolute',
                                                top: '3px',
                                                left: crazyMode ? '27px' : '3px',
                                                transition: 'left 0.2s ease',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                            }}
                                        />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label
                                    htmlFor="roomCode"
                                    style={{ display: 'block', marginBottom: 'var(--space-xs)', fontWeight: 600 }}
                                >
                                    {t.roomCode}
                                </label>
                                <input
                                    id="roomCode"
                                    type="text"
                                    className="input"
                                    placeholder={t.roomCodePlaceholder}
                                    value={roomCode}
                                    onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                                    maxLength={8}
                                    inputMode="text"
                                    pattern="[A-Z0-9]{6,8}"
                                    aria-describedby="room-code-description"
                                    style={{ textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'center' }}
                                    required
                                />
                                <p
                                    id="room-code-description"
                                    style={{ marginTop: 'var(--space-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}
                                >
                                    {t.roomCodeHint}
                                </p>
                            </div>
                        )}

                        {error && (
                            <p role="alert" style={{ color: 'var(--color-red)', fontWeight: 600 }}>
                                {error}
                            </p>
                        )}

                        <button className="btn btn-primary btn-lg" type="submit">
                            {mode === 'create' ? t.createBtn : t.joinBtn}
                        </button>
                    </form>
                </section>
            )}
        </main>
    );
}
