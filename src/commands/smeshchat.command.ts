import { GuildMemberRoleManager, SlashCommandBuilder } from 'discord.js';
import { GuildSlashCommand } from '../modules/CommandManager';
import { env, isTest, smeshchat } from '..';

export default {
    data: new SlashCommandBuilder()
        .setName('smeshchat')
        .setDescription('Манипуляция Смешчата')
        .addSubcommand(sc => sc
            .setName('stats')
            .setDescription('Получить статистику Смешчата')
        ).addSubcommand(sc => sc
            .setName('clearhistory')
            .setDescription('Очистить память ChatGPT')
        ).addSubcommand(sc => sc
            .setName('ban')
            .setDescription('Забанить пользователя')
            .addUserOption(uo => uo
                .setName('user')
                .setDescription('Пользователь, которого забанить')
                .setRequired(false)    
            ).addStringOption(so => so
                .setName('userid')
                .setDescription('Бан, используя ID пользователя')
                .setRequired(false)
            )
        ).addSubcommand(sc => sc
            .setName('unban')
            .setDescription('Разбанить пользователя')
            .addUserOption(uo => uo
                .setName('user')
                .setDescription('Пользователь, которого разбанить')
                .setRequired(false)    
            ).addStringOption(so => so
                .setName('userid')
                .setDescription('Разбан, используя ID пользователя')
                .setRequired(false)
            )
        ).addSubcommand(sc => sc
            .setName('on')
            .setDescription('Включить Смешчат')
        ).addSubcommand(sc => sc
            .setName('off')
            .setDescription('Выключить Смешчат')
        ),
    guildId: isTest ? env.TEST_DISCORD_HOME_SERVER : env.DISCORD_HOME_SERVER,
    async execute(interaction) {
        if (!interaction.member) return
        if (!(interaction.member.roles as GuildMemberRoleManager).cache.find(role => role.id === '1129365453991591997')) {
            await interaction.reply({
                content: '❌ нет прав (только модеры)',
                ephemeral: true
            })
            return
        }
        const subcommand = interaction.options.getSubcommand(true)
        if (subcommand === 'stats') {
            const stats = smeshchat.getStatistics()
            await interaction.reply({
                embeds: [{
                    color: 138731,
                    title: 'Статистика смешчата',
                    fields: [
                        {
                            name: 'Статус',
                            value: !!smeshchat.enabled ? '✅ Включен' : '❌ Выключен'
                        },
                        {
                            name: 'Заблокированные пользователи',
                            value: stats.bannedUsers.toString(),
                            inline: true
                        },
                        {
                            name: 'Длина истории сообщений',
                            value: stats.messageHistoryLength.toString(),
                            inline: true
                        },
                        {
                            name: 'Сумма длин содержимого',
                            value: stats.sumOfContentLengths.toString(),
                            inline: true
                        }
                    ]
                }]
            })
        }
        if (subcommand === 'clearhistory') {
            smeshchat.reset()
            await interaction.reply('🗑️ История сброшена')
        }
        if (subcommand === 'ban') {
            const user = interaction.options.getUser('user', false)
            const userId = interaction.options.getString('userId', false)
            const banId = user ? user.id : userId
            if (!banId) {
                interaction.reply('❌ Не был указан ни пользователь, ни ID пользователя.')
                return
            }
            smeshchat.ban(banId)
            interaction.reply('забанил нуба')
        }
        if (subcommand === 'unban') {
            const user = interaction.options.getUser('user', false)
            const userId = interaction.options.getString('userId', false)
            const unbanId = user ? user.id : userId
            if (!unbanId) {
                interaction.reply('❌ Не был указан ни пользователь, ни ID пользователя.')
                return
            }
            smeshchat.unban(unbanId)
            await interaction.reply('AVISO IMPORTANTE 🗿📢📢📢📢')
        }
        if (subcommand === 'on') {
            smeshchat.enabled = true
            await interaction.reply('✅ смешчат включен, укуси меня пчела')
        }
        if (subcommand === 'off') {
            smeshchat.enabled = false
            await interaction.reply('⚠️ смешчат вЫключен, так сказать')
        }
    }
} satisfies GuildSlashCommand
