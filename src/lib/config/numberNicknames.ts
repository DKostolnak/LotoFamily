import type { Language } from '../i18n';

/**
 * Optional traditional / folk nicknames for called numbers.
 *
 * Each language maps a number 1-90 to an array of speakable variants.
 * The first variant is always the plain number ("seven", "семь"). Optional
 * extra variants are folk/traditional callouts — used when "Nicknames mode"
 * is enabled in settings to add cultural flavor (CIS Loto tradition, UK
 * Bingo calls, etc.).
 *
 * When announcing, the audio service picks one variant at random.
 *
 * For numbers without folk nicknames (most of them), the entry is omitted
 * and the speak function falls back to the plain digit string.
 */
export const NUMBER_NICKNAMES: Record<Language, Record<number, string[]>> = {
    en: {
        // Classic UK Bingo calls (top 30 most known)
        1: ['one', "kelly's eye"],
        2: ['two', 'one little duck'],
        3: ['three', 'cup of tea'],
        4: ['four', 'knock at the door'],
        5: ['five', 'man alive'],
        7: ['seven', 'lucky seven'],
        8: ['eight', 'garden gate'],
        9: ['nine', "doctor's orders"],
        10: ['ten', 'boris\'s den'],
        11: ['eleven', 'legs eleven'],
        13: ['thirteen', 'unlucky for some'],
        16: ['sixteen', 'sweet sixteen'],
        21: ['twenty-one', 'key of the door'],
        22: ['twenty-two', 'two little ducks'],
        25: ['twenty-five', 'duck and dive'],
        30: ['thirty', 'dirty Gertie'],
        33: ['thirty-three', 'all the threes'],
        40: ['forty', 'life begins'],
        44: ['forty-four', 'droopy drawers'],
        50: ['fifty', 'half-way there'],
        55: ['fifty-five', 'snakes alive'],
        57: ['fifty-seven', 'Heinz varieties'],
        59: ['fifty-nine', 'Brighton line'],
        62: ['sixty-two', 'tickety-boo'],
        66: ['sixty-six', 'clickety click'],
        69: ['sixty-nine', 'either way up'],
        77: ['seventy-seven', 'sunset strip'],
        80: ['eighty', 'gandhi\'s breakfast'],
        88: ['eighty-eight', 'two fat ladies'],
        90: ['ninety', 'top of the shop'],
    },
    sk: {
        1: ['jednotka', 'kolík'],
        5: ['päťka', 'päť pre šťastie'],
        7: ['sedmička', 'sedem statočných'],
        11: ['jedenástka', 'kosti, kosti'],
        22: ['dvadsaťdva', 'dvojičky'],
        33: ['tridsaťtri', 'kristove roky'],
        50: ['päťdesiatka', 'polovica'],
        66: ['šesťdesiatšesť', 'matkine deti'],
        77: ['sedemdesiatsedem', 'dve sekerky'],
        88: ['osemdesiatosem', 'krepačky'],
        90: ['deväťdesiatka', 'starý otec'],
    },
    ru: {
        1: ['один', 'кол'],
        7: ['семь', 'топор'],
        11: ['одиннадцать', 'барабанные палочки'],
        13: ['тринадцать', 'чёртова дюжина'],
        22: ['двадцать два', 'уточки'],
        25: ['двадцать пять', 'опять двадцать пять'],
        33: ['тридцать три', 'три богатыря'],
        45: ['сорок пять', 'баба ягодка опять'],
        50: ['пятьдесят', 'половина'],
        66: ['шестьдесят шесть', 'валенки'],
        69: ['шестьдесят девять', 'туда-сюда'],
        77: ['семьдесят семь', 'топорики'],
        88: ['восемьдесят восемь', 'крендельки'],
        89: ['восемьдесят девять', 'дед на пенсии'],
        90: ['девяносто', 'дедушка'],
    },
    uk: {
        1: ['один', 'кілок'],
        7: ['сім', 'сім богатирів'],
        11: ['одинадцять', 'палички'],
        13: ['тринадцять', 'чортова дюжина'],
        22: ['двадцять два', 'каченята'],
        33: ['тридцять три', 'тридцять три богатирі'],
        50: ["п'ятдесят", 'половина'],
        66: ['шістдесят шість', 'валянки'],
        69: ['шістдесят дев\'ять', 'туди-сюди'],
        77: ['сімдесят сім', 'сокирки'],
        88: ['вісімдесят вісім', 'кренделі'],
        90: ["дев'яносто", 'дідусь'],
    },
};

/**
 * Pick a speakable variant for the given number in the given language.
 *
 * - If `useNicknames` is false (default): always returns plain number.
 * - If `useNicknames` is true and a folk variant exists: 50% chance to
 *   return a random folk nickname, 50% chance to return the plain number.
 * - If no entry exists for the language/number combination: returns the
 *   digit string and lets TTS pronounce it.
 */
export function pickAnnounceText(
    number: number,
    language: Language,
    useNicknames: boolean
): string {
    const variants = NUMBER_NICKNAMES[language]?.[number];
    if (!variants || variants.length === 0) {
        return String(number);
    }

    if (useNicknames && variants.length > 1) {
        if (Math.random() < 0.5) {
            const idx = 1 + Math.floor(Math.random() * (variants.length - 1));
            return variants[idx] ?? variants[0];
        }
    }

    return variants[0];
}
