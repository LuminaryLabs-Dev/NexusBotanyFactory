import { useEffect, useMemo, useState } from 'react'
import { createPackExportSpec, exportPackSpecToFile, validatePackDefinition } from '../models/botany/export/createPackExportSpec.js'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { createBlankPackDefinition, packStore } from '../lib/browser/packStore.js'

export const usePacksViewModel = (assets = []) => {
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [draftPack, setDraftPack] = useState(createBlankPackDefinition)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const reload = async () => {
    setLoading(true)
    const payload = await packStore.list()
    setPacks(payload.items)
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void reload()
    }, 0)

    return () => clearTimeout(timer)
  }, [])

  const validation = useMemo(
    () => validatePackDefinition(draftPack, assets),
    [assets, draftPack],
  )

  const setDraftName = (name) => {
    setDraftPack((current) => ({ ...current, name }))
  }

  const addAsset = (assetId) => {
    setDraftPack((current) => {
      if (current.treeAssetIds.includes(assetId) || current.treeAssetIds.length >= 10) {
        return current
      }
      return {
        ...current,
        treeAssetIds: [...current.treeAssetIds, assetId],
      }
    })
  }

  const removeAsset = (assetId) => {
    setDraftPack((current) => ({
      ...current,
      treeAssetIds: current.treeAssetIds.filter((entry) => entry !== assetId),
    }))
  }

  const loadPack = (packId) => {
    const pack = packs.find((entry) => entry.id === packId)
    if (!pack) return
    setDraftPack(structuredClone(pack))
  }

  const resetDraft = () => {
    setDraftPack(createBlankPackDefinition())
  }

  const saveDraft = async () => {
    setStatus('saving')
    setError(null)
    const nextDraft = {
      ...draftPack,
      validation,
      status: validation.ready ? 'ready' : 'draft',
    }
    try {
      if (packs.some((entry) => entry.id === draftPack.id)) {
        await packStore.update(draftPack.id, nextDraft)
      } else {
        await packStore.create(nextDraft)
      }
      await reload()
      setDraftPack(nextDraft)
      setStatus('saved')
    } catch (saveError) {
      setStatus('error')
      setError(saveError instanceof Error ? saveError.message : 'Failed to save pack.')
    }
  }

  const deletePack = async (packId) => {
    await packStore.delete(packId)
    await reload()
    if (draftPack.id === packId) {
      resetDraft()
    }
  }

  const exportDraft = async () => {
    setStatus('exporting')
    setError(null)
    try {
      const spec = exportPackSpecToFile({ packDefinition: draftPack, assets })
      setStatus('exported')
      return spec
    } catch (exportError) {
      setStatus('error')
      setError(exportError instanceof Error ? exportError.message : 'Failed to export pack.')
      return null
    }
  }

  const previewSpec = () => {
    try {
      return createPackExportSpec({ packDefinition: draftPack, assets })
    } catch {
      return null
    }
  }

  const selectedAssets = draftPack.treeAssetIds
    .map((assetId) => assets.find((asset) => asset.id === assetId))
    .filter(Boolean)

  const selectedAssetSummaries = useMemo(
    () => selectedAssets.map((asset) => {
      const generated = generateSpecimen(asset)
      return {
        asset,
        lods: generated.treeAsset?.lods ?? [],
      }
    }),
    [selectedAssets],
  )

  return {
    packs,
    loading,
    draftPack,
    status,
    error,
    validation,
    selectedAssets,
    selectedAssetSummaries,
    setDraftName,
    addAsset,
    removeAsset,
    loadPack,
    resetDraft,
    saveDraft,
    deletePack,
    exportDraft,
    previewSpec,
    reload,
  }
}
