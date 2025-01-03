import { AttachmentBuilder, BaseInteraction, ChatInputCommandInteraction, CommandInteraction, Guild, GuildChannel, GuildMember, Message, User } from 'discord.js'
import { UserIdResolvable, ChannelIdResolvable, GuildIdResolvable } from './types'
import { Readable } from 'typeorm/platform/PlatformTools.js';

export const randRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
export const randArr = <T>(array: T[]) => array[Math.floor(Math.random() * array.length)];
export const hexStringToNumber = (hex: string) => parseInt(hex.replace('#', ''), 16);
export const getr = async (url: string) => {
    const res = await fetch(url);
    const json = await res.json();
    return json;
}
export const appendDateAndTime = (message: string) => {
    const date = new Date();
    return `<${date.toUTCString()}>\n${message}` as const;
}

export function extractUserId(userIdResolvable: UserIdResolvable) {
    let id = ''
    if (typeof userIdResolvable === 'string') id = userIdResolvable
    if (userIdResolvable instanceof Message) id = userIdResolvable.author.id
    if (userIdResolvable instanceof GuildMember
        || userIdResolvable instanceof User
    ) id = userIdResolvable.id
    return id
}
export function extractChannelId(channelIdResolvable: ChannelIdResolvable) {
    let id = ''
    if (typeof channelIdResolvable === 'string') id = channelIdResolvable
    if (channelIdResolvable instanceof GuildChannel) id = channelIdResolvable.id
    if (channelIdResolvable instanceof Message
        || channelIdResolvable instanceof CommandInteraction
        || channelIdResolvable instanceof ChatInputCommandInteraction
    ) id = channelIdResolvable.channelId
}
export function extractGuildId(guildIdResolvable: GuildIdResolvable) {
    let id: string | null = ''
    if (typeof guildIdResolvable === 'string') id = guildIdResolvable
    if (guildIdResolvable instanceof Guild) id = guildIdResolvable.id
    if (guildIdResolvable instanceof BaseInteraction
        || guildIdResolvable instanceof Message
        || guildIdResolvable instanceof GuildChannel
    ) id = guildIdResolvable.guildId
    return id
}

export function removeDuplicatesAndNulls<T>(array: T[]): T[] {
    return [...new Set(array)].filter(item => item !== undefined && item !== null);
}

export const relativeTimestamp = (seconds: number) => `<t:${seconds}:R>` as const

export function stringToAttachment(string: string, filename?: string) {
    if (!filename) filename = 'file.txt'
    let buffer = Buffer.from(string, 'utf-8')
    let stream = new Readable({ encoding: 'utf-8' })
    stream.push(buffer)
    stream.push(null)
    return new AttachmentBuilder(stream).setName(filename)
}
export function pluralize (count: number, singular: string, few: string, many: string) {
    if (count === 1) return singular;
    if (count > 1 && count < 5) return few;
    return many;
};
