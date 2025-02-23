import { neon } from '@neondatabase/serverless'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { drizzle } from 'drizzle-orm/neon-http'
import type { Context } from 'hono'

import type { AppContext } from '../types/app-context'
import * as schema from './schemas'

export const initializeDrizzleNeonDB = (c: Context<AppContext>) => {
  let db = c.get('db')

  if (!db) {
    const client = neon(c.env.DATABASE_URL)
    db = drizzle(client, { schema })
  }

  c.set('db', db)
  return db
}

export type Database = NeonHttpDatabase<typeof schema>
