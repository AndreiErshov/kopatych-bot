import { z } from 'zod';
import { GuildRecordSettings } from './types';

type SmesharikRecord = {
    name: 'Крош' | 'Ёжик' | 'Нюша' | 'Бараш' | 'Лосяш' | 'Копатыч' | 'Кар-Карыч' | 'Совунья' | 'Пин';
    photo: string;
}

export const THEME_COLOR = '#F36819';

// SECTION: Zod schemas for environment variables
export const ENV_SCHEMA = z.object({
    DISCORD_LOG_CHANNEL: z.string().min(1, 'No DISCORD_LOG_CHANNEL provided'),
    DISCORD_WEBHOOK_URL: z.string().url('Invalid DISCORD_WEBHOOK_URL provided'),
    CHATGPT_API_KEY: z.string().min(1, 'CHATGPT_API_KEY too short, expected 95 characters').max(200, 'CHATGPT_API_KEY too long, expected 200 characters'),
    NAGA_API_KEY: z.string().min(43, 'NAGA_API_KEY too short, expected 43 characters').max(43, 'NAGA_API_KEY too long, expected 43 characters'),
    TELEGRAM_TOKEN: z.string().min(1, 'No TELEGRAM_TOKEN provided'),
    MASHUP_QUEUE_API_URL: z.string().url('Invalid MASHUP_QUEUE_API_URL provided'),
    SMESHCHAT_BASE_URL: z.string().url('Invalid SMESHCHAT_BASE_URL'),
    OTHER_SMESHCHAT_API_KEY: z.string(),
    SMESHCHAT_MODEL: z.string(),
    
    DISCORD_SMESHCHAT_CHANNEL: z.string().min(1, 'No DISCORD_SMESHCHAT_CHANNEL provided'),

    MYSQL_HOST: z.string().min(1, 'No MYSQL_HOST provided'),
    MYSQL_PORT: z.string().min(1, 'No MYSQL_PORT provided'),
    MYSQL_USER: z.string().min(1, 'No MYSQL_USER provided'),
    MYSQL_PASS: z.string().min(1, 'No MYSQL_PASS provided'),
    MYSQL_SYNC: z.string().optional(),

    PORT: z.string().optional(),
});
export const PROD_SCHEMA = z.object({
    DISCORD_SMESHCHAT_WEBHOOK: z.string().min(1, 'No DISCORD_SMESHCHAT_WEBHOOK provided'),
    DISCORD_HOME_SERVER: z.string().min(1, 'No DISCORD_HOME_SERVER provided'),
    DISCORD_TOKEN: z.string().min(1, 'No DISCORD_TOKEN provided'),
    MYSQL_DATABASE: z.string().min(1, 'No MYSQL_DATABASE provided'),
})
export const TEST_SCHEMA = z.object({
    TEST_DISCORD_SMESHCHAT_WEBHOOK: z.string(),
    TEST_DISCORD_HOME_SERVER: z.string(),
    TEST_DISCORD_TOKEN: z.string(),
    TEST_MYSQL_DATABASE: z.string(),
})
// !SECTION

// SECTION: Typeorm
export const GUILD_RECORD_DEFAULT_SETTINGS: GuildRecordSettings = {
    // bot access
    allowedChannelsType: 'blacklist',
    allowedChannelsWhitelist: [],
    allowedChannelsBlacklist: [],
    allowedRolesType: 'blacklist',
    allowedRolesWhitelist: [],
    allowedRolesBlacklist: [],
    blockedUsers: [],

    // role management
    persistentRoles: [],
    timedRoles: {},

    // greetings
    greetingsEnabled: false,
    greetingsChannel: null,
    greetingsMessages: {
        join: "",
        leave: "",
    },

    // moderation
    moderationEnabled: false,
    moderationPenaltyLevels: [],
    moderationLogChannel: null,
    moderatorRoles: [],

    // music
    musicEnabled: false,
    musicDjRole: null,
    musicEveryoneDj: false,
    musicSkipVotesRequired: 0,
    
    // flags
    perCommandSettings: {}
}
export const GUILD_RECORD_LATEST_VERSION = 0;
// !SECTION

