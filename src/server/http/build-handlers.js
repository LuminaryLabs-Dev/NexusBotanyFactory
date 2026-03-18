import { createInitialParams, normalizeAssetKind, normalizePresetName, normalizeTags, validateParams } from '../../models/botany/validation/validation.js'
import { generateSpecimen } from '../../models/botany/services/specimenGenerationService.js'
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

export const validateBuildHandler = wrap(async (request) => {
  const body = await readJsonBody(request)
  const validation = validateParams(body.params)
  return json(validation, validation.valid ? 200 : 422)
})

export const normalizeBuildHandler = wrap(async (request) => {
  const body = await readJsonBody(request)
  const params = createInitialParams({ presetName: body.presetName, kind: body.kind, paramsPatch: body.params })
  const validation = validateParams(params)
  return json({
    presetName: normalizePresetName(body.presetName),
    kind: normalizeAssetKind(body.kind),
    tags: normalizeTags(body.tags),
    params,
    validation,
  }, validation.valid ? 200 : 422)
})

export const buildFromPresetAndPatchHandler = wrap(async (request) => {
  const body = await readJsonBody(request)
  const params = createInitialParams({ presetName: body.presetName, kind: body.kind, paramsPatch: body.patch })
  const validation = validateParams(params)
  if (!validation.valid) return error(422, 'invalid_build_request', 'Requested build failed validation.', validation.errors)
  const result = generateSpecimen({ kind: normalizeAssetKind(body.kind), params })
  return json({
    kind: normalizeAssetKind(body.kind),
    presetName: normalizePresetName(body.presetName),
    params,
    stats: result.stats,
  })
})
