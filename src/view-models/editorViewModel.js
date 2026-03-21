import { startTransition, useEffect, useMemo, useState } from 'react'
import { clonePresetParams } from '../models/botany/schema/presets.js'
import { createInitialParams, validateParams } from '../models/botany/validation/validation.js'
import { apiClient } from '../lib/api-client.js'
import { customSpecimenStore } from '../models/botany/custom-specimens/store.js'
import { setIn } from '../lib/objectPaths.js'
import { useViewportViewModel } from './viewportViewModel.js'

const createInitialSpecimen = () => ({
  id: null,
  name: `${clonePresetParams('Pine').name} Study`,
  kind: 'tree',
  presetId: 'builtin:pine',
  customSpecimenId: null,
  customSpecimenVersion: null,
  customSpecimenSnapshot: null,
  tags: [],
  params: clonePresetParams('Pine'),
})

const createBlankCustomDefinition = () => ({
  id: `custom:${Date.now().toString(36)}`,
  name: 'Untitled Custom Specimen',
  description: '',
  version: 1,
  builtIn: false,
  enabled: true,
  basePresetName: 'Pine',
  baseKind: 'tree',
  defaults: {},
  controlSchema: [],
  source: `({
  name: 'Untitled Custom Specimen',
  description: 'A new custom specimen.',
  basePresetName: 'Pine',
  baseKind: 'tree',
  defaults: {},
  controlSchema: [],
  generate() {
    return { paramsPatch: {} }
  },
  summarize() {
    return 'Untitled custom specimen'
  },
})`,
})

const snapshotDefinition = (definition) => {
  if (!definition) return null
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    version: definition.version,
    builtIn: definition.builtIn,
    enabled: definition.enabled,
    basePresetName: definition.basePresetName,
    baseKind: definition.baseKind,
    defaults: structuredClone(definition.defaults ?? {}),
    controlSchema: structuredClone(definition.controlSchema ?? []),
    source: definition.source,
    sourceHash: definition.sourceHash ?? null,
  }
}

