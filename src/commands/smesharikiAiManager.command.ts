import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, GuildMemberRoleManager, SlashCommandBuilder, TextChannel, userMention } from 'discord.js'
import { GuildSlashCommand } from '../modules/CommandManager'
import { SmesharikiAiConfig } from '../util/types'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { writeFile } from 'fs/promises'

import { timeoutMap as topicTimeouts } from './smesharikiAiTopic.command'
import { timeoutMap as mashupTimeouts } from './smesharikiAiMashup.command'

import { relativeTimestamp } from '../util/functions'
import { env, isTest } from '..'

export default {
    data: new SlashCommandBuilder()
        .setName('smesharikiai')
        .setDescription('Для управления Нейрошариками через Копатыча')
        .addSubcommandGroup(scg => scg
            .setName('topicmod')
            .setDescription('Конфигурация правил допуска тем для эпизодов')

            .addSubcommand(sc => sc
                .setName('view')
                .setDescription('Посмотреть текущую конфигурацию')
            ).addSubcommand(sc => sc
                .setName('banword')
                .setDescription('Добавить слово в список забаненных')
                .addStringOption(so => so
                    .setName('word')
                    .setDescription('Само слово, либо набор символов')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('unbanword')
                .setDescription('Убрать слово из списка забаненных')
                .addStringOption(so => so
                    .setName('word')
                    .setDescription('Само слово, либо набор символов')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('setmaxlength')
                .setDescription('Поставить максимальную длину темы')
                .addNumberOption(no => no
                    .setName('max_length')
                    .setDescription('Новая максимальная длина тем')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('banchar')
                .setDescription('Забанить отпределённый символ')
                .addStringOption(so => so
                    .setName('char')
                    .setDescription('Один символ')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(2)
                )
            ).addSubcommand(sc => sc
                .setName('unbanchar')
                .setDescription('Разбанить определённый символ')
                .addStringOption(so => so
                    .setName('char')
                    .setDescription('Один символ')
                    .setRequired(true)
                    .setMinLength(1)
                    .setMaxLength(2)
                )
            ).addSubcommand(sc => sc
                .setName('reset')
                .setDescription('Вернуть всё как было')
            )
        ).addSubcommand(sc => sc
            .setName('topictimeouts')
            .setDescription('Посмотреть на все таймауты предложения тем')
        ).addSubcommand(sc => sc
            .setName('mashuptimeouts')
            .setDescription('Посмотреть на все таймауты отправки мешапов')
        ).addSubcommand(sc => sc
            .setName('togglemashups')
            .setDescription('Включить/выключить отправку мешапов')
        ),
    async execute(interaction) {
        if (!(interaction.member!.roles as GuildMemberRoleManager).cache.find(role => role.id === '1129361465976033300')) {
            await interaction.reply({
                content: '❌ только ⭐ Команда может это сделать',
                ephemeral: true
            })
            return
        }

        let config = (
            JSON.parse(
                await readFile(join(__dirname, '../../data/smesharikiai-config.json'), 'utf-8')
            ) as SmesharikiAiConfig
        )
        const subcommandGroup = interaction.options.getSubcommandGroup(false)
        const subcommand = interaction.options.getSubcommand(true)
        if (subcommandGroup && subcommandGroup === 'topicmod') {
            let word: string, char: string

            switch (subcommand) {
                case 'view':
                    await interaction.reply({
                        content: (
                            '**Текущий конфиг**:\n' +
                            `- Забаненные символы: [${config.topicmod.characters.join(' ')}];\n` +
                            `- Максимальная длина темы: ${config.topicmod.length};\n` +
                            `- Забаненные слова: ["${config.topicmod.words.join('", "')}"];`
                        ),
                        ephemeral: true
                    })
                    return
                case 'banword':
                    word = interaction.options.getString('word', true)
                    config.topicmod.words.push(word)
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Слово **"${word}"** было забанено`,
                        ephemeral: true
                    })
                    return
                case 'unbanword':
                    word = interaction.options.getString('word', true)
                    config.topicmod.words.filter(w => w !== word)
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Слово **"${word}"** было разбанено`,
                        ephemeral: true
                    })
                    return
                case 'setmaxlength':
                    const length = interaction.options.getNumber('max_length', true)
                    config.topicmod.length = length
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Максимальная длина темы теперь **${length}** символов`,
                        ephemeral: true
                    })
                    return
                case 'banchar':
                    char = interaction.options.getString('char', true)
                    config.topicmod.characters.push(char)
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Символ **"${char}"** был забанен`,
                        ephemeral: true
                    })
                    return
                case 'unbanchar':
                    char = interaction.options.getString('char', true)
                    config.topicmod.characters.filter(c => c !== char)
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Символ **"${char}"** был разбанен`,
                        ephemeral: true
                    })
                    return
                case 'reset':
                    config.topicmod.characters = config.topicmod.default.characters
                    config.topicmod.length = config.topicmod.default.length
                    config.topicmod.words = config.topicmod.default.words
                    await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                    await interaction.reply({
                        content: `✅ Конфигурация была восстановлена`,
                        ephemeral: true
                    })
                    return
            }
        } else {
            let str = ''
            switch (subcommand) {
                case 'topictimeouts':
                    str = '**Все текущие таймауты /topic**:'
                    for (const timeout of topicTimeouts) {
                        const [id, unixTimestamp] = timeout
                        const date = new Date(unixTimestamp)
                        if (date < new Date()) continue
                        str += `\n${userMention(id)} - ${relativeTimestamp(unixTimestamp)};`
                    }
                    await interaction.reply({
                        content: str,
                        ephemeral: true
                    })
                case 'mashuptimeouts':
                    str = '**Все текущие таймауты /mashup**:'
                    for (const timeout of mashupTimeouts) {
                        const [id, unixTimestamp] = timeout
                        const date = new Date(unixTimestamp)
                        if (date < new Date()) continue
                        str += `\n${userMention(id)} - ${relativeTimestamp(unixTimestamp)};`
                    }
                    await interaction.reply({
                        content: str,
                        ephemeral: true
                    })
                case 'togglemashups':
                    const row = new ActionRowBuilder<ButtonBuilder>()
                    const offButton = new ButtonBuilder()
                        .setLabel('Выключить')
                        .setEmoji('❌')
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId('mashupoff')
                        .setDisabled(config.acceptMashups === false)
                    const onButton = new ButtonBuilder()
                        .setLabel('Включить')
                        .setEmoji('✅')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('mashupon')
                        .setDisabled(config.acceptMashups === true)

                    if (config.acceptMashups) {
                        row.addComponents(offButton)
                    } else {
                        row.addComponents(onButton)
                    }

                    await interaction.reply({
                        content: `Мешапы сейчас ${config.acceptMashups ? '✅ включены' : '❌ выключены'}, ${config.acceptMashups ? 'выключить' : 'включить'}?`,
                        components: [row],
                        ephemeral: true
                    })
                    const channel = await interaction.channel!.fetch() as TextChannel
                    const collector = channel.createMessageComponentCollector({
                        componentType: ComponentType.Button,
                        time: 60000
                    })
                    collector.on('collect', async i => {
                        if (i.user.id !== interaction.user.id) {
                            await i.reply({ content: 'Эта команда не для вас!', ephemeral: true })
                            return
                        }
                        config.acceptMashups = i.customId === 'mashupon'
                        await writeFile(join(__dirname, '../../data/smesharikiai-config.json'), JSON.stringify(config))
                        await i.update({
                            content: `Мешапы были ${config.acceptMashups ? '✅ включены' : '❌ выключены'}.`,
                            components: []
                        })
                        collector.stop()
                    })
                    collector.on('end', async collected => {
                        if (collected.size === 0) {
                            await interaction.editReply({
                                components: [row.setComponents(offButton.setDisabled(true), onButton.setDisabled(true))]
                            });
                        }
                    })
            }
        }
    },
    guildId: isTest ? env.TEST_DISCORD_HOME_SERVER : env.DISCORD_HOME_SERVER
} satisfies GuildSlashCommand
