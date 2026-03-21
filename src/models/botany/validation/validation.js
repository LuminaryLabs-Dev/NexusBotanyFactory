import {
  BOTANY_LEVEL_FIELD_SCHEMA,
  BOTANY_PARAM_FIELD_SCHEMA,
  DEFAULT_PRESET_NAME,
  LEAF_ARRANGEMENT_ENUM,
  LEAF_STYLE_ENUM,
  ORBIT_MODE_ENUM,
  SUPPORTED_ASSET_KINDS,
} from '../schema/schema.js'
import { clonePresetParams, SPECIES_PRESETS } from '../schema/presets.js'

const colorPattern = /^#[0-9a-fA-F]{6}$/

const kindPatches = {
  tree: {},
  shrub: {
    height: 14,
    radius: 0.45,
    recursion: 4,
    leafCount: 7000,
    leafSize: 0.28,
    camDist: 42,
    levels: [
      { branchCount: 10, branchAngle: 1.35, lengthScale: 0.58, radiusScale: 0.72 },
      { branchCount: 10, branchAngle: 1.45, lengthScale: 0.5, radiusScale: 0.68 },
    ],
  },
  bush: {
    height: 8,
    radius: 0.35,
    recursion: 4,
    leafCount: 8500,
    leafSize: 0.24,
    camDist: 26,
    levels: [
      { branchCount: 12, branchAngle: 1.5, lengthScale: 0.52, radiusScale: 0.7 },
      { branchCount: 11, branchAngle: 1.6, lengthScale: 0.45, radiusScale: 0.62 },
    ],
  },
  custom: {},
}

export const normalizePresetName = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_PRESET_NAME
  }

  const normalized = value.trim().toLowerCase()
  const match = Object.keys(SPECIES_PRESETS).find((presetName) => presetName.toLowerCase() === normalized)
  return match ?? DEFAULT_PRESET_NAME
}

export const normalizeAssetKind = (value) => {
  if (typeof value !== 'string') return 'tree'
  const normalized = value.trim().toLowerCase()
  return SUPPORTED_ASSET_KINDS.includes(normalized) ? normalized : 'tree'
}

export const normalizeTags = (value) => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((tag) => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean))]
}

const normalizeExtraFieldSchema = (extraFieldSchema = []) => {
  if (Array.isArray(extraFieldSchema)) {
    return Object.fromEntries(
      extraFieldSchema
        .filter((field) => field && typeof field === 'object')
        .map((field) => {
          const key = typeof field.path === 'string' && field.path.startsWith('params.')
            ? field.path.slice('params.'.length)
            : field.path
          const typeFromWidget = field.widget === 'toggle'
            ? 'boolean'
            : field.widget === 'select'
              ? 'enum'
              : field.widget === 'color'
                ? 'color'
                : field.widget === 'number'
                  ? 'number'
                  : field.widget === 'slider'
                    ? (field.integer || Number.isInteger(field.step) ? 'integer' : 'number')
                    : 'string'

          return [key, {
            ...field,
            type: field.type ?? typeFromWidget,
            values: Array.isArray(field.options)
              ? field.options.map((option) => (typeof option === 'string' ? option : option.value ?? option.label)).filter((value) => value !== undefined)
              : field.values,
          }]
        })
        .filter(([key]) => typeof key === 'string' && key.length > 0),
    )
  }

  if (extraFieldSchema && typeof extraFieldSchema === 'object') {
    return extraFieldSchema
  }

  return {}
}

const getDefaultCameraTarget = (params) => ({
  x: 0,
  y: 1.25 + (((typeof params?.height === 'number' && Number.isFinite(params.height)) ? params.height : 40) / 2),
  z: 0,
})

export const normalizeCameraParams = (params) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) return params

  const target = getDefaultCameraTarget(params)
  return {
    ...params,
    orbitMode: params.orbitMode === undefined ? 'specimen-locked' : params.orbitMode,
    camTargetX: params.camTargetX === undefined ? target.x : params.camTargetX,
    camTargetY: params.camTargetY === undefined ? target.y : params.camTargetY,
    camTargetZ: params.camTargetZ === undefined ? target.z : params.camTargetZ,
  }
}

export const mergeParams = (baseParams, patch) => {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return structuredClone(baseParams)
  }

  const next = structuredClone(baseParams)
  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return

    if (!(key in BOTANY_PARAM_FIELD_SCHEMA)) {
      return
    }

    if (key === 'levels' && Array.isArray(value)) {
      const mergedLevels = [...next.levels]
      value.forEach((levelPatch, index) => {
        if (levelPatch === undefined) return
        if (levelPatch && typeof levelPatch === 'object' && !Array.isArray(levelPatch) && mergedLevels[index]) {
          const allowedLevelPatch = Object.fromEntries(
            Object.entries(levelPatch).filter(([levelKey]) => levelKey in BOTANY_LEVEL_FIELD_SCHEMA),
          )
          mergedLevels[index] = {
            ...mergedLevels[index],
            ...allowedLevelPatch,
          }
          return
        }

        mergedLevels[index] = levelPatch
      })
      next.levels = mergedLevels
      return
    }

    next[key] = value
  })

  return next
}

export const applyKindDefaults = (params, kind) => {
  const normalizedKind = normalizeAssetKind(kind)
  const patch = kindPatches[normalizedKind] ?? kindPatches.tree
  return normalizeCameraParams(mergeParams(params, patch))
}

export const createInitialParams = ({ presetName, kind, paramsPatch }) => {
  const base = clonePresetParams(normalizePresetName(presetName))
  const withKind = applyKindDefaults(base, kind)
  return normalizeCameraParams(mergeParams(withKind, paramsPatch))
}

const pushValidationError = (errors, path, message, value) => {
  errors.push({ path, message, value })
}

