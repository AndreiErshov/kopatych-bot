import { SlashCommandBuilder } from 'discord.js'
import { GuildSlashCommand } from '../modules/CommandManager'
import { env, isTest } from '..'
import { Mashup } from '../util/types'
import { $ } from 'bun'
import { Logger } from '../util/logger'
const logger = Logger.new('command.mashup_position')

export default {
    data: new SlashCommandBuilder()
        .setName('mashup_position')
        .setDescription('Дает посмотреть место, на котором находится мешап в очереди (только во время стримов)')
        .addStringOption(so => so
            .setName('link')
            .setDescription('Ютуб ссылка на мешап')
            .setRequired(true)
        ),
    async execute(interaction) {
        const res = await interaction.deferReply({ ephemeral: true })

        const link: string = interaction.options.getString('link', true)
        const requestTimeout = (ms: number) => {
            const controller = new AbortController()
            setTimeout(() => controller.abort(), ms)
            return controller.signal
        }
        const data = await fetch(env.MASHUP_QUEUE_API_URL, {
            method: 'GET',
            signal: requestTimeout(10000)
        }).catch(async err => {
            logger.warn('Could not fetch the mashup queue')
            console.log(err)
            await res.edit('😵 Не получилось получить очередь мешапов от сервера')
            return null
        })
        if (!data) return

        const queue = await data.json().catch(async err => {
            logger.warn('Could not parse JSON from mashup queue response')
            console.log(data)
            console.log(err)
            await res.edit('😭 Не получилось обработать JSON с очередью мешапов')
            return null
        }) as { [id: string]: Mashup } | null
        if (!queue) return

        const videoId = await extractVideoId(link)
        if (!videoId) {
            await res.edit('❌ Не получилось обработать ссылку, проверьте её правильность')
            return
        }
        const index = Object.values(queue).findIndex(mashup => mashup.videoId === videoId)
        if (index === -1) {
            await res.edit('❌ Мешап с такой ссылкой в очереди не найден')
            return
        }
        const position = index + 1
        await res.edit(`✅ Позиция мешапа в очереди: ${position}`)
        return
    },
    guildId: isTest ? env.TEST_DISCORD_HOME_SERVER : env.DISCORD_HOME_SERVER
} satisfies GuildSlashCommand

async function extractVideoId(url: string) {
    url = encodeURI(url)
	const output = await $`yt-dlp --get-id ${url}`.quiet().nothrow()
    const stdout = output.stdout.toString('utf-8').trim()
    const stderr = output.stderr.toString('utf-8').trim()
    if (stderr.includes('Video unavailable')) return null
    if (stdout.length !== 11) {
        logger.warn(`yt-dlp stdout is longer than 11, returning null`)
        console.log(stdout)
        return null
    }
    return stdout
}