export const useEditorViewModel = () => {
  const [specimen, setSpecimen] = useState(createInitialSpecimen)
  const [debugMode, setDebugMode] = useState('beauty')
  const [activeTab, setActiveTab] = useState('build')
  const [activeCategories, setActiveCategories] = useState(['phenotype', 'form', 'leaders', 'preview'])
  const [specimenRevision, setSpecimenRevision] = useState(0)
  const [frameRequestToken, setFrameRequestToken] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [presetCatalog, setPresetCatalog] = useState([])
  const [customDefinitions, setCustomDefinitions] = useState([])
  const [selectedCustomSpecimenId, setSelectedCustomSpecimenId] = useState(null)
  const [customDraft, setCustomDraft] = useState(null)
  const [catalogStatus, setCatalogStatus] = useState('loading')
  const [catalogError, setCatalogError] = useState(null)

  const refreshCatalog = async () => {
    setCatalogStatus('loading')
    setCatalogError(null)

    try {
      const [builtInPresetPayload, customPresetPayload, definitionPayload] = await Promise.all([
        apiClient.listPresets(),
        customSpecimenStore.listPresetDocuments(),
        customSpecimenStore.listDefinitions(),
      ])

      const nextPresets = [
        ...(builtInPresetPayload.items ?? []),
        ...(customPresetPayload.items ?? []),
      ]

      setPresetCatalog(nextPresets)
      setCustomDefinitions(definitionPayload.items ?? [])
      setCatalogStatus('ready')

      setSelectedCustomSpecimenId((current) => {
        const preferred = current && definitionPayload.items?.some((definition) => definition.id === current)
          ? current
          : definitionPayload.items?.[0]?.id ?? null
        if (!preferred) return null
        return preferred
      })

      setCustomDraft((current) => {
        if (current) return current
        const first = definitionPayload.items?.[0]
        return first ? structuredClone(first) : null
      })

      return {
        presets: nextPresets,
        definitions: definitionPayload.items ?? [],
      }
    } catch (loadError) {
      setCatalogError(loadError instanceof Error ? loadError.message : 'Failed to load specimen catalog.')
      setCatalogStatus('error')
      return {
        presets: [],
        definitions: [],
      }
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshCatalog()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const activeCustomDefinition = useMemo(
    () => customDefinitions.find((definition) => definition.id === specimen.customSpecimenId) ?? null,
    [customDefinitions, specimen.customSpecimenId],
  )

  const validation = useMemo(
    () => validateParams(specimen.params, activeCustomDefinition?.controlSchema ?? []),
    [specimen.params, activeCustomDefinition],
  )

  const viewportState = useViewportViewModel(specimen, specimenRevision)

  const updatePath = (path, value) => {
    startTransition(() => {
      setSpecimen((current) => setIn(current, path, value))
    })
  }

  const updateParam = (key, value) => updatePath(`params.${key}`, value)

  const updateLevel = (depth, key, value) => updatePath(`params.levels[${depth}].${key}`, value)

  const applyPreset = (presetInput) => {
    const preset = typeof presetInput === 'string'
      ? presetCatalog.find((entry) => entry.id === presetInput || entry.name === presetInput) ?? null
      : presetInput

    if (!preset) return

    if (preset.kind === 'custom' || preset.customSpecimenId) {
      const definition = customDefinitions.find((entry) => entry.id === (preset.customSpecimenId ?? preset.id)) ?? null
      const nextDefinition = definition ? structuredClone(definition) : null
      const params = definition
        ? customSpecimenStore.createCustomSpecimenParams(definition)
        : createInitialParams({ presetName: preset.basePresetName ?? preset.name ?? 'Pine', kind: preset.baseKind ?? 'tree', paramsPatch: preset.defaults ?? {} })

      setSpecimen((current) => ({
        ...current,
        name: `${preset.name} Study`,
        kind: 'custom',
        presetId: preset.id,
        customSpecimenId: preset.customSpecimenId ?? preset.id,
        customSpecimenVersion: definition?.version ?? preset.version ?? null,
        customSpecimenSnapshot: snapshotDefinition(nextDefinition ?? definition ?? preset),
        params,
      }))
    } else {
      const params = createInitialParams({
        presetName: preset.name ?? 'Pine',
        kind: preset.kind ?? 'tree',
        paramsPatch: {},
      })

      setSpecimen((current) => ({
        ...current,
        name: `${preset.name} Study`,
        kind: preset.kind ?? 'tree',
        presetId: preset.id,
        customSpecimenId: null,
        customSpecimenVersion: null,
        customSpecimenSnapshot: null,
        params,
      }))
    }

    setSpecimenRevision((current) => current + 1)
    setFrameRequestToken((current) => current + 1)
  }

  const changeKind = (kind) => {
    setSpecimen((current) => ({
      ...current,
      kind,
      ...(kind !== 'custom'
        ? {
            customSpecimenId: null,
            customSpecimenVersion: null,
            customSpecimenSnapshot: null,
          }
        : {}),
    }))
  }

  const randomizeSeed = () => updateParam('seed', Math.floor(Math.random() * 2147483647))
  const requestFrame = () => setFrameRequestToken((current) => current + 1)
  const toggleCategory = (id) => setActiveCategories((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])

  const getLevelSummary = (depth) => {
    const level = specimen.params.levels[depth]
    if (!level) return 'No settings'
    const parts = [
      `${level.branchCount ?? 0} branches`,
      `angle ${Number(level.branchAngle ?? 0).toFixed(1)}`,
      `curve ${Number(level.curve ?? 0).toFixed(1)}`,
    ]
    return parts.join(' · ')
  }

  const saveAsset = async () => {
    setStatus('saving')
    setError(null)
    try {
      const customDefinition = specimen.customSpecimenId
        ? customDefinitions.find((definition) => definition.id === specimen.customSpecimenId) ?? null
        : null
      const payload = specimen.id
        ? await apiClient.updateAsset(specimen.id, {
            name: specimen.name,
            kind: specimen.kind,
            presetId: specimen.presetId,
            customSpecimenId: specimen.customSpecimenId,
            customSpecimenVersion: specimen.customSpecimenVersion,
            customSpecimenSnapshot: specimen.customSpecimenSnapshot,
            tags: specimen.tags,
            params: specimen.params,
          })
        : await apiClient.createAsset({
            name: specimen.name,
            kind: specimen.kind,
            presetId: specimen.presetId,
            customSpecimenId: specimen.customSpecimenId,
            customSpecimenVersion: specimen.customSpecimenVersion,
            customSpecimenSnapshot: specimen.customSpecimenSnapshot ?? snapshotDefinition(customDefinition),
            tags: specimen.tags,
            params: specimen.params,
            presetName: specimen.params.name,
          })
      setSpecimen((current) => ({ ...current, ...payload }))
      setStatus('saved')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save specimen.')
      setStatus('error')
    }
  }

  const loadAsset = async (assetId) => {
    setStatus('loading')
    setError(null)
    try {
      const payload = await apiClient.getAsset(assetId)
      setSpecimen(payload)
      setSpecimenRevision((current) => current + 1)
      setFrameRequestToken((current) => current + 1)
      setStatus('loaded')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const selectCustomDefinition = (definitionId) => {
    const found = customDefinitions.find((definition) => definition.id === definitionId)
    if (!found) return
    setSelectedCustomSpecimenId(definitionId)
    setCustomDraft(structuredClone(found))
  }

  const createBlankDefinition = () => {
    const blank = createBlankCustomDefinition()
    setSelectedCustomSpecimenId(blank.id)
    setCustomDraft(blank)
  }

  const cloneSelectedDefinition = async () => {
    const source = customDraft ?? customDefinitions.find((definition) => definition.id === selectedCustomSpecimenId)
    if (!source) return
    if (source.builtIn) {
      const clone = await customSpecimenStore.cloneDefinition(source.id, `${source.name} copy`)
      const nextCatalog = await refreshCatalog()
      const nextClone = nextCatalog.definitions.find((definition) => definition.id === clone.id) ?? clone
      setSelectedCustomSpecimenId(nextClone.id)
      setCustomDraft(structuredClone(nextClone))
      return
    }

    const clone = {
      ...source,
      id: `custom:${Date.now().toString(36)}`,
      name: `${source.name} copy`,
      builtIn: false,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSelectedCustomSpecimenId(clone.id)
    setCustomDraft(clone)
  }

  const saveCustomDraft = async () => {
    if (!customDraft || customDraft.builtIn) return

    const saved = await customSpecimenStore.saveDefinition(customDraft)
    const nextCatalog = await refreshCatalog()
    const nextSaved = nextCatalog.definitions.find((definition) => definition.id === saved.id) ?? saved
    setSelectedCustomSpecimenId(nextSaved.id)
    setCustomDraft(structuredClone(nextSaved))

    if (specimen.customSpecimenId === saved.id) {
      setSpecimen((current) => ({
        ...current,
        customSpecimenVersion: saved.version,
        customSpecimenSnapshot: snapshotDefinition(saved),
      }))
      setSpecimenRevision((current) => current + 1)
    }
  }

  const deleteSelectedDefinition = async () => {
    const source = customDraft ?? customDefinitions.find((definition) => definition.id === selectedCustomSpecimenId)
    if (!source || source.builtIn) return
    await customSpecimenStore.deleteDefinition(source.id)
    const nextCatalog = await refreshCatalog()
    const next = nextCatalog.definitions.find((definition) => !definition.builtIn && definition.id !== source.id)
      ?? nextCatalog.definitions.find((definition) => definition.id !== source.id)
      ?? null
    if (next) {
      setSelectedCustomSpecimenId(next.id)
      setCustomDraft(structuredClone(next))
    } else {
      createBlankDefinition()
    }
    if (specimen.customSpecimenId === source.id) {
      applyPreset('builtin:pine')
    }
  }

  const toggleDefinitionEnabled = async (definitionId, enabled) => {
    const current = customDraft?.id === definitionId ? customDraft : customDefinitions.find((definition) => definition.id === definitionId)
    if (!current || current.builtIn) return
    const next = { ...current, enabled: Boolean(enabled) }
    setCustomDraft(next)
    await customSpecimenStore.toggleEnabled(definitionId, enabled)
    const nextCatalog = await refreshCatalog()
    const nextDefinition = nextCatalog.definitions.find((definition) => definition.id === definitionId) ?? next
    setSelectedCustomSpecimenId(nextDefinition.id)
    setCustomDraft(structuredClone(nextDefinition))
  }

  const updateDraftPath = (path, value) => {
    setCustomDraft((current) => (current && !current.builtIn ? setIn(current, path, value) : current))
  }

  const addField = () => {
    setCustomDraft((current) => {
      if (!current || current.builtIn) return current
      const nextFields = [...(current.controlSchema ?? []), {
        path: `params.customField${(current.controlSchema?.length ?? 0) + 1}`,
        label: 'Custom Field',
        widget: 'slider',
        group: 'Custom Controls',
        order: (current.controlSchema?.length ?? 0) * 10,
        visibleIn: ['build', 'refine', 'editor'],
        min: 0,
        max: 1,
        step: 0.05,
        help: 'New serialized inspector field.',
      }]
      return { ...current, controlSchema: nextFields }
    })
  }

  const updateField = (index, key, value) => {
    setCustomDraft((current) => {
      if (!current || current.builtIn) return current
      const fields = [...(current.controlSchema ?? [])]
      fields[index] = { ...fields[index], [key]: value }
      return { ...current, controlSchema: fields }
    })
  }

  const removeField = (index) => {
    setCustomDraft((current) => {
      if (!current || current.builtIn) return current
      const fields = [...(current.controlSchema ?? [])]
      fields.splice(index, 1)
      return { ...current, controlSchema: fields }
    })
  }

  const applyDraftToSpecimen = () => {
    if (!customDraft) return
    const params = customSpecimenStore.createCustomSpecimenParams(customDraft)
    setSpecimen((current) => ({
      ...current,
      name: `${customDraft.name} Study`,
      kind: 'custom',
      presetId: customDraft.id,
      customSpecimenId: customDraft.id,
      customSpecimenVersion: customDraft.version,
      customSpecimenSnapshot: snapshotDefinition(customDraft),
      params,
    }))
    setSpecimenRevision((current) => current + 1)
    setFrameRequestToken((current) => current + 1)
  }

  const exportDefinitions = async () => {
    const payload = await customSpecimenStore.exportDefinitions()
    const text = JSON.stringify(payload.items ?? [], null, 2)
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      setStatus('exported')
      return
    }
    window.prompt('Copy custom specimen JSON', text)
  }

  const importDefinitions = async () => {
    const raw = window.prompt('Paste custom specimen JSON')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      const payload = Array.isArray(parsed) ? parsed : [parsed]
      await customSpecimenStore.importDefinitions(payload)
      await refreshCatalog()
      const first = payload[0]
      if (first?.id) {
        selectCustomDefinition(first.id)
      }
      setStatus('imported')
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.')
      setStatus('error')
    }
  }

  const load = async () => ({
    presets: presetCatalog.map((preset) => preset.name),
  })

  return {
    specimen,
    debugMode,
    activeTab,
    activeCategories,
    frameRequestToken,
    specimenRevision,
    generated: viewportState.generated,
    generationPending: viewportState.pending,
    generationError: viewportState.error,
    generationRevision: viewportState.revision,
    boneCount: viewportState.generated?.stats?.boneCount ?? viewportState.generated?.treeData?.skeleton.length ?? 0,
    validation,
    status,
    error,
    catalogStatus,
    catalogError,
    presets: presetCatalog,
    customDefinitions,
    customDraft,
    selectedCustomSpecimenId,
    activeCustomDefinition,
    load,
    refreshCatalog,
    loadAsset,
    saveAsset,
    updateParam,
    updateLevel,
    updatePath,
    applyPreset,
    changeKind,
    randomizeSeed,
    requestFrame,
    getLevelSummary,
    setDebugMode,
    setActiveTab,
    toggleCategory,
    selectCustomDefinition,
    createBlankDefinition,
    cloneSelectedDefinition,
    saveCustomDraft,
    deleteSelectedDefinition,
    toggleDefinitionEnabled,
    updateDraftPath,
    addField,
    updateField,
    removeField,
    applyDraftToSpecimen,
    exportDefinitions,
    importDefinitions,
  }
}
