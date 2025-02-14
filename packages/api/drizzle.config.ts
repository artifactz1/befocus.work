import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({
  path: '.dev.vars',
})

export default defineConfig({
  out: './src/db/drizzle',
  schema: './src/db/schemas.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
})
