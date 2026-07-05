import { createSchemaDocument } from '../../models/botany/schema/schema.js'
import { SPECIES_PRESETS, clonePresetParams } from '../../models/botany/schema/presets.js'

const presetEntries = Object.entries(SPECIES_PRESETS)

const toPresetDocument = ([name]) => ({
  id: `builtin:${name.toLowerCase()}`,
  name,
  kind: 'tree',
  source: 'built-in',
  params: clonePresetParams(name),
  createdAt: null,
  updatedAt: null,
})

export const presetStore = {
  async list() {
    return { items: presetEntries.map(toPresetDocument) }
  },

  async getByName(name) {
    const match = presetEntries.find(([presetName]) => presetName.toLowerCase() === String(name).toLowerCase())
    return match ? toPresetDocument(match) : null
  },

  async getSchema() {
    return createSchemaDocument()
  },

  async getCapabilities() {
    return {
      persistence: {
        database: 'browser-storage',
        path: 'localStorage',
      },
      implemented: {
        assets: true,
        presets: true,
        camera: true,
        treeData: true,
        stats: true,
        validation: true,
        preview: {
          lods: true,
          impostors: true,
        },
        export: {
          intermediatePackSpec: true,
          companionPackager: true,
          finalFbx: false,
        },
        customSpecimens: true,
      },
      assetKinds: ['tree', 'shrub', 'bush', 'custom'],
    }
  },
}
