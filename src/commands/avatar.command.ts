import { EmbedBuilder, ImageExtension, ImageSize, SlashCommandBuilder } from 'discord.js';
import { SlashCommand } from '../modules/CommandManager';
import { THEME_COLOR } from '../util/constants';

export default {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Получите фотографию профиля пользователя, отправившего команду, или из опции пользователя')
        .addUserOption(uo => uo
            .setName('user')
            .setDescription('Пользователь, кого аватар показать. Если оставить пустым - покажется ваш аватар')
            .setRequired(false)
        ).addBooleanOption(bo => bo
            .setName('raw')
            .setDescription('Прислать как простое текстовое сообщение?')
            .setRequired(false)
        ).addStringOption(so => so
            .setName('extension')
            .setDescription('Формат аватара (GIF если аватар анимированный) (Стандартный выбор - PNG)')
            .setChoices(
                { name: 'GIF', value: 'gif' },
                { name: 'WEBP', value: 'webp' },
                { name: 'PNG', value: 'png' },
                { name: 'JPEG', value: 'jpg' }
            ).setRequired(false)
        ).addNumberOption(no => no
            .setName('size')
            .setDescription('Размер аватара (Стандартный выбор - 1024)')
            .setChoices(
                { name: '16', value: 16 },
                { name: '32', value: 32 },
                { name: '64', value: 64 },
                { name: '128', value: 128 },
                { name: '256', value: 256 },
                { name: '512', value: 512 },
                { name: '1024', value: 1024 },
                { name: '2048', value: 2048 },
                { name: '4096', value: 4096 }
            ).setRequired(false)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('user', false) ?? interaction.user;
        const raw = interaction.options.getBoolean('raw', false) ?? false;
        const ext = interaction.options.getString('extension', false) as ImageExtension ?? 'png'
        const size = interaction.options.getNumber('size', false) as ImageSize ?? 1024
        const avatarUrl = user.displayAvatarURL({ size: size, extension: ext });

        if (raw) {
            await interaction.reply(avatarUrl);
            return;
        }
        const embed = new EmbedBuilder()
            .setTitle(`Аватар ${user.username}`)
            .setImage(avatarUrl)
            .setColor(THEME_COLOR);
        await interaction.reply({ embeds: [embed] });
    }
} satisfies SlashCommand
