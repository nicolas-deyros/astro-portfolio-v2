import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Read .env.local directly so this script works without shell gymnastics
const envPath = resolve(process.cwd(), '.env.local')
const envVars = {}
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)="?([^"\n]*)"?$/)
    if (m) envVars[m[1]] = m[2]
  }
} catch {}

const url = envVars.ASTRO_DB_REMOTE_URL ?? 'libsql://ndeyros-nicolas-deyros.aws-us-west-2.turso.io'
const authToken = envVars.ASTRO_DB_APP_TOKEN

if (!authToken) {
  console.error('ASTRO_DB_APP_TOKEN not found in .env.local')
  process.exit(1)
}

console.log('Connecting to', url)

const client = createClient({ url, authToken })

const tables = [
  {
    name: 'Clients',
    sql: `CREATE TABLE IF NOT EXISTS Clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL
    )`,
  },
  {
    name: 'ClientSessions',
    sql: `CREATE TABLE IF NOT EXISTS ClientSessions (
      id TEXT PRIMARY KEY,
      clientId INTEGER NOT NULL REFERENCES Clients(id),
      token TEXT NOT NULL UNIQUE,
      deviceFingerprint TEXT NOT NULL,
      userAgent TEXT NOT NULL,
      ip TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      lastActivity TEXT NOT NULL
    )`,
  },
  {
    name: 'ClientNodes',
    sql: `CREATE TABLE IF NOT EXISTS ClientNodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clientId INTEGER NOT NULL REFERENCES Clients(id),
      parentId INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      blobKey TEXT,
      mimeType TEXT,
      size INTEGER,
      pageSlug TEXT,
      createdAt TEXT NOT NULL
    )`,
  },
]

for (const { name, sql } of tables) {
  await client.execute(sql)
  console.log(`✓ ${name}`)
}
console.log('Migration complete')
