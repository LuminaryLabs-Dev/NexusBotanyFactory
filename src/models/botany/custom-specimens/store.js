import { BUILTIN_CUSTOM_SPECIMEN_DEFINITIONS } from './builtins.js'
import { compileCustomSpecimenSource, clearCustomSpecimenRuntimeCache } from './runtime.js'
import { normalizeFieldSpecs } from './fieldSpec.js'
import { BOTANY_PARAM_FIELD_SCHEMA } from '../schema/schema.js'
import { createInitialParams } from '../validation/validation.js'

const STORAGE_KEY = 'nexus-botany-factory.custom-specimens.v1'

let memoryDefinitions = []

const canUseBrowserStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const clone = (value) => JSON.parse(JSON.stringify(value))

const nowIso = () => new Date().toISOString()

const createUserDefinitionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `custom:${crypto.randomUUID()}`
  }

  return `custom:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
}

const readStoredDefinitions = () => {
  if (!canUseBrowserStorage()) {
    return memoryDefinitions
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeStoredDefinitions = (definitions) => {
  const normalized = [...definitions].sort((left, right) => {
    const leftTime = left.updatedAt ?? left.createdAt ?? ''
    const rightTime = right.updatedAt ?? right.createdAt ?? ''
    return rightTime.localeCompare(leftTime)
  })

  memoryDefinitions = normalized
  if (canUseBrowserStorage()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  }

  return normalized
}

const normalizeUserDefinition = (definition) => {
  const base = clone(definition)
  const id = typeof base.id === 'string' && base.id.trim() ? base.id.trim() : createUserDefinitionId()
  const source = typeof base.source === 'string' ? base.source.trim() : ''
  const now = base.updatedAt ?? nowIso()
  return {
    id,
    name: typeof base.name === 'string' && base.name.trim() ? base.name.trim() : 'Custom Specimen',
    description: typeof base.description === 'string' ? base.description : '',
    version: Number.isFinite(base.version) ? base.version : 1,
    builtIn: Boolean(base.builtIn),
    enabled: base.enabled !== false,
    basePresetName: typeof base.basePresetName === 'string' && base.basePresetName.trim() ? base.basePresetName.trim() : 'Pine',
    baseKind: typeof base.baseKind === 'string' && base.baseKind.trim() ? base.baseKind.trim() : 'tree',
    source,
    defaults: base.defaults && typeof base.defaults === 'object' ? clone(base.defaults) : {},
    controlSchema: normalizeFieldSpecs(base.controlSchema ?? []),
    tags: Array.isArray(base.tags) ? [...new Set(base.tags.filter((tag) => typeof tag === 'string' && tag.trim()).map((tag) => tag.trim()))] : [],
    createdAt: base.createdAt ?? now,
    updatedAt: now,
  }
}

const buildDefinitionDocument = (definition, { sourceType = 'user' } = {}) => {
  const normalized = normalizeUserDefinition(definition)
  let compiled = null
  let compileError = null

  try {
    compiled = normalized.source ? compileCustomSpecimenSource(normalized.source) : null
  } catch (error) {
    compileError = error instanceof Error ? error.message : 'Compilation failed.'
  }

  return {
    ...normalized,
    sourceType,
    sourceHash: compiled?.sourceHash ?? null,
    compileError,
    runtime: compiled,
  }
}

const stripRuntimeDocument = (definition) => {
  if (!definition) return null
  const safe = { ...definition }
  delete safe.runtime
  return clone(safe)
}

const getBuiltinDocuments = () => BUILTIN_CUSTOM_SPECIMEN_DEFINITIONS.map((definition) => buildDefinitionDocument(definition, { sourceType: 'builtin' }))

const getStoredDocuments = () => readStoredDefinitions().map((definition) => buildDefinitionDocument(definition, { sourceType: 'user' }))

export const customSpecimenStore = {
  async listDefinitions() {
    return {
      items: [...getBuiltinDocuments(), ...getStoredDocuments()].map(stripRuntimeDocument).filter(Boolean),
    }
  },

  async listPresetDocuments() {
    const { items } = await this.listDefinitions()
    return {
      items: items.map((definition) => ({
        id: definition.id,
        name: definition.name,
        kind: 'custom',
        sourceType: definition.sourceType,
        builtIn: definition.sourceType === 'builtin',
        enabled: definition.enabled,
        customSpecimenId: definition.id,
        basePresetName: definition.basePresetName,
        description: definition.description,
        defaults: clone(definition.defaults ?? {}),
        controlSchema: clone(definition.controlSchema ?? []),
        source: definition.source ?? '',
      })),
    }
  },

  async getDefinition(definitionId) {
    const match = [...getBuiltinDocuments(), ...getStoredDocuments()].find((definition) => definition.id === definitionId)
    return match ? stripRuntimeDocument(match) : null
  },

  getDefinitionSync(definitionId, snapshot = null) {
    const match = [...getBuiltinDocuments(), ...getStoredDocuments()].find((definition) => definition.id === definitionId)
    if (match) {
      return match
    }

    if (snapshot && typeof snapshot === 'object') {
      return buildDefinitionDocument({
        ...snapshot,
        id: definitionId ?? snapshot.id,
      }, { sourceType: 'snapshot' })
    }

    return null
  },

  createCustomSpecimenParams(definition, paramsPatch = {}) {
    const basePresetName = definition?.basePresetName ?? 'Pine'
    const baseKind = definition?.baseKind ?? 'tree'
    const baseDefaults = definition?.defaults ?? {}
    const builtInBasePatch = Object.fromEntries(
      Object.entries(baseDefaults).filter(([key]) => key in BOTANY_PARAM_FIELD_SCHEMA),
    )
    const base = createInitialParams({
      presetName: basePresetName,
      kind: baseKind,
      paramsPatch: builtInBasePatch,
    })
    return {
      ...base,
      ...Object.fromEntries(Object.entries(baseDefaults).filter(([key]) => !(key in BOTANY_PARAM_FIELD_SCHEMA))),
      ...Object.fromEntries(Object.entries(paramsPatch).filter(([key]) => !(key in BOTANY_PARAM_FIELD_SCHEMA))),
    }
  },

  async saveDefinition(definition) {
    const normalized = normalizeUserDefinition(definition)
    if (normalized.builtIn) {
      throw new Error('Built-in custom specimens are read-only.')
    }
    const stored = readStoredDefinitions()
    const index = stored.findIndex((item) => item.id === normalized.id)

    if (index >= 0) {
      stored[index] = { ...stored[index], ...normalized, updatedAt: nowIso(), builtIn: false }
    } else {
      stored.unshift({ ...normalized, id: normalized.id.startsWith('custom:') ? normalized.id : createUserDefinitionId(), builtIn: false })
    }

    writeStoredDefinitions(stored)
    const savedId = stored[index >= 0 ? index : 0].id
    return clone(await this.getDefinition(savedId))
  },

  async cloneDefinition(definitionId, name) {
    const current = await this.getDefinition(definitionId)
    if (!current) {
      throw new Error(`No custom specimen found for id ${definitionId}.`)
    }

    const cloned = {
      ...current,
      id: createUserDefinitionId(),
      name: typeof name === 'string' && name.trim() ? name.trim() : `${current.name} copy`,
      builtIn: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      sourceType: 'user',
    }

    const stored = readStoredDefinitions()
    stored.unshift(cloned)
    writeStoredDefinitions(stored)
    return clone(cloned)
  },

  async deleteDefinition(definitionId) {
    const stored = readStoredDefinitions()
    const next = stored.filter((definition) => definition.id !== definitionId)
    writeStoredDefinitions(next)
    return { deleted: next.length !== stored.length, id: definitionId }
  },

  async toggleEnabled(definitionId, enabled) {
    const stored = readStoredDefinitions()
    const index = stored.findIndex((definition) => definition.id === definitionId)
    if (index < 0) {
      throw new Error(`No custom specimen found for id ${definitionId}.`)
    }

    stored[index] = {
      ...stored[index],
      enabled: Boolean(enabled),
      updatedAt: nowIso(),
    }
    writeStoredDefinitions(stored)
    return clone(await this.getDefinition(definitionId))
  },

  async exportDefinitions() {
    return { items: readStoredDefinitions().map(clone) }
  },

  async importDefinitions(definitions = []) {
    const imported = Array.isArray(definitions) ? definitions.map((definition) => normalizeUserDefinition({ ...definition, builtIn: false })) : []
    const stored = readStoredDefinitions()
    const map = new Map(stored.map((definition) => [definition.id, definition]))
    imported.forEach((definition) => {
      map.set(definition.id, definition)
    })
    writeStoredDefinitions(Array.from(map.values()))
    return this.listDefinitions()
  },

  clearRuntimeCache() {
    clearCustomSpecimenRuntimeCache()
  },
}
