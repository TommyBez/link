import { defineConfig } from 'drizzle-kit'
import 'dotenv'

if (!process.env.NEON_DATABASE_URL) {
  throw new Error('NEON_DATABASE_URL is not set')
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.NEON_DATABASE_URL,
  },
})
