export type Language = 'en' | 'sk' | 'ru' | 'uk';

export type TranslationDictionary = Record<string, string>;

export const translations: Record<Language, TranslationDictionary> = {
    en: {
        // Menu
        title: 'LOTO', subtitle: 'Family Game Night', createGame: 'Create Game', joinGame: 'Join Game', back: 'Back',
        playerName: 'Your Name', playerNamePlaceholder: 'Enter your name', roomCode: 'Room Code', roomCodePlaceholder: 'ABC123',
        autoCall: 'Auto-Call Numbers', speed: 'Speed', slow: 'Slow', normal: 'Normal', fast: 'Fast',
        crazyMode: 'Crazy Mode', crazyModeDesc: 'Numbers shuffle after each correct mark!', createBtn: 'Create Room', joinBtn: 'Join Room',
        nameError: 'Name must be at least 2 characters', codeError: 'Room code must be at least 6 characters',
        createHint: 'Gather everyone and set your house rules before launching.',
        joinHint: 'Enter the host code and get ready to play.',
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
        kickPlayer: 'Выгнать игрока', host: 'Ведущий', online: 'Онлайн', offline: 'Офлайн',
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
        optionalLabel: 'необовʼязково',
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
    }
};
