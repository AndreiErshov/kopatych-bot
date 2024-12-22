import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'

function reverseString(str: string) {
    return str.split('').reverse().join('')
}
function reverseWords(str: string) {
    return str.split(' ').reverse().join(' ')
}
export default {
    data: new SlashCommandBuilder()
        .setName('reverse')
        .setDescription('Развернуть буквы или слова в тексте')
        .addStringOption(so => so
            .setName('mode')
            .setDescription('Буквы или слова? ("привет" -> "тевирп" или "привет, как дела?" -> "дела? как привет,")')
            .setRequired(true)
            .setChoices(
                {
                    name: 'Буквы',
                    value: 'letters'
                },
                {
                    name: 'Слова',
                    value: 'words'
                }
            )
        ).addStringOption(so => so
            .setName('text')
            .setDescription('Текст для разворота')
            .setRequired(true)
        ),
    async execute(interaction) {
        const mode = interaction.options.getString('mode', true),
            text = interaction.options.getString('text', true)
        if (mode === 'letters') {
            await interaction.reply(reverseString(text))
        } else if (mode === 'words') {
            await interaction.reply(reverseWords(text))
        } else {
            await interaction.reply('❌ втф, баг в коде? (`mode is neither letters nor words`)')
        }
    }
} satisfies SlashCommand
