import { createInitialParams, normalizePresetName } from '../models/botany/validation/validation.js'
import { generateSpecimen } from '../models/botany/services/specimenGenerationService.js'
import { presetStore } from './browser/presetStore.js'
import { assetStore } from './browser/assetStore.js'

export const apiClient = {
  getSchema: () => presetStore.getSchema(),
  getCapabilities: () => presetStore.getCapabilities(),
  listPresets: () => presetStore.list(),
  listAssets: () => assetStore.list(),
  createAsset: async (body) => {
    const preset = await presetStore.getByName(normalizePresetName(body.presetName))
    const params = createInitialParams({
      presetName: body.presetName,
      kind: body.kind,
      paramsPatch: body.params,
    })
    return assetStore.create({
      name: body.name,
      kind: body.kind,
      tags: body.tags,
      presetId: preset?.id ?? null,
      params,
    })
  },
  updateAsset: (assetId, body) => assetStore.update(assetId, body),
  getAsset: (assetId) => assetStore.get(assetId),
  duplicateAsset: (assetId, name) => assetStore.duplicate(assetId, name),
  getAssetTreeData: async (assetId) => {
    const asset = await assetStore.get(assetId)
    const generated = generateSpecimen(asset)
    return {
      asset,
      stats: generated.stats,
      treeData: generated.treeData,
    }
  },
}
