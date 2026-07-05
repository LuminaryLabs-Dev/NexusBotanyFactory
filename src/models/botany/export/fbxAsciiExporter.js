import { writeFile } from 'node:fs/promises'
import { sceneToAsciiFbx } from './fbxSceneSerializer.js'

export { sceneToAsciiFbx } from './fbxSceneSerializer.js'

export const writeSceneAsAsciiFbx = async (scene, outputPath, options) => {
  const content = sceneToAsciiFbx(scene, options)
  await writeFile(outputPath, content, 'utf8')
}