const validateNumberField = (errors, path, value, schema, { integer = false } = {}) => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
    pushValidationError(errors, path, 'Expected a finite number.', value)
    return
  }

  if (integer && !Number.isInteger(value)) {
    pushValidationError(errors, path, 'Expected an integer.', value)
  }
  if (schema.min !== undefined && value < schema.min) {
    pushValidationError(errors, path, `Must be greater than or equal to ${schema.min}.`, value)
  }
  if (schema.max !== undefined && value > schema.max) {
    pushValidationError(errors, path, `Must be less than or equal to ${schema.max}.`, value)
  }
}

export const validateLevelPatch = (patch, pathPrefix = 'levels[]') => {
  const errors = []

  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    pushValidationError(errors, pathPrefix, 'Expected a level patch object.', patch)
    return { valid: false, errors }
  }

  Object.entries(patch).forEach(([key, value]) => {
    const schema = BOTANY_LEVEL_FIELD_SCHEMA[key]
    if (!schema) {
      pushValidationError(errors, `${pathPrefix}.${key}`, 'Unknown level field.', value)
      return
    }
    validateNumberField(errors, `${pathPrefix}.${key}`, value, schema, { integer: schema.type === 'integer' })
  })

  return { valid: errors.length === 0, errors }
}

export const validateParams = (params, extraFieldSchema = []) => {
  const errors = []
  const allowedExtraFields = normalizeExtraFieldSchema(extraFieldSchema)

  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    pushValidationError(errors, 'params', 'Expected an object.', params)
    return { valid: false, errors }
  }

  const normalizedParams = normalizeCameraParams(params)

  Object.keys(normalizedParams).forEach((key) => {
    if (!(key in BOTANY_PARAM_FIELD_SCHEMA) && !(key in allowedExtraFields)) {
      pushValidationError(errors, `params.${key}`, 'Unknown field.', normalizedParams[key])
    }
  })

  const validateField = (key, schema, value, pathPrefix = 'params') => {
    if (schema.type === 'integer' || schema.type === 'number') {
      validateNumberField(errors, `${pathPrefix}.${key}`, value, schema, { integer: schema.type === 'integer' })
      return
    }

    if (schema.type === 'enum') {
      if (!Array.isArray(schema.values) || !schema.values.includes(value)) {
        pushValidationError(errors, `${pathPrefix}.${key}`, `Expected one of: ${schema.values.join(', ')}.`, value)
      }
      return
    }

    if (schema.type === 'color') {
      if (typeof value !== 'string' || !colorPattern.test(value)) {
        pushValidationError(errors, `${pathPrefix}.${key}`, 'Expected a hex color string like #336699.', value)
      }
      return
    }

    if (schema.type === 'boolean') {
      if (typeof value !== 'boolean') {
        pushValidationError(errors, `${pathPrefix}.${key}`, 'Expected a boolean value.', value)
      }
      return
    }

    if (schema.type === 'string') {
      if (typeof value !== 'string') {
        pushValidationError(errors, `${pathPrefix}.${key}`, 'Expected a string value.', value)
      }
    }
  }

  Object.entries(BOTANY_PARAM_FIELD_SCHEMA).forEach(([key, schema]) => {
    const value = normalizedParams[key]

    if (value === undefined) {
      pushValidationError(errors, `params.${key}`, 'Missing required field.', value)
      return
    }

    validateField(key, schema, value)

    if (key === 'levels') {
      if (!Array.isArray(value)) {
        pushValidationError(errors, 'params.levels', 'Expected an array of level objects.', value)
        return
      }

      if (value.length < 1 || value.length > 6) {
        pushValidationError(errors, 'params.levels', 'Expected between 1 and 6 levels.', value.length)
      }

      value.forEach((level, index) => {
        const result = validateLevelPatch(level, `params.levels[${index}]`)
        result.errors.forEach((error) => errors.push(error))
      })
    }
  })

  Object.entries(allowedExtraFields).forEach(([key, schema]) => {
    const value = normalizedParams[key]
    if (value === undefined) {
      if (schema.required) {
        pushValidationError(errors, `params.${key}`, 'Missing required field.', value)
      }
      return
    }
    validateField(key, schema, value)
  })

  if (!LEAF_STYLE_ENUM.includes(normalizedParams.leafStyle)) {
    pushValidationError(errors, 'params.leafStyle', `Expected one of: ${LEAF_STYLE_ENUM.join(', ')}.`, normalizedParams.leafStyle)
  }
  if (!LEAF_ARRANGEMENT_ENUM.includes(normalizedParams.leafArrangement)) {
    pushValidationError(errors, 'params.leafArrangement', `Expected one of: ${LEAF_ARRANGEMENT_ENUM.join(', ')}.`, normalizedParams.leafArrangement)
  }
  if (!ORBIT_MODE_ENUM.includes(normalizedParams.orbitMode)) {
    pushValidationError(errors, 'params.orbitMode', `Expected one of: ${ORBIT_MODE_ENUM.join(', ')}.`, normalizedParams.orbitMode)
  }
  if (normalizedParams.recursion > normalizedParams.levels.length - 1) {
    pushValidationError(errors, 'params.recursion', 'Recursion cannot exceed the highest defined level index.', normalizedParams.recursion)
  }

  return { valid: errors.length === 0, errors }
}

export const extractCamera = (params) => {
  const normalized = normalizeCameraParams(params)
  return {
    orbitMode: normalized.orbitMode,
    camPitch: normalized.camPitch,
    camYaw: normalized.camYaw,
    camDist: normalized.camDist,
    camTargetX: normalized.camTargetX,
    camTargetY: normalized.camTargetY,
    camTargetZ: normalized.camTargetZ,
  }
}
