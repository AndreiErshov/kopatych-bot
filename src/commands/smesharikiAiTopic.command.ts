import { TOPIC_CHANNEL_ID, TOPIC_TIMEOUT, PRIORITY_TOPIC_ROLES } from '../util/constants'
import { SlashCommandBuilder, GuildMemberRoleManager, channelMention } from 'discord.js'
import { communicator, env, isTest, smesharikiAiTopicCounter } from '..'
import { GuildSlashCommand } from '../modules/CommandManager'
import { TopicAutomodConfig } from '../util/types'
import { Logger } from '../util/logger'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { relativeTimestamp } from '../util/functions'

const logger = Logger.new('command.topic')
export const timeoutMap = new Map<string, number>()

export default {
    data: new SlashCommandBuilder()
        .setName('topic')
        .setDescription('Предложи тему для серии')

        .setNameLocalization('ru', 'тема')

        .addStringOption(so => so
            .setName('episode_topic')
            .setDescription('Topic for the episode')
            .setRequired(true)

            .setNameLocalization('ru', 'текст')
            .setDescriptionLocalization('ru', 'Тема для серии')
        ).addBooleanOption(bo => bo
            .setName('priority')
            .setDescription('Send the topic as a priority topic? (Admin only)')
            .setRequired(false)

            .setNameLocalization('ru', 'приоритет')
            .setDescriptionLocalization('ru', 'Отправить тему как приоритетную? (Только админам)')
        ),
    async execute(interaction) {
        if (!interaction.member) return

        const topicAutomod = await readTopicAutomodConfig()
        const author = interaction.member.user.username
        let topic = interaction.options.getString('episode_topic', true)
        
        // boolean checks
        const hasPriorityTopicRole = PRIORITY_TOPIC_ROLES.some(roleID => (interaction.member?.roles as GuildMemberRoleManager).cache.has(roleID))
        const forcePriority = !!interaction.options.getBoolean('priority')
        const serverIsConnected = !!communicator.clients.length

        if (hasPriorityTopicRole && forcePriority) {
            logger.info(`Auto-accepted topic as priority from ${author}, sending...`)
            if (!serverIsConnected) {
                logger.info('Not sending topic - server isnt connected to the bot')
                interaction.reply({
                    content: '❌ а я рыба я рыба я рыба | даже если приму тему, то не смогу отправить (стрим идёт? сервер не подключен к боту)',
                    ephemeral: true
                })
                smesharikiAiTopicCounter.increment('rejected')
                return
            }
            interaction.reply({
                content: '<:skafandrmod:1156994911984439466> скафандр мод, аплаояпло опагангнам стайл',
                ephemeral: true
            })
            try {
                communicator.sendTopic({
                    text: topic,
                    priority: true,
                    author,
                    source: 'discord'
                })
                smesharikiAiTopicCounter.increment('accepted')
                logger.ok(`Auto-accepted topic sent!`)
            } catch (e) {
                const err = e as Error
                logger.warn(`Unexpected error while sending priority topic.\n${err.stack ?? err.message}`)
                interaction.reply({
                    content: `❌ что-то пошло не так, ругай emberglaze (${err.message})`,
                    ephemeral: true
                })
                smesharikiAiTopicCounter.increment('rejected')
            }
            return
        }
        if (interaction.channelId !== TOPIC_CHANNEL_ID) {
            interaction.reply({
                content: `⚠️ skill issue | Эту команду можно использовать только в канале ${channelMention(TOPIC_CHANNEL_ID)}!`,
                ephemeral: true
            })
            return
        }
        if (!serverIsConnected) {
            logger.info('Not sending topic - server isnt connected to the bot')
            interaction.reply('❌ не обязан | даже если приму тему, то не смогу отправить (стрим идёт? сервер не подключен к боту)')
            smesharikiAiTopicCounter.increment('rejected')
            return
        }
        if (Date.now() - (timeoutMap.get(interaction.user.id) ?? 0) < TOPIC_TIMEOUT) {
            logger.info(`Ignoring topic "${topic}" from ${author}: User is on command cooldown.`)
            const minutes = TOPIC_TIMEOUT / 1000 / 60
            await interaction.reply({
                content: `⚠️ *свисток* | Вы уже предлагали тему в течение последних ${minutes} минут! Следующую тему можно ${relativeTimestamp(Math.floor(((timeoutMap.get(interaction.user.id) ?? 0) + TOPIC_TIMEOUT) / 1000))}`,
                ephemeral: true
            })
            return
        }
        for (const char of topicAutomod.characters) {
            const bannedCharactersPresent: string[] = []
            if (topic.includes(char)) bannedCharactersPresent.push(char)
            if (bannedCharactersPresent.length) {
                logger.info(`Ignoring topic "${topic}" from ${author}: Banned character(s) - ${bannedCharactersPresent.join(', ')}`)
                await interaction.reply(
                    `❌ не ломай | Тема не принята. В теме есть запрещённые символы - \`${bannedCharactersPresent.join(', ')}\``
                )
                smesharikiAiTopicCounter.increment('rejected')
                return
            }
        }
        if (topicAutomod.words.filter(word => topic.toLowerCase().includes(word)).length) {
            logger.info(`Ignoring topic "${topic}" from ${author}: Banned word`)
            await interaction.reply(
                `❌ ОСУЖДАЮ | Тема не принята. В теме есть запрещённые слова`
            )
            smesharikiAiTopicCounter.increment('rejected')
            return
        }
        if (topic.length > topicAutomod.length) {
            logger.info(`Ignoring topic "${topic}" from ${author}: Over ${topicAutomod.length} characters long`)
            await interaction.reply(
                `❌ tldr | Тема не принята. Слишком длинная тема (максимум ${topicAutomod.length} символов, у вас ${topic.length})`
            )
            smesharikiAiTopicCounter.increment('rejected')
            return
        }
        timeoutMap.set(interaction.user.id, Date.now())
        logger.info(`Sending topic...`)
        try {
            communicator.sendTopic({
                text: topic,
                priority: false,
                author,
                source: 'discord'
            })
            logger.ok(`Topic sent successfully`)
            await interaction.reply(
                !hasPriorityTopicRole && forcePriority
                    ? '✅ Тема принята, но не приоритетная (я же говорил что только админам)'
                    : '✅ Тема принята'
            )
            smesharikiAiTopicCounter.increment('accepted')
        } catch (e) {
            const err = e as Error
            if (err.message === 'No client is connected') {
                logger.info('Could not send topic - server isnt connected to the bot')
                interaction.reply('❌ не получилось отправить тему. возможно, не идёт стрим.')
                smesharikiAiTopicCounter.increment('rejected')
                return
            }
            logger.warn(`Unexpected error while sending topic.\n${err.stack ?? err.message}`)
            interaction.reply('❌ что-то пошло не так. ругай emberglaze')
            smesharikiAiTopicCounter.increment('rejected')
        }
    },
    guildId: isTest ? env.TEST_DISCORD_HOME_SERVER : env.DISCORD_HOME_SERVER
} satisfies GuildSlashCommand

async function readTopicAutomodConfig(path = '../../data/topic-automod-config.json') {
    return JSON.parse(await readFile(join(__dirname, path), 'utf-8')) as TopicAutomodConfig
}
