import { SlashCommandBuilder, GuildMemberRoleManager, GuildMember } from 'discord.js'
import { GuildSlashCommand } from '../modules/CommandManager'
import { communicator, env, isTest } from '..'
import { Logger } from '../util/logger'
import { SMESHARIKI } from '../util/constants'
import { relativeTimestamp } from '../util/functions'
import { readFile } from 'fs/promises'
import { SmesharikiAiConfig } from '../util/types'
import { join } from 'path'
const logger = Logger.new('command.mashup')

const roleTimeouts: { [key: string]: number } = {
    '1129361465976033300': 0.1 * 60 * 1000, // ⭐ Команда
    '1238873581769719879': 1   * 60 * 1000, // 🗣️🔊🔥
    '1155781338826276894': 2.5 * 60 * 1000, // Админы
    '1204796335111413842': 5   * 60 * 1000, // Стримеры
    '1129365453991591997': 15  * 60 * 1000, // Модераторы
    '1130087875363471400': 30  * 60 * 1000, // Разработчики
    '1130071704002113607': 60  * 60 * 1000, // Супер-Пупер Диско Люди
}

export const timeoutMap = new Map<string, number>()

export default {
    data: new SlashCommandBuilder()
        .setName('mashup')
        .setDescription('Отправить запрос на Нейромешап (только админам)')

        .setNameLocalization('ru', 'мешап')

        .addStringOption(so => so
            .setName('url')
            .setDescription('Link to the video')
            .setRequired(true)
            .setNameLocalization('ru', 'ссылка')
            .setDescriptionLocalization('ru', 'Ссылка на видео')
        )
        .addStringOption(so => so
            .setName('character')
            .setDescription('Who will sing?')
            .setRequired(true)
            .setNameLocalization('ru', 'смешарик')
            .setDescriptionLocalization('ru', 'Кто будет петь?')
            .addChoices(
                { name: 'Крош', value: 'крош' },
                { name: 'Ёжик', value: 'ежик' },
                { name: 'Нюша', value: 'нюша' },
                { name: 'Бараш', value: 'бараш' },
                { name: 'Лосяш', value: 'лосяш' },
                { name: 'Копатыч', value: 'копатыч' },
                { name: 'Кар-Карыч', value: 'кар-карыч' },
                { name: 'Совунья', value: 'совунья' },
                { name: 'Пин', value: 'пин' },
                { name: 'Биби', value: 'биби' },
                { name: 'Диктор', value: 'диктор' },
                { name: 'Случайно выбрать', value: 'random' }
            )
        ),
    async execute(interaction) {
        const author = interaction.member!.user.username
        let url = interaction.options.getString('url', true)
        const character = interaction.options.getString('character', true) === 'random'
            ? SMESHARIKI[
                Object.keys(SMESHARIKI)[Math.floor(Math.random() * Object.keys(SMESHARIKI).length)]
            ].name.toLowerCase()
            : interaction.options.getString('character', true)
        const hasMashupRole = Object.keys(roleTimeouts).some(roleID => (interaction.member!.roles as GuildMemberRoleManager).cache.has(roleID))

        if (!hasMashupRole) {
            await interaction.reply({
                content: '❌ я тебе говорил "только админам" ❌',
                ephemeral: true
            })
            logger.info(`No permission - ${interaction.user.id} (${interaction.user.username})`)
            return
        }
        if (!communicator.clients.length) {
            await interaction.reply({
                content: '❌ сервер не работает 🗣️🔥🙏🙏🙏 (не подключён к боту)',
                ephemeral: true
            })
            logger.warn('Communicator client not available')
            return
        }
        const config = JSON.parse(await readFile(join(__dirname, '../../data/smesharikiai-config.json'), 'utf-8')) as SmesharikiAiConfig
        if (!config.acceptMashups && !((interaction.member!.roles as GuildMemberRoleManager).cache.some(role => ['1211666855664549898', '1129361465976033300', '1238873581769719879'].includes(role.id)))) {
            await interaction.reply({
                content: '❌ Отправка мешапов сейчас отключена',
                ephemeral: true
            })
            logger.info(`Mashups are disabled, ignoring - ${url}`)
            return
        }
        if (!isYoutubeVideoLink(url)) {
            await interaction.reply({
                content: '❌ ссылка не обнаружена, вводи полную ссылку ютуба (<https://www.youtube.com/watch?v=>..., <https://youtu.be/>..., и т.д.)',
                ephemeral: true
            })
            logger.info(`Invalid URL - ${url}`)
            return
        }

        const timeoutDuration = getHighestRoleTimeout(interaction.member as GuildMember)
        if (!timeoutDuration) {
            await interaction.reply({
                content: '❌ у тебя есть роль для мешапов но для неё не назначен таймаут... пингуй emberglaze крч со скриншотом',
                ephemeral: true
            })
            logger.warn(`Has permitted role but that role does not have an assigned timeout - ${interaction.user.id} (${interaction.user.username})`)
            return
        }
        const lastTimeout = timeoutMap.get(interaction.user.id) || 0
        if (Date.now() < lastTimeout) {
            await interaction.reply({
                content: `❌ нет пупсик, подожди ещё чуть чуть (${relativeTimestamp(Math.floor(lastTimeout / 1000))})`,
                ephemeral: true
            })
            return
        }
        const nextTimeout = Date.now() + timeoutDuration
        timeoutMap.set(interaction.user.id, nextTimeout)
        try {
            communicator.sendMashup(url, author, character)
            await interaction.reply({
                content: `👍 отправил на сервер. следующий мешап можно ${relativeTimestamp(Math.floor(nextTimeout / 1000))}`,
                ephemeral: true
            })
            logger.info(`Sent mashup - ${url} (Author: ${author}; Character: ${character})`)
        } catch (e) {
            const err = e as Error
            logger.warn(`Unexpected error while sending mashup.\n${err.stack ?? err.message}`)
            await interaction.followUp({
                content: `❌ что-то пошло не так, ругай emberglaze (\`${err.message}\`)`,
                ephemeral: true
            });
        }
    },
    guildId: isTest ? env.TEST_DISCORD_HOME_SERVER : env.DISCORD_HOME_SERVER
} as GuildSlashCommand

