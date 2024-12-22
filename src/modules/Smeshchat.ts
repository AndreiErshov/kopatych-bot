import {
    ChannelType, Client, Message,
    TextChannel, userMention, WebhookClient
} from 'discord.js'
import OpenAI from 'openai'

import { extractUserId, stringToAttachment } from '../util/functions'
import { SMESHCHAT_SYSTEM_PROMPT } from '../util/constants'
import { SmeshchatJSONMessage, UserIdResolvable } from '../util/types'
import { Logger } from '../util/logger'
const logger = Logger.new('Smeshchat')

import { env, isTest } from '..'
import path from 'path'
import fs from 'fs'

export class SmeshChat {
    useAlternativeAPI = true
    discord: Client
    channel: TextChannel | null = null
    bannedUsers = new Set<string>()
    enabled = true
    debug: boolean
    initialized = false
    openai: OpenAI
    history: { role: 'system' | 'assistant' | 'user', content: string }[] = [{
        role: 'system',
        content: SMESHCHAT_SYSTEM_PROMPT
    }]
    
    smeshariki = [
        'крош', 'ежик', 'нюша', 'бараш', 'совунья',
        'копатыч', 'пин', 'лосяш', 'кар-карыч'
    ] as const
    avatarLinks: [RegExp, string][] = [
        [/^(\*\*)?крош(\*\*)?$/i, avatarURL('1140747406833614910')],
        [/^(\*\*)?[её]жик(\*\*)?$/i, avatarURL('1140747407110451290')],
        [/^(\*\*)?нюша(\*\*)?$/i, avatarURL('1140747407378874500')],
        [/^(\*\*)?бараш(\*\*)?$/i, avatarURL('1140747407685070848')],
        [/^(\*\*)?совунья(\*\*)?$/i, avatarURL('1140747408825909469')],
        [/^(\*\*)?копатыч(\*\*)?$/i, avatarURL('1140747408276467743')],
        [/^(\*\*)?пин(\*\*)?$/i, avatarURL('1140747409178243192')],
        [/^(\*\*)?лосяш(\*\*)?$/i, avatarURL('1140747407982854316')],
        [/^(\*\*)?(кар-карыч|кар карыч|карыч)(\*\*)?$/i, avatarURL('1140747408540704911')]
    ]
    webhook = new WebhookClient({
        url: isTest ? env.TEST_DISCORD_SMESHCHAT_WEBHOOK : env.DISCORD_SMESHCHAT_WEBHOOK
    })
    
    constructor(client: Client, debug = false) {
        this.discord = client
        this.debug = debug
    }
    async init() {
        let apiKey = ''
        switch (env.SMESHCHAT_BASE_URL) {
            case 'https://api.naga.ac/v1':
                apiKey = env.NAGA_API_KEY
                break
            case 'https://api.openai.com/v1':
                apiKey = env.CHATGPT_API_KEY
                break
            default:
                apiKey = env.OTHER_SMESHCHAT_API_KEY
                break
        }
        this.openai = new OpenAI({
            baseURL: env.SMESHCHAT_BASE_URL,
            apiKey: apiKey
        })

        const filePath = path.join(__dirname, '../../data/smeshchat-history.json')
        if (this.debug) logger.info(`{init} Reading chat history from ${filePath}`)
        const content = fs.readFileSync(filePath, 'utf-8')
        const json = JSON.parse(content)
        if (json.length) {
            this.history = json
            if (this.debug) logger.ok(`{init} Got and added ${json.length} messages from history file`)
        } else {
            this.history = [{
                role: 'system',
                content: SMESHCHAT_SYSTEM_PROMPT
            }]
            if (this.debug) logger.ok('{init} Chat history file is empty, set system message prompt')
        }

        if (this.debug) logger.info('{init} Fetching smeshchat channel')
        const smeshchatChannel = await this.discord.channels.fetch(env.DISCORD_SMESHCHAT_CHANNEL).catch(e => {
            const err: Error = e
            logger.error(`Couldn't fetch Smeshchat channel. Double check that the bot has access to it and that the ID is correct. ID: ${env.DISCORD_SMESHCHAT_CHANNEL}\n${err.stack ?? err.message}`)
            process.exit(1)
        })
        if (!smeshchatChannel || smeshchatChannel.type !== ChannelType.GuildText) {
            logger.error('Smeshchat channel either not found or is not GuildText.')
            process.exit(1)
        }
        this.channel = smeshchatChannel
        this.discord.on('messageCreate', async message => {
            if (!this.enabled) return
            if (message.channelId === this.channel?.id && !message.author.bot) {
                if (this.debug) logger.ok(`{onMessageCreate} Got message from ${message.author.username}`)
                if (this.bannedUsers.has(message.author.id)) {
                    message.react('❌')
                    return
                }
                const reaction = await message.react('🕰️')
                let res = await this.chat(message)
                if (res!.content!.includes('Error: 403 flagged moderation category')) {
                    if (this.debug) logger.info(`{onMessageCreate} Got 403 moderation error, clearing history`)
                    res!.content += '\n🗑️ История очищена из-за того что модерация naga.ac душнила а я ничего с этим не могу поделать'
                    await this.sendResponse(message, res!, null)
                    this.reset()
                    return
                }
                await this.saveHistory()
                if (!res!.content) res!.content = '<Без ответа>'
                const smesharik = this.grabSmesharikName(res!.content)
                await this.sendResponse(message, res!, smesharik)
                reaction.remove()
            }
        })
        if (this.debug) logger.ok('{init} Listening for messages')
        this.initialized = true
    }
    
