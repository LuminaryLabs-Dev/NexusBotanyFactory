import { randomUUID } from 'node:crypto'
import { getDatabase } from '../db/sqlite.js'
import { normalizeCameraParams } from '../../models/botany/validation/validation.js'

const assetRowToDocument = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    presetId: row.preset_id,
    tags: JSON.parse(row.tags_json),
    params: normalizeCameraParams(JSON.parse(row.params_json)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const nowIso = () => new Date().toISOString()

export const listAssets = () => getDatabase().prepare(`
  SELECT id, name, kind, preset_id, tags_json, params_json, created_at, updated_at
  FROM assets
  ORDER BY updated_at DESC, created_at DESC
`).all().map(assetRowToDocument)

export const getAssetById = (assetId) => assetRowToDocument(getDatabase().prepare(`
  SELECT id, name, kind, preset_id, tags_json, params_json, created_at, updated_at
  FROM assets WHERE id = ?
`).get(assetId))

export const createAsset = ({ name, kind, presetId = null, tags = [], params }) => {
  const timestamp = nowIso()
  const asset = {
    id: `asset:${randomUUID()}`,
    name,
    kind,
    presetId,
    tags,
    params,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  getDatabase().prepare(`
    INSERT INTO assets (id, name, kind, preset_id, tags_json, params_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(asset.id, asset.name, asset.kind, asset.presetId, JSON.stringify(asset.tags), JSON.stringify(asset.params), asset.createdAt, asset.updatedAt)
  return asset
}

export const updateAsset = (assetId, patch) => {
  const current = getAssetById(assetId)
  if (!current) return null
  const next = { ...current, ...patch, updatedAt: nowIso() }
  getDatabase().prepare(`
    UPDATE assets SET name = ?, kind = ?, preset_id = ?, tags_json = ?, params_json = ?, updated_at = ? WHERE id = ?
  `).run(next.name, next.kind, next.presetId, JSON.stringify(next.tags), JSON.stringify(next.params), next.updatedAt, assetId)
  return next
}

export const deleteAsset = (assetId) => getDatabase().prepare('DELETE FROM assets WHERE id = ?').run(assetId).changes > 0
