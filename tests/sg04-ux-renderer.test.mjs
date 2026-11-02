import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getNativeInspectorSpecs } from '../src/models/botany/schema/speciesContracts.js'
import { EDITOR_TRAIT_GROUPS, getFieldsForTraitGroup } from '../src/models/botany/ui/nativeTraitGroups.js'

const src = path => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8')
const species = ['Pine','Oak','Willow','Birch','Cypress']

test('all five species expose a focused inspector and authentic signature fields', () => {
  for (const name of species) {
    const specs = getNativeInspectorSpecs(name)
    assert.ok(getFieldsForTraitGroup(specs,'character').length >= 4, name)
    for (const group of Object.keys(EDITOR_TRAIT_GROUPS)) {
      const matched = getFieldsForTraitGroup(specs,group)
      assert.ok(matched.length > 0, `${name}:${group}`)
      for (const field of matched) {
        assert.ok(field.path.startsWith('params.'), field.path)
        assert.ok(field.min < field.max, field.path)
      }
    }
  }
})

test('pine starts with a full factory preview, growth timeline is opt-in', () => {
  const vm=src('view-models/pineSimulationViewModel.js')
  const screen=src('views/editor/EditorScreen.jsx')
  assert.match(vm,/useState\(false\)/)
  assert.match(vm,/!growthEnabled \|\| deferredInput\.params\?\.name !== 'Pine'/)
  assert.match(vm,/generateSpecimen\(deferredInput\)/)
  assert.match(vm,/setGrowthEnabled: \(enabled\)/)
  assert.match(screen,/editor\.growthPreviewEnabled && <div/)
  assert.match(screen,/Study growth over time/)
  assert.match(screen,/Return to tree editor/)
})

test('lighting UI and production renderer use ACES, true shadow settings, and bark relief', () => {
  const viewport=src('views/viewport/BotanyViewport.jsx')
  const screen=src('views/editor/EditorScreen.jsx')
  const material=src('models/botany/rendering/materialRecipes.js')
  assert.match(screen,/Lighting preset/)
  for (const name of ['studio','sunny','overcast']) assert.match(viewport,new RegExp(`${name}: \\{`))
  assert.match(viewport,/ACESFilmicToneMapping/)
  assert.match(viewport,/SRGBColorSpace/)
  assert.match(viewport,/shadow\.normalBias/)
  assert.match(viewport,/setColorAt\(index, leafTint\)/)
  assert.match(material,/bumpMap: getBarkBumpTexture\(\)/)
  assert.match(material,/MeshPhysicalMaterial/)
})