    async getResponse(message: Message) {
        if (!message.reference) return null
        const reference = await message.fetchReference()
        return {
            author: reference.author.username,
            content: reference.content
        }
    }
    async chat(message: Message): Promise<OpenAI.ChatCompletionMessage> {
        if (!this.initialized) throw new ClassNotInitializedError()
        const reduceChatHistory = () => {
            let totalLength = this.history.reduce((acc, cur) => acc + (cur.content?.length ?? 0), 0)
            while (totalLength >= MAX_CHAT_HISTORY_LENGTH && this.history.length > 1) {
                totalLength -= this.history[1].content?.length ?? 0
                shiftAtIndexOne(this.history)
            }
        }
        let MAX_CHAT_HISTORY_LENGTH = 16384
        if (env.SMESHCHAT_MODEL.includes('gpt-4o-mini')) MAX_CHAT_HISTORY_LENGTH = 128000
        try {
            const response = await this.getResponse(message)
            const json: SmeshchatJSONMessage = {
                username: message.author.username,
                serverUsername: message.member!.nickname,
                currentTime: new Date().toLocaleString('ru'),
                text: message.content,
                respondingToUser: response?.author ?? null,
                respondingToText: response?.content ?? null
            }
            this.history.push({ role: 'user', content: JSON.stringify(json) })
            reduceChatHistory()
            if (this.debug) logger.info('{chat} Waiting for ChatGPT response...')
            const res = await this.openai.chat.completions.create({
                messages: this.history,
                model: env.SMESHCHAT_MODEL
            }).catch(e => {
                const err: Error = e
                return { error: err }
            })
            let output;
            if (this.debug) logger.ok('{chat} Got ChatGPT response')
            // handle chatgpt error
            if (hasError(res)) {
                logger.warn('{chat} ChatGPT error!')
                logger.warn(res.error.stack ?? res.error.message)
                output = {
                    role: 'assistant' as const,
                    content: res.error.message,
                    refusal: null
                }
                return output
            }
            // handle chatgpt's explicit refusal like "im sorry, i cant help with that request"
            if (res.choices[0].message.refusal) {
                logger.warn('{chat} ChatGPT refusal!')
                logger.warn(res.choices[0].message.refusal)
                output = {
                    role: 'assistant' as const,
                    content: res.choices[0].message.refusal,
                    refusal: res.choices[0].message.refusal
                }
                return output
            }
            output = {
                role: res.choices[0].message.role,
                content: res.choices[0].message.content ?? ''
            }
            this.history.push(output)
            reduceChatHistory()
            return res.choices[0].message
        } catch (e) {
            const err = e as Error
            logger.error(`{chat} Error: ${err.message}`)
            throw err
        }
    }
    async sendResponse(discordMessage: Message, message: OpenAI.ChatCompletionMessage, smesharik: typeof this.smeshariki[number] | null) {
        // too long, send in file
        if (message.content!.length > 2000) {
            if (this.debug) logger.info(`[Discord] Response too long (${message.content!.length}), sending in a file`)
            let file = stringToAttachment(message.content!)
            if (!smesharik) await discordMessage.reply({
                content: userMention(discordMessage.author.id),
                files: [file]
            })
            else await this.webhook.send({
                content: userMention(discordMessage.author.id),
                username: smesharik,
                avatarURL: smesharik ? this.avatarLinks.find(link => link[0].test(smesharik))?.[1] : undefined,
                files: [file]
            })
            return
        }
        // short enough, send normally
        let response = userMention(discordMessage.author.id)
        if (!smesharik) {
            await discordMessage.reply(message.content!)
            return
        }
        response += message.content!.substring(smesharik.length + 1)
        await this.webhook.send({
            content: response,
            username: smesharik,
            avatarURL: smesharik ? this.avatarLinks.find(link => link[0].test(smesharik))?.[1] : undefined
        })
        
    }
    
