import type { InferSelectModel } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { user } from './auth'
import { z } from 'zod'

// Optional: Enum-like constraint for sound types
export const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
export type SoundType = (typeof soundTypes)[number]

export const sounds = pgTable('sounds', {
  id: text('id').primaryKey(), // e.g., "rain", "jazz", "howls moving castle"
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isCustom: boolean('is_custom').notNull().default(true),
  soundType: text('sound_type')
    .$type<SoundType>()
    .notNull(), // "alarm" | "ambient" | "bgMusic"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),

})

export const soundPreferences = pgTable('soundPreferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id),
  alarmId: text('alarm_id').notNull(),
  ambientId: text('ambient_id').notNull(),
  bgMusicId: text('bg_music_id').notNull(),
})




// Inferred Type
export type Sounds = InferSelectModel<typeof sounds>
export type SoundPreferences = InferSelectModel<typeof soundPreferences>

// Zod Schemas
export const insertSoundSchema = createInsertSchema(sounds)
export const updateSoundSchema = createUpdateSchema(sounds)
export const getSoundSchema = createSelectSchema(sounds, {
  createdAt: z.string().nullable(), // or z.string().datetime().nullable()
})

export const insertSoundPreferencesSchema = createInsertSchema(soundPreferences)
export const updateSoundPreferencesSchema = createUpdateSchema(soundPreferences)
export const getSoundPreferencesSchema = createSelectSchema(soundPreferences)


