import { buildFullTreeScene } from './buildExportScene.js'
import { sceneToAsciiFbx } from './fbxSceneSerializer.js'

const sanitizeFileName = (value, fallback = 'NexusBotanyFactory_Tree') =>
  String(value || fallback).replace(/[^\w.-]+/g, '_')

export const createGeneratedFbxFile = ({ generated, name }) => {
  if (!generated?.treeData) {
    throw new Error('No generated tree is available for FBX export.')
  }

  const scene = buildFullTreeScene({ generated })
  const rootName = sanitizeFileName(name ?? generated?.specimen?.name ?? generated?.treeAsset?.name)
  const content = sceneToAsciiFbx(scene, { rootName })

  return {
    fileName: `${rootName}.fbx`,
    content,
  }
}

export const downloadGeneratedAsFbx = async ({ generated, name }) => {
  if (typeof document === 'undefined') {
    throw new Error('FBX export is only available in a browser context.')
  }

  const { fileName, content } = createGeneratedFbxFile({ generated, name })
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)

  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return {
    fileName,
    downloadPath: `~/Downloads/${fileName}`,
  }
}
