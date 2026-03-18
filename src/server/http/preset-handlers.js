import { mergeParams, normalizeAssetKind, validateParams } from '../../models/botany/validation/validation.js'
import { createPreset, deletePreset, getPresetById, listPresets, updatePreset } from '../repositories/presetRepository.js'
import { error, json } from './responses.js'
import { readJsonBody } from './request-parsing.js'

const wrap = (handler) => async (...args) => {
  try {
    return await handler(...args)
  } catch (err) {
    if (err?.statusCode) return error(err.statusCode, 'bad_request', err.message)
    return error(500, 'internal_error', err instanceof Error ? err.message : 'Unknown server error.')
  }
}

export const listPresetsHandler = wrap(async () => json({ items: listPresets() }))

export const createPresetHandler = wrap(async (request) => {
  const body = await readJsonBody(request)
  const validation = validateParams(body.params)
  if (!validation.valid) return error(422, 'invalid_params', 'Preset parameters failed validation.', validation.errors)
  return json(createPreset({
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Custom Preset',
    kind: normalizeAssetKind(body.kind),
    params: body.params,
  }), 201)
})

export const getPresetHandler = wrap(async (_request, { params }) => {
  const preset = getPresetById(decodeURIComponent(params.presetId))
  if (!preset) return error(404, 'preset_not_found', 'Preset not found.')
  return json(preset)
})

export const patchPresetHandler = wrap(async (request, { params }) => {
  const presetId = decodeURIComponent(params.presetId)
  const current = getPresetById(presetId)
  if (!current) return error(404, 'preset_not_found', 'Preset not found.')
  if (current.source === 'built-in') return error(409, 'preset_locked', 'Built-in presets cannot be modified.')
  const body = await readJsonBody(request)
  const nextParams = body.params ? mergeParams(current.params, body.params) : current.params
  const validation = validateParams(nextParams)
  if (!validation.valid) return error(422, 'invalid_params', 'Preset update failed validation.', validation.errors)
  return json(updatePreset(presetId, {
    name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : current.name,
    kind: normalizeAssetKind(body.kind ?? current.kind),
    params: nextParams,
  }))
})

export const deletePresetHandler = wrap(async (_request, { params }) => {
  const presetId = decodeURIComponent(params.presetId)
  const current = getPresetById(presetId)
  if (!current) return error(404, 'preset_not_found', 'Preset not found.')
  if (current.source === 'built-in') return error(409, 'preset_locked', 'Built-in presets cannot be deleted.')
  deletePreset(presetId)
  return json({ deleted: true, id: presetId })
})
