import { createSchemaDocument } from '../../models/botany/schema/schema.js'
import { getDatabasePath } from '../db/sqlite.js'
import { json } from './responses.js'

export const getSchemaHandler = async () => json(createSchemaDocument())

export const getCapabilitiesHandler = async () => json({
  runtime: 'server',
  persistence: {
    database: 'sqlite',
    path: getDatabasePath(),
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
})

export const getHealthHandler = async () => json({
  ok: true,
  service: 'nexus-botany-api',
})