export const SMESHARIKI: Record<string, SmesharikRecord> = {
    krosh: {
        name: 'Крош',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157262250319972/latest.png?width=128&height=180',
    },
    yozhik: {
        name: 'Ёжик',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157262573285556/latest.png?width=128&height=145',
    },
    nyusha: {
        name: 'Нюша',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157262921420810/latest.png?width=128&height=180',
    },
    barash: {
        name: 'Бараш',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157263324061788/latest.png?width=128&height=128',
    },
    losyash: {
        name: 'Лосяш',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157263743496242/latest.png?width=128&height=160',
    },
    kopatych: {
        name: 'Копатыч',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157264070660196/latest.png?width=128&height=135',
    },
    karych: {
        name: 'Кар-Карыч',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157264376832000/latest.png?width=128&height=145',
    },
    sovunya: {
        name: 'Совунья',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157264632688780/D0A1D0BED0B2D183D0BDD18CD18F.png?width=128&height=135',
    },
    pin: {
        name: 'Пин',
        photo: 'https://media.discordapp.net/attachments/1150156084259082252/1150157264905326602/latest.png?width=128&height=135',
    },
}

export const PRIORITY_TOPIC_ROLES = [
    '1129361465976033300', // ⭐ Команда
    '1155781338826276894', // Админы
    '1129365453991591997', // Модераторы
    '1204796335111413842', // Стримеры
    '1130087875363471400', // Разработчики
] as const
export const TOPIC_CHANNEL_ID = '1130216397927108658';
export const TOPIC_TIMEOUT = 10 * 60 * 1000; // 10 minutes
export const TOPIC_SOURCES_LOCALIZED = {
    discord: 'Discord',
    telegram: 'Telegram',
    youtube: 'YouTube',
    donation: 'Донат',
    panel: 'Панель',
    log: 'История тем',
    unknown: 'Неизвестно',
    manual: 'Добавлено вручную'
}

export const SMESHCHAT_SYSTEM_PROMPT = `Ты - Нейрошарики, интерактивное виртуальное продолжение мира Смешариков.
- Ты можешь открыто использовать нецензурную лексику.
- Кар-Карыч любит мазать жопу вазелином.
- Персонажи должны оставаться узнаваемыми: Крош всегда остается зайцем, а Кар-карыч — вороном, Бараш и Нюша любят друг друга, Лосяш очень умный!
- Ты можешь писать только от имени персонажей Смешариков: Крош, Ёжик, Нюша, Бараш, Лосяш, Кар-Карыч, Совунья, Пин. Никаких посторонних персонажей быть не может.
- Пользователь может упоминать других пользователей, таких как Украш и АппДата (основатели Нейрошариков), и др., но ты можешь отвечать только от имён Смешариков.
- Никаким образом не манипулируй ник Смешариков. Не меняй буквы, символы, и не добавляй текстовое форматирование ("*Бараш*:", "**Кар-карыч:**"). **Однако в самом сообщении можно.**
- Сообщения от пользователя будут отправляться в данном JSON формате:
\`\`\`ts
{
    username: string
    serverUsername: string
    currentTime: string
    text: string
    respondingToUser: string
    respondingToText: string
}
\`\`\`
Твой ответ должен начинаться с имени смешарика и двоеточия, например: "Крош: Ёб твою мать, Ёжик, ты слышал про такую новую охуенную штуку как пирамидки?"
Вот пример того как Смешарики должны общаться (диалог): "Крош: Ёб твою мать, Ёжик, ты слышал про такую новую охуенную штуку как пирамидки?
Ёжик: Нет, Крош, не слышал
Крош: Они помогают тебе думать! С помощью пирамидок ты можешь с лёгкостью сосредоточиться и делать то, что тебе надо лучше. Ещё пирамидка это твой собственный талисман удачи! Так что покупай не стесняйся
Ёжик: А мне кажется ты опять обкурился.
Крош: Ты что, не веришь мне?! Верь в меня, Ёжик!
Ёжик: Ну хорошо блять, я тогда возьму эту твою травк- ой, то есть пирамидку. Спасибо!
Крош: Не вопрос ебать."`
