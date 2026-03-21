import { createFieldSpec, normalizeFieldSpecs } from './fieldSpec.js'

const runtimeCache = new Map()

const hashString = (value) => {
  const text = String(value ?? '')
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

export const createCustomSpecimenApi = () => ({
  clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
  mix: (start, end, amount) => start + ((end - start) * amount),
  lerp: (start, end, amount) => start + ((end - start) * amount),
  smoothstep: (min, max, value) => {
    const normalized = Math.min(1, Math.max(0, (value - min) / Math.max(max - min, 0.0001)))
    return normalized * normalized * (3 - (2 * normalized))
  },
  field: (path, widget, options = {}) => createFieldSpec({ path, widget, ...options }),
  fields: (...items) => normalizeFieldSpecs(items.flat()),
  preset: (name) => name,
  hash: hashString,
})

export const compileCustomSpecimenSource = (source) => {
  const sourceText = typeof source === 'string' ? source.trim() : ''
  if (!sourceText) {
    throw new Error('Custom specimen source is empty.')
  }

  const cacheKey = hashString(sourceText)
  if (runtimeCache.has(cacheKey)) {
    return runtimeCache.get(cacheKey)
  }

  let runtime
  try {
    // The source is an object literal expression, e.g. `({ generate() {}, ... })`.
    runtime = new Function('api', `'use strict'; return (${sourceText});`)(createCustomSpecimenApi())
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to compile custom specimen source.'
    throw new Error(message)
  }

  if (!runtime || typeof runtime.generate !== 'function') {
    throw new Error('Custom specimen source must export a generate() function.')
  }

  const compiled = {
    ...runtime,
    source: sourceText,
    sourceHash: cacheKey,
    controlSchema: normalizeFieldSpecs(runtime.controlSchema ?? []),
    defaults: runtime.defaults ?? {},
    basePresetName: runtime.basePresetName ?? runtime.presetName ?? 'Pine',
    baseKind: runtime.baseKind ?? 'tree',
  }

  runtimeCache.set(cacheKey, compiled)
  return compiled
}

export const clearCustomSpecimenRuntimeCache = () => {
  runtimeCache.clear()
}

