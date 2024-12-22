import { DataSource } from 'typeorm';
import { GuildRecord } from '../entities/GuildRecord.entity';
import { Logger } from '../util/logger';
const logger = Logger.new('DatabaseManager')
import { GUILD_RECORD_DEFAULT_SETTINGS } from '../util/constants';
import { env, isTest } from '..';

export default class Database {
    datasource: DataSource
    debug: boolean
    constructor(envi: typeof env, debug = false) {
        this.datasource = new DataSource({
            type: 'mysql',
            host: envi.MYSQL_HOST,
            port: parseInt(envi.MYSQL_PORT),
            username: envi.MYSQL_USER,
            password: envi.MYSQL_PASS,
            database: isTest ? envi.TEST_MYSQL_DATABASE : envi.MYSQL_DATABASE,
            synchronize: envi.MYSQL_SYNC === 'true',
            logging: false,
            entities: [GuildRecord],
        })
        this.debug = debug
        if (this.debug) logger.ok('Debug mode on')
    }
    async init() {
        await this.datasource.initialize()
        logger.info('Connected to database')
    }

    // SECTION: Low level
    /**
     * Find a guild in the database
     * @param guildId ID of the guild
     * @returns GuildRecord if found, null if not
     */
    getGuild(guildId: string) {
        if (this.debug) logger.info(`{getGuild} Looking for guild ${guildId}`)
        const guildRecord = this.datasource.getRepository(GuildRecord).findOne({ where: { guildId } })
        if (this.debug && !guildRecord) logger.warn(`{getGuild} Guild ${guildId} not found => findOne() returned null`)
        return guildRecord
    }
    /**
     * |**Low level**| - Set guild data
     * @param guildId ID of the guild to set the data for (if the guild doesn't exist, a new record will be created)
     * @param data Data to set (partial)
     * @returns GuildRecord
     */
    async setGuild(guildId: string, data: Partial<GuildRecord>) {
        // check if the record exists
        const existingGuildRecord = await this.getGuild(guildId)
        if (existingGuildRecord) {
            // if it does - update its data
            if (this.debug) logger.info(`{setGuild} Updating data for guild ${guildId}...`)
            Object.assign(existingGuildRecord, data)
            const guildRecord = this.datasource.getRepository(GuildRecord).save(existingGuildRecord)
            if (this.debug) logger.ok(`{setGuild} Guild ${guildId} updated`)
            return guildRecord
        } else {
            // if it doesn't - create a new one
            if (this.debug) logger.info(`{setGuild} Guild ${guildId} not found, creating...`)
            const newGuild = new GuildRecord()
            newGuild.guildId = guildId
            Object.assign(newGuild, data)
            const guildRecord = this.datasource.getRepository(GuildRecord).save(newGuild)
            if (this.debug) logger.ok(`{setGuild} Guild ${guildId} created`)
            return guildRecord
        }
    }
    // !SECTION

    // SECTION: Mid level
    /**
     * |**Mid level**| - Set guild settings (unlike record data in `setGuild()`)
     * @param guildId ID of the guild
     * @param data Guild settings
     * @returns Whatever `setGuild()` returns
     */
    setSettings(guildId: string, data: GuildRecord['settings']) {
        if (this.debug) logger.info(`{setSettings} Setting settings for guild ${guildId}...`)
        return this.setGuild(guildId, { settings: data })
    }
    // !SECTION

    // SECTION: High level
    /**
     * |**High level**| - Get guild settings
     * @param guildId ID of the guild
     * @returns GuildRecordSettings if found, null if not
     */
    async getSettings(guildId: string) {
        if (this.debug) logger.info(`{getSettings} Getting settings for guild ${guildId}...`)
        const guild = await this.getGuild(guildId)
        if (guild) {
            if (this.debug) logger.ok(`{getSettings} Guild ${guildId} found, returning settings`)
            return guild.settings
        } else {
            if (this.debug) logger.warn(`{getSettings} Guild ${guildId} wasn't found, returning null`)
            return null
        }
    }
    /**
     * |**High level**| - Change guild settings
     * @param guildId ID of the guild
     * @param data New settings (partial, merged with the old ones)
     * @returns Whatever `setSettings()` returns
     */
    async changeSettings(guildId: string, data: Partial<GuildRecord['settings']>) {
        if (this.debug) logger.info(`{changeSettings} Changing settings for guild ${guildId}...`)
        const currentSettings = await this.getSettings(guildId)
        const newSettings = Object.assign({}, currentSettings, data) // merge both, because data is partial
        return this.setSettings(guildId, newSettings)
    }
    /**
     * |**High level**| - Add a guild to the database (if it doesn't exist)
     * @param guildId ID of the guild
     * @returns New guild record (or an existing one if it already exists)
     */
    async addGuild(guildId: string) {
        if (this.debug) logger.info(`{addGuild} Adding guild ${guildId}...`)
        const guild = await this.getGuild(guildId)
        if (guild) {
            if (this.debug) logger.warn(`{addGuild} Guild ${guildId} already exists`)
            return guild
        } else {
            if (this.debug) logger.info(`{addGuild} Guild ${guildId} not found, creating...`)
            return this.setGuild(guildId, { settings: GUILD_RECORD_DEFAULT_SETTINGS })
        }
    }
    /**
     * |**High level**| - Return all guilds in the database
     * @returns Array of all guild records
     */
    getGuilds() {
        if (this.debug) logger.info(`{getAllGuilds} Getting all guilds...`)
        return this.datasource.getRepository(GuildRecord).find()
    }
    // !SECTION
}
