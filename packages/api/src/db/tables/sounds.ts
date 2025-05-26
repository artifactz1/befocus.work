import type { InferSelectModel } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import { user } from './auth'

// Optional: Enum-like constraint for sound types
export const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
export type SoundType = (typeof soundTypes)[number]

export const sounds = pgTable('sounds', {
  id: text('id').primaryKey(), // e.g., "rain", "jazz", "howls moving castle"
  name: text('name').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isCustom: boolean('is_custom').notNull().default(true),
  soundType: text('sound_type').$type<SoundType>().notNull(), // "alarm" | "ambient" | "bgMusic"
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Inferred Type
export type Sounds = InferSelectModel<typeof sounds>

export const soundTypeEnum = z.enum(['alarm', 'ambient', 'bgMusic']) // or whatever values you're allowing

export const insertSoundSchema = z.object({
  id: z.string(),
  name: z.string().min(1), // ✅ NEW FIELD
  url: z.string().url(),
  soundType: soundTypeEnum,
  isCustom: z.boolean(),
})

export const updateSoundSchema = z.object({
  id: z.string(), // ID to look up
  name: z.string().min(1).optional(), // ✅ Allow changing the name
  url: z.string().url().optional(),
  soundType: soundTypeEnum.optional(),
  isCustom: z.boolean().optional(),
})

export const getSoundSchema = createSelectSchema(sounds, {
  createdAt: z.string().nullable(),
})