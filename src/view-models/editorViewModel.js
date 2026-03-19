import { startTransition, useState } from 'react'
import { clonePresetParams, SPECIES_PRESETS } from '../models/botany/schema/presets.js'
import { createInitialParams, validateParams } from '../models/botany/validation/validation.js'
import { apiClient } from '../lib/api-client.js'
import { useViewportViewModel } from './viewportViewModel.js'

const createInitialSpecimen = () => ({
  id: null,
  name: `${clonePresetParams('Pine').name} Study`,
  kind: 'tree',
  presetId: null,
  tags: [],
  params: clonePresetParams('Pine'),
})

export const useEditorViewModel = () => {
  const [specimen, setSpecimen] = useState(createInitialSpecimen)
  const [debugMode, setDebugMode] = useState('beauty')
  const [activeTab, setActiveTab] = useState('build')
  const [activeCategories, setActiveCategories] = useState(['phenotype', 'form', 'leaders', 'preview'])
  const [specimenRevision, setSpecimenRevision] = useState(0)
  const [frameRequestToken, setFrameRequestToken] = useState(0)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const viewportState = useViewportViewModel(specimen, specimenRevision)
  const generated = viewportState.generated
  const validation = validateParams(specimen.params)

  const updateParam = (key, value) => {
    startTransition(() => {
      setSpecimen((current) => ({
        ...current,
        params: {
          ...current.params,
          [key]: value,
        },
      }))
    })
  }

  const updateLevel = (depth, key, value) => {
    startTransition(() => {
      setSpecimen((current) => {
        const levels = [...current.params.levels]
        levels[depth] = { ...levels[depth], [key]: value }
        return { ...current, params: { ...current.params, levels } }
      })
    })
  }

  const applyPreset = (name) => {
    const preset = createInitialParams({
      presetName: name,
      kind: specimen.kind,
      paramsPatch: {},
    })
    setSpecimen((current) => ({
      ...current,
      name: `${name} Study`,
      kind: current.kind,
      params: preset,
    }))
    setSpecimenRevision((current) => current + 1)
    setFrameRequestToken((current) => current + 1)
  }

  const changeKind = (kind) => setSpecimen((current) => ({ ...current, kind }))
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
      const payload = specimen.id
        ? await apiClient.updateAsset(specimen.id, { name: specimen.name, kind: specimen.kind, tags: specimen.tags, params: specimen.params })
        : await apiClient.createAsset({ name: specimen.name, kind: specimen.kind, tags: specimen.tags, params: specimen.params, presetName: specimen.params.name })
      setSpecimen((current) => ({ ...current, ...payload }))
      setStatus('saved')
    } catch (err) {
      setError(err.message)
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

  const load = async () => ({
    presets: Object.keys(SPECIES_PRESETS),
  })

  return {
    specimen,
    debugMode,
    activeTab,
    activeCategories,
    frameRequestToken,
    specimenRevision,
    generated,
    generationPending: viewportState.pending,
    generationError: viewportState.error,
    generationRevision: viewportState.revision,
    boneCount: generated?.stats?.boneCount ?? generated?.treeData?.skeleton.length ?? 0,
    validation,
    status,
    error,
    load,
    loadAsset,
    saveAsset,
    updateParam,
    updateLevel,
    applyPreset,
    changeKind,
    randomizeSeed,
    requestFrame,
    getLevelSummary,
    setDebugMode,
    setActiveTab,
    toggleCategory,
  }
}
