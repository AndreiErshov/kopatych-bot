import { EmbedBuilder, Role, SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'
import { Logger } from '../util/logger'
const logger = Logger.new('command.roleinfo')

export default {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Всякая всячина про роль')
        .addRoleOption(ro => ro
            .setName('role')
            .setDescription('Роль')
            .setRequired(true)
        ),
    async execute(interaction) {
        const res = await interaction.deferReply()
        try {
            await interaction.guild?.members.fetch()
            const role = interaction.options.getRole('role', true)
            if (!(role instanceof Role)) return
            const embed = new EmbedBuilder()
                .setTitle(`Роль ${role.name}`)
                .setColor(role.hexColor)
                .addFields([
                    {
                        name: 'ID',
                        value: role.id,
                        inline: true
                    },
                    {
                        name: 'Цвет (hex)',
                        value: role.hexColor,
                        inline: true
                    },
                    {
                        name: 'Позиция (больше = выше)',
                        value: `${role.position}`,
                        inline: true
                    },
                    {
                        name: 'Упоминаемая',
                        value: role.mentionable ? '✅ Да' : '❌ Нет',
                        inline: true
                    },
                    {
                        name: 'Управляется ботом',
                        value: role.managed ? '✅ Да' : '❌ Нет',
                        inline: true
                    },
                    {
                        name: 'Участников с ролью',
                        value: `${role.members.size}`,
                        inline: true
                    }
                ])
            await res.edit({ embeds: [embed] })
        } catch (e) {
            const err = e as Error
            logger.warn(`{CommandRole} Error while executing command: ${err.message}\n${err.stack}`)
            await res.edit(`❌ Произошла ошибка: ${err.message}`)
        }
    }
} satisfies SlashCommand
