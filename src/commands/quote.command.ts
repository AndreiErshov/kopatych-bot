import { SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../modules/CommandManager';
import { randArr } from '../util/functions';

const phrases = [
    'Укуси меня пчела!',
    'Навалил базы',
    'Пошел нахуй',
    'Так говорят усе поработители!',
    'Вальсы, твисты, ламбады... Мода меняется. Но моё сердце бьётся только в ритме диско!',
    'Как вы мне все... Дороги!',
    'Мир – эт выхухоль.',
    'Укуси меня springlock...',
    'В следующий раз за мной заезжать не надо. Я, чесслово, лучше сам приду.',
    'Бобслей – дело принципа!'
];

export default {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Случайная цитата Копатыча'),
    async execute(interaction) {
        const randomPhrase = randArr(phrases)
        await interaction.reply(randomPhrase)
    }
} satisfies SlashCommand