    ban(userIdResolvable: UserIdResolvable) {
        const id = extractUserId(userIdResolvable)
        this.bannedUsers.add(id)
        if (this.debug) logger.ok(`{ban} User ${id} has been banned`)
        this.writeBannedUsersToFile()
    }
    unban(userIdResolvable: UserIdResolvable) {
        const id = extractUserId(userIdResolvable)
        this.bannedUsers.delete(id)
        if (this.debug) logger.ok(`{unban} User ${id} has been unbanned`)   
        this.writeBannedUsersToFile()
    }
    async writeBannedUsersToFile() {
        const bannedUsersArray = Array.from(this.bannedUsers)
        const bannedUsersJSON = JSON.stringify(bannedUsersArray)
        const filePath = path.join(__dirname, '../../data/smeshchat/bannedUsers.json')
        try {
            await fs.promises.writeFile(filePath, bannedUsersJSON)
            if (this.debug) logger.ok('{writeBannedUsersToFile} Write successful')
        } catch (error) {
            logger.error(`{writeBannedUsersToFile} Failed to write: ${error}`)
        }
    }
    
    grabSmesharikName(text: string) {
        const lowercaseText = text.toLowerCase().replace('ё', 'е')
        for (const smesharik of this.smeshariki) if (lowercaseText.startsWith(smesharik)) return smesharik
        return null
    }
    getStatistics() {
        const sumOfContentLengths = this.history.reduce((sum, message) => sum + (message.content?.length || 0), 0);
        return {
            bannedUsers: this.bannedUsers.size,
            messageHistoryLength: this.history.length,
            sumOfContentLengths
        }
    }
    async saveHistory() {
        const historyJSON = JSON.stringify(this.history)
        const filePath = path.join(__dirname, '../../data/smeshchat-history.json')
        fs.promises.writeFile(filePath, historyJSON)
        if (this.debug) logger.ok('{saveHistory} Chat history saved to file')
    }
    reset() {
        this.history = [{
            role: 'system',
            content: SMESHCHAT_SYSTEM_PROMPT
        }]
        if (this.debug) logger.ok('{reset} Reset chat')
    }
}
function shiftAtIndexOne<T>(arr: T[]) {
    if (arr.length < 2) return undefined
    const shifted = arr[1]
    for (let i = 1; i < arr.length; i++) arr[i] = arr[i + 1]
    arr.length--
    return shifted
}
const avatarURL = (attachmentId: string) => `https://cdn.discordapp.com/attachments/1130251946863890483/${attachmentId}/image.png`
const hasError = (obj: any): obj is { error: Error } => obj.error !== undefined

class ClassNotInitializedError extends Error {
    message = 'Smeshchat has not been initialized! Call init() first'
}
