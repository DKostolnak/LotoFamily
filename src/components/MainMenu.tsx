'use client';

import React, { useMemo, useState } from 'react';

import { GameSettings } from '@/lib/types';
import { translations, Language } from '@/lib/translations';
import { useGame } from '@/lib/GameContext';
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
    const defaults = useMemo(() => {
        if (typeof window === 'undefined') {
            return {
                mode: 'menu' as const,
                playerName: '',
                roomCode: '',
                language: 'en' as Language,
            };
        }

        const savedLang = window.localStorage.getItem('loto_language') as Language | null;
        const fallback = (window.navigator.language || window.navigator.languages?.[0] || 'en').toLowerCase();
        let language: Language = 'en';

        if (savedLang && savedLang in translations) {
            language = savedLang;
        } else if (fallback.includes('sk')) {
            language = 'sk';
        } else if (fallback.includes('uk')) {
            language = 'uk';
        } else if (fallback.includes('ru')) {
            language = 'ru';
        }

        const savedName = window.localStorage.getItem('loto_playerName') ?? '';
        const params = new URLSearchParams(window.location.search);
        const urlRoom = params.get('room');

        return {
            mode: urlRoom ? 'join' : ('menu' as const),
            playerName: savedName,
            roomCode: urlRoom ? urlRoom.toUpperCase() : '',
            language,
        };
    }, []);

    const [mode, setMode] = useState<'menu' | 'create' | 'join'>(defaults.mode as 'menu' | 'create' | 'join');
    const [playerName, setPlayerName] = useState(defaults.playerName);
    const [roomCode, setRoomCode] = useState(defaults.roomCode);
    const [error, setError] = useState<string | null>(null);

    const [language, setLanguage] = useState<Language>(defaults.language);

    const { playerAvatar, setPlayerAvatar } = useGame();

    const t = translations[language];

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('loto_language', lang);
        }
    };

    const validateCommonFields = () => {
        if (playerName.trim().length < 2) {
            setError(t.nameError);
            return false;
        }
        setError(null);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('loto_playerName', playerName.trim());
        }
        return true;
    };

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
            crazyMode: false,
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
