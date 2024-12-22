import { Entity, Column, PrimaryColumn } from 'typeorm';
import { GuildRecordSettings } from '../util/types';

@Entity('guilds')
export class GuildRecord {
    @PrimaryColumn({ unique: true, type: 'int', primary: true, generated: 'increment' })
    id: number;

    @Column({ type: 'text' })
    guildId: string;

    @Column({ type: 'int' })
    version: number = 1;

    @Column({ type: 'json' })
    settings: GuildRecordSettings
}
