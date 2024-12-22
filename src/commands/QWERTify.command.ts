import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'

const ЙЦУКЕНtoQWERTYmap: { [key: string]: string } = {
    й: 'q',
    ц: 'w',
    у: 'e',
    к: 'r',
    е: 't',
    н: 'y',
    г: 'u',
    ш: 'i',
    щ: 'o',
    з: 'p',
    х: '[',
    ъ: ']',
    ф: 'a',
    ы: 's',
    в: 'd',
    а: 'f',
    п: 'g',
    р: 'h',
    о: 'j',
    л: 'k',
    д: 'l',
    ж: ';',
    э: "'",
    я: 'z',
    ч: 'x',
    с: 'c',
    м: 'v',
    и: 'b',
    т: 'n',
    ь: 'm',
    б: ',',
    ю: '.',
    '.': '/',
    ё: '`',
    Ё: '~',
    Й: 'Q',
    Ц: 'W',
    У: 'E',
    К: 'R',
    Е: 'T',
    Н: 'Y',
    Г: 'U',
    Ш: 'I',
    Щ: 'O',
    З: 'P',
    Х: '{',
    Ъ: '}',
    Ф: 'A',
    Ы: 'S',
    В: 'D',
    А: 'F',
    П: 'G',
    Р: 'H',
    О: 'J',
    Л: 'K',
    Д: 'L',
    Ж: ':',
    Э: '"',
    Я: 'Z',
    Ч: 'X',
    С: 'C',
    М: 'V',
    И: 'B',
    Т: 'N',
    Ь: 'M',
    Б: '<',
    Ю: '>',
    ',': '?',
}

function qwerty(text: string) {
    return text
        .split('')
        .map(char => ЙЦУКЕНtoQWERTYmap[char] || char)
        .join('')
}
export default {
    data: new SlashCommandBuilder()
        .setName('qwertify')
        .setDescription('Написали по русски, но хотите по английски? ЙЦУКЕН -> QWERTY')
        .addStringOption(so => so
            .setName('text')
            .setDescription('Текст для перевода в QWERTY')
            .setRequired(true)
            .setMaxLength(2000)
        ),
    async execute(interaction) {
        const text = interaction.options.getString('text', true)
        await interaction.reply(qwerty(text))
    }
} satisfies SlashCommand
