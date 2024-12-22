import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { hexStringToNumber } from '../util/functions';
import { SMESHARIKI } from '../util/constants';
import { SlashCommand } from '../modules/CommandManager';
import { random } from '../util/random';

export default {
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Набор случайных значений на любой случай жизни')
        .addStringOption(option => option
            .setName('type')
            .setDescription('Выберите тип случайного значения')
            .addChoices(
                { name: 'Цвет (HEX)', value: 'color' },
                { name: 'Смешарик', value: 'smesharik' },
                { name: '32-битное число', value: 'int32' },
                { name: 'Слово', value: 'word' },
                { name: 'Подброс монетки', value: 'coinflip' },
                { name: 'Бросок кубика', value: 'diceroll' },
                { name: 'Оценка (от 2- до 5+)', value: 'grade' },
                { name: 'IP-адрес', value: 'ip' }
            )
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const type = interaction.options.getString('type');
        switch (type) {
            case 'coinflip': {
                const coinflip = random.coinflip();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('🪙 Подброс монетки')
                    .setDescription(coinflip)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'diceroll': {
                const diceRoll = random.diceRoll();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('🎲 Бросок кубика')
                    .setDescription(`${diceRoll}`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'grade': {
                const grade = random.grade();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('📝 Оценка')
                    .setDescription(grade)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'int32': {
                const int32 = random.int32();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('🔢 32-битное число')
                    .setDescription(int32.toString())
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'color': {
                const color = random.color();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(color))
                    .setTitle('🎨 Цвет')
                    .setDescription(color)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'smesharik': {
                const smesharik = random.smesharik();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('👻 Смешарик')
                    .setDescription(SMESHARIKI[smesharik].name)
                    .setImage(SMESHARIKI[smesharik].photo)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'word': {
                const word = random.word('ru');
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('📖 Слово')
                    .setDescription(`${word}`)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'ip': {
                const ip = random.ip();
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(random.color()))
                    .setTitle('🌐 Случайный IP-адрес')
                    .setDescription(ip)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
            default: {
                const color = random.color(),
                    smesharik = random.smesharik()

                // make embed with all random values
                const embed = new EmbedBuilder()
                    .setColor(hexStringToNumber(color))
                    .setTitle('Вот тебе парочка случайных значений')
                    .addFields([
                        {
                            name: '🪙 Подброс монеты:',
                            value: random.coinflip(),
                            inline: true
                        },
                        {
                            name: '🎲 Бросок кубика:',
                            value: `${random.diceRoll()}`,
                            inline: true
                        },
                        {
                            name: '📝 Оценка:',
                            value: random.grade(),
                            inline: true
                        },
                        {
                            name: '🔢 Число (32-битное):',
                            value: `${random.int32()}`,
                            inline: true
                        },
                        {
                            name: '📖 Слово:',
                            value: `${random.word('ru')}`,
                            inline: true
                        },
                        {
                            name: '🎨 Цвет:',
                            value: color,
                            inline: true
                        },
                        {
                            name: '🌐 IP-адрес:',
                            value: random.ip(),
                            inline: true
                        },
                        {
                            name: '👻 Смешарик:',
                            value: SMESHARIKI[smesharik].name,
                            inline: true
                        }
                    ])
                    .setImage(SMESHARIKI[smesharik].photo)
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
                break;
            }
        }
    }
} satisfies SlashCommand
