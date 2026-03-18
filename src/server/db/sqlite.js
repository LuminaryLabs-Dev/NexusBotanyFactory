import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(dirname, '../../../.data')
const databasePath = path.join(dataDir, 'botany-factory.sqlite')

fs.mkdirSync(dataDir, { recursive: true })

let databaseInstance

const initDatabase = () => {
  const database = new DatabaseSync(databasePath)
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      source TEXT NOT NULL,
      params_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      preset_id TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      params_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (preset_id) REFERENCES presets(id) ON DELETE SET NULL
    );
  `)

  return database
}

export const getDatabase = () => {
  if (!databaseInstance) {
    databaseInstance = initDatabase()
  }
  return databaseInstance
}

export const getDatabasePath = () => databasePath
