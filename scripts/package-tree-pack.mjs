import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { deserializeGeneratedPayload } from '../src/models/botany/serialization/generatedPayload.js'
import { buildLodScene } from '../src/models/botany/export/buildExportScene.js'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

class SimpleFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.({ target: this })
    }).catch((error) => {
      this.onerror?.(error)
    })
  }
}

if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = SimpleFileReader
}

const parseArgs = () => {
  const args = process.argv.slice(2)
  const inputPath = args[0]
  const outIndex = args.indexOf('--out')
  const outDir = outIndex >= 0 ? args[outIndex + 1] : 'pack-output'
  if (!inputPath) {
    throw new Error('Usage: node scripts/package-tree-pack.mjs <pack.json> --out <output-directory>')
  }
  return { inputPath, outDir }
}

const decodeDataUrl = (dataUrl) => Buffer.from(dataUrl.split(',')[1], 'base64')

const writeBinary = async (filePath, arrayBuffer) => {
  await writeFile(filePath, Buffer.from(arrayBuffer))
}

const exportSceneToGlb = async (scene, filePath) => {
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(scene, { binary: true })
  await writeBinary(filePath, result)
}

const tryBlenderConversion = async (glbPath, fbxPath) => {
  const scriptPath = path.join(__dirname, 'blender', 'convert_glb_to_fbx.py')
  try {
    await execFileAsync('blender', ['-b', '-P', scriptPath, '--', glbPath, fbxPath])
    return { converted: true, message: null }
  } catch (error) {
    return {
      converted: false,
      message: error instanceof Error ? error.message : 'Blender conversion failed.',
    }
  }
}

const main = async () => {
  const { inputPath, outDir } = parseArgs()
  const raw = await readFile(inputPath, 'utf8')
  const packSpec = JSON.parse(raw)
  const outputRoot = path.resolve(outDir, packSpec.pack.name.replace(/\s+/g, '_'))
  await mkdir(outputRoot, { recursive: true })

  const manifest = {
    version: packSpec.version,
    pack: packSpec.pack,
    exportProfile: packSpec.exportProfile,
    generatedAt: new Date().toISOString(),
    trees: [],
  }

  for (const treeEntry of packSpec.trees) {
    const generated = deserializeGeneratedPayload(treeEntry.generated)
    const treeDir = path.join(outputRoot, treeEntry.asset.name.replace(/\s+/g, '_'))
    await mkdir(treeDir, { recursive: true })

    if (treeEntry.impostorAtlas) {
      await writeFile(path.join(treeDir, 'Impostor_AlbedoAlpha.png'), decodeDataUrl(treeEntry.impostorAtlas.albedoAlphaDataUrl))
      await writeFile(path.join(treeDir, 'Impostor_Normal.png'), decodeDataUrl(treeEntry.impostorAtlas.normalDataUrl))
      await writeFile(path.join(treeDir, 'Impostor_MaskDepth.png'), decodeDataUrl(treeEntry.impostorAtlas.maskDepthDataUrl))
    }

    const treeManifest = {
      name: treeEntry.asset.name,
      id: treeEntry.asset.id,
      lods: [],
    }

    for (const lodDescriptor of generated.treeAsset.lods) {
      const scene = buildLodScene({ generated, lodDescriptor })
      const glbPath = path.join(treeDir, `${treeEntry.asset.name.replace(/\s+/g, '_')}_LOD${lodDescriptor.level}.glb`)
      await exportSceneToGlb(scene, glbPath)

      const fbxPath = path.join(treeDir, `${treeEntry.asset.name.replace(/\s+/g, '_')}_LOD${lodDescriptor.level}.fbx`)
      const fbxStatus = await tryBlenderConversion(glbPath, fbxPath)
      treeManifest.lods.push({
        level: lodDescriptor.level,
        representationType: lodDescriptor.representationType,
        glb: path.basename(glbPath),
        fbx: fbxStatus.converted ? path.basename(fbxPath) : null,
        fbxConverted: fbxStatus.converted,
        message: fbxStatus.message,
      })
    }

    await writeFile(path.join(treeDir, 'tree-manifest.json'), JSON.stringify(treeManifest, null, 2))
    manifest.trees.push(treeManifest)
  }

  await writeFile(path.join(outputRoot, 'pack-manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`Packaged tree pack at ${outputRoot}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