function isYoutubeVideoLink(url: string) {
    return [
        // normal watch links
        'https://www.youtube.com/watch',
        'http://www.youtube.com/watch',
        'www.youtube.com/watch?v=',
        'https://youtube.com/watch',
        'http://youtube.com/watch',
        'youtube.com/watch?v=',
        // short links
        'https://youtu.be/',
        'http://youtu.be/',
        'youtu.be/',
        // shorts
        'https://www.youtube.com/shorts/',
        'http://www.youtube.com/shorts/',
        'www.youtube.com/shorts/',
        'https://youtube.com/shorts/',
        'http://youtube.com/shorts/',
        'youtube.com/shorts/',
    ].some((u: string) => url.startsWith(u))
}

function getHighestRoleTimeout(member: GuildMember) {
    const sortedRoles = Object.keys(roleTimeouts).sort((a, b) => {
        const roleA = member.guild.roles.cache.get(a)
        const roleB = member.guild.roles.cache.get(b)
        if (!roleA || !roleB) {
            logger.warn(`{getHighestRoleTimeout} One of the roles doesn't exist in the cache. RoleA: ${roleA ? 'Exists' : 'Missing'}, RoleB: ${roleB ? 'Exists' : 'Missing'}`)
            return 0
        }
        return roleB.position - roleA.position;
    })
    for (const roleId of sortedRoles) {
        if (member.roles.cache.has(roleId)) {
            logger.info(`{getHighestRoleTimeout} Found matching role ${roleId} for member ${member.id}, returning timeout`)
            return roleTimeouts[roleId]
        } else {
            logger.warn(`{getHighestRoleTimeout} No matching role ${roleId} for member ${member.id}`)
        }
    }
    return null
}
