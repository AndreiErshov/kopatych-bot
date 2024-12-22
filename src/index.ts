import { Logger } from './util/logger'
const logger = Logger.new()
process.on('uncaughtException', err => {
    logger.warn(`uncaughtException event! Full error stack:\n${err.stack}`)
})
if (!process.env.CAN_THE_CODE_READ_THIS) {
    // @ts-expect-error TS1378
    const dotenv = await import('dotenv')
    dotenv.config()
}
import { ENV_SCHEMA, PROD_SCHEMA, TEST_SCHEMA } from './util/constants'
// setup env object
export const parsedEnv = ENV_SCHEMA.safeParse(process.env)
export const parsedProd = PROD_SCHEMA.safeParse(process.env)
export const parsedTest = TEST_SCHEMA.safeParse(process.env)
if (!parsedEnv.success) throw new Error(`ENV_SCHEMA validation failed: ${parsedEnv.error.message}`)
if (!parsedProd.success) throw new Error(`PROD_SCHEMA validation failed: ${parsedProd.error.message}`)
if (!parsedTest.success) throw new Error(`TEST_SCHEMA validation failed: ${parsedTest.error.message}`)
export const env = Object.assign({}, parsedEnv.data, parsedTest.data, parsedProd.data)

import { Client, Partials, IntentsBitField } from 'discord.js'
import path from 'path'
import { readdirSync } from 'fs'

import CommandHandler from './modules/CommandManager'
import { SmeshChat } from './modules/Smeshchat'
import { Communicator } from './modules/Communicator'
import { removeDuplicatesAndNulls } from './util/functions'
import DatabaseManager from './modules/DatabaseManager'
import { SmesharikiAiTopicCounter } from './modules/SmesharikiAiTopicCounter'
import { DiscordEventListener } from './util/types'
import { QueueDisplay } from './modules/QueueDisplay'

export const isTest = process.argv.includes('--test')
if (isTest) logger.warn('Running in test mode')

// discord bot client
const bot = new Client({
    intents: new IntentsBitField([
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]),
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User
    ],
    allowedMentions: {
        parse: ['users']
    }
})

// communication with smeshariki-ai-server and smeshchat
export const communicator = new Communicator(env.PORT || 12095)
export const smeshchat = new SmeshChat(bot)
export const database = new DatabaseManager(env)
export const commandHandler = new CommandHandler(bot)
export const smesharikiAiTopicCounter = new SmesharikiAiTopicCounter()
export const queueDisplay = new QueueDisplay(bot, communicator)

bot.once('ready', async () => {
    await commandHandler.init()
    await commandHandler.refreshGlobalCommands()
    removeDuplicatesAndNulls(
        commandHandler.guildCommands.map(command => command.guildId)
    ).forEach(async guildId => await setGuildCommands(guildId, commandHandler))
    await database.init()
    logger.ok('Connected to MySQL database')

    logger.info('Initializing smeshchat...')
    await smeshchat.init()
    logger.ok('Smeshchat initialized')
    await smesharikiAiTopicCounter.init()
    logger.ok('SmesharikiAiTopicCounter initialized')
    await queueDisplay.init()
    bot.guilds.cache.forEach(guild => checkAndAdd(guild.id))
    const eventFiles = readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.ts'))
    for (const file of eventFiles) {
        const event = await import(path.join(__dirname, `events/${file}`)) as DiscordEventListener
        event.default(bot)
    }
    logger.ok(`Bot logged in as ${bot.user!.tag}, укуси меня пчела!`)
})

bot.on('guildCreate', async guild => {
    await database.addGuild(guild.id)
    logger.ok(`Bot joined guild ${guild.id} (${guild.name}), added record to database`)
})

try {
    // @ts-expect-error TS1378
    await bot.login(isTest ? env.TEST_DISCORD_TOKEN : env.DISCORD_TOKEN)
} catch (e) {
    const err = e as Error
    logger.error(`Failed to login: ${err.message}`)
}


async function setGuildCommands(guildId: string, commandHandler: CommandHandler) {
    const guild = await bot.guilds.fetch(guildId)
    const guildCommands = commandHandler.guildCommands.filter(command => command.guildId === guildId)
    await guild.commands.set(guildCommands.map(command => command.data)).catch(e => {
        const err: Error = e
        logger.warn(
            `Could not set guild commands for guild ${guildId} (${guild.name})
${JSON.stringify(guildCommands)}
${err.stack ?? err.message}`
        )
    })
}

async function checkAndAdd(guildId: string) {
    try {
        const guild = await database.getGuild(guildId)
        if (!guild) {
            await database.addGuild(guildId)
            logger.ok(`{checkAndAdd} Guild ${guildId} not found in database, added record`)
        }
    } catch (e) {
        const err = e as Error
        logger.error(`{checkAndAdd} Failed to check or add guild ${guildId}: ${err.message}`)
    }
}
