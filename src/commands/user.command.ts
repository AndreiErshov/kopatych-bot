import { ChannelType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../modules/CommandManager';
import { THEME_COLOR } from '../util/constants';

export default {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Информация о пользователе')
        .addUserOption(option => option
            .setName('user')
            .setDescription('Пользователь')
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user') ?? interaction.user;
        if (interaction.channel?.type === ChannelType.DM) {

        } else {
            const member = await interaction.guild?.members.fetch(user)
            if (!member) {
                await interaction.reply('Пользователь не найден')
                return
            }
            const embed = new EmbedBuilder()
                .setColor(user.hexAccentColor ?? THEME_COLOR)
                .setTitle(`Информация о пользователе ${user.tag}`)
                .setThumbnail(user.displayAvatarURL())
                .setFields(
                    {
                        name: 'ID',
                        value: user.id,
                        inline: true
                    },
                    {
                        name: 'Имя на сервере',
                        value: member.displayName,
                        inline: true
                    },
                    {
                        name: 'Дата создания | присоединения (по МСК)',
                        value: `${user.createdAt.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })} | ${member.joinedAt?.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`
                    }
                )
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
            const banner = user.bannerURL({ extension: 'png' })
            if (banner) {
                await interaction.followUp(`Баннер в профиле: ${banner}`)
            }
        }
    }
} satisfies SlashCommand
