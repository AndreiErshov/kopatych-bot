import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'

const QWERTYtoЙЦУКЕНmap: { [key: string]: string } = {
    q: 'й',
    w: 'ц',
    e: 'у',
    r: 'к',
    t: 'е',
    y: 'н',
    u: 'г',
    i: 'ш',
    o: 'щ',
    p: 'з',
    '[': 'х',
    ']': 'ъ',
    a: 'ф',
    s: 'ы',
    d: 'в',
    f: 'а',
    g: 'п',
    h: 'р',
    j: 'о',
    k: 'л',
    l: 'д',
    ';': 'ж',
    "'": 'э',
    z: 'я',
    x: 'ч',
    c: 'с',
    v: 'м',
    b: 'и',
    n: 'т',
    m: 'ь',
    ',': 'б',
    '.': 'ю',
    '/': '.',
    '`': 'ё',
    '~': 'Ё',
    Q: 'Й',
    W: 'Ц',
    E: 'У',
    R: 'К',
    T: 'Е',
    Y: 'Н',
    U: 'Г',
    I: 'Ш',
    O: 'Щ',
    P: 'З',
    '{': 'Х',
    '}': 'Ъ',
    A: 'Ф',
    S: 'Ы',
    D: 'В',
    F: 'А',
    G: 'П',
    H: 'Р',
    J: 'О',
    K: 'Л',
    L: 'Д',
    ':': 'Ж',
    '"': 'Э',
    Z: 'Я',
    X: 'Ч',
    C: 'С',
    V: 'М',
    B: 'И',
    N: 'Т',
    M: 'Ь',
    '<': 'Б',
    '>': 'Ю',
    '?': ',',
    'ё': '`',
    'Ё': '~'
}

function йцукен(text: string) {
    return text
        .split('')
        .map(char => QWERTYtoЙЦУКЕНmap[char] || char)
        .join('')
}
export default {
    data: new SlashCommandBuilder()
        .setName('deqwertify')
        .setDescription('Написали по английски, но хотите по русски? QWERTY -> ЙЦУКЕН')
        .addStringOption(so => so
            .setName('text')
            .setDescription('Текст для перевода в ЙЦУКЕН (русская раскладка)')
            .setRequired(true)
            .setMaxLength(2000)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text', true)
        await interaction.reply(йцукен(text))
    }
} satisfies SlashCommand
