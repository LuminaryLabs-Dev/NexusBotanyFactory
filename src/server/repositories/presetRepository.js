import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/sqlite.js'
import { SPECIES_PRESETS } from '../../models/botany/schema/presets.js'
import { normalizeCameraParams } from '../../models/botany/validation/validation.js'

const presetRowToDocument = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    source: row.source,
    params: normalizeCameraParams(JSON.parse(row.params_json)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const nowIso = () => new Date().toISOString()

let builtinsSeeded = false

const seedBuiltInPresets = () => {
  if (builtinsSeeded) return
  const database = getDatabase()
  database.exec('PRAGMA busy_timeout = 5000;')
  const statement = database.prepare(`
    INSERT INTO presets (id, name, kind, source, params_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      kind = excluded.kind,
      params_json = excluded.params_json,
      updated_at = excluded.updated_at
  `)

  Object.entries(SPECIES_PRESETS).forEach(([name, params]) => {
    const timestamp = nowIso()
    statement.run(`builtin:${name.toLowerCase()}`, name, 'tree', 'built-in', JSON.stringify(params), timestamp, timestamp)
  })

  builtinsSeeded = true
}

export const listPresets = () => {
  seedBuiltInPresets()
  return getDatabase().prepare(`
    SELECT id, name, kind, source, params_json, created_at, updated_at
    FROM presets
    ORDER BY source ASC, name ASC
  `).all().map(presetRowToDocument)
}

export const getPresetById = (presetId) => {
  seedBuiltInPresets()
  return presetRowToDocument(getDatabase().prepare(`
  SELECT id, name, kind, source, params_json, created_at, updated_at
  FROM presets WHERE id = ?
  `).get(presetId))
}

export const getPresetByName = (presetName) => {
  seedBuiltInPresets()
  return presetRowToDocument(getDatabase().prepare(`
  SELECT id, name, kind, source, params_json, created_at, updated_at
  FROM presets WHERE lower(name) = lower(?)
  `).get(presetName))
}

export const createPreset = ({ name, kind, source = 'user', params }) => {
  seedBuiltInPresets()
  const timestamp = nowIso()
  const preset = {
    id: `preset:${randomUUID()}`,
    name,
    kind,
    source,
    params,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  getDatabase().prepare(`
    INSERT INTO presets (id, name, kind, source, params_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(preset.id, preset.name, preset.kind, preset.source, JSON.stringify(preset.params), preset.createdAt, preset.updatedAt)

  return preset
}

export const updatePreset = (presetId, { name, kind, params }) => {
  seedBuiltInPresets()
  const current = getPresetById(presetId)
  if (!current) return null
  const next = { ...current, name: name ?? current.name, kind: kind ?? current.kind, params: params ?? current.params, updatedAt: nowIso() }
  getDatabase().prepare(`
    UPDATE presets SET name = ?, kind = ?, params_json = ?, updated_at = ? WHERE id = ?
  `).run(next.name, next.kind, JSON.stringify(next.params), next.updatedAt, presetId)
  return next
}

export const deletePreset = (presetId) => {
  seedBuiltInPresets()
  return getDatabase().prepare('DELETE FROM presets WHERE id = ?').run(presetId).changes > 0
}
