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
  const [debugMode, setDebugMode] = useState('shaded')
  const [activeTab, setActiveTab] = useState('inspector')
  const [activeCategories, setActiveCategories] = useState(['global', 'lvl-0', 'cam', 'foliage'])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const generated = useViewportViewModel(specimen)
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
  }

  const changeKind = (kind) => setSpecimen((current) => ({ ...current, kind }))
  const randomizeSeed = () => updateParam('seed', Math.floor(Math.random() * 2147483647))
  const toggleCategory = (id) => setActiveCategories((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])

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
    generated,
    boneCount: generated.stats?.boneCount ?? generated.treeData?.skeleton.length ?? 0,
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
    setDebugMode,
    setActiveTab,
    toggleCategory,
  }
}
