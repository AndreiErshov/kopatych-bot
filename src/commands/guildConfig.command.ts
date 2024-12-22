import { ChannelType, PermissionsBitField, SlashCommandBuilder, channelMention } from 'discord.js';
import { SlashCommand } from '../modules/CommandManager';
import { database } from '..';
import { GUILD_RECORD_DEFAULT_SETTINGS } from '../util/constants';
import { Logger } from '../util/logger';
import { GuildRecordSettings } from '../util/types';
const logger = Logger.new('command.config')

// SECTION: command export
export default {
    // SECTION: command data
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Настройки бота на сервере')
        .addSubcommandGroup(scG => scG
            .setName('greetings')
            .setDescription('Настройки приветствий участников')
            .addSubcommand(sc => sc
                .setName('enable')
                .setDescription('Включить приветствия')
            ).addSubcommand(sc => sc
                .setName('disable')
                .setDescription('Отключить приветствия')
            ).addSubcommand(sc => sc
                .setName('channel')
                .setDescription('Установить канал для приветствий')
                .addChannelOption(co => co
                    .setName('channel')
                    .setDescription('Канал для приветствий')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('joinmsg')
                .setDescription('Установить сообщение приветствия')
                .addStringOption(so => so
                    .setName('message')
                    .setDescription('Сообщение приветствия')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('leavemsg')
                .setDescription('Установить сообщение прощания')
                .addStringOption(so => so
                    .setName('message')
                    .setDescription('Сообщение прощания')
                    .setRequired(true)
                )
            )
        ).addSubcommandGroup(scG => scG
            .setName('allowedchannels')
            .setDescription('Настройки доступности команд в каналах')
            .addSubcommand(sc => sc
                .setName('type')
                .setDescription('Белый или чёрный список. Белый - только указанные каналы, чёрный - все кроме указанных')
                .addStringOption(so => so
                    .setName('type')
                    .setDescription('Тип списка')
                    .addChoices(
                        {
                            name: 'Белый список',
                            value: 'whitelist'
                        },
                        {
                            name: 'Чёрный список',
                            value: 'blacklist'
                        }
                    )
                )
            ).addSubcommand(sc => sc
                .setName('addwhitelist')
                .setDescription('Добавить канал в белый список')
                .addChannelOption(co => co
                    .setName('channel')
                    .setDescription('Канал, который добавить в белый список')
                )
            ).addSubcommand(sc => sc
                .setName('addblacklist')
                .setDescription('Добавить канал в чёрный список')
                .addChannelOption(co => co
                    .setName('channel')
                    .setDescription('Канал, который добавить в чёрный список')
                )
            ).addSubcommand(sc => sc
                .setName('removewhitelist')
                .setDescription('Удалить канал из белого списка')
                .addChannelOption(co => co
                    .setName('channel')
                    .setDescription('Канал, который удалить из белого списка')
                )
            ).addSubcommand(sc => sc
                .setName('removeblacklist')
                .setDescription('Удалить канал из чёрного списка')
                .addChannelOption(co => co
                    .setName('channel')
                    .setDescription('Канал, который удалить из чёрного списка')
                )
            )
        ).addSubcommandGroup(scG => scG
            .setName('allowedroles')
            .setDescription('Настройки доступности команд для ролей')
            .addSubcommand(sc => sc
                .setName('type')
                .setDescription('Белый или чёрный список. Белый - только указанные роли, чёрный - все кроме указанных')
                .addStringOption(so => so
                    .setName('type')
                    .setDescription('Тип списка')
                    .addChoices(
                        {
                            name: 'Белый список',
                            value: 'whitelist'
                        },
                        {
                            name: 'Чёрный список',
                            value: 'blacklist'
                        }
                    )
                )
            )
        ).addSubcommandGroup(scG => scG
            .setName('user')
            .setDescription('Настройки доступности команд для пользователей')
            .addSubcommand(sc => sc
                .setName('block')
                .setDescription('Заблокировать пользователя')
                .addUserOption(uo => uo
                    .setName('user')
                    .setDescription('Пользователь')
                    .setRequired(true)
                )
            ).addSubcommand(sc => sc
                .setName('unblock')
                .setDescription('Разблокировать пользователя')
                .addUserOption(uo => uo
                    .setName('user')
                    .setDescription('Пользователь')
                    .setRequired(true)
                )
            )
        ),
    // !SECTION

    // SECTION: command code
    async execute(interaction) {
        // SECTION: initial stuff
        const subcommandGroup = interaction.options.getSubcommandGroup(),
            subcommand = interaction.options.getSubcommand()
        const res = await interaction.deferReply()
        if (!(interaction.member?.permissions as Readonly<PermissionsBitField>).has('ManageGuild')) return
        if (!interaction.guildId) return

        const guildRecord = await database.addGuild(interaction.guildId)
        if (!subcommandGroup) {
            const settings = guildRecord.settings
            let reply = ''
            for (const key of Object.keys(settings) as (keyof GuildRecordSettings)[]) {
                if (key === 'greetingsMessages') continue
                if (settings[key] !== GUILD_RECORD_DEFAULT_SETTINGS[key]) reply += `${key}: ${JSON.stringify(settings[key])}\n`
            }
            interaction.reply(reply || 'Настройки не были отредактированы.')
        }
        // !SECTION

        // SECTION: "greetings"
        if (subcommandGroup === 'greetings') {
            switch (subcommand) {
                case 'enable':
                    await database.changeSettings(interaction.guildId, { greetingsEnabled: true })
                    res.edit('✅ Приветствия включены')
                    break
                case 'disable':
                    await database.changeSettings(interaction.guildId, { greetingsEnabled: false })
                    res.edit('✅ Приветствия отключены')
                    break
                case 'channel':
                    const channel = interaction.options.getChannel('channel') ?? interaction.channel
                    if (!channel) {
                        res.edit(`❌ Неизвестный канал. Скорее всего баг в боте.`)
                        logger.warn(`"channel" is null, that shouldn't happen. Guild ${interaction.guildId}; Member ${interaction.user.id}`)
                        return
                    }
                    if (channel.type !== ChannelType.GuildText) {
                        res.edit('❌ Канал не текстовый.')
                        return
                    }
                    await database.changeSettings(interaction.guildId, { greetingsChannel: channel.id })
                    res.edit(`✅ Канал для приветствий установлен на ${channelMention(channel.id)}`)
                    break
                case 'joinmsg':
                    const message = interaction.options.getString('message', true)
                    await database.changeSettings(interaction.guildId, { greetingsMessages: { ...guildRecord.settings.greetingsMessages, join: message } })
                    res.edit('✅ Сообщение приветствия установлено')
                    break
                case 'leavemsg':
                    const leaveMessage = interaction.options.getString('message', true)
                    await database.changeSettings(interaction.guildId, { greetingsMessages: { ...guildRecord.settings.greetingsMessages, leave: leaveMessage } })
                    res.edit('✅ Сообщение прощания установлено')
                    break
                default:
                    res.edit('❌ Неизвестная подкоманда')
                    break
            }
        }
        // !SECTION

        // SECTION: "allowedchannels"
        if (subcommandGroup === 'allowedchannels') {
            switch (subcommand) {
                case 'type':
                    const type = interaction.options.getString('type', true)
                    if (type !== 'whitelist' && type !== 'blacklist') {
                        res.edit('❌ Неизвестный тип списка. Доступные типы: whitelist, blacklist')
                        return
                    }
                    await database.changeSettings(interaction.guildId, { allowedChannelsType: type })
                    res.edit(`✅ Тип списка установлен на ${type}`)
                    break
                // SECTION: add white/blacklist
                case 'addwhitelist':
                    const channel = interaction.options.getChannel('channel') || interaction.channel
                    if (!channel) {
                        res.edit('❌ Неизвестный канал')
                        return
                    }
                    if (guildRecord.settings.allowedChannelsWhitelist.includes(channel.id)) {
                        res.edit('❌ Канал уже в белом списке')
                        return
                    }
                    await database.changeSettings(interaction.guildId, {
                        allowedChannelsWhitelist: [...guildRecord.settings.allowedChannelsWhitelist, channel.id]
                    })
                    res.edit('✅ Канал добавлен в белый список')
                    break
                case 'addblacklist':
                    const channelToBlacklist = interaction.options.getChannel('channel') || interaction.channel
                    if (!channelToBlacklist) {
                        res.edit('❌ Неизвестный канал')
                        return
                    }
                    if (guildRecord.settings.allowedChannelsBlacklist.includes(channelToBlacklist.id)) {
                        res.edit('❌ Канал уже в чёрном списке')
                        return
                    }
                    await database.changeSettings(interaction.guildId, {
                        allowedChannelsBlacklist: [...guildRecord.settings.allowedChannelsBlacklist, channelToBlacklist.id]
                    })
                    res.edit('✅ Канал добавлен в чёрный список')
                    break
                // !SECTION

                // SECTION: remove white/blacklist
                case 'removewhitelist':
                    const channelToRemoveFromWhitelist = interaction.options.getChannel('channel') || interaction.channel
                    if (!channelToRemoveFromWhitelist) {
                        res.edit('❌ Неизвестный канал')
                        return
                    }
                    if (!guildRecord.settings.allowedChannelsWhitelist.includes(channelToRemoveFromWhitelist.id)) {
                        res.edit('❌ Канал не в белом списке')
                        return
                    }
                    // check if the channel is the only one in the whitelist
                    if (guildRecord.settings.allowedChannelsWhitelist.length === 1) {
                        res.edit('❌ Это единственный канал в белом списке. Либо сначала добавьте другой канал в белый список и затем удалите этот из него, либо смените режим на чёрный список.')
                        return
                    }
                    await database.changeSettings(interaction.guildId, {
                        allowedChannelsWhitelist: guildRecord.settings.allowedChannelsWhitelist.filter(id => id !== channelToRemoveFromWhitelist.id)
                    })
                    res.edit('✅ Канал удалён из белого списка')
                    break
                case 'removeblacklist':
                    const channelToRemoveFromBlacklist = interaction.options.getChannel('channel') || interaction.channel
                    if (!channelToRemoveFromBlacklist) {
                        res.edit('❌ Неизвестный канал')
                        return
                    }
                    if (!guildRecord.settings.allowedChannelsBlacklist.includes(channelToRemoveFromBlacklist.id)) {
                        res.edit('❌ Канал не в чёрном списке')
                        return
                    }
                    await database.changeSettings(interaction.guildId, {
                        allowedChannelsBlacklist: guildRecord.settings.allowedChannelsBlacklist.filter(id => id !== channelToRemoveFromBlacklist.id)
                    })
                    res.edit('✅ Канал удалён из чёрного списка')
                    break
                // !SECTION
                default:
                    res.edit('❌ Неизвестная подкоманда')
                    break
            }
        }
        // !SECTION

        // SECTION: "allowedroles"
        if (subcommandGroup === 'allowedroles') {
            switch (subcommand) {
                case 'type':
                    const type = interaction.options.getString('type', true)
                    if (type !== 'whitelist' && type !== 'blacklist') {
                        res.edit('❌ Неизвестный тип списка. Доступные типы: whitelist, blacklist')
                        return
                    }
                    await database.changeSettings(interaction.guildId, { allowedRolesType: type })
                    res.edit(`✅ Тип списка установлен на ${type}`)
                    break
                default:
                    res.edit('❌ Неизвестная подкоманда')
                    break
            }
        }
        // !SECTION

        // SECTION: "user"
        if (subcommandGroup === 'user') {
            switch (subcommand) {
                case 'block':
                    const user = interaction.options.getUser('user', true)
                    if (!user) {
                        res.edit('❌ Неизвестный пользователь')
                        return
                    }
                    if (guildRecord.settings.blockedUsers.includes(user.id)) {
                        res.edit('❌ Пользователь уже заблокирован')
                        return
                    }
                    await database.changeSettings(interaction.guildId, { blockedUsers: [...guildRecord.settings.blockedUsers, user.id] })
                    res.edit('✅ Пользователь заблокирован')
                    break
                case 'unblock':
                    const userToUnblock = interaction.options.getUser('user', true)
                    if (!userToUnblock) {
                        res.edit('❌ Неизвестный пользователь')
                        return
                    }
                    if (!guildRecord.settings.blockedUsers.includes(userToUnblock.id)) {
                        res.edit('❌ Пользователь не заблокирован')
                        return
                    }
                    await database.changeSettings(interaction.guildId, { blockedUsers: guildRecord.settings.blockedUsers.filter(id => id !== userToUnblock.id) })
                    res.edit('✅ Пользователь разблокирован')
                    break
                default:
                    res.edit('❌ Неизвестная подкоманда')
                    break
            }
        }
        // !SECTION
    }
    // !SECTION
} satisfies SlashCommand
// !SECTION
