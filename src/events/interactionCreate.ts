import { Client, GuildMemberRoleManager } from 'discord.js'
import { commandHandler, database } from '..'
import { Logger } from '../util/logger'
const logger = Logger.new('event.interactionCreate')

export default function onInteractionCreate(client: Client) {
    client.on('interactionCreate', async interaction => {
        const { member, channelId, guildId, user } = interaction;
        if (!interaction.isChatInputCommand()) return
        if (guildId) {
            const {
                settings: {
                    allowedChannelsBlacklist,
                    allowedChannelsType,
                    allowedChannelsWhitelist,
                    allowedRolesBlacklist,
                    allowedRolesType,
                    allowedRolesWhitelist,
                    blockedUsers
                }
            } = await database.addGuild(guildId)

            const channelAllowed =
                (allowedChannelsType === 'whitelist' && allowedChannelsWhitelist.includes(channelId!)) ||
                (allowedChannelsType === 'blacklist' && !allowedChannelsBlacklist.includes(channelId!));
            if (!channelAllowed) {
                const content =
                    allowedChannelsType === 'whitelist'
                        ? '❌ На данном сервере включён режим белого списка каналов. Этот канал не находится в белом списке. Здесь нельзя использовать команды бота.'
                        : '❌ На данном сервере включён режим черного списка каналов. Этот канал находится в чёрном списке. Здесь нельзя использовать команды бота.';
                await interaction.reply({ content, ephemeral: true });
                return;
            }

            const roleAllowed =
                (allowedRolesType === 'whitelist' &&
                    (member?.roles as GuildMemberRoleManager).cache.some(role => allowedRolesWhitelist.includes(role.id))) ||
                (allowedRolesType === 'blacklist' &&
                    (member?.roles as GuildMemberRoleManager).cache.some(role => !allowedRolesBlacklist.includes(role.id)));
            if (!roleAllowed) {
                const content =
                    allowedRolesType === 'whitelist'
                        ? '❌ На данном сервере включён режим белого списка ролей. У вас нет роли, которая находится в белом списке. Вам нельзя использовать команды бота.'
                        : '❌ На данном сервере включён режим черного списка ролей. У вас есть роль, которая находится в чёрном списке. Вам нельзя использовать команды бота.';
                await interaction.reply({ content, ephemeral: true });
                return;
            }

            if (blockedUsers.includes(user.id)) {
                await interaction.reply({ content: '❌ Ваш доступ к командам бота на данном сервере заблокирован.', ephemeral: true });
                return;
            }
        }
        commandHandler.handleInteraction(interaction).catch(err => {
            logger.warn(`Error while handling interaction: ${err.message}
${err.stack}`);
        });
    })
}
