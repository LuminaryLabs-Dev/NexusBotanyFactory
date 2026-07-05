import { generateSpecimen } from '../services/specimenGenerationService.js'
import { serializeGeneratedPayload } from '../serialization/generatedPayload.js'
import { getExportProfile } from './exportProfiles.js'
import { bakeImpostorAtlas } from '../impostors/bakeImpostorAtlas.js'

export const validatePackDefinition = (packDefinition, assets = []) => {
  const issues = []

  if (!packDefinition?.name?.trim()) {
    issues.push('Pack name is required.')
  }
  if ((packDefinition?.treeAssetIds?.length ?? 0) !== 10) {
    issues.push('Pack must contain exactly 10 trees.')
  }

  const duplicates = new Set()
  const seen = new Set()
  ;(packDefinition?.treeAssetIds ?? []).forEach((assetId) => {
    if (seen.has(assetId)) duplicates.add(assetId)
    seen.add(assetId)
  })
  if (duplicates.size > 0) {
    issues.push('Pack cannot contain duplicate tree entries.')
  }

  ;(packDefinition?.treeAssetIds ?? []).forEach((assetId) => {
    const asset = assets.find((entry) => entry.id === assetId)
    if (!asset) {
      issues.push(`Missing asset: ${assetId}`)
      return
    }

    const generated = generateSpecimen(asset)
    if ((generated.treeAsset?.lods?.length ?? 0) !== 4) {
      issues.push(`Asset ${asset.name} does not have a complete LOD chain.`)
    }
  })

  return {
    ready: issues.length === 0,
    issues,
  }
}

const triggerJsonDownload = (filename, payload) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const createPackExportSpec = ({ packDefinition, assets }) => {
  const exportProfile = getExportProfile(packDefinition.exportProfile?.id)
  const trees = packDefinition.treeAssetIds.map((assetId) => {
    const asset = assets.find((entry) => entry.id === assetId)
    if (!asset) {
      throw new Error(`Missing asset ${assetId} while building export spec.`)
    }

    const generated = generateSpecimen(asset)
    const impostorDescriptor = generated.treeAsset?.lods?.find((lod) => lod.level === 3)?.impostor ?? null
    const atlas = impostorDescriptor ? bakeImpostorAtlas(generated, impostorDescriptor, generated.treeAsset?.materials) : null

    return {
      asset: {
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        presetId: asset.presetId ?? null,
      },
      generated: serializeGeneratedPayload(generated),
      impostorAtlas: atlas
        ? {
            albedoAlphaDataUrl: atlas.albedoAlphaDataUrl,
            normalDataUrl: atlas.normalDataUrl,
            maskDepthDataUrl: atlas.maskDepthDataUrl,
            frameLayout: atlas.frameLayout ?? impostorDescriptor?.frameLayout ?? null,
            frameMapping: atlas.frameMapping ?? impostorDescriptor?.frameMapping ?? null,
            billboardSize: impostorDescriptor?.billboardSize ?? null,
            pivotOffset: impostorDescriptor?.pivotOffset ?? null,
          }
        : null,
    }
  })

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    exportProfile,
    pack: {
      id: packDefinition.id,
      name: packDefinition.name,
      treeAssetIds: [...packDefinition.treeAssetIds],
      validation: validatePackDefinition(packDefinition, assets),
    },
    trees,
  }
}

export const exportPackSpecToFile = ({ packDefinition, assets }) => {
  const spec = createPackExportSpec({ packDefinition, assets })
  const filename = `${packDefinition.name.replace(/\s+/g, '_') || 'TreePack'}.pack.json`
  triggerJsonDownload(filename, spec)
  return spec
}
