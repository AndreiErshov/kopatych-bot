import { EmbedBuilder, SlashCommandBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'
import { THEME_COLOR } from '../util/constants'

export default {
    data: new SlashCommandBuilder()
        .setName('guildicon')
        .setDescription('Показать иконку сервера'),
    async execute(interaction) {
        if (!interaction.guild) {
            await interaction.reply('❌ Команда может быть использована только в сервере.')
            return
        }
        const iconUrl = interaction.guild.iconURL()
        if (!iconUrl) {
            await interaction.reply('❌ Иконка не найдена (для нердов: `interaction.guild.iconURL() === null`)')
            return
        }
        const embed = new EmbedBuilder()
            .setTitle(`Иконка сервера "${interaction.guild.name}"`)
            .setImage(iconUrl)
            .setColor(THEME_COLOR);
        await interaction.reply({ embeds: [embed] });
    }
} satisfies SlashCommand
