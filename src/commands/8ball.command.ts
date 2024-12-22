import { SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'
import { randArr, randRange } from '../util/functions'
import { setTimeout as sleep } from 'timers/promises'

const eightball = [
    'Так держать!',
    'Ага...',
    'Ну типа',
    'Есть большая вероятность',
    'По идее да',
    'Разумеется',
    'Не вопрос',
    'Ну конечно, укуси меня пчела!',
    'Да-да',
    'Есть такое',

    'Хз чел...',
    'А ты как думаешь?',
    'Затрудняюсь ответить',
    'Всё возможно',
    'Я знаю ответ, но я хочу тебя потроллить',
    
    'Не, ну ты загнул',
    'Не рассчитывай на это',
    'Боже упаси',
    'Может в другой раз повезёт',
    'Можешь не надеяться',

    'А я в шкафу прячусь)'
];

export default {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Что же ответит шар предсказаний на твой вопрос?')
        .addStringOption(so => so
            .setName('вопрос')
            .setDescription('Вопрос, на который хочешь получить ответ')
            .setRequired(true)
        ),
    async execute(interaction) {
        const msgPrefix = `💬 ${interaction.user.username}: *${interaction.options.getString('вопрос')}*\n`;
        const msgAnswer = `🎱 Шар: **${randArr(eightball)}**`;
        const msgLoading = `🎱 *Магический шар думает...*`;

        const msg = await interaction.reply(msgPrefix + msgLoading);
        await sleep(randRange(600, 3000));
        await msg.edit(msgPrefix + msgAnswer);
    }
} satisfies SlashCommand
