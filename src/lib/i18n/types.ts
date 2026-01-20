/**
 * Translation Keys Type Definition
 * 
 * Provides compile-time type safety for translations.
 * Add new keys here to ensure all languages implement them.
 */

export type Language = 'en' | 'sk' | 'ru' | 'uk';

/**
 * All translation keys used in the app.
 * This type ensures type safety when accessing translations.
 */
export interface TranslationKeys {
    // Menu
    title: string;
    subtitle: string;
    createGame: string;
    joinGame: string;
    back: string;
    playerName: string;
    playerNamePlaceholder: string;
    roomCode: string;
    roomCodePlaceholder: string;
    autoCall: string;
    speed: string;
    slow: string;
    normal: string;
    fast: string;
    crazyMode: string;
    crazyModeDesc: string;
    createBtn: string;
    joinBtn: string;
    nameError: string;
    codeError: string;
    createHint: string;
    joinHint: string;
    optionalLabel: string;
    customCodeHelp: string;
    roomCodeHint: string;

    // Lobby
    lobbyTitle: string;
    roomCodeLabel: string;
    playersReady: string;
    startGame: string;
    waitingForHost: string;
    hostInfo: string;
    shareIp: string;
    copy: string;
    share: string;
    copied: string;
    closeRoom: string;
    scanToJoin: string;
    leaveConfirm: string;

    // Game
    players: string;
    paused: string;
    claimBingo: string;
    claimFlat: string;
    claimRow1: string;
    claimRow2: string;
    auto1: string;
    auto5: string;
    repair: string;
    magnifier: string;
    crazy: string;
    currentNumber: string;
    callNext: string;
    resume: string;
    pause: string;
    endGame: string;
    remaining: string;
    endGameConfirm: string;
    showBoard: string;
    changeAvatar: string;
    selectAvatar: string;

    // Card Progress
    cardFull: string;
    numbersLeft: string;
    almostThere: string;
    progress: string;

    // Winner Screen
    victory: string;
    gameOver: string;
    youWon: string;
    playerWins: string;
    winningScore: string;
    playAgain: string;
    waitingHostRestart: string;
    leaveRoom: string;

    // Player Stats
    kickPlayer: string;
    host: string;
    online: string;
    offline: string;
    score: string;
    flats: string;
    cards: string;
    me: string;

    // Toast Messages
    leftTheGame: string;

    // Error Boundary
    errorTitle: string;
    errorDefault: string;
    tryAgain: string;
    reloadGame: string;
    backToMenu: string;
    errorHint: string;

    // Profile
    save: string;
    profileUpdated: string;
    confirmKick: string;
    kicked: string;
    confirmCloseRoom: string;
    joinMyGame: string;
    joinWithCode: string;
    gameSpeed: string;
    pausedByHost: string;
    selectTarget: string;
    cancel: string;
    mode: string;
    copiedError: string;
    leaderboard: string;

    // Mobile App UI
    welcomeBack: string;
    hostOnline: string;
    practice: string;
    settings: string;
    audioSound: string;
    audioDesc: string;
    languageLabel: string;
    languageDesc: string;
    batterySaver: string;
    batterySaverDesc: string;
    howToPlay: string;
    playerStats: string;
    statsTitle: string;
    ranks: string;
    shop: string;
    close: string;
    connecting: string;
    exitGame: string;
    called: string;
    autoPlay: string;
    dailyBonus: string;
    dailyBonusWelcome: string;
    games: string;
    wins: string;
    winRate: string;
    earnings: string;
    claimAndPlay: string;
    gotIt: string;
    rateTitle: string;
    rateMessage: string;
    rateNow: string;
    rateLater: string;
    onboardingTitle1: string;
    onboardingDesc1: string;
    onboardingTitle2: string;
    onboardingDesc2: string;
    onboardingTitle3: string;
    onboardingDesc3: string;
    letsPlay: string;
    next: string;
    skip: string;
}

/**
 * Helper to get a translation with type safety
 */
export function t(translations: TranslationKeys, key: keyof TranslationKeys): string {
    return translations[key];
}
