/**
 * Internationalization (i18n) Module
 * 
 * Provides type-safe translations with proper separation of concerns.
 */

import type { Language, TranslationKeys } from './types';
export type { Language, TranslationKeys } from './types';

/**
 * All translations organized by language.
 * Each language implements the full TranslationKeys interface.
 */
export const translations: Record<Language, TranslationKeys> = {
    en: {
        // Menu
        title: 'LOTO', subtitle: 'Family Game Night', createGame: 'Create Game', joinGame: 'Join Game', back: 'Back',
        playerName: 'Your Name', playerNamePlaceholder: 'Enter your name', roomCode: 'Room Code', roomCodePlaceholder: 'ABC123',
        autoCall: 'Auto-Call Numbers', speed: 'Speed', slow: 'Slow', normal: 'Normal', fast: 'Fast',
        crazyMode: 'Crazy Mode', crazyModeDesc: 'Numbers shuffle after each correct mark!', createBtn: 'Create Room', joinBtn: 'Join Room',
        nameError: 'Name must be at least 2 characters', codeError: 'Room code must be at least 6 characters',
        createHint: 'Gather everyone and set your house rules before launching.',
        joinHint: 'Enter the host code and get ready to play.',
        public: 'Public', private: 'Private',
        publicDesc: 'Anyone can find and join your game',
        privateDesc: 'Only players with your code can join',
        optionalLabel: 'optional',
        customCodeHelp: 'Use 3-8 letters or numbers for a friendly room code, or leave blank.',
        roomCodeHint: 'Ask the host for the 6-letter room code shown on their screen.',

        // Lobby
        lobbyTitle: 'Waiting Lobby', roomCodeLabel: 'ROOM CODE', playersReady: 'Players Joined',
        startGame: 'Start Game', waitingForHost: 'Waiting for host to start...', hostInfo: 'Invite players by sharing the Room Code',
        shareIp: 'Or tell them to visit:', copy: 'Copy', share: 'Share', copied: 'Copied',
        closeRoom: 'Close Room', scanToJoin: 'SCAN TO JOIN', leaveConfirm: 'Leave game?',

        // Game
        players: 'Players', paused: 'Game Paused', claimBingo: 'BINGO!', claimFlat: 'LINE!',
        claimRow1: 'Claim 1', claimRow2: 'Claim 2',
        auto1: 'Auto 1', auto5: 'Auto 5', repair: 'Repair', magnifier: 'Magnifier', crazy: 'Crazy',
        currentNumber: 'Current Number', callNext: 'Call Next Number', resume: 'Resume', pause: 'Pause',
        endGame: 'End Game', remaining: 'numbers remaining',
        endGameConfirm: 'Are you sure you want to finish this round for everyone?',
        showBoard: 'Caller Board',
        changeAvatar: 'Change Avatar', selectAvatar: 'Select your avatar',

        // Card Progress
        cardFull: 'FULL!', numbersLeft: 'left', almostThere: 'Almost there!', progress: 'Progress',

        // Winner Screen
        victory: 'Victory!', gameOver: 'Game Over', youWon: 'You won the Loto!',
        playerWins: 'takes the prize!', winningScore: 'Winning Score',
        playAgain: 'Play Again', waitingHostRestart: 'Waiting for host to restart...',
        leaveRoom: 'Leave Room',

        // Player Stats
        kickPlayer: 'Kick Player', host: 'Host', online: 'Online', offline: 'Offline',
        score: 'Score', flats: 'Flats', cards: 'Cards', me: 'ME',

        // Toast Messages
        leftTheGame: 'left the game',

        // Error Boundary
        errorTitle: 'Oops! Something went wrong',
        errorDefault: 'An unexpected error occurred in the game',
        tryAgain: 'Try Again', reloadGame: 'Reload Game', backToMenu: 'Back to Menu',
        errorHint: 'If this keeps happening, try clearing your browser cache',

        // Profile
        save: 'Save', profileUpdated: 'Profile updated!',
        confirmKick: 'Are you sure you want to kick',
        kicked: 'kicked', confirmCloseRoom: 'Are you sure you want to close the room? All players will be disconnected.',
        joinMyGame: 'Join my Loto game!', joinWithCode: 'Join my Loto game with code:',
        gameSpeed: 'Game Speed', pausedByHost: 'Game is paused by host',
        selectTarget: 'Select Target 🎯', cancel: 'Cancel', mode: 'Mode',
        copiedError: 'Failed to copy', leaderboard: 'Leaderboard',

        // Mobile App UI
        welcomeBack: 'Welcome back,', hostOnline: 'Host Online', practice: 'Practice',
        settings: 'Settings', audioSound: 'Audio & Sound', audioDesc: 'Toggle game music and sound effects',
        languageLabel: 'Language', languageDesc: 'Select your preferred language',
        batterySaver: 'Battery Saver', batterySaverDesc: 'Reduces animations to save power',
        howToPlay: 'How to Play', playerStats: 'Player Stats', statsTitle: 'Stats', ranks: 'Ranks', shop: 'Shop',
        close: 'Close', connecting: 'Connecting to Server...', exitGame: 'Exit Game',
        called: 'called', autoPlay: 'AUTO-PLAY',
        dailyBonus: 'Daily Bonus', dailyBonusWelcome: 'Welcome back! Here is your reward.',
        games: 'Games', wins: 'Wins', winRate: 'Win Rate', earnings: 'Earnings',
        claimAndPlay: 'CLAIM & PLAY', gotIt: 'Got it!',
        rateTitle: 'Enjoying LOTO?', rateMessage: "If you're having fun, please rate us! It helps others discover the game.",
        rateNow: 'Rate Now', rateLater: 'Maybe Later',
        onboardingTitle1: 'Welcome to LOTO!', onboardingDesc1: 'The classic number game for family and friends. Match numbers on your card to win!',
        onboardingTitle2: 'Play Together', onboardingDesc2: 'Create a room and invite friends, or practice solo against the machine.',
        onboardingTitle3: 'Win Rewards', onboardingDesc3: 'Complete your card first to win! Earn coins and climb the leaderboard.',
        letsPlay: "Let's Play!", next: 'Next', skip: 'Skip',

        // Profile Editor
        editProfile: 'Edit Profile', changeName: 'Change Name', tapToEdit: 'Tap to edit',
        saveChanges: 'Save', nameTooShort: 'Name must be at least 2 characters',

        // Shop
        shopTitle: 'Grand Store', all: 'All', avatars: 'Avatars', themes: 'Themes', markers: 'Markers',
        owned: 'Owned', equipped: 'Equipped', equip: 'Equip', active: 'Active', buy: 'Buy', free: 'Free',
        emptyShelf: 'Empty Shelf', emptyShelfDesc: 'No items available in this category yet. Check back soon!',
        tapToCopy: 'Tap to copy',

        // Rules Content
        rulesTitle: 'How to Play',
        rulesPage1Title: 'The Basics',
        rulesPage1Desc: '90 balls are drawn randomly. You have 3 cards. Tap any number to mark it with a chip. Be careful: marking the wrong number freezes your card!',
        rulesPage2Title: 'Winning Big',
        rulesPage2Desc: 'Claim a LINE! by filling any horizontal row. Win the JACKPOT by filling an entire card (BINGO!). Prize pools are shared among all winners.',
        rulesPage3Title: 'Economy',
        rulesPage3Desc: 'Rooms have an entry fee in LCoins. All fees collected form the Prize Pool. The more players, the bigger the reward!',
        rulesPage4Title: 'Social & Legend',
        rulesPage4Desc: 'Chat with other players in real-time. Win matches to climb the Global Leaderboard and prove you are the Loto King!',

        // Accessibility (a11y)
        a11yNumberLabel: 'Number {n}',
        a11yMarkedState: 'marked correctly',
        a11yMarkedIncorrect: 'marked incorrectly',
        a11yCalledTapToMark: 'called, tap to mark',
        a11yNotCalledYet: 'not called yet',
        a11yMarkedState_short: 'marked',
        a11yUnmarkedState: 'not marked',
        a11yMissedState: 'missed',
        a11yEmptyCell: 'empty cell',
        a11yLoadingGame: 'Loading game...',
        a11yErrorRetry: 'Retry',
        a11yMarkHint: 'Double tap to mark this number',

        // Loading / Error / Empty
        loadingGame: 'Loading game...',
        connectionError: 'Connection failed. Check your internet and try again.',
        retry: 'Retry',
        noConnection: 'No connection',
        noPublicRooms: 'No public rooms',
        noPublicRoomsDesc: 'Be the first to create one and invite friends!',
        noChatMessages: 'No messages yet',
        noChatMessagesDesc: 'Say hello to the room!',
        browsePublicRooms: 'or browse public rooms',
        chatTitle: 'Room Chat',
        typeMessage: 'Type a message...',

        // Main Menu redesign
        practiceVsBots: 'Vs Bots',
        joinByCode: 'Enter Code',
        claimNow: 'Claim Now',
        nextBonusIn: 'Next bonus in',
        freeCoins: 'Get free coins',
        watchAd: 'Watch',
        availableIn: 'Available in',
        settingsTab: 'Settings',
        playNow: 'PLAY NOW',
        tapToChoose: 'Tap to choose a game',
        chooseGame: 'Choose a game',
        dailyMissionsTitle: 'Daily Missions',
        dailyResetIn: 'Resets in',
        leagueStandingsTitle: 'League Standings',
        leaguePromoteHint: 'Top 20% promote next week',
        playerRank: 'Rank',
        weeklyWinPoints: 'Weekly WP',
        shareWin: 'Share Win',
        coinsLabel: 'coins',
        xpLabel: 'XP',
        levelUp: 'Level up!',
        audioSection: 'Audio',
        profileSection: 'Profile',
        statsSection: 'Statistics',
        experience: 'Experience',
        level: 'Level',
        tapToCycle: 'Tap avatar to change',
        changeAvatarTitle: 'Change avatar',
        claimReward: 'Claim',
        missionClaimed: 'CLAIMED',
        allDoneTitle: 'All done!',
        allDoneDesc: 'Come back tomorrow for new missions.',
        noCompetitorsTitle: 'No players yet',
        noCompetitorsDesc: 'Be the first to win this week!',
        youLabel: 'YOU',
        promote: 'PROMOTE',
        previous: 'Previous',
        rateThanks: 'Thank you!',
        levelLabel: 'Lv',
        dailyBonusReady: 'Daily bonus ready!',
        streakDays: '{n}-day streak',
        streakBroken: 'Streak broken — start fresh',
        streakDay1: 'Day 1',
        tomorrowReward: 'Tomorrow: +{n}',
        dayMon: 'Mon', dayTue: 'Tue', dayWed: 'Wed', dayThu: 'Thu', dayFri: 'Fri', daySat: 'Sat', daySun: 'Sun',

        // Tutorial (first-time-user coach marks)
        tutorialStep1Title: 'Your card',
        tutorialStep1Body: '9 columns × 3 rows. 15 numbers in total to mark.',
        tutorialStep2Title: 'Called numbers',
        tutorialStep2Body: 'Here you see the number that was just called. The history is below.',
        tutorialStep3Title: 'Tap a number',
        tutorialStep3Body: 'When you hear or see your number, tap it on the card.',
        tutorialStep4Title: 'Goal of the game',
        tutorialStep4Body: 'Mark all 15 numbers faster than the other players.',
        tutorialStep5Title: 'Win!',
        tutorialStep5Body: 'When you have all numbers marked, tap the BINGO button!',
        tutorialNext: 'Next',
        tutorialDone: 'Done',
        tutorialSkip: 'Skip tutorial',
        tutorialStepCount: 'Step {n}/{total}',
        resetTutorial: 'Reset tutorial',
        resetTutorialDesc: 'Show the tutorial again next practice game.',
        reset: 'Reset',

        // Notifications & invite
        notificationsLabel: 'Notifications',
        notificationsDesc: 'Daily bonus reminders, friend invites',
        dailyBonusNotifTitle: '🎁 Daily bonus is ready!',
        dailyBonusNotifBody: 'Open LOTO and claim your reward.',
        shareInvite: 'Share invite',
        invitedToJoin: "You're joining via invite",

        // Battle Pass / Season Pass
        battlePass: 'Battle Pass',
        seasonPass: 'Season Pass',
        seasonLevel: 'Level',
        seasonXp: 'XP',
        unlockPremium: 'Unlock Premium',
        getPremium: 'Get Premium',
        premiumPrice: '$4.99',
        daysLeft: '{n} days left',
        seasonEnded: 'Season ended',
        claim: 'Claim',
        claimed: 'Claimed',
        locked: 'Locked',
        nextReward: 'Next reward',
        freeTrack: 'Free',
        premiumTrack: 'Premium',

        // Connection status banner
        connStatusReconnecting: 'Reconnecting...',
        connStatusDisconnected: 'Connection lost',
        connStatusConnected: 'Connected',
        connStatusOffline: 'No connection',
        connStatusError: 'Connection error',
        connRetry: 'Retry',

        // Power-ups
        powerUps: 'Power-ups',
        powerUpPeek: 'Peek next 3',
        powerUpPeekDesc: 'See the next 3 numbers',
        powerUpLuckyMark: 'Lucky Mark',
        powerUpLuckyMarkDesc: 'Auto-mark a missing number',
        powerUpSlowTime: 'Slow Time',
        powerUpSlowTimeDesc: '2x slower auto-calls for 30s',
        watchAdForPowerUp: 'Watch ad for +1',
        nextNumbersAre: 'Next: {numbers}',
        powerUpEarned: 'Earned 1 {name}!',
        slowTimeActive: '⏰ Slow time',
    },
    sk: {
        // Menu
        title: 'LOTO', subtitle: 'Rodinný herný večer', createGame: 'Vytvoriť hru', joinGame: 'Pripojiť sa', back: 'Späť',
        playerName: 'Vaše meno', playerNamePlaceholder: 'Zadajte meno', roomCode: 'Kód miestnosti', roomCodePlaceholder: 'ABC123',
        autoCall: 'Automatické vyvolávanie', speed: 'Rýchlosť', slow: 'Pomaly', normal: 'Normálne', fast: 'Rýchlo',
        crazyMode: 'Bláznivý režim', crazyModeDesc: 'Čísla sa po každom zásahu zamiešajú!', createBtn: 'Vytvoriť miestnosť', joinBtn: 'Vstúpiť do hry',
        nameError: 'Meno musí mať aspoň 2 znaky', codeError: 'Kód musí mať aspoň 6 znakov',
        createHint: 'Pripravte rodinu a nastavte pravidlá pred štartom.',
        joinHint: 'Zadajte kód hostiteľa a môžete hrať.',
        public: 'Verejná', private: 'Súkromná',
        publicDesc: 'Hru môže nájsť a pripojiť sa ktokoľvek',
        privateDesc: 'Pripojiť sa môžu len hráči s vaším kódom',
        optionalLabel: 'voliteľné',
        customCodeHelp: 'Použite 3–8 písmen alebo číslic, ak chcete vlastný kód.',
        roomCodeHint: 'Požiadajte hostiteľa o šesťmiestny kód z jeho obrazovky.',

        // Lobby
        lobbyTitle: 'Čakáreň', roomCodeLabel: 'KÓD MIESTNOSTI', playersReady: 'Pripojení hráči',
        startGame: 'Spustiť hru', waitingForHost: 'Čakanie na hostiteľa...', hostInfo: 'Pozvite hráčov zdieľaním kódu',
        shareIp: 'Alebo im povedzte, aby navštívili:', copy: 'Kopírovať', share: 'Zdieľať', copied: 'Skopírované',
        closeRoom: 'Zavrieť miestnosť', scanToJoin: 'NASKENUJTE QR', leaveConfirm: 'Odísť z hry?',

        // Game
        players: 'Hráči', paused: 'Hra pozastavená', claimBingo: 'BINGO!', claimFlat: 'RIADOK!',
        claimRow1: 'Riadok 1', claimRow2: 'Riadok 2',
        auto1: 'Auto 1', auto5: 'Auto 5', repair: 'Opraviť', magnifier: 'Lupa', crazy: 'Crazy',
        currentNumber: 'Aktuálne číslo', callNext: 'Volať ďalšie číslo', resume: 'Pokračovať', pause: 'Pozastaviť',
        endGame: 'Ukončiť hru', remaining: 'ostávajúcich čísel',
        endGameConfirm: 'Naozaj chcete ukončiť toto kolo pre všetkých?',
        showBoard: 'Tabuľa',
        changeAvatar: 'Zmeniť avatara', selectAvatar: 'Vyberte si avatara',

        // Card Progress
        cardFull: 'PLNÉ!', numbersLeft: 'zostáva', almostThere: 'Už skoro!', progress: 'Pokrok',

        // Winner Screen
        victory: 'Víťazstvo!', gameOver: 'Koniec hry', youWon: 'Vyhrali ste Loto!',
        playerWins: 'získava výhru!', winningScore: 'Výherné skóre',
        playAgain: 'Hrať znova', waitingHostRestart: 'Čakanie na hostiteľa...',
        leaveRoom: 'Opustiť miestnosť',

        // Player Stats
        kickPlayer: 'Vyhodiť hráča', host: 'Hostiteľ', online: 'Online', offline: 'Offline',
        score: 'Skóre', flats: 'Riadky', cards: 'Karty', me: 'JA',

        // Toast Messages
        leftTheGame: 'opustil hru',

        // Error Boundary
        errorTitle: 'Ojoj! Niečo sa pokazilo',
        errorDefault: 'V hre nastala neočakávaná chyba',
        tryAgain: 'Skúsiť znova', reloadGame: 'Načítať hru', backToMenu: 'Späť do menu',
        errorHint: 'Ak sa to stáva opakovane, skúste vymazať vyrovnávaciu pamäť prehliadača',

        // Profile
        save: 'Uložiť', profileUpdated: 'Profil aktualizovaný!',
        confirmKick: 'Naozaj chcete vyhodiť',
        kicked: 'vyhodený', confirmCloseRoom: 'Naozaj chcete zavrieť miestnosť? Všetci hráči budú odpojení.',
        joinMyGame: 'Pripoj sa k mojej hre Loto!', joinWithCode: 'Pripoj sa kódom:',
        gameSpeed: 'Rýchlosť hry', pausedByHost: 'Hra je pozastavená hostiteľom',
        selectTarget: 'Vyber cieľ 🎯', cancel: 'Zrušiť', mode: 'Režim',
        copiedError: 'Nepodarilo sa skopírovať', leaderboard: 'Rebríček',

        // Mobile App UI
        welcomeBack: 'Vitaj späť,', hostOnline: 'Hostiteľ online', practice: 'Cvičenie',
        settings: 'Nastavenia', audioSound: 'Zvuk a hudba', audioDesc: 'Prepnúť hudbu a zvukové efekty',
        languageLabel: 'Jazyk', languageDesc: 'Vyberte preferovaný jazyk',
        batterySaver: 'Šetrič batérie', batterySaverDesc: 'Obmedzuje animácie pre úsporu energie',
        howToPlay: 'Ako hrať', playerStats: 'Štatistiky hráča', statsTitle: 'Štatistiky', ranks: 'Hodnotenie', shop: 'Obchod',
        close: 'Zavrieť', connecting: 'Pripájanie k serveru...', exitGame: 'Opustiť hru',
        called: 'vytiahnutých', autoPlay: 'AUTO-HRA',
        dailyBonus: 'Denný bonus', dailyBonusWelcome: 'Vitaj späť! Tu je tvoja odmena.',
        games: 'Hry', wins: 'Výhry', winRate: 'Úspešnosť', earnings: 'Zárobky',
        claimAndPlay: 'VYZDVIHNÚŤ', gotIt: 'Rozumiem!',
        rateTitle: 'Páči sa ti LOTO?', rateMessage: 'Ak sa ti hra páči, ohodnoť nás! Pomôže to ostatným objaviť hru.',
        rateNow: 'Ohodnotiť', rateLater: 'Možno neskôr',
        onboardingTitle1: 'Vitaj v LOTO!', onboardingDesc1: 'Klasická hra s číslami pre rodinu a priateľov. Označuj čísla na karte a vyhraj!',
        onboardingTitle2: 'Hrajte Spolu', onboardingDesc2: 'Vytvor miestnosť a pozvi priateľov, alebo trénuj sám proti stroju.',
        onboardingTitle3: 'Získaj Odmeny', onboardingDesc3: 'Dokonči svoju kartu ako prvý a vyhraj! Získavaj mince a stúpaj v rebríčku.',
        letsPlay: 'Poďme na to!', next: 'Ďalej', skip: 'Preskočiť',

        // Profile Editor
        editProfile: 'Upraviť profil', changeName: 'Zmeniť meno', tapToEdit: 'Klepni pre úpravu',
        saveChanges: 'Uložiť', nameTooShort: 'Meno musí mať aspoň 2 znaky',

        // Shop
        shopTitle: 'Obchod', all: 'Všetko', avatars: 'Avatary', themes: 'Témy', markers: 'Žetóny',
        owned: 'Vlastnené', equipped: 'Aktívne', equip: 'Použiť', active: 'Aktívne', buy: 'Kúpiť', free: 'Zadarmo',
        emptyShelf: 'Prázdny regál', emptyShelfDesc: 'V tejto kategórii zatiaľ nič nie je. Pozri sa neskôr!',
        tapToCopy: 'Klepni pre skopírovanie',

        // Rules Content
        rulesTitle: 'Ako hrať',
        rulesPage1Title: 'Základy',
        rulesPage1Desc: 'Náhodne sa vyžrebuje 90 loptičiek. Máte 3 karty. Poklepaním na číslo ho označíte žetónom. Pozor: označenie nesprávneho čísla kartu na chvíľu zmrazí!',
        rulesPage2Title: 'Veľké výhry',
        rulesPage2Desc: 'Získajte RIADOK! vyplnením ktoréhokoľvek vodorovného riadku. Vyhrajte JACKPOT vyplnením celej karty (BINGO!). Výhry sa delia medzi všetkých víťazov.',
        rulesPage3Title: 'Ekonomika',
        rulesPage3Desc: 'Miestnosti majú vstupný poplatok v LCoinov. Všetky vyzbierané poplatky tvoria banku. Čím viac hráčov, tým väčšia odmena!',
        rulesPage4Title: 'Sociálne a Legendy',
        rulesPage4Desc: 'Chatujte s ostatnými hráčmi v reálnom čase. Vyhrávajte zápasy, stúpajte v globálnom rebríčku a dokážte, že ste kráľom Lota!',

        // Accessibility (a11y)
        a11yNumberLabel: 'Číslo {n}',
        a11yMarkedState: 'správne označené',
        a11yMarkedIncorrect: 'nesprávne označené',
        a11yCalledTapToMark: 'vyvolané, ťuknutím označíte',
        a11yNotCalledYet: 'zatiaľ nevyvolané',
        a11yMarkedState_short: 'označené',
        a11yUnmarkedState: 'neoznačené',
        a11yMissedState: 'zmeškané',
        a11yEmptyCell: 'prázdne pole',
        a11yLoadingGame: 'Načítavam hru...',
        a11yErrorRetry: 'Skúsiť znova',
        a11yMarkHint: 'Dvojitým ťuknutím označíte toto číslo',

        // Loading / Error / Empty
        loadingGame: 'Načítavam hru...',
        connectionError: 'Spojenie zlyhalo. Skontrolujte internet a skúste znova.',
        retry: 'Skúsiť znova',
        noConnection: 'Žiadne spojenie',
        noPublicRooms: 'Žiadne verejné miestnosti',
        noPublicRoomsDesc: 'Vytvorte prvú a pozvite kamarátov!',
        noChatMessages: 'Zatiaľ žiadne správy',
        noChatMessagesDesc: 'Pozdravte miestnosť!',
        browsePublicRooms: 'alebo si prezrite verejné miestnosti',
        chatTitle: 'Chat miestnosti',
        typeMessage: 'Napíšte správu...',

        // Main Menu redesign
        practiceVsBots: 'Proti botom',
        joinByCode: 'Zadať kód',
        claimNow: 'Vyzdvihnúť',
        nextBonusIn: 'Ďalší bonus o',
        freeCoins: 'Mince zadarmo',
        watchAd: 'Pozrieť',
        availableIn: 'Dostupné o',
        settingsTab: 'Nastavenia',
        playNow: 'HRAJ TERAZ',
        tapToChoose: 'Vyber si hru',
        chooseGame: 'Vyber si hru',
        dailyMissionsTitle: 'Denné úlohy',
        dailyResetIn: 'Reset o',
        leagueStandingsTitle: 'Rebríček ligy',
        leaguePromoteHint: 'Top 20% postupuje budúci týždeň',
        playerRank: 'Pozícia',
        weeklyWinPoints: 'Týždenné body',
        shareWin: 'Zdielaj výhru',
        coinsLabel: 'mincí',
        xpLabel: 'XP',
        levelUp: 'Nový level!',
        audioSection: 'Zvuk',
        profileSection: 'Profil',
        statsSection: 'Štatistiky',
        experience: 'Skúsenosti',
        level: 'Úroveň',
        tapToCycle: 'Klepni na avatar pre zmenu',
        changeAvatarTitle: 'Zmeniť avatar',
        claimReward: 'Vyzdvihnúť',
        missionClaimed: 'HOTOVO',
        allDoneTitle: 'Všetko hotové!',
        allDoneDesc: 'Vráť sa zajtra pre nové úlohy.',
        noCompetitorsTitle: 'Zatiaľ žiadni hráči',
        noCompetitorsDesc: 'Vyhraj prvý tento týždeň!',
        youLabel: 'TY',
        promote: 'POSTUP',
        previous: 'Späť',
        rateThanks: 'Ďakujeme!',
        levelLabel: 'Úr',
        dailyBonusReady: 'Denný bonus pripravený!',
        streakDays: '{n}-dňová séria',
        streakBroken: 'Séria prerušená — začni odznova',
        streakDay1: 'Deň 1',
        tomorrowReward: 'Zajtra: +{n}',
        dayMon: 'Po', dayTue: 'Ut', dayWed: 'St', dayThu: 'Št', dayFri: 'Pi', daySat: 'So', daySun: 'Ne',

        // Tutorial (first-time-user coach marks)
        tutorialStep1Title: 'Tvoja karta',
        tutorialStep1Body: '9 stĺpcov × 3 riadky. Spolu 15 čísel na označenie.',
        tutorialStep2Title: 'Volané čísla',
        tutorialStep2Body: 'Tu vidíš číslo, ktoré bolo práve vyvolané. Pod ním je história.',
        tutorialStep3Title: 'Klepni na číslo',
        tutorialStep3Body: 'Keď počuješ alebo vidíš svoje číslo, klepni naň na karte.',
        tutorialStep4Title: 'Cieľ hry',
        tutorialStep4Body: 'Označ všetkých 15 čísel rýchlejšie ako ostatní hráči.',
        tutorialStep5Title: 'Vyhraj!',
        tutorialStep5Body: 'Keď máš všetko označené, klepni tlačidlo BINGO!',
        tutorialNext: 'Ďalej',
        tutorialDone: 'Hotovo',
        tutorialSkip: 'Preskočiť tutorial',
        tutorialStepCount: 'Krok {n}/{total}',
        resetTutorial: 'Reset tutorialu',
        resetTutorialDesc: 'Znovu zobraziť tutorial pri ďalšej Practice hre.',
        reset: 'Reset',

        // Notifications & invite
        notificationsLabel: 'Upozornenia',
        notificationsDesc: 'Pripomenutia na denný bonus, pozvánky',
        dailyBonusNotifTitle: '🎁 Denný bonus je pripravený!',
        dailyBonusNotifBody: 'Otvor LOTO a vyzdvihni odmenu.',
        shareInvite: 'Zdieľaj pozvánku',
        invitedToJoin: 'Pripájaš sa cez pozvánku',

        // Battle Pass / Season Pass
        battlePass: 'Bojový Pass',
        seasonPass: 'Sezónny Pass',
        seasonLevel: 'Úroveň',
        seasonXp: 'XP',
        unlockPremium: 'Odomkni Premium',
        getPremium: 'Získať Premium',
        premiumPrice: '$4.99',
        daysLeft: '{n} dní zostáva',
        seasonEnded: 'Sezóna skončila',
        claim: 'Vyzdvihnúť',
        claimed: 'Vyzdvihnuté',
        locked: 'Zamknuté',
        nextReward: 'Ďalšia odmena',
        freeTrack: 'Zadarmo',
        premiumTrack: 'Premium',

        // Connection status banner
        connStatusReconnecting: 'Pripájam sa...',
        connStatusDisconnected: 'Stratené pripojenie',
        connStatusConnected: 'Pripojené',
        connStatusOffline: 'Žiadne pripojenie',
        connStatusError: 'Chyba pripojenia',
        connRetry: 'Skúsiť znova',

        // Power-ups
        powerUps: 'Vylepšenia',
        powerUpPeek: 'Pozri ďalšie 3',
        powerUpPeekDesc: 'Uvidíš ďalšie 3 čísla',
        powerUpLuckyMark: 'Šťastná značka',
        powerUpLuckyMarkDesc: 'Automaticky označí chýbajúce číslo',
        powerUpSlowTime: 'Spomaliť čas',
        powerUpSlowTimeDesc: '2× pomalšie auto-call na 30s',
        watchAdForPowerUp: 'Pozri reklamu za +1',
        nextNumbersAre: 'Ďalšie: {numbers}',
        powerUpEarned: 'Získal si 1 {name}!',
        slowTimeActive: '⏰ Pomalý čas',
    },
    ru: {
        // Menu
        title: 'ЛОТО', subtitle: 'Семейный вечер игр', createGame: 'Создать игру', joinGame: 'Присоединиться', back: 'Назад',
        playerName: 'Ваше имя', playerNamePlaceholder: 'Введите имя', roomCode: 'Код комнаты', roomCodePlaceholder: 'ABC123',
        autoCall: 'Авто-вызов чисел', speed: 'Скорость', slow: 'Медленно', normal: 'Нормально', fast: 'Быстро',
        crazyMode: 'Безумный режим', crazyModeDesc: 'Числа перемешиваются после каждого попадания!', createBtn: 'Создать комнату', joinBtn: 'Войти в игру',
        nameError: 'Имя должно быть не менее 2 символов', codeError: 'Код должен быть не короче 6 символов',
        createHint: 'Подготовьте семью и настройте правила перед стартом.',
        joinHint: 'Введите код ведущего и будьте готовы играть.',
        public: 'Публичная', private: 'Приватная',
        publicDesc: 'Любой может найти и присоединиться к вашей игре',
        privateDesc: 'Только игроки с вашим кодом могут присоединиться',
        optionalLabel: 'необязательно',
        customCodeHelp: 'Используйте 3–8 букв или цифр, чтобы задать свой код.',
        roomCodeHint: 'Попросите ведущего поделиться шестью символами кода.',

        // Lobby
        lobbyTitle: 'Зал ожидания', roomCodeLabel: 'КОД КОМНАТЫ', playersReady: 'Игроки в комнате',
        startGame: 'Начать игру', waitingForHost: 'Ожидание начала игры хостом...', hostInfo: 'Пригласите игроков, поделившись кодом',
        shareIp: 'Или скажите им перейти по адресу:', copy: 'Копировать', share: 'Поделиться', copied: 'Скопировано',
        closeRoom: 'Закрыть комнату', scanToJoin: 'СКАНИРУЙТЕ QR', leaveConfirm: 'Покинуть игру?',

        // Game
        players: 'Игроки', paused: 'Игра на паузе', claimBingo: 'БИНГО!', claimFlat: 'ЛИНИЯ!',
        claimRow1: 'Ряд 1', claimRow2: 'Ряд 2',
        auto1: 'Авто 1', auto5: 'Авто 5', repair: 'Исправить', magnifier: 'Лупа', crazy: 'Crazy',
        currentNumber: 'Текущее число', callNext: 'След. число', resume: 'Продолжить', pause: 'Пауза',
        endGame: 'Закончить игру', remaining: 'чисел осталось',
        endGameConfirm: 'Вы уверены, что хотите завершить раунд для всех игроков?',
        showBoard: 'Доска ведущего',
        changeAvatar: 'Изменить аватар', selectAvatar: 'Выберите аватар',

        // Card Progress
        cardFull: 'ГОТОВО!', numbersLeft: 'осталось', almostThere: 'Почти готово!', progress: 'Прогресс',

        // Winner Screen
        victory: 'Победа!', gameOver: 'Игра окончена', youWon: 'Вы выиграли Лото!',
        playerWins: 'забирает приз!', winningScore: 'Победный счёт',
        playAgain: 'Играть снова', waitingHostRestart: 'Ожидание перезапуска хостом...',
        leaveRoom: 'Покинуть комнату',

        // Player Stats
        kickPlayer: 'Выгнать игрока', host: 'Ведучий', online: 'Онлайн', offline: 'Офлайн',
        score: 'Счёт', flats: 'Ряды', cards: 'Карты', me: 'Я',

        // Toast Messages
        leftTheGame: 'покинул игру',

        // Error Boundary
        errorTitle: 'Ой! Что-то пошло не так',
        errorDefault: 'В игре произошла непредвиденная ошибка',
        tryAgain: 'Попробовать снова', reloadGame: 'Перезагрузить игру', backToMenu: 'В меню',
        errorHint: 'Если это повторяется, попробуйте очистить кэш браузера',

        // Profile
        save: 'Сохранить', profileUpdated: 'Профиль обновлён!',
        confirmKick: 'Вы уверены, что хотите выгнать',
        kicked: 'выгнан', confirmCloseRoom: 'Вы уверены, что хотите закрыть комнату? Все игроки будут отключены.',
        joinMyGame: 'Присоединяйся к моей игре в Лото!', joinWithCode: 'Присоединяйся с кодом:',
        gameSpeed: 'Скорость игры', pausedByHost: 'Игра приостановлена ведущим',
        selectTarget: 'Выбрать цель 🎯', cancel: 'Отмена', mode: 'Режим',
        copiedError: 'Не удалось скопировать', leaderboard: 'Таблица лидеров',

        // Mobile App UI
        welcomeBack: 'С возвращением,', hostOnline: 'Хост онлайн', practice: 'Тренировка',
        settings: 'Настройки', audioSound: 'Звук и музыка', audioDesc: 'Переключить музыку и звуковые эффекты',
        languageLabel: 'Язык', languageDesc: 'Выберите предпочитаемый язык',
        batterySaver: 'Экономия батареи', batterySaverDesc: 'Уменьшает анимацию для экономии энергии',
        howToPlay: 'Как играть', playerStats: 'Статистика игрока', statsTitle: 'Статистика', ranks: 'Рейтинг', shop: 'Магазин',
        close: 'Закрыть', connecting: 'Подключение к серверу...', exitGame: 'Выйти из игры',
        called: 'вызвано', autoPlay: 'АВТО-ИГРА',
        dailyBonus: 'Ежедневный бонус', dailyBonusWelcome: 'С возвращением! Вот ваша награда.',
        games: 'Игры', wins: 'Победы', winRate: 'Винрейт', earnings: 'Заработок',
        claimAndPlay: 'ЗАБРАТЬ', gotIt: 'Понятно!',
        rateTitle: 'Нравится ЛОТО?', rateMessage: 'Если вам нравится игра, оцените нас! Это поможет другим найти игру.',
        rateNow: 'Оценить', rateLater: 'Позже',
        onboardingTitle1: 'Добро пожаловать в ЛОТО!', onboardingDesc1: 'Классическая игра с числами для семьи и друзей. Отмечайте числа на карточке и побеждайте!',
        onboardingTitle2: 'Играйте Вместе', onboardingDesc2: 'Создайте комнату и пригласите друзей или тренируйтесь в одиночку против компьютера.',
        onboardingTitle3: 'Получайте Награды', onboardingDesc3: 'Заполните карточку первым, чтобы выиграть! Зарабатывайте монеты и поднимайтесь в рейтинге.',
        letsPlay: 'Поехали!', next: 'Далее', skip: 'Пропустить',

        // Profile Editor
        editProfile: 'Изменить профиль', changeName: 'Изменить имя', tapToEdit: 'Нажмите для изменения',
        saveChanges: 'Сохранить', nameTooShort: 'Имя должно быть не менее 2 символов',

        // Shop
        shopTitle: 'Магазин', all: 'Все', avatars: 'Аватары', themes: 'Темы', markers: 'Фишки',
        owned: 'Куплено', equipped: 'Активно', equip: 'Выбрать', active: 'Активно', buy: 'Купить', free: 'Бесплатно',
        emptyShelf: 'Пустая полка', emptyShelfDesc: 'В этой категории пока ничего нет. Загляните позже!',
        tapToCopy: 'Нажмите чтобы скопировать',

        // Rules Content
        rulesTitle: 'Как играть',
        rulesPage1Title: 'Основы',
        rulesPage1Desc: '90 шаров выпадают случайно. У вас 3 карточки. Нажмите на число, чтобы отметить его фишкой. Осторожно: ошибка временно замораживает карточку!',
        rulesPage2Title: 'Крупные выигрыши',
        rulesPage2Desc: 'Соберите ЛИНИЮ!, заполнив любой горизонтальный ряд. Выиграйте ДЖЕКПОТ, заполнив всю карточку (БИНГО!). Призовой фонд делится между победителями.',
        rulesPage3Title: 'Экономика',
        rulesPage3Desc: 'Вход в комнаты платный (в LCoins). Все взносы формируют призовой фонд. Чем больше игроков, тем больше награда!',
        rulesPage4Title: 'Социальный мир',
        rulesPage4Desc: 'Общайтесь с другими игроками в чате. Побеждайте, чтобы подняться в глобальном рейтинге и стать легендой Лото!',

        // Accessibility (a11y)
        a11yNumberLabel: 'Число {n}',
        a11yMarkedState: 'правильно отмечено',
        a11yMarkedIncorrect: 'отмечено ошибочно',
        a11yCalledTapToMark: 'выпало, нажмите чтобы отметить',
        a11yNotCalledYet: 'ещё не выпало',
        a11yMarkedState_short: 'отмечено',
        a11yUnmarkedState: 'не отмечено',
        a11yMissedState: 'пропущено',
        a11yEmptyCell: 'пустая клетка',
        a11yLoadingGame: 'Загрузка игры...',
        a11yErrorRetry: 'Повторить',
        a11yMarkHint: 'Двойное нажатие для отметки числа',

        // Loading / Error / Empty
        loadingGame: 'Загрузка игры...',
        connectionError: 'Не удалось подключиться. Проверьте интернет и повторите.',
        retry: 'Повторить',
        noConnection: 'Нет соединения',
        noPublicRooms: 'Нет публичных комнат',
        noPublicRoomsDesc: 'Создайте первую и пригласите друзей!',
        noChatMessages: 'Сообщений пока нет',
        noChatMessagesDesc: 'Поздоровайтесь с комнатой!',
        browsePublicRooms: 'или просмотрите публичные комнаты',
        chatTitle: 'Чат комнаты',
        typeMessage: 'Напишите сообщение...',

        // Main Menu redesign
        practiceVsBots: 'Против ботов',
        joinByCode: 'Ввести код',
        claimNow: 'Получить',
        nextBonusIn: 'Следующий через',
        freeCoins: 'Бесплатные монеты',
        watchAd: 'Смотреть',
        availableIn: 'Доступно через',
        settingsTab: 'Настройки',
        playNow: 'ИГРАТЬ',
        tapToChoose: 'Выбери игру',
        chooseGame: 'Выбери игру',
        dailyMissionsTitle: 'Ежедневные задания',
        dailyResetIn: 'Сброс через',
        leagueStandingsTitle: 'Рейтинг лиги',
        leaguePromoteHint: 'Топ 20% переходят на след. неделе',
        playerRank: 'Место',
        weeklyWinPoints: 'Очки за неделю',
        shareWin: 'Поделиться',
        coinsLabel: 'монет',
        xpLabel: 'XP',
        levelUp: 'Новый уровень!',
        audioSection: 'Звук',
        profileSection: 'Профиль',
        statsSection: 'Статистика',
        experience: 'Опыт',
        level: 'Уровень',
        tapToCycle: 'Нажми на аватар, чтобы сменить',
        changeAvatarTitle: 'Сменить аватар',
        claimReward: 'Получить',
        missionClaimed: 'ГОТОВО',
        allDoneTitle: 'Всё сделано!',
        allDoneDesc: 'Возвращайся завтра за новыми заданиями.',
        noCompetitorsTitle: 'Пока нет игроков',
        noCompetitorsDesc: 'Стань первым на этой неделе!',
        youLabel: 'ТЫ',
        promote: 'ПОВЫШ.',
        previous: 'Назад',
        rateThanks: 'Спасибо!',
        levelLabel: 'Ур',
        dailyBonusReady: 'Ежедневный бонус готов!',
        streakDays: 'Серия {n} дн.',
        streakBroken: 'Серия прервана — начни заново',
        streakDay1: 'День 1',
        tomorrowReward: 'Завтра: +{n}',
        dayMon: 'Пн', dayTue: 'Вт', dayWed: 'Ср', dayThu: 'Чт', dayFri: 'Пт', daySat: 'Сб', daySun: 'Вс',

        // Tutorial (first-time-user coach marks)
        tutorialStep1Title: 'Ваша карточка',
        tutorialStep1Body: '9 столбцов × 3 строки. Всего 15 чисел для отметки.',
        tutorialStep2Title: 'Выпавшие числа',
        tutorialStep2Body: 'Здесь видно только что выпавшее число. История ниже.',
        tutorialStep3Title: 'Нажмите на число',
        tutorialStep3Body: 'Когда услышите или увидите своё число, нажмите на него на карточке.',
        tutorialStep4Title: 'Цель игры',
        tutorialStep4Body: 'Отметьте все 15 чисел быстрее других игроков.',
        tutorialStep5Title: 'Победа!',
        tutorialStep5Body: 'Когда отметите все числа, нажмите кнопку БИНГО!',
        tutorialNext: 'Далее',
        tutorialDone: 'Готово',
        tutorialSkip: 'Пропустить обучение',
        tutorialStepCount: 'Шаг {n}/{total}',
        resetTutorial: 'Сбросить обучение',
        resetTutorialDesc: 'Показать обучение снова в следующей тренировочной игре.',
        reset: 'Сброс',

        // Notifications & invite
        notificationsLabel: 'Уведомления',
        notificationsDesc: 'Напоминания о бонусе, приглашения друзей',
        dailyBonusNotifTitle: '🎁 Ежедневный бонус готов!',
        dailyBonusNotifBody: 'Откройте ЛОТО и заберите награду.',
        shareInvite: 'Поделиться',
        invitedToJoin: 'Вы присоединяетесь по приглашению',

        // Battle Pass / Season Pass
        battlePass: 'Боевой пропуск',
        seasonPass: 'Сезонный пропуск',
        seasonLevel: 'Уровень',
        seasonXp: 'Опыт',
        unlockPremium: 'Открыть Премиум',
        getPremium: 'Получить Премиум',
        premiumPrice: '$4.99',
        daysLeft: 'Осталось {n} дн.',
        seasonEnded: 'Сезон окончен',
        claim: 'Забрать',
        claimed: 'Получено',
        locked: 'Заблокировано',
        nextReward: 'Следующая награда',
        freeTrack: 'Бесплатно',
        premiumTrack: 'Премиум',

        // Connection status banner
        connStatusReconnecting: 'Подключение...',
        connStatusDisconnected: 'Соединение потеряно',
        connStatusConnected: 'Подключено',
        connStatusOffline: 'Нет соединения',
        connStatusError: 'Ошибка подключения',
        connRetry: 'Повторить',

        // Power-ups
        powerUps: 'Усиления',
        powerUpPeek: 'Подсмотреть 3',
        powerUpPeekDesc: 'Увидеть следующие 3 числа',
        powerUpLuckyMark: 'Счастливая метка',
        powerUpLuckyMarkDesc: 'Автоматически отметит пропущенное число',
        powerUpSlowTime: 'Замедлить время',
        powerUpSlowTimeDesc: '2× медленнее авто-вызов на 30с',
        watchAdForPowerUp: 'Посмотреть рекламу за +1',
        nextNumbersAre: 'Следующие: {numbers}',
        powerUpEarned: 'Получено 1 {name}!',
        slowTimeActive: '⏰ Замедление',
    },
    uk: {
        // Menu
        title: 'ЛОТО', subtitle: 'Сімейний вечір ігор', createGame: 'Створити гру', joinGame: 'Приєднатися', back: 'Назад',
        playerName: 'Ваше ім\'я', playerNamePlaceholder: 'Введіть ім\'я', roomCode: 'Код кімнати', roomCodePlaceholder: 'ABC123',
        autoCall: 'Авто-виклик чисел', speed: 'Швидкість', slow: 'Повільно', normal: 'Нормально', fast: 'Швидко',
        crazyMode: 'Божевільний режим', crazyModeDesc: 'Числа перемішуються після кожного влучання!', createBtn: 'Створити кімнату', joinBtn: 'Увійти в гру',
        nameError: 'Ім\'я має бути не менше 2 символів', codeError: 'Код має бути щонайменше з 6 символів',
        createHint: 'Підготуйте родину й налаштуйте правила перед стартом.',
        joinHint: 'Введіть код ведучого і будьте готові до гри.',
        public: 'Публічна', private: 'Приватна',
        publicDesc: 'Будь-хто може знайти вашу гру та приєднатися до неї',
        privateDesc: 'Тільки гравці з вашим кодом можуть приєднатися',
        optionalLabel: 'необов\'язково',
        customCodeHelp: 'Використайте 3–8 літер або цифр для власного коду.',
        roomCodeHint: 'Попросіть ведучого поділитися шістьма символами коду.',

        // Lobby
        lobbyTitle: 'Зал очікування', roomCodeLabel: 'КОД КІМНАТИ', playersReady: 'Гравці в кімнаті',
        startGame: 'Почати гру', waitingForHost: 'Очікування початку гри хостом...', hostInfo: 'Запросіть гравців, поділившись кодом',
        shareIp: 'Або скажіть їм перейти за адресою:', copy: 'Копіювати', share: 'Поділитися', copied: 'Скопійовано',
        closeRoom: 'Закрити кімнату', scanToJoin: 'СКАНУЙТЕ QR', leaveConfirm: 'Покинути гру?',

        // Game
        players: 'Гравці', paused: 'Гра на паузі', claimBingo: 'БІНГО!', claimFlat: 'ЛІНІЯ!',
        claimRow1: 'Ряд 1', claimRow2: 'Ряд 2',
        auto1: 'Авто 1', auto5: 'Авто 5', repair: 'Виправити', magnifier: 'Лупа', crazy: 'Crazy',
        currentNumber: 'Поточне число', callNext: 'Наст. число', resume: 'Продовжити', pause: 'Пауза',
        endGame: 'Завершити гру', remaining: 'чисел залишилося',
        endGameConfirm: 'Завершити раунд для всіх гравців?',
        showBoard: 'Дошка ведучого',
        changeAvatar: 'Змінити аватар', selectAvatar: 'Виберіть аватар',

        // Card Progress
        cardFull: 'ГОТОВО!', numbersLeft: 'залишилось', almostThere: 'Майже готово!', progress: 'Прогрес',

        // Winner Screen
        victory: 'Перемога!', gameOver: 'Гра закінчена', youWon: 'Ви виграли Лото!',
        playerWins: 'забирає приз!', winningScore: 'Переможний рахунок',
        playAgain: 'Грати знову', waitingHostRestart: 'Очікування перезапуску хостом...',
        leaveRoom: 'Покинути кімнату',

        // Player Stats
        kickPlayer: 'Вигнати гравця', host: 'Ведучий', online: 'Онлайн', offline: 'Офлайн',
        score: 'Рахунок', flats: 'Ряди', cards: 'Карти', me: 'Я',

        // Toast Messages
        leftTheGame: 'покинув гру',

        // Error Boundary
        errorTitle: 'Ой! Щось пішло не так',
        errorDefault: 'У грі виникла несподівана помилка',
        tryAgain: 'Спробувати знову', reloadGame: 'Перезавантажити гру', backToMenu: 'До меню',
        errorHint: 'Якщо це повторюється, спробуйте очистити кеш браузера',

        // Profile
        save: 'Зберегти', profileUpdated: 'Профіль оновлено!',
        confirmKick: 'Ви впевнені, що хочете вигнати',
        kicked: 'вигнаний', confirmCloseRoom: 'Ви впевнені, що хочете закрити кімнату? Всіх гравців буде відключено.',
        joinMyGame: 'Приєднуйся до моєї гри в Лото!', joinWithCode: 'Приєднуйся з кодом:',
        gameSpeed: 'Швидкість гри', pausedByHost: 'Гра призупинена ведучим',
        selectTarget: 'Обрати ціль 🎯', cancel: 'Скасувати', mode: 'Режим',
        copiedError: 'Не вдалося скопіювати', leaderboard: 'Таблиця лідерів',

        // Mobile App UI
        welcomeBack: 'Ласкаво просимо,', hostOnline: 'Хост онлайн', practice: 'Тренування',
        settings: 'Налаштування', audioSound: 'Звук та музика', audioDesc: 'Увімкнути/вимкнути музику та звукові ефекти',
        languageLabel: 'Мова', languageDesc: 'Виберіть бажану мову',
        batterySaver: 'Економія батареї', batterySaverDesc: 'Зменшує анімацію для економії енергії',
        howToPlay: 'Як грати', playerStats: 'Статистика гравця', statsTitle: 'Статистика', ranks: 'Рейтинг', shop: 'Магазин',
        close: 'Закрити', connecting: 'Підключення до сервера...', exitGame: 'Вийти з гри',
        called: 'викликано', autoPlay: 'АВТО-ГРА',
        dailyBonus: 'Щоденний бонус', dailyBonusWelcome: 'Ласкаво просимо! Ось ваша нагорода.',
        games: 'Ігри', wins: 'Перемоги', winRate: 'Вінрейт', earnings: 'Заробіток',
        claimAndPlay: 'ЗАБРАТИ', gotIt: 'Зрозуміло!',
        rateTitle: 'Подобається ЛОТО?', rateMessage: 'Якщо вам подобається гра, оцініть нас! Це допоможе іншим знайти гру.',
        rateNow: 'Оцінити', rateLater: 'Пізніше',
        onboardingTitle1: 'Ласкаво просимо в ЛОТО!', onboardingDesc1: 'Класична гра з числами для сім\'ї та друзів. Відмічайте числа на картці та перемагайте!',
        onboardingTitle2: 'Грайте Разом', onboardingDesc2: 'Створіть кімнату та запросіть друзів або тренуйтеся наодинці проти комп\'ютера.',
        onboardingTitle3: 'Отримуйте Нагороди', onboardingDesc3: 'Заповніть картку першим, щоб виграти! Заробляйте монети та піднімайтеся в рейтингу.',
        letsPlay: 'Поїхали!', next: 'Далі', skip: 'Пропустити',

        // Profile Editor
        editProfile: 'Редагувати профіль', changeName: 'Змінити ім\'я', tapToEdit: 'Натисніть для редагування',
        saveChanges: 'Зберегти', nameTooShort: 'Ім\'я має містити щонайменше 2 символи',

        // Shop
        shopTitle: 'Магазин', all: 'Усі', avatars: 'Аватари', themes: 'Теми', markers: 'Фішки',
        owned: 'Придбано', equipped: 'Активно', equip: 'Обрати', active: 'Активно', buy: 'Купити', free: 'Безкоштовно',
        emptyShelf: 'Порожня полиця', emptyShelfDesc: 'У цій категорії поки нічого немає. Завітайте пізніше!',
        tapToCopy: 'Натисніть, щоб скопіювати',

        // Rules Content
        rulesTitle: 'Як грати',
        rulesPage1Title: 'Основи',
        rulesPage1Desc: '90 куль випадають випадково. У вас є 3 картки. Натисніть на число, щоб позначити його фішкою. Обережно: помилка тимчасово заморожує картку!',
        rulesPage2Title: 'Великі виграші',
        rulesPage2Desc: 'Зберіть ЛІНІЮ!, заповнивши будь-який горизонтальний ряд. Виграйте ДЖЕКПОТ, заповнивши всю картку (БІНГО!). Призовий фонд ділиться між усіма переможцями.',
        rulesPage3Title: 'Економіка',
        rulesPage3Desc: 'Вхід у кімнати платний (в LCoins). Усі внески формують призовий фонд. Чим більше гравців, тим більша нагорода!',
        rulesPage4Title: 'Соціальний світ',
        rulesPage4Desc: 'Спілкуйтеся з іншими гравцями в чаті в реальному часі. Перемагайте, щоб піднятися в глобальному рейтингу і стати королем Лото!',

        // Accessibility (a11y)
        a11yNumberLabel: 'Число {n}',
        a11yMarkedState: 'правильно позначено',
        a11yMarkedIncorrect: 'позначено помилково',
        a11yCalledTapToMark: 'випало, торкніться щоб позначити',
        a11yNotCalledYet: 'ще не випало',
        a11yMarkedState_short: 'позначено',
        a11yUnmarkedState: 'не позначено',
        a11yMissedState: 'пропущено',
        a11yEmptyCell: 'порожня клітинка',
        a11yLoadingGame: 'Завантаження гри...',
        a11yErrorRetry: 'Повторити',
        a11yMarkHint: 'Подвійне торкання, щоб позначити число',

        // Loading / Error / Empty
        loadingGame: 'Завантаження гри...',
        connectionError: 'Не вдалося підключитися. Перевірте інтернет та спробуйте ще раз.',
        retry: 'Повторити',
        noConnection: 'Немає з\'єднання',
        noPublicRooms: 'Немає публічних кімнат',
        noPublicRoomsDesc: 'Створіть першу та запросіть друзів!',
        noChatMessages: 'Повідомлень ще немає',
        noChatMessagesDesc: 'Привітайтеся з кімнатою!',
        browsePublicRooms: 'або перегляньте публічні кімнати',
        chatTitle: 'Чат кімнати',
        typeMessage: 'Напишіть повідомлення...',

        // Main Menu redesign
        practiceVsBots: 'Проти ботів',
        joinByCode: 'Ввести код',
        claimNow: 'Отримати',
        nextBonusIn: 'Наступний через',
        freeCoins: 'Безкоштовні монети',
        watchAd: 'Дивитись',
        availableIn: 'Доступно через',
        settingsTab: 'Налаштування',
        playNow: 'ГРАТИ',
        tapToChoose: 'Обери гру',
        chooseGame: 'Обери гру',
        dailyMissionsTitle: 'Щоденні завдання',
        dailyResetIn: 'Скидання через',
        leagueStandingsTitle: 'Рейтинг ліги',
        leaguePromoteHint: 'Топ 20% переходять наступного тижня',
        playerRank: 'Місце',
        weeklyWinPoints: 'Очки за тиждень',
        shareWin: 'Поділитися',
        coinsLabel: 'монет',
        xpLabel: 'XP',
        levelUp: 'Новий рівень!',
        audioSection: 'Звук',
        profileSection: 'Профіль',
        statsSection: 'Статистика',
        experience: 'Досвід',
        level: 'Рівень',
        tapToCycle: 'Натисни на аватар, щоб змінити',
        changeAvatarTitle: 'Змінити аватар',
        claimReward: 'Отримати',
        missionClaimed: 'ГОТОВО',
        allDoneTitle: 'Усе виконано!',
        allDoneDesc: 'Повертайся завтра за новими завданнями.',
        noCompetitorsTitle: 'Поки немає гравців',
        noCompetitorsDesc: 'Стань першим цього тижня!',
        youLabel: 'ТИ',
        promote: 'ВИЩЕ',
        previous: 'Назад',
        rateThanks: 'Дякуємо!',
        levelLabel: 'Рів',
        dailyBonusReady: 'Щоденний бонус готовий!',
        streakDays: 'Серія {n} дн.',
        streakBroken: 'Серію перервано — почни заново',
        streakDay1: 'День 1',
        tomorrowReward: 'Завтра: +{n}',
        dayMon: 'Пн', dayTue: 'Вт', dayWed: 'Ср', dayThu: 'Чт', dayFri: 'Пт', daySat: 'Сб', daySun: 'Нд',

        // Tutorial (first-time-user coach marks)
        tutorialStep1Title: 'Ваша картка',
        tutorialStep1Body: '9 стовпців × 3 рядки. Всього 15 чисел для позначення.',
        tutorialStep2Title: 'Викликані числа',
        tutorialStep2Body: 'Тут видно щойно викликане число. Історія нижче.',
        tutorialStep3Title: 'Натисніть на число',
        tutorialStep3Body: 'Коли почуєте або побачите своє число, натисніть на нього на картці.',
        tutorialStep4Title: 'Мета гри',
        tutorialStep4Body: 'Позначте всі 15 чисел швидше за інших гравців.',
        tutorialStep5Title: 'Перемога!',
        tutorialStep5Body: 'Коли позначите всі числа, натисніть кнопку БІНГО!',
        tutorialNext: 'Далі',
        tutorialDone: 'Готово',
        tutorialSkip: 'Пропустити навчання',
        tutorialStepCount: 'Крок {n}/{total}',
        resetTutorial: 'Скинути навчання',
        resetTutorialDesc: 'Знову показати навчання у наступній тренувальній грі.',
        reset: 'Скинути',

        // Notifications & invite
        notificationsLabel: 'Сповіщення',
        notificationsDesc: 'Нагадування про бонус, запрошення друзів',
        dailyBonusNotifTitle: '🎁 Щоденний бонус готовий!',
        dailyBonusNotifBody: 'Відкрий ЛОТО і забери нагороду.',
        shareInvite: 'Поділитися',
        invitedToJoin: 'Ти приєднуєшся за запрошенням',

        // Battle Pass / Season Pass
        battlePass: 'Бойовий пропуск',
        seasonPass: 'Сезонний пропуск',
        seasonLevel: 'Рівень',
        seasonXp: 'Досвід',
        unlockPremium: 'Розблокувати Преміум',
        getPremium: 'Отримати Преміум',
        premiumPrice: '$4.99',
        daysLeft: 'Залишилось {n} дн.',
        seasonEnded: 'Сезон закінчився',
        claim: 'Забрати',
        claimed: 'Отримано',
        locked: 'Заблоковано',
        nextReward: 'Наступна нагорода',
        freeTrack: 'Безкоштовно',
        premiumTrack: 'Преміум',

        // Connection status banner
        connStatusReconnecting: 'Підключення...',
        connStatusDisconnected: 'З\'єднання втрачено',
        connStatusConnected: 'Підключено',
        connStatusOffline: 'Немає з\'єднання',
        connStatusError: 'Помилка підключення',
        connRetry: 'Повторити',

        // Power-ups
        powerUps: 'Підсилення',
        powerUpPeek: 'Підглянути 3',
        powerUpPeekDesc: 'Побачити наступні 3 числа',
        powerUpLuckyMark: 'Щаслива позначка',
        powerUpLuckyMarkDesc: 'Автоматично позначить пропущене число',
        powerUpSlowTime: 'Уповільнити час',
        powerUpSlowTimeDesc: '2× повільніше авто-виклик на 30с',
        watchAdForPowerUp: 'Переглянути рекламу за +1',
        nextNumbersAre: 'Далі: {numbers}',
        powerUpEarned: 'Отримано 1 {name}!',
        slowTimeActive: '⏰ Уповільнення',
    }
};

/**
 * Default language fallback
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/**
 * Supported languages with display names
 */
export const SUPPORTED_LANGUAGES: Record<Language, string> = {
    en: 'English',
    sk: 'Slovenčina',
    ru: 'Русский',
    uk: 'Українська'
};

/**
 * Get translations for a specific language
 */
export function getTranslations(language: Language): TranslationKeys {
    return translations[language] ?? translations[DEFAULT_LANGUAGE];
}

/**
 * Hook helper to create typed translation getter
 */
export function useTranslation(language: Language) {
    const t = translations[language] ?? translations[DEFAULT_LANGUAGE];
    return { t, language };
}
