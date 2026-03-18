import { applyKindDefaults, createInitialParams, extractCamera, mergeParams, normalizeAssetKind, normalizePresetName, normalizeTags, validateLevelPatch, validateParams } from '../../models/botany/validation/validation.js'
import { generateSpecimen } from '../../models/botany/services/specimenGenerationService.js'
import { createAsset, deleteAsset, getAssetById, listAssets, updateAsset } from '../repositories/assetRepository.js'
import { getPresetByName } from '../repositories/presetRepository.js'
import { error, json } from './responses.js'
import { readJsonBody } from './request-parsing.js'
import { assetSummary, serializeTreeData } from './serializers.js'

const ensureAsset = (assetId) => getAssetById(assetId)

const withHandlerErrorBoundary = (handler) => async (...args) => {
  try {
    return await handler(...args)
  } catch (err) {
    if (err?.statusCode) return error(err.statusCode, 'bad_request', err.message)
    return error(500, 'internal_error', err instanceof Error ? err.message : 'Unknown server error.')
  }
}

export const listAssetsHandler = withHandlerErrorBoundary(async () => json({ items: listAssets().map(assetSummary) }))

export const createAssetHandler = withHandlerErrorBoundary(async (request) => {
  const body = await readJsonBody(request)
  const normalizedKind = normalizeAssetKind(body.kind)
  const normalizedPresetName = normalizePresetName(body.presetName)
  const params = createInitialParams({ presetName: normalizedPresetName, kind: normalizedKind, paramsPatch: body.params })
  const validation = validateParams(params)
  if (!validation.valid) {
    return error(422, 'invalid_asset', 'Asset creation failed validation.', validation.errors)
  }

  const preset = getPresetByName(normalizedPresetName)
  return json(createAsset({
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : `${normalizedPresetName} ${normalizedKind}`,
    kind: normalizedKind,
    presetId: preset?.id ?? null,
    tags: normalizeTags(body.tags),
    params,
  }), 201)
})

export const getAssetHandler = withHandlerErrorBoundary(async (_request, { params }) => {
  const asset = ensureAsset(decodeURIComponent(params.assetId))
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${params.assetId}.`)
  return json(asset)
})

export const patchAssetHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const current = ensureAsset(assetId)
  if (!current) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  const body = await readJsonBody(request)
  const nextParams = body.params ? mergeParams(current.params, body.params) : current.params
  const nextKind = normalizeAssetKind(body.kind ?? current.kind)
  const adjustedParams = nextKind === current.kind ? nextParams : applyKindDefaults(nextParams, nextKind)
  const validation = validateParams(adjustedParams)
  if (!validation.valid) return error(422, 'invalid_asset', 'Asset update failed validation.', validation.errors)
  return json(updateAsset(assetId, {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : current.name,
    kind: nextKind,
    tags: body.tags ? normalizeTags(body.tags) : current.tags,
    params: adjustedParams,
  }))
})

export const deleteAssetHandler = withHandlerErrorBoundary(async (_request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const asset = ensureAsset(assetId)
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  deleteAsset(assetId)
  return json({ deleted: true, id: assetId })
})

export const getAssetCameraHandler = withHandlerErrorBoundary(async (_request, { params }) => {
  const asset = ensureAsset(decodeURIComponent(params.assetId))
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${params.assetId}.`)
  return json(extractCamera(asset.params))
})

export const patchAssetCameraHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const current = ensureAsset(assetId)
  if (!current) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  const body = await readJsonBody(request)
  const nextParams = mergeParams(current.params, {
    orbitMode: body.orbitMode ?? current.params.orbitMode,
    camPitch: body.camPitch ?? current.params.camPitch,
    camYaw: body.camYaw ?? current.params.camYaw,
    camDist: body.camDist ?? current.params.camDist,
    camTargetX: body.camTargetX ?? current.params.camTargetX,
    camTargetY: body.camTargetY ?? current.params.camTargetY,
    camTargetZ: body.camTargetZ ?? current.params.camTargetZ,
  })
  const validation = validateParams(nextParams)
  if (!validation.valid) return error(422, 'invalid_camera', 'Camera patch failed validation.', validation.errors)
  const asset = updateAsset(assetId, { params: nextParams })
  return json(extractCamera(asset.params))
})

export const getAssetStatsHandler = withHandlerErrorBoundary(async (_request, { params }) => {
  const asset = ensureAsset(decodeURIComponent(params.assetId))
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${params.assetId}.`)
  const result = generateSpecimen(asset)
  return json(result.stats)
})

export const getAssetTreeDataHandler = withHandlerErrorBoundary(async (_request, { params }) => {
  const asset = ensureAsset(decodeURIComponent(params.assetId))
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${params.assetId}.`)
  const result = generateSpecimen(asset)
  return json({
    asset: assetSummary(asset),
    stats: result.stats,
    treeData: serializeTreeData(result.treeData),
  })
})

export const duplicateAssetHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const asset = ensureAsset(decodeURIComponent(params.assetId))
  if (!asset) return error(404, 'asset_not_found', `No asset found for id ${params.assetId}.`)
  const body = await readJsonBody(request)
  return json(createAsset({
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : `${asset.name} copy`,
    kind: asset.kind,
    presetId: asset.presetId,
    tags: asset.tags,
    params: structuredClone(asset.params),
  }), 201)
})

export const applyPresetToAssetHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const current = ensureAsset(assetId)
  if (!current) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  const body = await readJsonBody(request)
  const presetName = normalizePresetName(body.presetName)
  const preset = getPresetByName(presetName)
  const nextParams = applyKindDefaults(createInitialParams({ presetName, kind: current.kind }), current.kind)
  const validation = validateParams(nextParams)
  if (!validation.valid) return error(422, 'invalid_preset_application', 'Preset application failed validation.', validation.errors)
  return json(updateAsset(assetId, { presetId: preset?.id ?? current.presetId, params: nextParams }))
})

export const randomizeSeedHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const current = ensureAsset(assetId)
  if (!current) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  const body = await readJsonBody(request)
  const nextSeed = Number.isInteger(body.seed) ? body.seed : Math.floor(Math.random() * 2147483647)
  const nextParams = mergeParams(current.params, { seed: nextSeed })
  const validation = validateParams(nextParams)
  if (!validation.valid) return error(422, 'invalid_seed', 'Seed update failed validation.', validation.errors)
  const asset = updateAsset(assetId, { params: nextParams })
  return json({ id: asset.id, seed: asset.params.seed })
})

export const patchAssetLevelHandler = withHandlerErrorBoundary(async (request, { params }) => {
  const assetId = decodeURIComponent(params.assetId)
  const depth = Number(params.depth)
  const current = ensureAsset(assetId)
  if (!current) return error(404, 'asset_not_found', `No asset found for id ${assetId}.`)
  if (!Number.isInteger(depth) || depth < 0 || depth >= current.params.levels.length) {
    return error(400, 'invalid_level_depth', 'Requested level depth is out of range.')
  }
  const body = await readJsonBody(request)
  const patchValidation = validateLevelPatch(body, `levels[${depth}]`)
  if (!patchValidation.valid) return error(422, 'invalid_level_patch', 'Level patch failed validation.', patchValidation.errors)
  const levels = [...current.params.levels]
  levels[depth] = { ...levels[depth], ...body }
  const nextParams = { ...current.params, levels }
  const validation = validateParams(nextParams)
  if (!validation.valid) return error(422, 'invalid_asset', 'Level patch failed validation.', validation.errors)
  return json(updateAsset(assetId, { params: nextParams }))
})
