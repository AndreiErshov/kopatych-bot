import { Client, Message, TextChannel } from 'discord.js'
import { Communicator } from './Communicator'
import { EpisodeMashup, Topic } from '../util/types'
import { pluralize, relativeTimestamp } from '../util/functions'
import { TOPIC_SOURCES_LOCALIZED } from '../util/constants'
import { Logger } from '../util/logger'
const logger = Logger.new('QueueDisplay')

// for displaying the topic and mashup queues in discord channels
export class QueueDisplay {
    client: Client
    communicator: Communicator
    readonly channelIDs = {
        normal: '1292106069648085012',
        priority: '1292106093916328048' // also mashups
    }

    private areQueuesEqual(arr1: Topic[], arr2: Topic[]): boolean {
        if (arr1.length !== arr2.length) return false
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].author !== arr2[i].author || arr1[i].source !== arr2[i].source) {
                return false
            }
        }
        return true
    }
    private areMashupQueuesEqual(arr1: EpisodeMashup[], arr2: EpisodeMashup[]): boolean {
        if (arr1.length !== arr2.length) return false
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i].topic!.author !== arr2[i].topic!.author) {
                return false
            }
        }
        return true
    }
    channels: {
        normal: TextChannel,
        priority: TextChannel
    }
    private queueMessages: {
        normal: Message | null,
        priority: Message | null,
        mashups: Message | null
    }
    // copies of topic and mashup queues to check against for changes, to prevent edit spam
    private queues: {
        normal: Topic[],
        priority: Topic[],
        mashup: EpisodeMashup[]
    }
    private topicTimestamps: number[]
    constructor(client: Client, communicator: Communicator) {
        this.client = client
        this.communicator = communicator
        this.queueMessages = {
            normal: null,
            priority: null,
            mashups: null
        }
        this.queues = {
            normal: [],
            priority: [],
            mashup: []
        }
        this.topicTimestamps = []
    }
    async init() {
        this.channels = {
            normal: await this.client.channels.fetch(this.channelIDs.normal) as TextChannel,
            priority: await this.client.channels.fetch(this.channelIDs.priority) as TextChannel
        }
        await this.channels.normal.bulkDelete(99)
        await this.channels.priority.bulkDelete(99)
        this.communicator.on('normalTopics', topics => {
            logger.info(`Received ${topics.length} normal topics`)
            this.displayNormalTopics(topics)
        })
        this.communicator.on('priorityTopics', topics => {
            logger.info(`Received ${topics.length} priority topics`)
            this.displayPriorityTopics(topics)
        })
        this.communicator.on('mashups', mashups => {
            logger.info(`Received ${mashups.length} mashups`)
            this.displayMashups(mashups)
        })
    }

    async displayNormalTopics(topics: Topic[]) {
        const isQueueEqual = this.areQueuesEqual(topics, this.queues.normal)
        if (isQueueEqual) return
        this.queues.normal = topics

        this.topicTimestamps.push(Date.now())
        if (this.topicTimestamps.length > 5) this.topicTimestamps.shift()

        const maxIndexDigits = topics.length.toString().length
        const message = topics.map((topic, index) =>  `${String(index + 1).padStart(maxIndexDigits, ' ')}. **${topic.author} (${TOPIC_SOURCES_LOCALIZED[topic.source]})**\n-# ${topic.text}`).join('\n');

        let averageTimeMessage = ''
        if (this.topicTimestamps.length > 1) {
            const intervals = this.topicTimestamps.slice(1).map((timestamp, index) => timestamp - this.topicTimestamps[index])
            const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
            const averageSeconds = Math.round(averageInterval / 1000)
            const averageMinutes = Math.floor(averageSeconds / 60)
            const remainingSeconds = averageSeconds % 60
            const lastTopicsCount = this.topicTimestamps.length
            const topicsWord = pluralize(lastTopicsCount, 'тема', 'темы', 'тем')
            averageTimeMessage = `\nСреднее время для одной **обычной** темы (последние ${lastTopicsCount} ${topicsWord}): `
            const secondsWord = pluralize(remainingSeconds, 'секунда', 'секунды', 'секунд')
            if (averageMinutes > 0) {
                const minutesWord = pluralize(averageMinutes, 'минута', 'минуты', 'минут')
                averageTimeMessage += `${averageMinutes} ${minutesWord} ${remainingSeconds} ${secondsWord}`
            } else {
                averageTimeMessage += `${averageSeconds} ${secondsWord}`
            }
        }

        this.queueMessages.normal = !this.queueMessages.normal 
            ? await this.channels.normal.send(`**Обычные темы:**\n${message}${averageTimeMessage}`) 
            : await this.queueMessages.normal.edit(`**Обычные темы:**\n${message}${averageTimeMessage}\nПоследнее обновление: ${relativeTimestamp(Math.floor(Date.now() / 1000))}`)
    }
    // todo: merge priority and mashup displays
    async displayPriorityTopics(topics: Topic[]) {
        if (this.areQueuesEqual(topics, this.queues.priority)) return
        this.queues.priority = topics
        const message = topics.map(topic => `❗**${topic.author} (${TOPIC_SOURCES_LOCALIZED[topic.source]})**`).join('\n')
        if (!this.queueMessages.priority) this.queueMessages.priority = await this.channels.priority.send(`**Приоритетные темы:**\n${message}`)
        else await this.queueMessages.priority.edit(`**Приоритетные темы:**\n${message}\nПоследнее обновление: ${relativeTimestamp(Math.floor(Date.now() / 1000))}`)
    }
    async displayMashups(mashups: EpisodeMashup[]) {
        if (this.areMashupQueuesEqual(mashups, this.queues.mashup)) return
        this.queues.mashup = mashups
        const message = mashups.map(mashup => `🎞️**${mashup.topic!.author}**`).join('\n')
        if (!this.queueMessages.mashups) this.queueMessages.mashups = await this.channels.priority.send(`**Мешапы:**\n${message}`)
        else await this.queueMessages.mashups.edit(`**Мешапы:**\n${message}\nПоследнее обновление: ${relativeTimestamp(Math.floor(Date.now() / 1000))}`)
    }
}
