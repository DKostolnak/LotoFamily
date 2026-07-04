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
    public: string;
    private: string;
    publicDesc: string;
    privateDesc: string;
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
    reportPlayer: string;
    blockPlayer: string;
    unblockPlayer: string;
    blockedPlayers: string;
    reportReasonName: string;
    reportReasonAvatar: string;
    reportReasonChat: string;
    reportReasonOther: string;
    reportThanks: string;
    blockedEmpty: string;

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

    // Accessibility (a11y)
    a11yNumberLabel: string;     // e.g. "Number {n}"
    a11yMarkedState: string;     // marked correctly
    a11yMarkedIncorrect: string; // marked incorrectly
    a11yCalledTapToMark: string; // called, tap to mark
    a11yNotCalledYet: string;    // not called yet
    a11yMarkedState_short: string; // "marked"
    a11yUnmarkedState: string;   // not marked
    a11yMissedState: string;     // missed
    a11yEmptyCell: string;
    a11yLoadingGame: string;
    a11yErrorRetry: string;
    a11yMarkHint: string;        // "Double tap to mark this number"

    // Loading / Error / Empty
    loadingGame: string;
    connectionError: string;
    retry: string;
    noConnection: string;
    noPublicRooms: string;
    noPublicRoomsDesc: string;
    noChatMessages: string;
    noChatMessagesDesc: string;
    browsePublicRooms: string;
    chatTitle: string;
    typeMessage: string;

    // Profile Editor
    editProfile: string;
    changeName: string;
    tapToEdit: string;
    saveChanges: string;
    nameTooShort: string;

    // Shop
    shopTitle: string;
    all: string;
    avatars: string;
    themes: string;
    markers: string;
    owned: string;
    equipped: string;
    equip: string;
    active: string;
    buy: string;
    free: string;
    emptyShelf: string;
    emptyShelfDesc: string;
    tapToCopy: string;

    // Loto card header
    cardLabel: string;

    // Daily quests (local missions)
    questPlayGames: string;
    questPlayGamesDesc: string;
    questMarkNumbers: string;
    questMarkNumbersDesc: string;
    questWinGame: string;
    questWinGameDesc: string;
    questUsePowerUp: string;
    questUsePowerUpDesc: string;

    // Daily bonus — double via rewarded ad
    doubleBonusCta: string;

    // Shop — In-App Purchases (real money)
    shopCoinsTab: string;
    iapRemoveAdsTitle: string;
    iapRemoveAdsDesc: string;
    iapBestValue: string;
    iapRestorePurchases: string;
    iapRestoreSuccess: string;
    iapRestoreNone: string;
    iapPurchaseSuccess: string;
    iapPurchaseFailed: string;
    iapUnavailable: string;
    iapCoinsGranted: string;

    // Rules Content
    rulesTitle: string;
    rulesPage1Title: string;
    rulesPage1Desc: string;
    rulesPage2Title: string;
    rulesPage2Desc: string;
    rulesPage3Title: string;
    rulesPage3Desc: string;
    rulesPage4Title: string;
    rulesPage4Desc: string;
    rulesPage5Title: string;
    rulesPage5Desc: string;
    rulesPage6Title: string;
    rulesPage6Desc: string;

    // Main Menu redesign (StickyHeader, DailyBonusCard, FreeCoinsCTA, ModeCard, BottomTabs)
    practiceVsBots: string;
    joinByCode: string;
    claimNow: string;
    nextBonusIn: string;
    freeCoins: string;
    watchAd: string;
    availableIn: string;
    settingsTab: string;
    levelLabel: string;
    dailyBonusReady: string;

    // Cozy home redesign
    playNow: string;
    tapToChoose: string;
    chooseGame: string;

    // Daily streak (retention)
    /** "{n}-day streak" — replace {n} with currentStreak */
    streakDays: string;
    /** Caption when streak reset (>48h gap) */
    streakBroken: string;
    /** "Day 1" label for empty/just-started streak */
    streakDay1: string;
    /** "Tomorrow: +{n}" — replace {n} with next reward */
    tomorrowReward: string;
    /** Short weekday labels for streak grid */
    dayMon: string;
    dayTue: string;
    dayWed: string;
    dayThu: string;
    dayFri: string;
    daySat: string;
    daySun: string;

    // Modal/feature labels (Wave A)
    dailyMissionsTitle: string;
    dailyResetIn: string;
    leagueStandingsTitle: string;
    leaguePromoteHint: string;
    playerRank: string;
    weeklyWinPoints: string;
    shareWin: string;
    coinsLabel: string;
    xpLabel: string;
    levelUp: string;

    // Modal sections (Wave A)
    audioSection: string;
    profileSection: string;
    statsSection: string;
    experience: string;
    level: string;
    tapToCycle: string;
    changeAvatarTitle: string;
    claimReward: string;
    missionClaimed: string;
    allDoneTitle: string;
    allDoneDesc: string;
    noCompetitorsTitle: string;
    noCompetitorsDesc: string;
    youLabel: string;
    promote: string;
    previous: string;
    rateThanks: string;

    // Tutorial (first-time-user coach marks)
    tutorialStep1Title: string;
    tutorialStep1Body: string;
    tutorialStep2Title: string;
    tutorialStep2Body: string;
    tutorialStep3Title: string;
    tutorialStep3Body: string;
    tutorialStep4Title: string;
    tutorialStep4Body: string;
    tutorialStep5Title: string;
    tutorialStep5Body: string;
    tutorialNext: string;
    tutorialDone: string;
    tutorialSkip: string;
    tutorialStepCount: string;
    resetTutorial: string;
    resetTutorialDesc: string;
    reset: string;

    // Power-ups (consumable in-game boosts)
    powerUps: string;
    powerUpPeek: string;
    powerUpPeekDesc: string;
    powerUpLuckyMark: string;
    powerUpLuckyMarkDesc: string;
    powerUpSlowTime: string;
    powerUpSlowTimeDesc: string;
    watchAdForPowerUp: string;
    /** Toast template — replace {numbers} with comma-joined upcoming numbers. */
    nextNumbersAre: string;
    /** Toast template — replace {name} with the power-up display name. */
    powerUpEarned: string;
    slowTimeActive: string;

    // Notifications & invite (retention)
    notificationsLabel: string;
    notificationsDesc: string;
    dailyBonusNotifTitle: string;
    dailyBonusNotifBody: string;
    seasonEndingNotifTitle: string;
    seasonEndingNotifBody: string;
    shareInvite: string;
    invitedToJoin: string;

    // Battle Pass / Season Pass
    battlePass: string;
    seasonPass: string;
    seasonLevel: string;
    seasonXp: string;
    unlockPremium: string;
    getPremium: string;
    premiumPrice: string;
    /** "{n} days left" — replace {n} with days remaining */
    daysLeft: string;
    seasonEnded: string;
    claim: string;
    claimed: string;
    locked: string;
    nextReward: string;
    freeTrack: string;
    premiumTrack: string;

    // Onboarding — name step (4th onboarding screen)
    onboardingNameTitle: string;
    onboardingNameDesc: string;
    onboardingStartGame: string;

    // Legal (Privacy Policy + Terms of Service — App Store / Play Store mandatory)
    legalSection: string;
    privacyPolicy: string;
    termsOfService: string;
    privacyPolicyTitle: string;
    privacyDataCollected: string;
    privacyDataCollectedBody: string;
    privacyDataUsage: string;
    privacyDataUsageBody: string;
    privacyThirdParty: string;
    privacyThirdPartyBody: string;
    privacyRights: string;
    privacyRightsBody: string;
    privacyContact: string;
    privacyContactBody: string;
    termsTitle: string;
    termsUseTitle: string;
    termsUseBody: string;
    termsPaymentsTitle: string;
    termsPaymentsBody: string;
    termsConductTitle: string;
    termsConductBody: string;
    termsAccountTitle: string;
    termsAccountBody: string;
    termsLiabilityTitle: string;
    termsLiabilityBody: string;
    termsChangesTitle: string;
    termsChangesBody: string;

    // Connection status banner
    connStatusReconnecting: string;
    connStatusDisconnected: string;
    connStatusConnected: string;
    connStatusOffline: string;
    connStatusError: string;
    connRetry: string;

    // Error Boundary (class component — read via getState())
    errorReport: string;

    // Voice announcer (folk nicknames toggle)
    announcerMode: string;
    announcerModeDesc: string;
}

/**
 * Helper to get a translation with type safety
 */
export function t(translations: TranslationKeys, key: keyof TranslationKeys): string {
    return translations[key];
}
