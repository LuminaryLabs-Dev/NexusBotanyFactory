import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { homedir } from 'node:os'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { createInitialParams } from '../src/models/botany/validation/validation.js'
import { generateSpecimen } from '../src/models/botany/services/specimenGenerationService.js'
import { buildFullTreeScene } from '../src/models/botany/export/buildExportScene.js'
import { writeSceneAsAsciiFbx } from '../src/models/botany/export/fbxAsciiExporter.js'

const parseArgs = () => {
  const args = process.argv.slice(2)
  const readValue = (flag, fallback = null) => {
    const index = args.indexOf(flag)
    return index >= 0 ? args[index + 1] : fallback
  }

  return {
    presetName: readValue('--preset', 'Pine'),
    name: readValue('--name', null),
    seed: Number(readValue('--seed', '1')),
    outputDir: readValue('--out', path.join(homedir(), 'Downloads', 'NexusBotanyFactory')),
  }
}

const sanitizeFileName = (value) => value.replace(/[^\w.-]+/g, '_')

const bufferToArrayBuffer = (buffer) => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)

const validateFbxFile = async (filePath) => {
  const loader = new FBXLoader()
  const buffer = await readFile(filePath)
  const group = loader.parse(bufferToArrayBuffer(buffer), path.dirname(filePath))
  let meshCount = 0
  group.traverse((object) => {
    if (object.isMesh) {
      meshCount += 1
    }
  })
  if (meshCount === 0) {
    throw new Error('FBX validation failed: no mesh objects were parsed back from the file.')
  }
  return {
    meshCount,
  }
}

const main = async () => {
  const { presetName, name, seed, outputDir } = parseArgs()
  const specimenName = name ?? `${presetName} Export`
  const specimen = {
    id: null,
    name: specimenName,
    kind: 'tree',
    presetId: `builtin:${presetName.toLowerCase()}`,
    tags: [],
    params: createInitialParams({
      presetName,
      kind: 'tree',
      paramsPatch: { seed },
    }),
  }

  const generated = generateSpecimen(specimen)
  if (!generated?.treeData || !generated?.treeAsset) {
    throw new Error('Specimen generation failed before FBX export.')
  }

  const scene = buildFullTreeScene({ generated })
  await mkdir(outputDir, { recursive: true })
  const filePath = path.join(outputDir, `${sanitizeFileName(specimenName)}.fbx`)
  await writeSceneAsAsciiFbx(scene, filePath, { rootName: specimenName })
  const validation = await validateFbxFile(filePath)

  console.log(JSON.stringify({
    filePath,
    meshCount: validation.meshCount,
    presetName,
    specimenName,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
