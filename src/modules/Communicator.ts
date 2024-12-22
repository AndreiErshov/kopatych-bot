import { Server, Socket } from 'socket.io'
import { Logger } from '../util/logger'
import { EventEmitter } from 'tseep'
import { EpisodeMashup, Topic, TopicData } from '../util/types'
const logger = Logger.new('Communicator')

export class Communicator extends EventEmitter<{
    normalTopics: (normalTopics: Topic[]) => void,
    priorityTopics: (priorityTopics: Topic[]) => void,
    mashups: (mashups: EpisodeMashup[]) => void,
    disconnected: () => void
    connected: () => void
}> {
    io: Server
    clients: (Socket | null)[] = []
    constructor(port: number | string) {
        super()
        let portNumber: number
        try {
            portNumber = Number(port)
            if (isNaN(portNumber)) {
                throw new Error('Invalid port number')
            }
        } catch (e) {
            const err = e as Error
            logger.error(`Failed to convert port to number: ${err.message}`)
            throw err
        }
        this.io = new Server(portNumber)
        this.io.on('connection', socket => {
            logger.info(`Got a new connected client: ${socket.id}`)
            this.clients.push(socket)
            this.emit('connected')

            socket.on('disconnect', () => {
                logger.info(`Client ${socket.id} disconnected`)
                this.clients.splice(this.clients.indexOf(socket), 1)
                this.emit('disconnected')
            })
            socket.on('topicsQueue', (topics: { normal: Topic[], priority: Topic[] }) => {
                this.emit('normalTopics', topics.normal)
                this.emit('priorityTopics', topics.priority)
            })
            socket.on('mashupQueue', (mashups: EpisodeMashup[]) => {
                this.emit('mashups', mashups)
            })
        })
    }
    sendTopic(data: TopicData) {
        if (!this.clients.length) return null
        logger.info(`{sendTopic} Sending topic to ${this.clients.length} client(s)...`)
        this.clients.forEach(client => {
            if (client) client.send({
                type: 'topic',
                data
            })
        })
    }
    sendMashup(youtubeURL: string, author: string, character: string | null) {
        if (!this.clients.length) return null
        logger.info(`{sendMashup} Sending mashup to ${this.clients.length} client(s)...`)
        this.clients.forEach(client => {
            if (client) client.send({
                type: 'mashup',
                data: {
                    youtubeURL,
                    author,
                    character
                }
            })
        })
    }
}
