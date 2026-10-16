import type { InferSelectModel } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import { isYouTubeUrl } from '../../lib/youtube'
import { user } from './auth'

// Optional: Enum-like constraint for sound types
export const soundTypes = ['alarm', 'ambient', 'bgMusic'] as const
export type SoundType = (typeof soundTypes)[number]

export const discFinishes = ['black', 'smoke', 'tinted'] as const
export type DiscFinish = (typeof discFinishes)[number]
// 'upload' is only ever set by the label upload route, after the object is stored.
export type LabelImage = 'thumbnail' | 'upload'

export const sounds = pgTable('sounds', {
  id: text('id').primaryKey(), // e.g., "rain", "jazz", "howls moving castle"
  name: text('name').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  isCustom: boolean('is_custom').notNull().default(true),
  soundType: text('sound_type').$type<SoundType>().notNull(), // "alarm" | "ambient" | "bgMusic"
  labelColor: text('label_color'), // #rrggbb, null follows the accent
  labelImage: text('label_image').$type<LabelImage>(), // wins over labelColor
  discFinish: text('disc_finish').$type<DiscFinish>().notNull().default('black'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// Inferred Type
export type Sounds = InferSelectModel<typeof sounds>

export const soundTypeEnum = z.enum(['alarm', 'ambient', 'bgMusic']) // or whatever values you're allowing

const labelColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i)
  .nullable()
const labelImage = z.enum(['thumbnail']).nullable()
const discFinish = z.enum(discFinishes)

export const insertSoundSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().trim().min(1).max(80),
  url: z.string().url().refine(isYouTubeUrl, 'Only YouTube links are supported'),
  soundType: soundTypeEnum,
  isCustom: z.boolean(),
  labelColor: labelColor.optional(),
  labelImage: labelImage.optional(),
  discFinish: discFinish.optional(),
})

export const updateSoundSchema = z.object({
  id: z.string().min(1).max(64), // ID to look up
  name: z.string().trim().min(1).max(80).optional(),
  url: z.string().url().refine(isYouTubeUrl, 'Only YouTube links are supported').optional(),
  soundType: soundTypeEnum.optional(),
  isCustom: z.boolean().optional(),
  labelColor: labelColor.optional(),
  labelImage: labelImage.optional(),
  discFinish: discFinish.optional(),
})

export const getSoundSchema = createSelectSchema(sounds, {
  createdAt: z.string().nullable(),
  labelImage: z.enum(['thumbnail', 'upload']).nullable(),
  discFinish: discFinish,
})
