import { writeFile } from 'fs/promises'
import { readFile } from 'fs/promises'
import { join } from 'path'

export class SmesharikiAiTopicCounter {
    accepted: {
        sinceRestart: number,
        total: number
    }
    rejected: {
        sinceRestart: number,
        total: number
    }
    constructor() {
        this.accepted = {
            sinceRestart: 0,
            total: 0
        }
        this.rejected = {
            sinceRestart: 0,
            total: 0
        }
    }
    async init() {
        await this.readFromJSON()
    }
    async readFromJSON(path = join(__dirname, '../../data/counters.json')) {
        const file = await readFile(path, 'utf-8')
        const obj = JSON.parse(file) as CountersJson
        this.accepted.total = obj.smesharikiAiTopics.accepted
        this.rejected.total = obj.smesharikiAiTopics.declined
    }
    async saveToJSON(path = join(__dirname, '../../data/counters.json')) {
        const json = JSON.stringify({
            smesharikiAiTopics: {
                accepted: this.accepted.total,
                rejected: this.rejected.total
            }
        }, null, 4)
        await writeFile(path, json, 'utf-8')
    }
    increment(type: 'accepted' | 'rejected', count?: number) {
        switch (type) {
            case 'accepted':
                this.incrementAcceptedTopics(count)
                break
            case 'rejected':
                this.incrementRejectedTopics(count)
                break
        }
    }
    private incrementAcceptedTopics(count?: number) {
        this.accepted.sinceRestart += count || 1
        this.accepted.total +=  count || 1
    }
    private incrementRejectedTopics(count?: number) {
        this.rejected.sinceRestart += count || 1
        this.rejected.total +=  count || 1
    }
}
export interface CountersJson {
    smesharikiAiTopics: {
        accepted: number,
        declined: number
    }
}
