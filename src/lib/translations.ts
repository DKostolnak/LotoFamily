export type Language = 'en' | 'sk' | 'ru' | 'uk';

export const translations: Record<Language, any> = {
    en: {
        title: 'LOTO', subtitle: 'Family Game Night', createGame: 'Create Game', joinGame: 'Join Game', back: 'Back',
        playerName: 'Your Name', playerNamePlaceholder: 'Enter your name', roomCode: 'Room Code', roomCodePlaceholder: 'ABC123',
        autoCall: 'Auto-Call Numbers', speed: 'Speed', slow: 'Slow', normal: 'Normal', fast: 'Fast',
        crazyMode: 'Crazy Mode', crazyModeDesc: 'Numbers shuffle after each correct mark!', createBtn: 'Create Room', joinBtn: 'Join Room',
        nameError: 'Name must be at least 2 characters', codeError: 'Room code must be 6 characters',
        lobbyTitle: 'Waiting Lobby', roomCodeLabel: 'ROOM CODE', playersReady: 'Players Joined',
        startGame: 'Start Game', waitingForHost: 'Waiting for host to start...', hostInfo: 'Invite players by sharing the Room Code',
        shareIp: 'Or tell them to visit:', copy: 'Copy', share: 'Share', copied: 'Copied',
        closeRoom: 'Close Room', scanToJoin: 'SCAN TO JOIN', leaveConfirm: 'Leave game?',
        players: 'Players', paused: 'Game Paused', claimBingo: 'BINGO!', claimFlat: 'LINE!',
        auto1: 'Auto 1', auto5: 'Auto 5', repair: 'Repair', magnifier: 'Magnifier', crazy: 'Crazy',
        currentNumber: 'Current Number', callNext: 'Call Next Number', resume: 'Resume', pause: 'Pause',
        endGame: 'End Game', remaining: 'numbers remaining',
        changeAvatar: 'Change Avatar', selectAvatar: 'Select your avatar'
    },
    sk: {
        title: 'LOTO', subtitle: 'Rodinný herný večer', createGame: 'Vytvoriť hru', joinGame: 'Pripojiť sa', back: 'Späť',
        playerName: 'Vaše meno', playerNamePlaceholder: 'Zadajte meno', roomCode: 'Kód miestnosti', roomCodePlaceholder: 'ABC123',
        autoCall: 'Automatické vyvolávanie', speed: 'Rýchlosť', slow: 'Pomaly', normal: 'Normálne', fast: 'Rýchlo',
        crazyMode: 'Bláznivý režim', crazyModeDesc: 'Čísla sa po každom zásahu zamiešajú!', createBtn: 'Vytvoriť miestnosť', joinBtn: 'Vstúpiť do hry',
        nameError: 'Meno musí mať aspoň 2 znaky', codeError: 'Kód musí mať 6 znakov',
        lobbyTitle: 'Čakáreň', roomCodeLabel: 'KÓD MIESTNOSTI', playersReady: 'Pripojení hráči',
        startGame: 'Spustiť hru', waitingForHost: 'Čakanie na hostiteľa...', hostInfo: 'Pozvite hráčov zdieľaním kódu',
        shareIp: 'Alebo im povedzte, aby navštívili:', copy: 'Kopírovať', share: 'Zdieľať', copied: 'Skopírované',
        closeRoom: 'Zavrieť miestnosť', scanToJoin: 'NASKENUJTE QR', leaveConfirm: 'Odísť z hry?',
        players: 'Hráči', paused: 'Hra pozastavená', claimBingo: 'BINGO!', claimFlat: 'RIADOK!',
        auto1: 'Auto 1', auto5: 'Auto 5', repair: 'Opraviť', magnifier: 'Lupa', crazy: 'Crazy',
        currentNumber: 'Aktuálne číslo', callNext: 'Volať ďalšie číslo', resume: 'Pokračovať', pause: 'Pozastaviť',
        endGame: 'Ukončiť hru', remaining: 'ostávajúcich čísel',
        changeAvatar: 'Zmeniť avatara', selectAvatar: 'Vyberte si avatara'
    },
    ru: {
        title: 'ЛОТО', subtitle: 'Семейный вечер игр', createGame: 'Создать игру', joinGame: 'Присоединиться', back: 'Назад',
        playerName: 'Ваше имя', playerNamePlaceholder: 'Введите имя', roomCode: 'Код комнаты', roomCodePlaceholder: 'ABC123',
        autoCall: 'Авто-вызов чисел', speed: 'Скорость', slow: 'Медленно', normal: 'Нормально', fast: 'Быстро',
        crazyMode: 'Безумный режим', crazyModeDesc: 'Числа перемешиваются после каждого попадания!', createBtn: 'Создать комнату', joinBtn: 'Войти в игру',
        nameError: 'Имя должно быть не менее 2 символов', codeError: 'Код должен состоять из 6 символов',
        lobbyTitle: 'Зал ожидания', roomCodeLabel: 'КОД КОМНАТЫ', playersReady: 'Игроки в комнате',
        startGame: 'Начать игру', waitingForHost: 'Ожидание начала игры хостом...', hostInfo: 'Пригласите игроков, поделившись кодом',
        shareIp: 'Или скажите им перейти по адресу:', copy: 'Копировать', share: 'Поделиться', copied: 'Скопировано',
        closeRoom: 'Закрыть комнату', scanToJoin: 'СКАНИРУЙТЕ QR', leaveConfirm: 'Покинуть игру?',
        players: 'Игроки', paused: 'Игра на паузе', claimBingo: 'БИНГО!', claimFlat: 'ЛИНИЯ!',
        auto1: 'Авто 1', auto5: 'Auto 5', repair: 'Исправить', magnifier: 'Лупа', crazy: 'Crazy',
        currentNumber: 'Текущее число', callNext: 'След. число', resume: 'Продолжить', pause: 'Пауза',
        endGame: 'Закончить игру', remaining: 'чисел осталось',
        changeAvatar: 'Изменить аватар', selectAvatar: 'Выберите аватар'
    },
    uk: {
        title: 'ЛОТО', subtitle: 'Сімейний вечір ігор', createGame: 'Створити гру', joinGame: 'Приєднатися', back: 'Назад',
        playerName: 'Ваше ім\'я', playerNamePlaceholder: 'Введіть ім\'я', roomCode: 'Код кімнати', roomCodePlaceholder: 'ABC123',
        autoCall: 'Авто-виклик чисел', speed: 'Швидкість', slow: 'Повільно', normal: 'Нормально', fast: 'Швидко',
        crazyMode: 'Божевільний режим', crazyModeDesc: 'Числа перемішуються після кожного влучання!', createBtn: 'Створити кімнату', joinBtn: 'Увійти в гру',
        nameError: 'Ім\'я має бути не менше 2 символів', codeError: 'Код має складатися з 6 символів',
        lobbyTitle: 'Зал очікування', roomCodeLabel: 'КОД КІМНАТИ', playersReady: 'Гравці в кімнаті',
        startGame: 'Почати гру', waitingForHost: 'Очікування початку гри хостом...', hostInfo: 'Запросіть гравців, поділившись кодом',
        shareIp: 'Або скажіть їм перейти за адресою:', copy: 'Копіювати', share: 'Поділитися', copied: 'Скопійовано',
        closeRoom: 'Закрити кімнату', scanToJoin: 'СКАНУЙТЕ QR', leaveConfirm: 'Покинути гру?',
        players: 'Гравці', paused: 'Гра на паузі', claimBingo: 'БІНГО!', claimFlat: 'ЛІНІЯ!',
        auto1: 'Авто 1', auto5: 'Авто 5', repair: 'Виправити', magnifier: 'Лупа', crazy: 'Crazy',
        currentNumber: 'Поточне число', callNext: 'Наст. число', resume: 'Продовжити', pause: 'Пауза',
        endGame: 'Завершити гру', remaining: 'чисел залишилося',
        changeAvatar: 'Змінити аватар', selectAvatar: 'Виберіть аватар'
    }
};
