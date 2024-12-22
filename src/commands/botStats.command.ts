import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'
import { SlashCommand } from '../modules/CommandManager'
import { THEME_COLOR } from '../util/constants'
import { smesharikiAiTopicCounter } from '..'
import os from 'os'

export default {
    data: new SlashCommandBuilder()
        .setName('botstats')
        .setDescription('Показать разную информацию про бота'),
    async execute(interaction) {
        const uptime = process.uptime()
        const uptimeHours = Math.floor(uptime / 3600)
        const uptimeMinutes = Math.floor((uptime % 3600) / 60)
        const uptimeSeconds = Math.floor(uptime % 60)

        const embed = new EmbedBuilder()
            .setColor(THEME_COLOR)
            .setTitle('Bot Statistics')
            .addFields([
                {
                    name: 'Кол-во серверов',
                    value: `${interaction.client.guilds.cache.size}`,
                    inline: true
                },
                {
                    name: 'Время с запуска',
                    value: `${uptimeHours}ч ${uptimeMinutes}м ${uptimeSeconds}с`,
                    inline: true
                },
                {
                    name: 'Использование ОЗУ',
                    value: `Heap: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB, Stack: ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
                    inline: true
                },
                {
                    name: 'Использование процессора',
                    value: `${os.loadavg()[0].toFixed(2)}%`,
                    inline: true
                },
                {
                    name: 'Принятых и отклонённых (+ ошибки) тем Нейрошариков',
                    value: (
                        `⏱️ С последнего включения: ✅ ${smesharikiAiTopicCounter.accepted.sinceRestart} | ❌ ${smesharikiAiTopicCounter.rejected.sinceRestart}\n` +
                        `🌌 Насчитано всего: ✅ ${smesharikiAiTopicCounter.accepted.total} | ❌ ${smesharikiAiTopicCounter.rejected.total}`
                    ),
                    inline: false
                }
            ]).setTimestamp()

        await interaction.reply({ embeds: [embed] })
    }
} satisfies SlashCommand
